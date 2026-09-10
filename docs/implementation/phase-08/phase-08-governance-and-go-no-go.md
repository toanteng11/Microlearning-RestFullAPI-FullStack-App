# Phase 08 — Governance and Go/No-Go

## Governance principles

Evidence precedes opinion; scope authority is distinct from deploy authority; no gate is passed by silence, placeholder or successful HTTP response alone. In this solo project, one person may perform several role statements, but `independentReview=false` must be explicit.

## RACI

| Activity | PO | BA | TL | QA | DevOps/Release | Security | Support |
|---|---|---|---|---|---|---|---|
| Scope/acceptance | A | R | C | C | C | C | I |
| Handoff/identity | I | C | A/R | C | R | C | I |
| System Test | I | C | C | A/R | C | C | I |
| UAT | A | R | C | R | C | C | C |
| Defect/CR | A | C | A/R | R | C | C | I |
| Production readiness | I | I | A | C | R | R/C | C |
| Go/No-Go | A | R | R | R | R | R when applicable | C |
| Deploy/rollback | I | I | A | C | R | C | C |
| Hypercare/closure | A | R | R | R | R | C | R |

`A` = accountable, `R` = responsible, `C` = consulted, `I` = informed.

## Gate decision model

| Gate | Required evidence | Decision authority | Re-entry on No-Go |
|---|---|---|---|
| G0 | P07 exit/handoff, identity, scope, residual risk | TL + PO acceptance | Correct handoff; re-review G0 |
| G1 | Staging/UAT access, personas/data, catalog and evidence workspace | QA/BA | Close test-readiness gap; G1 |
| G2 | CI, API, E2E, security, NFR, exact digest | QA/TL | Fix/retest candidate; G2 |
| G3 | UAT matrix/sign-off and defects | PO | Retest/change; G3 |
| G4 | defect/CR closure plus Production plan/separation/recovery/ops readiness | TL + QA + DevOps + PO | Remediate; return by impact |
| G5 | PRE_RELEASE AC-001..010 and role recommendations | PO | No production action; return to named gate |
| G6 | approved apply/change, deployment/smoke record | DevOps | Rollback/incident; G6/G7 |
| G7 | observation, hypercare, handover | PO + DevOps | Extend observation/incident |
| G8 | final criteria/evidence/lessons/follow-up | PO | Remediate or formally close with residuals |

## G5 checklist

- [ ] P08-AC-001..010 are `PASS` in a valid `PRE_RELEASE` record.
- [ ] UAT status is `PASS`; release-level Conditional Go is evaluated separately.
- [ ] No Critical/High defect, security/privacy/data-integrity risk.
- [ ] Exact digest is stable in Staging; Production plan/change is reviewed.
- [ ] Backup/restore, rollback and monitoring meet the selected profile; managed PITR is actual Pass or explicit `APPROVED_NA` for academic scope.
- [ ] Communications, support and observation window are scheduled.
- [ ] Decision record includes decision, rationale, scope, risk, approvers, UTC time and expiry/conditions.

## Decision record template

```text
Decision ID: P08-GNG-<YYYYMMDD>-<n>
Release ID / candidate identity: <PENDING>
Decision: GO | CONDITIONAL_GO | NO_GO
Scope: <PENDING>
Evidence links: <PENDING>
Open risks/defects/waivers: <PENDING>
Conditions and expiry: <PENDING>
Accountable Product Owner: <PENDING>
Recommendations TL / QA / DevOps / Security: <PENDING>
Solo project / independent review: true|false / true|false
Decision UTC: <PENDING>
```

G5 does not require P08-AC-011..014 because those criteria depend on the deployment being approved and executed. G8 is the only gate that requires all 14 criteria and Production `ACTUAL`.
