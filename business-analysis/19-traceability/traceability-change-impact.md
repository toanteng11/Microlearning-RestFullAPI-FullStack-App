# Traceability Change Impact

## Mục Đích

Tài liệu này hướng dẫn impact analysis khi requirement, rule, API, data, UI, NFR, test hoặc release thay đổi. Mục tiêu là không bỏ sót downstream artifact, đặc biệt với workflow có nhiều side effect như invitation, join, deadline, grade, export và deployment.

## Change Impact Matrix

| Change source | Mandatory impacted artifact review | Required evidence before close |
| --- | --- | --- |
| BRQ scope/value/priority | Scope baseline, FR, User Story/UC, release plan, RTM, AC/TS/UAT, stakeholder decision | Approved CR/decision, updated RTM/release scope. |
| FR behavior/acceptance | BR, US/UC, API/Data/UI, NFR if quality impact, AC/TS/UAT, Swagger | Updated requirement/test and impacted API/UI/data review. |
| Business Rule | FR/UC, decision table, API/service/data lifecycle/audit, UI message, AC/negative test/report, rule trace matrix | Rule governance review, regression/edge test evidence. |
| Role/permission/status | Access matrix, auth API, UI route/action, AuditLog, security tests, reports/export | Positive/negative object-level API test. |
| Invitation/join policy | Token/data model, API, UI entry flow, system setting, AuditLog, rate/security, UAT | Invitation/join success/denial/expiry/retry test. |
| Deadline/progress/score formula | Data history/read model/rebuild, To-do/Calendar/ranking/report, UI, audit, UAT | Recalculation/reconciliation and historical data preservation evidence. |
| Quiz/Assignment/grade | Content version, Attempt/Submission/Grade/Feedback, scoring/report, Student visibility, AuditLog | Score/late/resubmit/regrade/privacy regression test. |
| API contract | Swagger, frontend integration, test client, error/pagination/auth, version/deprecation note | Contract test + consumer/QA review. |
| Data schema/index/retention | Data dictionary, MongoDB model/index, API, migration/backup/rebuild, privacy/report | Staging migration/index/reconciliation/rollback evidence. |
| UI flow/navigation | IA/page/API map, component state, accessibility/responsive test, AC/TS | Role flow/loading-empty-error/navigation UAT evidence. |
| NFR/security/privacy | Architecture, security controls, logging/monitoring, DevOps config, AC/security gate | Security/privacy/quality gate result. |
| Docker/CI/CD/Cloud/rollback | DevOps docs, environment matrix, release plan, DOP acceptance, monitoring/runbook | Pipeline/deploy/health/version/smoke/rollback record. |
| Defect/incident | Expected AC/TS/BR/FR, root cause, regression test, release/gap/known issue | Retest result and prevention/document update. |

## Mandatory Impact Flows

### Teacher Invitation Change

```text
BRQ-014/015 -> FR-006/007/008 -> BR-010..014C/042..049
  -> invitation token data/API/UI -> security/audit -> AC-INV -> TS-INV -> UAT/release
```

### Deadline Change

```text
BRQ-009 -> FR-030 -> BR-035/061/071/075..080
  -> Lesson/deadline history + To-do/Calendar/ProgressSummary/report
  -> API/UI/audit -> AC-DLN -> TS-018..020 -> UAT/release
```

### Grade Or Process Score Change

```text
BRQ-008/011/012 -> FR-045..048/060..063 -> BR-074/081/092..096
  -> Grade/Feedback/summary/ranking/report metric definition
  -> privacy/audit/API/UI -> AC-ASM/AC-DASH -> TS-021..023 -> UAT/release
```

## Impact Assessment Checklist

1. Identify the source artifact/ID and exact old/new behavior.
2. Search all downstream/upstream links in RTM, Business Rule and Acceptance matrices.
3. Classify scope, security/privacy, data migration, API compatibility, UI, report, DevOps and release impact.
4. Update affected artifact in same Change Request; create gap record if implementation evidence is pending.
5. Define positive, negative and regression test; include data rebuild/audit/rollback where needed.
6. Obtain authority approval based on change-control matrix.
7. After implementation, attach test/UAT/release evidence and close/update gaps.

## High-Risk Change Rule

Changes to token/auth/role, enrollment, deadline, progress/score, grade, retention, export, storage access, database migration or Production deployment are High/Critical impact by default until Technical Lead/Security/QA/DevOps review determines otherwise.

## Liên Kết

- Change control: `../04-scope/change-control.md`.
- Business Rule governance: `../17-business-rules/business-rule-governance.md`.
- Release/rollback: `../15-devops-deployment/release-management.md`, `../15-devops-deployment/rollback-strategy.md`.
