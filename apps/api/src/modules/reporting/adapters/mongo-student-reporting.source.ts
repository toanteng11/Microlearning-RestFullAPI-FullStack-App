import { Types } from 'mongoose';

import { AssignmentModel } from '../../assignments/assignment.model.js';
import type { ClassroomRepository } from '../../classrooms/classroom.repository.js';
import type { CourseRepository } from '../../courses/course.repository.js';
import type { EnrollmentRepository } from '../../enrollments/enrollment.repository.js';
import { GradeModel } from '../../grades/grade.model.js';
import { QuizModel } from '../../quizzes/quiz.model.js';
import type {
  StudentReportingSource,
  StudentReturnedGradeSummary,
} from '../student-reporting.source.js';

function percentage(score: number, maxScore: number) {
  return Math.round((score / maxScore) * 10_000) / 100;
}

export class MongoStudentReportingSource implements StudentReportingSource {
  constructor(
    private readonly enrollments: EnrollmentRepository,
    private readonly classrooms: ClassroomRepository,
    private readonly courses: CourseRepository,
  ) {}

  async listActiveCourses(studentId: string, asOf: Date) {
    const memberships = await this.enrollments.listActiveByStudent(new Types.ObjectId(studentId));
    const classrooms = await this.classrooms.listActiveByIds(
      memberships.map((item) => item.classroomId),
    );
    const classroomMap = new Map(
      classrooms.map((classroom) => [classroom._id.toString(), classroom.name]),
    );
    const courses = await this.courses.listVisibleByClassroomIds(
      classrooms.map((classroom) => classroom._id),
      asOf,
    );
    return {
      activeClassroomCount: classrooms.length,
      courses: courses.map((course) => ({
        classroomId: course.classroomId.toString(),
        classroomName: classroomMap.get(course.classroomId.toString()) ?? 'Classroom',
        courseId: course._id.toString(),
        courseTitle: course.title,
      })),
    };
  }

  async listRecentReturnedGrades(
    studentId: string,
    limit: number,
  ): Promise<readonly StudentReturnedGradeSummary[]> {
    const grades = await GradeModel.find({
      studentId: new Types.ObjectId(studentId),
      status: 'RETURNED',
      returnedAt: { $ne: null },
    })
      .select({
        activityId: 1,
        activityType: 1,
        score: 1,
        maxScore: 1,
        returnedAt: 1,
      })
      .sort({ returnedAt: -1, _id: 1 })
      .limit(limit)
      .lean()
      .exec();
    const quizIds = grades
      .filter((grade) => grade.activityType === 'QUIZ')
      .map((grade) => grade.activityId);
    const assignmentIds = grades
      .filter((grade) => grade.activityType === 'ASSIGNMENT')
      .map((grade) => grade.activityId);
    const [quizzes, assignments] = await Promise.all([
      QuizModel.find({ _id: { $in: quizIds } })
        .select({ title: 1 })
        .lean()
        .exec(),
      AssignmentModel.find({ _id: { $in: assignmentIds } })
        .select({ title: 1 })
        .lean()
        .exec(),
    ]);
    const titles = new Map<string, string>([
      ...quizzes.map((quiz) => [quiz._id.toString(), quiz.title] as const),
      ...assignments.map((assignment) => [assignment._id.toString(), assignment.title] as const),
    ]);
    return grades.map((grade) => ({
      gradeId: grade._id.toString(),
      activityId: grade.activityId.toString(),
      activityType: grade.activityType,
      activityTitle:
        titles.get(grade.activityId.toString()) ??
        (grade.activityType === 'QUIZ' ? 'Quiz' : 'Assignment'),
      score: grade.score,
      maxScore: grade.maxScore,
      normalizedScore: percentage(grade.score, grade.maxScore),
      returnedAt: grade.returnedAt!,
      actionUrl: `/student/grades/${grade._id.toString()}`,
    }));
  }
}
