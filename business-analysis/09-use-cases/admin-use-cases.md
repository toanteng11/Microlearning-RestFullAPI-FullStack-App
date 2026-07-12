# Admin Use Cases

## Mục Đích

Tài liệu này đặc tả các use case chính của **Admin** và **Super Admin**. Admin tập trung vào quản trị hệ thống, không thay Teacher giảng dạy hằng ngày.

## UC-025 - Xem Admin Dashboard

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-016 |
| UI Touchpoints | `/admin/dashboard` |
| API Touchpoints | `GET /api/v1/admin/dashboard` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Login và mở Admin Dashboard. |
| 2 | System | Kiểm tra role `ADMIN`/`SUPER_ADMIN`. |
| 3 | System | Load metrics: users, classrooms, courses, completion, recent activity. |
| 4 | System | Hiển thị quick links đến Student List, Teacher List, Admin List, Reports, Audit. |

## UC-014 - Quản Lý Users Tổng Quan

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-009 |
| UI Touchpoints | `/admin/users` |
| API Touchpoints | Role-specific user APIs |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở User Management. |
| 2 | System | Hiển thị entry point: Student List, Teacher List, Admin List, Advanced User Search. |
| 3 | Admin | Chọn danh sách cần quản lý. |
| 4 | System | Điều hướng đến list tương ứng, không tải tất cả users chung một bảng. |

## UC-065 - Xem Student List

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-009A |
| UI Touchpoints | `/admin/users/students` |
| API Touchpoints | `GET /api/v1/admin/users/students` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Student List. |
| 2 | System | Load danh sách chỉ gồm role `STUDENT`. |
| 3 | Admin | Search theo name/email/student code. |
| 4 | Admin | Filter theo status, organization hoặc classroom nếu có. |
| 5 | System | Hiển thị pagination và actions view/block/unblock/deactivate/restore theo quyền. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Admin không đủ quyền | Trả 403 hoặc ẩn action. |
| EX-002 | Không có Student | Hiển thị empty state. |

## UC-066 - Xem Teacher List

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-009B |
| UI Touchpoints | `/admin/users/teachers` |
| API Touchpoints | `GET /api/v1/admin/users/teachers` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Teacher List. |
| 2 | System | Load danh sách chỉ gồm role `TEACHER`. |
| 3 | System | Hiển thị status, invitation status, classroom count, course count, last active. |
| 4 | Admin | Search/filter theo status, invitation status, hasActiveClassroom. |
| 5 | Admin | Mở Teacher detail hoặc tạo invitation/offboarding. |

## UC-067 - Xem Admin List

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin/Super Admin |
| Priority | Must |
| Related FR | FR-009C |
| UI Touchpoints | `/admin/users/admins` |
| API Touchpoints | `GET /api/v1/admin/users/admins` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin/Super Admin | Mở Admin List. |
| 2 | System | Load user role `ADMIN`/`SUPER_ADMIN`. |
| 3 | System | Hiển thị permission group, status, last active. |
| 4 | Actor | Thực hiện action phù hợp quyền. |
| 5 | System | Action nhạy cảm phải kiểm permission và ghi audit. |

### Business Rules

- Admin thường không được cấp/thu hồi `SUPER_ADMIN`.
- Không cho self privilege escalation.

## UC-068 - Advanced User Search

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Should |
| Related FR | FR-009, FR-064 |
| UI Touchpoints | `/admin/users/search` |
| API Touchpoints | `GET /api/v1/admin/users/search` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Nhập keyword hoặc filter role/status. |
| 2 | System | Tìm kiếm server-side trên users. |
| 3 | System | Trả name, email, role, status, link detail. |
| 4 | Admin | Mở detail; action vẫn theo role và permission. |

## UC-027 - Tạo Và Copy Teacher Invitation Link

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-006, FR-007, FR-008 |
| UI Touchpoints | `/admin/teacher-invitations` |
| API Touchpoints | `POST /api/v1/admin/teacher-invitations`, `GET /api/v1/admin/teacher-invitations` |

### Preconditions

- Admin đã login.
- Admin có quyền `teacher_invitation.create`.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Teacher Invitation Management. |
| 2 | Admin | Nhập email Teacher. |
| 3 | System | Validate email và kiểm tra invitation/account hiện có. |
| 4 | System | Tạo token bảo mật, expiry, status `PENDING`, deliveryMethod `MANUAL_COPY`. |
| 5 | System | Hiển thị invitation link. |
| 6 | Admin | Bấm Copy Link. |
| 7 | System | Hiển thị copy success. |
| 8 | Admin | Tự gửi link thủ công qua email, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Email invalid | Hiển thị validation error. |
| EX-002 | Teacher đã active | Không tạo invitation trùng, gợi ý mở Teacher detail. |
| EX-003 | Invitation pending đã tồn tại | Cho copy lại hoặc revoke/tạo mới theo policy. |

## UC-029 - Khóa / Mở Khóa Account

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-004, FR-009 |
| UI Touchpoints | User detail |
| API Touchpoints | `PATCH /api/v1/admin/users/:userId/status` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở User detail. |
| 2 | Admin | Chọn block/unblock/deactivate. |
| 3 | System | Hiển thị confirm dialog và yêu cầu reason nếu policy cần. |
| 4 | Admin | Xác nhận. |
| 5 | System | Validate permission và role target. |
| 6 | System | Cập nhật account status, revoke session nếu cần, ghi audit log. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Teacher còn Classroom active | Cảnh báo và yêu cầu offboarding/transfer/archive trước nếu policy yêu cầu. |
| EX-002 | Admin cố block Super Admin không đủ quyền | Từ chối action. |

## UC-030 - Quản Lý Role Và Permission

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin/Super Admin |
| Priority | Must |
| Related FR | FR-010 |
| UI Touchpoints | `/admin/roles`, User detail |
| API Touchpoints | `PATCH /api/v1/admin/users/:userId/roles` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin/Super Admin | Mở Role Management hoặc User detail. |
| 2 | Actor | Chọn role/permission cần gán hoặc thu hồi. |
| 3 | System | Kiểm tra actor có quyền thay đổi role đó không. |
| 4 | System | Cảnh báo tác động nếu target là Teacher/Admin. |
| 5 | Actor | Xác nhận. |
| 6 | System | Cập nhật role/permission và ghi audit log. |

## UC-031 - Quản Lý Enrollment Policy

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-011 |
| UI Touchpoints | `/admin/settings/enrollment` |
| API Touchpoints | `GET/PATCH /api/v1/admin/settings/enrollment-policy` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Enrollment Policy Settings. |
| 2 | System | Hiển thị trạng thái `Allow Class Code` và `Allow Invite Link`. |
| 3 | Admin | Bật/tắt từng phương thức. |
| 4 | System | Validate và lưu policy. |
| 5 | System | Ghi audit log. |
| 6 | System | Teacher/Student join flow áp dụng policy mới. |

## UC-032 - Xem Tất Cả Classroom / Course

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-012 |
| UI Touchpoints | `/admin/classrooms` |
| API Touchpoints | `GET /api/v1/admin/classrooms`, `GET /api/v1/admin/courses` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Classroom Governance. |
| 2 | System | Load Classroom/Course theo pagination. |
| 3 | Admin | Search/filter theo Teacher, title, status, date. |
| 4 | System | Hiển thị owner, member count, content count, status. |
| 5 | Admin | Mở detail ở chế độ governance. |

## UC-033 - Chuyển Classroom Ownership

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Should |
| Related FR | FR-013 |
| UI Touchpoints | `/admin/classrooms/:id/ownership` |
| API Touchpoints | `PATCH /api/v1/admin/classrooms/:id/ownership` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Classroom detail. |
| 2 | Admin | Chọn `Transfer Ownership`. |
| 3 | System | Hiển thị Teacher mới có status `ACTIVE`. |
| 4 | Admin | Chọn Teacher mới và nhập reason nếu cần. |
| 5 | System | Validate Teacher mới, cập nhật owner, ghi audit log. |

## UC-040 - Offboarding Teacher

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Should |
| Related FR | FR-013 |
| UI Touchpoints | `/admin/users/teachers/:id/offboarding` |
| API Touchpoints | Offboarding/admin classroom APIs |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Teacher detail và chọn Offboarding. |
| 2 | System | Kiểm tra Classroom active của Teacher. |
| 3 | Admin | Chọn transfer ownership hoặc archive từng Classroom. |
| 4 | System | Thực hiện action và ghi audit. |
| 5 | Admin | Deactivate/block Teacher account. |
| 6 | System | Bảo toàn Course, Progress, Submission, Grade và AuditLog. |

## UC-037 - Xem Audit Log

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-017, FR-069 |
| UI Touchpoints | `/admin/audit-logs` |
| API Touchpoints | `GET /api/v1/admin/audit-logs` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Mở Audit Log. |
| 2 | System | Load log theo pagination. |
| 3 | Admin | Filter actor, action, resource type, date range. |
| 4 | System | Hiển thị audit list và detail. |

### Business Rules

- User thường không được sửa/xóa AuditLog.
- Log quan trọng gồm role change, account block, invitation, policy update, ownership transfer.

## UC-038 - Export Reports / Audit Log

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Should |
| Related FR | FR-018 |
| UI Touchpoints | Reports, Audit Log |
| API Touchpoints | Export APIs |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Chọn filter report/audit. |
| 2 | Admin | Bấm Export. |
| 3 | System | Kiểm tra quyền export. |
| 4 | System | Tạo file theo filter hiện tại. |
| 5 | System | Trả file download hoặc link tải. |

## UC-071 - Admin Dangerous Action Confirmation

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Admin |
| Priority | Must |
| Related FR | FR-004, FR-010, FR-013, FR-069 |
| UI Touchpoints | Confirm modal trong Admin pages |
| API Touchpoints | Tùy action |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Admin | Bấm action nguy hiểm như block account, revoke invitation, role change, archive, transfer. |
| 2 | System | Hiển thị confirm dialog với mô tả tác động. |
| 3 | Admin | Nhập reason nếu cần và xác nhận. |
| 4 | System | Validate permission lần cuối. |
| 5 | System | Thực hiện action và ghi audit. |

### Business Rules

- UI có thể ẩn/disable action không đủ quyền, nhưng API vẫn phải kiểm quyền.
- Không dùng confirm chung chung; message phải nêu rõ đối tượng bị ảnh hưởng.
