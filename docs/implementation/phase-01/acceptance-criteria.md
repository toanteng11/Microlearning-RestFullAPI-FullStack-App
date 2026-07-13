# Phase 01 Acceptance Criteria

## 1. Kết quả

| AC ID | Tiêu chí | Bằng chứng | Trạng thái |
| --- | --- | --- | --- |
| P01-AC-001 | Repository có boundary rõ và không commit secret | Repository tree, `.gitignore`, `.dockerignore` | Pass |
| P01-AC-002 | Node/npm contract thống nhất local/Docker/CI | Version files, engines, Dockerfiles, workflow | Pass |
| P01-AC-003 | Locked install thành công | `npm ci` cài 427 packages | Pass |
| P01-AC-004 | Root commands hoạt động và có tài liệu | Root `package.json`, README | Pass |
| P01-AC-005 | React route chính/404 hoạt động | Component/build/HTTP evidence | Pass |
| P01-AC-006 | Web dùng public API config, không hard-code Production | `public-config.ts`, `.env.example` | Pass |
| P01-AC-007 | API fail fast khi config bắt buộc sai | Environment tests | Pass |
| P01-AC-008 | `/health` public-safe | API test và HTTP smoke | Pass |
| P01-AC-009 | Version endpoint trả artifact identity | API test và HTTP smoke | Pass |
| P01-AC-010 | Unknown route dùng error envelope, không lộ stack | API integration test | Pass |
| P01-AC-011 | Có request ID/structured log/redaction | Middleware và runtime log review | Pass |
| P01-AC-012 | MongoDB lifecycle/readiness có kiểm soát | Mongoose module, `mongodb=UP` | Pass |
| P01-AC-013 | Swagger UI truy cập được | `/api-docs/` HTTP 200 | Pass |
| P01-AC-014 | OpenAPI document hợp lệ | Swagger Parser validation | Pass |
| P01-AC-015 | Web/API image build được | Docker build evidence | Pass |
| P01-AC-016 | Compose Web/API/MongoDB healthy | `docker compose ps` verification | Pass |
| P01-AC-017 | Web tích hợp API/system status | Local/Compose HTTP và UI tests | Pass |
| P01-AC-018 | CI thực hiện quality/security gates | Pull Request #1 pass `Lint, test and build`, `Production dependency audit`, `Secret scan` | Pass |
| P01-AC-019 | Gate chặn lỗi | `verify-negative-lint-gate.mjs` xác nhận intentional violation bị ESLint từ chối; kiểm tra nằm trong `check:ci` | Pass |
| P01-AC-020 | Người mới chạy được từ clean clone | Fresh clone commit `d425e0b`, `npm ci` và full quality gate pass ngày `2026-07-13` | Pass |

## 2. Quy tắc Kết Luận

- `Pass`: có evidence local, independent hoặc remote tương ứng và truy vết được trong `evidence-register.md`.
- Thay đổi làm mất một acceptance evidence phải mở lại tiêu chí liên quan; không giữ trạng thái `Pass` chỉ dựa trên kết quả lịch sử.

Kết quả cuối cùng: `20/20` acceptance criteria đạt `Pass`. Phase 01 được đóng với trạng thái `Completed`.
