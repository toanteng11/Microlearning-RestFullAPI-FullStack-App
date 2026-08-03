import { Types } from 'mongoose';

import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AssignmentRepository } from '../assignments/assignment.repository.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import type { ReportingInvalidationWriter } from '../learning-content/reporting-invalidation.writer.js';
import type { LearningProgressRepository } from '../learning-progress/learning-progress.repository.js';
import type { DeadlineExceptionRepository } from '../deadline-exceptions/deadline-exception.repository.js';
import { resolveEffectiveDeadline } from '../deadline-exceptions/effective-deadline.resolver.js';
import type { GradeRepository } from '../grades/grade.repository.js';
import { toTeacherGradeDto } from '../grades/grade.dto.js';
import { UserModel } from '../users/user.model.js';
import { toStudentOwnSubmissionDto, toTeacherSubmissionDto } from './submission.dto.js';
import type { SubmissionRecord } from './submission.model.js';
import type { SubmissionRepository } from './submission.repository.js';
import type {
  AssignmentRosterQueryInput,
  ResubmitSubmissionInput,
  SaveSubmissionDraftInput,
  SubmissionHistoryQueryInput,
  SubmissionTransitionInput,
} from './submission.schemas.js';
import {
  assertAssignmentAcceptsSubmission,
  assertSubmissionContent,
  isLateSubmission,
} from './submission.policy.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertStudent(actor: AuthenticatedUser): void {
  if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function paginationMeta(page: number, limit: number, totalItems: number) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalPages > 0,
  };
}

export class SubmissionService {
  constructor(
    private readonly assignments: AssignmentRepository,
    private readonly submissions: SubmissionRepository,
    private readonly enrollments: EnrollmentRepository,
    private readonly progress: LearningProgressRepository,
    private readonly grades: GradeRepository,
    private readonly deadlineExceptions: DeadlineExceptionRepository,
    private readonly scopes: CourseScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly features: AssessmentFeatureFlagConfig,
    private readonly reportingInvalidationWriter: ReportingInvalidationWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async effectiveDeadline(
    studentId: Types.ObjectId,
    assignment: NonNullable<Awaited<ReturnType<AssignmentRepository['findById']>>>,
  ) {
    return resolveEffectiveDeadline(
      assignment.dueDate,
      await this.deadlineExceptions.findCurrent(studentId, 'ASSIGNMENT', assignment._id),
    );
  }

  private async requireStudentAssignment(actor: AuthenticatedUser, assignmentId: string) {
    assertStudent(actor);
    const assignment = await this.assignments.findById(objectId(assignmentId, 'Assignment'));
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    await this.scopes.requireStudentView(actor.id, assignment.courseId.toString());
    return assignment;
  }

  private async requireOwnSubmission(actor: AuthenticatedUser, submissionId: string) {
    assertStudent(actor);
    const submission = await this.submissions.findById(objectId(submissionId, 'Submission'));
    if (!submission || submission.studentId.toString() !== actor.id)
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Submission was not found');
    const assignment = await this.assignments.findById(submission.assignmentId);
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    await this.scopes.requireStudentView(actor.id, assignment.courseId.toString());
    return { submission, assignment };
  }

  async getOwnByAssignment(actor: AuthenticatedUser, assignmentId: string) {
    const assignment = await this.requireStudentAssignment(actor, assignmentId);
    const submission = await this.submissions.findByIdentity(
      assignment._id,
      objectId(actor.id, 'Student'),
    );
    return submission ? toStudentOwnSubmissionDto(submission) : null;
  }

  async saveDraft(
    actor: AuthenticatedUser,
    assignmentId: string,
    input: SaveSubmissionDraftInput,
    requestId: string,
  ) {
    const assignment = await this.requireStudentAssignment(actor, assignmentId);
    const savedAt = this.now();
    assertAssignmentAcceptsSubmission(assignment, savedAt);
    const deadline = await this.effectiveDeadline(objectId(actor.id, 'Student'), assignment);
    const content = {
      submissionType: input.submissionType,
      textAnswer: input.textAnswer,
      links: [...input.links],
      markDone: input.markDone,
    };
    assertSubmissionContent(assignment, content, this.features, false);
    const studentId = objectId(actor.id, 'Student');

    return withMongoTransaction(async (session) => {
      const current = await this.submissions.findByIdentity(assignment._id, studentId, session);
      let submission: SubmissionRecord;
      if (!current) {
        if (input.expectedSubmissionRevision !== 0)
          throw new AppError(
            409,
            'CONCURRENT_MODIFICATION',
            'Submission does not exist at expected revision',
          );
        submission = await this.submissions.create(
          {
            assignmentId: assignment._id,
            studentId,
            classroomId: assignment.classroomId,
            courseId: assignment.courseId,
            ...content,
          },
          session,
        );
      } else {
        if (input.expectedSubmissionRevision === 0)
          throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Submission already exists');
        const updated = await this.submissions.saveDraftCas(
          current._id,
          input.expectedSubmissionRevision,
          content,
          session,
        );
        if (!updated)
          throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Submission was modified elsewhere');
        submission = updated;
      }
      await this.submissions.appendRevision(
        {
          submissionId: submission._id,
          assignmentId: assignment._id,
          studentId,
          revision: submission.revision,
          eventType: 'DRAFT_SAVED',
          status: submission.status,
          submissionType: submission.submissionType,
          textAnswer: submission.textAnswer,
          links: submission.links,
          markDone: submission.markDone,
          submittedAt: submission.submittedAt,
          isLate: submission.isLate,
          effectiveDeadline: deadline.effectiveDeadline,
          actorId: studentId,
          actorRole: actor.role,
          reason: null,
          requestId,
        },
        session,
      );
      await this.progress.start(
        {
          studentId,
          classroomId: assignment.classroomId,
          courseId: assignment.courseId,
          activityType: 'ASSIGNMENT',
          activityId: assignment._id,
          startedAt: submission.createdAt,
          lastActiveAt: savedAt,
        },
        session,
      );
      await this.audits.append(
        {
          actorId: studentId,
          actorRole: actor.role,
          action: 'SUBMISSION_SAVED',
          resourceId: submission._id.toString(),
          requestId,
          newValue: {
            status: submission.status,
            revision: submission.revision,
            submissionType: submission.submissionType,
          },
          metadata: {
            classroomId: assignment.classroomId.toString(),
            courseId: assignment.courseId.toString(),
            assignmentId,
            studentId: actor.id,
            submissionRevision: submission.revision,
          },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: assignment.classroomId,
          courseId: assignment.courseId,
          studentId,
          reasons: ['PROGRESS_CHANGED'],
          sourceChangedAt: savedAt,
        },
        session,
      );
      return toStudentOwnSubmissionDto(submission);
    });
  }

  async turnIn(
    actor: AuthenticatedUser,
    submissionId: string,
    input: SubmissionTransitionInput,
    requestId: string,
  ) {
    const { submission, assignment } = await this.requireOwnSubmission(actor, submissionId);
    if (submission.status === 'SUBMITTED' || submission.status === 'LATE')
      return { submission: toStudentOwnSubmissionDto(submission), idempotentReplay: true };
    const submittedAt = this.now();
    const deadline = await this.effectiveDeadline(submission.studentId, assignment);
    assertAssignmentAcceptsSubmission(assignment, submittedAt);
    if (!submission.submissionType)
      throw new AppError(422, 'SUBMISSION_INCOMPLETE', 'Submission has no method');
    assertSubmissionContent(
      assignment,
      {
        submissionType: submission.submissionType,
        textAnswer: submission.textAnswer,
        links: submission.links,
        markDone: submission.markDone,
      },
      this.features,
      true,
    );
    const late = isLateSubmission(deadline.effectiveDeadline, submittedAt);
    if (late && !assignment.allowLateSubmission)
      throw new AppError(409, 'LATE_SUBMISSION_NOT_ALLOWED', 'Late submission is not allowed');

    const result = await withMongoTransaction(async (session) => {
      const updated = await this.submissions.transitionCas(
        submission._id,
        input.expectedSubmissionRevision,
        ['DRAFT'],
        {
          status: late ? 'LATE' : 'SUBMITTED',
          submittedRevision: input.expectedSubmissionRevision + 1,
          submittedAt,
          isLate: late,
          effectiveDeadlineAtSubmit: deadline.effectiveDeadline,
        },
        session,
      );
      if (!updated)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Submission was modified elsewhere');
      await this.appendTransitionRevision(
        updated,
        deadline.effectiveDeadline,
        'TURNED_IN',
        actor,
        requestId,
        null,
        session,
      );
      await this.progress.complete(
        {
          studentId: updated.studentId,
          classroomId: updated.classroomId,
          courseId: updated.courseId,
          activityType: 'ASSIGNMENT',
          activityId: updated.assignmentId,
          startedAt: updated.createdAt,
          lastActiveAt: submittedAt,
          completedAt: submittedAt,
        },
        session,
      );
      await this.writeTransitionAudit(
        updated,
        assignment,
        actor,
        requestId,
        'SUBMISSION_TURNED_IN',
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: updated.classroomId,
          courseId: updated.courseId,
          studentId: updated.studentId,
          reasons: ['PROGRESS_CHANGED', 'ASSESSMENT_CHANGED'],
          sourceChangedAt: submittedAt,
        },
        session,
      );
      return updated;
    });
    return { submission: toStudentOwnSubmissionDto(result), idempotentReplay: false };
  }

  private appendTransitionRevision(
    submission: SubmissionRecord,
    effectiveDeadline: Date,
    eventType: 'TURNED_IN' | 'UNSUBMITTED' | 'RESUBMITTED',
    actor: AuthenticatedUser,
    requestId: string,
    reason: string | null,
    session: Parameters<SubmissionRepository['appendRevision']>[1],
  ) {
    return this.submissions.appendRevision(
      {
        submissionId: submission._id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        revision: submission.revision,
        eventType,
        status: submission.status,
        submissionType: submission.submissionType,
        textAnswer: submission.textAnswer,
        links: submission.links,
        markDone: submission.markDone,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
        effectiveDeadline,
        actorId: objectId(actor.id, 'User'),
        actorRole: actor.role,
        reason,
        requestId,
      },
      session,
    );
  }

  private writeTransitionAudit(
    submission: SubmissionRecord,
    assignment: Awaited<ReturnType<AssignmentRepository['findById']>> & {},
    actor: AuthenticatedUser,
    requestId: string,
    action: 'SUBMISSION_TURNED_IN' | 'SUBMISSION_UNSUBMITTED' | 'SUBMISSION_RESUBMITTED',
    session: Parameters<PhaseFiveAuditWriter['append']>[1],
  ) {
    return this.audits.append(
      {
        actorId: objectId(actor.id, 'User'),
        actorRole: actor.role,
        action,
        resourceId: submission._id.toString(),
        requestId,
        newValue: {
          status: submission.status,
          revision: submission.revision,
          submissionType: submission.submissionType,
          isLate: submission.isLate,
        },
        metadata: {
          classroomId: submission.classroomId.toString(),
          courseId: submission.courseId.toString(),
          assignmentId: assignment._id.toString(),
          studentId: submission.studentId.toString(),
          submissionRevision: submission.revision,
        },
      },
      session,
    );
  }

  async unsubmit(
    actor: AuthenticatedUser,
    submissionId: string,
    input: SubmissionTransitionInput,
    requestId: string,
  ) {
    const { submission, assignment } = await this.requireOwnSubmission(actor, submissionId);
    const now = this.now();
    const deadline = await this.effectiveDeadline(submission.studentId, assignment);
    assertAssignmentAcceptsSubmission(assignment, now);
    if (!assignment.allowUnsubmit || now > deadline.effectiveDeadline)
      throw new AppError(409, 'UNSUBMIT_NOT_ALLOWED', 'Unsubmit is not allowed');
    const updated = await withMongoTransaction(async (session) => {
      const result = await this.submissions.transitionCas(
        submission._id,
        input.expectedSubmissionRevision,
        ['SUBMITTED', 'LATE'],
        { status: 'DRAFT', submittedAt: null, isLate: false, effectiveDeadlineAtSubmit: null },
        session,
      );
      if (!result)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Submission was modified elsewhere');
      await this.appendTransitionRevision(
        result,
        deadline.effectiveDeadline,
        'UNSUBMITTED',
        actor,
        requestId,
        null,
        session,
      );
      await this.progress.reverseCompletion(
        {
          studentId: result.studentId,
          classroomId: result.classroomId,
          courseId: result.courseId,
          activityType: 'ASSIGNMENT',
          activityId: result.assignmentId,
          startedAt: result.createdAt,
          lastActiveAt: now,
        },
        session,
      );
      await this.writeTransitionAudit(
        result,
        assignment,
        actor,
        requestId,
        'SUBMISSION_UNSUBMITTED',
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: result.classroomId,
          courseId: result.courseId,
          studentId: result.studentId,
          reasons: ['PROGRESS_CHANGED', 'ASSESSMENT_CHANGED'],
          sourceChangedAt: now,
        },
        session,
      );
      return result;
    });
    return toStudentOwnSubmissionDto(updated);
  }

  async resubmit(
    actor: AuthenticatedUser,
    submissionId: string,
    input: ResubmitSubmissionInput,
    requestId: string,
  ) {
    const { submission, assignment } = await this.requireOwnSubmission(actor, submissionId);
    const now = this.now();
    const deadline = await this.effectiveDeadline(submission.studentId, assignment);
    assertAssignmentAcceptsSubmission(assignment, now);
    if (
      !assignment.allowResubmit ||
      submission.status === 'GRADED' ||
      submission.status === 'RETURNED'
    )
      throw new AppError(409, 'RESUBMIT_NOT_ALLOWED', 'Resubmission is not allowed');
    const updated = await withMongoTransaction(async (session) => {
      const result = await this.submissions.transitionCas(
        submission._id,
        input.expectedSubmissionRevision,
        ['SUBMITTED', 'LATE'],
        { status: 'DRAFT', submittedAt: null, isLate: false, effectiveDeadlineAtSubmit: null },
        session,
      );
      if (!result)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Submission was modified elsewhere');
      await this.appendTransitionRevision(
        result,
        deadline.effectiveDeadline,
        'RESUBMITTED',
        actor,
        requestId,
        input.reason,
        session,
      );
      await this.progress.reverseCompletion(
        {
          studentId: result.studentId,
          classroomId: result.classroomId,
          courseId: result.courseId,
          activityType: 'ASSIGNMENT',
          activityId: result.assignmentId,
          startedAt: result.createdAt,
          lastActiveAt: now,
        },
        session,
      );
      await this.writeTransitionAudit(
        result,
        assignment,
        actor,
        requestId,
        'SUBMISSION_RESUBMITTED',
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: result.classroomId,
          courseId: result.courseId,
          studentId: result.studentId,
          reasons: ['PROGRESS_CHANGED', 'ASSESSMENT_CHANGED'],
          sourceChangedAt: now,
        },
        session,
      );
      return result;
    });
    return toStudentOwnSubmissionDto(updated);
  }

  async history(
    actor: AuthenticatedUser,
    submissionId: string,
    query: SubmissionHistoryQueryInput,
  ) {
    const { submission } = await this.requireOwnSubmission(actor, submissionId);
    const result = await this.submissions.listHistory(submission._id, query.page, query.limit);
    return {
      data: {
        items: result.items.map((item) => ({
          id: item._id.toString(),
          revision: item.revision,
          eventType: item.eventType,
          status: item.status,
          submissionType: item.submissionType,
          textAnswer: item.textAnswer,
          links: item.links,
          markDone: item.markDone,
          submittedAt: item.submittedAt?.toISOString() ?? null,
          isLate: item.isLate,
          reason: item.reason,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  async listTeacherRoster(
    actor: AuthenticatedUser,
    assignmentId: string,
    query: AssignmentRosterQueryInput,
  ) {
    assertTeacher(actor);
    const assignment = await this.assignments.findById(objectId(assignmentId, 'Assignment'));
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    await this.scopes.requireTeacherManage(actor.id, assignment.courseId.toString());
    const [enrollments, submissions, grades, deadlineExceptions] = await Promise.all([
      this.enrollments.listActiveByClassroom(assignment.classroomId),
      this.submissions.listByAssignment(assignment._id),
      this.grades.listByActivity('ASSIGNMENT', assignment._id),
      this.deadlineExceptions.listActiveByCourse(assignment.courseId),
    ]);
    const users = await UserModel.find({
      _id: { $in: enrollments.map((enrollment) => enrollment.studentId) },
      status: 'ACTIVE',
    })
      .select({ fullName: 1, email: 1, studentCode: 1 })
      .lean<
        Array<{ _id: Types.ObjectId; fullName: string; email: string; studentCode?: string | null }>
      >()
      .exec();
    const userById = new Map(users.map((user) => [user._id.toString(), user]));
    const submissionByStudent = new Map(
      submissions.map((submission) => [submission.studentId.toString(), submission]),
    );
    const now = this.now();
    const rows = enrollments.flatMap((enrollment) => {
      const student = userById.get(enrollment.studentId.toString());
      if (!student) return [];
      const submission = submissionByStudent.get(student._id.toString()) ?? null;
      const deadline = resolveEffectiveDeadline(
        assignment.dueDate,
        deadlineExceptions.find(
          (item) =>
            item.activityType === 'ASSIGNMENT' &&
            item.activityId.equals(assignment._id) &&
            item.studentId.equals(student._id),
        ),
      );
      const status = this.derivedStatus(submission, deadline.effectiveDeadline, now);
      return [
        {
          student: {
            id: student._id.toString(),
            fullName: student.fullName,
            email: student.email,
            studentCode: student.studentCode ?? null,
          },
          status,
          submission: submission ? toTeacherSubmissionDto(submission) : null,
          grade:
            grades.filter((item) => item.studentId.equals(student._id)).map(toTeacherGradeDto)[0] ??
            null,
          defaultDeadline: deadline.defaultDeadline.toISOString(),
          effectiveDeadline: deadline.effectiveDeadline.toISOString(),
          hasDeadlineException: deadline.source === 'STUDENT_EXCEPTION',
        },
      ];
    });
    const keyword = query.keyword?.toLocaleLowerCase('vi-VN');
    const filtered = rows
      .filter((row) => !query.status || row.status === query.status)
      .filter(
        (row) =>
          !keyword ||
          [row.student.fullName, row.student.email, row.student.studentCode ?? ''].some((value) =>
            value.toLocaleLowerCase('vi-VN').includes(keyword),
          ),
      )
      .sort((left, right) => left.student.fullName.localeCompare(right.student.fullName, 'vi'));
    const start = (query.page - 1) * query.limit;
    return {
      data: { items: filtered.slice(start, start + query.limit) },
      meta: paginationMeta(query.page, query.limit, filtered.length),
      summary: {
        totalStudents: rows.length,
        submitted: rows.filter((row) =>
          ['SUBMITTED', 'LATE', 'GRADED', 'RETURNED'].includes(row.status),
        ).length,
        missing: rows.filter((row) => row.status === 'MISSING').length,
      },
    };
  }

  private derivedStatus(submission: SubmissionRecord | null, dueDate: Date, now: Date) {
    if (!submission) return now > dueDate ? 'MISSING' : 'ASSIGNED';
    if (submission.status === 'DRAFT') return now > dueDate ? 'MISSING' : 'IN_PROGRESS';
    if (submission.status === 'SUBMITTED' || submission.status === 'LATE')
      return submission.submittedAt && submission.submittedAt > dueDate ? 'LATE' : 'SUBMITTED';
    return submission.status;
  }

  async getTeacherSubmission(actor: AuthenticatedUser, submissionId: string) {
    assertTeacher(actor);
    const submission = await this.submissions.findById(objectId(submissionId, 'Submission'));
    if (!submission) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Submission was not found');
    await this.scopes.requireTeacherManage(actor.id, submission.courseId.toString());
    const grade = await this.grades.findByIdentity(
      submission.studentId,
      'ASSIGNMENT',
      submission.assignmentId,
    );
    return {
      ...toTeacherSubmissionDto(submission),
      grade: grade ? toTeacherGradeDto(grade) : null,
    };
  }
}
