# Incident Management

## Mục Đích

Incident Management áp dụng khi một Risk đã gây hoặc có dấu hiệu có thể gây ảnh hưởng thực tế đến availability, security/privacy, data integrity, core learning workflow hoặc release. Tài liệu này định nghĩa cách triage, ownership, communication, recovery, root-cause analysis (RCA) và liên kết lại Risk/Defect/Change.

Đây là lớp quy trình quản trị; thao tác kỹ thuật chi tiết phải dùng `../15-devops-deployment/deployment-runbook.md`, `../15-devops-deployment/rollback-strategy.md` và `../15-devops-deployment/backup-restore-disaster-recovery.md`.

## Phân Biệt Incident Với Defect Và Issue

| Tình huống | Record cần tạo | Ví dụ |
| --- | --- | --- |
| Nguy cơ chưa xảy ra | Risk | Chưa có restore rehearsal. |
| Lỗi được phát hiện trong test, chưa ảnh hưởng user thực tế | Defect + linked Risk nếu có | UAT test phát hiện Student xem sai To-do. |
| Blocker/decision/task đã biết nhưng không phải outage/breach | Issue | Google Cloud project/billing chưa được cấu hình dù provider đã chọn. |
| Service, data, security hoặc user workflow đang bị ảnh hưởng thực tế | Incident; có thể kèm Defect/Issue | Staging/Production API down sau deploy, token exposure, grade corruption. |

## Severity Và Quyền Xử Lý

| Severity | Định nghĩa | Ví dụ | Response direction |
| --- | --- | --- | --- |
| Sev-1 | Production/service critical unavailable; confirmed/suspected major security/privacy breach; data loss/corruption hoặc authorization bypass nghiêm trọng. | API không phục vụ, Student/Teacher không thể hoạt động diện rộng, public sensitive export. | Immediate containment, Technical Lead/DevOps/Security/PO notification, stop rollout, incident command. |
| Sev-2 | Must flow fail cho nhiều user hoặc feature quan trọng có integrity risk; có thể cần rollback/forward-fix trong cùng working period. | Join/grade/deadline processing sai diện rộng, MongoDB degraded nghiêm trọng. | Prioritized mitigation, owner rõ, release/feature restriction, stakeholder communication. |
| Sev-3 | Suy giảm một phần, scope giới hạn, có workaround an toàn, không có security/data integrity impact. | Report filter lỗi, một upload path unavailable nhưng học core vẫn hoạt động. | Ticket/monitor/fix plan, escalate nếu spread/impact tăng. |
| Sev-4 | Low impact/cosmetic/telemetry/documentation issue, không ảnh hưởng core behavior. | UI wording hoặc non-critical metric missing. | Backlog theo priority; không gọi là incident nếu không có operational impact. |

Severity dựa trên impact thực tế và khả năng lan rộng, không dựa trên độ khó sửa. Một incident có thể đổi severity khi có thông tin mới; phải ghi lý do/time của việc đổi.

## Incident Lifecycle

```text
Detected -> Acknowledged -> Triaged -> Contained -> Recovering
         -> Verified -> Resolved -> RCA / Corrective-Preventive Action -> Closed
```

| Trạng thái | Nội dung bắt buộc |
| --- | --- |
| Detected | Alert/user report/time/environment/version ban đầu, người phát hiện. |
| Acknowledged | Incident owner/commander và severity tạm thời được chỉ định. |
| Triaged | Affected user/data/function, recent deploy/config/dependency, scope of containment. |
| Contained | Action hạn chế ảnh hưởng: stop rollout, disable feature, restrict access, fail safely. |
| Recovering | Rollback, forward-fix, provider action hoặc restore theo runbook đang thực hiện. |
| Verified | Health, smoke, data/business check, monitoring window và communication được cập nhật. |
| Resolved | User impact kết thúc; còn RCA/CAPA nếu Sev-1/2 hoặc recurring. |
| Closed | RCA/action owner/target tracked; Risk/Defect/Change/Runbook/RTM cập nhật khi cần. |

## Vai Trò Khi Incident

| Role | Trách nhiệm |
| --- | --- |
| Incident Commander | Điều phối, quyết định triage/status, ghi timeline, tránh nhiều người sửa cùng lúc. Thường là DevOps hoặc Technical Lead tùy loại incident. |
| Technical Lead | Đánh giá code/API/data/security, phê duyệt rollback/forward-fix/data repair direction. |
| DevOps Engineer | Kiểm tra health/version/deploy/runtime/provider, thực hiện thao tác release/recovery được phê duyệt. |
| Security Reviewer | Dẫn dắt containment/assessment nếu token/secret/RBAC/privacy có liên quan. |
| QA Lead | Xác minh reproduction/recovery/regression, giữ evidence và đánh giá release impact. |
| Product Owner / BA | Quyết định impact business/scope/communication, duy trì risk/issue/change trace. |
| Domain owner (Teacher/Admin) | Xác nhận impact workflow, affected Classroom/Student set và communication cần thiết. |

## Quy Trình Triage Ban Đầu

1. Ghi nhận thời điểm, environment, reporter, symptom và `requestId`/deployment version nếu có; không ghi secret/PII vào record.
2. Chỉ định Incident Commander và severity tạm thời; thông báo role cần thiết theo severity.
3. Kiểm tra health, version, recent deploy/config, logs/metrics/dependency và phạm vi affected user/data.
4. Contain trước: dừng rollout, chặn endpoint/feature, hạn chế permission hoặc fail safely khi cần.
5. Chọn rollback, forward-fix, provider action hoặc recovery theo runbook. Database restore là quyết định riêng, không mặc định đi cùng application rollback.
6. Xác minh recovery bằng health/version, core role smoke, change-specific flow, data integrity và monitoring window.
7. Cập nhật status/communication; mở defect/issue/risk/CR liên quan và RCA nếu cần.

## Hướng Dẫn Đặc Biệt Cho Security Và Data

| Incident type | Bắt buộc làm | Không được làm |
| --- | --- | --- |
| Suspected secret/token exposure | Revoke/rotate, limit access, preserve safe evidence, assess blast radius. | Đăng raw value vào issue/chat/log hoặc chỉ đổi UI mà không rotate credential. |
| RBAC/privacy exposure | Contain endpoint/export/access, record affected resource/time, Security review. | Xóa AuditLog/evidence hoặc thông báo suy đoán chưa xác minh. |
| Grade/progress/deadline corruption | Stop unsafe mutation, preserve history, identify affected records, use reviewed repair/recalculation. | Overwrite current values hàng loạt, xóa history hoặc “sửa tay” không audit. |
| MongoDB loss/corruption | Confirm environment/backup/RPO, prefer isolated restore validation, authorize cutover. | Restore đè Production hoặc copy production data sang local/CI không kiểm soát. |
| Bad migration/deploy | Stop rollout; review compatibility; choose protected rollback/forward-fix. | Assumption rằng application rollback tự sửa schema/data. |

## Incident Record Template

| Field | Nội dung bắt buộc |
| --- | --- |
| Incident ID / title | Mã duy nhất, mô tả ngắn và không chứa sensitive detail. |
| Detected time / environment / version | Timezone, Staging/Production, artifact/commit/deployment ID nếu có. |
| Reporter / Incident Commander | Người phát hiện và owner điều phối. |
| Severity / status | Mức hiện tại, lý do đánh giá, lịch sử thay đổi status/severity. |
| Impact | User/role/Classroom/data/function/release affected; workaround nếu đã xác nhận. |
| Timeline | Detection, acknowledgement, containment, recovery, verification events. |
| Evidence | Health/metric/requestId/log safe link, release/backup reference; no secret/PII. |
| Mitigation / recovery | Rollback, forward-fix, provider action, restore/repair decision và approver. |
| Verification | Health/version/core flow/data checks/monitoring result. |
| Linked items | Risk ID, Defect ID, Issue ID, CR, release, runbook, RCA/CAPA. |
| Communication | Audience, time, factual message/known limitation, owner. |

## Communication Rules

- Sev-1: thông báo ngay Technical Lead, DevOps, Security khi liên quan, QA Lead và Product Owner; dừng release/rollout nếu cần.
- Sev-2: thông báo các owner/domain bị ảnh hưởng trong cùng working period; PO quyết định communication tới Teacher/Admin/Student nếu workflow bị gián đoạn.
- Chỉ truyền đạt facts đã xác minh: symptom, scope, workaround, status và thời điểm update tiếp theo. Không hứa recovery time khi chưa có evidence.
- Sau resolution, release note/incident summary nêu outcome, known issue và follow-up nhưng không lộ secret, PII, raw log hoặc chi tiết có thể tạo thêm risk.

## RCA Và Corrective/Preventive Action

RCA bắt buộc cho Sev-1, Sev-2, security/privacy incident, data corruption/loss và incident lặp lại. RCA không đổ lỗi cá nhân; cần trả lời:

- Điều gì đã xảy ra, khi nào và user/data nào bị ảnh hưởng?
- Root cause và contributing factors là gì: requirement/rule/architecture/code/test/CI/config/monitoring/runbook/decision?
- Tại sao existing control không ngăn hoặc không phát hiện sớm?
- Immediate fix, corrective action và preventive action là gì; owner/target/evidence ra sao?
- Cần cập nhật Risk Register, Business Rule, AC/test, Swagger/data model, CI gate, monitoring hay runbook nào?

Incident chỉ đóng sau khi recovery được verified và RCA/CAPA đã có owner/target. CAPA chưa hoàn thành thì linked Risk vẫn Open/Mitigating/Monitoring theo residual risk, không bị biến mất cùng incident.

## Liên Kết

- Risk/response/escalation: `risk-register.md`, `risk-response-and-contingency-plans.md`, `risk-monitoring-and-escalation.md`.
- Defect/waiver: `../18-acceptance-criteria/defect-waiver-management.md`.
- Observability/release/recovery: `../15-devops-deployment/observability-operations.md`, `../15-devops-deployment/deployment-runbook.md`, `../15-devops-deployment/rollback-strategy.md`, `../15-devops-deployment/backup-restore-disaster-recovery.md`.
