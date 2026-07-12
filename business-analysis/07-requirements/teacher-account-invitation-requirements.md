# Teacher Account Invitation Requirements

## Mục Đích

Tài liệu này mô tả requirements cho chức năng Admin mời Teacher tạo tài khoản bằng **manual invitation link**.

Theo quyết định nghiệp vụ của dự án, hệ thống không cần tự gửi email invitation trong MVP. Admin tạo invitation, hệ thống hiển thị link mời, Admin copy link và tự gửi thủ công cho Teacher qua email cá nhân, Zalo, Facebook, Messenger, Teams hoặc kênh liên lạc phù hợp.

## Business Requirements

| ID | Business Requirement | Giá trị nghiệp vụ | Priority |
| --- | --- | --- | --- |
| BRQ-INV-001 | Admin phải có thể tạo invitation link cho Teacher. | Hỗ trợ onboarding Teacher an toàn mà không cần tạo mật khẩu hộ. | Must |
| BRQ-INV-002 | Admin phải copy invitation link và tự gửi thủ công cho Teacher. | Không phụ thuộc bắt buộc vào Gmail, SMTP hoặc email provider trong MVP. | Must |
| BRQ-INV-003 | Teacher phải tự tạo mật khẩu thông qua invitation link. | Admin không biết mật khẩu của Teacher. | Must |
| BRQ-INV-004 | Invitation phải có trạng thái và thời hạn. | Kiểm soát vòng đời lời mời và giảm rủi ro bảo mật. | Must |
| BRQ-INV-005 | Hệ thống phải gán role `TEACHER` sau khi Teacher kích hoạt thành công. | Đảm bảo Teacher có đúng quyền trong hệ thống. | Must |
| BRQ-INV-006 | Invitation phải ràng buộc với email Teacher được Admin nhập. | Giảm rủi ro link bị dùng bởi người không đúng đối tượng. | Must |

## Functional Requirements

| ID | Functional Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-INV-001 | Admin có thể nhập email Teacher để tạo invitation. | Must | System tạo invitation token, lưu status `PENDING` và trả về invitation link. |
| FR-INV-002 | System phải hiển thị invitation link để Admin copy. | Must | Admin nhìn thấy link và có hành động `Copy Link`. |
| FR-INV-003 | Admin có thể tự gửi invitation link qua kênh ngoài hệ thống. | Must | BA ghi nhận đây là manual process, không yêu cầu system gửi email tự động. |
| FR-INV-004 | System phải tạo invitation token duy nhất, bảo mật và có thời hạn. | Must | Token không trùng, không dễ đoán và có `expiresAt`. |
| FR-INV-005 | Teacher có thể mở invitation link để xem form kích hoạt tài khoản. | Must | Link hợp lệ hiển thị form gồm họ tên, email, mật khẩu mới và xác nhận mật khẩu. |
| FR-INV-006 | System phải kiểm tra email Teacher nhập khớp với email được mời. | Must | Nếu email không khớp, system từ chối kích hoạt account. |
| FR-INV-007 | Teacher có thể tự đặt mật khẩu khi kích hoạt account. | Must | Password được validate và hash trước khi lưu. |
| FR-INV-008 | System phải set `Role = TEACHER` và `Status = ACTIVE` sau khi kích hoạt thành công. | Must | Account Teacher active và có quyền Teacher. |
| FR-INV-009 | System phải chặn token hết hạn, token đã dùng hoặc token bị revoke. | Must | Link không hợp lệ không thể kích hoạt account. |
| FR-INV-010 | Admin có thể xem trạng thái invitation. | Should | Admin thấy `PENDING`, `ACCEPTED`, `EXPIRED` hoặc `REVOKED`. |
| FR-INV-011 | Admin có thể revoke invitation chưa được sử dụng. | Should | Invitation bị revoke không thể dùng để kích hoạt. |
| FR-INV-012 | System có thể ghi nhận thời điểm Admin copy link. | Could | Audit log hoặc invitation metadata có `copiedAt`/`copyCount` nếu triển khai. |

## Non-Functional Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-INV-001 | Invitation token không được lưu dạng raw token trong database. | Must |
| NFR-INV-002 | Invitation token không được expose trong log nhạy cảm. | Must |
| NFR-INV-003 | Password phải được hash bằng thuật toán an toàn trước khi lưu. | Must |
| NFR-INV-004 | Không gửi mật khẩu qua email, Zalo, Facebook, Messenger, Teams hoặc bất kỳ kênh nào. | Must |
| NFR-INV-005 | API xử lý invitation cần có rate limiting để tránh abuse. | Should |
| NFR-INV-006 | Invitation link phải hết hạn theo cấu hình hệ thống. | Must |

## Manual Sharing Policy

| Policy | Mô tả |
| --- | --- |
| Primary delivery | Admin copy link và gửi thủ công |
| Supported channels | Email cá nhân, Zalo, Facebook Messenger, Microsoft Teams, Slack hoặc kênh nội bộ |
| System email sending | Không bắt buộc trong MVP |
| Email provider dependency | Không phải dependency bắt buộc cho Teacher onboarding |
| Security control | One-time token, expiry, revoke, email matching và audit log |

## Acceptance Criteria Tổng Quát

| ID | Acceptance Criteria |
| --- | --- |
| AC-INV-001 | Admin tạo invitation thành công và nhận được invitation link để copy. |
| AC-INV-002 | Invitation có status `PENDING` sau khi được tạo. |
| AC-INV-003 | Admin có thể copy invitation link từ màn hình quản trị. |
| AC-INV-004 | Teacher mở link hợp lệ và thấy form kích hoạt tài khoản. |
| AC-INV-005 | Teacher nhập đúng email được mời thì có thể tiếp tục tạo mật khẩu. |
| AC-INV-006 | Teacher nhập email khác email được mời thì system từ chối kích hoạt. |
| AC-INV-007 | Sau khi Teacher accept thành công, account có `Role = TEACHER` và `Status = ACTIVE`. |
| AC-INV-008 | Token đã accept, expired hoặc revoked không thể dùng lại. |
