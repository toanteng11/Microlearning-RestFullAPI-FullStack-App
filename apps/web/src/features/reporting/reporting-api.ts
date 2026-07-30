import type { AuthContextValue } from '../../shared/auth/auth-context';
import {
  studentCourseProgressEnvelopeSchema,
  studentCourseProgressListEnvelopeSchema,
  studentReportingDashboardEnvelopeSchema,
} from './reporting.schemas';
import type {
  StudentCourseProgressEnvelope,
  StudentCourseProgressListEnvelope,
  StudentCourseProgressQuery,
  StudentReportingDashboardEnvelope,
} from './reporting.types';

type Request = AuthContextValue['request'];

export async function getStudentReportingDashboard(
  request: Request,
): Promise<StudentReportingDashboardEnvelope> {
  const response = await request<unknown>(
    '/students/me/dashboard?todoLimit=5&courseLimit=5&gradeLimit=5',
  );
  return studentReportingDashboardEnvelopeSchema.parse(
    response,
  ) as StudentReportingDashboardEnvelope;
}

export async function listStudentCourseProgress(
  request: Request,
  query: StudentCourseProgressQuery,
): Promise<StudentCourseProgressListEnvelope> {
  const search = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  if (query.progressStatus) search.set('progressStatus', query.progressStatus);
  const response = await request<unknown>(`/students/me/progress/courses?${search.toString()}`);
  return studentCourseProgressListEnvelopeSchema.parse(
    response,
  ) as StudentCourseProgressListEnvelope;
}

export async function getStudentCourseProgress(
  request: Request,
  courseId: string,
): Promise<StudentCourseProgressEnvelope> {
  const search = new URLSearchParams({ courseId });
  const response = await request<unknown>(`/students/me/progress?${search.toString()}`);
  return studentCourseProgressEnvelopeSchema.parse(response) as StudentCourseProgressEnvelope;
}
