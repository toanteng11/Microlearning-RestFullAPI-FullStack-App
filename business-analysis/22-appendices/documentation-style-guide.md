# Documentation Style Guide

## Mục Đích

Style Guide giúp toàn bộ BA package nhất quán, dễ review và dễ trace sang implementation. Quy tắc này áp dụng cho tài liệu trong `business-analysis/`; không thay thế code style hoặc OpenAPI schema style trong repository implementation.

## Ngôn Ngữ Và Tên File

| Thành phần | Quy tắc |
| --- | --- |
| Nội dung mô tả | Viết bằng tiếng Việt rõ ràng, theo câu có actor/điều kiện/kết quả khi mô tả behavior. |
| Proper name / technical term | Giữ English chuẩn khi cần: `Student`, `Teacher`, `Classroom`, `Swagger/OpenAPI`, `JWT`, `Docker`, `CI/CD`, API path/field/enum/ID. |
| Folder/file name | English lowercase kebab-case, không dấu, chỉ dùng `.md`. |
| Document title | Dùng English title tương ứng file; nội dung phần/diễn giải vẫn tiếng Việt. |
| Không được dùng | Tên file tiếng Việt có dấu, file binary/secret/export thật trong BA folder, raw password/token/credential/Production PII. |

## Cấu Trúc Một Tài Liệu Tốt

Tùy mục đích, tài liệu nên có các phần theo thứ tự phù hợp:

1. `Mục Đích` và phạm vi/đối tượng áp dụng.
2. Định nghĩa/assumption/constraint nếu cần.
3. Catalog, process, rule, matrix hoặc template là nội dung chính.
4. Owner, status, quality/acceptance/review/update trigger nếu artifact có lifecycle.
5. `Liên Kết` đến source documents liên quan.

Không thêm section trống chỉ để đủ mẫu. Không lặp nguyên văn catalog lớn từ source document; dùng link/source ID và chỉ tổng hợp đúng mục đích của tài liệu.

## Writing Rules

| Chủ đề | Quy tắc |
| --- | --- |
| Requirement / Rule | Nêu actor, trigger/precondition, behavior, outcome/deny/exception/audit khi relevant. Tránh “system should handle properly”. |
| Scope | Phân biệt Included, Conditional, Deferred và Excluded; không viết “có thể” khi decision đã chốt. |
| Table | Mỗi column có nghĩa rõ; không dùng bảng để che nội dung mơ hồ hoặc nhồi quá nhiều unrelated decision. |
| Example | Gắn nhãn example/template, không trình bày sample như dữ liệu/decision thật. |
| Status | Dùng vocabulary nguồn: Draft/In Review/Approved; Open/Deferred/Resolved; Go/No-Go. Không dùng “done” khi thiếu evidence. |
| Evidence | Nêu artifact/result/reviewer/date/environment; redact sensitive data. |
| Error/security | Nêu response/containment an toàn, không mô tả secret/token/password hoặc kỹ thuật bypass. |
| Dates/time | Dùng ISO `YYYY-MM-DD`; deadline/release/audit cần timezone hoặc rule timezone. |

## Markdown Và Link Rules

- Dùng heading theo cấp độ hợp lý, table cho catalog/matrix, fenced code block cho flow/template syntax.
- Dùng inline code cho ID, API path, field, enum, version, command hoặc file name.
- Dùng relative path trong section `Liên Kết` để các document trong BA package di chuyển cùng nhau.
- Không link đến local secret, private production data dump, invitation URL raw hoặc evidence không được phân quyền.
- Khi reference external, nêu owner/source URL, purpose, boundary và review status; không sao chép thương hiệu/UI/nội dung độc quyền.

## Version, Review Và Change Rules

- Update lớn cho section phải cập nhật `../00-document-control/revision-history.md`, document version và deliverable/README nếu cấu trúc thay đổi.
- Change ảnh hưởng scope, API, data, security, privacy, NFR, DevOps, UAT hoặc release phải đi qua `../04-scope/change-control.md`.
- Khi change một source ID/behavior, update RTM, AC/TS, risk/release/gap artifacts liên quan trong cùng change.
- Giữ history bằng status `Superseded`/`Deprecated`/`Deferred`; không xóa evidence/decision có impact lịch sử.

## Final Review Checklist

- [ ] File/folder name là English kebab-case và file có extension `.md`.
- [ ] Nội dung tiếng Việt, technical/proper term giữ đúng English khi cần.
- [ ] Mục đích, scope, owner/trigger và links có mặt khi cần.
- [ ] ID/priority/status nhất quán với source document.
- [ ] Không còn placeholder chưa được điền hoặc link/evidence giả.
- [ ] Không có password, raw token, secret, PII hoặc Production data nhạy cảm.
- [ ] Table/flow không mâu thuẫn scope/Business Rule/acceptance đã có.

## Liên Kết

- ID convention: `acronyms-and-id-conventions.md`.
- Evidence/test data: `evidence-and-test-data-guidelines.md`.
- Document control: `../00-document-control/document-information.md`, `../00-document-control/revision-history.md`.
