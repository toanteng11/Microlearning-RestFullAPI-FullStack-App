# Phase 01 Testing Strategy

## 1. Mục tiêu

Xác nhận foundation chạy đúng ở static, automated test, build và integrated runtime levels.

## 2. Test Matrix

| Level | Scope | Command/evidence | Kết quả |
| --- | --- | --- | --- |
| Static | ESLint/Prettier | `npm run lint`, `npm run format:check` | Pass |
| Type | Web/API TypeScript strict | `npm run typecheck` | Pass |
| API integration | Config, health, readiness, version, 404, OpenAPI | Vitest + Supertest | 7 pass |
| Web component | Success/error states | Vitest + Testing Library | 2 pass |
| Contract | OpenAPI syntax/paths | Swagger Parser | Pass |
| Build | API compile/Web Vite bundle | `npm run build` | Pass |
| Dependency | Production audit | npm audit | 0 vulnerabilities |
| Container | Images/services/health | Docker Compose | Pass in verification run |
| HTTP smoke | Web/API/Swagger/SPA/CORS | PowerShell HTTP requests | Pass |

## 3. Critical Cases

- Invalid MongoDB URI/config làm startup fail fast.
- Readiness trả `503` khi MongoDB không `UP`.
- Unknown API route trả `404` theo error envelope và không có stack ở test/production mode.
- OpenAPI document parse/validate được.
- Web hiển thị API data khi hai request thành công.
- Web hiển thị retry state khi network lỗi.
- Direct React route trong Nginx không trả 404.
- Untrusted CORS origin không có allow-origin header.

## 4. Test Data

Phase 01 không tạo business seed data. Test dùng configuration/runtime fixture tổng hợp và dependency status giả lập. Không kết nối Production data.

## 5. Command Baseline

```powershell
npm ci
npm run check
npm audit --omit=dev --audit-level=critical
docker compose up --build -d
```

## 6. Remaining Evidence

- Browser visual/console review bị chặn bởi Windows browser runtime permission trong phiên tự động.
- Independent clean-clone onboarding chưa có người thứ hai thực hiện.
- Remote GitHub CI run chưa có vì repository chưa có remote.
