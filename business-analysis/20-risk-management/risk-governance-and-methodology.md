# Risk Governance And Methodology

## Mục Đích

Tài liệu này chuẩn hóa cách viết, chấm điểm, ưu tiên, ownership, review, escalation và đóng một Risk. Mục tiêu là để Product Owner, BA, Developer, QA và DevOps cùng hiểu một mức rủi ro theo cùng một ngôn ngữ, thay vì mỗi team tự đánh giá theo cảm tính.

## Cách Viết Risk Statement

Risk phải mô tả nguyên nhân, sự kiện và tác động; không viết chung chung như “security risk” hoặc “cần test kỹ”. Mẫu chuẩn:

```text
Nếu [nguyên nhân/điều kiện] xảy ra, thì [sự kiện rủi ro] có thể xảy ra,
dẫn đến [tác động cụ thể tới user, dữ liệu, scope, release hoặc vận hành].
```

Ví dụ: “Nếu object-level authorization chỉ kiểm tra role mà không kiểm tra ownership/enrollment, Student có thể đọc resource hoặc Grade ngoài scope, dẫn đến privacy breach và release blocker.”

## Phân Loại Risk

| Category | Nội dung áp dụng cho dự án |
| --- | --- |
| Business / Scope | MVP priority, scope creep, requirement thay đổi, decision chậm. |
| Stakeholder / Delivery | Thiếu Product Owner review, Teacher/Student/Admin representative hoặc UAT participant. |
| Product / UX | Join flow khó dùng, deadline/To-do gây nhầm lẫn, workflow không phù hợp thực tế lớp học. |
| Security / Privacy | RBAC, object access, invitation/JWT token, secret, log, export, upload/media. |
| Data / Business Integrity | Enrollment trùng, deadline/late/missing/score/ranking sai, migration, AuditLog, report consistency. |
| API / Integration | Swagger drift, breaking API, frontend-backend contract mismatch, third-party storage dependency. |
| Quality / Test | Thiếu negative/regression/E2E/UAT evidence, chất lượng test data hoặc defect triage. |
| DevOps / Cloud | Docker/CI/CD, environment, Cloud account, deployment, provider quota/outage, dependency vulnerability. |
| Operations / Resilience | Monitoring, alert, backup, restore, rollback, incident response, key-person dependency. |
| Compliance / Reputation | Exposure PII, branded clone claim, policy/audit/retention thiếu rõ ràng. |

## Thang Điểm Probability Và Impact

### Probability (P)

| Điểm | Mức | Tiêu chí hướng dẫn |
| --- | --- | --- |
| 1 | Rare | Chỉ xảy ra khi có chuỗi điều kiện bất thường; control/evidence mạnh đã tồn tại. |
| 2 | Unlikely | Có thể xảy ra nhưng ít dấu hiệu hoặc ít thay đổi tác động. |
| 3 | Possible | Có dependency, implementation gap hoặc quyết định mở khiến risk có khả năng thực tế. |
| 4 | Likely | Đã có dấu hiệu, deadline gần hoặc control chưa rõ; nếu không hành động thì khả năng cao. |
| 5 | Almost Certain | Đang xảy ra/lặp lại hoặc chắc chắn xảy ra nếu không can thiệp ngay. |

### Impact (I)

| Điểm | Mức | Tiêu chí hướng dẫn |
| --- | --- | --- |
| 1 | Insignificant | Ảnh hưởng nhỏ, không đổi behavior chính, sửa nhanh và không cần communication. |
| 2 | Minor | Ảnh hưởng giới hạn, có workaround an toàn, không có integrity/privacy impact. |
| 3 | Moderate | Ảnh hưởng một feature/nhóm user hoặc làm chậm milestone; cần điều phối liên team. |
| 4 | Major | Broken Must flow, ảnh hưởng release/UAT đáng kể hoặc cần rework architecture/data/API. |
| 5 | Severe | Security/privacy breach, data loss/corruption, RBAC bypass, sai grade/deadline hàng loạt hoặc hệ thống không khả dụng. |

### Điểm Và Mức Độ

`Risk Score = Probability x Impact`

| Score | Level | Điều kiện xử lý tối thiểu |
| --- | --- | --- |
| 1-4 | Low | Owner và action hợp lý; review theo cadence bình thường. |
| 5-9 | Medium | Response plan, target/review date và theo dõi ở weekly review. |
| 10-15 | High | Owner/action/contingency/evidence bắt buộc; Technical Lead/QA/DevOps hoặc PO review theo domain. |
| 16-25 | Critical | Escalate ngay; không để thiếu owner/plan; có thể block scope, UAT hoặc release đến khi được xử lý/ra quyết định chính thức. |

Score là hướng dẫn ưu tiên, không thay thế judgement. Risk Impact 5 về security, privacy, grade, progress, deadline hoặc data integrity phải được xử lý như High/Critical dù Probability ban đầu thấp. `Time-to-impact = Immediate` cũng phải escalate không chờ kỳ review.

## Inherent Risk, Residual Risk Và Evidence

| Khái niệm | Quy tắc áp dụng |
| --- | --- |
| Inherent Risk | Điểm trước khi xét control. Register hiện tại dùng điểm này để ưu tiên planning. |
| Response Control | Action phòng ngừa/detective/recovery đã được xác định. Tài liệu có control chỉ là **planned** cho đến khi có evidence. |
| Residual Risk | Điểm còn lại sau khi control đã được implement và review. Chỉ cập nhật khi có link code/config/test/CI/UAT/runbook/rehearsal phù hợp. |
| Evidence | Swagger contract, code review, automated test, Staging result, backup/restore rehearsal, UAT record, monitoring snapshot hoặc approval record. |

Không giảm score chỉ vì team “đã biết rủi ro”. Nếu control chưa được xác nhận, status phải giữ Open/Mitigating và `implementation evidence pending` khi phù hợp.

## Chiến Lược Ứng Phó

| Strategy | Khi dùng | Ví dụ |
| --- | --- | --- |
| Avoid | Loại bỏ nguồn gây risk hoặc không đưa behavior vào release. | Không đưa external email automation vào MVP khi chưa có provider/security design. |
| Reduce | Bổ sung preventive/detective control để giảm P hoặc I. | Hash invitation token, enforce RBAC server-side, CI quality gate, index/query test. |
| Transfer / Share | Dùng provider/owner có trách nhiệm rõ, nhưng vẫn quản trị residual risk. | Managed MongoDB backup/provider SLA; không chuyển trách nhiệm data validation cho provider. |
| Contingency | Chuẩn bị hành động khi risk xảy ra. | Rollback artifact, feature disable, restore theo runbook, stakeholder communication. |
| Accept | Chấp nhận phần rủi ro còn lại có điều kiện, thời hạn và authority phê duyệt. | Hoãn một Should report/export enhancement sang release sau. |

“Accept” không phải “không làm gì”. Accepted Risk luôn cần rationale, owner, mitigation/workaround, review/expiry date, affected release và approval record.

## Risk Lifecycle

```text
Identified -> Analyzed -> Response Planned -> Mitigating / Monitoring
       -> Escalated (khi vượt ngưỡng)
       -> Closed
       -> Accepted Risk (có expiry và review)
       -> Materialized -> Issue / Defect / Incident
```

| Status | Ý nghĩa và điều kiện |
| --- | --- |
| Identified | Đã ghi nhận nhưng chưa đủ P/I/owner/impact. Không được tồn tại qua review kế tiếp. |
| Analyzed | Đã có score, scope impact và affected artifact, đang chờ response/decision. |
| Response Planned | Có action, owner, trigger và target nhưng chưa có evidence rằng control hoạt động. |
| Mitigating | Action đang được thực hiện; cần cập nhật tiến độ/evidence thực tế. |
| Monitoring | Control đã có hoặc risk ổn định; vẫn theo dõi indicator và review date. |
| Escalated | Vượt threshold, target quá hạn hoặc có impact tới stage/release; authority đã được thông báo. |
| Closed | Không còn applicable hoặc residual risk đã được accepted based on reviewed evidence. |
| Accepted Risk | Authority chấp nhận tạm thời có điều kiện; không phải Closed và phải review trước expiry. |
| Materialized | Risk đã trở thành Issue/Defect/Incident; liên kết record xử lý và xem xét risk mới còn lại. |

## Ownership, Review Và Approval

| Risk level / loại | Accountable | Bắt buộc tham vấn | Approval hoặc escalation |
| --- | --- | --- | --- |
| Low / Medium delivery | Project Lead hoặc owner domain | BA/QA khi ảnh hưởng scope/test | Weekly review. |
| High product/scope | Product Owner | BA, Technical Lead, QA Lead, affected representative | PO quyết định priority/scope/acceptance. |
| High security/privacy/data | Technical Lead | Security Reviewer, Backend Lead, QA Lead, DevOps nếu runtime | Không release khi chưa có resolution hoặc authority decision. |
| High DevOps/recovery | DevOps Engineer | Technical Lead, QA Lead, Product Owner | Review trước Staging/Production; recovery plan bắt buộc. |
| Critical | Product Owner + Technical Lead | QA Lead, DevOps, Security và owner domain | Immediate escalation; Go/No-Go hoặc containment decision. |
| Accepted Risk | Product Owner + Technical Lead | QA Lead; Security/DevOps khi liên quan | Có reason, mitigation, target/expiry, release impact và record phê duyệt. |

Không ai được tự chấp nhận Risk High/Critical nằm ngoài authority của mình. Developer không được tự thay business rule/security policy để “đóng” risk mà không qua decision/change control.

## Cập Nhật Register

Mỗi record Risk tối thiểu có: ID, statement, category, P/I/score/level, affected user/artifact, early indicator/trigger, response, contingency, owner, status, target/review date, residual risk/evidence khi có và link Issue/Defect/Incident/CR nếu materialized.

Cập nhật bắt buộc khi:

- Có Change Request ảnh hưởng scope, role, token, deadline, score, API, data, NFR, Cloud hoặc release.
- Có defect High/Critical, failed quality gate, UAT failure, CI/CD/deployment failure hoặc incident.
- Có decision mới về provider, token policy, file storage, metrics formula hoặc release scope.
- Target/review date qua hạn, Probability/Impact thay đổi hoặc control mới được chứng minh.

## Liên Kết Với Các Quy Trình Khác

- Baseline thay đổi: `../04-scope/change-control.md`.
- Gaps còn chờ evidence: `../19-traceability/traceability-gap-register.md`.
- Defect/waiver: `../18-acceptance-criteria/defect-waiver-management.md`.
- Release Go/No-Go: `../15-devops-deployment/release-management.md`.
- Rollback/restore: `../15-devops-deployment/rollback-strategy.md`, `../15-devops-deployment/backup-restore-disaster-recovery.md`.
