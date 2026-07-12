# Reporting And Export Rules

## Mục Đích

Reporting có thể tập hợp score, progress, submission và user data từ nhiều nguồn, vì vậy việc xem/filter/export là business action có kiểm soát. Tài liệu này cụ thể hóa rule BR-105 đến BR-110 và liên kết với mục 16 Reporting and Analytics.

## Rule Coverage

| Rule ID | Nội dung |
| --- | --- |
| BR-105 | Backend áp dụng role/object scope cho report/dashboard/filter/export. |
| BR-106 | Metric dùng definition backend versioned thống nhất. |
| BR-107 | Aggregate/snapshot hiển thị freshness/definition version; stale/partial rõ ràng. |
| BR-108 | Export có permission/scope/projection/limit/re-authorization/private expiry. |
| BR-109 | Sensitive export/snapshot auditable, không chứa secret/raw token/hash. |
| BR-110 | Analytics event có purpose/schema/dedupe/no unnecessary PII; không là learning source of truth. |

## Report Access Rules

| Audience | Allowed report scope | Explicitly denied |
| --- | --- | --- |
| Student | Personal To-do, own progress, own grade/feedback, own history in enrolled Classroom. | Student khác, global ranking, Teacher/Admin governance/audit. |
| Teacher | Roster/progress/ranking/assessment/content engagement only for owned/authorized Classroom/Course. | Cross-Teacher/Course Student data, global user/audit/organization aggregate unless special permission. |
| Admin | User/invitation/governance/audit and aggregate report only when permission/purpose grants. | Password/raw token/secret and detailed learning data without governance permission. |
| Product analytics viewer | Aggregate/de-identified adoption/engagement data approved by policy. | Direct Student identity drill-down without learning/governance authority. |
| DevOps/Technical Lead | Operational report health/performance/job metrics. | Learning content/score/PII unless incident scope explicitly approves. |

### Filter And URL Rule

Backend derives caller identity/role from authenticated context and resolves allowed Classroom/Course/Student scope before querying. Client filter, URL query, pagination, sort field or export job ID cannot enlarge that scope.

```text
Teacher requests ?courseId=X&studentId=Y
  -> does Teacher own/authorize Course X?
  -> does Student Y belong to Course X?
  -> only then query permitted rows/fields
```

Out-of-scope request returns safe authorization/validation error and never reports whether the unrelated resource exists.

## Metric And Freshness Rules

| Rule | Expected behavior |
| --- | --- |
| Metric calculation | Progress, process score, completion, late/missing, active user and score aggregate use one backend/report-job definition. |
| Definition version | Response/snapshot/export identifies metric/report definition version when result can be compared over time. |
| Freshness | Read model/snapshot returns `asOf`, `generatedAt` or `recalculatedAt`; UI labels stale/partial data instead of calling it current. |
| Deadline/grade impact | Deadline reset, completion, submit, grade/regrade and required-policy change trigger scoped recalculation before summary is considered fresh. |
| Zero denominator | Return `N/A`/explicit no-data state, never misleading `0%` unless definition says zero. |
| Timezone | Daily/weekly/due report uses documented organization timezone; source timestamps stored UTC. |
| Frontend | ReactJS may format/filter data but cannot calculate a competing official score/progress rule. |

## Report Export Rules

### Request Decision

| Check | Result if pass | Result if fail |
| --- | --- | --- |
| Feature/global export policy enabled | Continue. | Deny without generating file. |
| Caller permission and current account ACTIVE | Resolve allowed scope. | `403`/account error. |
| Requested report/filter is subset of scope | Validate row/date/file limit and projection. | Safe scope/validation denial. |
| Export data sensitivity policy | Require reason/audit/approval if configured. | Deny or request missing reason. |
| Job capability for size | Create `PROCESSING` job/snapshot or bounded synchronous response. | Return controlled limit/processing error. |

### Export Lifecycle

```text
REQUESTED -> PROCESSING -> READY -> EXPIRED
                    \-> FAILED
                    \-> CANCELLED
```

- `READY` file lives in private storage or authorized download proxy and has TTL.
- Download re-checks current role/permission/scope; a job ID or old signed URL alone is not permanent authority.
- User role/status/ownership change can invalidate pending/ready export access.
- Export contains only allowed field projection and safe format; it never contains password/hash/raw token/secret/internal security metadata.
- CSV output neutralizes spreadsheet formula-leading values and includes report/date/timezone/definition metadata where practical.
- Sensitive export request/completion/download is written to AuditLog with safe scope/filter summary, not file content.

## Analytics Event Rules

| Area | Rule |
| --- | --- |
| Purpose | Each event maps to defined adoption/engagement/operational question. |
| Source | Join/complete/submit/grade event is backend/transaction-derived; UI view/click event is best-effort only. |
| Schema | Event has name, version, event ID, occurred/received time, safe context/properties; allowlist validation. |
| Dedupe | Retries/double clicks do not double count; event ID/operation identity used. |
| Privacy | No email/full name/password/token/link/code/file content/feedback text/raw submission in event. |
| Failure | Event delivery failure is monitored but does not undo committed official learning mutation. |
| Retention | Raw events/snapshots/export files retain only as long as purpose/policy; aggregate may be retained under privacy rule. |

## Audit And Incident Rules

- Report definition/metric formula/authorization/export field change is a business rule change and requires impact review across data/API/UI/test/analytics trend.
- Export leak or scope bypass is a security/privacy incident: revoke job/file access, contain endpoint, inspect AuditLog, patch/test and notify according policy.
- Wrong/stale metric is a data quality incident: display stale/partial or disable misleading view, reconcile from source, rebuild/reprocess, version/communicate correction.
- Report query cannot remove pagination/limit merely because actor is Admin; governance permission does not permit uncontrolled resource exhaustion.

## QA Checklist

- Student/Teacher/Admin attempt report/filter/export outside object scope and receive no leaked data.
- UI/API/CSV produce same authoritative metric under a representative Course; deadline reset/regrade refresh outcome correctly.
- Stale snapshot/job failure shows `asOf`/error state, not false current values.
- Export job uses private expiring file, re-authorization, safe CSV, row/date limit and audit trail.
- Analytics event key success flows fire once, contain no forbidden fields and cannot alter Grade/Progress if event service fails.

## Liên Kết

- Reporting package: `../16-reporting-analytics/`.
- Privacy: `../13-non-functional-requirements/privacy-compliance.md`.
- Audit: `admin-data-audit-rules.md`.
