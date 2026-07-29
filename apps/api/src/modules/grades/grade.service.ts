import { Types } from 'mongoose';

import type { AssessmentFeatureFlagConfig } from '../../shared/config/environment.js';
import { withMongoTransaction } from '../../shared/database/unit-of-work.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AssignmentRepository } from '../assignments/assignment.repository.js';
import type { PhaseFiveAuditWriter } from '../audit/phase-five-audit.writer.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { AssessmentScopeReader } from '../learning-content/assessment-scope.reader.js';
import type { ReportingInvalidationWriter } from '../learning-content/reporting-invalidation.writer.js';
import { QuizModel } from '../quizzes/quiz.model.js';
import type { SubmissionRepository } from '../submissions/submission.repository.js';
import { UserModel } from '../users/user.model.js';
import { toStudentReturnedGradeDto, toTeacherGradeDto } from './grade.dto.js';
import type { GradeRecord } from './grade.model.js';
import type { GradeRepository } from './grade.repository.js';
import type {
  GradeHistoryQueryInput,
  OwnGradeListQueryInput,
  RegradeInput,
  ReturnSubmissionInput,
  SaveSubmissionGradeInput,
} from './grade.schemas.js';
import { assertEvidenceRevision, assertGradeRevision, assertGradeScore } from './grade.policy.js';

function objectId(value: string, label: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value))
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  return new Types.ObjectId(value);
}

function assertTeacher(actor: AuthenticatedUser): void {
  if (actor.role !== 'TEACHER') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
}

function assertStudent(actor: AuthenticatedUser): void {
  if (actor.role !== 'STUDENT') throw new AppError(403, 'ACCESS_DENIED', 'Access is denied');
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

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export class GradeService {
  constructor(
    private readonly grades: GradeRepository,
    private readonly submissions: SubmissionRepository,
    private readonly assignments: AssignmentRepository,
    private readonly enrollments: EnrollmentRepository,
    private readonly scopes: AssessmentScopeReader,
    private readonly audits: PhaseFiveAuditWriter,
    private readonly features: AssessmentFeatureFlagConfig,
    private readonly reportingInvalidationWriter: ReportingInvalidationWriter,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async requireTeacherGrade(actor: AuthenticatedUser, gradeId: string) {
    assertTeacher(actor);
    const grade = await this.grades.findById(objectId(gradeId, 'Grade'));
    if (!grade) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Grade was not found');
    await this.scopes.requireTeacherManage(actor.id, grade.courseId.toString());
    return grade;
  }

  async save(
    actor: AuthenticatedUser,
    submissionId: string,
    input: SaveSubmissionGradeInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const submission = await this.submissions.findById(objectId(submissionId, 'Submission'));
    if (!submission) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Submission was not found');
    await this.scopes.requireTeacherManage(actor.id, submission.courseId.toString());
    const assignment = await this.assignments.findById(submission.assignmentId);
    if (!assignment) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Assignment was not found');
    if (!['SUBMITTED', 'LATE', 'GRADED'].includes(submission.status))
      throw new AppError(409, 'GRADE_NOT_READY_TO_RETURN', 'Submission is not ready for grading');
    assertEvidenceRevision(submission.revision, input.expectedEvidenceRevision);
    assertGradeScore(input.score, assignment.maxScore);
    const current = await this.grades.findByIdentity(
      submission.studentId,
      'ASSIGNMENT',
      submission.assignmentId,
    );
    assertGradeRevision(current, input.expectedGradeRevision);
    const gradedAt = this.now();

    try {
      return await withMongoTransaction(async (session) => {
        let grade: GradeRecord;
        if (!current) {
          grade = await this.grades.create(
            {
              studentId: submission.studentId,
              classroomId: submission.classroomId,
              courseId: submission.courseId,
              activityType: 'ASSIGNMENT',
              activityId: submission.assignmentId,
              evidenceType: 'SUBMISSION',
              evidenceId: submission._id,
              evidenceRevision: submission.revision,
              score: input.score,
              maxScore: assignment.maxScore,
              feedback: input.feedback,
              gradedBy: objectId(actor.id, 'Teacher'),
              gradedAt,
            },
            session,
          );
        } else {
          const updated = await this.grades.updateCas(
            current._id,
            input.expectedGradeRevision,
            {
              evidenceId: submission._id,
              evidenceRevision: submission.revision,
              score: input.score,
              maxScore: assignment.maxScore,
              feedback: input.feedback,
              status: 'DRAFT',
              gradedBy: objectId(actor.id, 'Teacher'),
              gradedAt,
              returnedBy: null,
              returnedAt: null,
            },
            session,
          );
          if (!updated)
            throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Grade was modified elsewhere');
          grade = updated;
        }
        const gradedSubmission = await this.submissions.gradeCas(
          submission._id,
          submission.revision,
          ['SUBMITTED', 'LATE', 'GRADED'],
          { status: 'GRADED', gradedAt, returnedAt: null },
          session,
        );
        if (!gradedSubmission)
          throw new AppError(
            409,
            'SUBMISSION_REVISION_MISMATCH',
            'Submission changed while it was being graded',
          );
        await this.grades.appendRevision(
          {
            gradeId: grade._id,
            revision: grade.revision,
            oldScore: current?.score ?? null,
            newScore: grade.score,
            oldStatus: current?.status ?? null,
            newStatus: grade.status,
            evidenceId: submission._id,
            evidenceRevision: submission.revision,
            feedback: grade.feedback,
            reason: null,
            actorId: objectId(actor.id, 'Teacher'),
            requestId,
          },
          session,
        );
        const audit = await this.audits.append(
          {
            actorId: objectId(actor.id, 'Teacher'),
            actorRole: actor.role,
            action: 'GRADE_SAVED',
            resourceId: grade._id.toString(),
            requestId,
            newValue: {
              gradeRevision: grade.revision,
              gradeStatus: grade.status,
              score: grade.score,
              maxScore: grade.maxScore,
            },
            metadata: {
              classroomId: grade.classroomId.toString(),
              courseId: grade.courseId.toString(),
              assignmentId: grade.activityId.toString(),
              studentId: grade.studentId.toString(),
              evidenceRevision: grade.evidenceRevision,
            },
          },
          session,
        );
        await this.reportingInvalidationWriter.invalidateStudentCourse(
          {
            classroomId: grade.classroomId,
            courseId: grade.courseId,
            studentId: grade.studentId,
            reasons: ['GRADE_CHANGED'],
            sourceChangedAt: gradedAt,
          },
          session,
        );
        return { grade: toTeacherGradeDto(grade), auditId: audit._id.toString() };
      });
    } catch (error) {
      if (isDuplicateKey(error))
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Grade was created concurrently');
      throw error;
    }
  }

  async returnWork(
    actor: AuthenticatedUser,
    submissionId: string,
    input: ReturnSubmissionInput,
    requestId: string,
  ) {
    assertTeacher(actor);
    const submission = await this.submissions.findById(objectId(submissionId, 'Submission'));
    if (!submission) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Submission was not found');
    await this.scopes.requireTeacherManage(actor.id, submission.courseId.toString());
    const current = await this.grades.findByIdentity(
      submission.studentId,
      'ASSIGNMENT',
      submission.assignmentId,
    );
    if (!current || current.status !== 'DRAFT')
      throw new AppError(409, 'GRADE_NOT_READY_TO_RETURN', 'Grade draft is not ready to return');
    assertGradeRevision(current, input.expectedGradeRevision);
    assertEvidenceRevision(submission.revision, current.evidenceRevision);
    const returnedAt = this.now();
    return withMongoTransaction(async (session) => {
      const grade = await this.grades.updateCas(
        current._id,
        input.expectedGradeRevision,
        {
          status: 'RETURNED',
          returnedBy: objectId(actor.id, 'Teacher'),
          returnedAt,
        },
        session,
      );
      if (!grade)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Grade was modified elsewhere');
      const returnedSubmission = await this.submissions.gradeCas(
        submission._id,
        submission.revision,
        ['GRADED'],
        { status: 'RETURNED', gradedAt: current.gradedAt, returnedAt },
        session,
      );
      if (!returnedSubmission)
        throw new AppError(
          409,
          'SUBMISSION_REVISION_MISMATCH',
          'Submission changed while work was being returned',
        );
      await this.grades.appendRevision(
        {
          gradeId: grade._id,
          revision: grade.revision,
          oldScore: current.score,
          newScore: grade.score,
          oldStatus: current.status,
          newStatus: grade.status,
          evidenceId: grade.evidenceId,
          evidenceRevision: grade.evidenceRevision,
          feedback: grade.feedback,
          reason: null,
          actorId: objectId(actor.id, 'Teacher'),
          requestId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'WORK_RETURNED',
          resourceId: grade._id.toString(),
          requestId,
          newValue: { gradeRevision: grade.revision, gradeStatus: grade.status },
          metadata: {
            classroomId: grade.classroomId.toString(),
            courseId: grade.courseId.toString(),
            assignmentId: grade.activityId.toString(),
            studentId: grade.studentId.toString(),
          },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: grade.classroomId,
          courseId: grade.courseId,
          studentId: grade.studentId,
          reasons: ['GRADE_CHANGED'],
          sourceChangedAt: returnedAt,
        },
        session,
      );
      return { grade: toTeacherGradeDto(grade), auditId: audit._id.toString() };
    });
  }

  async regrade(actor: AuthenticatedUser, gradeId: string, input: RegradeInput, requestId: string) {
    const current = await this.requireTeacherGrade(actor, gradeId);
    assertGradeRevision(current, input.expectedGradeRevision);
    assertGradeScore(input.score, current.maxScore);
    const gradedAt = this.now();
    return withMongoTransaction(async (session) => {
      const grade = await this.grades.updateCas(
        current._id,
        input.expectedGradeRevision,
        {
          score: input.score,
          feedback: input.feedback,
          gradedBy: objectId(actor.id, 'Teacher'),
          gradedAt,
          ...(current.status === 'RETURNED'
            ? { returnedBy: objectId(actor.id, 'Teacher'), returnedAt: gradedAt }
            : {}),
        },
        session,
      );
      if (!grade)
        throw new AppError(409, 'CONCURRENT_MODIFICATION', 'Grade was modified elsewhere');
      await this.grades.appendRevision(
        {
          gradeId: grade._id,
          revision: grade.revision,
          oldScore: current.score,
          newScore: grade.score,
          oldStatus: current.status,
          newStatus: grade.status,
          evidenceId: grade.evidenceId,
          evidenceRevision: grade.evidenceRevision,
          feedback: grade.feedback,
          reason: input.reason,
          actorId: objectId(actor.id, 'Teacher'),
          requestId,
        },
        session,
      );
      const audit = await this.audits.append(
        {
          actorId: objectId(actor.id, 'Teacher'),
          actorRole: actor.role,
          action: 'GRADE_REVISED',
          resourceId: grade._id.toString(),
          requestId,
          reason: input.reason,
          oldValue: { gradeRevision: current.revision, score: current.score },
          newValue: { gradeRevision: grade.revision, score: grade.score },
          metadata: {
            classroomId: grade.classroomId.toString(),
            courseId: grade.courseId.toString(),
            activityId: grade.activityId.toString(),
            activityType: grade.activityType,
            studentId: grade.studentId.toString(),
          },
        },
        session,
      );
      await this.reportingInvalidationWriter.invalidateStudentCourse(
        {
          classroomId: grade.classroomId,
          courseId: grade.courseId,
          studentId: grade.studentId,
          reasons: ['GRADE_CHANGED'],
          sourceChangedAt: gradedAt,
        },
        session,
      );
      return { grade: toTeacherGradeDto(grade), auditId: audit._id.toString() };
    });
  }

  async history(actor: AuthenticatedUser, gradeId: string, query: GradeHistoryQueryInput) {
    const grade = await this.requireTeacherGrade(actor, gradeId);
    const result = await this.grades.listHistory(grade._id, query.page, query.limit);
    return {
      data: {
        items: result.items.map((item) => ({
          id: item._id.toString(),
          revision: item.revision,
          oldScore: item.oldScore,
          newScore: item.newScore,
          oldStatus: item.oldStatus,
          newStatus: item.newStatus,
          evidenceRevision: item.evidenceRevision,
          feedback: item.feedback,
          reason: item.reason,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  private async activityProjection(grade: GradeRecord) {
    if (grade.activityType === 'ASSIGNMENT') {
      const assignment = await this.assignments.findById(grade.activityId);
      return {
        title: assignment?.title ?? 'Assignment',
        actionUrl: `/student/assignments/${grade.activityId.toString()}`,
      };
    }
    const quiz = await QuizModel.findById(grade.activityId).select({ title: 1 }).lean().exec();
    return {
      title: quiz?.title ?? 'Quiz',
      actionUrl: `/student/quizzes/${grade.activityId.toString()}`,
    };
  }

  async listOwn(actor: AuthenticatedUser, query: OwnGradeListQueryInput) {
    assertStudent(actor);
    const result = await this.grades.listReturnedByStudent(objectId(actor.id, 'Student'), {
      page: query.page,
      limit: query.limit,
      ...(query.classroomId ? { classroomId: objectId(query.classroomId, 'Classroom') } : {}),
      ...(query.courseId ? { courseId: objectId(query.courseId, 'Course') } : {}),
      ...(query.activityType ? { activityType: query.activityType } : {}),
    });
    const items = await Promise.all(
      result.items.map(async (grade) => {
        const projection = toStudentReturnedGradeDto(grade)!;
        return {
          ...projection,
          classroomId: grade.classroomId.toString(),
          courseId: grade.courseId.toString(),
          percentage: Math.round((grade.score / grade.maxScore) * 10_000) / 100,
          ...(await this.activityProjection(grade)),
        };
      }),
    );
    return {
      data: { items },
      meta: paginationMeta(result.page, result.limit, result.totalItems),
    };
  }

  async getOwn(actor: AuthenticatedUser, gradeId: string) {
    assertStudent(actor);
    const grade = await this.grades.findById(objectId(gradeId, 'Grade'));
    if (!grade || grade.studentId.toString() !== actor.id || grade.status !== 'RETURNED')
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Grade was not found');
    const projection = toStudentReturnedGradeDto(grade)!;
    return {
      ...projection,
      classroomId: grade.classroomId.toString(),
      courseId: grade.courseId.toString(),
      percentage: Math.round((grade.score / grade.maxScore) * 10_000) / 100,
      evidenceType: grade.evidenceType,
      ...(await this.activityProjection(grade)),
    };
  }

  async gradebook(actor: AuthenticatedUser, courseId: string) {
    assertTeacher(actor);
    if (!this.features.basicGradebookEnabled)
      throw new AppError(409, 'FEATURE_NOT_ENABLED', 'Basic gradebook is not enabled');
    const scope = await this.scopes.requireTeacherManage(actor.id, courseId);
    const [enrollments, grades] = await Promise.all([
      this.enrollments.listActiveByClassroom(objectId(scope.classroomId, 'Classroom')),
      this.grades.listByCourse(objectId(courseId, 'Course')),
    ]);
    const users = await UserModel.find({
      _id: { $in: enrollments.map((item) => item.studentId) },
      status: 'ACTIVE',
    })
      .select({ fullName: 1, email: 1 })
      .lean<Array<{ _id: Types.ObjectId; fullName: string; email: string }>>()
      .exec();
    return {
      featureVersion: 'P05_BASIC_GRADEBOOK_V1',
      courseId,
      students: users.map((user) => ({
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        grades: grades.filter((grade) => grade.studentId.equals(user._id)).map(toTeacherGradeDto),
      })),
    };
  }
}
