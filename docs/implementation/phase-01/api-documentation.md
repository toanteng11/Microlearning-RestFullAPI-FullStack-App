# Phase 01 API Documentation

## 1. Contract Baseline

- OpenAPI version: `3.0.3`.
- Swagger UI: `/api-docs`.
- Machine-readable contract: `/api/v1/openapi.json`.
- Compatibility alias: `/api-docs/openapi.json`.
- API version prefix: `/api/v1` trừ liveness/readiness.

## 2. Documented Endpoints

| Method | Endpoint | Tag | Exposure |
| --- | --- | --- | --- |
| GET | `/health` | System | Public-safe |
| GET | `/ready` | System | Runtime probe |
| GET | `/api/v1/system/health` | System | Tạm public-safe; bảo vệ từ Phase 02 |
| GET | `/api/v1/system/version` | System | Public-safe artifact identity |

## 3. Components

OpenAPI đã có schema cho Basic Health, Readiness, Detailed Health, Version và common Error Response. `bearerAuth` được khai báo trước cho Phase 02 nhưng không prefill/persist real token.

## 4. Quality Rules

- Contract và implementation thay đổi trong cùng Pull Request.
- Mỗi endpoint phải có summary, operation ID, response status và schema.
- Không đưa credential, raw invitation URL hoặc Production server detail vào example.
- Contract validation test phải fail khi OpenAPI document không hợp lệ.
- Swagger HTTP 200 chưa đủ; QA cần kiểm tra UI load spec và endpoint examples ở browser environment.

## 5. Evidence

- `@apidevtools/swagger-parser` validation pass.
- `/api-docs/` trả HTTP 200.
- `/api/v1/openapi.json` trả `openapi=3.0.3`.
- Visual browser automation chưa có evidence vì Windows chặn browser runtime; action còn mở trong `exit-report.md`.
