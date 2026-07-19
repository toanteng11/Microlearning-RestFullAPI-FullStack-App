# Issue And Decision Log

## Mục Đích

Issue Log theo dõi vấn đề đã biết cần action hoặc decision; Decision Log lưu lại lựa chọn đã được ghi nhận để team không quay lại giả định khác nhau. Hai log này liên kết với Risk Register nhưng không thay thế Risk: issue là hiện tại, risk là khả năng/tác động tương lai, decision là kết quả authority chọn một hướng xử lý.

## Quy Ước Trạng Thái

| Loại | Status | Ý nghĩa |
| --- | --- | --- |
| Issue | Open | Đã xác định, chưa có resolution đủ. |
| Issue | In Analysis | Đang phân tích impact/option/owner. |
| Issue | Blocked | Không thể tiến qua stage/release nếu chưa có decision/action. |
| Issue | Resolved | Có evidence/reviewer; linked risk/trace được cập nhật. |
| Issue | Deferred | Có lý do và target/release điều kiện rõ; không phải bỏ quên. |
| Decision | Proposed | Có lựa chọn nhưng chưa được authority ghi nhận. |
| Decision | Recorded Baseline (Draft) | Đã được ghi vào bộ BA Draft, cần review/approval theo Document Control. |
| Decision | Approved | Authority đã phê duyệt làm baseline chính thức. |
| Decision | Superseded | Bị thay bởi Decision khác; giữ history và link. |

## Issue Lifecycle

```text
Open -> In Analysis -> Action Planned -> Resolved
     -> Blocked
     -> Deferred
```

Mỗi Issue phải có owner, impact, action/decision cần có, target/trigger và linked Risk/Gap/CR/Defect/Incident khi phù hợp. `Resolved` yêu cầu evidence hoặc decision record; không đóng chỉ vì đã tạo ticket.

## Current Issue Log

| Issue ID | Mô tả / impact hiện tại | Linked Risk / Gap | Owner | Action hoặc decision cần có | Target / Status |
| --- | --- | --- | --- | --- | --- |
| ISS-001 | Cloud provider/service baseline đã được chọn; Google Cloud project/billing, Atlas project, quota/budget, service identity và environment identifiers chưa có runtime evidence. | R-003, R-020, TR-GAP-006 | DevOps + Product Owner | Thực hiện ADR-010 trong Phase 07, xác nhận account/quota/secret/monitoring/deployment evidence. | Phase 07 entry / Decision resolved, implementation open |
| ISS-002 | GitHub Actions CI required checks đã hoạt động; Artifact Registry publish, Cloud Run CD, protected deployment approval và deployment provenance chưa được triển khai. | R-012, R-023, TR-GAP-004 | DevOps + Technical Lead + QA Lead | Mở rộng pipeline ở Phase 07 và link image digest/Staging/Production evidence trước RC. | Before Release Candidate / Partially implemented |
| ISS-003 | Auth token storage, refresh/logout/revocation và CSRF baseline đã được ghi tại ADR-006; formal approval và security test evidence vẫn cần trước auth release. | R-006, TR-GAP-007 | Technical Lead + Security Reviewer | Review/approve ADR-006; thực thi và link API/frontend/security test evidence. | Before Auth Release / In Analysis |
| ISS-004 | File/media/upload storage scope và provider/policy chưa được xác nhận; không thể coi upload production-ready chỉ vì UI/API có field URL. | R-017, DEP-TECH-008 | Product Owner + Technical Lead + DevOps | Quyết định feature-gate/defer hoặc chọn storage/policy/type-size/access/backup direction. | Before Media/Upload Sprint / Open |
| ISS-005 | Danh sách đại diện Student, Teacher và Admin cho UAT chưa được xác nhận; thiếu họ sẽ làm business acceptance yếu. | R-002, R-023, ASM-017, TR-GAP-005 | Product Owner + QA Lead + BA | Xác nhận người tham gia/proxy, schedule, safe test account/data và sign-off authority. | Before UAT Planning / Open |
| ISS-006 | `processScore = progressPercentage` là default MVP; công thức weighted/future, effective date và recalculation policy chưa được phê duyệt. | R-025, TR-GAP-008 | Product Owner + Backend Lead + BA | Chỉ mở analysis khi weighted score được đề xuất qua Change Control; không tự implement công thức mới. | Post-MVP change request / Deferred |
| ISS-007 | BA/AC/RTM đã có nhưng API/data/frontend/CI/UAT/release evidence, gồm OpenAPI JSON/Swagger UI route và contract rendering test, phải được gắn sau implementation; không được coi đây là evidence đã có. | R-008-R-014, R-023, TR-GAP-001 đến TR-GAP-005 | Backend Lead + Frontend Lead + QA Lead + DevOps | Duy trì Gap Register, link artifact/test/UAT/release result theo từng trigger gate. | Before relevant integration/UAT/release / Open |

## Decision Log

| Decision ID | Quyết định được ghi nhận | Lý do / tác động | Owner / authority | Status | Nguồn baseline |
| --- | --- | --- | --- | --- | --- |
| DEC-001 | Sản phẩm là **Internal Microlearning Classroom LMS**, tham khảo workflow/chức năng Google Classroom nhưng không là bản clone, không sao chép brand/logo/UI độc quyền. | Giữ định vị sản phẩm độc lập, tránh branding/scope risk. | Product Owner | Recorded Baseline (Draft) | `../02-product-vision/google-classroom-reference.md`, ASM-007 |
| DEC-002 | Ba role nghiệp vụ chính của MVP là Student, Teacher và Admin; Super Admin chỉ là permission/policy governance khi được cấu hình. | Xác định RBAC, UI list, API authorization và UAT scope. | Product Owner + Technical Lead | Recorded Baseline (Draft) | `../05-user-roles/`, ASM-003 |
| DEC-003 | Teacher account dùng invitation link: Admin tạo/copy link, tự gửi qua email/Zalo/Facebook/Messenger/Teams hoặc kênh ngoài hệ thống; system không tự gửi email invitation trong MVP. | Không phụ thuộc Gmail/email provider; Admin không biết password Teacher. | Product Owner | Recorded Baseline (Draft) | BR-010 đến BR-014C, ASM-004/016 |
| DEC-004 | Email Teacher vẫn được Admin nhập để invitation email matching và identity binding, không phải để platform thực hiện delivery. | Giảm risk link bị gửi nhầm/người khác accept; làm rõ manual delivery. | Product Owner + Security Reviewer | Recorded Baseline (Draft) | BR-014B, BR-042 đến BR-049, ASM-005 |
| DEC-005 | Student tham gia Classroom bằng Class Code hoặc Invite Link, subject to system policy, Classroom setting, token/code state, Student state và enrollment uniqueness. | Đảm bảo join linh hoạt nhưng không bypass access control. | Product Owner + Technical Lead | Recorded Baseline (Draft) | BR-001 đến BR-003, BR-016 đến BR-019, BR-050 đến BR-056 |
| DEC-006 | Technology scope là ReactJS, Node.js/ExpressJS RESTful API, MongoDB, Swagger/OpenAPI, Docker/Docker Compose, CI/CD và Cloud-ready deployment. | Là baseline cho architecture, API, DevOps và học tập thực hành. | Technical Lead + Product Owner | Recorded Baseline (Draft) | `../14-solution-architecture/technology-stack.md`, CON-001 đến CON-003/012/013 |
| DEC-007 | Published/assigned Lesson/Activity trong MVP phải có deadline; Teacher chỉ reset deadline trong Course mình quản lý, có reason/history/AuditLog và recalculation liên quan. | Bảo đảm To-do, late/missing, ranking và fairness có rule rõ ràng. | Product Owner + Teacher Representative | Recorded Baseline (Draft) | BR-035, BR-061, BR-075 đến BR-080 |
| DEC-008 | Teacher Course Dashboard hiển thị activity list, Student list, progress/process score ranking theo `processScore DESC` và deadline; Student Dashboard có To-do actionable/pending. | Tập trung vào workflow giảng dạy, theo dõi và hoàn thành microlearning. | Product Owner | Recorded Baseline (Draft) | BR-029 đến BR-034, BR-070 đến BR-074/081 |
| DEC-009 | `processScore` MVP mặc định bằng `progressPercentage`; công thức weighted chỉ thay đổi khi có decision/Change Control, formula version/effective date/recalculation policy. | Tránh nhầm lẫn điểm quá trình và historical report/fairness. | Product Owner + Backend Lead | Recorded Baseline (Draft) | Metric/BR trace, TR-GAP-008 |
| DEC-010 | Teacher invitation token không lưu raw; raw link chỉ trả trong one-time create response cho Admin có quyền. Copy-event/list/detail không tái tạo link. | Giảm security exposure và khớp Phase 02 API/Swagger/runtime lifecycle. | Technical Lead + Security Reviewer | Recorded Baseline (Draft) | NFR-SEC-003/005, BR-044/049 |
| DEC-011 | Cloud provider chưa bị khóa ở BA stage; lựa chọn provider/region/service/secret/monitoring phải được ghi ADR trước Cloud deployment. | Quyết định tạm thời đã hoàn thành mục đích và được thay bằng DEC-015. | DevOps + Product Owner | Superseded by DEC-015 | ASM-014, TR-GAP-006, ISS-001 |
| DEC-012 | External email/SMS/Gmail/Zalo notification integration, SIS, AI, payment, Google Workspace và native mobile không thuộc MVP trừ khi được Change Control phê duyệt. | Bảo vệ core scope, tránh dependency/security/operation expansion ngầm. | Product Owner | Recorded Baseline (Draft) | Out of scope, ASM-018, TR-GAP-009/010 |
| DEC-013 | Browser auth baseline: access JWT chỉ trong memory; opaque refresh token trong `HttpOnly` cookie, hash/rotation/session-family revoke; MVP same-site Frontend/API, CORS origin allowlist và Origin/Referer check. | Giảm XSS token persistence, quản lý revoke/logout/reset/block và giới hạn CSRF/cross-site risk. | Technical Lead + Security Reviewer | Recorded Baseline (Draft) | ADR-006, NFR-SEC-012, APP-Q-002 |
| DEC-014 | Password baseline: 12-128 ký tự, không có khoảng trắng đầu/cuối hoặc cắt ngầm, không bắt buộc đổi định kỳ; login/reset chống enumeration và có rate-limit/cooldown. | Tạo rule có thể implement/test thống nhất, tránh password policy mơ hồ. | Technical Lead + Security Reviewer + Product Owner | Recorded Baseline (Draft) | NFR-SEC-007/011, APP-Q-004 |
| DEC-015 | Cloud baseline là Google Cloud Run + MongoDB Atlas + GitHub Actions; một production image phục vụ React/API/Swagger cùng origin. Supporting services gồm Artifact Registry, Secret Manager và Cloud Logging/Monitoring; không dùng Firebase. | Đáp ứng Docker/CI-CD/Cloud learning, giảm cross-site cookie/CORS complexity và đủ cho Staging/demo tải nhỏ. | Product Owner + DevOps + Technical Lead | Accepted 2026-07-17 | ADR-010, APP-Q-001/008, `../15-devops-deployment/cloud-deployment.md` |
| DEC-016 | Classroom Invite Link dùng `/join/invite#token=...`; React capture/xóa fragment và API preview nhận token bằng `POST /api/v1/classrooms/invite-links/preview` strict body. Invite regenerate/disable dùng action-specific POST endpoints. | Tránh token nằm trong API path/query/access log, giữ raw-once contract và loại bỏ cách hiểu khác nhau giữa BA, Frontend, Backend, Swagger và QA. | Product Owner/BA + Technical Lead + Security Reviewer | Accepted 2026-07-19 | BA revision 1.41, P03-ADR-007, `../11-api-requirements/api-endpoint-catalog.md` |
| DEC-017 | Chấp thuận `P03-ADR-001..018` làm Phase 03 working baseline; code chỉ được bắt đầu sau khi planning PR đạt required checks và merge vào `main`. | Tách phê duyệt nội dung khỏi repository gate, tránh code trên tài liệu chưa được version-control và tránh ghi `READY_TO_CODE` sai bằng chứng. | Project Owner theo governance đồ án cá nhân | Accepted 2026-07-19 | `../../docs/implementation/phase-03/development-readiness-review.md`, `../../docs/implementation/phase-03/technical-decisions.md` |

## Mẫu Tạo Issue Hoặc Decision Mới

### Issue Record

| Field | Nội dung bắt buộc |
| --- | --- |
| Issue ID / title | Mã bất biến và mô tả facts, không lộ secret/PII. |
| Date / reporter / owner | Thời điểm, người phát hiện và owner xử lý. |
| Current impact | Scope/user/API/data/security/release bị ảnh hưởng hiện tại. |
| Linked records | Risk, Gap, Defect, Incident, CR, requirement/business rule/AC liên quan. |
| Options / action | Việc cần làm hoặc authority cần quyết định. |
| Target / status | Stage/date/event trigger và lifecycle status. |
| Resolution evidence | Link decision/artifact/test/review/date. |

### Decision Record

| Field | Nội dung bắt buộc |
| --- | --- |
| Decision ID / title | Mã bất biến và lựa chọn rõ ràng. |
| Context / options | Vấn đề cần quyết định, option khả thi và trade-off. |
| Decision / rationale | Lựa chọn, lý do, assumptions/risk accepted. |
| Authority / date / status | Người có quyền, thời điểm và trạng thái Document Control. |
| Impact | Scope, requirement, BR, API, data, UI, NFR, DevOps, cost/timeline/UAT/release. |
| Follow-up | Action owner, target/evidence và Change Request/ADR nếu cần. |
| Supersession | Decision thay thế hoặc bị thay thế, giữ link history. |

## Quy Tắc Đồng Bộ

- Decision đổi behavior baseline phải cập nhật Scope, Requirements, BR, AC/UAT, RTM và documents kỹ thuật bị ảnh hưởng; tạo Change Request nếu thuộc phạm vi `../04-scope/change-control.md`.
- Issue quan trọng không được nằm độc lập: phải link Risk khi có future impact, Defect/Incident khi đã materialized và Release khi có Go/No-Go impact.
- `Recorded Baseline (Draft)` không đồng nghĩa Product Owner đã Approved toàn bộ BA; trạng thái chính thức tuân theo `00-document-control`.
- Decision về security, privacy, data recovery, RBAC, token, Cloud hoặc release phải có Technical Lead/DevOps/Security review theo domain.

## Liên Kết

- Risk Register: `risk-register.md`.
- Change control: `../04-scope/change-control.md`.
- Traceability gaps: `../19-traceability/traceability-gap-register.md`.
- Architecture decision records: `../14-solution-architecture/architecture-decision-records.md`.
