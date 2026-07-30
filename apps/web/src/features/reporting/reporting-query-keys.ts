import type {
  StudentCourseProgressQuery,
  GradebookQuery,
  TeacherActivityQuery,
  TeacherAssessmentQuery,
  TeacherProgressQuery,
} from './reporting.types';

export const reportingQueryKeys = {
  all: (actorId: string) => ['private-reporting', actorId] as const,
  studentDashboard: (actorId: string) =>
    [...reportingQueryKeys.all(actorId), 'student-dashboard'] as const,
  studentCourses: (actorId: string, query: StudentCourseProgressQuery) =>
    [...reportingQueryKeys.all(actorId), 'student-courses', query] as const,
  studentCourse: (actorId: string, courseId: string) =>
    [...reportingQueryKeys.all(actorId), 'student-course', courseId] as const,
  teacherDashboard: (actorId: string, courseId: string) =>
    [...reportingQueryKeys.all(actorId), 'teacher-dashboard', courseId] as const,
  teacherProgress: (actorId: string, courseId: string, query: TeacherProgressQuery) =>
    [...reportingQueryKeys.all(actorId), 'teacher-progress', courseId, query] as const,
  teacherActivities: (actorId: string, courseId: string, query: TeacherActivityQuery) =>
    [...reportingQueryKeys.all(actorId), 'teacher-activities', courseId, query] as const,
  teacherAssessments: (actorId: string, courseId: string, query: TeacherAssessmentQuery) =>
    [...reportingQueryKeys.all(actorId), 'teacher-assessments', courseId, query] as const,
  teacherStudent: (actorId: string, courseId: string, studentId: string) =>
    [...reportingQueryKeys.all(actorId), 'teacher-student', courseId, studentId] as const,
  teacherGradebooks: (actorId: string, courseId: string) =>
    [...reportingQueryKeys.all(actorId), 'teacher-gradebook', courseId] as const,
  teacherGradebook: (actorId: string, courseId: string, query: GradebookQuery) =>
    [...reportingQueryKeys.teacherGradebooks(actorId, courseId), query] as const,
};
