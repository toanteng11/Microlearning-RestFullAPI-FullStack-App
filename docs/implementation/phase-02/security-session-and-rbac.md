# Phase 02 Security, Session And RBAC

## 1. Security Objectives

- Không lưu hoặc log plain password/raw refresh token/raw invitation token.
- Session có thể rotate, revoke và phát hiện reuse.
- Account không `ACTIVE` hoặc session family không còn active bị chặn tại mọi protected API, kể cả access JWT chưa hết hạn.
- Role sai, permission thiếu hoặc target ngoài scope không nhận dữ liệu private.
- Auth/invitation endpoints chịu được burst cơ bản và không làm lộ account tồn tại.
- Web không lưu bearer token trong browser persistent storage.

## 2. Threat-Control Matrix

| Threat | Control bắt buộc | Verification |
| --- | --- | --- |
| Credential stuffing/brute force | IP limiter, identity cooldown, generic error, failed-login log | Burst + 5/15/15 boundary test |
| Password database leak | Argon2id, per-hash salt, no password response/log | DB/log inspection |
| XSS lấy token tồn tại lâu | Access JWT chỉ memory, refresh `HttpOnly` | Browser storage scan |
| Refresh token theft/replay | Hash at rest, rotation, family reuse revoke | Rotation/replay integration test |
| CSRF refresh/logout | SameSite Lax, same-site deployment, Origin/Referer allowlist, POST only | Cross-origin negative test |
| Privilege injection | Zod strict/allowlist, role từ server, permission middleware | Register body tampering test |
| Inactive account dùng token cũ | Load current User on each protected request; revoke sessions on status change | Block-during-session test |
| Invitation token leak | Hash only, one-time, log/URL redaction, short expiry | DB/log/error review |
| User enumeration | Generic login/forgot response, comparable hash path | Response/message test |
| NoSQL/query injection | Primitive-only schema, sort/filter allowlist, escaped search | Malicious query test |
| Admin self-escalation | Target/actor constraints, Super Admin guard, audit | Negative role/status matrix |

## 3. Access JWT Contract

| Claim | Rule |
| --- | --- |
| `sub` | User ObjectId string |
| `jti` | Random unique token ID |
| `familyId` | Session family identifier |
| `iss` | Configured issuer, ví dụ `microlearning-api` |
| `aud` | Configured web/API audience |
| `iat`/`exp` | Library generated; TTL default 15 minutes |

Không dùng claim role/status làm nguồn quyết định cuối. Middleware load User hiện tại, yêu cầu `ACTIVE`, kiểm tra family còn một refresh session `ACTIVE`, rồi resolve permission từ server catalog. Vì vậy logout/reuse revoke có hiệu lực với bearer request tiếp theo, không đợi access JWT hết hạn.

JWT signing key là secret tối thiểu 256-bit, chỉ ở API environment/secret store. Không build vào React. Key rotation cần `kid`/multi-key plan ở Phase 07; P02 ít nhất hỗ trợ config fail-fast và không dùng default key.

## 4. Refresh Cookie

| Attribute | Local HTTP | Staging/Cloud |
| --- | --- | --- |
| Name | `ml_refresh` | `__Secure-ml_refresh` hoặc tên được phê duyệt |
| HttpOnly | `true` | `true` |
| Secure | `false` chỉ localhost | `true` |
| SameSite | `Lax` | `Lax` |
| Path | `/api/v1/auth` | `/api/v1/auth` |
| Max-Age | 7 ngày mặc định | 7 ngày mặc định |
| Domain | Không set | Không set trừ khi architecture yêu cầu |

Cookie luôn clear với cùng name/path/domain/sameSite để trình duyệt xóa đúng. Response login/refresh đặt `Cache-Control: no-store`.

Origin policy: nếu có `Origin`, phải exact-match một entry trong `ALLOWED_ORIGINS`; nếu thiếu thì dùng origin của `Referer` làm fallback. Staging/Production từ chối khi cả hai header đều thiếu hoặc malformed. Test environment chỉ được bypass qua explicit injected test policy, không có Production default bỏ kiểm tra.

## 5. Session State Machine

```text
ACTIVE --refresh winner--> ROTATED + replacement ACTIVE
ROTATED --repeat within grace--> REFRESH_RACE_RETRY; family remains ACTIVE
ROTATED --replay outside grace--> family REVOKED
ACTIVE --logout/status/reset/admin revoke--> family REVOKED
ACTIVE/ROTATED --expiresAt passed--> EXPIRED (derived/cleanup)
```

Refresh algorithm:

1. Kiểm Origin/Referer và lấy cookie.
2. Hash token, tìm session; response lỗi chung nếu không có.
3. Nếu session `ROTATED` và `now-rotatedAt <= REFRESH_REUSE_GRACE_SECONDS`, trả `REFRESH_RACE_RETRY`; không clear cookie hoặc revoke family.
4. Nếu session `ROTATED` ngoài grace, revoke toàn family và trả `REFRESH_TOKEN_REUSE_DETECTED` an toàn.
5. Nếu `REVOKED`/expired, từ chối và clear cookie.
6. Load User, yêu cầu `ACTIVE`.
7. Trong atomic update/transaction, mark old `ROTATED`, tạo token/session mới.
8. Set cookie mới, trả access JWT và safe User summary.

Concurrent refresh từ cùng token: đúng một request thắng compare-and-swap; request còn lại trong grace nhận lỗi retry an toàn. Replay ngoài grace mới kích hoạt malicious reuse policy.

## 6. Frontend Refresh Coordinator

- Trong một tab, Auth bootstrap chỉ gọi một refresh request khi app mount.
- API client khi gặp 401 được phép xếp tối đa một refresh Promise; request khác chờ cùng Promise.
- Giữa nhiều tab cùng origin, ưu tiên `navigator.locks` với key `microlearning-auth-refresh`; `BroadcastChannel` thông báo refresh success/fail và có thể chuyển access token ephemeral, không ghi persistent storage.
- Fallback khi không có Web Locks/BroadcastChannel: request thua nhận `REFRESH_RACE_RETRY`, chờ jitter 100-300 ms rồi retry refresh đúng một lần bằng cookie mới.
- Chỉ retry request gốc một lần sau refresh; không loop vô hạn.
- Refresh fail: clear in-memory auth, invalidate private query cache, redirect Login với return path nội bộ.
- Logout: gọi API, sau đó luôn clear memory/cache và redirect Login.

## 7. Password And Credential Rules

| Rule | Expected error |
| --- | --- |
| Length < 12 hoặc > 128 | `PASSWORD_POLICY_FAILED` |
| Leading/trailing whitespace | `PASSWORD_POLICY_FAILED` |
| Confirm không khớp | `VALIDATION_ERROR` tại `confirmPassword` |
| Password field bị trim bởi UI/API | Test phải fail; không được trim |
| Password/hash xuất hiện trong projection | Security test phải fail |

Email được trim/lowercase/normalize; password thì không. Login dùng cùng email normalization như registration/invitation.

## 8. Rate Limit And Cooldown Defaults

| Scope | Default | Key | Store P02 |
| --- | --- | --- | --- |
| Register | 10 requests/15 phút | IP | Process memory |
| Login endpoint | 30 requests/15 phút | IP | Process memory |
| Login failure | 5 failures/15 phút, cooldown 15 phút | HMAC(normalized email) | MongoDB |
| Refresh | 60 requests/15 phút | IP | Process memory |
| Invitation public preview/accept | 20 requests/15 phút | IP | Process memory |
| Admin create invitation | 20 requests/giờ | actorId | Process memory hoặc service counter |

Tất cả threshold cấu hình bằng env với min/max validation. P02 single instance chấp nhận memory IP limiter; nhiều replica bắt buộc shared store ở P07.

## 9. Permission Catalog P02

| Permission | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- |
| `profile.view_own` | Yes | Yes | Yes | Yes |
| `profile.update_own` | Yes | Yes | Yes | Yes |
| `user.view_students` | No | No | Yes | Yes |
| `user.view_teachers` | No | No | Yes | Yes |
| `user.view_admins` | No | No | Yes, safe projection only | Yes |
| `user.search` | No | No | Chỉ khi Should endpoint được bật | Chỉ khi Should endpoint được bật |
| `user.update_status` | No | No | Student/Teacher targets | All non-prohibited |
| `role.assign_limited` | No | No | No by default | Yes |
| `teacher_invitation.create` | No | No | Yes | Yes |
| `teacher_invitation.view` | No | No | Yes | Yes |
| `teacher_invitation.copy_link` | No | No | Yes | Yes |
| `teacher_invitation.revoke` | No | No | Yes | Yes |

`ADMIN` permission set phải được chốt một lần trong source/test. UI action visibility được derive từ `capabilities` do `/users/me` trả, nhưng API vẫn kiểm lại.

Target permission rule: Student detail dùng `user.view_students`, Teacher detail dùng `user.view_teachers`, Admin/Super Admin detail dùng `user.view_admins`. Chỉ Super Admin có `role.assign_limited`; Admin không được mutate Admin/Super Admin.

## 10. Status And Role Guard

| Actor/Target | Action | Kết quả |
| --- | --- | --- |
| Admin -> Student/Teacher | Block/Unblock/Deactivate/Restore | Cho phép nếu transition hợp lệ và có reason |
| Admin -> Admin/Super Admin | Status/role change | Từ chối mặc định |
| Super Admin -> Admin | Status/role change | Cho phép theo transition, audit bắt buộc |
| Actor -> chính mình | Promote/Block/Delete | Từ chối nếu tạo lockout/escalation; profile update riêng |
| Any -> final active Super Admin | Block/Deactivate/Demote/Delete | Từ chối |
| Public register -> role/status field | Create privileged identity | Từ chối/strip theo strict contract; không tạo partial |

## 11. Log And Response Redaction

- Pino redact headers `authorization`, `cookie`, `set-cookie` và body fields password/token.
- User-facing invitation query được React xóa ngay sau capture; API preview/accept nhận token trong strict POST body và logger redact body field `token`.
- Web đọc token invitation rồi loại token khỏi address bar trước API call; response dùng `Referrer-Policy: no-referrer` để giảm rò rỉ qua Referer.
- Audit chỉ ghi invitation ID/email normalized theo privacy policy, không raw link/hash.
- 500 response không có stack/DB URI; server log có requestId và stack an toàn.
- Swagger examples dùng synthetic placeholder, không dùng credential thật.

## 12. Security Exit Evidence

- DB snapshot/query chứng minh password/token hash-only.
- Browser DevTools evidence cookie attributes và storage không có token.
- API test report rotation/reuse/logout/block.
- Negative role/status/permission report.
- Rate/cooldown boundary report.
- Redacted request/application/AuditLog sample.
- Secret/dependency scan CI pass.
