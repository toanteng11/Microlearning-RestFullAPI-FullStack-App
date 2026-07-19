# Phase 03 Evidence Register

## 1. Rules

- Không lưu raw Code/Token, cookie, password, secret, Mongo URI hoặc dữ liệu người dùng thật.
- Evidence ghi commit, environment, command/suite và result.
- Screenshot phải che credential/PII; CI link trỏ đúng run/commit.
- Planning evidence không thay implementation evidence.

## 2. Catalog

| Evidence ID      | Nội dung                                    | Expected source          | Status  |
| ---------------- | ------------------------------------------- | ------------------------ | ------- |
| P03-EVD-DOC-001  | Scope/decision/Gate A approval              | Readiness review + planning PR | Partial: review approved; PR merge pending |
| P03-EVD-DOC-002  | BA/API change record preview POST           | Revision 1.41/DEC-016/ADR-007 | Complete |
| P03-EVD-DATA-001 | Models/exact indexes                        | Real Mongo index test    | Pending |
| P03-EVD-DATA-002 | Enrollment uniqueness/concurrency           | Integration report       | Pending |
| P03-EVD-DATA-003 | Credential active uniqueness/rotation       | Integration report       | Pending |
| P03-EVD-DATA-004 | Transaction rollback                        | Failure injection report | Pending |
| P03-EVD-API-001  | Classroom CRUD/settings/list/detail         | API tests                | Pending |
| P03-EVD-API-002  | Policy/governance                           | API tests                | Pending |
| P03-EVD-API-003  | Class Code lifecycle                        | API/integration tests    | Pending |
| P03-EVD-API-004  | Invite lifecycle/preview                    | API/security tests       | Pending |
| P03-EVD-API-005  | Join Code/Link/idempotency                  | API/concurrency tests    | Pending |
| P03-EVD-API-006  | Roster/remove/offboarding                   | API/integration tests    | Pending |
| P03-EVD-SEC-001  | Role/owner/Enrollment negative matrix       | Direct API tests         | Pending |
| P03-EVD-SEC-002  | DB/log/audit raw credential absence         | Automated/runtime scan   | Pending |
| P03-EVD-SEC-003  | Rate/NoSQL/error safety                     | Security tests           | Pending |
| P03-EVD-WEB-001  | Teacher journeys/component states           | Web tests/E2E            | Pending |
| P03-EVD-WEB-002  | Student Code/Link/list/detail               | Web tests/E2E            | Pending |
| P03-EVD-WEB-003  | Admin policy/governance                     | Web tests/E2E            | Pending |
| P03-EVD-WEB-004  | URL/storage/navigation/accessibility/mobile | Browser review           | Pending |
| P03-EVD-DOC-003  | OpenAPI parse/exact route coverage          | Contract test/Swagger    | Pending |
| P03-EVD-OPS-001  | Docker build/health/non-root                | Compose evidence         | Pending |
| P03-EVD-OPS-002  | Seed/policy bootstrap idempotency           | Command result           | Pending |
| P03-EVD-OPS-003  | Clean-clone onboarding                      | Rehearsal record         | Pending |
| P03-EVD-OPS-004  | Remote required checks                      | PR/Actions URL           | Pending |
| P03-EVD-DOC-004  | 45/45 AC + traceability/checklist/exit      | Exit package             | Pending |

## 3. Evidence Quality Gate

- Test artifact traceable to commit/build.
- No Must suite skip/continue-on-error.
- Real Mongo evidence identifies replica set.
- Browser evidence includes desktop/mobile and storage/URL scan.
- Remote CI contains quality, Mongo, OpenAPI, E2E, audit, secret jobs.
- Reviewer/sign-off record is named/date/decision, không chỉ screenshot merge.
