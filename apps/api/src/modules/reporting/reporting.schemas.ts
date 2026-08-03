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
  ANALYTICS_EVENT_NAMES,
} from './reporting.constants.js';
import { CLASSROOM_STATUSES } from '../classrooms/classroom.types.js';
import { COMMON_CONTENT_STATUSES } from '../learning-content/content.types.js';
import { INVITATION_STATUSES } from '../teacher-invitations/teacher-invitation.model.js';
import { USER_ROLES, USER_STATUSES } from '../users/user.types.js';

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
const isoDateOrDateTime = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);

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

  const studentTrend = z
    .object({
      courseId: objectId,
      from: isoDateOrDateTime.optional(),
      to: isoDateOrDateTime.optional(),
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

  const adminDashboard = z
    .object({
      timezone: timezone.optional(),
      recentLimit: z.coerce.number().int().min(1).max(20).default(10),
    })
    .strict();

  const adminGovernance = z
    .object({
      from: isoDateOrDateTime.optional(),
      to: isoDateOrDateTime.optional(),
      timezone: timezone.optional(),
      role: z.enum(USER_ROLES).optional(),
      userStatus: z.enum(USER_STATUSES).optional(),
      invitationStatus: z.enum(INVITATION_STATUSES).optional(),
      classroomStatus: z.enum(CLASSROOM_STATUSES).optional(),
      courseStatus: z.enum(COMMON_CONTENT_STATUSES).optional(),
    })
    .strict();

  const adminAudit = z
    .object({
      page,
      limit,
      from: isoDateOrDateTime.optional(),
      to: isoDateOrDateTime.optional(),
      timezone: timezone.optional(),
      actorRole: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM']).optional(),
      action: normalizedSearch.optional(),
      resourceType: normalizedSearch.optional(),
      resourceId: normalizedSearch.optional(),
      sortOrder: z.enum(REPORTING_SORT_ORDERS).default('desc'),
    })
    .strict();

  const adminAdoption = z
    .object({
      from: isoDateOrDateTime.optional(),
      to: isoDateOrDateTime.optional(),
      timezone: timezone.optional(),
      interval: z.enum(['DAY', 'WEEK', 'MONTH']).default('DAY'),
    })
    .strict();

  const adminLearningOutcomes = z
    .object({
      from: isoDateOrDateTime.optional(),
      to: isoDateOrDateTime.optional(),
      timezone: timezone.optional(),
      courseStatus: z.enum(COMMON_CONTENT_STATUSES).optional(),
    })
    .strict();

  const analyticsProperties = z
    .object({
      reportId: z.string().trim().min(1).max(100).optional(),
      surface: z.string().trim().min(1).max(100).optional(),
      filterName: z.string().trim().min(1).max(100).optional(),
      tabName: z.string().trim().min(1).max(100).optional(),
      lifecycleStatus: z.string().trim().min(1).max(50).optional(),
      durationBucket: z.enum(['LT_10S', '10S_1M', '1M_5M', 'GT_5M']).optional(),
      rowCountBucket: z.enum(['0', '1_9', '10_49', '50_199', '200_PLUS']).optional(),
      result: z.enum(['SUCCESS', 'FAILED']).optional(),
      clientVersion: z.string().trim().min(1).max(50).optional(),
    })
    .strict();
  const analyticsEvent = z
    .object({
      eventId: z.uuid(),
      eventName: z.enum(ANALYTICS_EVENT_NAMES),
      schemaVersion: z.literal('1'),
      occurredAt: z.iso.datetime({ offset: true }),
      context: z
        .object({
          classroomId: objectId.optional(),
          courseId: objectId.optional(),
          activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']).optional(),
          activityId: objectId.optional(),
        })
        .strict()
        .default({}),
      properties: analyticsProperties.default({}),
    })
    .strict()
    .superRefine((event, context) => {
      if (event.context.activityId && (!event.context.courseId || !event.context.activityType)) {
        context.addIssue({
          code: 'custom',
          path: ['context', 'activityId'],
          message: 'activityId requires courseId and activityType',
        });
      }
      if (event.eventName.startsWith('report_') && !event.properties.reportId) {
        context.addIssue({
          code: 'custom',
          path: ['properties', 'reportId'],
          message: 'reportId is required for reporting events',
        });
      }
      if (event.eventName === 'report_filter_changed' && !event.properties.filterName) {
        context.addIssue({
          code: 'custom',
          path: ['properties', 'filterName'],
          message: 'filterName is required for report_filter_changed',
        });
      }
      if (event.eventName === 'report_tab_changed' && !event.properties.tabName) {
        context.addIssue({
          code: 'custom',
          path: ['properties', 'tabName'],
          message: 'tabName is required for report_tab_changed',
        });
      }
    });

  const teacherProgressExport = teacherProgress.omit({ page: true, limit: true });
  const gradebookExport = gradebook.omit({
    page: true,
    limit: true,
    activityCursor: true,
  });
  const adminAuditExport = adminAudit.omit({ page: true, limit: true });

  return Object.freeze({
    courseParams: z.object({ courseId: objectId }).strict(),
    teacherStudentParams: z.object({ courseId: objectId, studentId: objectId }).strict(),
    studentDashboard,
    studentCourseList,
    studentCourseDetail,
    studentTrend,
    teacherDashboard,
    teacherProgress,
    teacherActivities,
    teacherAssessments,
    teacherStudentDetail,
    gradebook,
    adminDashboard,
    adminGovernance,
    adminAudit,
    adminAdoption,
    adminLearningOutcomes,
    analyticsEvent,
    teacherProgressExport,
    gradebookExport,
    adminAuditExport,
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
export type StudentTrendQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['studentTrend']
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
export type AdminDashboardQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['adminDashboard']
>;
export type AdminGovernanceQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['adminGovernance']
>;
export type AdminAuditQuery = z.infer<ReturnType<typeof createReportingQuerySchemas>['adminAudit']>;
export type AdminAdoptionQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['adminAdoption']
>;
export type AdminLearningOutcomesQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['adminLearningOutcomes']
>;
export type AnalyticsEventInput = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['analyticsEvent']
>;
export type TeacherProgressExportQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['teacherProgressExport']
>;
export type GradebookExportQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['gradebookExport']
>;
export type AdminAuditExportQuery = z.infer<
  ReturnType<typeof createReportingQuerySchemas>['adminAuditExport']
>;
