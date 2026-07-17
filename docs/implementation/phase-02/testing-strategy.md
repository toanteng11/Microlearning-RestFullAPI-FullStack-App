# Phase 02 Testing Strategy

## 1. Mục tiêu

Chứng minh authentication, authorization, invitation và account governance đúng cả happy path, error path, security path, concurrency và browser behavior. Không chỉ kiểm UI ẩn button; test phải gọi API trực tiếp bằng role/token sai.

## 2. Test Levels

| Level | Công cụ/hướng | Phạm vi |
| --- | --- | --- |
| Unit | Vitest | crypto adapters với dependency injection, policy, transition, query parser |
| Service | Vitest + repository fakes | use-case outcome/audit/revoke/error |
| Repository integration | Vitest + Mongo replica set | index, projection, pagination, transaction |
| API integration | Supertest + real Mongo test DB | HTTP/cookie/auth/error/rate |
| React component/integration | Testing Library + MSW | forms, provider, route, list states |
| Browser E2E | Playwright | cookie/storage/role flow/copy/navigation |
| Contract | Swagger Parser + operation assertions | OpenAPI completeness |
| DevSecOps | audit/secret scan + assertions | dependency/secrets/redaction |

## 3. Core Scenario Matrix

| Scenario | Expected |
| --- | --- |
| Register valid Student | One STUDENT/ACTIVE; hash only; no session/Enrollment |
| Register duplicate/mixed-case email | 409; no second User |
| Register role/status injection | 422/strict reject; no privileged User |
| Password 11/12/128/129 + edge spaces | Exact policy behavior |
| Login valid each role | Access + cookie + correct role User |
| Login invalid email/password | Same safe response; failure state increments |
| Five failures/15m | Cooldown 15m, no identity leakage |
| Login non-ACTIVE statuses | Denied; no session |
| Refresh valid | Old rotated, new cookie/access returned |
| Concurrent refresh/replay | One winner; race trong grace retry không revoke; replay ngoài grace revoke family |
| Logout | Family revoked; cookie clear; old refresh fails |
| Block active user | Status/audit/revoke atomic; old bearer denied by DB check |
| `/users/me` cross-user attempt | Only actor own projection |
| Student/Teacher call Admin API | 403, no list data |
| Student/Teacher/Admin lists | Fixed intended role, server pagination |
| Self/final Super Admin escalation | Denied, no partial mutation |
| Invitation create | PENDING/MANUAL_COPY/hash only/raw link once |
| Concurrent invitation create | Exactly one PENDING invitation per normalized email |
| Invitation accept | Teacher ACTIVE + ACCEPTED + audit transaction |
| Expired/revoked/accepted/mismatch | Denied, no partial Teacher |
| Concurrent invitation accept | Exactly one Teacher/accept success |
| Lost invitation link | List cannot expose/reconstruct raw link |

## 4. Negative Authorization Matrix

| Actor | Attempt | Expected |
| --- | --- | --- |
| Guest | `/users/me` or Admin list | 401 |
| Student | Teacher/Admin list/invitation create | 403 |
| Teacher | Student/Admin global list | 403 |
| Admin | Promote self/Super Admin action | 403/role conflict |
| Blocked Admin | Any protected Admin API with valid old JWT | ACCOUNT_NOT_ACTIVE |
| Admin without permission | Corresponding role list/action | 403 and no projection |
| User A | Patch `/users/{B}` through own profile API | Route absent/denied |

## 5. Cookie And Browser Security Tests

- Refresh cookie `HttpOnly`, expected `SameSite`, `Path`, `Secure` by environment.
- No access/refresh token in localStorage/sessionStorage/IndexedDB.
- Login/refresh response `Cache-Control: no-store`.
- Cross-origin refresh/logout rejected by Origin/Referer guard.
- AuthProvider performs one bootstrap refresh and one retry, no loop.
- Hai tab cùng bootstrap/401 được serialize bằng Web Locks/BroadcastChannel hoặc server grace fallback; không tự revoke session.
- Private query cache cleared after logout/account rejection.
- Invitation token bắt buộc được xóa khỏi browser URL trước preview API; preview/accept gửi token trong POST body và logger redact field này.

## 6. Data Integrity And Concurrency

Chạy trên Mongo replica set thật:

- 10 concurrent register requests same normalized email -> one User.
- 2 concurrent refresh same token -> policy-documented outcome, no two active replacements.
- 10 concurrent invitation creates same email -> exactly one PENDING record.
- 2 concurrent invitation accepts -> one Teacher, one accepted invitation.
- Status update transaction failure -> no status/audit/session partial mismatch.
- Role update with stale `expectedUpdatedAt` -> conflict, no overwrite.
- 2 concurrent demote/block operations trên hai Super Admin -> luôn còn ít nhất một ACTIVE Super Admin.
- Pagination stable khi records có same `createdAt`/name.

## 7. Redaction Tests

Capture application/AuditLog/HTTP error samples và assert không chứa:

- Plain password/confirmPassword.
- Bearer JWT.
- Cookie/raw refresh token.
- Raw invitation token/link.
- `passwordHash`, `tokenHash`, signing secret, Mongo URI.

## 8. OpenAPI Tests

- OpenAPI 3.0.3 parser pass.
- P02 route-method catalog có operation tương ứng.
- Mutation body strict schema và enums/bounds.
- Security declaration đúng public/bearer/cookie behavior.
- Representative 401/403/409/422/429 documented.
- Swagger UI loads, no token persistence/prefill.

## 9. E2E Journeys

### E2E-AUTH-01 - Student

Register -> Login -> Student Home -> Profile update -> reload/session restore -> Logout -> protected route redirects Login.

### E2E-ADMIN-01 - User Governance

Admin Login -> Student List filter -> User detail -> Block -> target session denied -> Unblock -> audit record verified through test hook/repository.

### E2E-INV-01 - Teacher Onboarding

Admin Login -> Create invitation -> Copy link -> anonymous activation -> Teacher Login -> Teacher Home -> old invitation reuse denied.

### E2E-RBAC-01 - Direct URL

Student direct opens Admin route/API; UI Forbidden và API 403, không có private data in response.

### E2E-AUTH-02 - Multi-Tab Refresh

Hai tab cùng session reload/gọi API hết hạn; chỉ một refresh thắng, tab còn lại nhận ephemeral auth state hoặc retry bằng cookie mới; family không bị revoke. Replay old token ngoài grace phải revoke family.

## 10. Test Data Isolation

- Database per test worker hoặc unique run prefix.
- Synthetic `.example.test` emails.
- Clock/random injectable cho expiry/token tests; token raw không snapshot.
- Cleanup không chạy trên non-test database; environment guard bắt buộc.
- E2E seed idempotent và không chứa Production credential.

Playwright harness đặt tại root `tests/e2e/` với `playwright.config.ts`. CI chỉ chạy Chromium cho P02, start Web/API/replica set qua readiness, dùng run-scoped database và upload trace/screenshot/video khi failure.

## 11. CI Gates

| Gate | Pass condition |
| --- | --- |
| Existing quality | lint, negative gate, format, typecheck, unit coverage, build |
| Mongo integration | replica set primary; all repository/API/transaction tests pass |
| Auth E2E | all Must journeys pass, traces/screenshots uploaded on failure |
| Security | storage/cookie/replay/redaction/negative matrix pass |
| OpenAPI | parse + operation coverage pass |
| Audit/dependency/secret | no high production vulnerability, no secret detection |

Không giảm coverage threshold P01 để “làm xanh” P02. Có thể tăng threshold sau khi test suite ổn định.

## 12. Manual/UAT Review

- Vietnamese labels/messages rõ, không dịch role/code kỹ thuật trong API.
- Mobile/desktop Login/Register/Admin lists/Invitation không overlap/overflow.
- Back/breadcrumb giữ list query context.
- Clipboard success/fallback và one-time link warning dễ hiểu.
- Account status/action confirm không gây hiểu lầm.
