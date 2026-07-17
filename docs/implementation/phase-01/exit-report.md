# Phase 01 Exit Report

## 1. Kết luận

| Thuộc tính | Kết quả |
| --- | --- |
| Phase | `P01 - Project Foundation` |
| Ngày đóng phase | `2026-07-13` |
| Implementation | Hoàn thành |
| Local/clean-clone quality gates | Pass |
| Docker integration | Pass |
| Security dependency audit | Pass, `0 vulnerabilities` |
| Secret scan | Pass trên Pull Request #1 |
| Remote Pull Request CI | Pass, ba required checks thành công |
| Browser verification | Pass trên desktop/mobile cho System Status và Swagger |
| Trạng thái tổng thể | `Completed` |

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
| CI | `.github/workflows/ci.yml` gồm quality gate, dependency audit, secret scan và Pull Request template |
| Documentation | Root README, architecture overview, ADRs và infrastructure notes |

## 3. Automated Verification

`npm run check:ci` đã pass toàn bộ chuỗi:

- ESLint.
- Automated negative lint assertion.
- Prettier format check.
- TypeScript strict typecheck cho Web/API.
- API tests: `7/7` pass.
- Web tests: `6/6` pass.
- API/Web coverage thresholds.
- API production build.
- Web production build bằng Vite.

API coverage đạt 76.92% statements, 48.71% branches, 76% functions và 78.66% lines. Web coverage đạt 81.39% statements, 75% branches, 81.25% functions và 85% lines. Production dependency audit trả `0 vulnerabilities`; CI được cấu hình chặn cả mức `High` và `Critical`. Gitleaks `Secret scan` đã pass trên Pull Request #1.

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
| P01-AC-018 | Pass | Pull Request #1 pass quality, dependency audit và secret scan |
| P01-AC-019 | Pass | Automated negative lint assertion chạy trong `check:ci` |
| P01-AC-020 | Pass | Fresh clone từ `origin/main` cài đặt, test và build thành công |

Kết quả tổng: `20/20` acceptance criteria đạt `Pass`.

## 6. Deviations Và Xử Lý

| Sự kiện | Xử lý |
| --- | --- |
| Host port `27017` đã được sử dụng | Bỏ publish MongoDB ra host; giữ database trong internal Compose network, phù hợp security boundary |
| Browser automation từng bị Windows chặn quyền `AppData` | Chạy lại bằng browser runtime khả dụng; System Status và Swagger đã pass desktop/mobile visual, DOM, overflow và console review |
| Docker daemon không luôn sẵn sàng sau phiên kiểm chứng | Runtime evidence đã được ghi; người phát triển cần mở Docker Desktop trước lệnh Compose |

## 7. Closed Actions

| Action ID | Hành động | Owner | Thời điểm |
| --- | --- | --- | --- |
| P01-OA-001 | Tạo/chọn GitHub remote và push branch `main` | Repository Owner | Done |
| P01-OA-002 | Bật branch protection và required CI jobs | Repository Owner/DevOps | Done |
| P01-OA-003 | Chạy Pull Request evidence cho quality, dependency audit và secret scan | Developer/DevOps | Done, Pull Request #1 |
| P01-OA-004 | Onboarding dry run từ clean clone | Developer/QA | Done, `2026-07-13` |
| P01-OA-005 | Browser visual/console review trang System Status và Swagger | Frontend/QA | Done, `2026-07-13` |
| P01-OA-006 | Đồng bộ coverage artifact, threshold, High audit và negative gate | DevOps/QA | Done |

## 8. Phase 02 Readiness

Source foundation đã sẵn sàng để thiết kế chi tiết Phase 02. Trước khi code authentication, cần chốt token storage, password policy, refresh-token rotation/revocation, account status transition và Teacher Invitation security contract.
