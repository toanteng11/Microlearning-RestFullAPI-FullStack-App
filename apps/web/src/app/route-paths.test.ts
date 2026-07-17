import { describe, expect, it } from 'vitest';

import { dashboardForRole } from './route-paths';

describe('dashboardForRole', () => {
  it.each([
    ['STUDENT', '/student/dashboard'],
    ['TEACHER', '/teacher/dashboard'],
    ['ADMIN', '/admin/dashboard'],
    ['SUPER_ADMIN', '/admin/dashboard'],
  ] as const)('maps %s to its authorized dashboard', (role, expectedPath) => {
    expect(dashboardForRole(role)).toBe(expectedPath);
  });
});
