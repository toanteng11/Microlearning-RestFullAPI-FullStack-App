# Release Entry Exit Criteria

## Mục Đích

Entry/Exit Criteria tạo các quality gate giữa backlog, development, integration, Release Candidate, UAT và Cloud release. Criteria giúp team phân biệt rõ “đã bắt đầu”, “đã code”, “đã verify” và “đã sẵn sàng phát hành”, đồng thời tránh cho scope chưa đủ bằng chứng đi vào UAT hoặc production-like environment.

## Gate 1: Ready For Release Planning

| Entry | Exit / decision | Owner accountable |
| --- | --- | --- |
| Product goal hoặc release increment đã được đề xuất. | Release ID/audience/outcome, Must/Should boundary, high-level backlog, dependencies/risk and non-goal are recorded. | Product Owner + BA |
| Scope baseline/priority documents available. | Scope conflict/open decision has owner/target; no date commitment made without capacity source. | Product Owner + BA |

## Gate 2: Ready For Development

| Entry | Exit / decision | Owner accountable |
| --- | --- | --- |
| Backlog item is selected for increment. | Definition of Ready in `backlog-management.md` passes: value, scope, actor, acceptance, trace, owner, dependency and risk clear. | Product Owner + Technical Lead + BA |
| Design discussion begins. | API/data/UI/security/DevOps impact is reviewed proportionately; test data/environment approach known. | Technical Lead + QA Lead + DevOps as needed |

Item không pass DoR phải giữ `Needs Clarification`/`Blocked`, không đưa vào commitment chỉ vì có người sẵn sàng code.

## Gate 3: Ready For Integration

| Entry | Exit / decision | Owner accountable |
| --- | --- | --- |
| Implementation is reviewed/merged according to team workflow. | Build/lint/type check/test appropriate to item pass; API/Swagger/data/UI/docs updated; no known secret/raw token exposure. | Frontend/Backend Lead |
| Shared environment is available. | Feature is deployed/integrated with version identifiable; positive/negative flows and data integrity behavior can be exercised. | Technical Lead + QA Lead |
| Feature affects sensitive/operational behavior. | Audit/log/error/recovery/config/monitoring effect reviewed; open defect/risk is visible. | Technical Lead + DevOps + QA |

## Gate 4: Release Candidate Ready

| Required condition | Evidence / result |
| --- | --- |
| Scope Freeze | Included Must/approved Should, exclusions, known issues and change list are locked in release record. |
| Artifact identity | Frontend/backend version, commit, image/tag/digest, pipeline run and target environment known. |
| CI / quality | Required build/test/security scan/contract checks pass or failure is triaged; no silent bypass. |
| API/data | Swagger/contract, migration/index/read-model/compatibility and data validation are reviewed for scope. |
| Environment | Staging/UAT URL, HTTPS/CORS/SPA route, health/version, safe test account/data and access ready. |
| Recovery | Prior stable artifact, migration/backup decision, rollback/forward-fix path and owner documented. |
| UAT readiness | Criteria/scenarios, participant, evidence location, defect process and communication are ready. |

QA Lead, Technical Lead and DevOps jointly recommend whether the build can enter UAT. An RC is not ready merely because a deployment succeeded.

## Gate 5: UAT Exit

| Required condition | Exit evidence |
| --- | --- |
| Must flow execution | Student, Teacher, Admin core flows for release scope run with PASS/FAIL/BLOCKED/NOT RUN result. |
| Security/data/role paths | Relevant denial, token, privacy, duplicate/retry, deadline/grade/progress/audit behavior is verified. |
| Defect handling | Critical/High defects fixed/retested; Medium/Low disposition follows waiver policy. |
| Operations/NFR | Health/version/log/monitoring, API/UI/data/DevOps quality evidence is attached. |
| Scope/result | Excluded/Deferred item, known limitation, residual risk and expected workaround are explicit. |
| Sign-off input | QA summary and representative/PO feedback are recorded; no missing evidence is silently treated as pass. |

Detailed UAT execution and sign-off follows `../18-acceptance-criteria/uat-execution-and-signoff.md`.

## Gate 6: Go / Conditional Go / No-Go

| Decision | Conditions | Required record |
| --- | --- | --- |
| Go | All Must acceptance in release scope passes; no Critical/High open; release risk acceptable; backup/recovery/monitoring/approval complete. | Approved release record, release note, deployment window and owner. |
| Conditional Go | Only limited Medium/Low issue with safe workaround; no security/privacy/data/grade/deadline integrity concern; waiver has owner/expiry/mitigation/approval. | Waiver/known issue, release note, communication and follow-up target. |
| No-Go | Must scenario blocked/not run, Critical/High defect/risk, unresolved security/privacy/data concern, missing risky-release recovery evidence or authority unavailable. | No-Go rationale, containment/defer/fix action, new target gate. |

No-Go is a controlled quality decision, not a project failure. It protects the user and preserves credible evidence for the next RC.

## Gate 7: Deployment And Release Closure

| Required condition | Exit evidence |
| --- | --- |
| Controlled deployment | Exact approved artifact/config/environment deployed; deploy result and actor/time recorded. |
| Post-deploy smoke | Health/version, Student/Teacher/Admin core flow, change-specific behavior, CORS/SPA/auth and data checks pass. |
| Monitoring window | Logs/metrics/alerts show no untriaged regression; incident path/owner remains available. |
| Communication | Actual status, known issue/workaround and support/escalation route communicated to intended audience. |
| Closure | Actual version/outcome, risk/waiver/defect status, deferred work and lessons learned are recorded. |

## Release Blockers

Các điều kiện sau là blocker cho affected release scope trừ khi scope được chính thức loại bỏ:

- RBAC/object authorization bypass, token/secret/privacy exposure hoặc unsafe error/log/export.
- Data loss/corruption, duplicate critical record, incorrect grade/progress/deadline/recalculation hoặc missing required AuditLog/history.
- Must Student/Teacher/Admin workflow fail, blocked or not run without scope decision.
- API contract/migration incompatibility chưa có resolution, test/reconciliation hoặc recovery direction.
- Required CI/quality evidence, health/version, UAT environment/access, backup/rollback/forward-fix evidence thiếu cho high-risk release.
- Open Critical/High Risk, defect hoặc dependency không có authority decision/containment.

## Waiver And Exception Rules

- Waiver is temporary acceptance of a known unmet condition, not a replacement for test execution or scope change.
- Critical/High security, privacy, data-loss/corruption, access control and grade/deadline integrity issue are not ordinary waiver candidates.
- A waiver requires linked defect/criterion/risk, impact, workaround/mitigation, owner, target release, expiry, approvers and communication in release note.
- If an exception changes product behavior or MVP promise, use Change Control instead of waiver.

## Release Readiness Record Template

| Field | Nội dung |
| --- | --- |
| Release ID / RC / target environment | Identifier, version/commit/artifact and audience. |
| Included / excluded scope | Backlog IDs, FR/BR/AC groups, deferred/known limitations. |
| Quality/UAT/DevOps evidence | CI, Swagger, test, UAT, health/version, monitoring, backup/rollback links. |
| Risk/defect/dependency | Open/accepted/closed items, waiver and Go/No-Go implication. |
| Approval / decision | PO, Technical Lead, QA Lead, DevOps/Security as applicable; decision/date. |
| Deployment / post-release result | Window, owner, actual outcome, smoke/monitoring, incident/closure follow-up. |

## Liên Kết

- Backlog/roadmap: `backlog-management.md`, `release-roadmap.md`.
- Governance: `release-governance-and-approval.md`.
- Acceptance/defect: `../18-acceptance-criteria/`.
- Risk/release operation: `../20-risk-management/`, `../15-devops-deployment/release-management.md`.
