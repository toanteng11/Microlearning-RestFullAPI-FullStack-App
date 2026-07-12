# Teacher Invitation Process

## Mục Đích

Tài liệu này mô tả quy trình **Admin cung cấp tài khoản cho Teacher** bằng cơ chế **Manual Invitation Link**. Đây là process chính thức của MVP.

Theo quyết định nghiệp vụ của dự án:

- System **không bắt buộc tự gửi email invitation** cho Teacher trong MVP.
- Admin tạo invitation trong hệ thống.
- System sinh invitation link có token bảo mật.
- Admin copy link và tự gửi thủ công cho Teacher qua kênh phù hợp như email, Zalo, Facebook Messenger, Microsoft Teams hoặc kênh liên lạc nội bộ.
- Teacher mở link và tự tạo mật khẩu.

Quy trình này giúp Admin không cần biết mật khẩu của Teacher, đồng thời dự án không bị phụ thuộc bắt buộc vào Gmail, SMTP, SendGrid hoặc email provider trong giai đoạn đầu.

## Process Summary

| Thuộc tính | Giá trị |
| --- | --- |
| Process ID | BP-003 |
| Process Name | Teacher Invitation Process |
| Process Owner | Admin |
| Supporting Actors | Teacher, System |
| Trigger | Admin muốn cấp quyền sử dụng hệ thống cho một Teacher mới |
| Priority | Must Have |
| Invitation Delivery Method | `MANUAL_COPY` |
| Input | Teacher email, optional full name/note |
| Output | Invitation link, Teacher account activated, audit log |

## Vì Sao Admin Vẫn Cần Nhập Email Teacher?

Mặc dù System không tự gửi email, Admin vẫn cần nhập email Teacher vì email được dùng như **định danh nghiệp vụ** cho invitation.

Email phục vụ các mục đích sau:

- Ràng buộc invitation với đúng người được mời.
- Kiểm tra email đã tồn tại trong hệ thống hay chưa.
- Ngăn người khác dùng link nếu không nhập đúng email được mời.
- Tạo user account có email chính thức.
- Hỗ trợ login, forgot password và quản trị account sau này.
- Giúp Admin/Teacher/QA trace được invitation thuộc về ai.

Điểm cần hiểu rõ:

```text
Email trong process này dùng để định danh Teacher.
Email không đồng nghĩa với việc hệ thống tự gửi mail.
Admin là người copy link và tự gửi thủ công qua kênh bên ngoài.
```

## Actor Và Trách Nhiệm

| Actor | Trách nhiệm |
| --- | --- |
| Admin | Nhập email Teacher, tạo invitation, copy link, gửi thủ công, revoke/resend nếu cần |
| Teacher | Nhận link, mở link, nhập thông tin, tự tạo mật khẩu và kích hoạt account |
| System | Validate email, sinh token, tạo link, validate token, tạo/kích hoạt account và ghi audit log |

## Preconditions

- Admin đã login thành công.
- Admin có quyền `MANAGE_TEACHER_INVITATION` hoặc quyền tương đương.
- Email Teacher hợp lệ về định dạng.
- Nếu email đã tồn tại, account đó không được ở trạng thái xung đột với invitation mới.
- Base URL của hệ thống đã được cấu hình đúng theo environment, ví dụ `https://microlearning.app`.

## Postconditions

Sau khi process hoàn tất thành công:

- Teacher có account với `Role = TEACHER`.
- Teacher account có `Status = ACTIVE`.
- Invitation có `Status = ACCEPTED`.
- Password được Teacher tự tạo và được hash trước khi lưu.
- Admin không biết password của Teacher.
- System ghi audit log cho create/copy/accept invitation.

## Main Flow

```text
Admin mở Teacher Invitation Management
        ↓
Admin nhập email Teacher
        ↓
System validate email và kiểm tra account hiện có
        ↓
System tạo invitation token
        ↓
System lưu tokenHash và invitation status = PENDING
        ↓
System tạo invitation link
        ↓
System hiển thị link cho Admin
        ↓
Admin copy link
        ↓
Admin gửi thủ công cho Teacher qua kênh bên ngoài
        ↓
Teacher mở link
        ↓
System validate token
        ↓
Teacher nhập Full Name, Email, New Password, Confirm Password
        ↓
System validate dữ liệu và email matching
        ↓
System tạo/kích hoạt Teacher account
        ↓
Role = TEACHER, Status = ACTIVE
```

## Detailed Main Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Admin | Login vào Admin Dashboard | System xác thực Admin |
| 2 | Admin | Mở `Teacher Invitation Management` | Hiển thị danh sách invitation hiện có |
| 3 | Admin | Nhập email Teacher | System validate định dạng email |
| 4 | Admin | Bấm `Create Invitation` | System kiểm tra email đã tồn tại chưa |
| 5 | System | Tạo invitation token | Token đủ dài, khó đoán và chỉ hiển thị một lần |
| 6 | System | Lưu invitation | Lưu `tokenHash`, `email`, `status = PENDING`, `expiresAt` |
| 7 | System | Tạo invitation link | Link có dạng `/teacher/invite?token=...` |
| 8 | System | Hiển thị link | Admin thấy nút `Copy Link` |
| 9 | Admin | Copy link | System có thể ghi `copiedAt`, `copyCount` |
| 10 | Admin | Gửi thủ công cho Teacher | Gửi qua email/Zalo/Facebook/Messenger/Teams/kênh nội bộ |
| 11 | Teacher | Mở invitation link | System đọc token |
| 12 | System | Validate token | Kiểm tra token tồn tại, chưa hết hạn, chưa dùng, chưa revoke |
| 13 | Teacher | Nhập Full Name, Email, Password | System validate form |
| 14 | System | Kiểm tra email matching | Email nhập phải khớp email được mời |
| 15 | System | Tạo hoặc kích hoạt account | Gán `Role = TEACHER`, `Status = ACTIVE` |
| 16 | System | Cập nhật invitation | `Status = ACCEPTED`, lưu `acceptedAt` |
| 17 | Teacher | Hoàn tất activation | Điều hướng đến Login hoặc Teacher Dashboard |

## Invitation Link Ví Dụ

```text
https://microlearning.app/teacher/invite?token=abc123xyz
```

## Kênh Gửi Thủ Công Được Chấp Nhận

| Kênh | Được phép dùng | Ghi chú nghiệp vụ |
| --- | --- | --- |
| Email cá nhân hoặc email trường | Có | Admin tự copy link và gửi bằng email của mình |
| Zalo | Có | Phù hợp bối cảnh Việt Nam, gửi nhanh cho Teacher |
| Facebook Messenger | Có | Chỉ nên dùng nếu tổ chức chấp nhận kênh này |
| Microsoft Teams | Có | Phù hợp môi trường nội bộ/trường học |
| Slack | Có | Phù hợp team kỹ thuật hoặc tổ chức dùng Slack |
| SMS | Có thể | Cần cẩn trọng vì link dài và dễ bị chuyển tiếp |
| In trực tiếp nội bộ | Có thể | Chỉ dùng trong bối cảnh onboarding kiểm soát được |

## Form Kích Hoạt Account Teacher

Teacher nhìn thấy form sau khi mở link hợp lệ:

| Field | Mô tả | Bắt buộc | Validation |
| --- | --- | --- | --- |
| Full Name | Họ tên Teacher | Có | Không rỗng, độ dài hợp lệ |
| Email | Email được Admin mời | Có | Đúng định dạng và khớp invitation email |
| New Password | Mật khẩu mới | Có | Theo password policy |
| Confirm Password | Xác nhận mật khẩu | Có | Phải khớp New Password |

## Invitation Status

| Status | Ý nghĩa |
| --- | --- |
| PENDING | Invitation đã được tạo nhưng Teacher chưa kích hoạt |
| ACCEPTED | Teacher đã dùng invitation để kích hoạt account |
| EXPIRED | Invitation hết hạn |
| REVOKED | Admin đã thu hồi invitation |

## Alternative Flows

| Mã | Tình huống | Luồng thay thế |
| --- | --- | --- |
| ALT-001 | Admin muốn gửi lại link | Admin copy lại link nếu invitation còn `PENDING` và chưa hết hạn |
| ALT-002 | Link hết hạn | Admin tạo invitation mới hoặc regenerate token nếu hệ thống hỗ trợ |
| ALT-003 | Admin gửi nhầm link | Admin revoke invitation cũ và tạo invitation mới |
| ALT-004 | Teacher đã có account inactive | System có thể kích hoạt lại account sau khi Admin xác nhận theo policy |
| ALT-005 | Teacher mở link trên mobile | System hiển thị form activation responsive |

## Exception Flows

| Mã | Tình huống lỗi | Hành vi hệ thống |
| --- | --- | --- |
| EX-001 | Email không đúng định dạng | Không tạo invitation, hiển thị lỗi validation |
| EX-002 | Email đã có account `ACTIVE` | Không tạo invitation mới, thông báo account đã tồn tại |
| EX-003 | Token không tồn tại | Hiển thị lỗi invitation không hợp lệ |
| EX-004 | Token hết hạn | Hiển thị lỗi invitation đã hết hạn |
| EX-005 | Token đã được accept | Không cho kích hoạt lại |
| EX-006 | Token bị revoke | Không cho kích hoạt account |
| EX-007 | Email Teacher nhập không khớp | Hiển thị lỗi email không khớp invitation |
| EX-008 | Password yếu | Yêu cầu Teacher nhập password mạnh hơn |
| EX-009 | Confirm Password không khớp | Hiển thị lỗi validation |
| EX-010 | System lỗi khi tạo account | Không đánh dấu invitation accepted, hiển thị retry/support message |

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| BP003-BR001 | Delivery method của MVP là `MANUAL_COPY` |
| BP003-BR002 | System không bắt buộc gửi email invitation tự động trong MVP |
| BP003-BR003 | Admin phải copy invitation link và tự gửi thủ công qua kênh ngoài hệ thống |
| BP003-BR004 | Email Teacher vẫn bắt buộc vì dùng để định danh và email matching |
| BP003-BR005 | Admin không được biết, đặt hoặc gửi password của Teacher |
| BP003-BR006 | Teacher phải tự tạo password qua invitation link |
| BP003-BR007 | Invitation token chỉ được dùng một lần |
| BP003-BR008 | Invitation token phải có thời hạn |
| BP003-BR009 | Admin có thể revoke invitation khi invitation chưa được accept |
| BP003-BR010 | System không lưu raw token trong database, chỉ nên lưu `tokenHash` |
| BP003-BR011 | Hành động create/copy/revoke/accept invitation phải được audit |

## Data Outputs

| Dữ liệu | Mô tả |
| --- | --- |
| TeacherInvitation | Bản ghi invitation gồm email, status, expiresAt, tokenHash |
| InvitationToken | Raw token chỉ xuất hiện trong link, không lưu plain trong database |
| User | Teacher account sau khi activation thành công |
| AuditLog | Log create, copy, accept, revoke, expire |
| SecurityEvent | Event bất thường như invalid token, expired token, repeated failed activation |

## UI Touchpoints

| Màn hình | Mục đích |
| --- | --- |
| Admin Teacher Invitation Management | Admin tạo, copy, revoke invitation |
| Admin User Management | Admin xem trạng thái Teacher account |
| Teacher Invitation Landing Page | Teacher mở link và kiểm tra token |
| Teacher Account Activation Form | Teacher nhập thông tin và tạo password |
| Teacher Dashboard | Teacher vào hệ thống sau khi account active |

## API Touchpoints

| API Group | Mục đích |
| --- | --- |
| Admin Invitation API | Tạo, lấy danh sách, revoke invitation |
| Teacher Activation API | Validate token và activate account |
| User API | Tạo/cập nhật Teacher account |
| Auth API | Login sau khi activation |
| Audit API | Ghi log thao tác invitation |

## Security Notes

- Token phải đủ dài, ngẫu nhiên và khó đoán.
- Token nên hết hạn sau một khoảng thời gian xác định, ví dụ 24 giờ hoặc 72 giờ.
- Raw token chỉ hiển thị trong link để Admin copy.
- Database chỉ nên lưu `tokenHash`.
- Password phải hash bằng thuật toán phù hợp trước khi lưu.
- Không gửi password qua email, Zalo, Messenger hoặc bất kỳ kênh nào.
- Admin không được xem plain password.
- Nếu link bị lộ, người nhận vẫn phải nhập đúng email được mời.

## Acceptance Checkpoints

- Admin tạo được invitation bằng email hợp lệ.
- System hiển thị invitation link để Admin copy.
- Admin có thể copy link và tự gửi thủ công ngoài hệ thống.
- Teacher mở link hợp lệ và thấy activation form.
- Teacher nhập đúng email được mời và tự tạo password.
- Account sau activation có `Role = TEACHER`, `Status = ACTIVE`.
- Invitation sau activation có `Status = ACCEPTED`.
- Link expired/revoked/used không thể kích hoạt lại.
- System không yêu cầu cấu hình Gmail/SMTP để process này hoạt động trong MVP.

## Ghi Chú Cho DevOps Và QA

- DevOps cần cấu hình đúng `APP_BASE_URL` theo environment để link mời sinh ra không sai domain.
- CI/CD nên chạy test cho token generation, token validation, email matching và activation.
- Monitoring nên theo dõi lỗi activation để phát hiện link sai domain hoặc expired token quá nhiều.
- Khi deploy lên Cloud, cần đảm bảo HTTPS để invitation link và password activation an toàn.
