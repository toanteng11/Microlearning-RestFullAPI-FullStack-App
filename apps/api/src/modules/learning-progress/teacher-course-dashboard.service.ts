import { Types } from 'mongoose';

import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { ClassroomRepository } from '../classrooms/classroom.repository.js';
import type { CourseScopeReader } from '../learning-content/course-scope.reader.js';
import { orderedVisibleCourseLessons } from '../learning-content/visible-content.policy.js';
import type { CourseRepository } from '../courses/course.repository.js';
import type { EnrollmentRepository } from '../enrollments/enrollment.repository.js';
import type { LessonRepository } from '../lessons/lesson.repository.js';
import type { CourseModuleRepository } from '../modules/module.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import {
  deriveLearningStatus,
  isCompletedDerived,
  progressPercentage,
  type DerivedLearningStatus,
} from './derived-progress.policy.js';
import type { TeacherActivityQuery, TeacherProgressQuery } from './learning-progress.schemas.js';
import type {
  LearningProgressProjection,
  LearningProgressRepository,
} from './learning-progress.repository.js';
import { LEARNING_PROGRESS_METRIC_VERSION } from './student-learning.service.js';

function objectId(value: string, label = 'Resource'): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(404, 'RESOURCE_NOT_FOUND', `${label} was not found`);
  }
  return new Types.ObjectId(value);
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

function latestActivity(items: readonly LearningProgressProjection[]): Date | null {
  return items.reduce<Date | null>(
    (latest, item) => (!latest || item.lastActiveAt > latest ? item.lastActiveAt : latest),
    null,
  );
}

function overallStatus(
  statuses: readonly DerivedLearningStatus[],
  hasAnyProgress: boolean,
): DerivedLearningStatus {
  if (statuses.length === 0) return 'NOT_STARTED';
  if (statuses.every(isCompletedDerived)) {
    return statuses.includes('LATE') ? 'LATE' : 'COMPLETED';
  }
  if (statuses.includes('MISSING')) return 'MISSING';
  return hasAnyProgress ? 'IN_PROGRESS' : 'NOT_STARTED';
}

interface StudentMetric {
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
  requiredLessons: number;
  completedLessons: number;
  progressPercentage: number;
  progressStatus: DerivedLearningStatus;
  lastActiveAt: string | null;
}

interface DashboardSnapshot {
  asOf: Date;
  course: { id: string; title: string; classroomId: string; classroomName: string };
  summary: {
    totalLessons: number;
    publishedLessons: number;
    requiredLessons: number;
    activeStudents: number;
    averageProgressPercentage: number;
  };
  activities: Array<{
    id: string;
    title: string;
    moduleId: string | null;
    isRequired: boolean;
    completionDeadline: string | null;
    deadlineStatus: 'NO_DEADLINE' | 'UPCOMING' | 'OVERDUE';
    completedStudents: number;
    activeStudents: number;
    completionPercentage: number;
  }>;
  students: StudentMetric[];
}

export class TeacherCourseDashboardService {
  constructor(
    private readonly classrooms: ClassroomRepository,
    private readonly enrollments: EnrollmentRepository,
    private readonly users: UserRepository,
    private readonly courses: CourseRepository,
    private readonly modules: CourseModuleRepository,
    private readonly lessons: LessonRepository,
    private readonly progress: LearningProgressRepository,
    private readonly courseScopes: CourseScopeReader,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async snapshot(actor: AuthenticatedUser, courseId: string): Promise<DashboardSnapshot> {
    assertTeacher(actor);
    const asOf = this.now();
    const scope = await this.courseScopes.requireTeacherManage(actor.id, courseId);
    const id = objectId(courseId, 'Course');
    const [course, classroom, modules, allLessons, enrollments] = await Promise.all([
      this.courses.findById(id),
      this.classrooms.findById(objectId(scope.classroomId, 'Classroom')),
      this.modules.listByCourse(id),
      this.lessons.listByCourse(id),
      this.enrollments.listActiveByClassroom(objectId(scope.classroomId, 'Classroom')),
    ]);
    if (!course || !classroom) {
      throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Course was not found');
    }
    const enrollmentStudentIds = enrollments.map((item) => item.studentId);
    const students = await this.users.listActiveStudentSummaries(enrollmentStudentIds);
    const studentIds = students.map((item) => item._id);
    const progress = await this.progress.listByCourseAndStudentIds(id, studentIds);
    const visibleLessons = orderedVisibleCourseLessons(modules, allLessons, asOf);
    const requiredLessons = visibleLessons.filter((item) => item.isRequired);
    const progressByStudent = new Map<string, LearningProgressProjection[]>();
    for (const item of progress) {
      const key = item.studentId.toString();
      progressByStudent.set(key, [...(progressByStudent.get(key) ?? []), item]);
    }

    const studentMetrics: StudentMetric[] = students.map((student) => {
      const studentProgress = progressByStudent.get(student._id.toString()) ?? [];
      const progressMap = new Map(
        studentProgress.map((item) => [item.activityId.toString(), item]),
      );
      const statuses = requiredLessons.map((lesson) =>
        deriveLearningStatus(
          progressMap.get(lesson._id.toString()),
          lesson.completionDeadline,
          asOf,
        ),
      );
      const completedLessons = statuses.filter(isCompletedDerived).length;
      const lastActiveAt = latestActivity(studentProgress);
      return {
        id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        studentCode: student.studentCode ?? null,
        requiredLessons: requiredLessons.length,
        completedLessons,
        progressPercentage: progressPercentage(completedLessons, requiredLessons.length),
        progressStatus: overallStatus(statuses, studentProgress.length > 0),
        lastActiveAt: lastActiveAt?.toISOString() ?? null,
      };
    });

    const activityRows = visibleLessons.map((lesson) => {
      const completedStudents = students.filter((student) => {
        const studentProgress = progressByStudent.get(student._id.toString()) ?? [];
        const current = studentProgress.find((item) => item.activityId.equals(lesson._id));
        return isCompletedDerived(deriveLearningStatus(current, lesson.completionDeadline, asOf));
      }).length;
      return {
        id: lesson._id.toString(),
        title: lesson.title,
        moduleId: lesson.moduleId?.toString() ?? null,
        isRequired: lesson.isRequired,
        completionDeadline: lesson.completionDeadline?.toISOString() ?? null,
        deadlineStatus: lesson.completionDeadline
          ? lesson.completionDeadline <= asOf
            ? ('OVERDUE' as const)
            : ('UPCOMING' as const)
          : ('NO_DEADLINE' as const),
        completedStudents,
        activeStudents: students.length,
        completionPercentage: progressPercentage(completedStudents, students.length),
      };
    });
    const averageProgressPercentage =
      studentMetrics.length === 0
        ? 0
        : Math.round(
            (studentMetrics.reduce((total, item) => total + item.progressPercentage, 0) /
              studentMetrics.length) *
              10,
          ) / 10;

    return {
      asOf,
      course: {
        id: course._id.toString(),
        title: course.title,
        classroomId: classroom._id.toString(),
        classroomName: classroom.name,
      },
      summary: {
        totalLessons: allLessons.length,
        publishedLessons: visibleLessons.length,
        requiredLessons: requiredLessons.length,
        activeStudents: students.length,
        averageProgressPercentage,
      },
      activities: activityRows,
      students: studentMetrics,
    };
  }

  async dashboard(actor: AuthenticatedUser, courseId: string) {
    const snapshot = await this.snapshot(actor, courseId);
    return {
      metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
      asOf: snapshot.asOf.toISOString(),
      course: snapshot.course,
      summary: snapshot.summary,
      activities: snapshot.activities.slice(0, 5),
      students: this.rank(snapshot.students).slice(0, 5),
    };
  }

  async activities(actor: AuthenticatedUser, courseId: string, query: TeacherActivityQuery) {
    const snapshot = await this.snapshot(actor, courseId);
    const search = query.search?.normalize('NFKC').toLocaleLowerCase();
    const filtered = snapshot.activities.filter(
      (item) =>
        (!search || item.title.toLocaleLowerCase().includes(search)) &&
        (!query.deadlineStatus || item.deadlineStatus === query.deadlineStatus),
    );
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: filtered.slice(start, start + query.limit),
        metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
        asOf: snapshot.asOf.toISOString(),
      },
      meta: paginationMeta(query.page, query.limit, filtered.length),
    };
  }

  async students(actor: AuthenticatedUser, courseId: string, query: TeacherProgressQuery) {
    const snapshot = await this.snapshot(actor, courseId);
    const filtered = this.filterStudents(snapshot.students, query);
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: filtered
          .sort(
            (left, right) =>
              left.fullName.localeCompare(right.fullName) || left.id.localeCompare(right.id),
          )
          .slice(start, start + query.limit),
        metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
        asOf: snapshot.asOf.toISOString(),
      },
      meta: paginationMeta(query.page, query.limit, filtered.length),
    };
  }

  async ranking(actor: AuthenticatedUser, courseId: string, query: TeacherProgressQuery) {
    const snapshot = await this.snapshot(actor, courseId);
    const filtered = this.rank(this.filterStudents(snapshot.students, query));
    const start = (query.page - 1) * query.limit;
    return {
      data: {
        items: filtered.slice(start, start + query.limit).map((item, index) => ({
          rank: start + index + 1,
          ...item,
        })),
        metricVersion: LEARNING_PROGRESS_METRIC_VERSION,
        asOf: snapshot.asOf.toISOString(),
      },
      meta: paginationMeta(query.page, query.limit, filtered.length),
    };
  }

  private filterStudents(students: readonly StudentMetric[], query: TeacherProgressQuery) {
    const search = query.search?.normalize('NFKC').toLocaleLowerCase();
    return students.filter(
      (item) =>
        (!search ||
          item.fullName.toLocaleLowerCase().includes(search) ||
          item.email.toLocaleLowerCase().includes(search) ||
          item.studentCode?.toLocaleLowerCase().includes(search)) &&
        (!query.progressStatus || item.progressStatus === query.progressStatus),
    );
  }

  private rank(students: readonly StudentMetric[]): StudentMetric[] {
    return [...students].sort((left, right) => {
      const leftActive = left.lastActiveAt
        ? Date.parse(left.lastActiveAt)
        : Number.NEGATIVE_INFINITY;
      const rightActive = right.lastActiveAt
        ? Date.parse(right.lastActiveAt)
        : Number.NEGATIVE_INFINITY;
      return (
        right.completedLessons - left.completedLessons ||
        right.progressPercentage - left.progressPercentage ||
        rightActive - leftActive ||
        left.id.localeCompare(right.id)
      );
    });
  }
}
