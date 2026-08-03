import type { QueryClient } from '@tanstack/react-query';

import { reportingQueryKeys } from './reporting-query-keys';

export async function invalidateOwnedCourseReporting(
  queryClient: QueryClient,
  actorId: string | undefined,
  courseId: string | undefined,
) {
  if (!actorId || !courseId) return;
  const root = reportingQueryKeys.all(actorId);
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: reportingQueryKeys.teacherDashboard(actorId, courseId),
    }),
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        queryKey[0] === root[0] &&
        queryKey[1] === actorId &&
        [
          'teacher-progress',
          'teacher-activities',
          'teacher-assessments',
          'teacher-student',
        ].includes(String(queryKey[2])) &&
        queryKey[3] === courseId,
    }),
    queryClient.invalidateQueries({
      queryKey: reportingQueryKeys.teacherGradebooks(actorId, courseId),
    }),
  ]);
}
