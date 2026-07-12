# Security Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu bảo mật cho **Microlearning Classroom LMS Platform**. Hệ thống có Student, Teacher, Admin, dữ liệu học tập, điểm số, feedback, submission và invitation token, nên security là nhóm NFR bắt buộc cho MVP.

## Security Scope

| Phạm vi | Nội dung |
| --- | --- |
| Authentication | Student registration, login, logout, refresh token, forgot/reset password, Teacher invitation accept. |
| Authorization | RBAC theo Student, Teacher, Admin, Super Admin và object-level access. |
| Token security | JWT/access token, refresh token, reset token, invitation token. |
| API security | HTTPS, CORS, headers, validation, rate limiting, error handling. |
| Data security | Password hash, token hash, sensitive field protection. |
| File/media security | Upload validation, file type, size, ownership, signed URL nếu có. |
| Audit security | Ghi nhận action quan trọng, không ghi secrets. |
| Frontend security | Route guard, không hard-code secret, xử lý token an toàn. |

## Authentication Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SEC-AUTH-001 | Password không được lưu dạng plain text. | Must | Database chỉ có password hash. |
| NFR-SEC-AUTH-002 | Password hashing phải dùng thuật toán an toàn như bcrypt hoặc argon2. | Must | Code review xác nhận không dùng hash yếu như MD5/SHA1 đơn thuần. |
| NFR-SEC-AUTH-003 | Login sai phải trả message chung, không tiết lộ email tồn tại hay không. | Must | Sai email và sai password có message tương đương. |
| NFR-SEC-AUTH-004 | Account status phải được kiểm tra khi login. | Must | `BLOCKED`, `INACTIVE`, `PENDING`, `DELETED` không login như `ACTIVE`. |
| NFR-SEC-AUTH-005 | Logout phải vô hiệu hóa refresh token/session hiện tại nếu backend quản lý token. | Must | Token cũ không refresh được sau logout. |
| NFR-SEC-AUTH-006 | Forgot password không được tiết lộ email có tồn tại hay không. | Should | Response success chung cho mọi email hợp lệ format. |
| NFR-SEC-AUTH-007 | Reset password token phải hết hạn và chỉ dùng một lần. | Must | Token đã dùng hoặc hết hạn bị từ chối. |

## Token Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SEC-TKN-001 | Access token phải có thời hạn ngắn hợp lý. | Must | Token expired không truy cập API protected. |
| NFR-SEC-TKN-002 | Refresh token phải có expiry dài hơn access token nhưng có thể revoke. | Must | Logout/revoke làm refresh thất bại. |
| NFR-SEC-TKN-003 | Refresh token không nên lưu raw token trong database. | Must | Database lưu hash/digest nếu cần lưu token. |
| NFR-SEC-TKN-004 | Teacher invitation token phải lưu dạng hash/digest, không lưu raw token. | Must | Database không có raw invitation token. |
| NFR-SEC-TKN-005 | Teacher invitation token phải có expiry, revoke và one-time accept. | Must | Accepted/revoked/expired token không accept lại. |
| NFR-SEC-TKN-006 | Teacher invitation accept phải kiểm tra email matching nếu flow yêu cầu Teacher nhập email. | Must | Email không khớp bị từ chối bằng `INVITATION_EMAIL_MISMATCH`. |
| NFR-SEC-TKN-007 | Token không được ghi vào application log, audit log hoặc error response. | Must | Log review không có token raw. |

## Authorization Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SEC-AZ-001 | Backend API phải enforce RBAC, không chỉ dựa vào frontend route guard. | Must | Gọi API bằng role sai trả 403/404 phù hợp. |
| NFR-SEC-AZ-002 | Student chỉ xem dữ liệu Classroom đã enroll. | Must | Student A không xem được grade/submission/progress của Student B. |
| NFR-SEC-AZ-003 | Teacher chỉ quản lý Classroom/Course mình sở hữu hoặc được phân quyền. | Must | Teacher A không edit course của Teacher B. |
| NFR-SEC-AZ-004 | Admin User Management phải kiểm tra permission khi xem Student/Teacher/Admin list. | Must | User không có Admin role không gọi được API admin. |
| NFR-SEC-AZ-005 | Super Admin action nhạy cảm phải có permission riêng nếu hệ thống hỗ trợ. | Should | Role change/system setting được guard. |
| NFR-SEC-AZ-006 | Object-level authorization áp dụng cho Lesson, Quiz, Assignment, Submission, Grade, Feedback. | Must | ID guessing không truy cập được resource không thuộc quyền. |

## API Security Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SEC-API-001 | Cloud/staging/production phải dùng HTTPS. | Must | Không có mixed content; token không gửi qua HTTP production. |
| NFR-SEC-API-002 | CORS chỉ cho phép origin hợp lệ theo environment. | Must | Origin lạ bị chặn ở staging/production. |
| NFR-SEC-API-003 | API phải validate request body, query params và path params. | Must | Invalid input trả 400/422 chuẩn. |
| NFR-SEC-API-004 | List endpoints phải giới hạn `limit` tối đa để tránh abuse. | Must | Request limit quá lớn bị clamp hoặc reject. |
| NFR-SEC-API-005 | API phải tránh NoSQL injection bằng validation/sanitization. | Must | Không truyền trực tiếp object operator nguy hiểm từ user input vào Mongo query. |
| NFR-SEC-API-006 | Production error response không trả stack trace. | Must | 500 response chỉ có error code/message an toàn. |
| NFR-SEC-API-007 | Registration, auth, invitation và join endpoints phải có rate limiting theo cấu hình môi trường. | Must | Burst request vượt ngưỡng trả 429/safe error; không tạo account hoặc Enrollment partial. |
| NFR-SEC-API-008 | Security headers nên được cấu hình ở backend hoặc reverse proxy. | Should | Có header cơ bản như HSTS ở HTTPS, X-Content-Type-Options, frame policy phù hợp. |

## File Upload And Media Security

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SEC-FILE-001 | File upload phải giới hạn file type theo policy Admin. | Must nếu upload in MVP | File không cho phép bị từ chối. |
| NFR-SEC-FILE-002 | File upload phải giới hạn max size. | Must nếu upload in MVP | File vượt size bị từ chối. |
| NFR-SEC-FILE-003 | User chỉ truy cập file/resource thuộc quyền. | Must | Student ngoài Classroom không mở được attachment. |
| NFR-SEC-FILE-004 | File name/path không được dùng trực tiếp để ghi file gây path traversal. | Must | File path được sanitize. |
| NFR-SEC-FILE-005 | Video/image trong Quiz Question là optional nhưng vẫn phải validate khi upload. | Must | Invalid media type bị từ chối. |

## Frontend Security Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SEC-FE-001 | React route guard phải redirect user không đúng role. | Must | Student không vào được `/teacher` hoặc `/admin` UI. |
| NFR-SEC-FE-002 | Frontend không hard-code secret, token, API key nhạy cảm. | Must | Code review không có secrets. |
| NFR-SEC-FE-003 | Frontend phải xử lý 401/403 rõ ràng. | Must | 401 refresh/logout; 403 hiển thị Forbidden. |
| NFR-SEC-FE-004 | Error UI không hiển thị raw stack trace hoặc response nhạy cảm. | Must | Production UI message an toàn. |
| NFR-SEC-FE-005 | Copy Teacher Invitation Link phải có feedback nhưng không log raw token ra console. | Must | Console/log không chứa raw token ngoài thao tác UI cần hiển thị link cho Admin. |

## Audit Security Requirements

Các action sau phải ghi AuditLog hoặc operation log phù hợp:

| Action | Actor | Audit required |
| --- | --- | --- |
| Create Teacher Invitation | Admin | Có |
| Copy Teacher Invitation Link | Admin | Should nếu tracking có bật |
| Revoke Teacher Invitation | Admin | Có |
| Accept Teacher Invitation | Teacher | Có |
| Change user role/status | Admin/Super Admin | Có |
| Create/update/archive Classroom | Teacher/Admin | Should |
| Publish/unpublish Course/Lesson/Quiz/Assignment | Teacher | Should |
| Reset Lesson Deadline | Teacher | Có |
| Grade/return submission | Teacher | Có |
| Export audit/report | Admin | Có |
| Update system settings | Admin/Super Admin | Có |

AuditLog không được ghi:

- Plain password.
- Raw token.
- Secret env variables.
- Full file content.
- Sensitive stack trace.

## Security Test Checklist

| Test | Expected |
| --- | --- |
| Student gọi API Teacher Course Dashboard | 403 hoặc 404 an toàn. |
| Teacher A sửa Lesson của Teacher B | Bị từ chối. |
| Admin thường đổi role Super Admin nếu không có quyền | Bị từ chối. |
| Invitation token expired | Không accept được. |
| Invitation token revoked | Không accept được. |
| Invitation token accepted rồi dùng lại | Không accept được. |
| Login sai nhiều lần | Bị rate limit nếu rate limiting bật. |
| Register hàng loạt cùng IP hoặc payload chèn role đặc quyền | Bị rate limit/validation; không tạo account đặc quyền hoặc dữ liệu partial. |
| API error 500 | Không trả stack trace. |
| Upload file sai type/size | Bị từ chối. |
| Student mở submission của Student khác | Bị từ chối. |

## Acceptance Criteria

- Password và token nhạy cảm không lưu raw/plain text.
- Protected API kiểm tra role và object ownership.
- Teacher invitation link an toàn dù Admin gửi thủ công qua kênh ngoài hệ thống.
- Critical action có audit trail.
- Production/staging không expose stack trace, secrets hoặc token trong response/log.
- Security test checklist đạt trước khi demo/release quan trọng.
