import { lazy } from 'react';

export const StudentReportingDashboardPage = lazy(async () => ({
  default: (await import('./pages/StudentReportingDashboardPage')).StudentReportingDashboardPage,
}));

export const StudentProgressPage = lazy(async () => ({
  default: (await import('./pages/StudentProgressPage')).StudentProgressPage,
}));

export const StudentProgressTrendPage = lazy(async () => ({
  default: (await import('./pages/StudentProgressTrendPage')).StudentProgressTrendPage,
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

export const AdminReportingDashboardPage = lazy(async () => ({
  default: (await import('./pages/AdminReportingDashboardPage')).AdminReportingDashboardPage,
}));

export const AdminGovernanceReportPage = lazy(async () => ({
  default: (await import('./pages/AdminGovernanceReportPage')).AdminGovernanceReportPage,
}));

export const AdminLearningOutcomesPage = lazy(async () => ({
  default: (await import('./pages/AdminLearningOutcomesPage')).AdminLearningOutcomesPage,
}));

export const AdminAnalyticsAdoptionPage = lazy(async () => ({
  default: (await import('./pages/AdminAnalyticsAdoptionPage')).AdminAnalyticsAdoptionPage,
}));
