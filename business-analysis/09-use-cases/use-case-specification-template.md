# Use Case Specification Template

## Use Case ID

`UC-XXX`

## Use Case Name

Tên use case nên bắt đầu bằng động từ, ví dụ `Join Classroom bằng Class Code`.

## Summary

Mô tả ngắn gọn use case giải quyết vấn đề gì và tạo giá trị gì cho actor.

## Primary Actor

- [Điền actor chính]

## Supporting Actors

- System
- [Điền supporting actor nếu có]

## Related Requirements

| Loại | ID |
| --- | --- |
| Business Requirement | BRQ-XXX |
| Functional Requirement | FR-XXX |
| User Story | US-XXX |
| Business Process | BP-XXX |

## Trigger

Sự kiện bắt đầu use case.

Ví dụ:

- Student nhập Class Code và bấm `Join`.
- Teacher bấm `Create Course`.
- Admin bấm `Block Account`.

## Preconditions

- User đã login hoặc chưa login tùy use case.
- Account status hợp lệ.
- Actor có quyền phù hợp.
- Resource liên quan tồn tại.
- System policy cho phép hành động.

## Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Actor | [Điền hành động khởi đầu] |
| 2 | System | [Điền xử lý hoặc phản hồi hệ thống] |
| 3 | Actor | [Điền hành động tiếp theo] |
| 4 | System | [Điền kết quả thành công] |

## Alternative Flows

| Mã | Tình huống | Luồng thay thế |
| --- | --- | --- |
| ALT-001 | [Điều kiện thay thế] | [Luồng hệ thống xử lý] |

## Exception Flows

| Mã | Lỗi / Ngoại lệ | Hành vi hệ thống |
| --- | --- | --- |
| EX-001 | Validation failed | Hiển thị lỗi gần field liên quan, không lưu dữ liệu |
| EX-002 | Unauthorized | Redirect login hoặc trả 401 |
| EX-003 | Forbidden | Hiển thị 403 hoặc thông báo không đủ quyền |
| EX-004 | Resource not found | Hiển thị not found state |
| EX-005 | API/server error | Hiển thị error state và action retry nếu phù hợp |

## Postconditions

- Dữ liệu được tạo/cập nhật đúng.
- UI hiển thị trạng thái thành công.
- Audit log được ghi nếu action quan trọng.
- Actor được điều hướng đến màn hình phù hợp.

## Business Rules

| Rule ID | Rule |
| --- | --- |
| UCXXX-BR001 | [Điền business rule áp dụng] |

## UI Touchpoints

| UI | Mô tả |
| --- | --- |
| Page / Route | [Điền page hoặc route liên quan] |
| Components | Form, table, modal, drawer, toast, breadcrumb |
| Loading State | [Điền hành vi khi đang tải] |
| Empty State | [Điền hành vi khi không có dữ liệu] |
| Error State | [Điền hành vi khi có lỗi] |
| Navigation | Back, Previous, Next, breadcrumb hoặc return link |

## API Touchpoints

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET/POST/PATCH/DELETE | `/api/v1/...` | [Điền mục đích endpoint] |

## Data Inputs

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| [Field] | [Type] | [Yes/No] | [Validation] |

## Data Outputs

| Entity | Field / Change |
| --- | --- |
| [Entity] | [Field hoặc thay đổi dữ liệu] |

## Acceptance Criteria

- [Điền acceptance criteria có thể kiểm thử]

## Notes For QA

- Test happy path.
- Test validation error.
- Test permission denied.
- Test empty/loading/error states.
- Test responsive behavior nếu UI quan trọng.
- Test API response và data persistence.
