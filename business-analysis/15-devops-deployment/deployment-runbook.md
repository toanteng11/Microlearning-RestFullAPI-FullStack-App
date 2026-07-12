# Deployment Runbook

## Mục Đích

Runbook này là checklist thao tác cho DevOps/Technical Lead khi deploy hoặc phục hồi hệ thống. Provider command cụ thể được bổ sung sau khi Cloud/CI provider được chọn; trước đó, quy trình và điểm kiểm soát dưới đây vẫn bắt buộc.

## Vai Trò Và Precondition

| Role | Trách nhiệm khi deploy |
| --- | --- |
| DevOps Operator | Thực thi protected pipeline/runtime action, quan sát log/health, ghi deployment record. |
| Technical Lead | Xác nhận architecture/API/data/security/migration risk và quyết định rollback/forward-fix khi incident. |
| QA Lead | Cung cấp/verify smoke/UAT evidence, xác nhận critical flow. |
| Product Owner | Approve Production scope/high-risk release, nhận communication/known issue. |

Precondition bắt buộc: approved release candidate, exact artifact version/digest, target environment, release note, migration/config/backup decision, rollback target và các owner có thể liên lạc.

## Staging Deployment Runbook

### 1. Pre-Deploy

- [ ] Xác nhận target là **Staging**, domain/project/database/bucket/secret namespace đúng.
- [ ] Xác nhận artifact frontend/backend immutable tag/digest, commit SHA và CI quality pass.
- [ ] Kiểm tra config reference: API base URL, `PUBLIC_WEB_URL`, allowed CORS origin, database, storage, monitoring; không hiển thị secret value.
- [ ] Review API/Data/Migration change: backward compatibility, index/build/recalculation task, test data impact.
- [ ] Nếu risky change, tạo/verify Staging snapshot và rollback/forward-fix plan.
- [ ] Kiểm tra pipeline concurrency để không có deploy khác cùng environment.

### 2. Deploy

- [ ] Trigger protected CI/CD Staging deployment dùng artifact đã chọn, không build source mới ngoài pipeline release candidate.
- [ ] Theo dõi deploy/job log; không copy secret/log nhạy cảm vào ticket.
- [ ] Áp dụng migration/index theo runbook (nếu có), ghi start/end/result.
- [ ] Deploy Backend/API runtime, đợi readiness/health.
- [ ] Deploy Frontend static artifact/container, cấu hình cache invalidation/SPAs fallback theo provider.

### 3. Verify

- [ ] `GET /health` trả status phù hợp; detailed health chỉ được dùng với quyền phù hợp.
- [ ] Version endpoint trả đúng app version/commit/environment.
- [ ] Browser mở frontend HTTPS, direct refresh Student/Teacher/Admin route không `404`.
- [ ] Frontend gọi đúng API không CORS/mixed-content error.
- [ ] Smoke Student Dashboard To-do, Teacher Course Dashboard, Admin Student/Teacher/Admin lists.
- [ ] Smoke change-specific flow (Invitation/Classroom join/deadline reset/grade/upload) và audit/cleanup test data nếu cần.
- [ ] Log, metric/error tracking và deployment record nhận event; không có 5xx/restart/latency bất thường.
- [ ] Ghi QA/UAT evidence, known issue hoặc mark release candidate not ready.

### 4. Failure

- [ ] Stop deployment/promotion.
- [ ] Preserve pipeline log/version/config reference and assess impact.
- [ ] Rollback to prior stable Staging artifact or forward-fix according to `rollback-strategy.md`.
- [ ] Verify recovered health/smoke and open defect/incident record.

## Production Deployment Runbook

### 1. Go / No-Go

- [ ] Staging QA/UAT/DevOps evidence and approval complete.
- [ ] Product Owner/Technical Lead release approval meets risk matrix.
- [ ] Production domain/account/project/database/bucket/secret/environment explicit confirmed.
- [ ] Artifact digest is the same one verified in Staging, unless a new RC has repeated CI/Staging validation.
- [ ] Release note, deploy window, communication channel, incident owner and rollback target known.
- [ ] Backup/pre-release snapshot and restore/migration compatibility decision recorded for risky data change.
- [ ] Monitoring dashboard/alert/access available; no active unresolved incident blocks release.

### 2. Deploy

- [ ] Start protected Production pipeline; record pipeline run/deployment ID/time/operator.
- [ ] Apply migration/index only as approved; no destructive manual DB action without explicit authorization/runbook.
- [ ] Deploy Backend image and wait for provider readiness/health; verify API version/commit/environment.
- [ ] Deploy Frontend artifact; invalidate cache according to release plan; ensure API compatibility.
- [ ] Do not change multiple unrelated config/secret/resource manually during release unless recorded/approved.

### 3. Post-Deploy Monitoring Window

- [ ] Health/readiness, API 5xx/p95 latency, container restart/CPU/memory, MongoDB/storage status baseline normal.
- [ ] Browser/API smoke with safe account data: login, Student To-do, Teacher Course/roster/ranking, Admin role list.
- [ ] Test changed feature and verify audit/read model/migration outcome where applicable.
- [ ] Confirm HTTPS/CORS/SPA fallback and no Production stack trace/secret in log/response.
- [ ] Monitor alert/error tracking for agreed window; compare to pre-release baseline.
- [ ] Send release status and close release only after criteria pass.

### 4. Production Failure Response

- [ ] Declare incident owner/severity; stop rollout and stakeholder communication as required.
- [ ] Check version/recent migration/config/health/log/metric/dependency before choosing action.
- [ ] Execute protected application/config rollback or approved forward fix; escalate data recovery only through DR runbook.
- [ ] Verify health/version/role smoke/monitoring after mitigation.
- [ ] Record incident/rollback/recovery and schedule root-cause/prevention review.

## Database Migration Mini-Runbook

| Step | Check |
| --- | --- |
| Classify | Additive, backward-compatible, forward-only or destructive. |
| Backup | Fresh snapshot/pre-release backup if risk requires; record ID/time. |
| Verify | Test migration in Staging with representative sanitized data; estimate duration/lock/impact. |
| Apply | Use versioned idempotent script/tool controlled by CI/operator; no random console query. |
| Observe | Log rows/documents changed, error, duration; inspect app health/query/index. |
| Validate | Login/classroom/progress/grade/deadline/data count/read model smoke. |
| Recover | Prefer forward fix/rebuild for compatible change; restore only per approved DR path. |

## Emergency Manual Action Rule

Manual provider console/CLI action is allowed only for incident mitigation when pipeline is unavailable/too slow or provider requires it. Operator must use least privilege, capture exact action/time/environment, avoid exposing secret, and reconcile action into CI/IaC/documentation after incident. Destructive database/storage action still requires explicit recovery authorization.

## Deployment Record Template

| Field | Nội dung |
| --- | --- |
| Deployment ID / environment | Pipeline/provider reference and Staging/Production |
| Date/window/operator | Start/end and responsible operator |
| Artifact | Frontend/backend version, tag/digest, commit SHA |
| Config/migration | Config reference version, migration/index/rebuild result (no secret) |
| Backup/rollback | Backup ID/decision, prior stable artifact, recovery plan |
| Verification | Health/version/API/UI/smoke/monitoring results |
| Approval | QA/Technical Lead/PO approver as required |
| Outcome | Success / rollback / forward fix / incident / known issue |
| Follow-up | Link to ticket, root cause, action owner/due date |

## Runbook Maintenance

- DevOps updates provider-specific command, screenshot-free access steps, ownership/contact and environment identifier after provider selection.
- Every release/incident/restore rehearsal that exposes an unclear/missing step creates a runbook improvement task.
- Review the runbook before high-risk release and at least once per project milestone; stale credential/value must never be embedded in it.

## Liên Kết

- CI/CD: `ci-cd-pipeline.md`.
- Cloud/environment: `cloud-deployment.md`, `deployment-environment-matrix.md`.
- Recovery: `rollback-strategy.md`, `backup-restore-disaster-recovery.md`.
- Monitoring: `observability-operations.md`.
