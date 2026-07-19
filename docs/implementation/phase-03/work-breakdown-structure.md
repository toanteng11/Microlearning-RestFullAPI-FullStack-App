# Phase 03 Work Breakdown Structure

## 1. Quy Ước

- Status: `Backlog`, `Ready`, `In progress`, `In review`, `Blocked`, `Done`, `Deferred - approved`.
- Estimate là ngày công kỹ thuật tham khảo gồm code + test + docs, không phải lịch cam kết.
- `Done` yêu cầu source/output, test, evidence, Pull Request, remote checks và merge evidence.
- Planning tasks `P03-T001..T010` đã Done theo PR #5, Actions run #11 và merge commit `1e8ad41`. Implementation Must tasks `P03-T011..T076` đã Done theo PR #6, PR run #14, main run #15 và merge commit `7d2c10c`.

## 2. P03-E01 - Baseline And Design

| Task     | Nội dung                                             | Dependency | Output               | Est. | Status    |
| -------- | ---------------------------------------------------- | ---------- | -------------------- | ---- | --------- |
| P03-T001 | Review FR/US/UC/BR/AC Must scope                     | P02        | Scope review         | 0.5  | Done |
| P03-T002 | Review lifecycle Classroom/Enrollment/credential     | T001       | Domain baseline      | 0.5  | Done |
| P03-T003 | Approve Code format/HMAC/pepper                      | T001       | Security decision    | 0.25 | Done |
| P03-T004 | Approve Invite token/expiry/one-time UX              | T001       | Security/UX decision | 0.25 | Done |
| P03-T005 | Approve API catalog and preview transport refinement | T001       | API baseline         | 0.5  | Done |
| P03-T006 | Review data/index/transaction/concurrency            | T002..T005 | Data baseline        | 0.5  | Done |
| P03-T007 | Review permission/object-scope matrix                | T001/T002  | Security baseline    | 0.5  | Done |
| P03-T008 | Review React routes/states/join context              | T004/T005  | UI baseline          | 0.5  | Done |
| P03-T009 | Review test/acceptance/evidence strategy             | T001..T008 | QA baseline          | 0.5  | Done |
| P03-T010 | Gate A approval and planning PR merge                | T001..T009 | READY_TO_CODE        | 0.25 | Done |

## 3. P03-E02 - Runtime And Data Foundation

| Task     | Nội dung                                                | Dependency     | Output                      | Est. | Status  |
| -------- | ------------------------------------------------------- | -------------- | --------------------------- | ---- | ------- |
| P03-T011 | Add P03 environment schema/fail-fast tests              | T003/T004      | Config contract                    | 0.5  | Done  |
| P03-T012 | Add Classroom model/types/indexes                       | T006/T010      | classrooms collection              | 0.75 | Done  |
| P03-T013 | Add Enrollment model/types/indexes                      | T006/T010      | enrollments collection             | 0.75 | Done  |
| P03-T014 | Add ClassCode/InviteLink models/indexes                 | T003/T004/T006 | credential collections             | 1.0  | Done  |
| P03-T015 | Implement shared pagination/search/sort parser          | T005/T006      | Safe list query                    | 0.75 | Done  |
| P03-T016 | Add Classroom repository                                | T012/T015      | CRUD/query port                    | 1.0  | Done  |
| P03-T017 | Add Enrollment/credential repositories                  | T013/T014      | Membership/credential ports        | 1.25 | Done  |
| P03-T018 | Add SystemSetting/EnrollmentPolicy repository/bootstrap | T006           | Policy singleton                   | 0.75 | Done  |
| P03-T019 | Add P03 audit writer event allowlists                   | T007           | Safe audit port                    | 0.5  | Done  |
| P03-T020 | Verify exact indexes/transactions on real rs0           | T012..T019     | Index/transaction evidence          | 1.0  | Done  |

## 4. P03-E03 - Security And Shared Domain

| Task     | Nội dung                                               | Dependency     | Output        | Est. | Status  |
| -------- | ------------------------------------------------------ | -------------- | ------------- | ---- | ------- |
| P03-T021 | Extend permission catalog/role capabilities            | T007/T010      | P03 RBAC      | 0.5  | Done |
| P03-T022 | Implement Class Code normalization/generator/HMAC      | T003/T011      | Code crypto   | 0.75 | Done |
| P03-T023 | Implement Invite token/hash/link builder               | T004/T011      | Link crypto   | 0.75 | Done |
| P03-T024 | Implement policy precedence/lifecycle domain functions | T002/T018      | Domain policy | 0.75 | Done |
| P03-T025 | Add strict P03 path/query/body schemas                 | T005           | Validation    | 0.75 | Done |
| P03-T026 | Harden logger/error/audit credential redaction         | T019/T022/T023 | Safe logs     | 0.75 | Done |
| P03-T027 | Add join/preview rate limiter adapters/tests           | T007/T011      | Abuse control | 0.75 | Done |

## 5. P03-E04 - Classroom API

| Task     | Nội dung                                           | Dependency               | Output              | Est. | Status  |
| -------- | -------------------------------------------------- | ------------------------ | ------------------- | ---- | ------- |
| P03-T028 | Implement create Classroom transaction             | T016/T018/T019/T022/T024 | POST Classroom      | 1.0  | Done |
| P03-T029 | Implement actor-safe Classroom DTO/access resolver | T016/T021/T024           | Projection/access   | 0.75 | Done |
| P03-T030 | Implement Teacher/Student role-scoped lists        | T013/T015/T016/T029      | GET Classroom list  | 1.0  | Done |
| P03-T031 | Implement Classroom detail                         | T029/T030                | GET detail          | 0.5  | Done |
| P03-T032 | Implement Enrollment Policy GET/PATCH              | T018/T019/T021/T024      | Admin policy API    | 1.0  | Done |
| P03-T033 | Implement Admin governance list/detail             | T015/T016/T021           | Admin Classroom API | 1.0  | Done |
| P03-T034 | Implement Classroom update/settings CAS            | T016/T019/T024/T025      | PATCH APIs          | 1.0  | Done |
| P03-T035 | Implement archive/open/close rules                 | T024/T034                | Must lifecycle APIs | 0.75 | Done |
| P03-T036 | Add Classroom/policy/governance API tests          | T028..T035               | API evidence        | 1.25 | Done |

## 6. P03-E05 - Credentials, Join And Roster

| Task     | Nội dung                                          | Dependency               | Output                     | Est. | Status  |
| -------- | ------------------------------------------------- | ------------------------ | -------------------------- | ---- | ------- |
| P03-T037 | Implement Class Code metadata endpoint            | T017/T021/T022/T029      | Safe metadata              | 0.5  | Done |
| P03-T038 | Implement Code regenerate transaction             | T017/T019/T022/T024      | Raw-once code API          | 1.0  | Done |
| P03-T039 | Implement Code disable/idempotency                | T017/T019/T024           | Disable API                | 0.5  | Done |
| P03-T040 | Add Code lifecycle/concurrency tests              | T037..T039               | Code evidence              | 1.0  | Done |
| P03-T041 | Implement Invite list/create                      | T017/T019/T023/T024      | Invite APIs                | 1.0  | Done |
| P03-T042 | Implement Invite regenerate/disable/expiry        | T041                     | Lifecycle APIs             | 1.0  | Done |
| P03-T043 | Implement public Invite preview                   | T023/T024/T025/T027/T042 | Preview API                | 0.75 | Done |
| P03-T044 | Add Invite lifecycle/redaction/concurrency tests  | T041..T043               | Invite evidence            | 1.25 | Done |
| P03-T045 | Implement shared transactional join service       | T013/T017..T027/T029     | Join domain                | 1.5  | Done |
| P03-T046 | Implement roster query/pagination/projection      | T013/T015/T017/T029      | Roster API                 | 1.0  | Done |
| P03-T047 | Implement Student removal transaction             | T019/T024/T046           | Remove API                 | 0.75 | Done |
| P03-T048 | Implement join-by-code/token routes/error mapping | T025/T027/T043/T045      | Join APIs                  | 0.75 | Done |
| P03-T049 | Add join/roster/rollback/race integration tests   | T045..T048               | `20x` concurrency evidence | 1.75 | Done |

## 7. P03-E06 - Governance And P02 Integration

| Task     | Nội dung                                             | Dependency     | Output                 | Est. | Status  |
| -------- | ---------------------------------------------------- | -------------- | ---------------------- | ---- | ------- |
| P03-T050 | Add policy update audit/revision conflict tests      | T032/T036      | Admin policy evidence  | 0.5  | Done |
| P03-T051 | Add governance projection/authorization tests        | T033/T036      | Governance evidence    | 0.5  | Done |
| P03-T052 | Define ClassroomOwnershipReader port                 | T016           | Cross-module port      | 0.25 | Done |
| P03-T053 | Integrate Teacher offboarding guard into Admin Users | T052           | BR-100 guard           | 0.75 | Done |
| P03-T054 | Add offboarding atomic/negative tests                | T053           | Integration evidence   | 0.75 | Done |
| P03-T055 | Implement ownership transfer/lock if Should approved | T033/T052/T053 | Conditional governance | 1.25 | Deferred - approved |

## 8. P03-E07 - React Experiences

| Task     | Nội dung                                          | Dependency                | Output                | Est. | Status  |
| -------- | ------------------------------------------------- | ------------------------- | --------------------- | ---- | ------- |
| P03-T056 | Add typed P03 API adapters/query keys/routes      | T005/T008                 | Frontend foundation   | 0.75 | Done |
| P03-T057 | Implement Teacher Classroom dashboard/list/create | T028/T030/T056            | Teacher pages         | 1.5  | Done |
| P03-T058 | Implement Teacher detail/settings/archive         | T031/T034/T035/T056       | Detail/settings pages | 1.5  | Done |
| P03-T059 | Implement Class Code/roster/remove UI             | T037..T040/T046/T047/T056 | Code/People pages     | 1.5  | Done |
| P03-T060 | Implement Invite Link management UI               | T041..T044/T056           | Invite settings       | 1.25 | Done |
| P03-T061 | Implement Join By Code page                       | T048/T056                 | Student Code flow     | 0.75 | Done |
| P03-T062 | Implement secure join context/token cleanup       | T008/T043/T056            | Join coordinator      | 1.0  | Done |
| P03-T063 | Implement Invite preview/auth/resume page         | T043/T048/T062            | Invite flow           | 1.25 | Done |
| P03-T064 | Implement Student Classroom list/detail           | T030/T031/T056            | Student pages         | 1.0  | Done |
| P03-T065 | Implement roster/table mobile/navigation states   | T046/T059                 | Responsive roster     | 0.75 | Done |
| P03-T066 | Implement Admin Enrollment Policy page            | T032/T056                 | Admin policy UI       | 0.75 | Done |
| P03-T067 | Implement Admin governance list/detail            | T033/T056                 | Admin governance UI   | 1.0  | Done |

## 9. P03-E08 - Quality, DevOps And Exit

| Task     | Nội dung                                         | Dependency           | Output                   | Est. | Status  |
| -------- | ------------------------------------------------ | -------------------- | ------------------------ | ---- | ------- |
| P03-T068 | Complete OpenAPI P03 schemas/operations          | T028..T055           | Swagger contract         | 1.25 | Done |
| P03-T069 | Add exact route/OpenAPI/no-secret contract tests | T068                 | Contract evidence        | 0.75 | Done |
| P03-T070 | Add React component/authorization/state tests    | T057..T067           | Web test evidence        | 1.5  | Done |
| P03-T071 | Add P03 synthetic seed/runtime fixture           | T012..T018/T022/T023 | Idempotent fixtures      | 1.0  | Done |
| P03-T072 | Add Playwright P03 critical journeys             | T049/T057..T071      | Browser E2E              | 1.5  | Done |
| P03-T073 | Extend CI Mongo/OpenAPI/E2E/security gates       | T049/T069/T072       | Remote gates             | 1.0  | Done |
| P03-T074 | Run Docker/browser/accessibility/log scan        | T071..T073           | Manual evidence          | 1.0  | Done |
| P03-T075 | Run clean-clone onboarding rehearsal             | T073/T074            | Reproducibility evidence | 0.75 | Done |
| P03-T076 | Update AC/traceability/risk/evidence/exit report | T074/T075            | Exit package             | 0.75 | Done |

## 10. Critical Path

```text
T001..T010
  -> T011..T020
  -> T021..T027
  -> T028/T029/T034
  -> T038/T041/T043/T045
  -> T048/T049
  -> T056/T062/T063 + T057..T067
  -> T068/T072/T073/T074/T075/T076
```

## 11. Completion Accounting

Baseline có `75` Must tasks và `1` Conditional Should task (`P03-T055`). Hiện tại `75/75` Must tasks đã `Done` và repository Definition of Done đã đạt. T055 là `Deferred - approved`, nằm ngoài Must completion denominator và không được claim là implemented.
