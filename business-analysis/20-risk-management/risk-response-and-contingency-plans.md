# Risk Response And Contingency Plans

## Mục Đích

Tài liệu này chuyển các Risk High/Critical trong Register thành hành động có thể thực hiện. `Prevention` giảm khả năng xảy ra; `Detection` giúp phát hiện sớm; `Contingency` giảm tác động khi risk đã xảy ra. Kế hoạch không khẳng định control đã hoàn thành: mỗi control chỉ được xem là effective khi evidence được review.

## Nguyên Tắc Kích Hoạt Contingency

- Kích hoạt khi trigger trong Risk Register xuất hiện, không chờ đến khi tất cả thông tin đã hoàn hảo.
- Ưu tiên containment an toàn: dừng rollout/mutation, giới hạn feature hoặc chặn access trước khi sửa sâu.
- Không chạy rollback database, restore, xóa data, rotate secret hay public communication dựa trên suy đoán; tuân theo authority/runbook tương ứng.
- Mọi contingency phải ghi issue/incident timeline, version/environment, affected user/data, action và kết quả xác minh.
- Sau recovery, đánh giá lại residual risk và tạo corrective/preventive action nếu nguyên nhân còn tồn tại.

## Kế Hoạch Theo Risk Trọng Yếu

| Risk | Prevention và detection | Contingency khi trigger xảy ra | Owner / authority | Evidence để giảm/đóng risk |
| --- | --- | --- | --- | --- |
| R-001 Scope creep | BA duy trì scope baseline, MoSCoW, RTM; mọi thay đổi workflow/API/data/NFR qua Change Control. | Freeze change chưa phân tích; tách khỏi MVP hoặc hoãn release cho đến khi PO quyết định. | PO accountable; BA điều phối. | Approved CR/decision, updated scope/FR/AC/RTM/release plan. |
| R-002 Stakeholder/UAT availability | Xác nhận representative, lịch review, proxy và test data trước UAT. | Escalate PO; đổi lịch, thay representative có authority hoặc defer affected scope. Không coi thiếu UAT là pass. | PO + BA + QA Lead. | UAT participant list, execution result, sign-off/explicit scope deferral. |
| R-003 Cloud readiness | Chọn provider qua ADR; verify account, region, quota, DNS/SSL, secret, registry, monitoring trước milestone. | Chuyển demo về approved staging/local fallback chỉ khi scope nêu rõ; reschedule Cloud release; không dùng account cá nhân không kiểm soát. | DevOps + PO. | ADR, environment checklist, deployment/health record, cost/quota confirmation. |
| R-004 Invitation security | One-time/expiry/revoke/email matching, token hash-at-rest, safe error, rate limit and AuditLog; test accepted/expired/revoked/mismatch paths. | Revoke affected pending invitation; block/review suspicious activation; rotate/replace token flow if exposure; create security incident if unauthorized access is plausible. | Backend Lead; Security Reviewer for high impact. | API/data review, security tests, safe log review, audit/revoke evidence. |
| R-005 RBAC/object access | Authorization matrix, server-side role plus ownership/enrollment check, negative API/E2E tests and least privilege review. | Disable affected endpoint/feature or restrict policy; invalidate affected access where appropriate; assess exposure, preserve logs and open incident/defect. | Technical Lead; Security Reviewer for breach. | Endpoint authorization test, code review, access matrix/Swagger and QA evidence. |
| R-006 Token/session policy | Chốt token storage/refresh/CSRF ADR; use expiry, revoke/logout policy, secure transport and no raw token logs. | Revoke/rotate compromised secret/token policy; force re-auth if authorized; investigate audit/logs without exposing token value. | Technical Lead + Security Reviewer. | Accepted ADR, auth security tests, config/code review, release verification. |
| R-007 Secret exposure | Secret store/environment references, masked logging, repository scan, trusted CI variable and rotation procedure. | Revoke/rotate exposed credential immediately; limit access, redeploy with new reference, assess database/Cloud impact. | DevOps + Technical Lead. | Scan/review output, rotation record, post-rotation health check, incident record if needed. |
| R-008 Data integrity | Unique constraints/indexes, idempotency keys, atomic/compensating behavior, reconciliation and retry tests for join/progress/grade. | Stop unsafe mutation/job; preserve evidence; repair through reviewed script/forward-fix; restore only via DR authority if necessary. | Backend Lead + QA Lead; Tech Lead approves risky repair. | Schema/index proof, integration/regression/reconciliation result, migration/rebuild record. |
| R-009 Deadline/score correctness | Backend-owned formula, timezone/boundary tests, reset reason/history/audit, recalculation/rebuild plan, role/ownership checks. | Disable affected calculation/feature if result unsafe; preserve original records/history; correct with authorized recalculation and communicate affected scope. | PO + Backend Lead; QA verifies. | BR/FR/AC trace, test results, audit/history sample, recalculation reconciliation. |
| R-010 Backup/restore | Private backups, backup success monitoring, documented collection/media scope and restore rehearsal in isolated target. | Declare incident owner; identify latest suitable backup and expected data loss; restore per DR runbook, validate data and core flows before cutover. | DevOps + Technical Lead. | Backup ID/result, restore rehearsal, actual RPO/RTO record, post-restore smoke. |
| R-011 Bad deploy/migration | Immutable artifact, compatibility review, pre-release backup, prior stable target and forward-fix/rollback plan. | Stop rollout; choose protected application/config rollback or approved forward-fix. Treat database restore as separate, authorized recovery. | DevOps + Technical Lead. | Release record, artifact digest, Staging/prod smoke, rollback/forward-fix evidence. |
| R-012 CI/CD quality gap | Protected branch/environment, required build/test/security checks, manual approval for high-risk deploy and immutable artifact provenance. | Block promotion/release; run missing gate or formally remove affected scope. Do not bypass a Must gate silently. | DevOps + QA Lead + Tech Lead. | Pipeline run, required-check configuration, artifact digest and release approval. |
| R-013 API contract drift | Swagger updated with change, schema/error/auth review, versioning/compatibility decision, frontend integration test. | Freeze incompatible client/server promotion; rollback compatible artifact or provide reviewed backward-compatible fix; create defect/CR as applicable. | Backend + Frontend Leads; QA validates. | Swagger operation/schema, contract/integration test, API release note. |
| R-014 Join integrity | Ordered policy checks, active-state validation, unique Enrollment, atomic join and safe recovery for retry/error. | Disable affected join method or Classroom setting; repair duplicate/partial records only with reviewed data action and audit. | Backend Lead + QA Lead. | Join test matrix, duplicate/retry negative tests, data reconciliation/audit. |
| R-016 Privacy/export/logging | Minimize fields, authorization/scope/projection/file expiry, redact logs/errors, secure download re-authorization and privacy test. | Revoke download/feature access, contain distribution, preserve safe evidence, assess affected data and follow security incident process. | Technical Lead + Security Reviewer. | Log/export review, security test, policy/retention confirmation, audit event. |
| R-017 File/media | Feature-gate upload until policy is ready; validate type/size/ownership; use private storage and request-time authorization. | Disable upload/download path, reject unsafe objects, investigate object/metadata consistency; do not bulk-delete without review. | Backend Lead + DevOps. | Storage design, upload/authorization tests, error/cleanup behavior evidence. |
| R-018 Observability | Implement health/version/log/metric/alert baseline and named escalation route; verify after deploy. | Declare incident, inspect recent deploy/version/health/dependency/logs; mitigate per release/rollback runbook. | DevOps + Technical Lead. | Monitoring/alert configuration, health/version checks, incident drill or release evidence. |
| R-019 Performance | Pagination/filter, index/query plan, representative data test, resource baseline and no unbounded list endpoints. | Rate-limit/degrade non-critical query, scale within approved capability, rollback regression or fix query/index after assessment. | Backend Lead + DevOps. | Performance baseline, query/index review, monitoring result, regression test. |
| R-020 Provider outage | Provider readiness/dependency health, documented account/support route, artifact/IaC/backup recovery directions. | Communicate degradation, follow provider escalation; fail safely and recover using approved architecture/DR capabilities. | DevOps + PO. | Provider/environment readiness record, health/incident timeline, recovery verification. |
| R-022 Supply chain | Trusted base image, dependency scan/update policy, lock/version review and tested artifacts. | Block vulnerable build or replace dependency/image; rotate secrets if exposure is suspected; validate rollback/compatibility. | Tech Lead + DevOps. | Scan output, dependency update PR/test, artifact provenance. |
| R-023 Missing QA/UAT evidence | Traceability Gap Register reviewed at RC; Must scenarios, UAT and NFR/DevOps gates linked to actual result. | No-Go or remove/defer uncovered scope; waiver only under defect/waiver policy, never to hide missing security/data evidence. | QA Lead + PO + BA. | CI/QA/UAT evidence, accepted waiver/deferral, Go/No-Go record. |
| R-026 Public registration abuse | Enforce request field allowlist, fixed `STUDENT`/`ACTIVE`, normalized unique email, rate limiting, safe validation and registration-spike monitoring; run privilege-injection/burst tests. | Temporarily throttle/disable public registration through an authorized operational control, block abusive source where lawful, remove fraudulent accounts through approved process and investigate any privilege creation as a security incident. | Backend Lead + Security Reviewer + DevOps. | TS-001/001A, SEC-AC-006/007, rate-limit configuration/test, monitoring evidence and incident/cleanup record if triggered. |

## Containment Decision Matrix

| Tình huống | Containment ưu tiên | Không được làm |
| --- | --- | --- |
| Suspected authorization/privacy breach | Chặn hoặc thu hẹp access, giữ evidence, security triage. | Tiếp tục expose endpoint để “thu thập thêm dữ liệu” hoặc xóa audit/log liên quan. |
| Sai grade/progress/deadline | Dừng mutation/calculation nếu cần, giữ history, xác định affected scope. | Ghi đè hàng loạt không audit hoặc sửa trực tiếp data Production không có approval. |
| Deploy lỗi | Dừng rollout, xác nhận version/impact, rollback/forward-fix theo plan. | Rollback database tùy tiện chỉ vì application rollback. |
| Backup/restore concern | Xác minh backup ID/scope, thực hiện restore rehearsal hoặc DR theo authority. | Restore đè Production vào nhầm environment hoặc tải dump có PII về máy cá nhân. |
| Secret exposure | Rotate/revoke, limit access, redeploy and assess impact. | Commit secret mới vào source, đăng token/credential vào issue/chat/log. |
| API contract mismatch | Chặn promotion/roll back compatible side, rõ error/owner. | Buộc frontend dùng undocumented endpoint/schema hoặc đổi contract không cập nhật Swagger. |

## Exit Criteria Cho Risk Response

Một response chỉ được coi là complete khi có đầy đủ, phù hợp với risk:

- Action owner hoàn tất và link artifact/evidence thật.
- QA/Technical/DevOps/PO reviewer xác nhận theo domain.
- Positive, negative và regression scenario trọng yếu được chạy nếu risk liên quan behavior/code.
- Contingency/runbook được kiểm tra ở mức phù hợp cho data/deployment/recovery.
- Register cập nhật residual risk, status, review date và linked issue/defect/incident/CR.

## Liên Kết

- Risk list/trigger: `risk-register.md`.
- Escalation: `risk-monitoring-and-escalation.md`.
- Incident workflow: `incident-management.md`.
- DevOps release/recovery: `../15-devops-deployment/deployment-runbook.md`, `../15-devops-deployment/rollback-strategy.md`, `../15-devops-deployment/backup-restore-disaster-recovery.md`.
