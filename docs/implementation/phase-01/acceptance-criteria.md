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
| P01-AC-018 | CI thực hiện quality gates | Workflow có sẵn, local equivalent pass | Local pass; remote pending |
| P01-AC-019 | Gate chặn lỗi | Intentional lint failure exit code `1` | Local pass; remote pending |
| P01-AC-020 | Người mới chạy được từ clean clone | README/setup đã có | Independent verification pending |

## 2. Quy tắc Kết Luận

- `Pass`: có evidence local/automated tương ứng.
- `Local pass; remote pending`: implementation đạt nhưng cần Git provider evidence.
- `Independent verification pending`: không tự xác nhận thay cho onboarding reviewer.

Phase 01 đủ điều kiện bắt đầu planning Phase 02, nhưng chưa được đóng governance hoàn toàn cho đến khi P01-AC-018..020 có external evidence.
