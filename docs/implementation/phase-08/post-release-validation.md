# Phase 08 — Post-Release Validation and Hypercare

## Observation policy

Observation starts only after an `ACTUAL` deployment record. If deployment is not performed, rows remain `NOT RUN`; do not simulate metrics.

| Checkpoint | Minimum checks | Owner | Status |
|---|---|---|---|
| T+0 | revision/traffic, health/ready/version, smoke, logs | DevOps/QA | `PENDING` |
| T+15m | error rate, latency, auth/session, database connectivity, alerts | DevOps | `PENDING` |
| T+1h | role journeys, write/read integrity, capacity and cost signals | QA/DevOps | `PENDING` |
| T+24h | incidents/tickets, logs, uptime, backup job/alert, known issues | Support/DevOps | `PENDING` |
| T+72h | trend, recovery readiness, support acceptance, closure recommendation | PO/TL | `PENDING` |

## Hypercare rules

- Keep release owner and technical escalation available for the agreed window.
- Triage every alert/ticket with severity, customer impact, decision and evidence.
- No feature work during hypercare; a behavior change is CR and may require rollback.
- Rollback when safety, integrity, security or availability thresholds are exceeded; otherwise document rationale and monitor.

## Closure criteria

No untriaged Critical/High issue; metrics are compared with the BA Staging thresholds in `performance-capacity-and-cost-final.md`; support can operate runbooks; communication/known issues current; backup/restore and rollback evidence retained; PO/TL approve G7. Dataset/window/tool and any profile-specific SLO decision must be recorded as `ACTUAL` rather than inferred.
