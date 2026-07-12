# Reporting Operations

## Mục Đích

Tài liệu này mô tả cách vận hành report/dashboard/analytics sau khi triển khai: refresh, job, performance, monitoring, incident, release change và ownership. Reporting trở thành rủi ro vận hành khi dashboard nặng làm chậm API, snapshot stale, export bị lộ hoặc metric sai sau thay đổi công thức.

## Operational Components

| Component | Responsibility | Signal cần theo dõi |
| --- | --- | --- |
| Reporting API | Validate/auth/query/paginate/return DTO | latency, 4xx/5xx, timeout, query error, requestId. |
| Read model refresher | Cập nhật/rebuild To-do/progress summary | lag, success/failure, retry, stale scope. |
| Report snapshot/export worker | Generate heavy aggregate/file asynchronously | queue/job status, duration, failure, duplicate, cleanup. |
| Analytics event ingestion | Validate/dedupe/store/aggregate event | received/invalid/duplicate/drop/failure rate, volume/cost. |
| Storage cleanup | Expire export/object temporary artifact | delete success/failure/orphan count. |
| Monitoring/alerting | Alert/report health and performance | health, p95, error rate, freshness, job/backup signal. |

MVP có thể chưa có worker/queue riêng. Nếu report/export vẫn chạy synchronous, phạm vi/row/time limit và timeout phải nghiêm ngặt; khi workload vượt khả năng, worker/job là hướng mở rộng theo architecture ADR.

## Refresh And Job Policy

| Workload | Trigger | Expected result | Failure handling |
| --- | --- | --- | --- |
| StudentTodoItem | Business mutation/controlled rebuild | Current status and `updatedAt` | Retry/rebuild, flag stale if not current. |
| CourseProgressSummary | Completion/submit/grade/deadline/enrollment change | Ranking/progress `recalculatedAt` | Retry/recalculate course/student; reconcile. |
| Admin aggregate trend | On-demand/scheduled snapshot depending size | `asOf` time bucket aggregate | Preserve last known snapshot only with stale label; alert job failure. |
| Report export | Authorized user request | READY/FAILED/EXPIRED status | Retry safely, no partial public file; cleanup. |
| Analytics aggregate | Event window/batch/on-demand | Aggregate by definition version | Track invalid/duplicate/lag; reprocess allowed retention window. |

Freshness thresholds, retry count and job timeouts are configuration/operational decisions. They must be measured in Staging and documented before Production, not invented in UI code.

## Monitoring And Alert Catalog

| Alert | Trigger direction | Severity direction | First response |
| --- | --- | --- | --- |
| Report API high error | 5xx/timeout above baseline | Sev-2/3 depending impact | Inspect deployment, requestId/error logs, DB/index/query; rollback/forward fix. |
| Report API latency | p95 exceeds NFR/baseline sustained | Sev-3 | Check query plan/filter range/read model/resource, throttle/limit if needed. |
| Summary stale | `now - recalculatedAt` beyond configured threshold for active scope | Sev-2/3 | Check trigger/job failure; rebuild/reconcile; label data stale. |
| Export job failed | Failure rate/critical export failure | Sev-3 | Check permission/filter/storage/job log; no file exposure. |
| Export cleanup failed | Expired private files remain | Sev-2/3 privacy | Fix cleanup/access, revoke link/permission, audit impact. |
| Event validation failure spike | Invalid/dropped event rate above baseline | Sev-3 | Check app release/schema/provider; protect business flow. |
| Reconciliation difference | Summary differs from source above tolerance | Sev-2 | Mark/report impact, investigate formula/data/refresh, rebuild/fix. |
| Analytics volume/cost spike | Event volume/storage/egress abnormal | Sev-3 | Check loop/duplicate/client release, sample/restrict event safely. |

## Performance Guardrails

- Apply pagination, maximum page size, allowed sort/filter and maximum date range per report before database query.
- Use MongoDB index/projection/read model/snapshot based on measured query pattern; review `explain`/query plan where appropriate.
- Cache only safe non-sensitive aggregate response with scope-aware cache key and invalidation; never cache Teacher/Student report without identity/scope dimension.
- Use async export/job for large data. Do not stream unbounded query directly to browser from primary database without protection.
- Rate limit/report concurrency by user/role where needed to prevent accidental repeated export/chart refresh abuse.
- Monitor report endpoints separately so dashboard regression is not hidden inside generic API averages.

## Incident Response

| Situation | Containment | Recovery |
| --- | --- | --- |
| Wrong metric displayed | Mark stale/partial or disable view/export if misleading; preserve evidence | Fix definition/calculation, rebuild/reconcile, communicate correction/version. |
| Authorization/export leak | Revoke temporary URL/job access, stop export/endpoint, rotate credential if needed | Security incident process, audit affected scope, patch/test authorization, notify according policy. |
| Dashboard overload | Throttle/limit expensive filter, disable heavy chart/snapshot | Optimize index/read model, scale, deploy fix after test. |
| Event flood/loop | Disable offending client event feature/ingestion path safely | Fix schema/loop, dedupe/reprocess aggregate, monitor cost. |
| Refresh job stuck | Avoid duplicate competing rebuild; flag stale | Retry/cancel/rebuild controlled scope, reconcile result. |

## Release And Change Governance

Report/analytics change is a release-impacting change when it modifies metric definition, authorization, export field, query/index, timezone, data retention or event schema. Required steps:

1. Update metric definition/report catalog/API/UI/test/traceability.
2. Review privacy, permission, data migration/rebuild and performance impact.
3. Test representative edge data in Local/Staging; include negative authorization/export tests.
4. Add dashboard/report-specific health/smoke or reconciliation check for high-value metric.
5. Deploy with version/as-of awareness; monitor errors/latency/freshness/cost.
6. Rollback/forward-fix according to whether change affects presentation, summary/read model or source data; avoid data-destructive rollback.

## Operational Evidence

| Evidence | Why retain |
| --- | --- |
| Report definition/version and release ID | Explain trend/metric change. |
| Job/refresh/export status and duration | Diagnose stale/failure/performance. |
| RequestId/error/log/monitoring view | Trace user-reported report problem. |
| Reconciliation result/sample scope | Prove correctness of high-value summary. |
| Export audit record/expiry cleanup | Privacy/governance accountability. |
| Alert/incident timeline and follow-up | Prevent repeat failure. |

## Liên Kết

- DevOps observability: `../15-devops-deployment/observability-operations.md`.
- Backup/recovery: `../15-devops-deployment/backup-restore-disaster-recovery.md`.
- NFR performance/logging: `../13-non-functional-requirements/performance-scalability.md`, `../13-non-functional-requirements/logging-monitoring.md`.
