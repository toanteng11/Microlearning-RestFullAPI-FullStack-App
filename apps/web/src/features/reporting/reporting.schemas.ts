import { z } from 'zod';

const nullableDateTime = z.iso.datetime({ offset: true }).nullable();
const percentage = z.number().min(0).max(100).nullable();
const progressStatus = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'MISSING', 'COMPLETED', 'LATE']);

const learningProgressSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).nullable(),
  startedAt: nullableDateTime,
  completedAt: nullableDateTime,
  lastActiveAt: nullableDateTime,
  derivedStatus: progressStatus,
});

const todoItemSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']),
  title: z.string(),
  classroom: z.object({ id: z.string(), name: z.string() }),
  course: z.object({ id: z.string(), title: z.string() }),
  module: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
  completionDeadline: z.iso.datetime({ offset: true }),
  defaultDeadline: z.iso.datetime({ offset: true }),
  effectiveDeadline: z.iso.datetime({ offset: true }),
  hasDeadlineException: z.boolean(),
  progress: learningProgressSchema,
  actionUrl: z.string(),
});

export const reportMetadataSchema = z.object({
  reportId: z.string(),
  definitionVersion: z.string(),
  sourceMetricVersion: z.string().nullable(),
  descriptorVersion: z.string().nullable(),
  dataState: z.enum(['READY', 'NO_DATA', 'SUPPRESSED']),
  timezone: z.string(),
  asOf: z.iso.datetime({ offset: true }),
  generatedAt: z.iso.datetime({ offset: true }),
  freshness: z.object({
    status: z.enum(['FRESH', 'STALE', 'PARTIAL', 'REBUILDING', 'FAILED']),
    recalculatedAt: nullableDateTime,
    sourceChangedAt: nullableDateTime,
    staleAfterSeconds: z.number().int().positive(),
    failedItemsCount: z.number().int().nonnegative(),
  }),
  filters: z.record(z.string(), z.unknown()),
});

export const studentCourseProgressSchema = z.object({
  classroom: z.object({ id: z.string(), name: z.string() }),
  course: z.object({ id: z.string(), title: z.string() }),
  requiredActivityCount: z.number().int().nonnegative(),
  completedRequiredCount: z.number().int().nonnegative(),
  progressPercentage: percentage,
  processScore: percentage,
  progressStatus,
  missingCount: z.number().int().nonnegative(),
  lateCount: z.number().int().nonnegative(),
  returnedGradeAverage: percentage,
  lastActiveAt: nullableDateTime,
  courseCompleted: z.boolean(),
  actionUrl: z.string(),
  recalculatedAt: z.iso.datetime({ offset: true }),
});

const returnedGradeSchema = z.object({
  gradeId: z.string(),
  activityId: z.string(),
  activityType: z.enum(['QUIZ', 'ASSIGNMENT']),
  activityTitle: z.string(),
  score: z.number(),
  maxScore: z.number().positive(),
  normalizedScore: z.number().min(0).max(100),
  returnedAt: z.iso.datetime({ offset: true }),
  actionUrl: z.string(),
});

export const studentReportingDashboardEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    summary: z.object({
      activeClassroomCount: z.number().int().nonnegative(),
      activeCourseCount: z.number().int().nonnegative(),
      pendingCount: z.number().int().nonnegative(),
      dueSoonCount: z.number().int().nonnegative(),
      missingCount: z.number().int().nonnegative(),
    }),
    todo: z.object({
      items: z.array(todoItemSchema),
      totalItems: z.number().int().nonnegative(),
      scopeVersion: z.literal('P05_MIXED_ACTIVITY_TODO_V2'),
    }),
    courses: z.array(studentCourseProgressSchema),
    recentGrades: z.array(returnedGradeSchema),
    reporting: reportMetadataSchema,
  }),
});

export const studentCourseProgressEnvelopeSchema = z.object({
  success: z.literal(true),
  data: studentCourseProgressSchema.extend({
    metricVersion: z.string(),
    descriptorVersion: z.string(),
    reporting: reportMetadataSchema,
  }),
});

const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const studentCourseProgressListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(studentCourseProgressSchema),
    reporting: reportMetadataSchema,
  }),
  meta: paginationSchema,
});
