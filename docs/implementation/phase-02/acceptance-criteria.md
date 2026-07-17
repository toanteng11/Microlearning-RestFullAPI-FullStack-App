# Phase 02 Acceptance Criteria

## 0. Kết quả thực thi

| Thuộc tính | Giá trị |
| --- | --- |
| Ngày kiểm chứng local | `2026-07-17` |
| Branch/commit code | `phase-02-quality-release` / `ff0e5fd` |
| Kết quả | `39/39 Pass`; local và remote required checks đều đạt |
| Remote evidence | [PR #4](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/4), [Actions run #8](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29577811819) |
| Hồ sơ chi tiết | `phase-exit-evidence.md`, `evidence-register.md` |

`Pass` dưới đây có nghĩa là behavior, trạng thái dữ liệu và side effect bảo mật đều đã được kiểm chứng. `P02-AC-033` dùng trực tiếp GitHub Actions run gắn với Pull Request, không dùng local result thay thế.

## 1. Authentication And Profile

| AC ID | Tiêu chí | Evidence bắt buộc | Status |
| --- | --- | --- | --- |
| P02-AC-001 | Register hợp lệ tạo đúng một `STUDENT ACTIVE`, hash password, không session/Enrollment | API + DB integration | Pass |
| P02-AC-002 | Register từ chối role/status injection, duplicate email và invalid input, không partial User | Negative API/DB test | Pass |
| P02-AC-003 | Password boundary 11/12/128/129 và space đầu/cuối đúng baseline | Unit/API test | Pass |
| P02-AC-004 | ACTIVE User login nhận access JWT + refresh cookie và đúng role context | API/browser evidence | Pass |
| P02-AC-005 | Invalid credential không enumerate account; 5 failures/15m tạo cooldown 15m | Security test | Pass |
| P02-AC-006 | PENDING/INACTIVE/BLOCKED/DELETED không login hoặc gọi protected API | Status matrix test | Pass |
| P02-AC-007 | Refresh rotate token; replay ngoài grace revoke family và bearer family bị từ chối | Integration/security test | Pass |
| P02-AC-008 | Logout revoke family, clear cookie; old refresh và bearer family không dùng protected API được | API/browser test | Pass |
| P02-AC-009 | Access token không nằm trong persistent browser storage; cookie có đúng attributes | Browser inspection/E2E | Pass |
| P02-AC-010 | `/users/me` chỉ trả own safe projection; profile update không đổi email/role/status | API/component test | Pass |

## 2. RBAC And User Governance

| AC ID | Tiêu chí | Evidence bắt buộc | Status |
| --- | --- | --- | --- |
| P02-AC-011 | Backend kiểm User ACTIVE + permission cho mọi protected P02 API | Route/negative matrix | Pass |
| P02-AC-012 | Student/Teacher gọi Admin API bị từ chối và không nhận list/detail data | Direct API tests | Pass |
| P02-AC-013 | Student List chỉ có STUDENT; Teacher List chỉ TEACHER; Admin List chỉ ADMIN/SUPER_ADMIN | Seeded list tests | Pass |
| P02-AC-014 | List pagination/filter/search/sort chạy server-side, max limit và stable ordering | API/UI tests | Pass |
| P02-AC-015 | List/detail không expose passwordHash/token/session/security metadata | Projection/security test | Pass |
| P02-AC-016 | Status transition hợp lệ revoke session và ghi AuditLog atomically | Transaction test | Pass |
| P02-AC-017 | Self-escalation, Admin-over-SuperAdmin và final Super Admin removal bị chặn trong normal path | Negative governance test | Pass |
| P02-AC-018 | Admin list/detail UI có loading/empty/filter-empty/error/forbidden và giữ Back context | Component/browser review | Pass |

## 3. Teacher Invitation

| AC ID | Tiêu chí | Evidence bắt buộc | Status |
| --- | --- | --- | --- |
| P02-AC-019 | Authorized Admin tạo PENDING/MANUAL_COPY invitation với expiry và nhận link one-time | API/UI/DB test | Pass |
| P02-AC-020 | DB/list/log/audit không chứa raw token/link; list không phục hồi link cũ | Security inspection | Pass |
| P02-AC-021 | UI copy link có feedback, không auto-email/log token và ghi copy event idempotent sau clipboard success | Browser/API/log review | Pass |
| P02-AC-022 | Preview POST-body chỉ trả metadata tối thiểu; user-facing query được xóa và API/log không chứa raw token | API/browser/log test | Pass |
| P02-AC-023 | Valid accept tạo TEACHER ACTIVE, consume invitation và audit trong một transaction | Transaction/API test | Pass |
| P02-AC-024 | Expired/revoked/accepted/mismatch invitation không tạo partial Teacher | State matrix test | Pass |
| P02-AC-025 | Concurrent accept chỉ tạo một Teacher và một accepted state | Concurrency test | Pass |
| P02-AC-026 | Revoke chỉ áp dụng PENDING hợp lệ, có reason/audit và token không dùng lại | API/DB test | Pass |

## 4. API, Data, DevOps And UX

| AC ID | Tiêu chí | Evidence bắt buộc | Status |
| --- | --- | --- | --- |
| P02-AC-027 | Mọi endpoint P02 có OpenAPI contract, security, schema, error và example | Parser/route coverage | Pass |
| P02-AC-028 | Error envelope nhất quán, có requestId phù hợp và không stack/secret | API error tests | Pass |
| P02-AC-029 | Mongo Local/CI là replica set, readiness/transaction integration pass | Compose/CI evidence | Pass |
| P02-AC-030 | Index bắt buộc tồn tại và duplicate/query behavior đúng | Index integration test | Pass |
| P02-AC-031 | Bootstrap Admin chủ động/idempotent, password không qua argument/log | CLI test/review | Pass |
| P02-AC-032 | Docker images build, Compose healthy, API non-root và auth smoke pass | DevOps evidence | Pass |
| P02-AC-033 | CI required quality/integration/E2E/security/OpenAPI jobs pass | Remote CI URL/artifacts | Pass |
| P02-AC-034 | Login/Register/Profile/Admin/Invitation responsive, accessible và không overlap | Browser screenshots/checks | Pass |
| P02-AC-035 | Clean clone có thể install, configure, init replica set, bootstrap/seed và chạy P02 demo | Onboarding record | Pass |
| P02-AC-036 | Traceability, risk, checklist, evidence và exit report đầy đủ; P03 readiness rõ | Document review | Pass |
| P02-AC-037 | Concurrent create cùng normalized Teacher email chỉ tạo một PENDING invitation nhờ unique partial index | Concurrency/index test | Pass |
| P02-AC-038 | Hai tab refresh đồng thời không tự revoke trong grace; replay ngoài grace vẫn revoke family | Browser/API concurrency test | Pass |
| P02-AC-039 | Concurrent block/demote Super Admin không thể làm hệ thống mất active Super Admin cuối cùng | Governance transaction test | Pass |

## 5. Kết luận phase

- `Pass`: expected behavior, data state, security side effect và evidence cùng đạt.
- `Fail`: một phần expected result sai hoặc có data/security regression.
- `Blocked`: dependency bên ngoài cụ thể, có owner/next action; không dùng thay cho `Not Run`.
- Must criterion không được waiver nếu làm lộ credential/token, cho privilege escalation hoặc tạo data partial.

Phase hiện ở trạng thái `Ready for sign-off`: `39/39` criterion đạt `Pass`, không có criterion `Fail/Blocked/Not Run`. Chỉ chuyển trạng thái quản trị thành `Completed` sau khi exit report được reviewer có thẩm quyền ký và Pull Request được merge theo branch protection.
