# API And Data Acceptance

## Mục Đích

Tài liệu này xác nhận REST API, Swagger/OpenAPI, validation, data integrity, read model và error behavior đáp ứng requirement. API acceptance không chỉ kiểm HTTP `200`; nó phải xác nhận authorization, response projection, idempotency, database state và side effect.

## API Contract Acceptance

| ID | Given / When | Expected pass condition | Priority |
| --- | --- | --- | --- |
| API-AC-001 | Given endpoint in release scope | Swagger/OpenAPI documents path/method/version/auth/role/request/response/error/example as applicable. | Must |
| API-AC-002 | Given API call under `/api/v1` | Method/resource/status code/JSON envelope follows API standard; no inconsistent ad-hoc response. | Must |
| API-AC-003 | Given protected endpoint | Missing/invalid/expired token, inactive account, wrong role/ownership produce safe standard denial. | Must |
| API-AC-004 | Given invalid param/body/query | Backend returns validation field/error code without write or stack trace. | Must |
| API-AC-005 | Given list endpoint | Server pagination, max limit, filter/sort allowlist/projection and total/cursor metadata follow contract. | Must |
| API-AC-006 | Given breaking endpoint/schema change | Frontend/QA/docs compatibility/change review exists before release. | Must if changed |
| API-AC-007 | Given API error | Error response includes safe code/message/details/requestId as policy; no secret/internal query. | Must |
| API-AC-008 | Given health/version endpoint | `/health` and version behavior follow safe exposure/auth contract. | Must |
| API-AC-009 | Given Local/Development or authorized Staging environment, When Developer/QA opens `/api-docs` and retrieves `/api/v1/openapi.json` | Swagger UI renders the same contract/version/server/tags/operations; authorization still executes at runtime, no raw token/secret is prefilled or persisted, and Cloud exposure follows approved policy. | Must |

## Business Mutation Data Integrity Acceptance

| ID | Mutation | Expected data result | Priority | Traceability |
| --- | --- | --- | --- | --- |
| DATA-AC-001 | Create account/invitation | Email/token/state constraints, hash/expiry, safe audit; no duplicate active/pending rule violation. | Must | BR-042 to 047 |
| DATA-AC-002 | Student Classroom join/retry | One active Enrollment unique by Student/Classroom; joinedBy/time correct; failure has no partial To-do/summary. | Must | BR-053 to 056 |
| DATA-AC-003 | Publish Content | Visibility/To-do only after valid persisted publish; draft remains inaccessible to Student. | Must | BR-058 to 066 |
| DATA-AC-004 | Complete Lesson/retry | One authoritative progress state; timestamps/status/read model/ranking correct; no duplicate score/To-do. | Must | BR-069 to 074 |
| DATA-AC-005 | Reset deadline | History/audit/current deadline/derived late-missing-To-do-Calendar-summary are consistent; old learning record remains. | Must | BR-075 to 080 |
| DATA-AC-006 | Quiz attempt/submit/time limit | Attempt identity/number/limit/status/score is consistent; retries/expiry do not create invalid attempt. | Must | BR-083 to 088 |
| DATA-AC-007 | Assignment submission/resubmit | Valid current/history/late/missing/closed policy state; no duplicate or lost submission. | Must | BR-089 to 091 |
| DATA-AC-008 | Grade/regrade/return | Score range, correct relation, Student visibility, audit and recalculation/report effect correct. | Must | BR-092 to 096 |
| DATA-AC-009 | Admin role/status/ownership/policy | Atomic state/permission/audit change; no self-escalation or partial policy application. | Must | BR-097 to 104 |
| DATA-AC-010 | Report/export/read model | Scope/definition/freshness/job status and no source/summary mismatch beyond controlled stale/rebuild state. | Must | BR-105 to 110 |

## Read Model And Reconciliation Acceptance

| Check | Expected result |
| --- | --- |
| StudentTodoItem | Source activities/enrollment/completion/deadline and To-do list agree after publish/complete/reset/removal. |
| CourseProgressSummary | Source progress/attempt/submission/grade and Course ranking/Process Score agree; `recalculatedAt` visible. |
| ReportSnapshot/export | Report definition/filter/timezone/as-of match source or is marked stale/partial; no cross-scope row. |
| Rebuild/retry | Controlled rebuild restores summary after induced/update failure without changing official source record. |
| Index/pagination | High-volume list/dashboard query uses intended index/pagination and does not return unbounded data. |

## Error And Idempotency Acceptance

| Case | Expected |
| --- | --- |
| Duplicate join/submit/complete request | Idempotent result or clear conflict; no duplicate record/state. |
| Concurrent same-resource mutation | Atomic constraint/transaction-like handling prevents impossible state. |
| Storage/DB unavailable | Standard 5xx/503, log/requestId/health degraded; no success response or orphan metadata if avoidable. |
| Validation fails | No document/history/audit/read-model partial write, except safe rejected-request log. |
| Retry after side-effect failure | Retry/rebuild follows operation idempotency policy and is observable. |

## Evidence

- Swagger URL/version/export, request/response/error sample with sensitive value redacted.
- API authorization matrix result and negative direct API call.
- Database/read-model/AuditLog safe query or service/admin evidence.
- Pagination/filter/sort/query plan/performance result for list/dashboard where required.
- Health/version/log/requestId for dependency/failure behavior.

## Liên Kết

- API requirements: `../11-api-requirements/`.
- Data requirements: `../10-data-requirements/`.
- Architecture data: `../14-solution-architecture/data-architecture.md`.
- Business Rules: `../17-business-rules/`.
