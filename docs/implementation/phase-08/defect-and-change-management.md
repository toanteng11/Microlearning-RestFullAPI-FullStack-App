# Phase 08 — Defect and Change Management

## Status model

`OPEN -> TRIAGED -> IN_PROGRESS -> FIXED -> RETEST -> CLOSED`; `REJECTED`, `DUPLICATE`, `DEFERRED` require rationale. Defect record always includes release/build/digest, scenario, expected/actual, severity, owner, evidence, retest and decision.

## Severity and release rule

| Severity | Examples | P08 rule |
|---|---|---|
| Critical | auth/RBAC bypass, secret/PII leak, data loss/corruption, unsafe grade/deadline integrity | Stop test/release; no waiver. |
| High | core Student/Teacher/Admin journey unusable, wrong authorization/data, recovery/monitoring blind | Fix and retest before G5; no ordinary waiver. |
| Medium | limited workflow degradation with safe workaround | May be Conditional Go only with PO waiver, owner and expiry. |
| Low | cosmetic/documentation/non-blocking usability | Disposition and backlog target required. |

## Change control

`CR-P08-###` is required for new behavior, scope, API/data/schema, feature flag, IAM/secret, provider, recovery or production workflow change after freeze. TL assesses technical impact, QA defines regression, DevOps assesses deployment/state, Security reviews sensitive change and PO approves scope. A new digest means re-lock identity and rerun impacted G2/G3 evidence.

## Waiver minimum

Linked criterion/defect, impact, workaround, mitigation, owner, expiry, target release, approver and communication. No waiver converts `NOT RUN` to `PASS` and no waiver bypasses privacy, security or integrity controls.

## Triage record

```text
ID / release / candidate: <PENDING>
Severity / status / owner: <PENDING>
Expected / actual / evidence: <PENDING>
Root cause / fix / retest: <PENDING>
CR or waiver / approver / expiry: <PENDING>
Final decision UTC: <PENDING>
```

## G4 closure review template

```text
Closure review ID / release identity: <PENDING>
Open Critical / High / Medium / Low: <PENDING>
Fixed and retested: <PENDING>
Waiver / CR / deferred items: <PENDING>
Production readiness blockers: <PENDING>
QA / TL / PO recommendations: <PENDING>
Decision / actor / UTC / evidence: <PENDING>
```

Historical reviews remain in their release-scoped artifact folders. A new candidate starts with a new closure review and cannot inherit a previous NO_GO or Pass without revalidation.
