import { Types } from 'mongoose';

import type { AppConfig } from '../../shared/config/environment.js';
import { AppError } from '../../shared/errors/app-error.js';
import { AssignmentModel } from '../assignments/assignment.model.js';
import { DeadlineExceptionModel } from '../deadline-exceptions/deadline-exception.model.js';
import { GradeModel } from '../grades/grade.model.js';
import { LearningProgressModel } from '../learning-progress/learning-progress.model.js';
import { QuestionModel } from '../questions/question.model.js';
import { QuizAttemptModel } from '../quiz-attempts/quiz-attempt.model.js';
import { QuizModel } from '../quizzes/quiz.model.js';
import { SubmissionModel } from '../submissions/submission.model.js';

interface SeedUserReference {
  id: string;
  email: string;
}

const IDS = {
  classroom: new Types.ObjectId('640000000000000000000001'),
  course: new Types.ObjectId('650000000000000000000001'),
  module: new Types.ObjectId('650000000000000000000011'),
  quizReview: new Types.ObjectId('660000000000000000000001'),
  quizReleased: new Types.ObjectId('660000000000000000000002'),
  questionReview: new Types.ObjectId('660000000000000000000011'),
  questionReleased: new Types.ObjectId('660000000000000000000012'),
  attemptReview: new Types.ObjectId('660000000000000000000021'),
  attemptReleased: new Types.ObjectId('660000000000000000000022'),
  quizGrade: new Types.ObjectId('660000000000000000000031'),
  assignmentReturned: new Types.ObjectId('660000000000000000000041'),
  assignmentExtended: new Types.ObjectId('660000000000000000000042'),
  submissionReturned: new Types.ObjectId('660000000000000000000051'),
  assignmentGrade: new Types.ObjectId('660000000000000000000061'),
  deadlineException: new Types.ObjectId('660000000000000000000071'),
  quizProgress: new Types.ObjectId('660000000000000000000081'),
  assignmentProgress: new Types.ObjectId('660000000000000000000082'),
} as const;

function requireUser(users: readonly SeedUserReference[], email: string): Types.ObjectId {
  const user = users.find((item) => item.email === email);
  if (!user || !Types.ObjectId.isValid(user.id)) {
    throw new AppError(409, 'DEMO_SEED_USER_MISSING', `Required demo identity ${email} is missing`);
  }
  return new Types.ObjectId(user.id);
}

export class PhaseFiveDemoSeedService {
  constructor(private readonly environment: AppConfig['appEnvironment']) {}

  async execute(users: readonly SeedUserReference[], now = new Date()) {
    if (this.environment === 'production') {
      throw new AppError(403, 'DEMO_SEED_DISABLED', 'Demo seed is disabled in production');
    }

    const teacher = requireUser(users, 'teacher.active@example.test');
    const student = requireUser(users, 'student.active@example.test');
    const publishedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1_000);
    const submittedAt = new Date(now.getTime() - 24 * 60 * 60 * 1_000);
    const dueDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1_000);
    const extendedDeadline = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1_000);

    const quizResult = await QuizModel.bulkWrite(
      [
        {
          id: IDS.quizReview,
          title: 'Review thiết kế API an toàn',
          instruction: 'Giải thích cách xử lý retry an toàn.',
          resultReleasePolicy: 'AFTER_REVIEW' as const,
          maxScore: 4,
          displayOrder: 2,
        },
        {
          id: IDS.quizReleased,
          title: 'HTTP Status Code Check',
          instruction: 'Chọn status code phù hợp.',
          resultReleasePolicy: 'IMMEDIATE' as const,
          maxScore: 2,
          displayOrder: 3,
        },
      ].map((quiz) => ({
        updateOne: {
          filter: { _id: quiz.id },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroom,
              courseId: IDS.course,
              moduleId: IDS.module,
              title: quiz.title,
              instruction: quiz.instruction,
              isRequired: true,
              status: 'PUBLISHED',
              availableFrom: null,
              dueDate,
              attemptLimit: 2,
              timeLimitMinutes: 15,
              resultReleasePolicy: quiz.resultReleasePolicy,
              scorePolicy: 'HIGHEST',
              displayOrder: quiz.displayOrder,
              contentRevision: 2,
              questionRevision: 1,
              publishedRevision: 2,
              maxScore: quiz.maxScore,
              scheduledPublishAt: null,
              publishedAt,
              unpublishedAt: null,
              archivedAt: null,
              createdBy: teacher,
              updatedBy: teacher,
              schemaVersion: 1,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const questionResult = await QuestionModel.bulkWrite(
      [
        {
          id: IDS.questionReview,
          quizId: IDS.quizReview,
          type: 'SHORT_ANSWER' as const,
          prompt: 'Idempotency giúp API an toàn khi retry như thế nào?',
          points: 4,
          options: [],
          correctOptionIds: [],
          correctBoolean: null,
          rubric: 'Cùng request retry không tạo hiệu ứng nghiệp vụ trùng lặp.',
          displayOrder: 0,
        },
        {
          id: IDS.questionReleased,
          quizId: IDS.quizReleased,
          type: 'SINGLE_CHOICE' as const,
          prompt: 'Status code nào phù hợp khi tạo tài nguyên thành công?',
          points: 2,
          options: [
            { id: 'ok', label: '200 OK', displayOrder: 0 },
            { id: 'created', label: '201 Created', displayOrder: 1 },
          ],
          correctOptionIds: ['created'],
          correctBoolean: null,
          rubric: null,
          displayOrder: 0,
        },
      ].map((question) => ({
        updateOne: {
          filter: { _id: question.id },
          update: {
            $setOnInsert: {
              quizId: question.quizId,
              courseId: IDS.course,
              type: question.type,
              prompt: question.prompt,
              points: question.points,
              isRequired: true,
              options: question.options,
              correctOptionIds: question.correctOptionIds,
              correctBoolean: question.correctBoolean,
              rubric: question.rubric,
              explanation: null,
              media: null,
              displayOrder: question.displayOrder,
              version: 1,
              status: 'ACTIVE',
              archivedAt: null,
              createdBy: teacher,
              updatedBy: teacher,
              schemaVersion: 1,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const attemptResult = await QuizAttemptModel.bulkWrite(
      [
        {
          id: IDS.attemptReview,
          quizId: IDS.quizReview,
          status: 'NEEDS_REVIEW' as const,
          title: 'Review thiết kế API an toàn',
          maxScore: 4,
          questionId: IDS.questionReview,
          questionType: 'SHORT_ANSWER' as const,
          prompt: 'Idempotency giúp API an toàn khi retry như thế nào?',
          points: 4,
          options: [],
          scoring: {
            correctOptionIds: [],
            correctBoolean: null,
            rubric: 'Cùng request retry không tạo hiệu ứng nghiệp vụ trùng lặp.',
          },
          answer: {
            selectedOptionIds: [],
            textAnswer: 'Retry cùng idempotency key chỉ tạo một kết quả cuối.',
          },
          objectiveScore: 0,
          totalScore: 0,
          releasedAt: null,
        },
        {
          id: IDS.attemptReleased,
          quizId: IDS.quizReleased,
          status: 'RESULT_RELEASED' as const,
          title: 'HTTP Status Code Check',
          maxScore: 2,
          questionId: IDS.questionReleased,
          questionType: 'SINGLE_CHOICE' as const,
          prompt: 'Status code nào phù hợp khi tạo tài nguyên thành công?',
          points: 2,
          options: [
            { id: 'ok', label: '200 OK', displayOrder: 0 },
            { id: 'created', label: '201 Created', displayOrder: 1 },
          ],
          scoring: {
            correctOptionIds: ['created'],
            correctBoolean: null,
            rubric: null,
          },
          answer: { selectedOptionIds: ['created'], textAnswer: null },
          objectiveScore: 2,
          totalScore: 2,
          releasedAt: submittedAt,
        },
      ].map((attempt) => ({
        updateOne: {
          filter: { _id: attempt.id },
          update: {
            $setOnInsert: {
              studentId: student,
              classroomId: IDS.classroom,
              courseId: IDS.course,
              quizId: attempt.quizId,
              attemptNumber: 1,
              status: attempt.status,
              assessmentRevision: 2,
              quizSnapshot: {
                title: attempt.title,
                resultReleasePolicy:
                  attempt.status === 'NEEDS_REVIEW' ? 'AFTER_REVIEW' : 'IMMEDIATE',
                maxScore: attempt.maxScore,
                timeLimitMinutes: 15,
              },
              questionSnapshots: [
                {
                  questionId: attempt.questionId,
                  questionRevision: 1,
                  type: attempt.questionType,
                  prompt: attempt.prompt,
                  points: attempt.points,
                  isRequired: true,
                  displayOrder: 0,
                  options: attempt.options,
                  media: null,
                  scoring: attempt.scoring,
                },
              ],
              answers: [
                {
                  questionId: attempt.questionId,
                  ...attempt.answer,
                  savedAt: submittedAt,
                },
              ],
              manualReviews: [],
              objectiveScore: attempt.objectiveScore,
              manualScore: 0,
              totalScore: attempt.totalScore,
              maxScore: attempt.maxScore,
              startedAt: new Date(submittedAt.getTime() - 10 * 60 * 1_000),
              expiresAt: dueDate,
              lastSavedAt: submittedAt,
              submittedAt,
              gradedAt: attempt.status === 'NEEDS_REVIEW' ? null : submittedAt,
              releasedAt: attempt.releasedAt,
              attemptRevision: 2,
              reviewRevision: 0,
              schemaVersion: 1,
              createdAt: submittedAt,
              updatedAt: submittedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const assignmentResult = await AssignmentModel.bulkWrite(
      [
        {
          id: IDS.assignmentReturned,
          title: 'Thiết kế REST Endpoint',
          instruction: 'Mô tả endpoint tạo tài nguyên và validation.',
          dueDate,
          displayOrder: 4,
        },
        {
          id: IDS.assignmentExtended,
          title: 'Docker và Cloud Run',
          instruction: 'Trình bày quy trình containerize và deploy.',
          dueDate,
          displayOrder: 5,
        },
      ].map((assignment) => ({
        updateOne: {
          filter: { _id: assignment.id },
          update: {
            $setOnInsert: {
              classroomId: IDS.classroom,
              courseId: IDS.course,
              moduleId: IDS.module,
              title: assignment.title,
              instruction: assignment.instruction,
              maxScore: 10,
              isRequired: true,
              allowedSubmissionTypes: ['TEXT'],
              allowLateSubmission: false,
              allowUnsubmit: true,
              allowResubmit: true,
              availableFrom: null,
              dueDate: assignment.dueDate,
              status: 'PUBLISHED',
              displayOrder: assignment.displayOrder,
              contentRevision: 2,
              publishedRevision: 2,
              scheduledPublishAt: null,
              publishedAt,
              unpublishedAt: null,
              closedAt: null,
              archivedAt: null,
              createdBy: teacher,
              updatedBy: teacher,
              schemaVersion: 1,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const submissionResult = await SubmissionModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.submissionReturned },
          update: {
            $setOnInsert: {
              assignmentId: IDS.assignmentReturned,
              studentId: student,
              classroomId: IDS.classroom,
              courseId: IDS.course,
              status: 'RETURNED',
              submissionType: 'TEXT',
              textAnswer: 'POST /api/v1/resources trả 201, validate body và dùng idempotency key.',
              links: [],
              markDone: false,
              revision: 3,
              submittedRevision: 2,
              submittedAt,
              isLate: false,
              effectiveDeadlineAtSubmit: dueDate,
              gradedAt: submittedAt,
              returnedAt: submittedAt,
              schemaVersion: 1,
              createdAt: new Date(submittedAt.getTime() - 60 * 60 * 1_000),
              updatedAt: submittedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      },
    ]);

    const gradeResult = await GradeModel.bulkWrite(
      [
        {
          id: IDS.quizGrade,
          activityType: 'QUIZ' as const,
          activityId: IDS.quizReleased,
          evidenceType: 'ATTEMPT' as const,
          evidenceId: IDS.attemptReleased,
          evidenceRevision: 2,
          score: 2,
          maxScore: 2,
          feedback: 'Nắm đúng ý nghĩa của 201 Created.',
        },
        {
          id: IDS.assignmentGrade,
          activityType: 'ASSIGNMENT' as const,
          activityId: IDS.assignmentReturned,
          evidenceType: 'SUBMISSION' as const,
          evidenceId: IDS.submissionReturned,
          evidenceRevision: 3,
          score: 9,
          maxScore: 10,
          feedback: 'Thiết kế rõ ràng; cần bổ sung ví dụ lỗi validation.',
        },
      ].map((grade) => ({
        updateOne: {
          filter: { _id: grade.id },
          update: {
            $setOnInsert: {
              studentId: student,
              classroomId: IDS.classroom,
              courseId: IDS.course,
              activityType: grade.activityType,
              activityId: grade.activityId,
              evidenceType: grade.evidenceType,
              evidenceId: grade.evidenceId,
              evidenceRevision: grade.evidenceRevision,
              score: grade.score,
              maxScore: grade.maxScore,
              feedback: grade.feedback,
              status: 'RETURNED',
              revision: 1,
              gradedBy: teacher,
              gradedAt: submittedAt,
              returnedBy: teacher,
              returnedAt: submittedAt,
              schemaVersion: 1,
              createdAt: submittedAt,
              updatedAt: submittedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const deadlineResult = await DeadlineExceptionModel.bulkWrite([
      {
        updateOne: {
          filter: { _id: IDS.deadlineException },
          update: {
            $setOnInsert: {
              studentId: student,
              classroomId: IDS.classroom,
              courseId: IDS.course,
              activityType: 'ASSIGNMENT',
              activityId: IDS.assignmentExtended,
              deadline: extendedDeadline,
              revision: 1,
              active: true,
              reason: 'Gia hạn mẫu cho hoạt động học tập cá nhân.',
              defaultDeadlineSnapshot: dueDate,
              changedBy: teacher,
              changedAt: publishedAt,
              schemaVersion: 1,
              createdAt: publishedAt,
              updatedAt: publishedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      },
    ]);

    const progressResult = await LearningProgressModel.bulkWrite(
      [
        {
          id: IDS.quizProgress,
          activityType: 'QUIZ' as const,
          activityId: IDS.quizReleased,
        },
        {
          id: IDS.assignmentProgress,
          activityType: 'ASSIGNMENT' as const,
          activityId: IDS.assignmentReturned,
        },
      ].map((progress) => ({
        updateOne: {
          filter: { _id: progress.id },
          update: {
            $setOnInsert: {
              studentId: student,
              classroomId: IDS.classroom,
              courseId: IDS.course,
              activityType: progress.activityType,
              activityId: progress.activityId,
              status: 'COMPLETED',
              startedAt: new Date(submittedAt.getTime() - 30 * 60 * 1_000),
              completedAt: submittedAt,
              lastActiveAt: submittedAt,
              schemaVersion: 1,
              createdAt: submittedAt,
              updatedAt: submittedAt,
            },
          },
          upsert: true,
          timestamps: false,
        },
      })),
      { ordered: true },
    );

    const attempted = 14;
    const createdCount =
      quizResult.upsertedCount +
      questionResult.upsertedCount +
      attemptResult.upsertedCount +
      assignmentResult.upsertedCount +
      submissionResult.upsertedCount +
      gradeResult.upsertedCount +
      deadlineResult.upsertedCount +
      progressResult.upsertedCount;

    return {
      createdCount,
      reusedCount: attempted - createdCount,
      resources: {
        quizIds: [IDS.quizReview, IDS.quizReleased].map((id) => id.toString()),
        assignmentIds: [IDS.assignmentReturned, IDS.assignmentExtended].map((id) => id.toString()),
        attemptIds: [IDS.attemptReview, IDS.attemptReleased].map((id) => id.toString()),
        gradeIds: [IDS.quizGrade, IDS.assignmentGrade].map((id) => id.toString()),
        deadlineExceptionId: IDS.deadlineException.toString(),
      },
    };
  }
}
