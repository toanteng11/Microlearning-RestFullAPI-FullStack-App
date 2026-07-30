import { lazy } from 'react';

export const StudentReportingDashboardPage = lazy(async () => ({
  default: (await import('./pages/StudentReportingDashboardPage')).StudentReportingDashboardPage,
}));

export const StudentProgressPage = lazy(async () => ({
  default: (await import('./pages/StudentProgressPage')).StudentProgressPage,
}));

export const TeacherRankingPage = lazy(async () => ({
  default: (await import('./pages/TeacherRankingPage')).TeacherRankingPage,
}));

export const TeacherStudentDetailPage = lazy(async () => ({
  default: (await import('./pages/TeacherStudentDetailPage')).TeacherStudentDetailPage,
}));

export const TeacherGradebookPage = lazy(async () => ({
  default: (await import('./pages/TeacherGradebookPage')).TeacherGradebookPage,
}));
