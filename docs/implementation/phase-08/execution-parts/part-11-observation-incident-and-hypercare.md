# Part 11 - Observation, Incident and Hypercare

## Outcome

The deployed release remains healthy through the agreed observation window and has an actionable incident path.

## Entry

- G6 deployment Actual and smoke Pass.

## Tasks

1. Record T+0, T+15m, T+1h, T+24h and T+72h observations.
2. Review availability, 5xx/error rate, p95 latency, instance/restart/cold-start, MongoDB errors and authentication failures.
3. Trigger a safe alert test and confirm destination/actor/time; do not fabricate on-call acknowledgement.
4. Review logs for request IDs, release identity and redaction.
5. Classify incidents, choose observe/forward-fix/rollback and record decision SLA.
6. When rollback is needed, restore prior digest/revision, verify health/version/role smoke and assess data compatibility.
7. Close hypercare only after unresolved signals have owner and target.

## Exit

`P08-EV-038..040` are complete, no untriaged regression remains and rollback/incident records reflect actual actions. For an academic demo, the owner is the named support contact; no 24/7 SLA is implied.
