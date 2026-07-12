# Business Rule Traceability Matrix

## Mục Đích

Matrix này map Business Rules `BR-001` đến `BR-110` theo nhóm domain tới requirement, enforcement layer, data/audit, acceptance/test. Nó giúp Technical Lead/QA kiểm tra rằng rule không chỉ tồn tại trong tài liệu mà có nơi thực thi và negative test rõ.

## Rule Group Matrix

| Rule group | Requirement / Use Case | Enforcement and data impact | Acceptance / Test evidence | Owner | Coverage |
| --- | --- | --- | --- | --- | --- |
| BR-001 to 004, BR-001A to 001C, BR-036 to 041: registration, authentication, status, role, ownership | FR-001 to 005, FR-023/068; UC-001/002/047/050/052/072 | Registration allowlist, auth middleware, RBAC/object authorization service, User status/role/permission, join-context handling, DTO projection | AC-AUTH-001 to 006; SEC-AC-003/004; TS-001/001A/001B/002/023/028 | Backend Lead + Security reviewer | Covered; runtime evidence pending |
| BR-010 to 014C, BR-042 to 049: Teacher Invitation manual copy | FR-006 to 008; UC-027/051 | TeacherInvitation token hash/state/expiry/email; invitation API; Admin/Teacher activation UI; AuditLog | AC-INV-001 to 003; TS-INV-001 to 020; SEC-AC-001/002/005 | Backend Lead + Admin owner | Covered; runtime evidence pending |
| BR-017 to 019, BR-050 to 057: Classroom join/policy/enrollment | FR-021 to 025, FR-011; UC-004 to 007/024/031/052 | System/Classroom join policy, ClassCode/InviteLink token, Enrollment unique index, join service/read-model | AC-JOIN-001 to 003; TS-004 to 006, TS-024/025; DATA-AC-002 | Backend Lead + QA | Covered; runtime evidence pending |
| BR-008, BR-025, BR-031/032, BR-058 to 068: content lifecycle/media | FR-026 to 038, FR-068; UC-011/012/017 to 020/055/061 | Content status/owner/displayOrder, publish service, QuestionMedia/resource metadata/private storage | AC-CNT-001/002, AC-ASM-001, AC-SEC-002; TS-010/015/026/032 | Backend/Frontend Lead | Covered; runtime evidence pending |
| BR-005/006, BR-029/030/034/035, BR-069 to 082: progress/deadline/ranking | FR-027, FR-030, FR-049 to 057, FR-059 to 063; UC-009/041 to 046/058/059 | LearningProgress, StudentTodoItem, CourseProgressSummary, deadline history, server calculation/rebuild, navigation context | AC-LRN-001/002, AC-DLN-001 to 003, AC-DASH-001/002; TS-008/011 to 020/027 | Backend/Frontend Lead + QA | Covered; runtime evidence pending |
| BR-007, BR-083 to 096: Quiz, Assignment, Grade, Feedback | FR-036 to 048, FR-055; UC-010/019/021/022/056/057/062 | QuizAttempt/Question/Submission/Grade/Feedback, attempt limit, score/late/regrade, private comment, AuditLog | AC-ASM-001 to 006; TS-009/021 to 023; TS-GC-003 to 010 | Backend Lead + QA | Covered; runtime evidence pending |
| BR-009, BR-020 to 028, BR-097 to 104: Admin/data/audit/policy | FR-004, FR-009 to 019, FR-069; UC-014/026/028 to 040/065 to 071/079 | Admin lists, role/status/ownership transitions, SystemSetting, archive/retention, AuditLog append-only, file access | AC-ADM-001/002, AC-DATA-001, AC-SEC-010/011; TS-029/030/033 | Backend Lead + Admin owner | Covered; runtime evidence pending |
| BR-105 to 110: report/export/analytics | REP-011 to 020, FR-016 to 018; UC-015/036 to 038 | Reporting authorization/filter, metric definition/version, ReportSnapshot/ExportJob, analytics event schema, private export storage | AC-RPT-001/002, SEC-AC-012, DATA-AC-010; TS-031 | Backend Lead + QA + DevOps | Covered; runtime evidence pending |

## Enforcement Expectations

| Rule type | Required enforcement location | Insufficient implementation |
| --- | --- | --- |
| Account/role/scope | Backend middleware plus service/object query constraint. | Hide button/route only. |
| Token/invitation/join | Backend validation, hash/expiry/state/unique constraint. | Trust URL/client state only. |
| Content/deadline/grade | Application service/state transition, persistence/history/read-model update. | Update UI field only or overwrite source history. |
| Progress/ranking/report | One backend calculation/read-model job with rebuild/reconciliation. | Compute distinct formula in ReactJS/CSV. |
| File/export | Server authorization/projection/private storage/TTL/re-authorization. | Public URL or client-side filtered full dataset. |
| Audit/security | Append-only audit/log pipeline with safe metadata. | Browser console or editable user record. |

## Business Rule Test Direction

| Rule criticality | Minimum test |
| --- | --- |
| Must access/security/token | Allowed actor plus wrong role/status/ownership/token negative API test. |
| Must data integrity | Happy mutation, retry/duplicate, failure/no partial write, history/audit/read-model verification. |
| Must deadline/grade | Valid action, invalid actor/reason/state, recalculation and historical data retention test. |
| Must export/report | Valid scope/freshness and out-of-scope/expired download/PII denial test. |
| Should UX/policy | Scenario/UAT outcome and configuration/edge decision where feature is released. |

## Maintenance Rule

When a BR is added, superseded or its semantics change, update this matrix, relevant FR/API/Data/UI/NFR/AC/TS and the gap register. For rule ranges, add/remove exact ID only after checking whether the group remains accurate.

## Liên Kết

- Rule catalog: `../17-business-rules/business-rules.md`.
- Rule governance: `../17-business-rules/business-rule-governance.md`.
- Security/API/Data acceptance: `../18-acceptance-criteria/`.
