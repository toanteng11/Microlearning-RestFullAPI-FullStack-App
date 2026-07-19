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
| P03-AC-001 | ACTIVE Teacher tạo Classroom với owner chính là actor, default state/settings đúng; client không inject owner/status | API + DB integration | Not Run |
| P03-AC-002 | Non-ACTIVE/wrong-role actor không tạo Classroom và không có partial document/audit                                   | Negative API         | Not Run |
| P03-AC-003 | Teacher list chỉ trả Classroom owned; Student list chỉ trả Classroom có own ACTIVE Enrollment                        | API/repository       | Not Run |
| P03-AC-004 | Detail projection đúng actor; non-owner/non-enrolled không xem được                                                  | Authorization matrix | Not Run |
| P03-AC-005 | Update allowlist + `expectedUpdatedAt` hoạt động; stale update trả 409 và không overwrite                            | API/concurrency      | Not Run |
| P03-AC-006 | Enrollment OPEN/CLOSED và effective global/local settings lưu/hiển thị đúng                                          | API/UI               | Not Run |
| P03-AC-007 | Archive là soft state, giữ Enrollment/Audit, chặn mutation/join mới                                                  | Data/API             | Not Run |
| P03-AC-008 | Search/filter/sort/pagination stable, max limit/allowlist được enforce                                               | Repository/API       | Not Run |

## 3. Class Code And Invite Link

| ID         | Criterion                                                                                | Evidence            | Status  |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------- | ------- |
| P03-AC-009 | Class Code đúng format/entropy/normalization, DB chỉ có HMAC digest và raw trả một lần   | Unit/integration    | Not Run |
| P03-AC-010 | Mỗi Classroom tối đa một Class Code ACTIVE và digest unique                              | Index/concurrency   | Not Run |
| P03-AC-011 | Regenerate atomically vô hiệu code cũ, tạo code mới và audit không raw/digest            | Integration/audit   | Not Run |
| P03-AC-012 | Disable code chặn join; retry disable không tạo side effect/audit trùng                  | API/integration     | Not Run |
| P03-AC-013 | Invite token random/hash-only, expiry đúng và raw link chỉ trả create/regenerate một lần | Unit/integration    | Not Run |
| P03-AC-014 | Mỗi Classroom tối đa một Invite Link ACTIVE; concurrent regenerate có một winner         | Index/concurrency   | Not Run |
| P03-AC-015 | Preview public trả projection tối thiểu/no-store; invalid/disabled/expired an toàn       | API/security        | Not Run |
| P03-AC-016 | Browser xóa token khỏi URL trước preview và không persist/log token sau success/cancel   | Browser/storage/log | Not Run |

## 4. Join And Enrollment

| ID         | Criterion                                                                                       | Evidence               | Status  |
| ---------- | ----------------------------------------------------------------------------------------------- | ---------------------- | ------- |
| P03-AC-017 | Guest join trả 401; wrong role/non-ACTIVE Student bị từ chối, không Enrollment                  | API/DB                 | Not Run |
| P03-AC-018 | Global policy disable thắng Classroom setting và không remove existing member                   | API/integration        | Not Run |
| P03-AC-019 | CLOSED/LOCKED/ARCHIVED Classroom và local method disable chặn join                              | API/integration        | Not Run |
| P03-AC-020 | Valid Class Code tạo đúng một ACTIVE Enrollment `joinedBy=CLASS_CODE`                           | API/DB                 | Not Run |
| P03-AC-021 | Valid Invite Link tạo đúng một ACTIVE Enrollment `joinedBy=INVITE_LINK`                         | API/DB                 | Not Run |
| P03-AC-022 | Join success lưu time/safe source/audit, không raw credential                                   | DB/audit               | Not Run |
| P03-AC-023 | Retry/double click existing ACTIVE trả idempotent result, không duplicate/audit success lần hai | API/concurrency        | Not Run |
| P03-AC-024 | 20 concurrent same Student/Classroom tạo đúng một Enrollment                                    | Real Mongo concurrency | Not Run |
| P03-AC-025 | REMOVED/LEFT/BLOCKED membership không tự rejoin trong Must baseline                             | API/state test         | Not Run |
| P03-AC-026 | Failure ở transaction/audit rollback toàn bộ join; không partial downstream data                | Transaction failure    | Not Run |
| P03-AC-027 | Join preview/context sau Login/Register được revalidate; registration không tự join             | Browser/API            | Not Run |

## 5. Roster, Student Access And Offboarding

| ID         | Criterion                                                                                         | Evidence            | Status  |
| ---------- | ------------------------------------------------------------------------------------------------- | ------------------- | ------- |
| P03-AC-028 | Owner Teacher xem roster paginated/filter/sort với safe Student/membership projection             | API/UI              | Not Run |
| P03-AC-029 | Student/non-owner Teacher không xem roster hoặc remove member                                     | Negative API        | Not Run |
| P03-AC-030 | Remove ACTIVE membership cần reason, transition REMOVED + audit atomically                        | Integration         | Not Run |
| P03-AC-031 | Removed Student mất quyền Classroom ngay; Enrollment/history không bị xóa                         | API/data            | Not Run |
| P03-AC-032 | Student Classroom list/detail chỉ chứa own enrolled scope và có archived/read-only state phù hợp  | API/UI              | Not Run |
| P03-AC-033 | Teacher block/deactivate bị chặn khi còn active owned Classroom; User/session/audit không partial | P02-P03 integration | Not Run |

## 6. Admin Policy And Governance

| ID         | Criterion                                                                                                                                         | Evidence                  | Status  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------- |
| P03-AC-034 | Enrollment Policy singleton bootstrap idempotent và không overwrite configured value                                                              | Integration/CLI           | Not Run |
| P03-AC-035 | Authorized Admin xem/update policy bằng revision/reason; audit old/new đúng                                                                       | API/integration           | Not Run |
| P03-AC-036 | Wrong-role/Admin thiếu permission không xem/update policy/governance                                                                              | Negative API              | Not Run |
| P03-AC-037 | Admin governance list/detail paginated trả owner/status và required ACTIVE `memberCount`; không credential, roster hoặc content count                    | API/UI                    | Not Run |
| P03-AC-038 | Ownership transfer/lock endpoints absent/denied by default; nếu Should được approve và triển khai thì target/state/permission/audit tests phải đủ | Scope/authorization tests | Not Run |

## 7. Security, Contract, UI And Operations

| ID         | Criterion                                                                                            | Evidence                 | Status  |
| ---------- | ---------------------------------------------------------------------------------------------------- | ------------------------ | ------- |
| P03-AC-039 | Join/preview rate limits trả 429 an toàn, không partial và không lộ credential existence             | Security tests           | Not Run |
| P03-AC-040 | Structured logs, AuditLog, DB, browser storage, URL và artifacts không chứa raw Code/Token           | Automated/manual scan    | Not Run |
| P03-AC-041 | OpenAPI parse và exact P03 route-method coverage pass; schemas không expose digest/hash              | Contract tests           | Not Run |
| P03-AC-042 | Teacher/Student/Admin pages có loading/empty/error/forbidden/stale/success, responsive và accessible | Component/browser review | Not Run |
| P03-AC-043 | Playwright Must journeys create/share/join/roster/remove/policy/RBAC pass                            | E2E report               | Not Run |
| P03-AC-044 | Docker build/Compose health/API non-root/seed idempotency/clean-clone pass                           | DevOps evidence          | Not Run |
| P03-AC-045 | Remote CI quality/Mongo/OpenAPI/E2E/audit/secret jobs xanh và exit package traceable                 | PR/Actions/evidence      | Not Run |

## 8. Exit Accounting

Baseline có `45` criteria. Phase không đạt `Completed` nếu còn criterion `Fail`, `Blocked` hoặc `Not Run`. P03-AC-038 chỉ chứng minh scope guard khi Should chưa triển khai; không được dùng kết quả đó để claim ownership transfer/lock đã hoàn thành.
