import { Types } from 'mongoose';

import { AssignmentModel } from '../../assignments/assignment.model.js';
import { CourseModel } from '../../courses/course.model.js';
import { DeadlineExceptionModel } from '../../deadline-exceptions/deadline-exception.model.js';
import { LessonModel } from '../../lessons/lesson.model.js';
import { CourseModuleModel } from '../../modules/module.model.js';
import { QuizModel } from '../../quizzes/quiz.model.js';
import type { ReportingActivityReader } from '../reporting-activity.reader.js';
import type { ReportingActivity } from '../reporting.types.js';

function visibleFilter(asOf: Date) {
  return {
    $or: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledPublishAt: { $lte: asOf } },
    ],
  };
}

export class MongoReportingActivityReader implements ReportingActivityReader {
  constructor(private readonly maxStudentIds = 500) {}

  async listVisibleByCourse(courseId: string, asOf: Date) {
    const id = new Types.ObjectId(courseId);
    const course = await CourseModel.findById(id).select({ classroomId: 1 }).lean().exec();
    if (!course) return [];
    const [courseModules, lessons, quizzes, assignments] = await Promise.all([
      CourseModuleModel.find({ courseId: id, status: { $ne: 'ARCHIVED' } })
        .select({ displayOrder: 1 })
        .lean()
        .exec(),
      LessonModel.find({ courseId: id, ...visibleFilter(asOf) })
        .select({
          moduleId: 1,
          title: 1,
          isRequired: 1,
          status: 1,
          completionDeadline: 1,
          displayOrder: 1,
          updatedAt: 1,
        })
        .lean()
        .exec(),
      QuizModel.find({ courseId: id, ...visibleFilter(asOf) })
        .select({
          classroomId: 1,
          moduleId: 1,
          title: 1,
          isRequired: 1,
          status: 1,
          dueDate: 1,
          maxScore: 1,
          displayOrder: 1,
          updatedAt: 1,
        })
        .lean()
        .exec(),
      AssignmentModel.find({ courseId: id, ...visibleFilter(asOf) })
        .select({
          classroomId: 1,
          moduleId: 1,
          title: 1,
          isRequired: 1,
          status: 1,
          dueDate: 1,
          maxScore: 1,
          displayOrder: 1,
          updatedAt: 1,
        })
        .lean()
        .exec(),
    ]);

    const rows: ReportingActivity[] = [
      ...lessons.map((row) => ({
        activityId: row._id.toString(),
        activityType: 'LESSON' as const,
        classroomId: course.classroomId.toString(),
        courseId,
        moduleId: row.moduleId?.toString() ?? null,
        title: row.title,
        isRequired: row.isRequired,
        lifecycleStatus: row.status,
        visible: true,
        defaultDeadline: row.completionDeadline,
        maxScore: null,
        displayOrder: row.displayOrder,
        sourceUpdatedAt: row.updatedAt,
      })),
      ...quizzes.map((row) => ({
        activityId: row._id.toString(),
        activityType: 'QUIZ' as const,
        classroomId: row.classroomId.toString(),
        courseId,
        moduleId: row.moduleId?.toString() ?? null,
        title: row.title,
        isRequired: row.isRequired,
        lifecycleStatus: row.status,
        visible: true,
        defaultDeadline: row.dueDate,
        maxScore: row.maxScore,
        displayOrder: row.displayOrder,
        sourceUpdatedAt: row.updatedAt,
      })),
      ...assignments.map((row) => ({
        activityId: row._id.toString(),
        activityType: 'ASSIGNMENT' as const,
        classroomId: row.classroomId.toString(),
        courseId,
        moduleId: row.moduleId?.toString() ?? null,
        title: row.title,
        isRequired: row.isRequired,
        lifecycleStatus: row.status,
        visible: true,
        defaultDeadline: row.dueDate,
        maxScore: row.maxScore,
        displayOrder: row.displayOrder,
        sourceUpdatedAt: row.updatedAt,
      })),
    ];
    const moduleOrder = new Map(
      courseModules.map((courseModule) => [courseModule._id.toString(), courseModule.displayOrder]),
    );
    return rows.sort(
      (left, right) =>
        (moduleOrder.get(left.moduleId ?? '') ?? -1) -
          (moduleOrder.get(right.moduleId ?? '') ?? -1) ||
        left.displayOrder - right.displayOrder ||
        left.activityType.localeCompare(right.activityType) ||
        left.activityId.localeCompare(right.activityId),
    );
  }

  async listDeadlineExceptions(courseId: string, studentIds: readonly string[]) {
    if (studentIds.length === 0) return [];
    if (studentIds.length > this.maxStudentIds) {
      throw new Error(`Reporting deadline batch exceeds ${this.maxStudentIds} students`);
    }
    const rows = await DeadlineExceptionModel.find({
      courseId: new Types.ObjectId(courseId),
      studentId: { $in: studentIds.map((id) => new Types.ObjectId(id)) },
      active: true,
    })
      .select({
        studentId: 1,
        courseId: 1,
        activityId: 1,
        activityType: 1,
        deadline: 1,
        active: 1,
        revision: 1,
        updatedAt: 1,
      })
      .sort({ studentId: 1, activityType: 1, activityId: 1 })
      .lean()
      .exec();
    return rows.map((row) => ({
      studentId: row.studentId.toString(),
      courseId: row.courseId.toString(),
      activityId: row.activityId.toString(),
      activityType: row.activityType,
      deadline: row.deadline,
      active: row.active,
      revision: row.revision,
      sourceUpdatedAt: row.updatedAt,
    }));
  }

  async getSourceWatermark(courseId: string) {
    const id = new Types.ObjectId(courseId);
    const [course, courseModule, lesson, quiz, assignment, deadlineException] = await Promise.all([
      CourseModel.findById(id).select({ updatedAt: 1 }).lean().exec(),
      CourseModuleModel.findOne({ courseId: id })
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .lean(),
      LessonModel.findOne({ courseId: id }).select({ updatedAt: 1 }).sort({ updatedAt: -1 }).lean(),
      QuizModel.findOne({ courseId: id }).select({ updatedAt: 1 }).sort({ updatedAt: -1 }).lean(),
      AssignmentModel.findOne({ courseId: id })
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .lean(),
      DeadlineExceptionModel.findOne({ courseId: id })
        .select({ updatedAt: 1 })
        .sort({ updatedAt: -1 })
        .lean(),
    ]);
    return (
      [
        course?.updatedAt,
        courseModule?.updatedAt,
        lesson?.updatedAt,
        quiz?.updatedAt,
        assignment?.updatedAt,
        deadlineException?.updatedAt,
      ]
        .filter((value): value is Date => value instanceof Date)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null
    );
  }
}
