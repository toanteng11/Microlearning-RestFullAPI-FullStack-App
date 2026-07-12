# Phase 01 Exit Report

## 1. Kết luận

| Thuộc tính | Kết quả |
| --- | --- |
| Phase | `P01 - Project Foundation` |
| Ngày kiểm chứng local | `2026-07-12` |
| Implementation | Hoàn thành |
| Local quality gates | Pass |
| Docker integration | Pass trong phiên kiểm chứng |
| Security dependency audit | Pass, `0 vulnerabilities` |
| Remote Pull Request CI | Pending vì repository chưa có remote |
| Trạng thái tổng thể | `Implemented locally - external CI verification pending` |

Phase 01 đã tạo nền tảng chạy được cho React Web, Express API, MongoDB, Swagger, Docker Compose và CI workflow. Chưa triển khai authentication hoặc nghiệp vụ Student/Teacher/Admin; các phần đó thuộc Phase 02 trở đi.

## 2. Deliverables

| Deliverable | Bằng chứng |
| --- | --- |
| Git foundation | Local Git repository, branch `main`, `.gitignore` |
| npm monorepo | Root `package.json`, npm workspaces và `package-lock.json` |
| Toolchain | Node `24.14.0`, npm `11.9.0`, TypeScript strict, ESLint, Prettier |
| React Web | `apps/web`, router, App Error Boundary, System Status page, 404 và tests |
| Express API | `apps/api`, app/server separation, middleware, config, logging và tests |
| MongoDB | Mongoose connection lifecycle, readiness và Compose service |
| API documentation | OpenAPI `3.0.3`, Swagger UI và machine-readable JSON |
| Containers | Multi-stage Web/API Dockerfiles, non-root API runtime và Compose |
| CI | `.github/workflows/ci.yml` và Pull Request template |
| Documentation | Root README, architecture overview, ADRs và infrastructure notes |

## 3. Automated Verification

`npm run check` đã pass toàn bộ chuỗi:

- ESLint.
- Prettier format check.
- TypeScript strict typecheck cho Web/API.
- API tests: `7/7` pass.
- Web tests: `2/2` pass.
- API production build.
- Web production build bằng Vite.

Production dependency audit trả `0 vulnerabilities` tại thời điểm kiểm chứng.

## 4. Runtime Verification

Docker build đã tạo thành công image `microlearning-local-api` và `microlearning-local-web`. Ba service từng đạt trạng thái `healthy`:

| Service | Kết quả |
| --- | --- |
| `mongodb` | Healthy, chỉ mở trong internal Compose network |
| `api` | Healthy tại `http://localhost:4000` |
| `web` | Healthy tại `http://localhost:3000` |

Smoke result:

| Check | Kết quả |
| --- | --- |
| `GET /health` | HTTP 200, `status=UP` |
| `GET /ready` | HTTP 200, `status=UP`, `mongodb=UP` |
| `GET /api/v1/system/version` | HTTP 200, version `0.1.0`, environment `development` |
| `GET /api-docs/` | HTTP 200 |
| `GET /api/v1/openapi.json` | HTTP 200, OpenAPI `3.0.3` |
| `GET /` Web | HTTP 200 |
| Direct refresh `/system-status` | HTTP 200, SPA fallback hoạt động |
| Unknown API route | HTTP 404 và error envelope chuẩn |
| Allowed CORS origin | Trả đúng `Access-Control-Allow-Origin` |
| Untrusted CORS origin | Không trả allow-origin header |
| API runtime user | `uid=1000(node)`, non-root |

## 5. Acceptance Result

| AC | Trạng thái | Ghi chú |
| --- | --- | --- |
| P01-AC-001..017 | Pass | Repository, Web/API, config, MongoDB, Swagger và Docker đã kiểm chứng |
| P01-AC-018 | Implemented locally | Workflow chạy cùng quality gates; cần GitHub remote để có run evidence |
| P01-AC-019 | Pass locally; remote evidence pending | Lint trả exit code `1` với lỗi cố ý `no-unused-vars`; cần lặp lại trên remote test branch |
| P01-AC-020 | Pending independent verification | README đã có; cần một người/clean clone thực hiện onboarding dry run |

Hai mục pending không phải lỗi source code. Chúng là governance evidence chỉ có thể hoàn tất khi repository được push lên Git provider và có người thực hiện độc lập.

## 6. Deviations Và Xử Lý

| Sự kiện | Xử lý |
| --- | --- |
| Host port `27017` đã được sử dụng | Bỏ publish MongoDB ra host; giữ database trong internal Compose network, phù hợp security boundary |
| Browser automation bị Windows chặn quyền `AppData` | Dùng HTTP, SPA route, unit/component test và container health evidence; visual browser review cần thực hiện thủ công hoặc ở môi trường browser hoạt động |
| Docker daemon không luôn sẵn sàng sau phiên kiểm chứng | Runtime evidence đã được ghi; người phát triển cần mở Docker Desktop trước lệnh Compose |

## 7. Open Actions

| Action ID | Hành động | Owner | Thời điểm |
| --- | --- | --- | --- |
| P01-OA-001 | Tạo/chọn GitHub remote và push branch `main` | Repository Owner | Trước Pull Request đầu tiên |
| P01-OA-002 | Bật branch protection và required CI jobs | Repository Owner/DevOps | Ngay sau khi có remote |
| P01-OA-003 | Chạy Pull Request pass/fail evidence | Developer/DevOps | Trước merge Phase 02 đầu tiên |
| P01-OA-004 | Onboarding dry run từ clean clone | Developer/QA khác | Trước công nhận Phase Exit hoàn chỉnh |
| P01-OA-005 | Browser visual/console review trang System Status và Swagger | Frontend/QA | Khi browser test runtime sẵn sàng |

## 8. Phase 02 Readiness

Source foundation đã sẵn sàng để thiết kế chi tiết Phase 02. Trước khi code authentication, cần chốt token storage, password policy, refresh-token rotation/revocation, account status transition và Teacher Invitation security contract.
