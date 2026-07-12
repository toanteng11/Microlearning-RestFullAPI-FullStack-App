# Analytics Data Model

## Mục Đích

Tài liệu này xác định nguồn dữ liệu, read model, report snapshot, event analytics và luồng refresh cho reporting/analytics. Nó bảo đảm dashboard nhanh nhưng không mất khả năng giải thích hoặc tái tạo số liệu từ dữ liệu nghiệp vụ chuẩn.

## Data Source Hierarchy

| Tầng dữ liệu | Vai trò | Ví dụ | Có phải source of truth? |
| --- | --- | --- | --- |
| Transactional source | Ghi nhận nghiệp vụ chính thức | User, Classroom, Enrollment, Course, Lesson, QuizAttempt, Submission, Grade, Feedback, LearningProgress, AuditLog | Có |
| Read model | Tối ưu query dashboard thường dùng | `StudentTodoItem`, `CourseProgressSummary` | Không; phải rebuild được từ source. |
| Report snapshot | Đóng gói aggregate theo report/filter/time/version để đọc/export hiệu quả | `ReportSnapshot` | Không; tái tạo theo report definition/source. |
| Analytics event | Ghi nhận hành vi/adoption/interaction | lesson viewed, dashboard viewed, feature used | Không; không dùng để quyết định grade/progress/submission. |
| Operational telemetry | Theo dõi API/job/runtime | request log, p95, refresh failure, export duration | Không; dùng vận hành. |

## Source Mapping

| Report/metric area | Primary source | Read model/snapshot option | Authoritative owner |
| --- | --- | --- | --- |
| Student To-do / deadline | Enrollment, Lesson/Quiz/Assignment, completion/submission, deadline history | StudentTodoItem | Learning Progress |
| Course progress / ranking | LearningProgress, QuizAttempt, Submission, Grade, required activity policy | CourseProgressSummary | Learning Progress + Grade & Feedback |
| Roster / membership | Classroom, Enrollment, User profile projection | Optional roster summary | Classroom & Enrollment |
| Assessment result | Quiz, Question, QuizAttempt, Assignment, Submission, Grade, Feedback | Assessment summary | Assessment + Grade & Feedback |
| User/invitation governance | User, TeacherInvitation, Role, status | Admin summary/snapshot | Identity & Access / User Administration |
| Classroom/Course governance | Classroom, Course, publish/archive status | Aggregate snapshot | Classroom & Content |
| Audit/export activity | AuditLog, export job/request record if implemented | Audit report snapshot | Reporting & Audit |
| Product adoption | Authoritative business records + validated analytics events | Time-bucket aggregate | Product/Analytics owner |

## Report Query Architecture

```text
React Dashboard / Export Request
  -> Reporting API
      -> Authorization: role + permission + Classroom/Course/user scope
      -> Validate filter/sort/pagination/timezone
      -> Query transactional source OR approved read model/snapshot
      -> Calculate metric in backend/report service
      -> Return DTO with data, pagination, definition version, asOf/recalculatedAt

For heavy report/export:
  -> create authorized report job/snapshot request
  -> PROCESSING -> READY or FAILED
  -> controlled download/view with authorization and audit
```

Browser không truy cập MongoDB, analytics store hoặc `ReportSnapshot` trực tiếp. Filter do client gửi chỉ là input; backend luôn gắn caller scope vào query trước khi chạy.

## Read Model And Snapshot Rules

| Model | Create/update trigger | Freshness field | Rebuild/reconciliation |
| --- | --- | --- | --- |
| StudentTodoItem | publish/assign, deadline reset, enrollment change, complete/submit | `updatedAt`/`asOf` | Rebuild theo Student/Course hoặc full scope; compare pending/late/missing source. |
| CourseProgressSummary | completion, attempt, submit, grade/regrade, activity/deadline/enrollment change | `recalculatedAt` | Recalculate Student/Course; compare source formula/ranking. |
| ReportSnapshot | Scheduled/manual authorized report job, aggregate report request | `generatedAt`, `definitionVersion`, input/filter hash | Regenerate from source with same definition/filter. |
| Analytics aggregate | Validated event ingestion/batch window | `asOf`, event schema version | Reprocess raw allowed event range if retention permits. |

### Freshness Contract

- Current transactional query: response includes `generatedAt` if relevant; data reflects committed source at query time subject to database consistency.
- Read model: response exposes `recalculatedAt`; UI may display a freshness label when stale lag exceeds configured threshold.
- Snapshot: response/export includes `generatedAt`, `definitionVersion`, filter/timezone and source period.
- Không dùng từ “real-time” nếu system có async rebuild/batch delay chưa được đảm bảo.

## Data Structure Direction

Khi implementing report snapshot/job hoặc persistent analytics events, Backend Lead phải bổ sung chi tiết schema/index/retention vào `10-data-requirements`. Direction tối thiểu:

| Logical entity | Required fields | Index/query direction | Sensitive fields not allowed |
| --- | --- | --- | --- |
| ReportSnapshot | reportType, definitionVersion, scope/filter summary/hash, generatedAt, asOf, status, data location/reference, requestedBy if relevant | reportType/status/generatedAt; requestedBy/status; expiry | password/token/secret/raw data beyond authorized output. |
| ReportExportJob | jobId, reportType, requester, authorized scope fingerprint, status, requestedAt/startedAt/completedAt, format, expiry, error code safe | requester/status/time; status/time | raw credential, unfiltered cross-scope data. |
| AnalyticsEvent (if stored) | eventId, eventName, schemaVersion, occurredAt, receivedAt, environment, actor reference pseudonym/internal ID, context, properties allowlist | eventName/time; course/classroom time aggregate; eventId unique | email, full name, raw token, password, full submission/media content. |
| MetricDefinitionVersion | metric/report ID, version, effectiveAt, calculation/source reference | metric ID/version | secret/PII. |

## Query Performance Rules

| Query pattern | Rule |
| --- | --- |
| Roster/ranking/table | Server-side pagination, projection, allowlist sort; index Course/Classroom + ranking/status key. |
| Student To-do | Query Student/active status/due date from `StudentTodoItem`/index; no scan all Course activity per page render. |
| Teacher assessment | Filter assessment/Course + status/student with appropriate index; avoid unbounded joins/aggregation in request path. |
| Admin trend | Aggregate by time bucket/snapshot with bounded date range; cache/snapshot after measurement where needed. |
| Export large data | Async job with limit/timeout/expiry; do not hold browser request/database cursor indefinitely. |
| Analytics events | Batch/aggregate separately from user-facing critical mutation; event failure not block official learning record. |

Mọi index mới phải được review theo actual filter/sort/query plan, không tạo index cho mỗi chart field một cách máy móc.

## Consistency And Failure Handling

| Failure | Expected behavior |
| --- | --- |
| Source mutation succeeds but summary update fails | Log/monitor failure, mark/retry/rebuild summary; do not silently show unknown data as current. |
| Report snapshot job fails | Status `FAILED`, safe error/requestId, no partial file exposed; operator can retry after correction. |
| Analytics event ingestion fails | Record/metric failure as appropriate; do not rollback Lesson completion/grade/business transaction solely because engagement event failed. |
| Deadline reset | Preserve deadline history; trigger To-do/progress recalculation; report shows new state with freshness label. |
| Grade/regrade | Recalculate CourseProgressSummary/ranking according to policy; retain audit and avoid inconsistent UI/CSV. |
| Query timeout/large range | Return standard safe error/processing option; guide user to narrow filter, never bypass pagination/limits. |

## Reconciliation

Backend/QA should perform scheduled or release-triggered checks for high-value metric:

1. Select a controlled Course/Classroom/Student sample.
2. Recompute completion, late/missing, process score and assessment summary from transactional sources.
3. Compare result with read model/report/export response and record difference.
4. Investigate source rule, stale summary, timezone/filter or duplicate event issue.
5. Rebuild/reprocess with audit/release record where necessary.

## Data Retention Direction

- Transactional learning record follows retention/privacy policy and remains source for official report.
- Read model/snapshot may expire/rebuild after defined period, but deletion cannot break official learning history.
- Analytics event raw retention is limited to purpose/need; aggregate trend can be retained longer when privacy policy allows.
- Report export file is temporary/private and expires; it is not an archival database backup.

## Liên Kết

- MongoDB/detail index: `../10-data-requirements/mongodb-data-model.md`.
- Read model design: `../14-solution-architecture/data-architecture.md`.
- Event/privacy/operations: `analytics-event-tracking.md`, `analytics-privacy-data-quality.md`, `reporting-operations.md`.
