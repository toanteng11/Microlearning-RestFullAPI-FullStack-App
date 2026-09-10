# Phase 08 — Support and Maintenance Model

## Operating model

Phase 08 bàn giao hệ thống đã release cho support/operations; không mở feature mới trong hypercare. Owner/contact thật phải được điền bằng record, không dùng tên giả.

| Level | Responsibility | Escalation | Status |
|---|---|---|---|
| L1 | receive user issue, reproduce safely, known-issue response | L2 | `PLANNED` |
| L2 | application/API/RBAC/data triage, runbook action | TL/DevOps | `PLANNED` |
| L3 | Cloud/IAM/Atlas/recovery/incident decision | Release Owner/TL | `PLANNED` |
| Business | PO decides scope, workaround, acceptance and communication | governance | `PLANNED` |

## Support intake

Ticket must include environment, user role, safe request ID/time, symptom, impact, release/revision and reproduction steps; never include password, token, secret, full URI or private PII. Severity follows `rollback-and-incident-response-final.md`.

## Handover acceptance

- [ ] Support can identify current revision/digest and health/readiness.
- [ ] Runbooks for deployment, rollback, incident, backup/restore and escalation are accessible.
- [ ] Dashboard/alerts/on-call and retention/access policy are known.
- [ ] Known issues/workarounds and release communication are published.
- [ ] Training acknowledgement and G7 owner/date are recorded.

For `ACADEMIC_DEMO_RELEASE`, the owner may cover L1-L3 and Business roles with separate role statements. Support window, contact and maintenance cadence must be bounded and recorded; no 24/7 or organizational SLA is implied. Organization Production still requires named operational coverage.
