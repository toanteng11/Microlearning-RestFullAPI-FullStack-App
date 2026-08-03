import type {
  StudentCourseProgressQuery,
  GradebookQuery,
  TeacherActivityQuery,
  TeacherAssessmentQuery,
  TeacherProgressQuery,
  AdminAuditQuery,
  AdminGovernanceQuery,
  StudentProgressTrendQuery,
  AdminLearningOutcomeQuery,
  AdminAnalyticsAdoptionQuery,
} from './reporting.types';

export const reportingQueryKeys = {
  all: (actorId: string) => ['private-reporting', actorId] as const,
  studentDashboard: (actorId: string) =>
    [...reportingQueryKeys.all(actorId), 'student-dashboard'] as const,
  studentCourses: (actorId: string, query: StudentCourseProgressQuery) =>
    [...reportingQueryKeys.all(actorId), 'student-courses', query] as const,
  studentCourse: (actorId: string, courseId: string) =>
    [...reportingQueryKeys.all(actorId), 'student-course', courseId] as const,
  studentTrend: (actorId: string, query: StudentProgressTrendQuery) =>
    [...reportingQueryKeys.all(actorId), 'student-trend', query] as const,
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
  adminDashboard: (actorId: string) =>
    [...reportingQueryKeys.all(actorId), 'admin-dashboard'] as const,
  adminGovernance: (actorId: string, query: AdminGovernanceQuery) =>
    [...reportingQueryKeys.all(actorId), 'admin-governance', query] as const,
  adminAudit: (actorId: string, query: AdminAuditQuery) =>
    [...reportingQueryKeys.all(actorId), 'admin-audit', query] as const,
  adminLearningOutcomes: (actorId: string, query: AdminLearningOutcomeQuery) =>
    [...reportingQueryKeys.all(actorId), 'admin-learning-outcomes', query] as const,
  adminAnalyticsAdoption: (actorId: string, query: AdminAnalyticsAdoptionQuery) =>
    [...reportingQueryKeys.all(actorId), 'admin-analytics-adoption', query] as const,
};
