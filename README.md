# Microlearning Classroom LMS Platform

Nền tảng Microlearning hỗ trợ hoạt động giảng dạy nội bộ cho Student, Teacher và Admin. Repository sử dụng ReactJS, Node.js/ExpressJS, MongoDB, Swagger/OpenAPI, Docker và CI/CD.

Repository đã hoàn thành Phase 01; implementation Phase 02 cho Student registration, secure session, RBAC, Admin User Management và manual Teacher Invitation đã merge vào `main` với `39/39` acceptance criteria và post-merge CI xanh. Baseline Phase 03 Classroom Management hiện ở trạng thái `READY_FOR_REVIEW` trong [Phase 03 Implementation Plan](docs/implementation/phase-03/README.md).

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
npm run test:coverage
npm run test:integration
npm run test:e2e
npm run build
npm run check
npm run check:ci
```

`npm run check` là quality gate đầy đủ dành cho local. `npm run check:ci` thay test thông thường bằng coverage test, áp dụng coverage threshold, kiểm tra negative lint gate và là lệnh được Pull Request CI sử dụng.

`npm run test:integration` yêu cầu `MONGODB_INTEGRATION_URI` trỏ tới test database trên replica set. `npm run test:e2e` yêu cầu Web/API/MongoDB đang healthy và `E2E_DEMO_PASSWORD` trùng với password dùng cho synthetic seed; xem [Phase 02 DevOps Guide](docs/implementation/phase-02/devops-environment-and-seeding.md).

## Environment Variables

| Variable                      | Application | Mục đích                                                    |
| ----------------------------- | ----------- | ----------------------------------------------------------- |
| `APP_ENV`                     | API         | Xác định development/test/staging/production                |
| `APP_VERSION`                 | API         | Phiên bản artifact                                          |
| `COMMIT_SHA`                  | API         | Commit tạo artifact                                         |
| `BUILD_TIME`                  | API         | Thời điểm tạo artifact                                      |
| `PORT`                        | API         | HTTP port                                                   |
| `MONGODB_URI`                 | API         | MongoDB replica-set connection string, được xem là secret   |
| `PUBLIC_WEB_URL`              | API         | Canonical Web origin dùng tạo manual invitation link        |
| `ALLOWED_ORIGINS`             | API         | CORS/Origin allowlist chính xác, phân tách bằng dấu phẩy    |
| `ACCESS_TOKEN_*`              | API         | JWT secret/issuer/audience/TTL; secret tối thiểu 32 bytes   |
| `REFRESH_TOKEN_TTL_SECONDS`   | API         | Refresh session TTL                                         |
| `REFRESH_REUSE_GRACE_SECONDS` | API         | Grace chống multi-tab self-revoke, từ 0 đến 10 giây         |
| `REFRESH_COOKIE_*`            | API         | Tên cookie và Secure policy                                 |
| `AUTH_IDENTITY_PEPPER`        | API         | Secret riêng cho identity cooldown key                      |
| Rate/cooldown variables       | API         | Threshold/window có min/max validation trong `.env.example` |
| `BOOTSTRAP_ADMIN_ENABLED`     | API/CLI     | Tắt mặc định; không tự seed khi API startup                 |
| `LOG_LEVEL`                   | API         | Structured logging level                                    |
| `VITE_API_BASE_URL`           | Web         | Public API URL được nhúng khi build                         |

Không commit `.env`, token, password hoặc connection string thật. Tất cả biến có prefix `VITE_` đều được xem là public.

## Troubleshooting

### API thoát ngay khi khởi động

Kiểm tra các biến bắt buộc trong `.env.example`, `MONGODB_URI` có `replicaSet=rs0`, secret đủ 32 bytes và MongoDB đang là writable primary. API chủ động fail fast nếu configuration hoặc topology sai.

### Web hiển thị API chưa sẵn sàng

Mở `http://localhost:4000/health`, kiểm tra `VITE_API_BASE_URL` và CORS allowlist. Khi chạy Docker Compose, dùng Web tại port `3000`; khi chạy Vite local, dùng port `5173`.

### Refresh route React trả 404 trong container

Web image đã có Nginx SPA fallback. Nếu lỗi còn xảy ra, kiểm tra image mới đã được rebuild và container không dùng cache cũ.

## Documentation

- [Business Analysis](business-analysis/)
- [Implementation Documentation](docs/implementation/README.md)
- [Phase 01 Documentation](docs/implementation/phase-01/README.md)
- [Phase 02 Documentation](docs/implementation/phase-02/README.md)
- [Phase 02 Exit Evidence](docs/implementation/phase-02/phase-exit-evidence.md)
- [Architecture Overview](docs/implementation/phase-01/architecture-overview.md)
- [Architecture Decision Records](docs/implementation/phase-01/technical-decisions.md)
