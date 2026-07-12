# Microlearning Classroom LMS Platform

Nền tảng Microlearning hỗ trợ hoạt động giảng dạy nội bộ cho Student, Teacher và Admin. Repository sử dụng ReactJS, Node.js/ExpressJS, MongoDB, Swagger/OpenAPI, Docker và CI/CD.

Hiện tại repository đã hoàn thành nền tảng kỹ thuật Phase 01. Các chức năng nghiệp vụ được triển khai từ Phase 02 theo [Implementation Plan](docs/implementation/common/technical-implementation-plan.md).

## Prerequisites

- Node.js `24.14.0`.
- npm `11.9.0`.
- Docker Desktop hoặc Docker Engine có Docker Compose.
- Git.

## Repository Structure

```text
apps/
  web/                 ReactJS application
  api/                 Node.js/ExpressJS RESTful API
business-analysis/     BA documents
docs/implementation/  Technical implementation plans
infrastructure/        Docker, CI and Cloud operational notes
.github/workflows/     Continuous Integration workflows
```

## Local Setup

1. Tạo file environment local từ `.env.example` và chỉ thay bằng giá trị dành cho máy local.
2. Khởi động MongoDB local bằng Docker hoặc dùng MongoDB URI dành cho development.
3. Cài dependency và chạy Web/API.

```powershell
npm ci
npm run dev
```

Web development URL: `http://localhost:5173`

API URL: `http://localhost:4000`

Swagger UI: `http://localhost:4000/api-docs`

OpenAPI JSON: `http://localhost:4000/api/v1/openapi.json`

`npm run dev` đọc file `.env` tại root cho cả Web và API. File này bị Git ignore; `.env.example` là contract được commit để hướng dẫn cấu hình. Docker Compose inject environment độc lập và không copy `.env` vào image.

## Docker Compose

```powershell
docker compose up --build
```

Sau khi các service healthy:

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`
- API readiness: `http://localhost:4000/ready`
- Swagger UI: `http://localhost:4000/api-docs`

Dừng service nhưng giữ dữ liệu MongoDB local:

```powershell
docker compose down
```

Không dùng tùy chọn xóa volume trừ khi chủ động muốn reset toàn bộ dữ liệu local.

## Quality Commands

```powershell
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
npm run check
```

`npm run check` là quality gate đầy đủ tương đương Pull Request CI.

## Environment Variables

| Variable            | Application | Mục đích                                      |
| ------------------- | ----------- | --------------------------------------------- |
| `APP_ENV`           | API         | Xác định development/test/staging/production  |
| `APP_VERSION`       | API         | Phiên bản artifact                            |
| `COMMIT_SHA`        | API         | Commit tạo artifact                           |
| `BUILD_TIME`        | API         | Thời điểm tạo artifact                        |
| `PORT`              | API         | HTTP port                                     |
| `MONGODB_URI`       | API         | MongoDB connection string, được xem là secret |
| `ALLOWED_ORIGINS`   | API         | CORS allowlist, phân tách bằng dấu phẩy       |
| `LOG_LEVEL`         | API         | Structured logging level                      |
| `VITE_API_BASE_URL` | Web         | Public API URL được nhúng khi build           |

Không commit `.env`, token, password hoặc connection string thật. Tất cả biến có prefix `VITE_` đều được xem là public.

## Troubleshooting

### API thoát ngay khi khởi động

Kiểm tra `MONGODB_URI`, `ALLOWED_ORIGINS`, `PORT` và MongoDB đang hoạt động. API chủ động fail fast nếu configuration sai hoặc không kết nối được dependency chính.

### Web hiển thị API chưa sẵn sàng

Mở `http://localhost:4000/health`, kiểm tra `VITE_API_BASE_URL` và CORS allowlist. Khi chạy Docker Compose, dùng Web tại port `3000`; khi chạy Vite local, dùng port `5173`.

### Refresh route React trả 404 trong container

Web image đã có Nginx SPA fallback. Nếu lỗi còn xảy ra, kiểm tra image mới đã được rebuild và container không dùng cache cũ.

## Documentation

- [Business Analysis](business-analysis/)
- [Implementation Documentation](docs/implementation/README.md)
- [Phase 01 Documentation](docs/implementation/phase-01/README.md)
- [Architecture Overview](docs/implementation/phase-01/architecture-overview.md)
- [Architecture Decision Records](docs/implementation/phase-01/technical-decisions.md)
