# Traceability Overview

## Mục Đích

Traceability liên kết các artifact BA từ nhu cầu nghiệp vụ đến evidence kiểm thử/release. Với Microlearning Classroom LMS Platform, traceability đặc biệt quan trọng vì một thay đổi như Teacher Invitation, Classroom Join, Lesson Deadline, Grade hoặc Export thường tác động đồng thời Role, API, MongoDB, UI, AuditLog, report, QA và DevOps.

## Mục Tiêu

| Mục tiêu | Giá trị cho dự án |
| --- | --- |
| Coverage | Phát hiện Business Requirement/FR/Business Rule chưa có User Story, Use Case, acceptance hoặc test. |
| Impact analysis | Biết chính xác tài liệu/code/test/release cần review khi một requirement/rule thay đổi. |
| Verification | Chứng minh Must scope đã có evidence QA/UAT/DevOps, không chỉ có mô tả. |
| Scope control | Phân biệt feature approved, deferred, out-of-scope và implementation chưa chứng minh. |
| Auditability | Truy ngược từ defect/release/API/data state tới business rationale và decision owner. |

## Hai Chiều Traceability

```text
Forward trace:
BRQ -> FR -> US / UC -> BR -> API / Data / UI -> AC -> TS / UAT -> Release evidence

Backward trace:
Defect / API / UI / Data change / release incident
  -> impacted AC / TS / BR / FR / BRQ / decision / owner
```

| Chiều | Câu hỏi phải trả lời |
| --- | --- |
| Forward | Requirement này được xây bằng flow/API/data/UI nào và đã có test/release evidence chưa? |
| Backward | Lỗi hoặc thay đổi này ảnh hưởng business value, rule, user role, test và release nào? |

## Traceability Layers

| Layer | Artifact | Ví dụ ID |
| --- | --- | --- |
| Business need | Business Requirement | `BRQ-014` Teacher Invitation |
| System behavior | Functional Requirement | `FR-006`, `FR-007`, `FR-008` |
| User intent | User Story | `US-ADM-004`, `US-TCH-INV-*` |
| Workflow | Use Case | `UC-027`, `UC-051` |
| Decision/rule | Business Rule | `BR-042` đến `BR-049` |
| Design/contract | UI/API/Data/Architecture/DevOps | Invitation API, token model, invitation page, security architecture |
| Verification | Acceptance Criterion/Test/UAT | `AC-INV-*`, `TS-INV-*` |
| Delivery proof | Build/CI/Deploy/UAT/Release record | Commit, image digest, test report, UAT run, release note |

## Traceability Matrices In Mục 19

| Tài liệu | Dùng để trả lời |
| --- | --- |
| `requirement-traceability-matrix.md` | Toàn bộ `BRQ-001` đến `BRQ-025` được map tới FR, story/use case, rule, acceptance/test, design impact và release nào? |
| `business-rule-traceability.md` | Các rule `BR-001` đến `BR-110` được hiện thực/kiểm thử ở requirement, API/data/UI/audit nào? |
| `acceptance-traceability-matrix.md` | Acceptance criterion/UAT/NFR/DevOps gate có scenario/evidence owner nào? |
| `traceability-change-impact.md` | Khi artifact thay đổi, các layer nào bắt buộc review/cập nhật? |
| `traceability-gap-register.md` | Link/evidence nào còn chờ implementation, CI, UAT hoặc release proof? |
| `traceability-review-checklist.md` | BA/QA/Technical Lead review matrix theo gate nào? |
| `traceability-guidelines.md` | Quy ước ID, status, update cadence và chất lượng link. |

## Status Convention

| Status | Ý nghĩa |
| --- | --- |
| Covered | Có liên kết downstream/upstream cần thiết trong BA baseline. |
| Partially Covered | Có link chính nhưng thiếu một layer bắt buộc hoặc coverage chưa đủ. |
| Pending Implementation Evidence | BA/acceptance đã có, nhưng code/API/CI/UAT/release evidence sẽ được gắn sau khi triển khai. |
| Deferred | Feature/rule đã được phê duyệt nhưng để release sau. |
| Out Of Scope | Không thuộc release hiện tại; không được tính thiếu coverage MVP. |
| At Risk | Có conflict/gap/defect/change chưa được xử lý, cần owner và hạn xử lý. |

`Covered` trong BA không đồng nghĩa code đã hoàn thành. Bằng chứng implementation/test/release phải được ghi rõ là pending hoặc linked thực tế, không suy diễn từ tài liệu.

## Ownership

| Activity | Responsible | Consulted |
| --- | --- | --- |
| Maintain matrix/ID/change impact | Business Analyst | Product Owner, Technical Lead, QA Lead |
| Confirm API/Data/UI/architecture link | Technical Lead, Backend/Frontend Lead | Business Analyst, QA |
| Confirm test/UAT coverage/evidence | QA Lead | BA, Product Owner |
| Confirm CI/CD/deploy/rollback evidence | DevOps Engineer | Technical Lead, QA |
| Approve scope/priority/waiver | Product Owner | BA, Technical Lead, QA, DevOps |

## Traceability Quality Rules

- Link phải dùng ID ổn định hoặc path/document cụ thể, không dùng mô tả mơ hồ như “related feature”.
- Không tự tạo ID giả để làm matrix đầy; nếu artifact chưa tồn tại, ghi `Pending Implementation Evidence` hoặc gap record.
- Requirement Must cần ít nhất one acceptance/test path; rule security/data/authorization cần negative test path.
- NFR/DevOps requirement vẫn phải trace tới quality gate/evidence dù không có User Story trực tiếp.
- Matrix được cập nhật trong cùng Change Request/PR/release với artifact thay đổi, không chờ đến cuối dự án.

## Definition Of Done For Traceability

- Toàn bộ `BRQ-001` đến `BRQ-025` có row trong RTM.
- Business Rule Must có requirement/acceptance/test/design impact rõ.
- Must acceptance có scenario/UAT/quality gate owner; pending evidence được ghi nhận trung thực.
- Gap/waiver/defect/change impact có owner/status/next action rõ.
- Release decision có thể truy về scope, build/evidence/known issue/rollback decision.

## Liên Kết

- Requirements: `../07-requirements/`.
- Business Rules: `../17-business-rules/`.
- Acceptance: `../18-acceptance-criteria/`.
- Change control: `../04-scope/change-control.md`.
