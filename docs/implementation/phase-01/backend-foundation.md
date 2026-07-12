# Phase 01 Backend Foundation

## 1. Mục tiêu

Tạo ExpressJS RESTful API có composition, configuration, middleware và error contract ổn định để thêm domain module từ Phase 02.

## 2. Runtime Composition

```text
server.ts
  -> load local/runtime environment
  -> connect MongoDB
  -> createApp(...)
  -> listen
  -> graceful SIGINT/SIGTERM shutdown
```

`app.ts` không tự mở port hoặc kết nối database, nhờ đó integration test có thể tạo Express app với dependency status giả lập.

## 3. Middleware Order

```text
Request ID
  -> Structured HTTP logging
  -> Helmet security headers
  -> CORS allowlist
  -> JSON body parser and limit
  -> Operational/API routes
  -> Not Found
  -> Global Error Handler
```

## 4. Operational Endpoints

| Endpoint | Mục tiêu | Kết quả chính |
| --- | --- | --- |
| `GET /health` | Liveness | API process `UP`, không lộ dependency/secret |
| `GET /ready` | Readiness | `503` nếu MongoDB không `UP` |
| `GET /api/v1/system/health` | Detailed health | Status và uptime public-safe |
| `GET /api/v1/system/version` | Artifact identity | Version/environment/commit/build time |
| `GET /api/v1/openapi.json` | API contract | OpenAPI JSON |
| `GET /api-docs` | Interactive docs | Swagger UI |

## 5. Error Contract

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found"
  },
  "meta": {
    "requestId": "request-id",
    "timestamp": "ISO-8601",
    "path": "/api/v1/example"
  }
}
```

- Production không trả stack trace.
- Stable error code dùng cho frontend mapping và QA assertion.
- Logger redact authorization, cookie, password, token và secret paths.

## 6. Verification

- API typecheck/build pass.
- 7 tests pass cho config, health, readiness, version, 404 và OpenAPI.
- Allowed CORS origin có response header; untrusted origin không có allow header.
- API Docker image chạy user `node`, UID `1000`.

## 7. Phase 02 Extension

Thêm module `identity`, `teacher-invitation` và `user-administration`. Mỗi module phải giữ direction `route -> controller -> service/use case -> repository`; authentication middleware và authorization policy đặt trong shared/security boundary có owner rõ ràng.
