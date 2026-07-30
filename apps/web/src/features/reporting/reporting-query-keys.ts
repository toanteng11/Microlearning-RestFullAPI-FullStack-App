import type { StudentCourseProgressQuery } from './reporting.types';

export const reportingQueryKeys = {
  all: (actorId: string) => ['private-reporting', actorId] as const,
  studentDashboard: (actorId: string) =>
    [...reportingQueryKeys.all(actorId), 'student-dashboard'] as const,
  studentCourses: (actorId: string, query: StudentCourseProgressQuery) =>
    [...reportingQueryKeys.all(actorId), 'student-courses', query] as const,
  studentCourse: (actorId: string, courseId: string) =>
    [...reportingQueryKeys.all(actorId), 'student-course', courseId] as const,
};
