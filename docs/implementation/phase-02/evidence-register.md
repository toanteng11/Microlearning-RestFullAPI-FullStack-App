# Phase 02 Evidence Register

## 1. Quy tắc

File này được cập nhật khi triển khai. Không đưa password, access/refresh token, invitation link, cookie value, Mongo URI hoặc dữ liệu cá nhân thật vào evidence.

## 2. Evidence Catalog

| Evidence ID | Nội dung cần chứng minh | Nguồn dự kiến | Trạng thái | Link/path/result |
| --- | --- | --- | --- | --- |
| P02-EVD-API-001 | Register/login/profile API tests | Vitest/Supertest | Pending | |
| P02-EVD-API-002 | Refresh/logout/reuse tests | Integration report | Pending | |
| P02-EVD-API-003 | Admin user list/status/role tests | Integration report | Pending | |
| P02-EVD-API-004 | Invitation state/concurrency transaction | Integration report | Pending | |
| P02-EVD-API-005 | Pending invitation and final Super Admin concurrency invariants | Transaction/index report | Pending | |
| P02-EVD-DATA-001 | Required indexes and unique constraints | Index verification | Pending | |
| P02-EVD-DATA-002 | Replica set transaction behavior | Mongo/Compose/CI | Pending | |
| P02-EVD-WEB-001 | Login/Register/Profile component tests | Vitest report | Pending | |
| P02-EVD-WEB-002 | Admin lists/invitation component tests | Vitest report | Pending | |
| P02-EVD-WEB-003 | Student/Admin/Teacher E2E journeys | Playwright report | Pending | |
| P02-EVD-WEB-004 | Desktop/mobile/accessibility review | Screenshots/report | Pending | |
| P02-EVD-WEB-005 | Multi-tab refresh and race-grace browser behavior | Playwright trace/report | Pending | |
| P02-EVD-SEC-001 | Password/hash/token DB inspection | Sanitized assertion/report | Pending | |
| P02-EVD-SEC-002 | Cookie attributes and browser storage | Browser security evidence | Pending | |
| P02-EVD-SEC-003 | Negative role/status/permission matrix | Security test report | Pending | |
| P02-EVD-SEC-004 | Rate limit/cooldown boundaries | API test report | Pending | |
| P02-EVD-SEC-005 | Log/AuditLog redaction | Sanitized log assertion | Pending | |
| P02-EVD-DOC-001 | OpenAPI parse and route coverage | CI artifact | Pending | |
| P02-EVD-OPS-001 | Docker build/non-root/Compose health | Command record | Pending | |
| P02-EVD-OPS-002 | Remote CI required checks | GitHub Actions URL | Pending | |
| P02-EVD-OPS-003 | Bootstrap/seed idempotency | Sanitized command result | Pending | |
| P02-EVD-OPS-004 | Clean-clone onboarding | Independent record | Pending | |
| P02-EVD-DOC-002 | Traceability/checklist/exit approvals | Document review | Pending | |
| P02-EVD-DOC-003 | Development readiness Gate A baseline | Readiness review | Complete | `development-readiness-review.md` (`2026-07-15`) |

## 3. Evidence Quality

- Command evidence ghi commit SHA, environment và result chính.
- Screenshot che token/cookie value/email cá nhân; chỉ giữ attributes/behavior cần thiết.
- CI evidence link đúng run/PR, không chỉ Actions homepage.
- Test artifact phải truy ngược được tới build/commit.
- DB evidence dùng synthetic data và chỉ show hash presence/type, không raw credential.
