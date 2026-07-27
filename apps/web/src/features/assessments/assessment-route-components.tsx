import { lazy } from 'react';

export const TeacherAssessmentsPage = lazy(async () => ({
  default: (await import('./pages/TeacherAssessmentsPage')).TeacherAssessmentsPage,
}));
export const TeacherQuizCreatePage = lazy(async () => ({
  default: (await import('./pages/TeacherQuizCreatePage')).TeacherQuizCreatePage,
}));
export const TeacherQuizBuilderPage = lazy(async () => ({
  default: (await import('./pages/TeacherQuizBuilderPage')).TeacherQuizBuilderPage,
}));
export const TeacherQuizPreviewPage = lazy(async () => ({
  default: (await import('./pages/TeacherQuizPreviewPage')).TeacherQuizPreviewPage,
}));
export const StudentQuizIntroPage = lazy(async () => ({
  default: (await import('./pages/StudentQuizIntroPage')).StudentQuizIntroPage,
}));
export const StudentQuizAttemptPage = lazy(async () => ({
  default: (await import('./pages/StudentQuizAttemptPage')).StudentQuizAttemptPage,
}));
export const StudentQuizResultPage = lazy(async () => ({
  default: (await import('./pages/StudentQuizResultPage')).StudentQuizResultPage,
}));
export const TeacherAssignmentCreatePage = lazy(async () => ({
  default: (await import('./pages/TeacherAssignmentCreatePage')).TeacherAssignmentCreatePage,
}));
export const TeacherAssignmentEditorPage = lazy(async () => ({
  default: (await import('./pages/TeacherAssignmentEditorPage')).TeacherAssignmentEditorPage,
}));
export const TeacherAssignmentSubmissionsPage = lazy(async () => ({
  default: (await import('./pages/TeacherAssignmentSubmissionsPage'))
    .TeacherAssignmentSubmissionsPage,
}));
export const StudentAssignmentPage = lazy(async () => ({
  default: (await import('./pages/StudentAssignmentPage')).StudentAssignmentPage,
}));
export const TeacherQuizResultsPage = lazy(async () => ({
  default: (await import('./pages/TeacherQuizResultsPage')).TeacherQuizResultsPage,
}));
export const TeacherQuizAttemptReviewPage = lazy(async () => ({
  default: (await import('./pages/TeacherQuizAttemptReviewPage')).TeacherQuizAttemptReviewPage,
}));
export const TeacherSubmissionGradingPage = lazy(async () => ({
  default: (await import('./pages/TeacherSubmissionGradingPage')).TeacherSubmissionGradingPage,
}));
export const StudentGradesPage = lazy(async () => ({
  default: (await import('./pages/StudentGradesPage')).StudentGradesPage,
}));
export const StudentGradeDetailPage = lazy(async () => ({
  default: (await import('./pages/StudentGradeDetailPage')).StudentGradeDetailPage,
}));
export const TeacherDeadlineExceptionsPage = lazy(async () => ({
  default: (await import('./pages/TeacherDeadlineExceptionsPage')).TeacherDeadlineExceptionsPage,
}));
