# Security Architecture

## Mục Đích

Tài liệu này mô tả các trust boundary, cơ chế bảo vệ và trách nhiệm bảo mật ở cấp kiến trúc. Nó cụ thể hóa NFR Security nhưng không thay thế threat modeling, penetration testing hoặc security review trước Production.

## Tài Sản Cần Bảo Vệ

| Tài sản | Rủi ro chính | Kiểm soát kiến trúc |
| --- | --- | --- |
| Account/password/token | Account takeover, token leak | Password hash, token expiry/rotation/revoke, HTTPS, rate limit, no raw token logging. |
| Student data/score/submission | Unauthorized access/change, privacy breach | RBAC + object-level authorization + DTO projection + audit. |
| Teacher invitation | Link interception/reuse, wrong recipient | Random token, hash at rest, expiry, one-time/revoke, email matching, audit. |
| Classroom join token/code | Unauthorized enrollment, brute force | Expiry/status/policy, duplicate check, rate limit, audit, regenerate/revoke. |
| File/media | Malicious upload, public data leak | Type/size/ownership validation, private storage, controlled URL, malware scan direction. |
| Infrastructure secret | Database/storage/runtime compromise | Secret manager/environment injection, least privilege, no secret in source/image/log. |
| Audit record | Cover-up/no traceability | Append-only policy, restricted access, retention/backup. |

## Trust Boundary

```text
Untrusted Internet Browser
       | HTTPS
       v
Frontend CDN/Reverse Proxy boundary
       | authenticated HTTPS API request
       v
Application boundary: AuthN -> AuthZ -> Validation -> Business Service
       | private credentials/TLS
       +---------------------> MongoDB boundary
       +---------------------> Object Storage boundary
       +---------------------> Monitoring/Log boundary

CI/CD identity is a separate trusted automation boundary with least deployment permission.
```

## Identity, Authentication Và Session

| Thành phần | Quy tắc bắt buộc |
| --- | --- |
| Password | Hash bằng thuật toán an toàn đã chốt; không log, không trả API, không email/copy cho Admin. |
| Login | Validate account status `ACTIVE`; generic error hợp lý để tránh lộ quá mức; rate limit theo NFR. |
| Access token | Short-lived, signed, verified ở middleware; chứa claim tối thiểu như user id/role/session context nếu cần. |
| Refresh token | Có expiry, storage/revocation/rotation policy; không lưu raw token trong MongoDB. |
| Logout/password reset/status change | Revoke/invalidates session phù hợp; test token cũ không tiếp tục có quyền. |
| Teacher invitation | Invitation token khác auth token; one-time, expiry, revoke, email matching; API chỉ trả raw URL tại thời điểm Admin tạo để copy thủ công. |
| Frontend token handling | Chốt qua ADR theo threat model; tuyệt đối không nhúng long-lived secret vào frontend build. |

## Authorization Model

```text
Request protected
  -> Is authenticated?
  -> Is account ACTIVE and token valid?
  -> Does role have required permission?
  -> Is resource within caller's ownership/membership scope?
  -> Does business state allow this action?
  -> Execute and audit if sensitive
```

| Role | Authorization boundary ví dụ |
| --- | --- |
| Student | Chỉ profile, enrollment, content, progress, submission, grade/feedback của chính mình trong Classroom đã tham gia. |
| Teacher | Chỉ Classroom/Course do mình sở hữu hoặc được cấp quyền; roster, progress, grade của member thuộc phạm vi đó. |
| Admin | Quản trị User/Teacher invitation/policy/report/audit theo permission; không mặc định xem/sửa mọi learning content nếu permission matrix không cấp. |
| Super Admin/DevOps (nếu có) | System health/configuration/deployment operation theo least privilege; action nhạy cảm có audit/reason. |

`role === 'TEACHER'` không đủ để cho phép mutation. API phải kiểm tra `ownerTeacherId`, Classroom membership/assignment hoặc permission cụ thể. ID hợp lệ về format không đồng nghĩa user được phép đọc/sửa resource đó.

## API Và Input Security

| Kiểm soát | Cách áp dụng |
| --- | --- |
| Transport | HTTPS bắt buộc ở Staging/Production; redirect/deny HTTP theo platform. |
| CORS | Allow exact trusted frontend origins; không dùng wildcard với credential flow. |
| Validation | Validate `params`, `query`, `body`, enum, size, date, pagination; reject unknown/dangerous operator theo policy. |
| Injection prevention | Không chuyển object client vào MongoDB filter/update trực tiếp; allowlist field và operator. |
| Rate limiting | Login, password reset, invitation validation/acceptance, Classroom join, upload theo policy. |
| Error handling | Chuẩn API error code; Production không lộ stack trace, query, credential, provider detail. |
| CSRF | Bắt buộc đánh giá nếu chọn cookie-based auth; token/header strategy phải đi kèm cơ chế phù hợp. |
| Idempotency | Cân nhắc key/duplicate guard cho create enrollment, submit, grade/deadline mutation nếu retry từ client/network có thể lặp. |

## File/Media Security

- API xác thực user và ownership của Course/Question/Submission trước khi tạo upload quyền.
- Chỉ cho phép file type/MIME, extension và size nằm trong policy; không tin riêng client-provided MIME.
- Object storage private mặc định; download/view URL có thời hạn hoặc được proxy sau authorization.
- Không render HTML/script upload như nội dung tin cậy. `altText`/caption/text phải được escape/sanitize ở UI.
- Metadata phải có uploader, resource owner, purpose, created time, object key; file orphan xử lý theo lifecycle.
- Virus scan/quarantine là requirement tăng cường khi dự án chấp nhận file từ user thật hoặc public internet.

## Secret, Platform Và Pipeline Security

| Khu vực | Yêu cầu |
| --- | --- |
| Source repository | Không commit `.env`, secret, private key, database URI, raw sample token. Dùng secret scanning. |
| Docker image | Không bake secret vào layer; image chạy non-root nếu khả thi; pin base image/version và scan dependency/image. |
| CI/CD | Token deployment least privilege; protected branch/environment; log không in secret. |
| Cloud runtime | Runtime identity theo role/service account thay vì credential tĩnh khi provider hỗ trợ; restrict network/database access. |
| Database | TLS, least database user privilege, private/network allowlist theo platform; backup access restricted. |
| Admin operation | Status/role/policy/invitation/deadline/grade action quan trọng có AuditLog với actor/time/resource/reason khi rule yêu cầu. |

## Logging Và Audit Privacy

Không log: password, authorization header, access/refresh token, raw invitation/reset token, full MongoDB URI, storage credential, file content, dữ liệu cá nhân không cần thiết.

| Event | Audit tối thiểu |
| --- | --- |
| Teacher invitation create/copy/revoke/accept | actor, target email or protected reference, invitation id, status, time |
| User role/status change | actor, target, old/new value, reason nếu có, time |
| Classroom enrollment governance | actor/student/classroom, join method, result, time |
| Deadline reset | Teacher, Lesson, old/new deadline, reason, time |
| Grade/feedback mutation | Teacher, student, assessment, old/new score/status nếu phù hợp, time |
| Privileged system action | actor, action, resource, requestId, result, reason nếu required |

## Security Verification

Trước Staging/UAT, QA và Backend phải kiểm tra tối thiểu:

- Student/Teacher/Admin gọi thử API ngoài phạm vi object ownership đều nhận `403`/error chuẩn, không trả data.
- Token expired/revoked, invitation expired/revoked/used/email mismatch, duplicate enrollment và brute-force limit hoạt động theo policy.
- API/log/Swagger example không lộ hash, raw token, secret, stack trace hay PII không cần thiết.
- Upload invalid type/oversize/wrong ownership bị chặn; object private không thể truy cập công khai không kiểm soát.
- Dependency, container/image và configuration được review theo quality gate.

## Liên Kết

- Chi tiết NFR: `../13-non-functional-requirements/security-requirements.md`.
- Role/permission: `../05-user-roles/`.
- API authorization: `../11-api-requirements/api-authorization-matrix.md`.
- Token/invitation data: `../10-data-requirements/invitation-token-data-model.md`.
