# Risk Review Checklist

## Mục Đích

Checklist này hỗ trợ BA, Product Owner, Technical Lead, QA và DevOps review nhất quán trước sprint, integration, UAT và release. Mỗi ô check cần có evidence hoặc record rõ; không đánh dấu pass chỉ vì “đã có kế hoạch”.

## 1. Risk Register Governance

- [ ] Risk mới từ scope change, assumption/dependency, defect, incident, security scan hoặc deployment được ghi nhận/cập nhật.
- [ ] Mỗi Risk High/Critical có statement rõ, P/I/score, affected artifact, owner, trigger, response, contingency và review target.
- [ ] Không có Critical Risk thiếu owner/response hoặc High Risk quá hạn mà chưa escalate.
- [ ] `Open`, `Monitoring`, `Accepted Risk`, `Materialized` và `Closed` được dùng đúng nghĩa; residual score chỉ giảm khi evidence được review.
- [ ] Risk đã materialized có link Issue/Defect/Incident/CR; history không bị xóa.
- [ ] Accepted Risk có authority, rationale, mitigation/workaround, affected release và expiry/review date.

## 2. Scope, Stakeholder Và Product

- [ ] Change ảnh hưởng MVP, role, invitation, join, deadline, scoring, API/data, NFR hoặc release đã qua Change Control.
- [ ] Product Owner/Teacher/Student/Admin representative và UAT/sign-off authority được xác nhận trước stage phù hợp.
- [ ] Manual invitation UX nêu rõ Admin tự copy/gửi link; system không bị hiểu là đã gửi/delivery success.
- [ ] Scope ngoại lệ như external notification, AI, SIS, payment, native mobile hoặc weighted score không được đưa vào implementation ngầm.
- [ ] Decision/Open Issue có target và impact rõ; không dùng assumption chưa xác nhận làm release evidence.

## 3. Security, Privacy Và Data Integrity

- [ ] Auth, account status, RBAC và object-level authorization có negative test cho Student/Teacher/Admin/Admin scope.
- [ ] Public Student registration chỉ tạo `STUDENT`/`ACTIVE`, không auto-session/Enrollment, có field allowlist, duplicate handling, rate limit và registration-spike monitoring.
- [ ] Invitation token one-time/expiry/revoke/email matching/hash-at-rest/safe error/rate limit/audit được trace và test.
- [ ] Raw password, token, secret, PII hoặc full file content không xuất hiện trong repository, client bundle, log, error hay evidence chia sẻ.
- [ ] Export/report/media download kiểm tra permission/scope/projection/expiry/re-authorization và AuditLog khi policy yêu cầu.
- [ ] Enrollment, Progress, Submission, Grade, deadline reset và AuditLog có uniqueness/idempotency/history/atomic-or-compensation direction.
- [ ] Deadline/late/missing/processScore/ranking được backend tính, test boundary/timezone/retry/regrade/recalculation và không bị frontend tự quyết định.
- [ ] Data repair/migration/restore action có approval, backup/recovery plan và audit/reconciliation; không sửa dữ liệu production tùy tiện.

## 4. API, Frontend Và Quality Evidence

- [ ] Mọi API mới/sửa có Swagger/OpenAPI, schema/error/auth/authorization/pagination và compatibility impact rõ.
- [ ] ReactJS route/page integration có loading/empty/error, navigation back/next/breadcrumb và role-specific access state phù hợp.
- [ ] Student To-do, Classroom join, Teacher Course Dashboard/ranking/deadline và Admin role-specific list có positive/negative/regression evidence.
- [ ] File/media/upload nếu có trong release đã có scope/storage/access/validation/cleanup policy; nếu chưa, feature được defer/gate rõ.
- [ ] Traceability Gap Register không còn `Pending Implementation Evidence` ảnh hưởng Must flow tại gate, trừ khi scope đã được deferred chính thức.

## 5. DevOps, Cloud Và Recovery

- [ ] Environment, secret reference, CORS/HTTPS, health/version endpoint và artifact/commit identity được xác minh ở target environment.
- [ ] CI/CD có required build/test/security/approval gate phù hợp; deploy không bypass failure bằng thao tác không trace.
- [ ] Cloud provider/account/region/quota/DNS-SSL/registry/monitoring decision đã sẵn sàng cho target stage.
- [ ] Logs, metrics, health, alert, owner và escalation/runbook đủ để triage API, MongoDB, storage, auth, backup và deployment signal.
- [ ] Backup ID/scope/access, pre-release snapshot nếu risk yêu cầu và restore rehearsal evidence được xác minh.
- [ ] Rollback/forward-fix target tương thích với API/data migration; team không coi application rollback là database recovery.
- [ ] High-risk release không diễn ra khi không có monitoring window, contact owner, communication và contingency rõ.

## 6. UAT Và Release Decision

- [ ] Must functional, security/privacy, API/data, UI/UX và DevOps acceptance có actual test/UAT evidence hoặc explicit approved deferral.
- [ ] Critical/High defect, security/data concern, missing restore/rollback evidence hoặc blocked UAT được xem là No-Go trừ khi authority thay scope theo policy.
- [ ] Waiver chỉ dùng theo `../18-acceptance-criteria/defect-waiver-management.md`, không dùng để che thiếu test/security/data evidence.
- [ ] Release note ghi version/artifact, scope, known issue, backup/recovery, smoke/monitoring result, risk/waiver và approver.
- [ ] Post-release verification kiểm tra health/version, Student/Teacher/Admin core flow, changed feature, logs/metrics và data impact phù hợp.
- [ ] Incident/near-miss/Critical defect có RCA/CAPA owner/target, cập nhật Risk Register và tài liệu/test/runbook liên quan.

## Review Record Tối Thiểu

| Field | Nội dung |
| --- | --- |
| Review ID / date / stage | Sprint, Integration, UAT, Staging, Release hoặc Post-Incident. |
| Participants | BA, PO, Technical Lead, QA, DevOps, Security/domain owner khi cần. |
| Top Risk / change | Risk ID, score/status, thay đổi/evidence mới. |
| Blocker / decision | Issue/Defect/Gap/CR, owner, target và authority cần quyết định. |
| Outcome | Proceed / Proceed with conditions / No-Go; rationale và communication. |
| Follow-up | Action, owner, due trigger, evidence expected. |

## Liên Kết

- Methodology/register: `risk-governance-and-methodology.md`, `risk-register.md`.
- Monitoring/incident: `risk-monitoring-and-escalation.md`, `incident-management.md`.
- UAT/waiver: `../18-acceptance-criteria/`.
- Release/recovery: `../15-devops-deployment/`.
