import { isValidObjectId } from 'mongoose';
import { z } from 'zod';

import {
  REPORT_DATA_STATES,
  REPORT_FRESHNESS_STATUSES,
  REPORTING_ACTIVITY_STATUSES,
  REPORTING_ALLOWED_ACTIONS,
  REPORTING_GRADING_STATUSES,
  REPORTING_PROGRESS_STATUSES,
  REPORTING_SORT_ORDERS,
  REPORTING_SUPPORT_FLAGS,
} from './reporting.constants.js';

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId');
const normalizedSearch = z
  .string()
  .transform((value) => value.normalize('NFKC').trim().replace(/\s+/gu, ' '))
  .pipe(z.string().min(1).max(100));
const strictBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const reportingTimezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(isValidIanaTimezone, 'Invalid IANA timezone');

export const reportMetadataSchema = z
  .object({
    reportId: z.string().min(1).max(100),
    definitionVersion: z.string().min(1).max(100),
    sourceMetricVersion: z.string().min(1).max(100).nullable(),
    descriptorVersion: z.string().min(1).max(100).nullable(),
    dataState: z.enum(REPORT_DATA_STATES),
    timezone: reportingTimezoneSchema,
    asOf: z.iso.datetime({ offset: true }),
    generatedAt: z.iso.datetime({ offset: true }),
    freshness: z
      .object({
        status: z.enum(REPORT_FRESHNESS_STATUSES),
        recalculatedAt: z.iso.datetime({ offset: true }).nullable(),
        sourceChangedAt: z.iso.datetime({ offset: true }).nullable(),
        staleAfterSeconds: z.number().int().positive(),
        failedItemsCount: z.number().int().nonnegative(),
      })
      .strict(),
    filters: z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
    ),
  })
  .strict();

export function createReportingQuerySchemas(options: {
  pageMax: number;
  gradebookActivityMax: number;
  maxDateRangeDays: number;
  defaultTimezone: string;
}) {
  const page = z.coerce.number().int().min(1).default(1);
  const limit = z.coerce.number().int().min(1).max(options.pageMax).default(20);
  const timezone = reportingTimezoneSchema.default(options.defaultTimezone);

  const studentDashboard = z
    .object({
      todoLimit: z.coerce.number().int().min(1).max(10).default(5),
      courseLimit: z.coerce.number().int().min(1).max(10).default(5),
      gradeLimit: z.coerce.number().int().min(1).max(10).default(5),
      timezone: timezone.optional(),
    })
    .strict();

  const studentCourseList = z
    .object({
      page,
      limit,
      progressStatus: z.enum(REPORTING_PROGRESS_STATUSES).optional(),
      sortBy: z.enum(['courseTitle', 'processScore', 'lastActiveAt']).default('lastActiveAt'),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('desc'),
    })
    .strict();

  const studentCourseDetail = z
    .object({
      courseId: objectId,
      timezone: timezone.optional(),
    })
    .strict();

  const teacherProgress = z
    .object({
      page,
      limit,
      search: normalizedSearch.optional(),
      progressStatus: z.enum(REPORTING_PROGRESS_STATUSES).optional(),
      supportFlag: z.enum(REPORTING_SUPPORT_FLAGS).optional(),
      sortBy: z
        .enum([
          'processScore',
          'progressPercentage',
          'returnedGradeAverage',
          'missingActivityCount',
          'lateActivityCount',
          'lastActiveAt',
          'fullName',
        ])
        .default('processScore'),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('desc'),
    })
    .strict();

  const teacherDashboard = z
    .object({
      timezone: timezone.optional(),
    })
    .strict();

  const teacherActivities = z
    .object({
      page,
      limit,
      search: normalizedSearch.optional(),
      activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']).optional(),
      isRequired: strictBoolean.optional(),
      lifecycleStatus: z
        .enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'CLOSED', 'ARCHIVED'])
        .optional(),
      deadlineStatus: z.enum(['NO_DEADLINE', 'UPCOMING', 'DUE_SOON', 'OVERDUE']).optional(),
      sortBy: z
        .enum(['position', 'deadline', 'completionPercentage', 'missingCount', 'title'])
        .default('position'),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('asc'),
    })
    .strict();

  const teacherAssessments = z
    .object({
      page,
      limit,
      search: normalizedSearch.optional(),
      activityType: z.enum(['QUIZ', 'ASSIGNMENT']).optional(),
      lifecycleStatus: z
        .enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'CLOSED', 'ARCHIVED'])
        .optional(),
      sortBy: z
        .enum(['position', 'title', 'submissionPercentage', 'returnedGradeAverage', 'missingCount'])
        .default('position'),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('asc'),
    })
    .strict();

  const teacherStudentDetail = z
    .object({
      timezone: timezone.optional(),
    })
    .strict();

  const gradebook = z
    .object({
      page,
      limit,
      search: normalizedSearch.optional(),
      activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']).optional(),
      completionStatus: z.enum(REPORTING_ACTIVITY_STATUSES).optional(),
      gradingStatus: z.enum(REPORTING_GRADING_STATUSES).optional(),
      moduleId: objectId.optional(),
      activityLimit: z.coerce
        .number()
        .int()
        .min(1)
        .max(options.gradebookActivityMax)
        .default(Math.min(25, options.gradebookActivityMax)),
      activityCursor: z.string().trim().min(1).max(500).optional(),
      sortBy: z
        .enum([
          'processScore',
          'progressPercentage',
          'returnedGradeAverage',
          'missingCount',
          'lateCount',
          'fullName',
        ])
        .default('processScore'),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('desc'),
    })
    .strict();

  const adminAudit = z
    .object({
      page,
      limit,
      from: z.iso.datetime({ offset: true }).optional(),
      to: z.iso.datetime({ offset: true }).optional(),
      timezone: timezone.optional(),
      actorRole: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM']).optional(),
      action: normalizedSearch.optional(),
      resourceType: normalizedSearch.optional(),
      resourceId: normalizedSearch.optional(),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('desc'),
    })
    .strict()
    .superRefine((value, context) => {
      if (!value.from || !value.to) return;
      const from = new Date(value.from);
      const to = new Date(value.to);
      if (from >= to) {
        context.addIssue({ code: 'custom', path: ['to'], message: 'to must be after from' });
        return;
      }
      const rangeDays = (to.getTime() - from.getTime()) / 86_400_000;
      if (rangeDays > options.maxDateRangeDays) {
        context.addIssue({
          code: 'custom',
          path: ['to'],
          message: `date range must not exceed ${options.maxDateRangeDays} days`,
        });
      }
    });

  return Object.freeze({
    courseParams: z.object({ courseId: objectId }).strict(),
    teacherStudentParams: z.object({ courseId: objectId, studentId: objectId }).strict(),
    studentDashboard,
    studentCourseList,
    studentCourseDetail,
    teacherDashboard,
    teacherProgress,
    teacherActivities,
    teacherAssessments,
    teacherStudentDetail,
    gradebook,
    adminAudit,
    allowedActions: z.array(z.enum(REPORTING_ALLOWED_ACTIONS)),
  });
}

export type StudentDashboardQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['studentDashboard']
>;
export type StudentCourseListQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['studentCourseList']
>;
export type StudentCourseDetailQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['studentCourseDetail']
>;
export type TeacherProgressQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['teacherProgress']
>;
export type TeacherDashboardQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['teacherDashboard']
>;
export type TeacherActivityQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['teacherActivities']
>;
export type TeacherAssessmentQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['teacherAssessments']
>;
export type TeacherStudentDetailQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['teacherStudentDetail']
>;
export type GradebookQuery = z.infer<ReturnType<typeof createReportingQuerySchemas>['gradebook']>;
