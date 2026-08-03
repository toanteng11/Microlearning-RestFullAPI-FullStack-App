# Part 12 - Observability And Alerting

## Goal

Cung cấp structured logs, dashboard, uptime và actionable alerts gắn đúng revision/digest mà không lộ
secret/PII.

## Parent PR

`P07-PR06 - Operations Recovery And Rollback`

## Dependencies

- Part 11 Cloud journeys stable.
- Monitoring notification owner available.

## Work

1. normalize structured log fields/events/severity;
2. attach request ID/revision/commit/digest metadata;
3. enforce redaction serializers;
4. Terraform dashboard and log-based metrics where needed;
5. create uptime/readiness checks;
6. create error/readiness/latency/memory/auth/budget alerts;
7. link each alert to owner/runbook;
8. trigger safe test signal;
9. confirm notification reception;
10. run fake-secret/PII canary and inspect logs/alerts;
11. record retention/access/cost;
12. tune thresholds from observed baseline.

## Validation

- TC-058..061 Pass;
- dashboard identifies active revision/digest;
- alert reaches owner;
- canary never appears plain;
- no noisy infinite alert loop.

## Evidence

`P07-EV-026..028`, dashboard/uptime/alert/log samples.

## Stop Conditions

- alert has no owner/runbook;
- secret/PII in Cloud Logging or notification;
- monitor only checks `/health` and cannot detect dependency failure;
- threshold disabled to hide failure.

## Definition Of Done

- AC-053..056 Pass.
