import { lazy } from 'react';

export const TeacherClassroomsPage = lazy(async () => ({
  default: (await import('./pages/TeacherClassroomsPage')).TeacherClassroomsPage,
}));
export const TeacherClassroomDetailPage = lazy(async () => ({
  default: (await import('./pages/TeacherClassroomDetailPage')).TeacherClassroomDetailPage,
}));
export const StudentClassroomsPage = lazy(async () => ({
  default: (await import('./pages/StudentClassroomsPage')).StudentClassroomsPage,
}));
export const StudentClassroomDetailPage = lazy(async () => ({
  default: (await import('./pages/StudentClassroomDetailPage')).StudentClassroomDetailPage,
}));
export const InviteJoinPage = lazy(async () => ({
  default: (await import('./pages/InviteJoinPage')).InviteJoinPage,
}));
export const AdminEnrollmentPolicyPage = lazy(async () => ({
  default: (await import('./pages/AdminEnrollmentPolicyPage')).AdminEnrollmentPolicyPage,
}));
export const AdminClassroomsPage = lazy(async () => ({
  default: (await import('./pages/AdminClassroomsPage')).AdminClassroomsPage,
}));
export const AdminClassroomDetailPage = lazy(async () => ({
  default: (await import('./pages/AdminClassroomDetailPage')).AdminClassroomDetailPage,
}));
