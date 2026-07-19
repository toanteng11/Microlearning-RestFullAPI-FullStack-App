# Phase 03 Acceptance Criteria

## 1. Quy Ước

| Status    | Ý nghĩa                                                  |
| --------- | -------------------------------------------------------- |
| `Not Run` | Chưa có implementation/evidence thực thi                 |
| `Pass`    | Behavior, data, security side effect và evidence đều đạt |
| `Fail`    | Đã chạy nhưng expected result không đạt                  |
| `Blocked` | Dependency bên ngoài cụ thể, có owner/next action        |

Planning baseline không được đánh dấu `Pass`. Mỗi criterion Pass cần file/test/URL/evidence truy ngược tới commit.

## 2. Classroom Lifecycle

| ID         | Criterion                                                                                                            | Evidence             | Status  |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | -------------------- | ------- |
| P03-AC-001 | ACTIVE Teacher tạo Classroom với owner chính là actor, default state/settings đúng; client không inject owner/status | API + DB integration | Pass    |
| P03-AC-002 | Non-ACTIVE/wrong-role actor không tạo Classroom và không có partial document/audit                                   | Negative API         | Pass    |
| P03-AC-003 | Teacher list chỉ trả Classroom owned; Student list chỉ trả Classroom có own ACTIVE Enrollment                        | API/repository       | Pass    |
| P03-AC-004 | Detail projection đúng actor; non-owner/non-enrolled không xem được                                                  | Authorization matrix | Pass    |
| P03-AC-005 | Update allowlist + `expectedUpdatedAt` hoạt động; stale update trả 409 và không overwrite                            | API/concurrency      | Pass    |
| P03-AC-006 | Enrollment OPEN/CLOSED và effective global/local settings lưu/hiển thị đúng                                          | API/UI               | Pass    |
| P03-AC-007 | Archive là soft state, giữ Enrollment/Audit, chặn mutation/join mới                                                  | Data/API             | Pass    |
| P03-AC-008 | Search/filter/sort/pagination stable, max limit/allowlist được enforce                                               | Repository/API       | Pass    |

## 3. Class Code And Invite Link

| ID         | Criterion                                                                                | Evidence            | Status  |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------- | ------- |
| P03-AC-009 | Class Code đúng format/entropy/normalization, DB chỉ có HMAC digest và raw trả một lần   | Unit/integration    | Pass    |
| P03-AC-010 | Mỗi Classroom tối đa một Class Code ACTIVE và digest unique                              | Index/concurrency   | Pass    |
| P03-AC-011 | Regenerate atomically vô hiệu code cũ, tạo code mới và audit không raw/digest            | Integration/audit   | Pass    |
| P03-AC-012 | Disable code chặn join; retry disable không tạo side effect/audit trùng                  | API/integration     | Pass    |
| P03-AC-013 | Invite token random/hash-only, expiry đúng và raw link chỉ trả create/regenerate một lần | Unit/integration    | Pass    |
| P03-AC-014 | Mỗi Classroom tối đa một Invite Link ACTIVE; concurrent regenerate có một winner         | Index/concurrency   | Pass    |
| P03-AC-015 | Preview public trả projection tối thiểu/no-store; invalid/disabled/expired an toàn       | API/security        | Pass    |
| P03-AC-016 | Browser xóa token khỏi URL trước preview và không persist/log token sau success/cancel   | Browser/storage/log | Pass    |

## 4. Join And Enrollment

| ID         | Criterion                                                                                       | Evidence               | Status  |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------- | ------- |
| P03-AC-017 | Guest join trả 401; wrong role/non-ACTIVE Student bị từ chối, không Enrollment                  | API/DB                 | Pass    |
| P03-AC-018 | Global policy disable thắng Classroom setting và không remove existing member                   | API/integration        | Pass    |
| P03-AC-019 | CLOSED/LOCKED/ARCHIVED Classroom và local method disable chặn join                              | API/integration        | Pass    |
| P03-AC-020 | Valid Class Code tạo đúng một ACTIVE Enrollment `joinedBy=CLASS_CODE`                           | API/DB                 | Pass    |
| P03-AC-021 | Valid Invite Link tạo đúng một ACTIVE Enrollment `joinedBy=INVITE_LINK`                         | API/DB                 | Pass    |
| P03-AC-022 | Join success lưu time/safe source/audit, không raw credential                                   | DB/audit               | Pass    |
| P03-AC-023 | Retry/double click existing ACTIVE trả idempotent result, không duplicate/audit success lần hai | API/concurrency        | Pass    |
| P03-AC-024 | 20 concurrent same Student/Classroom tạo đúng một Enrollment                                    | Real Mongo concurrency | Pass    |
| P03-AC-025 | REMOVED/LEFT/BLOCKED membership không tự rejoin trong Must baseline                             | API/state test         | Pass    |
| P03-AC-026 | Failure ở transaction/audit rollback toàn bộ join; không partial downstream data                | Transaction failure    | Pass    |
| P03-AC-027 | Join preview/context sau Login/Register được revalidate; registration không tự join             | Browser/API            | Pass    |

## 5. Roster, Student Access And Offboarding

| ID         | Criterion                                                                                         | Evidence            | Status  |
| ---------- | ------------------------------------------------------------------------------------------------- | ------------------- | ------- |
| P03-AC-028 | Owner Teacher xem roster paginated/filter/sort với safe Student/membership projection             | API/UI              | Pass    |
| P03-AC-029 | Student/non-owner Teacher không xem roster hoặc remove member                                     | Negative API        | Pass    |
| P03-AC-030 | Remove ACTIVE membership cần reason, transition REMOVED + audit atomically                        | Integration         | Pass    |
| P03-AC-031 | Removed Student mất quyền Classroom ngay; Enrollment/history không bị xóa                         | API/data            | Pass    |
| P03-AC-032 | Student Classroom list/detail chỉ chứa own enrolled scope và có archived/read-only state phù hợp  | API/UI              | Pass    |
| P03-AC-033 | Teacher block/deactivate bị chặn khi còn active owned Classroom; User/session/audit không partial | P02-P03 integration | Pass    |

## 6. Admin Policy And Governance

| ID         | Criterion                                                                                                                                         | Evidence                  | Status  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------- |
| P03-AC-034 | Enrollment Policy singleton bootstrap idempotent và không overwrite configured value                                                              | Integration/CLI           | Pass    |
| P03-AC-035 | Authorized Admin xem/update policy bằng revision/reason; audit old/new đúng                                                                       | API/integration           | Pass    |
| P03-AC-036 | Wrong-role/Admin thiếu permission không xem/update policy/governance                                                                              | Negative API              | Pass    |
| P03-AC-037 | Admin governance list/detail paginated trả owner/status và required ACTIVE `memberCount`; không credential, roster hoặc content count                    | API/UI                    | Pass    |
| P03-AC-038 | Ownership transfer/lock endpoints absent/denied by default; nếu Should được approve và triển khai thì target/state/permission/audit tests phải đủ | Scope/authorization tests | Pass    |

## 7. Security, Contract, UI And Operations

| ID         | Criterion                                                                                            | Evidence                 | Status  |
| ---------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ------- |
| P03-AC-039 | Join/preview rate limits trả 429 an toàn, không partial và không lộ credential existence             | Security tests           | Pass    |
| P03-AC-040 | Structured logs, AuditLog, DB, browser storage, URL và artifacts không chứa raw Code/Token           | Automated/manual scan    | Pass    |
| P03-AC-041 | OpenAPI parse và exact P03 route-method coverage pass; schemas không expose digest/hash              | Contract tests           | Pass    |
| P03-AC-042 | Teacher/Student/Admin pages có loading/empty/error/forbidden/stale/success, responsive và accessible | Component/browser review | Pass    |
| P03-AC-043 | Playwright Must journeys create/share/join/roster/remove/policy/RBAC pass                            | E2E report               | Pass    |
| P03-AC-044 | Docker build/Compose health/API non-root/seed idempotency/clean-clone pass                           | DevOps evidence          | Pass    |
| P03-AC-045 | Remote CI quality/Mongo/OpenAPI/E2E/audit/secret jobs xanh và exit package traceable                 | PR/Actions/evidence      | Not Run |

## 8. Exit Accounting

Baseline có `45` criteria. Kết quả local ngày `2026-07-19` là `44 Pass`, `0 Fail`, `0 Blocked`, `1 Not Run`. `P03-AC-045` chỉ được đổi sang `Pass` sau khi có Pull Request, URL GitHub Actions xanh và reviewer sign-off thật.

P03-AC-038 chỉ xác nhận các endpoint Conditional Should vẫn absent/denied đúng baseline; kết quả này không claim ownership transfer hoặc Admin lock đã được triển khai. Phase hiện là `LOCAL_EXIT_CANDIDATE`, chưa phải `Completed`.
