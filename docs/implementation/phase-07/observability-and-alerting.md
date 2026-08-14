# Observability And Alerting

## 1. Mục tiêu

Người vận hành phải trả lời được: revision nào đang chạy, request nào lỗi, dependency nào không ready, mức
tài nguyên/cost ra sao và ai cần hành động. Monitoring không được chứa dữ liệu nhạy cảm.

## 2. Structured logging

Log JSON fields tối thiểu:

| Field | Ý nghĩa |
| --- | --- |
| `timestamp` | UTC timestamp |
| `severity` | normalized severity |
| `event` | stable event name |
| `requestId` | correlation ID |
| `http.method`, `http.route`, `http.status`, `durationMs` | request telemetry |
| `actorRole` | role khi có, không cần PII |
| `service`, `environment`, `revision` | deployment context |
| `commitSha`, `imageDigest` | trace release |
| `error.code` | stable application error code |

Không log raw body mặc định. Email/ID chỉ log khi thật sự cần và phải pseudonymize/redact.

## 3. Required events

- `application.started`, `application.stopping`, `application.stopped`;
- `database.connected`, `database.disconnected`, `database.connection_failed`;
- `http.request.completed`, `http.request.failed`;
- auth events ở mức audit phù hợp: login success/fail, refresh reuse/revoke, permission denied;
- deployment/seed/backup/restore/rollback operational events;
- unhandled exception/rejection.

## 4. Metrics/dashboard

Dashboard Staging tối thiểu:

- request count theo status class;
- 5xx rate;
- p50/p95/p99 latency;
- Cloud Run instance count/concurrency;
- CPU/memory utilization;
- startup latency/cold starts nếu metric có;
- `/ready` failure/uptime;
- MongoDB connection/error signal từ app;
- authentication failure/rate-limit signal;
- deployment annotations/revision.

## 5. Uptime check

- Target `/health` cho process availability.
- Một readiness/API synthetic check có kiểm soát cho dependency availability.
- Không dùng endpoint yêu cầu secret trong public uptime checker nếu không có secure mechanism.
- Frequency phù hợp free/cost quota; ghi expected monthly executions.

## 6. Alert baseline

| Alert | Điều kiện baseline | Severity | Hành động |
| --- | --- | --- | --- |
| Uptime failure | 2-3 lần liên tiếp | High | kiểm tra revision/Cloud Run |
| 5xx rate | >5% trong 5 phút với đủ volume | High | triage + rollback consideration |
| p95 latency | >2s trong 10 phút | Medium/High | kiểm tra Atlas/cold start |
| Readiness failure | liên tục 5 phút | High | kiểm tra Atlas/config |
| Memory | >80% kéo dài | Medium | profile/tune resource |
| Auth failures | tăng bất thường | Medium/Security | kiểm tra attack/config |
| Budget | 50/80/100% | Info/High | owner xem scale/usage |

Threshold được hiệu chỉnh bằng Staging evidence; không tuyên bố SLO Production từ số giả định.

## 7. Alert routing

- Mỗi alert có owner, notification channel, severity và runbook URL.
- Kênh email phù hợp đồ án; không ghi secret trong notification.
- Test notification phải được thực hiện ít nhất một lần.
- Alert không có người nhận hoặc runbook không được tính là hoàn thành.

## 8. Redaction verification

Gửi canary request/error chứa fake token/password/URI rồi kiểm tra:

- Cloud Logging không chứa plain canary;
- GitHub Actions diagnostics không chứa;
- alert payload không chứa;
- Playwright artifacts không vô tình chụp secret.

Sau test phải xóa/revoke canary data theo policy.

## 9. Retention and access

- Retention theo default/approved budget, đủ cho Phase review.
- IAM log viewer tách deployer khi có thể.
- Không xuất full logs công khai trong repository.
- Evidence dùng query/result summary đã redaction.

## 10. Acceptance evidence

- dashboard URL/screenshot;
- uptime check config và successful executions;
- alert policy list;
- test notification;
- sample structured log với request/revision/digest;
- redaction negative test;
- runbook links và owner.
