# Release Dependencies And Assumptions

## Mục Đích

Một scope có thể đúng trên giấy nhưng chưa thể commit vào release nếu dependency, assumption hoặc decision còn mở. Tài liệu này làm rõ điều kiện cần để roadmap tiến lên; nó không biến assumption thành sự thật chỉ bằng cách ghi vào plan.

## Release Planning Assumptions

| Assumption ID | Assumption | Tác động nếu sai | Owner | Validation trigger / status |
| --- | --- | --- | --- | --- |
| REL-ASM-001 | Roadmap không gắn ngày cho đến khi team có capacity/estimate/milestone source. | Ngày tự đặt làm sai kỳ vọng và che risk delivery. | Product Owner + Project Lead | Before date commitment / Open |
| REL-ASM-002 | REL-0/1/2 có thể dùng Local/Development/Staging với synthetic test data, không phải release end-user. | Nếu không có shared environment, integration/UAT plan thay đổi. | Technical Lead + DevOps | Before integration / Open |
| REL-ASM-003 | Teacher invitation MVP dùng `MANUAL_COPY`, không cần Gmail/SMTP provider. | Auto delivery thêm provider/security/retry/privacy/operation scope. | Product Owner | Baseline recorded |
| REL-ASM-005 | `processScore = progressPercentage` là default MVP. | Weighted score đổi data/report/fairness/recalculation scope. | Product Owner + Backend Lead | Before any formula change / Recorded baseline |
| REL-ASM-006 | Cloud provider có thể chọn sau BA baseline nhưng trước Staging Cloud. | Không có account/quota/region/secret/monitoring thì Cloud release không commit được. | DevOps + Product Owner | Before REL-MVP-1 RC / Open |

## Critical Dependencies

| Dependency ID | Dependency / affected release | Owner | Evidence required | Risk / issue link | Status / gate |
| --- | --- | --- | --- | --- | --- |
| REL-DEP-002 | Token/session storage/refresh/CSRF security ADR. Affects REL-0/REL-1 auth/invitation. | Technical Lead + Security Reviewer | Accepted ADR and security test direction. | ISS-003, R-006 | Open; before auth release |
| REL-DEP-003 | API/data contracts for Enrollment, Progress, Deadline, Submission, Grade, Audit/read-model. Affects REL-1/REL-2. | Backend Lead + Technical Lead | Schema/index/validation/API/Swagger/reconciliation plan. | TR-GAP-001/002, R-008/R-009 | Open; before integration |
| REL-DEP-004 | ReactJS API integration and P0 role pages. Affects REL-1/REL-2/UAT. | Frontend Lead + QA Lead | Route/API/state/accessibility/responsive/E2E evidence. | TR-GAP-003, R-013/R-023 | Pending implementation evidence |
| REL-DEP-005 | CI/CD provider, protected checks, registry/artifact identity and environment deploy permission. Affects RC/MVP. | DevOps + Technical Lead | Pipeline run/configuration/artifact evidence. | ISS-002, R-012/R-023 | Open; before RC |
| REL-DEP-006 | Cloud provider/account/region/quota/DNS-SSL/secret/monitoring selection. Affects Staging Cloud/MVP. | DevOps + Product Owner | ADR/environment readiness checklist and access confirmation. | ISS-001, R-003/R-020 | Open; before Staging Cloud |
| REL-DEP-007 | UAT representatives, safe test accounts/data and sign-off authority. Affects UAT/MVP. | Product Owner + QA Lead + BA | Participant/schedule/test data/access confirmation. | ISS-005, R-002/R-023 | Open; before UAT planning |
| REL-DEP-008 | Backup scope, restore rehearsal and rollback/forward-fix readiness. Affects risky release/MVP. | DevOps + Technical Lead | Backup/rehearsal/version/rollback evidence. | R-010/R-011 | Open; before high-risk RC/deploy |
| REL-DEP-009 | Resource/media/upload decision and storage/access/policy if enhancement is pulled forward. | Product Owner + Technical Lead + DevOps | Feature gate or provider/policy/validation/backup decision. | ISS-004, R-017 | Open; before REL-1.1/media scope |
| REL-DEP-010 | Metric formula version/effective date for weighted process score. | Product Owner + Backend Lead + BA | Approved CR/BR/metric/data recalculation/report test. | ISS-006, R-025 | Deferred; Post-MVP only |

## Critical Path Direction

```text
Scope/priority + token policy
  -> REL-0 platform/API/data/CI baseline
  -> REL-1 invitation/Classroom/join/roster
  -> REL-2 learning/deadline/assessment/progress
  -> RC artifacts + UAT users/data + Cloud readiness
  -> UAT/quality/risk closure + backup/rollback evidence
  -> REL-MVP-1 Go decision and controlled deployment
```

Cloud provider and UAT representative are not reasons to delay all Local/Integration work, but they are hard dependencies for the corresponding Staging/Cloud/UAT gate. Team must surface this distinction in status reports.

## Dependency Management Rules

- Every Open critical dependency has one owner, target gate and expected evidence; a name-only owner is not enough.
- A dependency that blocks a target release changes release confidence/status and is escalated per `../20-risk-management/risk-monitoring-and-escalation.md`.
- If a dependency changes behavior/scope, use Change Control; if it only chooses a technical option within approved baseline, record Decision/ADR and update affected evidence.
- Provider/third-party failure must have fallback/contingency; fallback does not authorize using personal/uncontrolled accounts or exposing data.
- Dependency closure requires evidence/reviewer/date. “Team agrees” without artifact/decision is not closure.

## Release Readiness Dependency Checklist

- [ ] Scope Must/Should and any exception are approved/traceable.
- [ ] Required architecture/API/data/security decision is accepted.
- [ ] CI/RC artifact, target environment, secrets/config and Cloud access are ready.
- [ ] UAT participant/test data/environment and evidence location are ready.
- [ ] Monitoring, backup/restore, rollback/forward-fix owner and runbook are ready.
- [ ] Open High/Critical risks, issues, defects and traceability gaps are reviewed for Go/No-Go.

## Liên Kết

- Current issues/decisions: `../20-risk-management/issue-decision-log.md`.
- Risks: `../20-risk-management/risk-register.md`.
- Evidence gaps: `../19-traceability/traceability-gap-register.md`.
- Scope change: `../04-scope/change-control.md`.
