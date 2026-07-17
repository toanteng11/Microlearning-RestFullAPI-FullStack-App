# Phase 02 DevOps, Environment And Seeding

## 1. Mục tiêu DevOps P02

DevOps trong phase này không chỉ là chạy Docker. Mục tiêu là làm cho auth/security behavior giống nhau giữa Local, CI và môi trường Cloud sau này, đồng thời chứng minh transaction, secret handling và bootstrap account có kiểm soát.

## 2. MongoDB Replica Set

Teacher activation cần multi-document transaction, vì vậy MongoDB Local/CI chuyển sang single-node replica set `rs0`.

Yêu cầu:

- Mongo container start với `--replSet rs0 --bind_ip_all`.
- Init script/one-shot service gọi `rs.initiate` idempotently.
- API chỉ ready khi replica set primary và database ping thành công.
- URI local dùng `replicaSet=rs0` và hostname mà API container resolve được.
- Named volume giữ dữ liệu; tài liệu có cách reset có chủ ý nhưng không tự xóa volume.
- CI transaction test chạy trên replica set thật, không chỉ mock.

## 3. Environment Inventory

| Variable | Secret | Example/local rule |
| --- | --- | --- |
| `PUBLIC_WEB_URL` | No | `http://localhost:3000` |
| `ALLOWED_ORIGINS` | No | comma-separated exact origins; no wildcard with credentials |
| `ACCESS_TOKEN_SECRET` | Yes | >=32 random bytes; placeholder only in `.env.example` |
| `ACCESS_TOKEN_ISSUER` | No | `microlearning-api` |
| `ACCESS_TOKEN_AUDIENCE` | No | `microlearning-web` |
| `ACCESS_TOKEN_TTL_SECONDS` | No | `900` |
| `REFRESH_TOKEN_TTL_SECONDS` | No | `604800` |
| `REFRESH_REUSE_GRACE_SECONDS` | No | `5`, validate 0-10 |
| `REFRESH_COOKIE_NAME` | No | `ml_refresh` local |
| `REFRESH_COOKIE_SECURE` | No | false local, true Staging/Cloud |
| `AUTH_IDENTITY_PEPPER` | Yes | separate random secret |
| `TEACHER_INVITATION_TTL_DAYS` | No | `7` |
| `VITE_API_BASE_URL` | Public build config | `http://localhost:4000`; never secret |
| Rate/cooldown variables | No | validated min/max defaults |
| `BOOTSTRAP_ADMIN_ENABLED` | No | false by default |

`PUBLIC_WEB_URL` là canonical URL dùng tạo manual invitation link. `ALLOWED_ORIGINS` tiếp tục là allowlist CORS/Origin có thể chứa nhiều Local/Staging origin; hai biến không thay thế nhau.

`.env.example` chỉ chứa placeholder/instruction; `.env` tiếp tục bị ignore. Secret scan phải phát hiện secret-like test fixture nếu vô tình commit.

## 4. Bootstrap Super Admin

Command target:

```text
npm run bootstrap:admin --workspace @microlearning/api -- --email admin@example.test
```

Password nhập qua hidden prompt hoặc stdin bảo mật; không truyền trong command argument, URL, file hoặc log.

CLI behavior:

1. Chỉ chạy khi operator chủ động gọi.
2. Validate config, Mongo replica set và email/password policy.
3. Kiểm tra active Super Admin hiện có.
4. Nếu email/role conflict, fail an toàn; không overwrite.
5. Tạo một `SUPER_ADMIN ACTIVE ADMIN_BOOTSTRAP` và operation/audit record.
6. Output chỉ user ID/email/status, không password/hash.

Production cần approval riêng; P02 chủ yếu dùng Local/CI synthetic data.

## 5. Seed And Test Data

Tách rõ:

- `bootstrap`: tạo identity quản trị đầu tiên có kiểm soát.
- `seed:demo`: tạo synthetic Student/Teacher/Admin cho Local/Demo, idempotent và disabled Production.
- `test fixtures`: tạo/xóa data isolated trong test database.

Seed data đề xuất:

| Alias | Role/Status | Mục đích |
| --- | --- | --- |
| `student.active@example.test` | STUDENT/ACTIVE | positive Student |
| `student.blocked@example.test` | STUDENT/BLOCKED | status denial |
| `teacher.active@example.test` | TEACHER/ACTIVE | Teacher role |
| `admin.active@example.test` | ADMIN/ACTIVE | Admin list/invitation |
| `superadmin.active@example.test` | SUPER_ADMIN/ACTIVE | sensitive action |

Không commit password thật. Local demo password được lấy từ ignored env hoặc generated/displayed one-time by seed command; CI fixtures dùng constants rõ là synthetic và không qua Production.

## 6. CI Changes

| Job/gate | P02 addition |
| --- | --- |
| Lint/type/format | New modules/scripts/config checked |
| Unit/coverage | Auth/security/frontend components |
| Mongo integration | Start/init replica set, run repository/transaction/API tests |
| Build | Native `argon2` build Web/API Docker and runner |
| Auth E2E | Start integrated stack, run critical browser flow |
| Security | Secret scan, production audit, token-storage/redaction assertions |
| OpenAPI | Parser + operation coverage |

Coverage artifact vẫn mandatory. E2E failure không được bỏ qua bằng `continue-on-error` cho Must flow.

Playwright baseline:

- Root dev dependency `@playwright/test`; config tại `playwright.config.ts`, tests tại `tests/e2e/`.
- Scripts `test:e2e` và `test:e2e:ci`; CI cài Chromium bằng `npx playwright install --with-deps chromium`.
- Web/API/replica set được start bằng deterministic webServer/readiness command; seed dùng run ID riêng.
- Trace, screenshot và video chỉ upload khi failure; artifact phải redact token/cookie/synthetic email khi cần.

## 7. Docker And Reverse Proxy

- API image vẫn non-root và multi-stage; native dependency chỉ mang runtime artifact cần thiết.
- Web Nginx reverse proxy có thể route `/api` cùng site trong Compose để test cookie policy gần Production hơn.
- Proxy access log phải tránh raw invitation query token; dùng redaction/route strategy.
- Health/readiness giữ public-safe; readiness cần Mongo replica-set primary.
- Auth cookie không được cache bởi proxy/CDN.

## 8. Operational Smoke

Sau Compose up:

1. `/health`, `/ready`, `/api/v1/system/version`, `/api-docs` trả đúng.
2. Register Student không set refresh cookie.
3. Login set cookie đúng local policy; `/users/me` thành công.
4. Refresh rotate; old token replay bị từ chối/revoke.
5. Admin list permission và invitation create/accept chạy.
6. Block account làm session cũ mất quyền.
7. Container/API logs không có password/token/cookie.

## 9. DevOps Learning Notes

- Replica set được thêm vì transaction cần cơ chế consensus/primary, không phải vì “Docker phức tạp hơn thì tốt hơn”.
- Secret phải được inject khi runtime; `VITE_*` là public và không được chứa signing key/pepper.
- CI là bộ kiểm tra tái lập, còn branch protection là cơ chế bắt buộc CI pass trước merge.
- Rate limiter memory chỉ đúng với một API process; scale nhiều replica đòi shared store để mọi replica thấy cùng counter.
- Build thành công chưa chứng minh auth an toàn; cần runtime cookie, replay, log và negative authorization evidence.

## 10. DevOps Exit Evidence

- Compose config/ps/health với replica set primary.
- Transaction integration test trên Local và CI.
- Docker image build và API non-root evidence.
- CI URL/artifacts cho unit/integration/E2E/security/OpenAPI.
- `.env.example` review và secret scan pass.
- Bootstrap/seed idempotency output không lộ credential.
- Log redaction sample và browser cookie/storage screenshot.
