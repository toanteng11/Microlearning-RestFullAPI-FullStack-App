# Phase 06 Runtime Contract Catalog

## 1. Canonical Constants

```ts
export const REPORTING_SCHEMA_VERSION = 1 as const;
export const PROCESS_SCORE_VERSION = 'P06_PROCESS_SCORE_V1' as const;
export const TEACHER_RANKING_VERSION = 'P06_TEACHER_RANKING_V1' as const;
export const GRADEBOOK_VERSION = 'P06_GRADEBOOK_V1' as const;
export const ADMIN_GOVERNANCE_REPORT_VERSION = 'P06_ADMIN_GOVERNANCE_V1' as const;
export const STUDENT_DASHBOARD_VERSION = 'P06_STUDENT_DASHBOARD_V1' as const;

export const REPORT_FRESHNESS_STATUSES = [
  'FRESH',
  'STALE',
  'PARTIAL',
  'REBUILDING',
  'FAILED',
] as const;

export const REPORTING_SUPPORT_FLAGS = [
  'HAS_MISSING_WORK',
  'HAS_UNGRADED_WORK',
  'NO_RECENT_ACTIVITY',
  'NO_REQUIRED_ACTIVITY',
  'PARTIAL_DATA',
] as const;
export type ReportingSupportFlag = (typeof REPORTING_SUPPORT_FLAGS)[number];

export const REPORTING_ALLOWED_ACTIONS = [
  'OPEN_ACTIVITY',
  'VIEW_RETURNED_RESULT',
  'VIEW_STUDENT_PROGRESS',
  'OPEN_GRADING',
  'EXPORT_REPORT',
  'VIEW_SOURCE_LIST',
] as const;
export type ReportingAllowedAction = (typeof REPORTING_ALLOWED_ACTIONS)[number];

export const REPORTING_INVALIDATION_REASONS = [
  'ROSTER_CHANGED',
  'GOVERNANCE_CHANGED',
  'ACTIVITY_CHANGED',
  'PROGRESS_CHANGED',
  'ASSESSMENT_CHANGED',
  'GRADE_CHANGED',
  'DEADLINE_EXCEPTION_CHANGED',
  'METRIC_VERSION_CHANGED',
  'MANUAL_REBUILD',
] as const;

export type ReportingInvalidationReason =
  (typeof REPORTING_INVALIDATION_REASONS)[number];
```

P06 phải import P05 constants thay vì copy string:

- `P05_ACTIVITY_DESCRIPTOR_V2`;
- `P05_MIXED_ACTIVITY_TODO_V2`;
- `P05_REQUIRED_ACTIVITY_COMPLETION_V1`.

## 2. Permission Contract

Thêm vào `PERMISSIONS`:

```ts
'report.view_governance'
'report.export_owned'
'report.export_governance'
'report.audit_view'
```

Role grants:

| Role | Grants |
| --- | --- |
| Student | Reuse `learning.view_enrolled`, `grade.view_own` |
| Teacher | Reuse `course.progress_view_owned`, `grade.manage_owned`; add static `report.export_owned` |
| Admin | Add static `report.view_governance`, `report.audit_view`, `report.export_governance` |
| Super Admin | Existing all-permission behavior, nhưng vẫn projection/audit |

Không tạo permission mới chỉ để đổi tên capability đã tồn tại. Analytics event dùng authenticated
active actor + feature flag/schema/rate limit. Rebuild/reconcile chỉ là operations command.

`ROLE_PERMISSIONS` hiện là static và `SUPER_ADMIN` nhận `PERMISSIONS`; không làm permission grant
phụ thuộc env. Export chỉ khả dụng khi đồng thời có static permission,
`REPORT_EXPORT_ENABLED=true`, route scope Pass và backend trả `EXPORT_REPORT` trong
`allowedActions`. Đổi flag không yêu cầu auth refresh.

## 3. Environment Contract

```text
REPORTING_ENABLED=true
REPORTING_TIMEZONE=Asia/Ho_Chi_Minh
REPORTING_PAGE_MAX=50
REPORTING_DASHBOARD_PREVIEW_LIMIT=5
REPORTING_GRADEBOOK_ACTIVITY_MAX=50
REPORTING_STALE_AFTER_SECONDS=300
REPORTING_INLINE_REFRESH_MAX_STUDENTS=5
REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS=100
REPORTING_REFRESH_REQUEST_BUDGET_MS=900
REPORTING_REBUILD_BATCH_SIZE=50
REPORTING_REBUILD_MAX_ATTEMPTS=3
REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE=50
REPORTING_INVALIDATION_LOCK_SECONDS=120
REPORTING_INVALIDATION_MAX_ATTEMPTS=3
REPORTING_INVALIDATION_RETRY_BASE_SECONDS=30
REPORTING_INVALIDATION_RETRY_MAX_SECONDS=300
REPORTING_PRIVACY_MIN_GROUP_SIZE=5
REPORTING_MAX_DATE_RANGE_DAYS=365
REPORT_EXPORT_ENABLED=false
REPORT_EXPORT_MAX_ROWS=5000
REPORT_EXPORT_MAX_DATE_RANGE_DAYS=365
ANALYTICS_EVENTS_ENABLED=false
ANALYTICS_EVENT_RETENTION_DAYS=90
ANALYTICS_EVENT_BODY_MAX_BYTES=16384
STUDENT_PROGRESS_TREND_ENABLED=false
WEIGHTED_PROCESS_SCORE_ENABLED=false
```

Validation:

- integers finite/positive trong range;
- expansion batch `1..100`; lock/retry seconds `1..3600`; invalidation attempts `1..10`; retry
  base `<=` retry max;
- timezone hợp lệ IANA;
- Conditional default false;
- `REPORTING_PAGE_MAX <= DASHBOARD_PAGE_MAX` hoặc document override rõ;
- on-demand Course refresh max không vượt dataset/classroom policy được duyệt;
- request refresh budget nhỏ hơn dashboard API target;
- startup fail fast khi config invalid.

Target P06 config retire `BASIC_GRADEBOOK_ENABLED`; P06 Gradebook thuộc
`REPORTING_ENABLED`. Không giữ hai flag điều khiển hai response contracts trên cùng route.

## 4. Service Port Contracts

```ts
interface ReportingScopeReader {
  requireStudentCourse(actorId: string, courseId: string): Promise<ResolvedStudentCourseScope>;
  requireTeacherCourse(actorId: string, courseId: string): Promise<ResolvedTeacherCourseScope>;
  requireTeacherStudent(
    actorId: string,
    courseId: string,
    studentId: string,
  ): Promise<ResolvedTeacherStudentScope>;
}

interface ReportingActivityReader {
  listVisibleByCourse(courseId: string, asOf: Date): Promise<ReportingActivity[]>;
}

interface ReportingProgressReader {
  listByCourseAndStudents(
    courseId: string,
    studentIds: readonly string[],
  ): Promise<ReportingProgress[]>;
}

interface ReportingGradeReader {
  listCurrentByCourseAndStudents(
    courseId: string,
    studentIds: readonly string[],
    visibility: 'TEACHER' | 'STUDENT' | 'ADMIN_AGGREGATE',
  ): Promise<ReportingGrade[]>;
}
```

Ports trả plain projections, không trả Mongoose Document.

## 5. Calculator Contract

```ts
interface CourseProgressCalculationInput {
  asOf: Date;
  courseId: string;
  classroomId: string;
  studentId: string;
  activities: readonly ReportingActivity[];
  progress: readonly ReportingProgress[];
  grades: readonly ReportingGrade[];
  deadlineExceptions: readonly ReportingDeadlineException[];
}

interface CourseProgressCalculationResult {
  requiredActivityCount: number;
  completedRequiredCount: number;
  progressPercentage: number | null;
  processScore: number | null;
  missingActivityCount: number;
  lateActivityCount: number;
  ungradedActivityCount: number;
  returnedGradeCount: number;
  gradePointsEarned: number;
  gradePointsPossible: number;
  returnedGradeAverage: number | null;
  lastActiveAt: Date | null;
  courseCompleted: boolean;
  supportFlags: readonly ReportingSupportFlag[];
}
```

Calculator là pure function/service, không query DB.

## 6. Repository Contracts

```ts
interface CourseProgressSummaryRepository {
  findStudent(courseId: ObjectId, studentId: ObjectId, version: string): Promise<Summary | null>;
  listRanking(scope: RankingQuery): Promise<Paginated<Summary>>;
  replaceWithRevision(input: SummaryReplaceInput): Promise<Summary>;
  markCourseStale(
    courseId: ObjectId,
    reasons: readonly ReportingInvalidationReason[],
    changedAt: Date,
  ): Promise<void>;
}

interface ReportingInvalidationRepository {
  upsert(command: ReportingInvalidationCommand, session?: ClientSession): Promise<void>;
  claimBatch(limit: number, workerId: string, now: Date): Promise<Invalidation[]>;
  resolve(claim: InvalidationClaim): Promise<boolean>;
  fail(claim: InvalidationClaim, code: string, nextRetryAt: Date | null): Promise<boolean>;
}
```

Canonical command scope:

```ts
type ReportingInvalidationScope =
  | {
      scopeType: 'STUDENT_COURSE';
      classroomId: ObjectId;
      courseId: ObjectId;
      studentId: ObjectId;
    }
  | {
      scopeType: 'COURSE';
      classroomId: ObjectId;
      courseId: ObjectId;
      studentId: null;
    }
  | {
      scopeType: 'CLASSROOM';
      classroomId: ObjectId;
      courseId: null;
      studentId: null;
    };

interface ReportingInvalidationCommand {
  scope: ReportingInvalidationScope;
  reasons: readonly ReportingInvalidationReason[];
  sourceChangedAt: Date;
}

interface InvalidationClaim {
  id: ObjectId;
  claimToken: string;
  revision: number;
}
```

Source mutation đã có transaction phải truyền cùng `ClientSession` vào `upsert`. Refresh,
`claimBatch`, `resolve` và `fail` chạy sau commit/ở reconciliation worker, không chạy trong source
transaction. `ReportingInvalidationCommand.reasons` là non-empty array; repository union và
dedupe reasons khi coalesce cùng `scopeKey`, đồng thời giữ `sourceChangedAt` mới nhất.
`CLASSROOM` command chỉ ghi một intent trong source transaction; worker mở rộng Course theo
bounded batch sau commit.
`resolve/fail=false` nghĩa claim đã bị source upsert hoặc worker khác supersede; caller không được
retry resolve bằng dữ liệu cũ.

## 7. Query Schema Contract

- Zod `.strict()` cho query/body.
- `page` coerce integer >=1.
- `limit` coerce 1..configured max.
- Object IDs validate trước repository.
- Search normalize NFKC, trim, max 100.
- Sort fields/status/support flags là enum.
- Date range validate start < end và max span.
- Timezone validate IANA/allowlist.

## 8. DTO Visibility

| Field | Student | Teacher | Admin aggregate |
| --- | --- | --- | --- |
| Own/safe Student identity | Own | Course roster | No row identity |
| process/progress | Own | Owned Course | Aggregate Conditional |
| current returned Grade | Own | Owned Course | Aggregate only Conditional |
| draft Grade | No | Owned grading context | No |
| feedback | Own returned | Owned grading context | No |
| raw answer/submission | Existing workflow only | Existing grading workflow | No |
| freshness/definition | Yes | Yes | Yes |

## 9. `allowedActions`

Backend trả action tối thiểu:

- Student: `OPEN_ACTIVITY`, `VIEW_RETURNED_RESULT`.
- Teacher report: `VIEW_STUDENT_PROGRESS`, `OPEN_GRADING`, `EXPORT_REPORT` nếu flag/permission.
- Admin: `VIEW_SOURCE_LIST`, `EXPORT_REPORT` nếu flag/permission.

Web không tự suy ra action chỉ từ role.
DTO dùng đúng `REPORTING_ALLOWED_ACTIONS`; không trả free-form string hoặc action chưa đăng ký.

## 10. Audit Action Constants

```text
REPORT_VIEWED
REPORT_EXPORT_REQUESTED
REPORT_EXPORT_COMPLETED
REPORT_EXPORT_FAILED
REPORTING_REBUILD_STARTED
REPORTING_REBUILD_COMPLETED
REPORTING_RECONCILIATION_COMPLETED
METRIC_DEFINITION_ACTIVATED
```

## 11. Contract Freeze Checklist

- [ ] Constant names/version accepted.
- [ ] Permissions/role grants route-tested.
- [ ] Env examples/schema/tests aligned.
- [ ] Ports có adapters và không leak model.
- [ ] DTO projection snapshots approved.
- [ ] OpenAPI schemas/examples use same enum/version.
- [ ] Web types align nullability.
