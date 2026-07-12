import { createBrowserRouter } from 'react-router-dom';

import { SystemStatusPage } from '../features/system/SystemStatusPage';
import { NotFoundPage } from '../shared/components/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SystemStatusPage />,
  },
  {
    path: '/system-status',
    element: <SystemStatusPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
