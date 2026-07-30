import type { AuthContextValue } from '../../shared/auth/auth-context';
import {
  studentCourseProgressEnvelopeSchema,
  studentCourseProgressListEnvelopeSchema,
  studentReportingDashboardEnvelopeSchema,
  gradebookEnvelopeSchema,
  teacherActivityListEnvelopeSchema,
  teacherAssessmentListEnvelopeSchema,
  teacherProgressListEnvelopeSchema,
  teacherReportingDashboardEnvelopeSchema,
  teacherStudentProgressEnvelopeSchema,
} from './reporting.schemas';
import type {
  StudentCourseProgressEnvelope,
  StudentCourseProgressListEnvelope,
  StudentCourseProgressQuery,
  StudentReportingDashboardEnvelope,
  GradebookEnvelope,
  GradebookQuery,
  TeacherActivityListEnvelope,
  TeacherActivityQuery,
  TeacherAssessmentListEnvelope,
  TeacherAssessmentQuery,
  TeacherProgressListEnvelope,
  TeacherProgressQuery,
  TeacherReportingDashboardEnvelope,
  TeacherStudentProgressEnvelope,
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

function setOptional(search: URLSearchParams, key: string, value: string | undefined) {
  if (value) search.set(key, value);
}

export async function getTeacherReportingDashboard(
  request: Request,
  courseId: string,
): Promise<TeacherReportingDashboardEnvelope> {
  const response = await request<unknown>(`/teacher/courses/${courseId}/dashboard`);
  return teacherReportingDashboardEnvelopeSchema.parse(
    response,
  ) as TeacherReportingDashboardEnvelope;
}

export async function listTeacherProgress(
  request: Request,
  courseId: string,
  query: TeacherProgressQuery,
): Promise<TeacherProgressListEnvelope> {
  const search = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  setOptional(search, 'search', query.search);
  setOptional(search, 'progressStatus', query.progressStatus);
  setOptional(search, 'supportFlag', query.supportFlag);
  const response = await request<unknown>(
    `/teacher/courses/${courseId}/progress?${search.toString()}`,
  );
  return teacherProgressListEnvelopeSchema.parse(response) as TeacherProgressListEnvelope;
}

export async function listTeacherActivities(
  request: Request,
  courseId: string,
  query: TeacherActivityQuery,
): Promise<TeacherActivityListEnvelope> {
  const search = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  setOptional(search, 'search', query.search);
  setOptional(search, 'activityType', query.activityType);
  const response = await request<unknown>(
    `/teacher/courses/${courseId}/activities?${search.toString()}`,
  );
  return teacherActivityListEnvelopeSchema.parse(response) as TeacherActivityListEnvelope;
}

export async function listTeacherAssessments(
  request: Request,
  courseId: string,
  query: TeacherAssessmentQuery,
): Promise<TeacherAssessmentListEnvelope> {
  const search = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  setOptional(search, 'search', query.search);
  setOptional(search, 'activityType', query.activityType);
  const response = await request<unknown>(
    `/teacher/courses/${courseId}/assessments?${search.toString()}`,
  );
  return teacherAssessmentListEnvelopeSchema.parse(response) as TeacherAssessmentListEnvelope;
}

export async function getTeacherStudentProgress(
  request: Request,
  courseId: string,
  studentId: string,
): Promise<TeacherStudentProgressEnvelope> {
  const response = await request<unknown>(
    `/teacher/courses/${courseId}/students/${studentId}/progress`,
  );
  return teacherStudentProgressEnvelopeSchema.parse(response) as TeacherStudentProgressEnvelope;
}

export async function getTeacherGradebook(
  request: Request,
  courseId: string,
  query: GradebookQuery,
): Promise<GradebookEnvelope> {
  const search = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
    activityLimit: String(query.activityLimit),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });
  setOptional(search, 'search', query.search);
  setOptional(search, 'activityType', query.activityType);
  setOptional(search, 'completionStatus', query.completionStatus);
  setOptional(search, 'gradingStatus', query.gradingStatus);
  setOptional(search, 'moduleId', query.moduleId);
  setOptional(search, 'activityCursor', query.activityCursor);
  const response = await request<unknown>(
    `/teacher/courses/${courseId}/gradebook?${search.toString()}`,
  );
  return gradebookEnvelopeSchema.parse(response) as GradebookEnvelope;
}
