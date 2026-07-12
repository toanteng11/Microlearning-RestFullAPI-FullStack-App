# Implementation Architecture Overview

## Mục đích

Tài liệu này mô tả architecture thực tế được tạo trong Phase 01 và ranh giới mà các phase nghiệp vụ phải tiếp tục tuân thủ.

## Runtime Flow

```text
Browser
  -> ReactJS Web
  -> RESTful API /api/v1
  -> Express middleware and domain modules
  -> Mongoose repositories
  -> MongoDB
```

Phase 01 mới có `System` module. Phase 02 trở đi thêm module domain nhưng không phá dependency direction:

```text
Route -> Middleware -> Controller -> Service/Use Case -> Repository -> MongoDB
```

## Web Boundaries

| Folder | Trách nhiệm |
| --- | --- |
| `src/app` | Router, application composition và global error boundary |
| `src/features` | Feature theo domain như system, auth, classroom và learning |
| `src/shared/api` | HTTP client và response/error mapping dùng chung |
| `src/shared/components` | Component tái sử dụng không sở hữu business rule |
| `src/shared/config` | Public build/runtime configuration |

Frontend route guard không thay thế API authorization. Score, progress, deadline và quyền truy cập cuối cùng phải được kiểm soát ở API.

## API Boundaries

| Folder | Trách nhiệm |
| --- | --- |
| `src/modules` | Module theo domain, route/controller/service/repository liên quan |
| `src/shared/config` | Validate environment và tạo typed configuration |
| `src/shared/database` | MongoDB lifecycle và data access foundation |
| `src/shared/errors` | Stable application error model |
| `src/shared/logging` | Structured logger và secret redaction |
| `src/shared/middleware` | Cross-cutting HTTP concerns |
| `src/docs` | OpenAPI document và Swagger contract |
| `src/app.ts` | Compose Express app, không mở port |
| `src/server.ts` | Connect dependency, mở port và graceful shutdown |

Việc tách `app.ts` và `server.ts` cho phép integration test HTTP mà không cần mở network port hoặc kết nối Production dependency.

## Operational Endpoints

| Endpoint | Mục tiêu | Dependency behavior |
| --- | --- | --- |
| `/health` | Liveness của API process | Không kiểm tra MongoDB |
| `/ready` | Readiness cho deployment/runtime | Trả `503` nếu MongoDB không UP |
| `/api/v1/system/health` | Chi tiết trạng thái vận hành | Trả trạng thái MongoDB public-safe trong Phase 01 |
| `/api/v1/system/version` | Xác định artifact/environment | Không chứa secret/infrastructure detail |
| `/api-docs` | Swagger UI | Local/Staging technical interface |
| `/api/v1/openapi.json` | Machine-readable API contract | Dùng cho QA/contract validation |

Khi authentication hoàn thành ở Phase 02, detailed system health cần được bảo vệ theo Admin/DevOps policy trong BA.

## Configuration Boundary

- API đọc và validate environment một lần khi startup.
- `MONGODB_URI` là secret và không được log.
- Web chỉ nhận `VITE_API_BASE_URL`; mọi `VITE_*` được xem là public.
- Docker/CI inject configuration, không copy `.env` vào image.

## Phase 02 Extension Rules

- Thêm `identity`, `teacher-invitation` và `user-administration` dưới `apps/api/src/modules`.
- Thêm feature tương ứng dưới `apps/web/src/features`.
- API contract cập nhật trong cùng Pull Request với endpoint.
- Mongoose model không được trả trực tiếp cho Web; dùng DTO loại bỏ field nhạy cảm.
- Authorization phải được test cả role-level và object-level.
