# Phase 08 — Observability and Operations Handover

## Baseline and boundary

Terraform module `infrastructure/terraform/modules/monitoring` and Staging workflow define Cloud Monitoring resources. Production monitoring defaults to disabled and is enabled together with service/secrets for the reviewed Part 08 plan; Production observability remains `PENDING` until remote plan and provider evidence exist.

## Minimum signals

| Signal | Required observation | Owner | Status |
|---|---|---|---|
| Availability | `/health`, `/ready`, uptime check | DevOps | `PENDING` |
| Identity | app version/commit/image digest/revision | DevOps | `PENDING` |
| Errors | HTTP 5xx, startup/readiness, auth failures | DevOps | `PENDING` |
| Latency/capacity | request latency, Cloud Run instances/concurrency/cold start | DevOps | `PENDING` |
| Data | Atlas connectivity/pool/timeouts, integrity indicators | TL/DevOps | `PENDING` |
| Security | redacted logs, secret/access anomalies, audit events | Security | `PENDING` |
| Cost | instance/egress/Atlas usage vs budget | PO/DevOps | `PENDING` |

## Handover package

Dashboard and uptime/alert links; service/revision/digest; environment/config and secret ownership (no values); runbooks for deploy/rollback/incident/backup/restore; on-call/escalation; retention and access; known limitations; support ticket route; training acknowledgement.

## Alert validation

Alert must have signal, threshold, notification destination, test/verification record, owner and response time. `APPROVED_NA` for a solo-project alert test must not be described as an actual alert delivery.

## Operations acceptance

Support owner can locate the dashboard, identify current revision, execute safe health/rollback instructions, escalate a data/security incident and access redacted evidence. Record G7 handover decision and UTC.
