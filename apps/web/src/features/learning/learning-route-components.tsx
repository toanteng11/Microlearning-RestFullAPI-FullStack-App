import { lazy } from 'react';

export const StudentTodoPage = lazy(async () => ({
  default: (await import('./pages/StudentTodoPage')).StudentTodoPage,
}));
export const StudentDeadlinePage = lazy(async () => ({
  default: (await import('./pages/StudentDeadlinePage')).StudentDeadlinePage,
}));
export const StudentCoursePage = lazy(async () => ({
  default: (await import('./pages/StudentCoursePage')).StudentCoursePage,
}));
export const StudentLessonPlayerPage = lazy(async () => ({
  default: (await import('./pages/StudentLessonPlayerPage')).StudentLessonPlayerPage,
}));
export const TeacherCourseCreatePage = lazy(async () => ({
  default: (await import('./pages/TeacherCourseCreatePage')).TeacherCourseCreatePage,
}));
export const TeacherCourseDashboardPage = lazy(async () => ({
  default: (await import('./pages/TeacherCourseDashboardPage')).TeacherCourseDashboardPage,
}));
export const TeacherCourseContentPage = lazy(async () => ({
  default: (await import('./pages/TeacherCourseContentPage')).TeacherCourseContentPage,
}));
export const TeacherLessonCreatePage = lazy(async () => ({
  default: (await import('./pages/TeacherLessonCreatePage')).TeacherLessonCreatePage,
}));
export const TeacherLessonEditorPage = lazy(async () => ({
  default: (await import('./pages/TeacherLessonEditorPage')).TeacherLessonEditorPage,
}));
export const AdminCoursesPage = lazy(async () => ({
  default: (await import('./pages/AdminCoursesPage')).AdminCoursesPage,
}));
export const AdminCourseDetailPage = lazy(async () => ({
  default: (await import('./pages/AdminCourseDetailPage')).AdminCourseDetailPage,
}));
