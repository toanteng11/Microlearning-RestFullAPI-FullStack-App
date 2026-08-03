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

const adminUserStatusCountsSchema = z
  .object({
    total: z.number().int().nonnegative(),
    PENDING: z.number().int().nonnegative(),
    ACTIVE: z.number().int().nonnegative(),
    INACTIVE: z.number().int().nonnegative(),
    BLOCKED: z.number().int().nonnegative(),
    DELETED: z.number().int().nonnegative(),
  })
  .strict();
const adminUsersByRoleSchema = z
  .object({
    STUDENT: adminUserStatusCountsSchema,
    TEACHER: adminUserStatusCountsSchema,
    ADMIN: adminUserStatusCountsSchema,
    SUPER_ADMIN: adminUserStatusCountsSchema,
  })
  .strict();
const registrationSourceCountsSchema = z
  .object({
    SELF_REGISTRATION: z.number().int().nonnegative(),
    TEACHER_INVITATION: z.number().int().nonnegative(),
    ADMIN_BOOTSTRAP: z.number().int().nonnegative(),
  })
  .strict();
const invitationCountsSchema = z
  .object({
    PENDING: z.number().int().nonnegative(),
    ACCEPTED: z.number().int().nonnegative(),
    EXPIRED: z.number().int().nonnegative(),
    REVOKED: z.number().int().nonnegative(),
  })
  .strict();
const classroomCountsSchema = z
  .object({
    ACTIVE: z.number().int().nonnegative(),
    LOCKED: z.number().int().nonnegative(),
    ARCHIVED: z.number().int().nonnegative(),
  })
  .strict();
const courseCountsSchema = z
  .object({
    DRAFT: z.number().int().nonnegative(),
    SCHEDULED: z.number().int().nonnegative(),
    PUBLISHED: z.number().int().nonnegative(),
    UNPUBLISHED: z.number().int().nonnegative(),
    ARCHIVED: z.number().int().nonnegative(),
  })
  .strict();
const adminAuditSummarySchema = z
  .object({
    id: z.string(),
    actorId: z.string().nullable(),
    actorRole: z.enum(['STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM']),
    action: z.string().min(1).max(100),
    resourceType: z.string().min(1).max(100),
    resourceId: z.string().min(1).max(100),
    requestId: z.string().min(1).max(200),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const adminDashboardEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        users: adminUsersByRoleSchema,
        registrationSources: registrationSourceCountsSchema,
        invitations: invitationCountsSchema,
        classrooms: classroomCountsSchema,
        courses: courseCountsSchema,
        activeEnrollmentCount: z.number().int().nonnegative(),
        recentGovernanceEvents: z.array(adminAuditSummarySchema).max(20),
        allowedActions: z.array(z.string()).default([]),
        reporting: reportMetadataSchema,
      })
      .strict(),
  })
  .strict();

export const adminGovernanceEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        users: adminUsersByRoleSchema,
        registrationSources: registrationSourceCountsSchema,
        invitations: invitationCountsSchema,
        classrooms: classroomCountsSchema,
        courses: courseCountsSchema,
        enrollments: z
          .object({
            ACTIVE: z.number().int().nonnegative(),
            REMOVED: z.number().int().nonnegative(),
            LEFT: z.number().int().nonnegative(),
            BLOCKED: z.number().int().nonnegative(),
          })
          .strict(),
        allowedActions: z.array(z.string()).default([]),
        reporting: reportMetadataSchema,
      })
      .strict(),
  })
  .strict();

export const adminAuditEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(adminAuditSummarySchema).max(50),
        reporting: reportMetadataSchema,
      })
      .strict(),
    meta: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive().max(50),
      totalItems: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
  })
  .strict();

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
  allowedActions: z.array(z.string()).default([]),
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

const teacherStudentSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  studentCode: z.string().nullable(),
});

export const teacherProgressRowSchema = z.object({
  rank: z.number().int().positive(),
  student: teacherStudentSchema,
  requiredActivityCount: z.number().int().nonnegative(),
  completedRequiredCount: z.number().int().nonnegative(),
  progressPercentage: percentage,
  processScore: percentage,
  progressStatus,
  returnedGradeAverage: percentage,
  missingCount: z.number().int().nonnegative(),
  lateCount: z.number().int().nonnegative(),
  ungradedCount: z.number().int().nonnegative(),
  lastActiveAt: nullableDateTime,
  courseCompleted: z.boolean(),
  supportFlags: z.array(
    z.enum([
      'HAS_MISSING_WORK',
      'HAS_UNGRADED_WORK',
      'NO_RECENT_ACTIVITY',
      'NO_REQUIRED_ACTIVITY',
      'PARTIAL_DATA',
    ]),
  ),
  allowedActions: z.array(z.string()),
});

export const teacherActivityAnalyticsRowSchema = z.object({
  activityId: z.string(),
  activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']),
  title: z.string(),
  isRequired: z.boolean(),
  lifecycleStatus: z.string(),
  defaultDeadline: nullableDateTime,
  deadlineStatus: z.enum(['NO_DEADLINE', 'UPCOMING', 'DUE_SOON', 'OVERDUE']),
  position: z.number().int().nonnegative(),
  eligibleStudentCount: z.number().int().nonnegative(),
  completedStudentCount: z.number().int().nonnegative(),
  missingStudentCount: z.number().int().nonnegative(),
  lateStudentCount: z.number().int().nonnegative(),
  ungradedStudentCount: z.number().int().nonnegative(),
  completionPercentage: percentage,
  returnedGradeAverage: percentage,
  actionUrl: z.string(),
});

export const teacherAssessmentAnalyticsRowSchema = z.object({
  activityId: z.string(),
  activityType: z.enum(['QUIZ', 'ASSIGNMENT']),
  title: z.string(),
  lifecycleStatus: z.string(),
  position: z.number().int().nonnegative(),
  eligibleStudentCount: z.number().int().nonnegative(),
  notStartedCount: z.number().int().nonnegative(),
  inProgressCount: z.number().int().nonnegative(),
  submittedCount: z.number().int().nonnegative(),
  needsReviewCount: z.number().int().nonnegative(),
  draftGradeCount: z.number().int().nonnegative(),
  returnedCount: z.number().int().nonnegative(),
  missingCount: z.number().int().nonnegative(),
  lateCount: z.number().int().nonnegative(),
  submissionPercentage: percentage,
  returnedGradeAverage: percentage,
  scoreDistribution: z.array(
    z.object({ bucket: z.string(), count: z.number().int().nonnegative() }),
  ),
  actionUrl: z.string(),
});

const courseIdentitySchema = z.object({ id: z.string(), title: z.string() });

export const teacherReportingDashboardEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    course: z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      classroomId: z.string(),
      classroomName: z.string(),
    }),
    summary: z.object({
      totalActivityCount: z.number().int().nonnegative(),
      publishedActivityCount: z.number().int().nonnegative(),
      requiredActivityCount: z.number().int().nonnegative(),
      activeStudentCount: z.number().int().nonnegative(),
      averageProgressPercentage: percentage,
      averageReturnedGrade: percentage,
      missingActivityCount: z.number().int().nonnegative(),
      lateActivityCount: z.number().int().nonnegative(),
      ungradedActivityCount: z.number().int().nonnegative(),
    }),
    topActivities: z.array(teacherActivityAnalyticsRowSchema),
    topStudents: z.array(teacherProgressRowSchema),
    allowedActions: z.array(z.string()).default([]),
    reporting: reportMetadataSchema,
  }),
});

export const teacherProgressListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    course: courseIdentitySchema,
    items: z.array(teacherProgressRowSchema),
    reporting: reportMetadataSchema,
  }),
  meta: paginationSchema,
});

export const teacherActivityListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    course: courseIdentitySchema,
    items: z.array(teacherActivityAnalyticsRowSchema),
    reporting: reportMetadataSchema,
  }),
  meta: paginationSchema,
});

export const teacherAssessmentListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    course: courseIdentitySchema,
    items: z.array(teacherAssessmentAnalyticsRowSchema),
    reporting: reportMetadataSchema,
  }),
  meta: paginationSchema,
});

export const teacherStudentProgressEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    student: teacherStudentSchema,
    summary: teacherProgressRowSchema.omit({ rank: true, student: true, allowedActions: true }),
    activities: z.array(
      z.object({
        activityId: z.string(),
        activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']),
        title: z.string(),
        completionStatus: z.enum([
          'NOT_APPLICABLE',
          'NOT_STARTED',
          'IN_PROGRESS',
          'MISSING',
          'COMPLETED',
          'LATE',
        ]),
        gradingStatus: z.enum(['NOT_GRADABLE', 'NOT_READY', 'AWAITING_GRADE', 'DRAFT', 'RETURNED']),
        effectiveDeadline: nullableDateTime,
        completedAt: nullableDateTime,
        score: z.number().nullable(),
        maxScore: z.number().positive().nullable(),
        actionUrl: z.string(),
      }),
    ),
    reporting: reportMetadataSchema,
  }),
});

const gradebookCompletionStatusSchema = z.enum([
  'NOT_APPLICABLE',
  'NOT_STARTED',
  'IN_PROGRESS',
  'MISSING',
  'COMPLETED',
  'LATE',
]);
const gradebookGradingStatusSchema = z.enum([
  'NOT_GRADABLE',
  'NOT_READY',
  'AWAITING_GRADE',
  'DRAFT',
  'RETURNED',
]);
const gradebookColumnSchema = z.object({
  activityId: z.string(),
  activityType: z.enum(['LESSON', 'QUIZ', 'ASSIGNMENT']),
  title: z.string(),
  isRequired: z.boolean(),
  maxScore: z.number().nonnegative().nullable(),
  effectiveDefaultDeadline: nullableDateTime,
  lifecycleStatus: z.string(),
  position: z.number().int().nonnegative(),
});
const gradebookCellSchema = z.object({
  activityId: z.string(),
  completionStatus: gradebookCompletionStatusSchema,
  gradingStatus: gradebookGradingStatusSchema,
  displayStatus: z.enum([
    'NOT_APPLICABLE',
    'NOT_STARTED',
    'IN_PROGRESS',
    'MISSING',
    'COMPLETED',
    'LATE',
    'AWAITING_GRADE',
    'DRAFT_GRADE',
    'RETURNED',
  ]),
  score: z.number().nonnegative().nullable(),
  maxScore: z.number().nonnegative().nullable(),
  normalizedScore: percentage,
  submittedAt: nullableDateTime,
  returnedAt: nullableDateTime,
  effectiveDeadline: nullableDateTime,
  isDeadlineExceptionApplied: z.boolean(),
  allowedActions: z.array(z.string()),
});

export const gradebookEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    course: courseIdentitySchema,
    columns: z.array(gradebookColumnSchema).max(50),
    rows: z
      .array(
        z.object({
          student: teacherStudentSchema,
          processScore: percentage,
          progressPercentage: percentage,
          returnedGradeAverage: percentage,
          missingCount: z.number().int().nonnegative(),
          lateCount: z.number().int().nonnegative(),
          cells: z.array(gradebookCellSchema).max(50),
        }),
      )
      .max(50),
    activityPage: z.object({
      limit: z.number().int().min(1).max(50),
      nextCursor: z.string().nullable(),
      truncated: z.boolean(),
    }),
    allowedActions: z.array(z.string()).default([]),
    reporting: reportMetadataSchema,
  }),
  meta: paginationSchema,
});

export const studentProgressTrendEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        course: z.object({ id: z.string(), title: z.string() }).strict(),
        points: z.array(
          z
            .object({
              capturedAt: z.iso.datetime({ offset: true }),
              progressPercentage: percentage,
              processScore: percentage,
              returnedGradeAverage: percentage,
              completedRequiredCount: z.number().int().nonnegative(),
              requiredActivityCount: z.number().int().nonnegative(),
              missingCount: z.number().int().nonnegative(),
              lateCount: z.number().int().nonnegative(),
            })
            .strict(),
        ),
        change: z
          .object({
            progressPercentage: z.number().nullable(),
            processScore: z.number().nullable(),
            returnedGradeAverage: z.number().nullable(),
          })
          .strict(),
        noDataReason: z.enum(['INSUFFICIENT_SNAPSHOTS', 'INCOMPATIBLE_VERSION']).nullable(),
        reporting: reportMetadataSchema,
      })
      .strict(),
  })
  .strict();

const protectedAggregateState = z.enum(['READY', 'SUPPRESSED']);
export const adminLearningOutcomeEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(
          z
            .object({
              course: z.object({ id: z.string(), title: z.string(), status: z.string() }).strict(),
              studentCountBucket: z.string(),
              averageProgressPercentage: percentage,
              completionPercentage: percentage,
              returnedGradeAverage: percentage,
              missingActivityCount: z.number().int().nonnegative().nullable(),
              lateActivityCount: z.number().int().nonnegative().nullable(),
              dataState: protectedAggregateState,
              suppressionReason: z.literal('SMALL_GROUP').nullable(),
            })
            .strict(),
        ),
        reporting: reportMetadataSchema,
      })
      .strict(),
  })
  .strict();

export const adminAnalyticsAdoptionEnvelopeSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        items: z.array(
          z
            .object({
              periodStart: z.iso.datetime({ offset: true }),
              eventName: z.string(),
              actorRole: z.string(),
              eventCount: z.number().int().nonnegative().nullable(),
              distinctActorCountBucket: z.string(),
              dataState: protectedAggregateState,
              suppressionReason: z.literal('SMALL_GROUP').nullable(),
            })
            .strict(),
        ),
        reporting: reportMetadataSchema,
      })
      .strict(),
  })
  .strict();
