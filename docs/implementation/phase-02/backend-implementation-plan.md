# Phase 02 Backend Implementation Plan

## 1. Mục tiêu

Triển khai API Identity/User Administration theo module boundary, bảo mật mặc định và có test ở từng lớp. Backend là nguồn quyết định cuối cho role, status, permission, expiry và state transition.

## 2. Dependency Dự Kiến

| Package | Mục đích | Ghi chú review |
| --- | --- | --- |
| `argon2` | Hash/verify password Argon2id | Native build phải pass Docker/CI |
| `jose` | Sign/verify JWT chuẩn | Pin compatible version, validate issuer/audience |
| `cookie-parser` | Parse refresh cookie | Không log cookie |
| `express-rate-limit` | IP endpoint limiter | Single-instance P02 only |
| `zod` | Đã có, request/env validation | Strict schemas |

Không thêm package refresh-token JWT vì refresh là opaque random token dùng Node `crypto`.

## 3. Implementation Order

### Step 1 - Configuration

Bổ sung config typed/fail-fast:

- `PUBLIC_WEB_URL`.
- `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_ISSUER`, `ACCESS_TOKEN_AUDIENCE`, `ACCESS_TOKEN_TTL_SECONDS`.
- `REFRESH_TOKEN_TTL_SECONDS`, `REFRESH_COOKIE_NAME`, `REFRESH_COOKIE_SECURE`.
- `REFRESH_REUSE_GRACE_SECONDS` default 5, range 0-10.
- `AUTH_IDENTITY_PEPPER`.
- `TEACHER_INVITATION_TTL_DAYS`, min/max expiry.
- Rate-limit thresholds/window/cooldown.
- `BOOTSTRAP_ADMIN_ENABLED` cho CLI, không cho API startup tự seed.

Config test phải cover missing, unsafe default, invalid range và Production cookie security.

### Step 2 - Shared Security Primitives

- Email normalization function dùng chung Register/Login/Invitation.
- Password policy validator và Argon2id adapter.
- Opaque token generator 32 random bytes, base64url; SHA-256 hash function.
- Access JWT signer/verifier với clock injection cho test.
- Cookie builder/clearer theo environment.
- Origin/Referer validator cho refresh/logout.
- Typed permission catalog, `authenticate`, `requireActiveAccount`, `requireActiveSessionFamily`, `authorize`.
- Logger redaction cho authorization/cookie/password/token và invitation POST body; access log không chứa token path/query.

Mỗi utility có boundary unit tests, không dựa vào real clock/random trong assertion.

### Step 3 - Persistence Foundation

- User, AuthSession, AuthLoginState, TeacherInvitation, AuditLog và SystemGuard Mongoose schemas.
- Explicit indexes theo `data-model-and-indexes.md`.
- Repository interfaces + implementations; safe projections.
- Unit of Work chạy `withTransaction` trên replica set.
- Index verification test và duplicate-key mapping.

### Step 4 - Registration

1. Parse strict body.
2. Normalize email/full name; validate password/confirm.
3. Apply IP limiter.
4. Insert `STUDENT`, `ACTIVE`, `SELF_REGISTRATION`; không nhận field role/status.
5. Map duplicate email an toàn.
6. Return `201`, `nextAction=LOGIN`; không set cookie/session.

### Step 5 - Login, Me And Profile

1. Check IP limiter và identity cooldown.
2. Load credential projection; dùng dummy hash nếu user không tồn tại.
3. Verify password, sau đó status `ACTIVE`.
4. Success reset cooldown, update `lastLoginAt`, create session family.
5. Set refresh cookie và trả short access JWT + safe user/capabilities.
6. `GET /users/me` load current User; `PATCH` allowlist only safe profile fields.

### Step 6 - Refresh And Logout

- Refresh uses conditional session rotation; race trong grace trả retry-safe conflict.
- Replay ngoài grace revokes whole family and emits security log.
- Refresh returns current user/capabilities so React restore không cần trust cache.
- Logout revokes current family, clears cookie, returns `204` idempotently.
- Protected middleware checks current User và active session family every request.

### Step 7 - Admin User Management

- Shared list query parser nhưng mỗi route hard-code allowed role set.
- Search keyword escape và prefix behavior; no raw Mongo operator.
- DTO riêng Student/Teacher/Admin.
- Detail service kiểm actor permission theo target role.
- Status transition service: validate, optimistic concurrency, revoke sessions, audit.
- Role transition service: Super Admin only baseline; fixed governance guard serialize final active Super Admin invariant.

### Step 8 - Teacher Invitations

- Create transaction validates actor/email/expiry, expires stale record, checks active Teacher conflict và dùng unique partial pending-email index chống concurrent create.
- Raw token generated after validation; only hash persisted.
- List/detail never selects tokenHash.
- Revoke conditional PENDING + unexpired/state policy, reason/audit.
- Preview/accept nhận token trong strict POST body; preview resolves effective expiry safely.
- Accept transaction creates User, consumes invitation and appends audit.
- Copy event là idempotent Must sau clipboard success, dùng unique safe `eventId`, update safe copy metadata + AuditLog và không thể reconstruct raw link.

### Step 9 - OpenAPI And Composition

- Add routers under `/api/v1` through composition root.
- Define reusable schemas/error/security schemes.
- Add operation examples and parser validation.
- Add route-document coverage check.

### Step 10 - Hardening

- Content/security headers and cache-control for auth responses.
- Constant/generic login response behavior review.
- Request body/URL redaction test.
- Concurrency tests for register/refresh/invite create/invite accept/final Super Admin/status.
- Dependency and container non-root checks retained.

## 4. Service Contracts

| Service | Inputs | Outputs/side effects |
| --- | --- | --- |
| `RegistrationService.registerStudent` | validated registration + request context | safe User; no session |
| `AuthService.login` | email/password/context | access token, raw refresh once, User DTO |
| `AuthService.refresh` | raw refresh/context | rotated tokens + current User DTO |
| `AuthService.logout` | raw refresh/context | family revoked/idempotent |
| `CurrentUserService.get/update` | actor + allowlisted profile | own DTO |
| `AdminUserService.listByRole` | actor, fixed role, query | paginated projection |
| `AdminUserService.changeStatus` | actor, target, transition, reason | updated DTO + revoke/audit |
| `AdminUserService.changeRole` | Super Admin, target, role, reason | updated DTO + audit |
| `TeacherInvitationService.create` | Admin, email, expiry | safe invitation + raw URL once |
| `TeacherInvitationService.accept` | token + identity/password | Teacher DTO, invitation accepted |

## 5. Error And Transaction Rules

- Domain service throw typed error; controller không inspect Mongo error tùy tiện.
- Duplicate key, validation, stale update và transaction conflict được map thống nhất.
- Không bắt exception rồi trả success.
- Raw token/password variables không đưa vào error metadata.
- Transaction retry chỉ với Mongo transient labels và số lần giới hạn.

## 6. Backend Test Allocation

| Layer | Test focus |
| --- | --- |
| Unit | normalize/password/token/cookie/permission/state transition/query parser |
| Service | use case với repositories/clock/random injected |
| Repository integration | indexes, projection, atomic update, pagination |
| API integration | status/body/cookie/auth/error/requestId |
| Security integration | rotation/reuse/rate/cross-role/redaction |
| Transaction integration | invitation accept và status revoke/audit |

## 7. Backend Definition Of Done

- Không controller truy cập Mongoose trực tiếp.
- Tất cả mutation body có strict Zod schema.
- Tất cả protected routes có auth + permission declaration rõ.
- Tất cả list có projection/pagination/max limit/sort allowlist.
- Password/token fields không xuất hiện trong response/snapshot/log.
- OpenAPI và tests cập nhật cùng code.
- API quality/coverage/build/Compose/CI pass.
