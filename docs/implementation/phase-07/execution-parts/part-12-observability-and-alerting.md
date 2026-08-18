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

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING`.

Đã triển khai:

- module Terraform `infrastructure/terraform/modules/monitoring` với log-based metrics cho HTTP 5xx,
  readiness và authentication failure;
- dashboard Cloud Monitoring, uptime check `/health`, alert policies cho uptime/5xx/readiness/memory;
- notification channel email tùy chọn, owner/severity/runbook labels và `auto_close`;
- log redaction hiện hữu được giữ làm contract bắt buộc cho authorization/cookie/token/password;
- `observability:contract:test` kiểm tra resource bắt buộc, input module và secret-redaction boundary.

Kiểm chứng local: `npm run terraform:validate`, `npm run observability:contract:test` và API typecheck Pass.
Chưa chạy `terraform apply`, notification test, fake-secret canary trên Cloud Logging hoặc kiểm tra chi phí
thật; các evidence đó vẫn Pending cho tới khi có URL/run artifact remote.
