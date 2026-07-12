# Guest And Authentication User Stories

## Mục Đích

Tài liệu này mô tả user stories cho **Guest**, **User** và các flow liên quan đến authentication/account. Đây là nền tảng để Student, Teacher và Admin có thể truy cập đúng role, đúng account status và đúng quyền.

## Epic AUTH-01 - Login, Session Và Logout

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-AUTH-001 | Là Guest, tôi muốn nhìn thấy Login page để bắt đầu truy cập hệ thống. | Must | FR-001 | Login page có email, password, submit, forgot password; có validation required field. |
| US-AUTH-002 | Là User, tôi muốn login bằng email/password hợp lệ để vào đúng dashboard theo role. | Must | FR-001, FR-005 | Login thành công tạo session/token; Student vào Student Dashboard, Teacher vào Teacher Dashboard, Admin vào Admin Dashboard. |
| US-AUTH-003 | Là User, tôi muốn được thông báo rõ khi login sai để biết cần sửa thông tin nào. | Must | FR-001, FR-065 | Sai email/password hiển thị lỗi chung an toàn; không tiết lộ account có tồn tại hay không. |
| US-AUTH-004 | Là User, tôi muốn session được refresh hợp lệ để không bị đăng xuất đột ngột khi đang dùng hệ thống. | Must | FR-001 | Token hết hạn được refresh nếu refresh token còn hợp lệ; nếu không hợp lệ thì redirect login. |
| US-AUTH-005 | Là User, tôi muốn logout để kết thúc phiên làm việc an toàn. | Must | FR-001 | Logout xóa token/session hiện tại; user không thể gọi API protected bằng token cũ. |
| US-AUTH-006 | Là User, tôi muốn hệ thống chặn account `BLOCKED`, `INACTIVE`, `DELETED` khi login để bảo vệ platform. | Must | FR-004, FR-005 | Account không active không login vào dashboard; message phù hợp theo policy; hành động có thể được audit nếu cần. |
| US-AUTH-007 | Là User, tôi muốn được chuyển về màn hình phù hợp khi truy cập route không có quyền. | Must | FR-005, FR-057 | Route bị cấm trả 403/redirect; UI hiển thị thông báo và nút quay lại nơi phù hợp. |

## Epic AUTH-02 - Student Registration

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-AUTH-008 | Là Guest, tôi muốn tự đăng ký Student account để có thể bắt đầu sử dụng hệ thống. | Must | FR-002 | Form register tạo account cố định role `STUDENT`, status `ACTIVE`; password được hash; không tạo session/Enrollment và chuyển đến Login. |
| US-AUTH-009 | Là Student vừa đăng ký, tôi muốn được yêu cầu Login trước khi join Classroom để quyền truy cập được xác thực. | Must | FR-001, FR-002, FR-023 | Sau registration hệ thống mở Login; chỉ sau Login thành công mới cho tiếp tục join flow. |
| US-AUTH-010 | Là Guest, tôi muốn form register validate email/password/name để tránh tạo account sai dữ liệu. | Must | FR-002, FR-065 | Email được normalize và đúng format/unique; password đạt rule; confirm password khớp; lỗi hiển thị gần field liên quan. |

## Epic AUTH-03 - Forgot Password Và Reset Password

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-AUTH-011 | Là User, tôi muốn yêu cầu reset password khi quên mật khẩu để lấy lại quyền truy cập. | Should | FR-003 | User nhập email; hệ thống tạo reset token hoặc hướng dẫn reset; không tiết lộ email có tồn tại hay không. |
| US-AUTH-012 | Là User, tôi muốn đặt mật khẩu mới bằng reset token hợp lệ để đăng nhập lại. | Should | FR-003 | Token hợp lệ, chưa hết hạn, one-time use; password mới được hash; token bị vô hiệu sau khi dùng. |
| US-AUTH-013 | Là User, tôi muốn thấy thông báo rõ khi reset token hết hạn hoặc không hợp lệ. | Should | FR-003, FR-065 | UI hiển thị lỗi và gợi ý yêu cầu reset password lại. |
| US-AUTH-014 | Là Admin, tôi muốn kích hoạt reset password flow cho user mà không biết mật khẩu của họ. | Must | FR-003, FR-009 | Admin không đặt password plain text; hệ thống chỉ tạo reset flow hoặc hướng dẫn reset an toàn. |

## Epic AUTH-04 - Profile Và Account Context

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-AUTH-015 | Là User, tôi muốn xem profile cá nhân để biết thông tin tài khoản đang dùng. | Must | FR-005 | Profile hiển thị name, email, role, status và thông tin cơ bản phù hợp. |
| US-AUTH-016 | Là User, tôi muốn cập nhật thông tin profile được phép để giữ dữ liệu cá nhân chính xác. | Should | FR-005 | User chỉ cập nhật field được phép; email/role/status nhạy cảm không tự ý sửa nếu policy không cho phép. |
| US-AUTH-017 | Là User, tôi muốn biết role hiện tại của mình để hiểu quyền truy cập trong hệ thống. | Must | FR-005 | UI hiển thị role hoặc dashboard theo role; API không trả permission vượt quá quyền. |
| US-AUTH-018 | Là User, tôi muốn các lỗi authentication hiển thị nhất quán để không bị bối rối. | Must | FR-065 | Lỗi 401/403/session expired hiển thị message rõ, có action login lại hoặc quay về dashboard. |

## Epic AUTH-05 - Public Entry Links

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-AUTH-019 | Là Teacher được mời, tôi muốn mở Teacher Invitation Link khi chưa login để kích hoạt tài khoản. | Must | FR-006, FR-007 | Link hợp lệ mở activation form; link hết hạn/revoked hiển thị lỗi rõ. |
| US-AUTH-020 | Là Guest/Student, tôi muốn mở Classroom Invite Link khi chưa login để đăng ký nếu cần rồi Login trước khi join. | Must | FR-001, FR-002, FR-022, FR-023 | Hệ thống giữ join context an toàn qua Register/Login; sau Login validate lại token và quay lại bước xác nhận join. |

## Business Rules Liên Quan

| Rule | Nội dung |
| --- | --- |
| AUTH-BR-001 | Account chỉ dùng đầy đủ khi `status = ACTIVE`. |
| AUTH-BR-002 | Admin không được xem hoặc đặt mật khẩu plain text của user. |
| AUTH-BR-003 | Reset token và invitation token phải có expiry và không nên tái sử dụng. |
| AUTH-BR-004 | Role-based redirect phải dựa trên role từ backend, không hard-code ở frontend. |
| AUTH-BR-005 | Route và API đều phải kiểm quyền; không chỉ chặn bằng giao diện. |
