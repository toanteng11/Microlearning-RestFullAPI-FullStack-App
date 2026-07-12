# Reporting Access And Export

## Mục Đích

Report/export thường tập hợp nhiều dữ liệu hơn một màn hình bình thường, vì vậy nó cần authorization và audit mạnh tương đương action nhạy cảm. Tài liệu này quy định quyền xem, row-level scope, filter, export lifecycle và data protection.

## Access Model

```text
Request dashboard/report/export
  -> authenticated + account ACTIVE
  -> role/permission check
  -> resolve authorized scope (self / owned Classroom-Course / governance)
  -> validate requested filters are subset of authorized scope
  -> query with server-side scope predicate/projection
  -> return view or create export job
  -> AuditLog sensitive/export action as policy requires
```

Ẩn button Export ở frontend chỉ là UX. API/export job luôn phải thực hiện role, permission, ownership/membership và field projection ở server.

## Report And Export Permission Matrix

| Resource/report | Student | Teacher | Admin | Super Admin/DevOps |
| --- | --- | --- | --- | --- |
| Personal To-do/progress/grade/feedback | View self | No, except Teacher view within owned scope through Teacher report | Governance only if permission/purpose | No default need |
| Classroom/Course roster | No other Student data | View/export owned/authorized Classroom/Course | Governance permission | No default need |
| Progress/ranking/assessment | Self only | View/export owned/authorized scope | Aggregate/detail only if governance permission | No default need |
| User lists/invitation | No | No except own profile/status | View/manage per admin permission | System governance if role exists |
| Platform aggregate | No | Own Course aggregate only | View permitted aggregate | Operations-only metrics as needed |
| Audit/export activity | No | No except own action if policy later allows | Permission required | Operations/system audit per least privilege |
| Raw analytics events | No | No | Aggregate view only if approved | Technical operations only; restricted |

## Filter Scope Rules

| Caller | Allowed filter behavior | Denied behavior |
| --- | --- | --- |
| Student | Filter own Course/Classroom/date/status; backend derives `studentId` from token. | Supplying another `studentId`, hidden URL parameter, arbitrary Classroom/Course outside enrollment. |
| Teacher | Filter Course/Classroom/Student/assessment only when Teacher owns/has explicit access. | Query teacherId/studentId/classroomId belonging to another Teacher. |
| Admin | Filter role/status/date/governance scope per permission. | Read password/token/secret or detailed learning data without relevant governance permission. |
| Product/analytics viewer | Aggregate/de-identified filters approved by policy. | Drill down to personal Student identity without business permission. |

Filter invalid/out-of-scope must return standard safe authorization/validation error. Do not reveal whether a restricted Student/Classroom/resource exists.

## Export Lifecycle

```text
Authorized user chooses report + filter + format
  -> API validates permission/scope/size/range
  -> create ReportExportJob with authorized scope fingerprint
  -> PROCESSING
  -> generate bounded file/snapshot from server-side query
  -> READY with temporary controlled download OR FAILED safe error
  -> user downloads after re-authorization if required
  -> file expires/cleanup; AuditLog records request/completion/download as policy requires
```

| Status | Meaning | User experience |
| --- | --- | --- |
| REQUESTED | Request accepted before worker starts | Show request created; prevent accidental duplicate. |
| PROCESSING | Data/file being generated | Poll/refresh status; no repeated sync download. |
| READY | File is available temporarily | Controlled download/view with expiry and scope check. |
| FAILED | Job failed/invalidated | Safe error code/requestId; retry after correction. |
| EXPIRED | File cleanup/TTL reached | Require authorized regeneration; do not retain private file indefinitely. |
| CANCELLED | User/system cancels before completion | No downloadable partial file. |

## Export Content And Safety

| Control | Requirement |
| --- | --- |
| Format | CSV is recommended first; additional format requires scope/test. Use UTF-8 and clear header/metric definition/as-of metadata where practical. |
| Formula injection | Escape/neutralize values beginning with spreadsheet formula control characters such as `=`, `+`, `-`, `@` before CSV output. |
| Field projection | Include only fields needed for report; never password/hash/raw token/secret/internal security metadata. |
| Row limit | Enforce max rows/date range/file size; large export uses job/snapshot or policy approval. |
| File access | Private storage/temp signed URL or authorized download proxy; never public static export URL. |
| Expiry/cleanup | File TTL according sensitivity/policy; cleanup job logs result. |
| Watermark/metadata | Optional report type/as-of/requester/environment; do not unnecessarily add sensitive PII. |
| Audit | Log requester, report type, authorized scope summary, filter summary safe, format, status, time; do not log whole file. |
| Data correctness | Include definition version/as-of/timezone so CSV is interpretable later. |

## Export Requirements By Report Type

| Export type | Default scope | Sensitive level | Audit/reason direction |
| --- | --- | --- | --- |
| Student personal learning summary | Self only | High personal learning | Audit optional/according policy; no cross-Student. |
| Teacher roster/progress/grade | Owned Classroom/Course only | High learning/personal | Audit required; reason recommended for bulk export. |
| Admin user/invitation/governance | Admin permission scope | High personal/governance | Audit required; reason for sensitive/bulk export. |
| Admin audit log | Admin/Super Admin permission | High security/governance | Audit required; restricted retention/access. |
| Product aggregate adoption | Approved aggregate only | Medium/low if de-identified | Audit/report record based on policy. |
| Operational report | DevOps/Technical Lead scope | Internal | No personal data unless approved incident need. |

## Download Re-Authorization

- A user who creates export may lose role/access before download; download endpoint must re-check current permission/scope, not trust job ID alone.
- Expired/revoked Teacher account cannot download old Teacher report even if it has a URL.
- Changing Classroom ownership/enrollment can invalidate pending export scope as policy requires; job records original authorized scope fingerprint for investigation.
- Emailing export automatically is out of scope MVP. Admin manual communication channels do not make export file public.

## Acceptance Checklist

- Student/Teacher/Admin negative tests prove report filter/export cannot cross object scope.
- Large export uses server-side pagination/job/limit and does not crash/timeout browser/API.
- Export uses private/expiring delivery, formula-safe data, projection, audit and no secret/raw token.
- Report job status/error/expiry is visible without exposing internal stack/provider detail.
- CSV/report metadata includes source/report definition/timezone/as-of needed to interpret figures.

## Liên Kết

- Privacy/data quality: `analytics-privacy-data-quality.md`.
- API security: `../14-solution-architecture/security-architecture.md`.
- File storage: `../14-solution-architecture/data-architecture.md`.
