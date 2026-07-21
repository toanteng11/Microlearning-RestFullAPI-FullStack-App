import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ApplicationProviders } from './providers';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { AdminUserDetailPage } from '../features/admin-users/pages/AdminUserDetailPage';
import { AdminUserListPage } from '../features/admin-users/pages/AdminUserListPage';
import { AdminUsersPage } from '../features/admin-users/pages/AdminUsersPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { AdminTeacherInvitationDetailPage } from '../features/teacher-invitations/pages/AdminTeacherInvitationDetailPage';
import { AdminTeacherInvitationsPage } from '../features/teacher-invitations/pages/AdminTeacherInvitationsPage';
import { TeacherInvitationActivationPage } from '../features/teacher-invitations/pages/TeacherInvitationActivationPage';
import { AdminHomePage } from '../features/role-home/RoleHomePage';
import {
  AdminClassroomDetailPage,
  AdminClassroomsPage,
  AdminEnrollmentPolicyPage,
  InviteJoinPage,
  StudentClassroomDetailPage,
  StudentClassroomsPage,
  TeacherClassroomDetailPage,
  TeacherClassroomsPage,
} from '../features/classrooms/classroom-route-components';
import { SystemStatusPage } from '../features/system/SystemStatusPage';
import {
  AdminCourseDetailPage,
  AdminCoursesPage,
  StudentCoursePage,
  StudentDeadlinePage,
  StudentLessonPlayerPage,
  StudentTodoPage,
  TeacherCourseContentPage,
  TeacherCourseCreatePage,
  TeacherCourseDashboardPage,
  TeacherLessonCreatePage,
  TeacherLessonEditorPage,
} from '../features/learning/learning-route-components';
import { ProtectedRoute } from '../shared/auth/ProtectedRoute';
import { RoleRoute } from '../shared/auth/RoleRoute';
import { AppShell } from '../shared/components/AppShell';
import { ForbiddenPage } from '../shared/components/ForbiddenPage';
import { NotFoundPage } from '../shared/components/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/system-status',
    element: <SystemStatusPage />,
  },
  {
    path: '/teacher/invite',
    element: <TeacherInvitationActivationPage />,
  },
  {
    element: <ApplicationProviders />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/join/invite', element: <InviteJoinPage /> },
      { path: '/forbidden', element: <ForbiddenPage /> },
      {
        element: (
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        ),
        children: [
          { path: '/profile', element: <ProfilePage /> },
          {
            path: '/student/dashboard',
            element: (
              <RoleRoute roles={['STUDENT']}>
                <StudentClassroomsPage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/dashboard',
            element: (
              <RoleRoute roles={['TEACHER']}>
                <TeacherClassroomsPage />
              </RoleRoute>
            ),
          },
          {
            path: '/student/classrooms/:classroomId',
            element: (
              <RoleRoute roles={['STUDENT']}>
                <StudentClassroomDetailPage />
              </RoleRoute>
            ),
          },
          {
            path: '/student/todo',
            element: (
              <RoleRoute roles={['STUDENT']}>
                <StudentTodoPage />
              </RoleRoute>
            ),
          },
          {
            path: '/student/deadlines',
            element: (
              <RoleRoute roles={['STUDENT']}>
                <StudentDeadlinePage />
              </RoleRoute>
            ),
          },
          {
            path: '/student/courses/:courseId',
            element: (
              <RoleRoute roles={['STUDENT']}>
                <StudentCoursePage />
              </RoleRoute>
            ),
          },
          {
            path: '/student/lessons/:lessonId',
            element: (
              <RoleRoute roles={['STUDENT']}>
                <StudentLessonPlayerPage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/classrooms/:classroomId',
            element: (
              <RoleRoute roles={['TEACHER']}>
                <TeacherClassroomDetailPage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/classrooms/:classroomId/courses/new',
            element: (
              <RoleRoute permission="course.create">
                <TeacherCourseCreatePage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/courses/:courseId',
            element: (
              <RoleRoute permission="course.progress_view_owned">
                <TeacherCourseDashboardPage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/courses/:courseId/content',
            element: (
              <RoleRoute permission="course.update_owned">
                <TeacherCourseContentPage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/courses/:courseId/lessons/new',
            element: (
              <RoleRoute permission="lesson.manage_owned">
                <TeacherLessonCreatePage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/lessons/:lessonId/edit',
            element: (
              <RoleRoute permission="lesson.manage_owned">
                <TeacherLessonEditorPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/dashboard',
            element: (
              <RoleRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminHomePage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/users',
            element: (
              <RoleRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminUsersPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/users/students',
            element: (
              <RoleRoute permission="user.view_students">
                <AdminUserListPage scope="students" />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/users/teachers',
            element: (
              <RoleRoute permission="user.view_teachers">
                <AdminUserListPage scope="teachers" />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/users/admins',
            element: (
              <RoleRoute permission="user.view_admins">
                <AdminUserListPage scope="admins" />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/users/:userId',
            element: (
              <RoleRoute roles={['ADMIN', 'SUPER_ADMIN']}>
                <AdminUserDetailPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/teacher-invitations',
            element: (
              <RoleRoute permission="teacher_invitation.view">
                <AdminTeacherInvitationsPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/teacher-invitations/:invitationId',
            element: (
              <RoleRoute permission="teacher_invitation.view">
                <AdminTeacherInvitationDetailPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/classrooms',
            element: (
              <RoleRoute permission="classroom.governance.view">
                <AdminClassroomsPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/classrooms/:classroomId',
            element: (
              <RoleRoute permission="classroom.governance.view">
                <AdminClassroomDetailPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/courses',
            element: (
              <RoleRoute permission="content.governance_view">
                <AdminCoursesPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/courses/:courseId',
            element: (
              <RoleRoute permission="content.governance_view">
                <AdminCourseDetailPage />
              </RoleRoute>
            ),
          },
          {
            path: '/admin/settings/enrollment-policy',
            element: (
              <RoleRoute permission="enrollment_policy.view">
                <AdminEnrollmentPolicyPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
