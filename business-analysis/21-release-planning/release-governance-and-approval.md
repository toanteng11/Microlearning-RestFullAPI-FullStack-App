# Release Governance And Approval

## Mục Đích

Release Governance xác định quyền quyết định, nhịp họp, record, communication và cách giải quyết bất đồng về scope/quality/risk. Mục tiêu là release không bị quyết định bởi người deploy cuối cùng hoặc bởi áp lực deadline, mà dựa trên authority và evidence phù hợp.

## Governance Principles

- Product Owner quyết định business value/scope; Technical Lead quyết định technical safety; QA Lead đánh giá quality evidence; DevOps xác nhận delivery/operations readiness.
- Không role nào tự phê duyệt toàn bộ release nếu scope có impact vượt authority của role đó.
- Release owner điều phối, không được bỏ qua gate chỉ vì chính mình là owner artifact/deploy.
- Decision, waiver, scope defer và known issue phải lưu cùng release record; chat/verbal agreement không thay thế record.
- Khi evidence mâu thuẫn, ưu tiên safety of access/data/learning integrity trước convenience/timeline.

## RACI Cho Release Lifecycle

| Activity | Product Owner | BA | Technical Lead | Dev / Leads | QA Lead | DevOps | Security Reviewer | User Representative |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Prioritize MVP/release scope | A | R | C | C | C | C | C | C |
| Maintain backlog/trace/scope record | C | A/R | C | C | C | C | I | I |
| Estimate/design/dependency analysis | C | C | A | R | C | C | C | I |
| Define acceptance/UAT plan | C | R | C | C | A/R | C | C | C |
| Implement/review feature | I | I | A | R | C | C | C | I |
| CI/artifact/environment/deploy readiness | I | I | A | C | C | R | C | I |
| Security/privacy review | I | C | A | R | C | C | R/C | I |
| UAT execution/business feedback | A | R | C | I | R | C | I | R/C |
| Go/Conditional Go/No-Go | A | R | R | C | R | R | R when applicable | C |
| Deploy/rollback/incident operational action | I | I | A | C | C | R | C | I |
| Release closure/lessons learned | A | R | R | C | R | R | C | C |

`A` = Accountable, `R` = Responsible, `C` = Consulted, `I` = Informed. Nhiều `R` trong Go/No-Go nghĩa là các role phải cung cấp recommendation/evidence; Product Owner là business decision authority theo scope/risk matrix.

## Approval Matrix

| Decision / release impact | Required approval or recommendation |
| --- | --- |
| Scope Must/Should/priority or MVP promise change | Product Owner approval; BA records; Technical/QA/DevOps consult by impact. |
| API contract/data model/migration change | Technical Lead approval; Backend/Frontend/QA review; DevOps if deployment/recovery affected. |
| Auth/RBAC/token/secret/privacy/export/upload change | Technical Lead + Security Reviewer recommendation; QA test; Product Owner aware if behavior/scope changes. |
| Standard low-risk Staging increment | Technical Lead + QA Lead + DevOps readiness confirmation. |
| REL-MVP-1 Cloud/demo release | Product Owner + Technical Lead + QA Lead + DevOps approval; Security Reviewer if security/privacy/high-risk change. |
| Conditional Go / waiver | Product Owner + Technical Lead + QA Lead; DevOps/Security approval when operational/security impact exists. |
| Critical security/data/availability incident or hotfix | Technical Lead + DevOps immediate containment; Security Reviewer as relevant; Product Owner informed; post-incident review mandatory. |
| Backup restore or destructive data recovery | Technical Lead + DevOps authorization; Product Owner communication/decision according to business impact. |

## Planning And Review Cadence

| Ceremony | Participants | Output |
| --- | --- | --- |
| Backlog Refinement | PO, BA, Technical Lead, QA, DevOps as needed. | Refined top backlog, DoR, acceptance, dependency/risk, estimate confidence. |
| Increment Commitment | PO, BA, leads, QA, DevOps. | Committed/deferred scope, owner/capacity/dependency/quality enabler plan. |
| Technical Readiness Review | Technical Lead, Dev/QA/DevOps/Security as needed. | API/data/security/migration/environment/observability decision. |
| Scope Freeze / RC Selection | PO, BA, Technical Lead, QA, DevOps. | Included/excluded scope, known issue, exact artifact, UAT plan, rollback target. |
| UAT Status Review | PO/BA/QA, representatives, leads as needed. | Pass/fail/blocked, defect/retest, risk/waiver and release recommendation. |
| Go/No-Go | PO, Technical Lead, QA Lead, DevOps, Security when required. | Signed decision, release window/communication/contingency or No-Go action. |
| Post-Release Review | Release owner, BA, QA, DevOps, leads, PO. | Actual result, incidents/metrics, deferred work, RCA/CAPA/lessons learned. |

## Scope Freeze Rules

- Scope freeze applies to the release candidate, not to all project learning; work for future release can continue on an isolated branch/stream if it does not threaten RC stability.
- Only blocker/security/hotfix/config/deploy change or explicitly approved change may enter frozen scope. Every such change updates test/risk/release evidence impact.
- New feature, major UX change, new provider, formula/policy change or schema migration after freeze defaults to next release unless authority accepts the risk and evidence plan.
- A developer/QA/DevOps convenience change that alters observable behavior/API/data may still require Change Control.

## Release Status Lifecycle

```text
Draft -> Planned -> Committed -> In Development -> In Integration
      -> Scope Frozen / Release Candidate -> In UAT
      -> Go / Conditional Go / No-Go
      -> Deployed -> Monitoring -> Closed
      -> Rolled Back / Incident Follow-up when applicable
```

| Status | Meaning |
| --- | --- |
| Planned | Outcome/backlog exists; dependency/capacity may still be uncertain. |
| Committed | Scope selected after DoR/capacity/dependency review; not guarantee of release pass. |
| Scope Frozen / RC | Exact release scope/artifact candidate selected; controlled change only. |
| In UAT | UAT/quality/release evidence is being executed, not merely scheduled. |
| Go / Conditional Go / No-Go | Formal decision before target deploy. |
| Monitoring | Deployment complete but release not closed until smoke/monitoring window/recovery confidence passes. |
| Closed | Actual outcome, evidence, known issue, follow-up and trace updates recorded. |

## Communication Requirements

| Audience | Khi nào | Nội dung tối thiểu |
| --- | --- | --- |
| Core project team | Before scope commitment/RC/deploy and during incident. | Scope, target environment, owner, risk/dependency/blocker, decision/action. |
| UAT participants | Before UAT and after material change. | Scope/exclusions, test accounts/data, schedule, evidence/defect route, known limitation. |
| Teacher/Admin/Student audience | Before/after approved release when behavior/action is affected. | What changed, availability window, safe workaround/known issue/support channel; no secret/internal detail. |
| Stakeholders/PO | At milestone/Go-No-Go/post-release. | Readiness status, decision needed, evidence summary, residual risk/defer/incident outcome. |

## Conflict Resolution

Khi team bất đồng về release, xử lý theo thứ tự:

1. Xem source requirement, Business Rule, Acceptance Criteria, RTM và evidence thực tế.
2. Ưu tiên security/privacy/access, data integrity/history, then core learning/assessment/deadline, then release operations, then UI convenience/optional feature.
3. Nếu baseline không rõ, BA ghi Issue/Decision; Product Owner quyết định business outcome, Technical Lead quyết định safe technical option.
4. Nếu không đủ evidence, chọn No-Go/defer hoặc plan verification; không ghi “pass by consensus”.

## Governance Records

Mỗi release cần có hoặc link tới: scope/backlog IDs, version/artifact/environment, decisions/CR, risk/dependency/defect/waiver, CI/test/UAT evidence, backup/rollback/monitoring plan, approvals, release note, actual deployment/smoke outcome, known issue and follow-up.

## Liên Kết

- Entry/exit: `release-entry-exit-criteria.md`.
- Risk and decision: `../20-risk-management/`.
- Release management/runbook: `../15-devops-deployment/release-management.md`, `../15-devops-deployment/deployment-runbook.md`.
- Document approval: `../00-document-control/approval.md`.
