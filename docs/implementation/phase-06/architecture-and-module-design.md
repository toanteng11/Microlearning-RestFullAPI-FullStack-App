# Phase 06 Architecture And Module Design

## 1. Architecture Context

P06 tiếp tục Modular Monolith đang chạy trong một Node.js API process. Reporting là read-heavy
module, không sở hữu Enrollment/Activity/Progress/Grade/AuditLog transactional data.

```text
React Web
  -> Express API /api/v1
    -> Auth + RBAC + Scope Resolver
      -> Reporting Application Services
        -> Published Reader Ports
          -> Enrollment / Activity / Progress / Grade / Audit repositories
        -> CourseProgressSummary Repository
        -> ReportingInvalidation Repository
        -> CSV/Event adapters (Conditional)
      -> MongoDB
```

## 2. Module Boundary

### 2.1 `reporting` Sở Hữu

- Metric definition/process score/grade average/ranking policies.
- Report query schemas, DTOs, freshness envelopes.
- `CourseProgressSummary` và `ReportingInvalidation`.
- Student/Teacher/Admin reporting orchestration.
- Conditional CSV serializer và analytics event contract.
- Rebuild/reconcile scripts, metrics và reporting-specific audit action.

### 2.2 `reporting` Không Sở Hữu

- User authentication/status.
- Classroom ownership và Enrollment lifecycle.
- Course/Activity lifecycle/deadline.
- Quiz/Assignment scoring/submission/Grade mutations.
- AuditLog source events.
- File storage/download lifecycle.

## 3. Published Read Ports

| Port | Input | Safe output |
| --- | --- | --- |
| `ReportingScopeReader` | actor, course/classroom/report | resolved authorized scope |
| `ReportingRosterReader` | classroom/course | active Student IDs + safe summary |
| `ReportingActivityReader` | course, asOf | descriptor, required, deadline, lifecycle |
| `ReportingProgressReader` | course/student scope | canonical progress projections |
| `ReportingAssessmentReader` | course/activity scope | lifecycle/status/count metadata |
| `ReportingGradeReader` | course/student scope | current Grade fields allowed by projection |
| `ReportingGovernanceReader` | admin filter | bounded User/Classroom/Course/Invitation counts |
| `ReportingAuditReader` | admin filter | safe AuditLog projection |

Adapter nằm ở producer module hoặc integration layer; reporting service không import Mongoose
model của Question/Attempt/Submission body.

## 4. Application Services

| Service | Responsibility |
| --- | --- |
| `MetricDefinitionService` | Trả definition/version và validate compatible metric |
| `CourseProgressCalculator` | Tính summary cho một Student/Course |
| `ReportingRefreshService` | Refresh bounded scope sau invalidation |
| `ReportingReconciliationService` | So sánh read model với source và repair |
| `StudentReportingService` | Dashboard/progress/trend/grade summary own scope |
| `TeacherReportingService` | Dashboard/activity/ranking/student detail |
| `GradebookReportingService` | Gradebook columns/rows/cells/summary |
| `AdminReportingService` | Governance/adoption/audit aggregate |
| `ReportExportService` | Conditional authorized CSV stream |
| `AnalyticsEventService` | Conditional validate/dedupe/persist safe event |

## 5. Request Flow

### 5.1 Teacher Ranking

```text
GET /teacher/courses/:courseId/progress
  -> require course.progress_view_owned
  -> requireTeacherManage(courseId)
  -> parse filter/sort/page
  -> resolve current metric version
  -> inspect invalidation/freshness
  -> refresh bounded rows when allowed
  -> query summary with indexed stable sort
  -> join safe Student summaries
  -> project DTO + freshness + pagination
```

### 5.2 Admin Report

```text
GET /admin/reports/governance
  -> require report.view_governance
  -> active Admin check
  -> validate date/status/role filter
  -> force system scope
  -> aggregate metadata collections
  -> suppress group below privacy threshold
  -> return definition/asOf/filter/summary
  -> audit sensitive report view
```

### 5.3 Transactional Invalidation And Post-Commit Recovery

```text
Source mutation starts Mongo transaction
  -> write source state
  -> write/upsert durable ReportingInvalidation in the same ClientSession
  -> commit source state and invalidation atomically
  -> do not calculate report inside source request transaction
  -> later recovery trigger:
       (a) report read performs bounded refresh for requested scope, or
       (b) rebuild/reconcile command claims pending work
  -> expand CLASSROOM intent to Course intents in bounded recovery work when applicable
  -> calculate/replace summary outside the source transaction
     -> success: replace summary by revision/watermark + resolve invalidation
     -> failure: retain invalidation + structured error/metric for retry/read recovery
```

Không chạy aggregate/rebuild trong source transaction. Nếu durable invalidation write thất bại thì
transaction nghiệp vụ được retry/fail theo policy hiện hữu; nếu recovery sau commit thất bại thì
mutation nghiệp vụ vẫn thành công và pending invalidation không bị mất. P06 không tạo background
daemon riêng: read-time recovery và idempotent CLI commands là Must; P07 mới schedule drain job.

## 6. Consistency Model

- Strong consistency thuộc transactional mutation source.
- Reporting read model là eventual consistency có freshness công khai.
- Gradebook current score phải đọc Grade source hoặc summary có source watermark không cũ.
- Không trộn rows từ hai metric versions trong cùng ranking.
- Rebuild ghi document mới bằng compare-and-swap/version, sau đó mới công bố.

## 7. Failure Handling

| Failure | Behavior |
| --- | --- |
| Read-model missing | Bounded rebuild hoặc `REPORT_NOT_READY` |
| Refresh timeout | Trả stale snapshot nếu có; không trả fabricated fresh value |
| Partial Student failures | Valid rows + `PARTIAL`, `failedItemsCount`, correlation ID |
| Source unavailable | `503 DEPENDENCY_UNAVAILABLE`, retryable metadata |
| Definition mismatch | `409 METRIC_VERSION_MISMATCH`, trigger rebuild |
| CSV overflow | `422 REPORT_LIMIT_EXCEEDED` |
| Privacy threshold | `dataSuppressed=true`, không trả small-group values |

## 8. Performance Design

- Server pagination; default `20`, max `50` cho table.
- Dashboard preview lấy tối đa `5` activity và `5` Student.
- Gradebook activity column max mặc định `50`; filter/module/date để thu hẹp.
- Course-wide lazy refresh chỉ chạy khi roster `<=100` và còn request budget; nếu không, công
  bố stale/partial và yêu cầu rebuild.
- Batch reader thay N+1; join User theo danh sách IDs.
- Mongo projection chỉ lấy field cần thiết.
- Explain plan/index evidence trước Gate E.
- Không gọi chain API từ Web để tự ghép Dashboard.

## 9. Security Boundaries

- Actor identity từ verified access token, không từ body/query.
- Scope resolution chạy trước lookup Student/activity.
- Export dùng cùng query service/projection với JSON report.
- Analytics endpoint rate-limited, body bounded và không nhận arbitrary properties.
- Structured log không ghi Student email/fullName/raw answer/CSV body.
- Super Admin vẫn đi qua permission/audit/projection.

## 10. Deployment Boundary

P06 không yêu cầu service mới. API/Web/Mongo chạy như hiện tại; scripts migration/rebuild là
one-off command. P07 chịu trách nhiệm Cloud Run jobs/scheduler, private GCS, production
monitoring/alerts và rollout/rollback cloud.
