# Appendices Overview

## Mục Đích

Appendices là phần hỗ trợ dùng chung cho toàn bộ **Business Analysis Documentation** của dự án **Microlearning Classroom LMS Platform**. Phần này chuẩn hóa cách hiểu thuật ngữ, mã định danh, nguồn tham khảo, cách ghi nhận họp/câu hỏi mở, cách đặt tên evidence và cách viết tài liệu để BA, Product Owner, Developer, QA và DevOps cùng đọc một nghĩa.

Appendices không tạo Business Requirement, không thay thế Business Rule, API contract, test case hay runbook. Khi có mâu thuẫn, source document theo domain là nguồn quyết định; phụ lục phải được cập nhật để phản ánh lại quyết định đó.

## Phạm Vi

- Thuật ngữ sản phẩm, học tập, access/security, data/API và DevOps.
- Acronym, ID, naming, date/time, trạng thái và link convention.
- Danh mục nguồn nội bộ/ngoại bộ cùng phạm vi sử dụng hợp lệ.
- Template meeting notes, open question và hướng dẫn chuyển Question thành Decision/Issue/Change Request.
- Quy ước evidence/UAT/test data bảo vệ privacy và tạo traceability.
- Documentation style: nội dung tiếng Việt, tên file/folder tiếng Anh và file `.md`.

## Cách Sử Dụng Phụ Lục

| Nhu cầu | Tài liệu cần xem |
| --- | --- |
| Không rõ một từ như `Classroom`, `processScore`, `AuditLog`, `rollback` | `glossary.md` |
| Không rõ `BRQ`, `FR`, `AC`, `TR-GAP`, `REL-BKL` hoặc cách tạo ID | `acronyms-and-id-conventions.md` |
| Muốn biết một reference được dùng với mục đích nào | `references.md` |
| Cần ghi meeting/review có decision và action rõ | `meeting-notes-template.md` |
| Có điều cần Product Owner/Technical Lead quyết định | `open-questions.md` |
| Cần hiểu thuật ngữ Google Classroom theo đúng boundary tham khảo | `google-classroom-reference-glossary.md` |
| Cần lưu evidence UAT/CI/API/screenshot hoặc tạo test account an toàn | `evidence-and-test-data-guidelines.md` |
| Cần tạo/chỉnh sửa tài liệu BA mới | `documentation-style-guide.md` |

## Quy Tắc Ưu Tiên Nguồn

Khi thuật ngữ hoặc nội dung có nhiều cách diễn giải, áp dụng thứ tự sau:

1. Security/privacy/compliance policy và Document Control đã được phê duyệt.
2. Business Rule và scope/change decision đã được phê duyệt.
3. Functional Requirement, Acceptance Criteria, API/Data/NFR/Architecture document theo domain.
4. Traceability matrix, risk/release plan, template hoặc glossary.
5. External reference chỉ có vai trò tham khảo kỹ thuật/workflow; không tự tạo scope hoặc policy mới.

Ví dụ: Glossary mô tả `Teacher Invitation`, nhưng token expiry, email matching, hash-at-rest và manual delivery phải tuân theo Business Rules/NFR/Acceptance hiện hành, không theo diễn giải tự do trong glossary.

## Governance Và Ownership

| Artifact | Owner chính | Reviewer khi thay đổi có impact |
| --- | --- | --- |
| Glossary / Acronym / Style Guide | Business Analyst | Product Owner, Technical Lead, QA Lead khi thuật ngữ thay đổi behavior. |
| Reference catalog | Business Analyst | Technical Lead/DevOps/Security theo nguồn kỹ thuật. |
| Meeting Notes / Open Questions | Facilitator/Business Analyst | Decision owner và stakeholder liên quan. |
| Evidence/Test Data guideline | QA Lead + Business Analyst | Technical Lead, DevOps, Security Reviewer. |
| Google Classroom reference glossary | Business Analyst | Product Owner, Teacher Representative, UX Lead. |

## Update Triggers

Phụ lục phải được review/cập nhật khi:

- Có role, entity, status, metric, release ID, API/security/DevOps term mới.
- Mã định danh mới được thêm hoặc convention trong source document thay đổi.
- Open Question được trả lời, chuyển thành Decision/Issue/Change Request hoặc không còn applicable.
- Source external được thay, reference boundary thay đổi hoặc thông tin source không còn phù hợp.
- UAT/release/incident cho thấy evidence naming, safe data handling hoặc document style còn mơ hồ.

## Điều Kiện Hoàn Thành

- Các thuật ngữ quan trọng có định nghĩa ngắn, source owner và không mâu thuẫn với Business Rules.
- ID convention có thể link được tới artifact nguồn và không tạo ID trùng/reuse.
- Không còn placeholder trong Appendix Package; template dùng trường `[Điền ...]` thay vì giả định nội dung.
- Open Question có owner, priority, decision trigger và linked source; câu trả lời không bị ghi nhận như approved khi chưa có authority.
- Evidence/test data guideline không cho phép secret, raw token, password hoặc Production PII bị đưa vào tài liệu/evidence.

## Liên Kết

- Document Control: `../00-document-control/`.
- Scope/Change: `../04-scope/`.
- Requirements/Traceability: `../07-requirements/`, `../19-traceability/`.
- Risk/Release: `../20-risk-management/`, `../21-release-planning/`.
