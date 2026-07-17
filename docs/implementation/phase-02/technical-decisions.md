# Phase 02 Technical Decisions

## 1. Trạng thái và quy tắc

Các quyết định dưới đây là implementation baseline đã chốt cho Phase 02 ngày `2026-07-15`. Project Owner đã yêu cầu hoàn thiện hồ sơ để bắt đầu development; từng Pull Request vẫn bắt buộc qua technical/security review và test gate tương ứng. Thay đổi quyết định phải ghi superseding ADR và đánh giá lại API, data, test cùng threat model.

## 2. Decision Catalog

| ID | Quyết định | Trạng thái |
| --- | --- | --- |
| P02-ADR-001 | Access JWT trong memory, opaque refresh cookie | Accepted baseline |
| P02-ADR-002 | Refresh rotation, race grace và session-family reuse revoke | Accepted baseline |
| P02-ADR-003 | Argon2id và password 12-128 ký tự | Accepted baseline |
| P02-ADR-004 | Static RBAC permission catalog, single primary role | Accepted baseline |
| P02-ADR-005 | MongoDB collections + transaction trên replica set | Accepted baseline |
| P02-ADR-006 | Raw invitation link chỉ trả một lần | Accepted baseline |
| P02-ADR-007 | Identity cooldown persisted, IP limiter local | Accepted baseline |
| P02-ADR-008 | Bootstrap Super Admin qua secure CLI | Accepted baseline |
| P02-ADR-009 | Zod validation tại HTTP boundary | Accepted baseline |
| P02-ADR-010 | Repository/service/controller module boundary | Accepted baseline |
| P02-ADR-011 | TanStack Query + React Hook Form, không thêm global store | Accepted baseline |
| P02-ADR-012 | API contract và OpenAPI cập nhật cùng PR | Accepted baseline |
| P02-ADR-013 | Forgot/reset password là conditional Should | Accepted baseline |
| P02-ADR-014 | AuditLog append-only, safe metadata | Accepted baseline |
| P02-ADR-015 | UTC persistence, localized display | Accepted baseline |

## 3. P02-ADR-001 - Browser Token Storage

- Access token là JWT TTL mặc định 15 phút, trả trong response login/refresh và chỉ giữ trong React memory.
- Không ghi access token vào `localStorage`, `sessionStorage`, IndexedDB, URL hoặc log.
- Refresh token là opaque random 256-bit, set trong cookie `HttpOnly`, `SameSite=Lax`, `Path=/api/v1/auth`.
- Cookie dùng `Secure=true` ở Staging/Cloud; localhost HTTP được phép `Secure=false` bằng environment guard.
- Business API dùng `Authorization: Bearer <accessToken>`; refresh/logout dùng cookie và kiểm `Origin`/`Referer` theo allowlist.
- MVP giả định Web và API cùng site. Cross-site cookie cần Change Control và security review riêng.

Lý do: giảm rủi ro token tồn tại lâu khi XSS, vẫn cho phép session restore bằng refresh cookie và revoke phía server.

## 4. P02-ADR-002 - Session Rotation

- Mỗi login tạo `familyId`, một session record `ACTIVE` và refresh token hash.
- Mỗi refresh dùng compare-and-swap: token hiện tại phải `ACTIVE`, sau đó record cũ thành `ROTATED` và record mới được tạo.
- Token `ROTATED` được gửi lại trong grace mặc định 5 giây trả `REFRESH_RACE_RETRY` và không revoke; replay ngoài grace mới revoke toàn family.
- Logout revoke family hiện tại và clear cookie dù backend response lỗi an toàn.
- Password reset, account `BLOCKED/INACTIVE/DELETED` và security action tương ứng revoke toàn bộ active family của User.
- Access JWT chứa tối thiểu `sub`, `jti`, `familyId`, `iss`, `aud`, `iat`, `exp`; authorization đọc User hiện tại và active session family từ DB, không tin role/status cũ trong token.

## 5. P02-ADR-003 - Password

- Thuật toán: Argon2id với tham số cấu hình được và baseline tối thiểu được đo trên CI/runtime trước merge.
- Độ dài: 12-128 Unicode code points sau khi kiểm chính xác input; không trim password.
- Reject nếu có whitespace đầu hoặc cuối; whitespace bên trong được phép.
- Không bắt buộc đổi định kỳ trong MVP.
- Không log, audit, trả lại hoặc đưa password vào test snapshot.
- Login sai trả thông báo chung; so sánh hash giả cho email không tồn tại để giảm timing enumeration rõ rệt.

Tham số Argon2id ban đầu: memory `19456 KiB`, iterations `2`, parallelism `1`, hash length `32`; phải benchmark và có thể tăng bằng ADR, không giảm âm thầm.

## 6. P02-ADR-004 - Role And Permission

- `User.role` là một primary role: `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN`.
- Permission catalog là constant typed trong source, mapping role -> permission. Chưa tạo UI custom role/permission.
- Mọi protected API kiểm: valid token -> User `ACTIVE` -> permission -> object scope -> business state.
- `ADMIN` xem safe Admin List và quản lý Student/Teacher theo permission; thao tác role/status trên Admin/Super Admin chỉ `SUPER_ADMIN`.
- Không cho tự nâng quyền, không cho public registration gửi role/status, không cho xóa/demote active Super Admin cuối cùng.
- Direct promotion sang `TEACHER` không thay thế Teacher Invitation trong workflow thường.

## 7. P02-ADR-005 - Transaction And Replica Set

- Invitation acceptance thay đổi `users`, `teacher_invitations` và `audit_logs`; phải chạy trong MongoDB transaction.
- Docker Local và CI chạy MongoDB single-node replica set.
- Service nhận transaction/session qua Unit of Work; controller/repository không tự mở transaction rời rạc.
- Unique index vẫn là lớp bảo vệ cuối cho concurrent duplicate email/token.
- Nếu transaction fail, không có Teacher active hoặc invitation accepted một nửa.

## 8. P02-ADR-006 - Invitation Link Recoverability

- Database chỉ lưu SHA-256 token hash; không lưu raw token hoặc reversible ciphertext.
- Create response trả raw invitation link đúng một lần cho Admin có quyền.
- UI giữ raw link trong component state đủ để Admin bấm `Copy Link`; reload/đóng trang sẽ mất raw link.
- User-facing link dùng query để phân phối, nhưng React xóa query sau capture và API preview/accept nhận token trong strict POST body.
- `copy-events` chỉ ghi nhận hành động copy trong phiên đang có link, không tái tạo token.
- Nếu mất link, Admin revoke invitation và tạo invitation mới. Capability “copy lại link cũ” được xem là Should chưa triển khai.

Quyết định này ưu tiên NFR token-at-rest hơn tiện ích copy lại. Wording baseline: `Hãy copy link ngay; hệ thống không lưu link để hiển thị lại. Nếu mất link, hãy revoke và tạo lời mời mới.`

## 9. P02-ADR-007 - Abuse Control

- Login identity cooldown lưu trong MongoDB bằng key HMAC của normalized email; áp dụng cả email tồn tại và không tồn tại.
- 5 lần thất bại trong 15 phút tạo cooldown 15 phút.
- IP rate limiter cho register/login/refresh/invitation dùng process store trong single-instance Local/MVP; threshold lấy từ env.
- Response dùng `429 RATE_LIMITED` hoặc generic auth failure theo endpoint, không tiết lộ identity.
- Phase 07 phải thay process store bằng shared store trước khi scale nhiều API replica.

## 10. P02-ADR-008 - Initial Administrator

- Không có public endpoint tạo Admin/Super Admin.
- Môi trường mới dùng CLI `bootstrap:admin`; email nhận qua argument được validate, password nhập qua hidden prompt/stdin, không nhận password qua command argument.
- CLI chỉ tạo Super Admin khi chưa có; rerun phải idempotent/fail safe và không đổi password ngầm.
- Production bootstrap cần flag rõ, operator authorization và audit/operation record; credential tạm không commit hoặc log.
- Test fixture có synthetic Admin riêng và không dùng Production bootstrap path.

## 11. P02-ADR-009/010 - Validation And Module Boundary

- Zod parse body/query/path tại route/controller boundary; output type chuyển vào service.
- Controller chỉ map HTTP; service chứa use case/business state; repository chứa Mongoose query; model chứa persistence schema/index.
- Module không import model của module khác trực tiếp; dùng service/port.
- Error domain được map sang `AppError` và standard envelope có requestId.

## 12. P02-ADR-011 - Frontend State

- TanStack Query quản lý server state, cache và invalidation.
- React Hook Form + Zod quản lý form/validation; schema frontend phải phù hợp contract nhưng backend vẫn authoritative.
- `AuthProvider` giữ access token/current user trong memory và thực hiện bootstrap refresh một lần.
- Không thêm Redux/Zustand trong P02 vì chưa có client state đủ phức tạp.
- Route/query filter được giữ trên URL cho Admin lists; không lưu auth token vào URL.

## 13. P02-ADR-012 - Contract First

- Endpoint mới phải có OpenAPI operation, security, request, response, error và examples trong cùng PR.
- OpenAPI validation và representative schema tests là CI gate.
- Frontend type/interface không được tự suy đoán field bí mật hoặc field chưa có trong contract.

## 14. P02-ADR-013 - Password Reset Boundary

Forgot/Reset Password là `Should`, nhưng hệ thống hiện không có delivery provider được phê duyệt. P02 chỉ triển khai nếu BA/PO chốt kênh delivery an toàn; public endpoint không được trả reset token hoặc link. Nếu chưa chốt, giữ trong backlog và không claim hoàn thành FR-003.

## 15. P02-ADR-014/015 - Audit And Time

- AuditLog append-only, không có endpoint update/delete.
- Metadata chỉ chứa ID, old/new enum safe, reason, requestId; không chứa password, bearer token, cookie, raw invitation link hoặc full request body.
- Mọi timestamp lưu UTC ISO/BSON Date; frontend hiển thị theo timezone người dùng/hệ thống và không dùng client time để quyết định expiry.
