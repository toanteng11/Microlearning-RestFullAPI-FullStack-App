# Auth And Access Use Cases

## Mục Đích

Tài liệu này đặc tả các use case liên quan đến authentication, session, account status và access control. Đây là lớp nền để Student, Teacher và Admin truy cập đúng dashboard và đúng dữ liệu.

## UC-001 - Đăng Ký Student Account

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Guest / Student |
| Priority | Must |
| Related FR | FR-002 |
| Related User Stories | US-AUTH-008, US-AUTH-009, US-STU-001 |
| UI Touchpoints | `/register` |
| API Touchpoints | `POST /api/v1/auth/register` |

### Preconditions

- Guest chưa login.
- Email chưa tồn tại trong hệ thống.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Guest | Mở Register page. |
| 2 | System | Hiển thị form gồm full name, email, password, confirm password. |
| 3 | Guest | Nhập thông tin và bấm `Register`. |
| 4 | System | Validate required fields, email format, password strength và confirm password. |
| 5 | System | Tạo account với role cố định `STUDENT`, status `ACTIVE` và hash password; không chấp nhận role/status từ client. |
| 6 | System | Không tạo auth session hoặc Enrollment; redirect Student đến Login và giữ join context an toàn nếu registration bắt đầu từ Invite Link. |

### Alternative / Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Email đã tồn tại | Hiển thị lỗi email đã được sử dụng, không tạo account mới. |
| EX-002 | Password không đạt rule | Hiển thị lỗi gần password field. |
| EX-003 | API lỗi | Hiển thị error state và cho phép thử lại. |
| SEC-001 | Client gửi role/status khác | System bỏ qua hoặc từ chối field không được phép; không tạo Teacher/Admin/Super Admin account. |

### Postconditions

- Account Student được tạo nếu hợp lệ.
- Student chưa có session và chưa thuộc Classroom nào cho đến khi Login và join thành công.
- Không lưu password plain text.

## UC-002 - Login

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | User |
| Priority | Must |
| Related FR | FR-001, FR-004, FR-005 |
| Related User Stories | US-AUTH-001, US-AUTH-002, US-AUTH-003, US-AUTH-006 |
| UI Touchpoints | `/login` |
| API Touchpoints | `POST /api/v1/auth/login` |

### Preconditions

- User có account trong hệ thống.
- Account không ở trạng thái `DELETED`.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | User | Mở Login page. |
| 2 | System | Hiển thị form email/password, forgot password và submit. |
| 3 | User | Nhập email/password và bấm `Login`. |
| 4 | System | Validate required fields và gọi login API. |
| 5 | System | Kiểm tra password, role, account status. |
| 6 | System | Tạo access token/refresh token hoặc session. |
| 7 | System | Redirect theo role: Student Dashboard, Teacher Dashboard hoặc Admin Dashboard. |

### Alternative / Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Sai email/password | Hiển thị lỗi chung an toàn, không tiết lộ account tồn tại hay không. |
| EX-002 | Account `BLOCKED` | Từ chối login, hiển thị thông báo tài khoản bị khóa. |
| EX-003 | Account `INACTIVE` | Từ chối login hoặc yêu cầu liên hệ Admin. |
| EX-004 | Role không hợp lệ | Từ chối login và ghi security event nếu cần. |
| EX-005 | API timeout | Hiển thị retry state. |

### Postconditions

- User vào đúng dashboard theo role.
- Session/token được lưu theo cơ chế bảo mật của frontend.

## UC-047 - Logout

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | User |
| Priority | Must |
| Related FR | FR-001 |
| Related User Stories | US-AUTH-005 |
| UI Touchpoints | Header/Profile menu |
| API Touchpoints | `POST /api/v1/auth/logout` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | User | Bấm menu profile và chọn `Logout`. |
| 2 | System | Gọi API logout hoặc xóa session hiện tại. |
| 3 | System | Xóa token/session ở client. |
| 4 | System | Redirect về Login page. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Logout API lỗi | Client vẫn xóa token cục bộ và redirect login nếu policy cho phép. |

## UC-048 - Forgot / Reset Password

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | User |
| Priority | Should |
| Related FR | FR-003 |
| Related User Stories | US-AUTH-011 đến US-AUTH-014 |
| UI Touchpoints | `/forgot-password`, `/reset-password` |
| API Touchpoints | `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | User | Mở Forgot Password page. |
| 2 | User | Nhập email và submit. |
| 3 | System | Tạo reset token nếu account hợp lệ, không tiết lộ email có tồn tại hay không. |
| 4 | User | Mở reset link hoặc reset flow hợp lệ. |
| 5 | User | Nhập password mới và confirm password. |
| 6 | System | Validate token, password rule, hash password mới. |
| 7 | System | Vô hiệu reset token và yêu cầu login lại. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Token hết hạn | Hiển thị lỗi và gợi ý yêu cầu reset lại. |
| EX-002 | Token đã dùng | Từ chối reset, hiển thị message an toàn. |
| EX-003 | Password yếu | Hiển thị validation error. |

## UC-049 - View / Update Profile

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | User |
| Priority | Should |
| Related FR | FR-005 |
| Related User Stories | US-AUTH-015, US-AUTH-016 |
| UI Touchpoints | `/profile` |
| API Touchpoints | `GET /api/v1/users/me`, `PATCH /api/v1/users/me` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | User | Mở Profile page. |
| 2 | System | Gọi API lấy profile hiện tại. |
| 3 | System | Hiển thị name, email, role, status và thông tin được phép xem. |
| 4 | User | Cập nhật field được phép. |
| 5 | System | Validate và lưu thay đổi. |

### Business Rules

- User không tự đổi role/status.
- Email chính có thể bị khóa nếu policy yêu cầu Admin xử lý.
- Password không hiển thị ở profile.

## UC-050 - Route Authorization Guard

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | System / User |
| Priority | Must |
| Related FR | FR-004, FR-005 |
| Related User Stories | US-AUTH-006, US-AUTH-007 |
| UI Touchpoints | Tất cả protected routes |
| API Touchpoints | Middleware authentication/authorization |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | User | Truy cập một protected route. |
| 2 | Frontend | Kiểm tra token/session hiện có. |
| 3 | System | Nếu cần, gọi API lấy current user/permission. |
| 4 | System | Kiểm tra role, account status và permission. |
| 5 | System | Cho vào màn hình nếu hợp lệ. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Chưa login | Redirect `/login`, giữ returnUrl nếu phù hợp. |
| EX-002 | Token hết hạn | Refresh token; nếu fail thì redirect login. |
| EX-003 | Không đủ quyền | Hiển thị 403 page hoặc redirect dashboard theo role. |
| EX-004 | Account bị block giữa phiên | Vô hiệu session và yêu cầu login lại/liên hệ Admin. |

## UC-051 - Accept Teacher Invitation

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-006, FR-007, FR-008 |
| Related User Stories | US-TCH-INV-001 đến US-TCH-INV-004 |
| UI Touchpoints | `/teacher/invite?token=...` |
| API Touchpoints | `POST /api/v1/teacher/invitations/preview`, `POST /api/v1/teacher/invitations/accept`; token nằm trong strict body |

### Preconditions

- Invitation token tồn tại.
- Invitation status là `PENDING`.
- Invitation chưa hết hạn và chưa revoked.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở link invitation do Admin gửi thủ công. |
| 2 | System | Validate token và hiển thị activation form. |
| 3 | Teacher | Nhập full name, email, password, confirm password. |
| 4 | System | Validate email khớp với email được mời. |
| 5 | System | Tạo/activate account role `TEACHER`, status `ACTIVE`. |
| 6 | System | Đánh dấu invitation `ACCEPTED` và ghi audit log. |
| 7 | System | Redirect Teacher đến login hoặc Teacher Dashboard. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Token hết hạn | Hiển thị invitation expired. |
| EX-002 | Token revoked | Hiển thị invitation revoked. |
| EX-003 | Email không khớp | Từ chối activation. |
| EX-004 | Password không hợp lệ | Hiển thị validation error. |

## UC-052 - Open Public Join Link Before Login

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Guest / Student |
| Priority | Must |
| Related FR | FR-001, FR-002, FR-022, FR-023 |
| Related User Stories | US-AUTH-020 |
| UI Touchpoints | `/join/invite#token=...`, sau capture dùng clean route `/join/invite` |
| API Touchpoints | `POST /api/v1/classrooms/invite-links/preview`, `POST /api/v1/classrooms/join-by-token`; token nằm trong strict body |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Guest/Student | Mở Invite Link `/join/invite#token=...`. |
| 2 | Frontend | Capture token một lần, xóa fragment bằng `history.replaceState`, sau đó gọi preview bằng POST body. |
| 3 | System | Validate sơ bộ token/policy để trả preview tối thiểu với `Cache-Control: no-store`, không cấp quyền Classroom. |
| 4 | System | Nếu chưa login, redirect Login; cung cấp link Student Register nếu Guest chưa có account và giữ join context an toàn. |
| 5 | Guest/Student | Register nếu cần; sau registration quay lại Login và đăng nhập bằng account `STUDENT`. |
| 6 | System | Sau Login, khôi phục context và validate lại token, policy, Classroom, account status và Enrollment. |
| 7 | Student | Confirm join. |
| 8 | System | Tạo đúng một Enrollment nếu hợp lệ, xóa join context và redirect Classroom detail. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Link hết hạn/sai | Hiển thị link invalid/expired. |
| EX-002 | Admin tắt Invite Link | Hiển thị join method unavailable. |
| EX-003 | Student đã join | Hiển thị already joined và nút vào Classroom. |
