# Single-Origin Routing Contract

## 1. Mục tiêu

React Web, REST API và Swagger được phục vụ từ cùng một Cloud Run URL để giảm cấu hình CORS/cookie và
đảm bảo browser journey giống Production.

## 2. Route ownership

| Prefix/route | Owner | Hành vi |
| --- | --- | --- |
| `/api/v1/**` | Express API | JSON; không fallback về HTML |
| `/api-docs` và `/api-docs/**` | Swagger UI | Documentation assets |
| `/api/v1/openapi.json` và `/api-docs/openapi.json` | OpenAPI handler | JSON contract hiện hành |
| `/health` | Runtime | Liveness response |
| `/ready` | Runtime | Readiness response |
| `/assets/**` | React static | File fingerprinted, immutable cache |
| mọi `GET` route còn lại | React SPA | Trả `index.html` để client router xử lý |
| route không phải `GET` còn lại | Error handler | `404` JSON, không trả SPA |

API/docs/health routes phải được đăng ký trước static middleware và SPA fallback.

## 3. Frontend API base URL

- Production/Staging không đóng cứng Cloud URL vào bundle; public config mặc định dùng same-origin
  (empty origin prefix hoặc `window.location.origin`) và API client hiện hữu tiếp tục thêm `/api/v1`.
- Local development vẫn cho phép `VITE_API_BASE_URL=http://localhost:4000`.
- Client không nối URL bằng string rời rạc; dùng một API client factory duy nhất.
- Build phải fail nếu Production bundle chứa `localhost`, Atlas URI hoặc Cloud project credential.

## 4. Cookie và proxy

- Access/refresh cookie tuân theo auth contract Phase 02.
- Cloud HTTPS yêu cầu `Secure=true` và `HttpOnly=true` cho token cookie.
- Same-origin cho phép `SameSite=Lax` mặc định; thay đổi chỉ qua security review.
- Express trust proxy phải cấu hình rõ để nhận biết HTTPS phía sau Cloud Run.
- Không phản chiếu Origin tùy ý; allowlist phải là exact origins.

## 5. Cache policy

| Resource | Header yêu cầu |
| --- | --- |
| Fingerprinted `/assets/**` | `Cache-Control: public, max-age=31536000, immutable` |
| `index.html` | `Cache-Control: no-cache` |
| API/auth responses | Theo API contract; dữ liệu cá nhân mặc định `no-store` |
| OpenAPI JSON | `no-cache` để phản ánh revision hiện hành |
| Health/version | `no-store` |

## 6. Security headers

Ứng dụng giữ middleware bảo mật hiện hữu và kiểm chứng trên Cloud:

- `Content-Security-Policy` không phá Swagger/React;
- `X-Content-Type-Options: nosniff`;
- clickjacking protection;
- strict referrer policy;
- HSTS chỉ bật tại HTTPS Cloud environment;
- không lộ `X-Powered-By`.

Nếu Swagger cần CSP directive riêng, directive phải giới hạn theo asset thực tế và có test regression.

## 7. Deep-link behavior

Các URL browser như `/teacher/courses/<id>/gradebook` hoặc `/student/todo` phải:

1. trả `index.html` khi reload trực tiếp;
2. React router xác thực session;
3. actor không có quyền được chuyển về forbidden/not-found đúng contract;
4. không biến API `404` thành HTML `200`.

## 8. Error behavior

- API unknown route: JSON error envelope với status `404`.
- SPA unknown route: React Not Found screen với status transport `200` là chấp nhận được cho static fallback.
- Static asset missing: `404`, không trả `index.html`.
- Unhandled server error: JSON/HTML tùy route owner, không lộ stack ở Production.

## 9. Verification matrix

| Test | Expected |
| --- | --- |
| `GET /` | React shell `200` |
| direct load protected Web route | React shell, sau đó auth guard đúng |
| `GET /api/v1/unknown` | JSON `404` |
| `POST /unknown` | JSON `404` |
| `GET /assets/missing.js` | `404`, không phải HTML shell |
| `GET /api-docs/` | Swagger UI `200` |
| `GET /api/v1/openapi.json` | Valid OpenAPI JSON |
| cookie login/logout trên Cloud URL | Success, không CORS error |
| response headers | Cache/security policy đúng |
