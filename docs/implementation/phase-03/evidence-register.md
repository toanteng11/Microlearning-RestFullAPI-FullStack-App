# Phase 03 Evidence Register

## 1. Rules

- Không lưu raw Code/Token, cookie, password, secret, Mongo URI hoặc dữ liệu người dùng thật.
- Evidence ghi commit, environment, command/suite và result.
- Screenshot phải che credential/PII; CI link trỏ đúng run/commit.
- Planning evidence không thay implementation evidence.

## 2. Catalog

| Evidence ID      | Nội dung                                    | Expected source          | Status  |
| ---------------- | ------------------------------------------- | ------------------------ | ------- |
| P03-EVD-DOC-001  | Scope/decision/Gate A approval              | PR #5; run #11; merge `1e8ad41` | Complete |
| P03-EVD-DOC-002  | BA/API change record preview POST           | Revision 1.42/DEC-016/ADR-007 | Complete |
| P03-EVD-DATA-001 | Models/exact indexes                        | Real Mongo index test    | Complete (local) |
| P03-EVD-DATA-002 | Enrollment uniqueness/concurrency           | Integration report       | Complete (local) |
| P03-EVD-DATA-003 | Credential active uniqueness/rotation       | Integration report       | Complete (local) |
| P03-EVD-DATA-004 | Transaction rollback                        | Failure injection report | Complete (local) |
| P03-EVD-API-001  | Classroom CRUD/settings/list/detail         | API tests                | Complete (local) |
| P03-EVD-API-002  | Policy/governance                           | API tests                | Complete (local) |
| P03-EVD-API-003  | Class Code lifecycle                        | API/integration tests    | Complete (local) |
| P03-EVD-API-004  | Invite lifecycle/preview                    | API/security tests       | Complete (local) |
| P03-EVD-API-005  | Join Code/Link/idempotency                  | API/concurrency tests    | Complete (local) |
| P03-EVD-API-006  | Roster/remove/offboarding                   | API/integration tests    | Complete (local) |
| P03-EVD-SEC-001  | Role/owner/Enrollment negative matrix       | Direct API tests         | Complete (local) |
| P03-EVD-SEC-002  | DB/log/audit raw credential absence         | Automated/runtime scan   | Complete (local) |
| P03-EVD-SEC-003  | Rate/NoSQL/error safety                     | Security tests           | Complete (local) |
| P03-EVD-WEB-001  | Teacher journeys/component states           | Web tests/E2E            | Complete (local) |
| P03-EVD-WEB-002  | Student Code/Link/list/detail               | Web tests/E2E            | Complete (local) |
| P03-EVD-WEB-003  | Admin policy/governance                     | Web tests/E2E            | Complete (local) |
| P03-EVD-WEB-004  | URL/storage/navigation/accessibility/mobile | Browser review           | Complete (local) |
| P03-EVD-DOC-003  | OpenAPI parse/exact route coverage          | Contract test/Swagger    | Complete (local) |
| P03-EVD-OPS-001  | Docker build/health/non-root                | Compose evidence         | Complete (local) |
| P03-EVD-OPS-002  | Seed/policy bootstrap idempotency           | Command result           | Complete (local) |
| P03-EVD-OPS-003  | Clean Git clone onboarding                  | Rehearsal record         | Complete (local) |
| P03-EVD-OPS-004  | Remote required checks                      | PR/Actions URL           | Complete |
| P03-EVD-DOC-004  | AC + traceability/checklist/exit package    | Exit package             | Complete |

## 3. Local Exit Evidence

- Branch: `feature/phase-03-data-foundation`.
- Runtime: Node.js 24, MongoDB 8 replica set `rs0`, database E2E tách biệt `microlearning-e2e-phase3-final`.
- `npm run check:ci`: Pass từ workspace chính và bản sao source sạch; lint, negative gate, format, typecheck, coverage và production build đều xanh.
- Unit/component: API `85/85`, Web `71/71`.
- Real Mongo integration/concurrency: `35/35`; gồm 20 concurrent join, credential rotation race, stale revision và forced audit failure rollback.
- `npm run test:openapi`: `7/7`; exact `22` Phase 03 operations và no-secret schema pass.
- Playwright Phase 03: `9/9` critical journeys pass.
- Coverage unit: API statements `79.73%`, branches `67.49%`, functions `80.95%`, lines `81.40%`; Web statements `83.41%`, branches `71.05%`, functions `82.37%`, lines `86.85%`.
- Coverage integration: statements `85.37%`, branches `67.14%`, functions `92.85%`, lines `88.02%`.
- Docker API/Web image build Pass; API/Web/Mongo healthy; API chạy UID/GID `1000`.
- Seed lần một tạo `10` users và `8` Phase 03 entities; lần hai reuse đúng `10` và `8`, không duplicate.
- `npm audit --omit=dev --audit-level=high`: `0` vulnerabilities. Runtime log scan không phát hiện raw credential pattern.
- Browser review desktop/mobile xác nhận Teacher roster, Student join/detail và Admin governance/policy không overflow/overlap; console không có error/warning.
- Clean Git clone rehearsal: snapshot sanitized được commit tạm tại `5bf8dbe`, clone sang `C:\tmp\microlearning-phase3-git-clone-20260719`; `npm ci`, `npm run check:ci` và Compose config đều Pass. Repository tạm không chứa `.env`, dependency hoặc artifact cũ và không ảnh hưởng lịch sử repository chính.
- Chi tiết foundation: `runtime-data-foundation-evidence.md`; kết quả tổng hợp: `phase-exit-evidence.md`.
- Remote evidence đã đóng: [PR #6](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/6), [PR run #14](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29689514790), [main run #15](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29689670564) và merge commit `7d2c10c`; cả hai run đều `6/6` jobs success.

## 4. Evidence Quality Gate

- Test artifact traceable to commit/build.
- No Must suite skip/continue-on-error.
- Real Mongo evidence identifies replica set.
- Browser evidence includes desktop/mobile and storage/URL scan.
- Remote CI contains quality, Mongo, OpenAPI, E2E, audit, secret jobs.
- Với dự án cá nhân, repository owner merge là sign-off có thể kiểm chứng. Nếu có reviewer độc lập thì phải lưu name/date/decision; hiện PR #6 không có review submission và tài liệu không suy diễn chữ ký đó.
