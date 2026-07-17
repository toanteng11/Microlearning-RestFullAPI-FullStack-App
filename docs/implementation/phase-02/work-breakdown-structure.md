# Phase 02 Work Breakdown Structure

## 1. Quy ước

- Status: `Ready` khi dependency đã đủ, `In progress` khi đang triển khai, `Backlog` khi còn phụ thuộc và `Done` khi có PR/test/evidence hoàn chỉnh.
- Estimate là ngày công tham khảo gồm code + test + tài liệu của task, chưa gồm thời gian chờ review.
- Mỗi task Done cần PR/commit, test và evidence theo Definition of Done.
- Gate A đã đạt `Pass`; P02-T001..T009 được đóng sau khi planning baseline merge trong PR-02P (`a8b6b47`).

### Execution Snapshot - 2026-07-17

Các trạng thái trong bảng chi tiết bên dưới là planning baseline tại thời điểm bắt đầu phase. Kết quả thực thi hiện tại supersede cột baseline như sau:

| Phạm vi task | Kết quả hiện tại | Evidence |
| --- | --- | --- |
| `P02-T001..T064`, `P02-T066`, `P02-T068` | Done/local verified | Source, unit/integration/component/E2E và clean-clone pass |
| `P02-T065` | Implemented/local verified; remote run pending | `.github/workflows/ci.yml`; chờ GitHub Actions URL |
| `P02-T067` | Done locally; formal sign-off pending | Acceptance/evidence/risk/exit docs đã cập nhật |

Implementation accounting là `68/68` task đã có output local. Phase accounting vẫn là `38/39` AC vì remote CI không được thay bằng local result.

## 2. P02-E01 - Baseline And Design

| Task     | Nội dung                                         | Dependency | Output                | Est. | Status |
| -------- | ------------------------------------------------ | ---------- | --------------------- | ---- | ------ |
| P02-T001 | Review BA FR-001..010/064/065/067/069, NFR và AC | P01        | Review record         | 0.5  | Done   |
| P02-T002 | Phê duyệt token/cookie/session decision          | T001       | Security baseline     | 0.5  | Done   |
| P02-T003 | Phê duyệt password/rate/cooldown decision        | T001       | Security baseline     | 0.25 | Done   |
| P02-T004 | Review role/permission/status transition         | T001       | RBAC matrix           | 0.5  | Done   |
| P02-T005 | Review API schemas/errors/list query             | T001       | API baseline          | 0.5  | Done   |
| P02-T006 | Review collection/index/transaction              | T001       | Data baseline         | 0.5  | Done   |
| P02-T007 | Threat model auth/invitation/admin actions       | T002..T006 | Threat-control record | 0.5  | Done   |
| P02-T008 | Chốt raw invitation link one-time UX             | T002/T005  | BA/UI decision        | 0.25 | Done   |
| P02-T009 | Chốt bootstrap Super Admin operation             | T004/T006  | Bootstrap decision    | 0.25 | Done   |

## 3. P02-E02 - Runtime And Data Foundation

| Task     | Nội dung                                                     | Dependency | Output                                  | Est. | Status      |
| -------- | ------------------------------------------------------------ | ---------- | --------------------------------------- | ---- | ----------- |
| P02-T010 | Thêm auth/env schema và fail-fast tests                      | T002/T003  | Config contract                         | 0.75 | In progress |
| P02-T011 | Chuyển Local Mongo sang single-node replica set              | T006       | Compose runtime                         | 0.75 | In progress |
| P02-T012 | Thêm replica-set init/readiness                              | T011       | Init + health                           | 0.5  | In progress |
| P02-T013 | Tạo User schema/index/repository                             | T006       | `users` persistence                     | 1.0  | Ready       |
| P02-T014 | Tạo AuthSession schema/index/repository                      | T006       | session persistence                     | 1.0  | Ready       |
| P02-T015 | Tạo AuthLoginState schema/index/repository                   | T003/T006  | cooldown persistence                    | 0.75 | Ready       |
| P02-T016 | Tạo TeacherInvitation schema/unique partial index/repository | T006/T008  | concurrency-safe invitation persistence | 1.0  | Ready       |
| P02-T017 | Tạo AuditLog schema/repository append-only                   | T006/T007  | audit persistence                       | 0.75 | Ready       |
| P02-T018 | Tạo Mongo Unit of Work + SystemGuard invariant helper        | T011/T012  | transaction/governance port             | 0.75 | Backlog     |
| P02-T019 | Index verification và repository integration harness         | T013..T018 | data tests                              | 1.0  | Backlog     |

## 4. P02-E03 - Security Primitives And Middleware

| Task     | Nội dung                                                            | Dependency          | Output                  | Est. | Status  |
| -------- | ------------------------------------------------------------------- | ------------------- | ----------------------- | ---- | ------- |
| P02-T020 | Email/full-name normalization utilities                             | T003                | shared identity utility | 0.25 | Ready   |
| P02-T021 | Password policy + Argon2id adapter/benchmark                        | T003/T010           | password service        | 0.75 | Backlog |
| P02-T022 | Opaque token/hash generator                                         | T002                | token utility           | 0.5  | Ready   |
| P02-T023 | JWT signer/verifier issuer/audience/clock                           | T002/T010           | access token service    | 0.75 | Backlog |
| P02-T024 | Refresh cookie builder/clearer                                      | T002/T010           | cookie policy           | 0.5  | Backlog |
| P02-T025 | Origin/Referer guard                                                | T002/T010           | CSRF boundary           | 0.5  | Backlog |
| P02-T026 | Permission catalog + auth context                                   | T004                | typed RBAC              | 0.75 | Ready   |
| P02-T027 | Authenticate/User ACTIVE/session-family ACTIVE/authorize middleware | T013/T014/T023/T026 | protected API guards    | 1.0  | Backlog |
| P02-T028 | IP limiter + identity cooldown service                              | T015/T003           | abuse controls          | 1.0  | Backlog |
| P02-T029 | Request/error/audit redaction hardening                             | T007/T022           | safe logs               | 0.75 | Backlog |

## 5. P02-E04 - Authentication And Profile API

| Task     | Nội dung                                           | Dependency           | Output                  | Est. | Status  |
| -------- | -------------------------------------------------- | -------------------- | ----------------------- | ---- | ------- |
| P02-T030 | Implement Student registration service/API         | T013/T020/T021/T028  | register endpoint       | 1.0  | Backlog |
| P02-T031 | Implement login/session creation                   | T013..T024/T028      | login endpoint          | 1.25 | Backlog |
| P02-T032 | Implement refresh rotation/race grace/reuse revoke | T014/T018/T022..T025 | refresh endpoint        | 1.5  | Backlog |
| P02-T033 | Implement logout/idempotent cookie clear           | T014/T024/T025       | logout endpoint         | 0.5  | Backlog |
| P02-T034 | Implement current user/profile APIs                | T027                 | me/profile endpoint     | 0.75 | Backlog |
| P02-T035 | Implement account-wide session revoker port        | T014/T018            | reusable revoke service | 0.5  | Backlog |
| P02-T036 | API tests register/login/refresh/logout/me         | T030..T035           | integration evidence    | 1.5  | Backlog |
| P02-T037 | Concurrency/race/replay/rate boundary tests        | T028/T030..T033      | security evidence       | 1.25 | Backlog |

## 6. P02-E05 - React Authentication

| Task     | Nội dung                                                                       | Dependency         | Output                 | Est. | Status  |
| -------- | ------------------------------------------------------------------------------ | ------------------ | ---------------------- | ---- | ------- |
| P02-T038 | Add Query/Form/Zod/icon dependencies/providers                                 | T005               | frontend foundation    | 0.5  | Ready   |
| P02-T039 | Extend API client/error/single-flight/race retry                               | T031/T032 contract | secure API client      | 1.0  | Backlog |
| P02-T040 | Implement AuthProvider/Web Locks/BroadcastChannel/bootstrap/logout/cache clear | T039               | multi-tab auth state   | 1.0  | Backlog |
| P02-T041 | Implement ProtectedRoute/RoleRoute/Forbidden                                   | T026/T040          | route guards           | 0.75 | Backlog |
| P02-T042 | Implement Login page/role redirect                                             | T031/T039/T040     | Login UI               | 0.75 | Backlog |
| P02-T043 | Implement Register page/success-to-login                                       | T030/T039          | Register UI            | 0.75 | Backlog |
| P02-T044 | Implement Profile page                                                         | T034/T039          | Profile UI             | 0.5  | Backlog |
| P02-T045 | Implement role AppShell/home placeholders                                      | T041               | role navigation        | 0.75 | Backlog |
| P02-T046 | Component/integration auth tests                                               | T040..T045         | frontend test evidence | 1.25 | Backlog |

## 7. P02-E06 - Admin User Management

| Task     | Nội dung                                                            | Dependency          | Output                         | Est. | Status  |
| -------- | ------------------------------------------------------------------- | ------------------- | ------------------------------ | ---- | ------- |
| P02-T047 | Implement list query parser/projection/pagination                   | T013/T026           | list foundation                | 0.75 | Backlog |
| P02-T048 | Implement Student/Teacher/Admin list APIs                           | T027/T047           | three list endpoints           | 1.25 | Backlog |
| P02-T049 | Implement user detail API by target role                            | T027/T047           | detail endpoint                | 0.75 | Backlog |
| P02-T050 | Implement status transition/revoke/audit transaction                | T017/T018/T035/T049 | status endpoint                | 1.25 | Backlog |
| P02-T051 | Implement limited role transition/SystemGuard final-admin invariant | T017/T018/T026/T049 | concurrency-safe role endpoint | 1.0  | Backlog |
| P02-T052 | Implement Admin users entry/list/detail UI                          | T038/T048/T049      | Admin UI                       | 1.5  | Backlog |
| P02-T053 | Implement status/role confirm actions                               | T050/T051/T052      | Admin mutations UI             | 1.0  | Backlog |
| P02-T054 | API/UI negative permission and list separation tests                | T048..T053          | admin test evidence            | 1.25 | Backlog |

## 8. P02-E07 - Teacher Invitation

| Task     | Nội dung                                                   | Dependency                | Output                     | Est. | Status  |
| -------- | ---------------------------------------------------------- | ------------------------- | -------------------------- | ---- | ------- |
| P02-T055 | Implement concurrency-safe invitation create/list/detail   | T016/T017/T018/T022/T027  | Admin invitation APIs      | 1.25 | Backlog |
| P02-T056 | Implement idempotent copy event/revoke/expiry behavior     | T016/T017/T055            | lifecycle APIs             | 0.75 | Backlog |
| P02-T057 | Implement POST-body public preview with token redaction    | T016/T022/T028/T029       | preview API                | 0.75 | Backlog |
| P02-T058 | Implement accept transaction/email/password match          | T013/T016..T018/T021/T022 | accept API                 | 1.5  | Backlog |
| P02-T059 | Implement Admin invitation management UI                   | T038/T055/T056            | create/copy/list/revoke UI | 1.25 | Backlog |
| P02-T060 | Implement Teacher invitation activation UI                 | T038/T057/T058            | activation UI              | 1.0  | Backlog |
| P02-T061 | Invitation create/accept concurrency/state/redaction tests | T055..T060                | invitation evidence        | 1.5  | Backlog |

## 9. P02-E08 - DevOps, Contract And Exit

| Task     | Nội dung                                                | Dependency                         | Output                   | Est. | Status  |
| -------- | ------------------------------------------------------- | ---------------------------------- | ------------------------ | ---- | ------- |
| P02-T062 | Implement secure bootstrap Admin CLI                    | T009/T013/T017/T021                | bootstrap tooling        | 0.75 | Backlog |
| P02-T063 | Implement idempotent synthetic demo/test seed           | T013/T016/T021                     | safe fixtures            | 0.75 | Backlog |
| P02-T064 | Complete OpenAPI P02 + contract tests                   | T030..T058                         | Swagger contract         | 1.25 | Backlog |
| P02-T068 | Add root Playwright config/scripts/Chromium CI harness  | T038/T063                          | deterministic E2E runner | 0.75 | Backlog |
| P02-T065 | Extend CI Mongo replica/integration/auth E2E            | T011/T019/T036/T046/T054/T061/T068 | CI gates                 | 1.25 | Backlog |
| P02-T066 | Run Compose/browser/security/clean-clone review         | T062..T065                         | exit evidence            | 1.5  | Backlog |
| P02-T067 | Update traceability/checklist/risk/evidence/exit report | T066                               | closed documentation     | 0.75 | Backlog |

## 10. Critical Path

```text
T001 -> T002/T003/T004/T006 -> T007
     -> T010/T011/T012/T013/T014/T016/T017/T018
     -> T021/T022/T023/T024/T026/T027/T028
     -> T030/T031/T032/T036/T037
     -> T048/T050 + T055/T058
     -> T054/T061/T064/T068/T065/T066/T067
```

Frontend auth có thể bắt đầu sau contract T005 và chạy song song, nhưng integration exit phụ thuộc API/session thật.

## 11. Completion Accounting

Baseline gồm `68` task với tổng estimate tham khảo `58.0` ngày công kỹ thuật. Estimate không phải lịch cam kết và phải được phân bổ theo capacity thực tế trước khi đặt target date.

Kết quả ngày `2026-07-17`: `68/68` task có implementation/output local; `P02-AC-033` và reviewer sign-off còn chờ Pull Request remote.

Không dùng phần trăm cảm tính. Báo cáo tiến độ gồm:

- Số Must task Done / tổng Must task.
- Milestone nào đã đạt exit signal.
- Acceptance criteria Pass/Fail/Blocked/Not Run.
- Risk/issue đang mở và critical-path impact.
- Evidence đã có/chưa có.
