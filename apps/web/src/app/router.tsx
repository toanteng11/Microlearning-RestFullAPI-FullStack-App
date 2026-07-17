import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ApplicationProviders } from './providers';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { AdminUserDetailPage } from '../features/admin-users/pages/AdminUserDetailPage';
import { AdminUserListPage } from '../features/admin-users/pages/AdminUserListPage';
import { AdminUsersPage } from '../features/admin-users/pages/AdminUsersPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import {
  AdminHomePage,
  StudentHomePage,
  TeacherHomePage,
} from '../features/role-home/RoleHomePage';
import { SystemStatusPage } from '../features/system/SystemStatusPage';
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
    element: <ApplicationProviders />,
    children: [
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
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
                <StudentHomePage />
              </RoleRoute>
            ),
          },
          {
            path: '/teacher/dashboard',
            element: (
              <RoleRoute roles={['TEACHER']}>
                <TeacherHomePage />
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
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
