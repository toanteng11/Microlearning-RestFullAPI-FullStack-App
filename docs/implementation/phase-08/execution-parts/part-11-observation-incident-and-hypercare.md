# Part 11 - Observation, Incident and Hypercare

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`

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

## Implemented tooling

- `phase-08:post-release:validate` accepts only an `ACTUAL` post-release record with all five chronological checkpoints (`T+0`, `T+15m`, `T+1h`, `T+24h`, `T+72h`) on the exact Production revision and immutable image.
- The contract requires a real alert acknowledgement, log request-ID/release-identity/redaction review, a recovery decision, zero unresolved Critical/High issues and a closed hypercare recommendation.
- The validator links `P08-EV-038`, `P08-EV-039` and `P08-EV-040` without accepting credentials, connection strings or placeholder values.

The code is locally verified. Part 11 cannot become `DONE` until the actual protected Production release has completed the full 72-hour observation window.
