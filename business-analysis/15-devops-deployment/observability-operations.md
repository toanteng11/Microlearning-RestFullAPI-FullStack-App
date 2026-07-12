# Observability And Operations

## Mục Đích

Observability giúp team trả lời nhanh: hệ thống có đang hoạt động không, lỗi gì xảy ra, ai bị ảnh hưởng, version nào đang chạy và sau deploy có suy giảm không. Nó kết hợp logging, metrics, health check, alert, deployment record và incident workflow.

## Ba Trụ Cột Vận Hành

| Trụ cột | Câu hỏi trả lời | Ví dụ dự án |
| --- | --- | --- |
| Logs | Điều gì đã xảy ra với request/action cụ thể? | `requestId`, API path/status/duration, stack trace server, audit deadline reset. |
| Metrics | Xu hướng/tình trạng hệ thống có xấu đi không? | uptime, p95 latency, 5xx rate, memory/CPU, MongoDB connection, backup success. |
| Traces/correlation | Các event liên quan nhau thế nào? | requestId liên kết frontend error, API log, provider operation/audit. |

AuditLog nghiệp vụ là bổ sung quan trọng nhưng khác application log: nó ghi action ảnh hưởng business như invitation, user status/role, deadline reset, grading.

## Operational Signals

| Signal | Source | Tại sao cần | Owner |
| --- | --- | --- | --- |
| API liveness/readiness | `/health`, platform probe | Biết service/dependency có sẵn sàng | DevOps |
| Release identity | `/api/v1/system/version`, deployment record | Xác nhận đúng commit/environment sau deploy | DevOps + QA |
| API latency | Access log/APM metric | Phát hiện Dashboard/To-do chậm, regress performance | Backend Lead + DevOps |
| 4xx/5xx/error | API error logs/monitoring | Phát hiện code/config/dependency/authorization issue | Developer + DevOps |
| MongoDB connection/latency | Detailed health/database metric | Tránh API báo healthy giả | Backend Lead + DevOps |
| CPU/memory/restart | Runtime metric | Capacity leak/crash loop/throttling | DevOps |
| Storage/upload failure | API/storage log/metric | Media/file flow bị lỗi hoặc quota/policy sai | Backend Lead + DevOps |
| Auth failure rate | Auth event/metric | Brute force/config issue/token problem | Security reviewer + DevOps |
| Backup status | Backup job/provider event | Phát hiện recovery risk trước incident | DevOps |
| Business audit event | MongoDB AuditLog | Điều tra action Admin/Teacher/learning impact | Admin/Technical Lead |

## Structured Log Contract

| Field | Required | Notes |
| --- | --- | --- |
| `timestamp`, `level`, `service`, `environment` | Must | Cho filter/correlation chính xác. |
| `requestId` | Should/Must for API error | Trả safe requestId trong error response khi phù hợp. |
| `method`, `path`, `statusCode`, `durationMs` | Should | Không log full sensitive query/body. |
| `actorId`, `role` | Optional controlled | Chỉ khi cần debug/audit; không log PII dư thừa. |
| `errorCode`, safe message, server stack | Error | Stack chỉ server log, không response Production. |
| `version`, `commitSha`, `deploymentId` | Startup/deploy | Trace regression tới release. |
| secret/token/password/raw file | Forbidden | Mask/redact bằng logger/middleware. |

## Dashboard Và Alert Minimum

| Dashboard/alert | Trigger direction | First response |
| --- | --- | --- |
| API Down | `/health` DOWN nhiều lần hoặc no healthy instance | Check runtime/deploy/recent change/MongoDB; acknowledge incident. |
| High 5xx | 5xx vượt baseline trong 5-10 phút | Inspect error logs/requestId, compare recent deploy; rollback/forward-fix decision. |
| High latency | p95 vượt target/normal baseline | Check database query, load, external storage, resource throttling. |
| MongoDB unhealthy | Dependency `DOWN`/connection error | Check provider status/network/credential/limit; do not accept unsafe mutations. |
| Container restart/memory high | Sustained threshold/restart loop | Inspect process/log/resource/traffic; scale or fix leak. |
| Failed login/invitation spike | Unusual rate | Review rate limit/security/config, avoid exposing user detail. |
| Backup failed | Missed/failed backup job | Investigate/retry per runbook before next release. |
| Storage upload errors | Error threshold | Check bucket policy/quota/credential/provider; preserve user feedback/error. |

Threshold cụ thể phải được đặt từ baseline Staging/Production, không dùng một số “đẹp” nếu chưa có dữ liệu. Mỗi alert cần owner, escalation channel, severity và runbook link.

## Incident Triage Flow

```text
Alert or user report
  -> Acknowledge and assign incident owner
  -> Assess severity / affected users / environment
  -> Check health, version, recent deploy, logs and dependencies
  -> Mitigate: rollback, forward fix, scale, disable feature, provider action
  -> Verify recovery with health/smoke/monitoring
  -> Communicate status and record timeline
  -> Root cause, corrective/preventive actions, close incident
```

| Severity direction | Ví dụ | Response |
| --- | --- | --- |
| Sev-1 | Production unavailable, data integrity/security incident | Immediate Technical Lead/DevOps response; stop rollout, incident process, executive/PO notification. |
| Sev-2 | Critical flow Student/Teacher/Admin fail for many users | Prioritized mitigation same working period; rollback/forward fix decision. |
| Sev-3 | Partial/non-critical degradation, workaround exists | Ticket, monitor, plan fix. |
| Sev-4 | Cosmetic/low impact | Backlog according to priority. |

## Operational Runbook Minimum

- Locate release version/commit/image digest and environment.
- Read basic and detailed health safely; identify dependency status.
- Search log by time/requestId/deployment ID; redact sensitive information when sharing.
- Check dashboard for latency/5xx/restart/database/storage/backup signal.
- Execute approved deploy/rollback/restore procedure, not ad-hoc destructive command.
- Record incident/deployment evidence, owner, status, impact and follow-up.

## Retention And Access

| Data | Access | Retention direction |
| --- | --- | --- |
| Application/API logs | Developer/DevOps authorized | 7-30 days MVP/according policy. |
| Error traces | Developer/DevOps authorized | 30-90 days or policy. |
| AuditLog | Admin/authorized support | Longer retention per privacy/business policy. |
| Deployment/pipeline logs | DevOps/Technical Lead | Retain per release/audit needs. |
| Monitoring dashboards | Project operator | Access restricted; do not expose internal metric public. |

## Acceptance Checklist

- `/health` and version endpoint are monitored/verified after deployment.
- Request/error logs include enough context without secret/raw token/password leakage.
- Dashboard/alerts exist or a documented manual monitoring method exists for API, error, DB, runtime and backup status.
- Alert owner, escalation route and first-response runbook are known.
- Incident/release record links to version, impact, mitigation and follow-up.

## Liên Kết

- NFR logging/monitoring: `../13-non-functional-requirements/logging-monitoring.md`.
- API health: `../11-api-requirements/api-health-devops.md`.
- Release/recovery: `release-management.md`, `rollback-strategy.md`, `backup-restore-disaster-recovery.md`.
