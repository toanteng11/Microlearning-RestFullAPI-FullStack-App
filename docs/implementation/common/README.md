# Common Implementation Standards

## Mục đích

Thư mục `common/` chứa các quy tắc áp dụng xuyên suốt Phase 01 đến Phase 08. Tài liệu trong từng phase được phép bổ sung yêu cầu cụ thể nhưng không được làm yếu các quality gate, Definition of Done hoặc traceability rule ở đây nếu chưa có quyết định được phê duyệt.

## Danh mục

| File | Trách nhiệm |
| --- | --- |
| `technical-implementation-plan.md` | Lộ trình tổng thể và dependency giữa các phase |
| `coding-standards.md` | Quy ước source code, API, database và test |
| `development-workflow.md` | Branch, commit, Pull Request, review và CI workflow |
| `definition-of-done.md` | Điều kiện hoàn thành task, feature, phase và release |
| `traceability-matrix.md` | Ánh xạ BA requirement với implementation/test evidence |

## Quy tắc thay đổi

- Thay đổi tài liệu common phải đánh giá ảnh hưởng tới tất cả phase đang thực hiện.
- Phase-specific document không sao chép toàn bộ common standard; chỉ tham chiếu và ghi phần bổ sung.
- Khi có xung đột, common baseline có hiệu lực cho đến khi Technical Lead phê duyệt exception/ADR rõ ràng.
