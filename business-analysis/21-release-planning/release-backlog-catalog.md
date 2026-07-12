# Release Backlog Catalog

## Mục Đích

Catalog này là release-level view của backlog, nhóm capability thành item có thể plan và trace. Nó không thay thế task board/sprint board; Developers có thể tách task kỹ thuật nhưng không được mất link tới business outcome, rule, acceptance và release evidence.

## REL-MVP-1 Core Backlog

| Backlog ID | Capability / outcome | Priority | Target | Trace chính | Dependency / risk focus | Exit evidence |
| --- | --- | --- | --- | --- | --- | --- |
| REL-BKL-001 | Student self-registration, identity/login, account status, password/token security và RBAC/object scope. | Must | REL-0 | FR-001 đến 005, FR-064/065/068/069; BRQ-004/021 | Registration field allowlist, no auto-session/Enrollment, token ADR, authorization matrix, R-005/R-006/R-007/R-026. | Register/Login API/UI tests, privilege-injection/burst negative test, role/scope test, safe error/log evidence. |
| REL-BKL-002 | Admin role-specific Student/Teacher/Admin lists, status/role management và system policy foundation. | Must | REL-1 | FR-004, FR-009/009A/B/C đến 011/019; BRQ-013/016 | Pagination, sensitive permission/audit, R-005/R-008. | Admin UAT, filter/pagination/authorization/audit test. |
| REL-BKL-003 | Teacher invitation create/copy, manual delivery guidance, accept, expiry/revoke/email matching lifecycle. | Must | REL-1 | FR-006 đến 008; BRQ-014/015 | Hash/one-time token, no email provider, R-004/R-015. | Admin/Teacher flow and expired/revoked/mismatch/retry test. |
| REL-BKL-004 | Classroom creation/settings/roster and ownership scope. | Must | REL-1 | FR-020/024/025; BRQ-001/003 | RBAC/owner and enrollment policy, R-005/R-008. | Teacher create/update/archive/roster scope test. |
| REL-BKL-005 | Student join by Class Code hoặc Invite Link với policy/order/uniqueness. | Must | REL-1 | FR-021 đến 023; BRQ-004/016 | Code/link state, token security, atomic Enrollment, R-014. | Code/Link allowed/denied/duplicate/retry UAT/API evidence. |
| REL-BKL-006 | Course, Module/Topic, publish lifecycle, Announcement and Teacher content ownership. | Must | REL-2 | FR-026/028/029/033/035; BRQ-002/003/020 | Visibility/order/ownership, R-005/R-008. | Teacher content and Student scoped visibility tests. |
| REL-BKL-007 | Lesson/Flashcard, published deadline, Teacher deadline reset with reason/history/recalculation. | Must | REL-2 | FR-027/029 đến 031/033; BRQ-009 | Timezone/history/To-do read model, R-009. | Deadline boundary/reset/rebuild/audit test. |
| REL-BKL-008 | Student Dashboard To-do, Classwork/Lesson Player, progress states and navigation controls. | Must | REL-2 | FR-049 đến 057/059; BRQ-005/006/022 | Enrollment/visibility/deadline, R-009/R-019. | Student E2E/empty/error/Back-Next and data state evidence. |
| REL-BKL-009 | Quiz authoring, objective attempt/score and Teacher result view. | Must | REL-2 | FR-036/037/039 đến 041; BRQ-006/010 | Attempt idempotency, score policy, R-008/R-009. | Quiz create/play/submit/retry/authorization test. |
| REL-BKL-010 | Assignment, submission, late policy, grade, feedback and Student private result. | Must | REL-2 | FR-042/043/045/046/048/055; BRQ-006/011 | Submission state/history/privacy, R-005/R-008/R-009. | Teacher-to-Student grade/feedback UAT and negative scope test. |
| REL-BKL-011 | Teacher Course Dashboard, progress summary, backend process score and ranking. | Must | REL-2 | FR-027/060/061/063; BRQ-007/008/012 | Read model/index/formula/tie/recalc, R-008/R-009/R-019. | Ranking/progress reconciliation and Teacher UAT. |
| REL-BKL-012 | Admin basic dashboard/report and append-only AuditLog for sensitive action. | Must | REL-MVP-1 | FR-016/017/069; BRQ-017 | Metric scope/privacy/audit retention, R-016/R-023. | Report/audit filter/scope/audit evidence. |
| REL-BKL-013 | Versioned REST API, OpenAPI JSON and Swagger UI `/api-docs`, standard error, search/filter/sort/pagination. | Must | REL-0 through MVP | FR-064 đến 067A; BRQ-019 | Backend/frontend contract drift and docs exposure policy, R-013/R-019. | Swagger UI/spec/API contract/integration/exposure test and review. |
| REL-BKL-014 | MongoDB validation/index/unique/idempotency, history/read-model/reconciliation direction. | Must | REL-0 through REL-2 | FR-059/063/064/069; BRQ-012 | Data integrity/migration/retry, R-008/R-009/R-014. | Data model/index/retry/reconciliation test evidence. |
| REL-BKL-015 | ReactJS role-specific pages, loading/empty/error state, navigation and API integration. | Must | REL-1 through MVP | UI package; FR-057; BRQ-022 | API/UI state/scope/responsive, R-013/R-023. | P0 UI/accessibility/responsive/integration test. |
| REL-BKL-016 | Docker/Compose local and environment/secret configuration baseline. | Must | REL-0 | FR-071/073; BRQ-024 | Secret/config parity, R-007/R-012. | Reproducible local run and config review. |
| REL-BKL-017 | CI/CD build/test/artifact/deploy gates and immutable version trace. | Must | REL-0 through MVP | FR-072; BRQ-024 | Pipeline/provider/required checks, R-012/R-023. | CI run, artifact/version, protected gate evidence. |
| REL-BKL-018 | Cloud/Staging deployment, health/version, HTTPS/CORS/SPA route and observability. | Must | REL-MVP-1 | FR-070/073/074; BRQ-024/025 | Cloud provider/monitoring, R-003/R-018/R-020. | Staging/Cloud smoke, logs/metrics/alert and release record. |
| REL-BKL-019 | MongoDB backup/restore direction and application rollback/forward-fix readiness. | Must | REL-MVP-1 | FR-075; BRQ-025 | Backup scope/rehearsal/data compatibility, R-010/R-011. | Backup ID, restore rehearsal, rollback/forward-fix evidence. |
| REL-BKL-020 | UAT preparation, execution, defect/retest, release readiness and release closure. | Must | REL-MVP-1 | AC/UAT/TS/DOP-AC; BRQ-001 to 025 | UAT reps/evidence/risk, R-002/R-023. | UAT sign-off, Go decision, release note and monitoring closure. |

## REL-1.1 Enhancement Backlog

| Backlog ID | Capability / outcome | Priority | Trace chính | Entry condition |
| --- | --- | --- | --- | --- |
| REL-BKL-021 | Resource attachment/link and optional image/video Quiz Question Media. | Should | FR-032/038/068; BRQ-010/023 | Storage/file/access/retention/security policy approved; MVP regression safe. |
| REL-BKL-022 | Gradebook Basic, Learning Calendar/Deadline View and authorized report export. | Should | FR-056/062; FR-018; BRQ-017 | Score/deadline/report privacy/reconciliation and export authorization evidence. |
| REL-BKL-023 | In-app notification configuration/event delivery and observability. | Should | FR-015/058 | Event/retry/visibility/security policy; no external email delivery assumed. |
| REL-BKL-024 | Classroom ownership transfer and Teacher offboarding workflow. | Should | FR-013; BR-100/101 | Active Classroom/data/audit/exception UAT and governance review. |
| REL-BKL-025 | Content preview and basic reuse. | Should | FR-034; content BRs | Ownership/visibility/audit impact reviewed. |

## Future Backlog Boundary

| Backlog ID | Capability | Target | Reason not committed |
| --- | --- | --- | --- |
| REL-BKL-026 | Co-teacher, advanced rubric/weighted grading, advanced analytics. | REL-2.0 | New permission/formula/data/reporting policy needed. |
| REL-BKL-027 | SIS/Google Workspace/meeting/provider integration. | Future | External integration, privacy/security/error/operation scope. |
| REL-BKL-028 | AI recommendation/grading, plagiarism, native mobile, payment/multi-tenant. | Future | Separate product/architecture/ethical/cost/security baseline required. |

## Catalog Maintenance Rules

- A catalog row groups release planning work; implementation tasks must retain parent `REL-BKL-*` plus source FR/BR/AC links.
- If a Must row cannot reach exit evidence at scope freeze, it is a release blocker or requires approved scope change; it cannot silently become Should.
- If a Should row moves earlier, add risk/dependency/acceptance analysis and Product Owner decision.
- Evidence links are attached as code/Swagger/CI/test/UAT/release artifacts become available; BA documentation alone is not closure.

## Liên Kết

- Backlog governance: `backlog-management.md`.
- MVP/roadmap/gates: `mvp-scope.md`, `release-roadmap.md`, `release-entry-exit-criteria.md`.
- Traceability source: `../19-traceability/requirement-traceability-matrix.md`.
