# Usability And Accessibility Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu usability và accessibility ở cấp NFR. Phần 12 đã mô tả UI/UX theo màn hình; file này đặt ra tiêu chí chất lượng chung để QA và Frontend có thể kiểm tra.

## Usability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-USA-001 | Student sau login phải thấy To-do/Việc cần làm rõ ràng. | Must | Student Dashboard hiển thị To-do hoặc empty state. |
| NFR-USA-002 | Teacher phải vào được Course Dashboard và thấy Lesson/Activity, deadline, progress ranking. | Must | Teacher mở Course có dữ liệu chính trong một màn hình. |
| NFR-USA-003 | Admin User Management phải tách Student List, Teacher List, Admin List. | Must | Không có default table tải tất cả user role lẫn nhau. |
| NFR-USA-004 | Các màn hình sâu phải có Back/breadcrumb/return action phù hợp. | Must | User không bị mắc ở dead-end screen. |
| NFR-USA-005 | Form quan trọng phải có validation message dễ hiểu. | Must | Không chỉ báo lỗi chung chung. |
| NFR-USA-006 | Action nguy hiểm phải có confirm. | Must | Revoke, archive, role/status change có confirm. |
| NFR-USA-007 | Editor/form có unsaved changes phải cảnh báo khi rời trang. | Should | Teacher không mất bài đang soạn vô tình. |
| NFR-USA-008 | Empty state phải hướng dẫn bước tiếp theo. | Should | Không hiển thị màn hình trắng hoặc dấu gạch ngang. |

## Accessibility Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-ACC-001 | Form field phải có label hoặc accessible name. | Must | Login, invite accept, create classroom, lesson editor có label. |
| NFR-ACC-002 | Button icon phải có accessible label. | Should | Copy/Edit/Delete/Close có aria-label hoặc text. |
| NFR-ACC-003 | Status quan trọng không chỉ dựa vào màu. | Must | Late/Missing/Active/Revoked có text. |
| NFR-ACC-004 | Keyboard user phải thao tác được form và modal chính. | Should | Tab order hợp lý, Enter submit, Escape close nếu an toàn. |
| NFR-ACC-005 | Modal confirm phải quản lý focus. | Should | Focus trong modal và trả về button mở modal. |
| NFR-ACC-006 | Error message phải đọc được và gắn với field nếu có thể. | Should | Screen reader/user thường hiểu field nào lỗi. |
| NFR-ACC-007 | Text contrast phải đủ đọc trên nền và badge. | Should | UI review theo design. |
| NFR-ACC-008 | Media trong lesson/quiz phải có fallback text nếu tải lỗi. | Should | Không vỡ layout khi image/video lỗi. |

## Responsive Usability Requirements

| Viewport | Requirement |
| --- | --- |
| Mobile | Student xem Dashboard, To-do, Lesson, Quiz không bị tràn layout. |
| Tablet | Teacher thao tác cơ bản với dashboard/content list được. |
| Desktop | Teacher/Admin có table, filter, pagination rõ ràng. |

## Error State Usability

| Error | UI behavior |
| --- | --- |
| 401 | Redirect login hoặc refresh token. |
| 403 | Forbidden page và nút quay về dashboard. |
| 404 | Not found/empty state có action quay lại. |
| 409 | Conflict message như already joined, invitation accepted. |
| 422 | Field validation message. |
| 500/503 | Error state, retry nếu phù hợp. |

## Acceptance Criteria

- Student, Teacher, Admin hoàn thành được flow chính mà không cần hướng dẫn ngoài màn hình.
- Màn hình chính có loading/empty/error state.
- UI không phụ thuộc chỉ vào màu để truyền đạt trạng thái.
- Form và modal chính dùng được bằng keyboard ở mức cơ bản.
- Mobile không làm mất action chính của Student learning flow.
