# Phase 01 Testing Strategy

## 1. Mục tiêu

Xác nhận foundation chạy đúng ở static, automated test, build và integrated runtime levels.

## 2. Test Matrix

| Level | Scope | Command/evidence | Kết quả |
| --- | --- | --- | --- |
| Static | ESLint/Prettier | `npm run lint`, `npm run format:check` | Pass |
| Type | Web/API TypeScript strict | `npm run typecheck` | Pass |
| API integration | Config, health, readiness, version, 404, OpenAPI | Vitest + Supertest | 7 pass |
| Web component/integration | System Status, App Shell, Error Boundary, routing/404/back | Vitest + Testing Library | 6 pass |
| Contract | OpenAPI syntax/paths | Swagger Parser | Pass |
| Build | API compile/Web Vite bundle | `npm run build` | Pass |
| Coverage | API/Web threshold và report | Vitest V8, `npm run test:coverage` | Pass |
| Negative gate | Intentional unused variable phải bị từ chối | `npm run verify:negative-gate` | Pass |
| Dependency | Production audit | npm audit | 0 vulnerabilities |
| Container | Images/services/health | Docker Compose | Pass in verification run |
| HTTP smoke | Web/API/Swagger/SPA/CORS | PowerShell HTTP requests | Pass |
| Browser | System Status/Swagger desktop và mobile | Visual, DOM, overflow, console | Pass |

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
npm run check:ci
npm audit --omit=dev --audit-level=high
docker compose up --build -d
```

`npm run check` là local gate nhanh; `npm run check:ci` dùng coverage test và là gate tương đương quality job trên GitHub Actions.

## 6. Coverage Baseline

| Area | Statements | Branches | Functions | Lines | Threshold result |
| --- | ---: | ---: | ---: | ---: | --- |
| API | 76.92% | 48.71% | 76% | 78.66% | Pass |
| Web | 81.39% | 75% | 81.25% | 85% | Pass |

Coverage threshold là regression floor, không phải mục tiêu dừng viết test. Phase sau phải bổ sung test theo rủi ro nghiệp vụ và nâng threshold khi coverage thực tế tăng ổn định.

## 7. Verification Conclusion

Remote CI, clean-clone onboarding, Docker runtime và browser review đều có evidence trong `phase-exit-evidence.md`. Không còn verification action mở cho Phase 01.
