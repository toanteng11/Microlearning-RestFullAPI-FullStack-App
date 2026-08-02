# Phase 06 Report DTO And Query Contracts

## 1. Shared Types

```ts
type ReportFreshnessStatus = 'FRESH' | 'STALE' | 'PARTIAL' | 'REBUILDING' | 'FAILED';
type ReportDataState = 'READY' | 'NO_DATA' | 'SUPPRESSED';
type ReportFilterValue = string | number | boolean | null | readonly string[];
type ReportingProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'MISSING' | 'COMPLETED' | 'LATE';
type ReportingSupportFlag =
  | 'HAS_MISSING_WORK'
  | 'HAS_UNGRADED_WORK'
  | 'NO_RECENT_ACTIVITY'
  | 'NO_REQUIRED_ACTIVITY'
  | 'PARTIAL_DATA';
type ReportingAllowedAction =
  | 'OPEN_ACTIVITY'
  | 'VIEW_RETURNED_RESULT'
  | 'VIEW_STUDENT_PROGRESS'
  | 'OPEN_GRADING'
  | 'EXPORT_REPORT'
  | 'VIEW_SOURCE_LIST';
type CommonContentLifecycleStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'ARCHIVED';
type ReportActivityLifecycleStatus = CommonContentLifecycleStatus | 'CLOSED';
type ReportingActivityDeadlineStatus = 'NO_DEADLINE' | 'UPCOMING' | 'DUE_SOON' | 'OVERDUE';

interface ReportMetadata {
  reportId: string;
  definitionVersion: string;
  sourceMetricVersion: string | null;
  descriptorVersion: string | null;
  dataState: ReportDataState;
  timezone: string;
  asOf: string;
  generatedAt: string;
  freshness: {
    status: ReportFreshnessStatus;
    recalculatedAt: string | null;
    sourceChangedAt: string | null;
    staleAfterSeconds: number;
    failedItemsCount: number;
  };
  filters: Record<string, ReportFilterValue>;
}
```

`NO_DATA` là response thành công. `SUPPRESSED` chỉ dùng privacy threshold. `FAILED` freshness
không được đi cùng fabricated metric values.

## 2. Student Dashboard DTO

```ts
interface StudentDashboardData {
  summary: {
    activeClassroomCount: number;
    activeCourseCount: number;
    pendingCount: number;
    dueSoonCount: number;
    missingCount: number;
  };
  todo: {
    items: StudentTodoItem[]; // P05_MIXED_ACTIVITY_TODO_V2
    totalItems: number;
  };
  courses: StudentCourseProgressSummary[];
  recentGrades: StudentReturnedGradeSummary[];
  reporting: ReportMetadata;
}

interface StudentCourseProgressSummary {
  classroom: { id: string; name: string };
  course: { id: string; title: string };
  requiredActivityCount: number;
  completedRequiredCount: number;
  progressPercentage: number | null;
  processScore: number | null;
  progressStatus: ReportingProgressStatus;
  missingCount: number;
  lateCount: number;
  returnedGradeAverage: number | null;
  lastActiveAt: string | null;
  courseCompleted: boolean;
  actionUrl: string;
}

interface StudentReturnedGradeSummary {
  gradeId: string;
  activityId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  activityTitle: string;
  score: number;
  maxScore: number;
  normalizedScore: number;
  returnedAt: string;
  actionUrl: string;
}
```

Dashboard defaults: To-do `5`, Course `5`, recent Grade `5`; each configurable max `10`.

## 3. Teacher Dashboard DTO

```ts
interface TeacherCourseDashboardData {
  course: {
    id: string;
    title: string;
    status: CommonContentLifecycleStatus;
    classroomId: string;
    classroomName: string;
  };
  summary: {
    totalActivityCount: number;
    publishedActivityCount: number;
    requiredActivityCount: number;
    activeStudentCount: number;
    averageProgressPercentage: number | null;
    averageReturnedGrade: number | null;
    missingActivityCount: number;
    lateActivityCount: number;
    ungradedActivityCount: number;
  };
  topActivities: TeacherActivityAnalyticsRow[];
  topStudents: TeacherProgressRow[];
  allowedActions: ReportingAllowedAction[];
  reporting: ReportMetadata;
}
```

## 4. Teacher Progress Row

```ts
interface TeacherProgressRow {
  rank: number;
  student: {
    id: string;
    fullName: string;
    email: string;
    studentCode: string | null;
  };
  requiredActivityCount: number;
  completedRequiredCount: number;
  progressPercentage: number | null;
  processScore: number | null;
  progressStatus: ReportingProgressStatus;
  returnedGradeAverage: number | null;
  missingCount: number;
  lateCount: number;
  ungradedCount: number;
  lastActiveAt: string | null;
  courseCompleted: boolean;
  supportFlags: ReportingSupportFlag[];
  allowedActions: ReportingAllowedAction[];
}
```

## 5. Activity Analytics Row

```ts
interface TeacherActivityAnalyticsRow {
  activityId: string;
  activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
  title: string;
  isRequired: boolean;
  lifecycleStatus: ReportActivityLifecycleStatus;
  defaultDeadline: string | null;
  eligibleStudentCount: number;
  completedStudentCount: number;
  missingStudentCount: number;
  lateStudentCount: number;
  ungradedStudentCount: number;
  completionPercentage: number | null;
  returnedGradeAverage: number | null;
  actionUrl: string;
}
```

## 6. Assessment Analytics DTO

```ts
interface AssessmentAnalyticsRow {
  activityId: string;
  activityType: 'QUIZ' | 'ASSIGNMENT';
  title: string;
  eligibleStudentCount: number;
  notStartedCount: number;
  inProgressCount: number;
  submittedCount: number;
  needsReviewCount: number;
  draftGradeCount: number;
  returnedCount: number;
  missingCount: number;
  lateCount: number;
  submissionPercentage: number | null;
  returnedGradeAverage: number | null;
  scoreDistribution: Array<{
    bucket: '0_49' | '50_64' | '65_79' | '80_89' | '90_100';
    count: number;
  }>;
}
```

Quiz mapping:

- `IN_PROGRESS` -> in progress;
- `SUBMITTED/TIMED_OUT/NEEDS_REVIEW/GRADED/RESULT_RELEASED` -> submitted;
- `NEEDS_REVIEW` -> needs review;
- current Grade `DRAFT` -> draft Grade;
- current Grade `RETURNED` -> returned.

Assignment mapping dùng current Submission status P05; Grade vẫn `DRAFT/RETURNED`.

## 7. Teacher Student Detail DTO

```ts
interface TeacherStudentProgressDetail {
  student: TeacherProgressRow['student'];
  summary: Omit<TeacherProgressRow, 'rank' | 'student' | 'allowedActions'>;
  activities: Array<{
    activityId: string;
    activityType: 'LESSON' | 'QUIZ' | 'ASSIGNMENT';
    title: string;
    completionStatus:
      | 'NOT_APPLICABLE'
      | 'NOT_STARTED'
      | 'IN_PROGRESS'
      | 'MISSING'
      | 'COMPLETED'
      | 'LATE';
    gradingStatus: 'NOT_GRADABLE' | 'NOT_READY' | 'AWAITING_GRADE' | 'DRAFT' | 'RETURNED';
    effectiveDeadline: string | null;
    completedAt: string | null;
    score: number | null;
    maxScore: number | null;
    actionUrl: string;
  }>;
  reporting: ReportMetadata;
}
```

Không chứa raw answer, Submission body hoặc private attachment.

`CLOSED` chỉ hợp lệ với `ASSIGNMENT`; Lesson/Quiz dùng `CommonContentLifecycleStatus`. Adapter
phải kiểm tra invariant này dù response union dùng một alias chung để tránh DTO lặp.

## 8. Gradebook DTO

`GradebookCell` dùng hai chiều `completionStatus` và `gradingStatus` theo
`course-gradebook-and-ranking.md`.

```ts
interface GradebookData {
  course: { id: string; title: string };
  columns: GradebookColumn[];
  rows: GradebookRow[];
  activityPage: {
    limit: number;
    nextCursor: string | null;
    truncated: boolean;
  };
  reporting: ReportMetadata;
}
```

Student row pagination dùng standard API `meta`; activity columns dùng cursor riêng.

## 9. Admin Dashboard DTO

```ts
interface AdminDashboardData {
  users: Record<'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN', UserStatusCounts>;
  registrationSources: Record<
    'SELF_REGISTRATION' | 'TEACHER_INVITATION' | 'ADMIN_BOOTSTRAP',
    number
  >;
  invitations: Record<'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED', number>;
  classrooms: Record<'ACTIVE' | 'ARCHIVED' | 'LOCKED', number>;
  courses: Record<
    'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED',
    number
  >;
  activeEnrollmentCount: number;
  recentGovernanceEvents: AdminAuditSummary[];
  reporting: ReportMetadata;
}

interface UserStatusCounts {
  total: number;
  PENDING: number;
  ACTIVE: number;
  INACTIVE: number;
  BLOCKED: number;
  DELETED: number;
}

interface AdminAuditSummary {
  id: string;
  actorId: string | null;
  actorRole: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SUPER_ADMIN' | 'SYSTEM';
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  createdAt: string;
}

interface AdminGovernanceReportData {
  users: AdminDashboardData['users'];
  registrationSources: AdminDashboardData['registrationSources'];
  invitations: AdminDashboardData['invitations'];
  classrooms: AdminDashboardData['classrooms'];
  courses: AdminDashboardData['courses'];
  enrollments: Record<'ACTIVE' | 'REMOVED' | 'LEFT' | 'BLOCKED', number>;
  reporting: ReportMetadata;
}

interface AdminAuditListData {
  items: AdminAuditSummary[];
  reporting: ReportMetadata;
}
```

Các key trên khóa theo runtime constants hiện có:

- `USER_ROLES` và `USER_STATUSES` tại `apps/api/src/modules/users/user.types.ts`;
- `CLASSROOM_STATUSES` tại `apps/api/src/modules/classrooms/classroom.types.ts`;
- `COMMON_CONTENT_STATUSES` tại
  `apps/api/src/modules/learning-content/content.types.ts`;
- `INVITATION_STATUSES` tại
  `apps/api/src/modules/teacher-invitations/teacher-invitation.model.ts`.
- `ENROLLMENT_STATUSES` tại `apps/api/src/modules/enrollments/enrollment.model.ts`.

Adapter phải khởi tạo đủ mọi key với giá trị `0`; không bỏ key không có dữ liệu, không đổi
`BLOCKED` thành `disabled`, và không gộp `INACTIVE/BLOCKED/DELETED`.
Audit projection không chứa `oldValue`, `newValue`, raw `metadata`, token/hash, answer,
Submission body hoặc Grade feedback. `action/resourceType/resourceId` vẫn phải qua max-length
schema và output escaping ở Web.

## 10. Common Query Schemas

```ts
const pagination = {
  page: 1,       // int >=1
  limit: 20,     // int 1..50
};

const dateRange = {
  from: 'ISO date/date-time optional',
  to: 'ISO date/date-time optional',
  timezone: 'IANA, default Asia/Ho_Chi_Minh',
}; // start inclusive, end exclusive, max 365 days
```

All query schemas strict; unknown key -> `400 VALIDATION_ERROR`.

### 10.1 Student Query Contracts

| Endpoint | Query |
| --- | --- |
| Dashboard | `todoLimit=5`, `courseLimit=5`, `gradeLimit=5`, each `1..10`; optional IANA `timezone` |
| Course detail | required ObjectId `courseId`; optional IANA `timezone` |
| Course list | `page=1`, `limit=20` (`1..50`), optional `progressStatus`; `sortBy=courseTitle\|processScore\|lastActiveAt`, `sortOrder=asc\|desc` |
| Trend, Conditional | required ObjectId `courseId`; `from/to/timezone`, max `365` days |

Student routes không nhận `studentId`, `classroomId` tùy ý hoặc Teacher/Admin filter.
Course list mặc định `lastActiveAt DESC NULLS LAST`, tie-break `course.id ASC`.

## 11. Teacher Query Contracts

### Progress

| Field | Default | Allowed |
| --- | --- | --- |
| `page` | 1 | >=1 |
| `limit` | 20 | 1..50 |
| `search` | none | NFKC, max 100 |
| `progressStatus` | none | `NOT_STARTED/IN_PROGRESS/MISSING/COMPLETED/LATE` |
| `supportFlag` | none | canonical `ReportingSupportFlag` |
| `sortBy` | `processScore` | score/progress/Grade/missing/late/lastActive/fullName |
| `sortOrder` | `desc` | `asc/desc` |

### Activities

| Field | Default | Allowed |
| --- | --- | --- |
| `page`, `limit` | `1`, `20` | limit `1..50` |
| `search` | none | NFKC, max 100 |
| `activityType` | none | `LESSON/QUIZ/ASSIGNMENT` |
| `isRequired` | none | strict coerced boolean |
| `lifecycleStatus` | none | actual activity lifecycle; `CLOSED` Assignment only |
| `deadlineStatus` | none | `NO_DEADLINE/UPCOMING/DUE_SOON/OVERDUE` |
| `sortBy` | `position` | `position/deadline/completionPercentage/missingCount/title` |
| `sortOrder` | `asc` | `asc/desc` |

### Gradebook

`page`, `limit`, `search`, `activityType`, `completionStatus`, `gradingStatus`, `moduleId`,
`activityLimit`, opaque `activityCursor`, `sortBy`, `sortOrder`.

Defaults/bounds nằm tại `course-gradebook-and-ranking.md`; schema implementation phải reuse cùng
constant, không khai báo hai bộ giới hạn.

### Assessments

| Field | Default | Allowed |
| --- | --- | --- |
| `page`, `limit` | `1`, `20` | limit `1..50` |
| `search` | none | NFKC, max 100 |
| `activityType` | none | `QUIZ/ASSIGNMENT` |
| `lifecycleStatus` | none | actual Quiz/Assignment lifecycle |
| `sortBy` | `position` | `position/title/submissionPercentage/returnedGradeAverage/missingCount` |
| `sortOrder` | `asc` | `asc/desc` |

Dashboard chỉ nhận optional `timezone`; Student detail chỉ nhận optional `timezone`. Mọi
`courseId/studentId` của Teacher nằm ở path params và phải qua owned scope trước data query.

Stable sort rules:

- Progress/Gradebook Student rows luôn append `student.id ASC`;
- Activity/Assessment rows luôn append `activityId ASC`;
- nullable numeric/date primary sort luôn `NULLS LAST` cho cả `asc` và `desc`;
- activity cursor encode immutable sort tuple + `activityId`, được ký/validate bởi server hoặc
  dùng opaque base64url payload không nhận raw Mongo expression;
- response `reporting.filters` trả normalized defaults để Web/cache key không tự suy đoán.

## 12. Admin Query Contracts

| Endpoint | Query contract |
| --- | --- |
| Dashboard | `timezone`; `recentLimit=10` (`1..20`) |
| Governance | `from/to/timezone`; optional `role`, `userStatus`, `invitationStatus`, `classroomStatus`, `courseStatus` using runtime enums |
| Adoption, Conditional | `from/to/timezone`; `interval=DAY\|WEEK\|MONTH` |
| Learning outcomes, Conditional | `from/to/timezone`; optional `courseStatus`; privacy threshold always enforced |
| Audit list | `page=1`, `limit=20` (`1..50`), `from/to/timezone`, optional `actorRole`, `action`, `resourceType`, `resourceId`; `sortOrder=desc\|asc` on `createdAt` only |
| Export, Conditional | Same filters as source report; no extra scope/field selector |

Rules:

- default date range là previous `30` days; max `365` days;
- interval phải phù hợp range;
- `action/resourceType/resourceId` normalize NFKC, trim, max `100`; không regex tùy ý;
- organization/platform scope do server derive;
- unknown query/filter, unknown enum hoặc duplicate scalar query key -> `400 VALIDATION_ERROR`.

## 13. Null And Empty Rules

- No denominator -> nullable metric.
- No rows -> `items=[]`, `dataState=NO_DATA`.
- Small group -> aggregate value `null`, `dataState=SUPPRESSED`, no derivable numerator.
- Stale snapshot may contain values but must mark `STALE`.
- Failed with no trustworthy snapshot -> error, not zero-filled DTO.

## 14. Contract Tests

- Type/nullability/OpenAPI snapshots.
- Actual User/Grade/Attempt/Submission enum mapping.
- Unknown query rejection.
- Sort/filter allowlist.
- Count/items same scope.
- DTO denylist.
- Legacy denominator and Gradebook cutover.
