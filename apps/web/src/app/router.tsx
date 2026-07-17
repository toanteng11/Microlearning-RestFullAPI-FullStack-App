import { Navigate, createBrowserRouter } from 'react-router-dom';

import { ApplicationProviders } from './providers';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
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
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
