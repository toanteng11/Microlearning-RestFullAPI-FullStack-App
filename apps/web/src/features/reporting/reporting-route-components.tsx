import { lazy } from 'react';

export const StudentReportingDashboardPage = lazy(async () => ({
  default: (await import('./pages/StudentReportingDashboardPage')).StudentReportingDashboardPage,
}));

export const StudentProgressPage = lazy(async () => ({
  default: (await import('./pages/StudentProgressPage')).StudentProgressPage,
}));
