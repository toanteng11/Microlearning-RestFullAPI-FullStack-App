# Phase 08 — Rollback and Incident Response

## Principles

Rollback restores a previously stable immutable revision; it does not rebuild or silently mutate data. Incident handling protects users/data first, preserves raw evidence and records decision authority.

## Existing repository controls

- `.github/workflows/rollback-staging.yml` is the existing Staging rollback workflow.
- `npm run rollback-record:validate -- <rollback-record.json>` validates a record.
- `npm run rollback:verify -- <recovery-report.json> <rollback-record.json>` verifies recovery evidence.
- `npm run operations:contract:test` covers the recovery contract.

These commands do not constitute actual Production rehearsal evidence.

## Incident severity

| Level | Trigger | Immediate action |
|---|---|---|
| SEV-1 | security/data loss, broad outage, learning/grade integrity | stop traffic/change, contain, notify PO/security, rollback/DR decision |
| SEV-2 | core role flow or availability materially degraded | freeze release, triage, rollback if threshold, update stakeholders |
| SEV-3 | limited workaround/cosmetic | ticket, workaround, monitor, CR if behavior change |

## Planned rollback sequence

1. Declare incident ID; capture current revision/digest, metrics, logs and user impact.
2. Confirm prior stable revision/digest and data compatibility; get DevOps/TL authority (emergency containment may precede formal record).
3. Shift traffic to prior revision using approved workflow/provider operation; validate `/ready`, version, smoke and data invariants.
4. Stop destructive writes only when approved; never reset Production data as a first action.
5. Record detection/decision/recovery UTC, metrics, failed/restored identity, evidence and next action.
6. Open RCA/CAPA and re-entry gate; communicate actual status and workaround.

## Incident record

```text
Incident ID: <PENDING>
Environment/release/revision/digest: <PENDING>
Detected/decided/recovered UTC: <PENDING>
Impact and severity: <PENDING>
Decision: MONITOR | ROLLBACK | DR | NO_GO
Failed/restored revision: <PENDING>
Evidence/commands/workflow: <PENDING>
Data integrity/security checks: <PENDING>
Owner, communications, RCA/CAPA: <PENDING>
```
