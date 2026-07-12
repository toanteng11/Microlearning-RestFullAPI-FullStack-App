# Risk Management Overview

## Mục Đích

Risk Management giúp dự án **Microlearning Classroom LMS Platform** nhận diện sớm, đánh giá, xử lý và theo dõi các sự kiện có thể làm giảm chất lượng, trễ tiến độ, tăng chi phí, gây lỗi dữ liệu, mất an toàn thông tin hoặc làm release không đạt điều kiện chấp nhận.

Mục 20 không thay thế các tài liệu Security, NFR, DevOps, QA/UAT hay Change Control. Nó là lớp quản trị kết nối các tài liệu đó, chỉ rõ: rủi ro nào đang tồn tại, ai sở hữu, tín hiệu nào kích hoạt xử lý, phương án giảm thiểu là gì và bằng chứng nào mới cho phép đóng rủi ro.

## Phạm Vi Quản Trị

Risk Management áp dụng cho toàn bộ vòng đời từ BA baseline đến Cloud release:

- Business scope, ưu tiên MVP, stakeholder availability và UAT.
- Workflow Student, Teacher, Admin; đặc biệt là Classroom join, manual Teacher invitation, deadline, progress, grade và reporting.
- API, ReactJS frontend, Node.js/ExpressJS backend, MongoDB, Swagger/OpenAPI và file/media nếu được đưa vào release.
- Security, privacy, RBAC, object-level authorization, token, secret, AuditLog và export.
- Docker, CI/CD, Cloud account/provider, monitoring, backup, restore, rollback và incident response.
- Quality gate, defect, waiver, release decision và lessons learned.

## Khái Niệm Phân Biệt

| Khái niệm | Ý nghĩa | Ví dụ trong dự án | Nơi quản lý chính |
| --- | --- | --- | --- |
| Risk | Sự kiện **có thể** xảy ra trong tương lai, chưa xảy ra hoặc chưa được xác nhận. | Invitation token có thể bị implement sai expiry/revoke. | `risk-register.md` |
| Issue | Vấn đề **đã tồn tại** và cần action/decision. | Cloud provider chưa được chọn trước Staging. | `issue-decision-log.md` |
| Defect | Hành vi implementation khác requirement/acceptance đã xác định. | Student xem được grade ngoài scope. | `../18-acceptance-criteria/defect-waiver-management.md` |
| Incident | Sự kiện vận hành/bảo mật/dữ liệu đã gây hoặc có nguy cơ gây ảnh hưởng thực tế. | Production API DOWN sau deploy. | `incident-management.md` + DevOps runbook |
| Change Request | Đề xuất thay đổi baseline đã có. | Thêm system email delivery cho Teacher invitation. | `../04-scope/change-control.md` |
| Decision | Quyết định đã được authority chấp nhận để định hướng scope/implementation. | Invitation delivery MVP là `MANUAL_COPY`. | `issue-decision-log.md` |
| Accepted Risk | Rủi ro còn lại được authority chấp nhận có điều kiện, có owner, mitigation, expiry và review date. | Một Should feature được hoãn có kiểm soát. | Risk Register + release/waiver record |

Một item không được đổi tên từ “risk” sang “issue” để làm giảm mức độ nghiêm trọng. Khi rủi ro xảy ra, record Risk phải được liên kết với Issue, Defect hoặc Incident phù hợp và cập nhật residual risk sau khi xử lý.

## Nguyên Tắc Làm Việc

1. **Có owner rõ ràng:** mỗi risk có một owner chịu trách nhiệm điều phối action, dù nhiều team cùng thực hiện.
2. **Dựa trên bằng chứng:** tài liệu mô tả control không đồng nghĩa control đã được implement, test hoặc vận hành thành công.
3. **Ưu tiên bảo vệ dữ liệu và quyền truy cập:** security, privacy, grade, progress, deadline, audit và data integrity không được đánh đổi ngầm để kịp demo.
4. **Theo dõi từ sớm:** indicator/trigger quan trọng phải được kiểm tra trước khi risk biến thành incident hoặc release blocker.
5. **Không dùng Accepted Risk để bỏ qua Must gate:** Critical/High security, privacy, data loss/corruption, RBAC bypass hoặc core learning integrity không được xử lý bằng waiver thông thường.
6. **Giữ traceability:** risk ảnh hưởng scope/FR/BR/AC/API/data/DevOps phải liên kết tới tài liệu bị tác động và Change Request khi behavior baseline thay đổi.
7. **Học lại sau sự cố:** Critical/High incident hoặc defect lặp lại phải tạo corrective/preventive action, cập nhật test và tài liệu liên quan.

## Bộ Tài Liệu Trong Mục 20

| Tài liệu | Câu hỏi trả lời |
| --- | --- |
| `risk-management-overview.md` | Mục tiêu, phạm vi, nguyên tắc và cách các artifact liên kết với nhau là gì? |
| `risk-governance-and-methodology.md` | Đánh giá Probability/Impact, lifecycle, approval và Accepted Risk thế nào? |
| `risk-register.md` | Những rủi ro cụ thể hiện tại, owner, trigger, response và trạng thái là gì? |
| `risk-response-and-contingency-plans.md` | Khi risk High/Critical xuất hiện, team phòng ngừa và khôi phục như thế nào? |
| `risk-monitoring-and-escalation.md` | Theo dõi indicator, review cadence và escalate tại ngưỡng nào? |
| `incident-management.md` | Khi rủi ro đã ảnh hưởng thật, team triage, truyền thông, recovery và RCA thế nào? |
| `issue-decision-log.md` | Những vấn đề mở và các quyết định baseline nào cần được kiểm soát? |
| `risk-review-checklist.md` | Sprint, UAT và release cần kiểm tra những điều kiện rủi ro nào? |

## Luồng Quản Trị Rủi Ro

```text
Nhận diện Risk
        -> Phân tích Probability, Impact, trigger, owner và affected artifacts
        -> Chọn response / contingency / evidence cần có
        -> Theo dõi định kỳ và escalate khi vượt ngưỡng
        -> Đóng khi evidence được review
        -> Hoặc chuyển thành Issue / Defect / Incident / Change Request
```

Risk chỉ được đóng khi nguyên nhân không còn phù hợp, control đã được xác minh hoặc scope đã được loại bỏ/phê duyệt rõ ràng. Việc “chưa xảy ra” không phải điều kiện đóng risk.

## Vai Trò Chính

| Role | Trách nhiệm trong Risk Management |
| --- | --- |
| Product Owner | Quyết định trade-off business/scope/release; phê duyệt risk acceptance thuộc business hoặc MVP. |
| Business Analyst | Duy trì register, liên kết scope/requirement/traceability, chuẩn bị review và đảm bảo decision được ghi nhận. |
| Technical Lead | Đánh giá architecture, API, data, security impact; quyết định technical mitigation/rollback direction. |
| Backend / Frontend Lead | Thực hiện và chứng minh control ở code, API, data, UI integration và regression test thuộc domain. |
| QA Lead | Đánh giá test/UAT/release exposure, xác minh evidence và không đóng risk chỉ dựa trên lời xác nhận. |
| DevOps Engineer | Quản trị CI/CD, environment, secret, Cloud, observability, backup, restore, rollback và operational risk. |
| Security Reviewer | Review risk token, credential, RBAC, data exposure, privacy và incident security khi cần. |
| Admin / Teacher / Student Representative | Xác nhận tính đúng đắn của workflow, UAT impact, communication và business workaround. |

## Điều Kiện Hoàn Thành Mục 20

- Risk High/Critical có owner, trigger, response, contingency, target/review date và liên kết tài liệu liên quan.
- Issue/Decision không còn placeholder; các điểm chưa quyết định được nêu đúng trạng thái, không bị giả định là complete.
- Pre-release review xác định rõ risk open, residual risk, waiver/acceptance hợp lệ và Go/No-Go impact.
- Incident hoặc defect trọng yếu tạo lessons learned và action có thể kiểm chứng.
- Risk Register phản ánh sự khác biệt giữa BA/design coverage và implementation/CI/UAT/Production evidence.

## Liên Kết

- Scope, assumption, dependency và change: `../04-scope/`.
- NFR/security/reliability/monitoring gates: `../13-non-functional-requirements/`.
- Architecture/ADR: `../14-solution-architecture/`.
- Deployment, release, rollback và DR: `../15-devops-deployment/`.
- Business Rule governance: `../17-business-rules/business-rule-governance.md`.
- Defect, waiver và UAT: `../18-acceptance-criteria/`.
- Gap/evidence traceability: `../19-traceability/`.
