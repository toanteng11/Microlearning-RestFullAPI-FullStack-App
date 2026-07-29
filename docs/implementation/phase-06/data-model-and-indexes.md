# Phase 06 Data Model And Indexes

## 1. Data Principles

- P06 không copy raw content/answer/submission/feedback vào read model.
- Mọi read model có schema version, metric version, source watermark và recalculated time.
- Summary có thể xóa/rebuild từ transactional source.
- Index phải bám query thực tế và có explain evidence.
- Migration additive trước; không drop field/index source trong P06.

## 2. Existing Authoritative Collections

| Collection/domain | P06 usage |
| --- | --- |
| `users` | Safe identity join, role/status aggregate |
| `classrooms` | ownership/lifecycle/governance |
| `courses` | Course scope/lifecycle |
| `enrollments` | active roster/aggregate |
| Lessons/Quizzes/Assignments | visible/required/deadline/activity dimensions |
| `learning_progress` | canonical start/complete/last active |
| Quiz attempts/Submissions | assessment completion/status metadata |
| `grades` | current Grade |
| `grade_revisions` | trace/regrade metadata, không phải default aggregate source |
| deadline exceptions | effective deadline |
| `audit_logs` | governance/audit report |

## 3. `course_progress_summaries`

### 3.1 Document

```ts
interface CourseProgressSummaryDocument {
  _id: ObjectId;
  schemaVersion: 1;
  courseId: ObjectId;
  classroomId: ObjectId;
  studentId: ObjectId;
  sourceMetricVersion: 'P05_REQUIRED_ACTIVITY_COMPLETION_V1';
  descriptorVersion: 'P05_ACTIVITY_DESCRIPTOR_V2';
  processScoreVersion: 'P06_PROCESS_SCORE_V1';
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
  supportFlags: string[];
  sourceChangedAt: Date;
  recalculatedAt: Date;
  refreshStatus: 'FRESH' | 'STALE' | 'PARTIAL' | 'FAILED';
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}
```

Không lưu `fullName`, `email`, `studentCode`; API join qua safe User reader.

### 3.2 Invariants

- Counts là integer `>=0`.
- completed `<=` required.
- Score/percentage `null` hoặc `0..100`.
- grade points `>=0`, earned không vượt policy max.
- `processScore === progressPercentage` trong V1.
- `ungradedActivityCount` chỉ đếm gradable activity có terminal evidence và Grade absent hoặc
  `DRAFT`.
- `courseCompleted=true` chỉ khi required > 0 và completed=required.
- Version fields required/immutable cho revision.
- Update dùng optimistic `revision`.

### 3.3 Indexes

```js
{ courseId: 1, studentId: 1, processScoreVersion: 1 } unique
{ courseId: 1, processScoreVersion: 1, processScore: -1,
  completedRequiredCount: -1, missingActivityCount: 1,
  lateActivityCount: 1, lastActiveAt: -1, studentId: 1 }
{ studentId: 1, courseId: 1, processScoreVersion: 1 }
{ courseId: 1, refreshStatus: 1, recalculatedAt: 1 }
{ classroomId: 1, courseId: 1 }
```

Mongo null sort behavior phải được normalize bằng query/policy hoặc `scoreSortKey` nếu explain/
test cho thấy cần; không dựa vào behavior ngầm mà không test.

## 4. `reporting_invalidations`

```ts
interface ReportingInvalidationDocument {
  _id: ObjectId;
  schemaVersion: 1;
  scopeKey: string;
  scopeType: 'STUDENT_COURSE' | 'COURSE' | 'CLASSROOM';
  classroomId: ObjectId;
  courseId: ObjectId | null;
  studentId: ObjectId | null;
  reasons: Array<
    | 'ROSTER_CHANGED'
    | 'GOVERNANCE_CHANGED'
    | 'ACTIVITY_CHANGED'
    | 'PROGRESS_CHANGED'
    | 'ASSESSMENT_CHANGED'
    | 'GRADE_CHANGED'
    | 'DEADLINE_EXCEPTION_CHANGED'
    | 'METRIC_VERSION_CHANGED'
    | 'MANUAL_REBUILD'
  >;
  sourceChangedAt: Date;
  status: 'PENDING' | 'PROCESSING' | 'FAILED';
  attempts: number;
  revision: number;
  lastErrorCode: string | null;
  nextRetryAt: Date | null;
  lockedAt: Date | null;
  lockedBy: string | null;
  claimToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

`reasons` phải là non-empty set theo `REPORTING_INVALIDATION_REASONS`. Upsert cùng `scopeKey`
thực hiện set-union/dedupe, không thay thế mất reason cũ, và giữ `sourceChangedAt` lớn nhất.
Mỗi source upsert tăng `revision`, đặt lại `status=PENDING`, `attempts=0`,
`lastErrorCode/nextRetryAt/claimToken/lockedAt/lockedBy=null` và vô hiệu claim cũ. Failure
history đã nằm trong structured log/metric, không dùng document hiện tại làm audit history.

Scope invariants:

- `STUDENT_COURSE`: `courseId` và `studentId` required;
- `COURSE`: `courseId` required, `studentId=null`;
- `CLASSROOM`: `courseId=null`, `studentId=null`;
- `classroomId` luôn required để scope/ownership/reconciliation không cần suy đoán.

Indexes:

```js
{ scopeKey: 1 } unique
{ status: 1, nextRetryAt: 1, sourceChangedAt: 1 }
{ classroomId: 1, courseId: 1, studentId: 1 }
```

`scopeKey`:

- Student scope: `COURSE:<courseId>:STUDENT:<studentId>`;
- Course scope: `COURSE:<courseId>:ALL`.
- Classroom scope: `CLASSROOM:<classroomId>:ALL`.

Course-wide invalidation supersedes/coalesces Student invalidations cùng Course khi repair.
Classroom scope được read-recovery/CLI consumer mở rộng thành Course scopes theo bounded batch sau
commit; không query/mở rộng mọi Course trong source transaction.

Precedence: `CLASSROOM > COURSE > STUDENT_COURSE`. Freshness query của một Student/Course phải
kiểm tra exact scope và parent scopes có `sourceChangedAt > recalculatedAt`; không được đánh dấu
`FRESH` chỉ vì Student scope riêng không tồn tại.

Claim/resolve invariant:

- claim atomically chuyển due `PENDING/FAILED` sang `PROCESSING`, tạo random `claimToken` và
  trả về `revision`; automatic claim chỉ lấy
  `attempts < REPORTING_INVALIDATION_MAX_ATTEMPTS`;
- worker resolve/fail bằng CAS trên `_id + claimToken + revision + status=PROCESSING`;
- nếu source mutation upsert trong lúc worker tính, `revision` tăng và status về `PENDING`;
  resolve/fail cũ phải no-op, không được xóa intent mới;
- lock timeout chỉ thu hồi claim khi token/revision vẫn là phiên bản bị timeout.

## 5. Conditional `course_progress_snapshots`

Chỉ tạo khi Student trend được Gate A bật.

```ts
interface CourseProgressSnapshotDocument {
  schemaVersion: 1;
  courseId: ObjectId;
  studentId: ObjectId;
  processScoreVersion: string;
  snapshotDate: string; // YYYY-MM-DD trong reporting timezone
  progressPercentage: number | null;
  processScore: number | null;
  completedRequiredCount: number;
  requiredActivityCount: number;
  missingActivityCount: number;
  sourceAsOf: Date;
  generatedAt: Date;
  expiresAt: Date | null;
}
```

Indexes:

```js
{ courseId: 1, studentId: 1, processScoreVersion: 1, snapshotDate: 1 } unique
{ studentId: 1, snapshotDate: -1 }
{ expiresAt: 1 } expireAfterSeconds: 0 // chỉ khi retention được duyệt
```

## 6. Conditional `analytics_events`

```ts
interface AnalyticsEventDocument {
  schemaVersion: 1;
  eventId: string;
  eventName: string;
  eventSchemaVersion: string;
  occurredAt: Date;
  receivedAt: Date;
  environment: string;
  actorId: ObjectId;
  actorRole: string;
  classroomId: ObjectId | null;
  courseId: ObjectId | null;
  activityType: string | null;
  activityId: ObjectId | null;
  properties: Record<string, string | number | boolean | null>;
  expiresAt: Date;
}
```

Indexes:

```js
{ eventId: 1 } unique
{ eventName: 1, occurredAt: -1 }
{ courseId: 1, eventName: 1, occurredAt: -1 }
{ actorId: 1, occurredAt: -1 }
{ expiresAt: 1 } expireAfterSeconds: 0
```

Không có email/name/content/Grade/raw answer/token.

## 7. Existing Index Review

P06 phải verify:

- `learning_progress`: course/student/status/activity/lastActive;
- `grades`: course/status/student/activity;
- `enrollments`: classroom/status/student;
- activity collections: course/lifecycle/required/position/deadline;
- AuditLog: actor/action/resource/createdAt;
- User: role/status/createdAt.

Chỉ thêm index sau query plan review; không tạo index trùng hoặc index quá rộng không dùng.

## 8. Transaction Boundaries

- Durable invalidation intent nằm cùng source mutation transaction khi method có/wrap được
  `ClientSession`.
- Summary refresh/calculation không nằm trong source mutation transaction.
- Một summary replace/update có optimistic revision.
- Invalidation upsert idempotent và giữ watermark mới nhất.
- Rebuild Course dùng bounded batches; không giữ transaction toàn Course.
- Snapshot append/upsert theo unique date/version.
- Analytics event insert duplicate `eventId` trả idempotent success.

## 9. Data Quality Checks

- Source vs summary count/score difference.
- Orphan summary không còn active Enrollment/Course.
- Missing summary cho active roster.
- Version mismatch.
- `sourceChangedAt > recalculatedAt` nhưng status `FRESH`.
- Invalid score/count range.
- Duplicate unique scope.

## 10. Migration Order

1. Deploy schema/constants với feature route disabled.
2. Create indexes idempotently.
3. Backfill active Course/Student theo batch.
4. Reconcile sample + full aggregate counts.
5. Enable read route in staging.
6. Run performance/security/E2E.
7. Enable production flag ở P07.

## 11. Rollback Data Rule

Rollback code có thể ngừng đọc P06 collections; không drop ngay. Giữ read model để điều tra,
disable refresh/export/event flags, và chỉ cleanup sau khi release ổn định/approval.
