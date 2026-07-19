# Phase 04 Phase Plan

## 1. Objective

Tạo một vertical slice Learning Content có thể demo end-to-end: Teacher tạo và publish Course/Lesson có deadline; Student đã enroll mở Lesson, điều hướng và hoàn thành; Teacher xem kết quả cập nhật trên Course Dashboard.

## 2. Entry Criteria

| ID | Điều kiện | Cách xác minh |
| --- | --- | --- |
| P04-ENTRY-001 | Phase 03 đã merge và CI `main` xanh | Merge commit `d9de828` và GitHub Actions evidence |
| P04-ENTRY-002 | Classroom ownership/enrollment API ổn định | P03 `45/45` AC Pass |
| P04-ENTRY-003 | Auth/RBAC/session hoạt động | P02 exit evidence |
| P04-ENTRY-004 | Mongo replica set dùng được cho transaction | Docker/CI transaction job |
| P04-ENTRY-005 | Planning baseline được review | Gate A checklist trong readiness review |

## 3. Gate Model

| Gate | Tên | Exit condition |
| --- | --- | --- |
| A | Planning Baseline | Scope/ADR/API/data/AC/WBS approved, CI docs pass, planning PR merged |
| B | Domain Foundation | Model/index/port/permission/lifecycle tests pass |
| C | Teacher Authoring | Course/Module/Lesson/Flashcard/Announcement API + UI pass |
| D | Student Learning | Visibility/Lesson Player/completion/To-do/dashboard v1 pass |
| E | Phase Exit | Full CI, Docker, E2E, security, concurrency, visual and evidence review pass |

Không đổi trạng thái gate dựa trên cảm nhận. Mỗi gate cần evidence file, command hoặc URL có thể kiểm chứng.

## 4. Workstreams

| Workstream | Kết quả | Owner đề xuất | Dependency |
| --- | --- | --- | --- |
| WS-01 Domain/Data | Aggregate, schema, index, transaction, migration | Backend | Gate A |
| WS-02 Security/API | Permission, visibility, validation, OpenAPI | Backend/Security | WS-01 boundary |
| WS-03 Teacher Web | Authoring, lifecycle, deadline, stream, dashboard | Frontend | API contract |
| WS-04 Student Web | Classwork, Lesson Player, Flashcard, To-do | Frontend | visibility/completion API |
| WS-05 Quality | Unit/integration/component/E2E/a11y/concurrency | QA/Developers | Chạy liên tục |
| WS-06 DevOps/Evidence | Seed, Docker, CI, logs, clean clone, evidence | DevOps/Developers | Runtime slices |

## 5. Milestones

| Milestone | Nội dung hoàn tất | Demo bắt buộc |
| --- | --- | --- |
| M1 - Foundation | Permissions, collections, indexes, readers, lifecycle policy | Unit + Mongo integration |
| M2 - Course Structure | Course/Module CRUD, reorder, list/detail | Teacher tạo Course và Module |
| M3 - Lesson Authoring | Lesson/Flashcard, preview, publish, deadline/history | Teacher publish Lesson hợp lệ |
| M4 - Learning Flow | Student classwork/player/completion/navigation | Student hoàn thành Lesson |
| M5 - Derived Views | To-do/deadline/dashboard/ranking v1 | Hai Student có thứ hạng xác định |
| M6 - Stream/Governance | Announcement, contentCount, optional URL resource | Stream và Admin governance |
| M7 - Exit | Swagger, CI, Docker, E2E, security, visual, evidence | Clean-clone integrated demo |

## 6. Critical Path

```text
Gate A
  -> permission + ownership/enrollment reader
  -> Course/Module/Lesson schema and indexes
  -> lifecycle + visibility policy
  -> Teacher authoring API
  -> Student read API
  -> idempotent completion
  -> To-do/dashboard v1
  -> React journeys
  -> integrated E2E + phase exit
```

Announcement và Conditional Should resource có thể chạy song song sau khi authorization foundation ổn định. Không để chúng chặn Student learning critical path.

## 7. Recommended Pull Request Sequence

| PR | Scope | Không được chứa |
| --- | --- | --- |
| P04-PR01 | Permissions, ports, domain types, schema, indexes, migration tests | UI, broad API |
| P04-PR02 | Course/Module API, lifecycle foundation, OpenAPI | Lesson completion |
| P04-PR03 | Lesson/Flashcard/deadline API, audit, concurrency | Student UI |
| P04-PR04 | Teacher authoring/course dashboard shell | Quiz/Assignment |
| P04-PR05 | Student read/player/completion/navigation | Materialized reporting |
| P04-PR06 | To-do/deadline/dashboard v1, Announcement, governance count | Phase 06 reporting |
| P04-PR07 | Conditional URL resource nếu capacity còn | GCS upload nếu chưa approved |
| P04-PR08 | Hardening, E2E, Docker, seed, evidence và exit docs | Unrelated refactor |

Mỗi PR phải chạy `npm run check:ci`; PR có API phải cập nhật OpenAPI và contract test cùng lúc.

## 8. Parallelization Rules

- Backend schema/index và frontend page shell có thể song song sau khi DTO/OpenAPI examples đã chốt.
- Component tests được viết cùng component, không dồn đến M7.
- Integration test được viết cùng service/repository mutation.
- Student UI chỉ tích hợp với API thật hoặc typed fixture đúng contract; không giữ mock behavior sau merge.
- Reorder, publish, deadline reset và complete phải có concurrency test trước khi mở E2E.
- Một migration/index change chỉ có một owner tại một thời điểm.

## 9. Quality Budget

| Loại | Baseline |
| --- | --- |
| TypeScript | Không `any` không giải thích; strict build pass |
| Unit coverage | Giữ ngưỡng repository hiện tại; policy/service mới có branch tests |
| Integration | Mọi write use case và unique/transaction behavior có Mongo test |
| OpenAPI | Mọi route P04 được validate và có error examples |
| Browser E2E | Teacher publish -> Student complete -> Teacher dashboard ít nhất một journey |
| Accessibility | Keyboard, focus, label, heading, contrast cho critical screens |
| Security | Object-scope negative tests, XSS corpus, unsafe URL, no secret/file leakage |
| Performance | Course Dashboard p95 mục tiêu dưới 2 giây ở dataset chuẩn BA |

## 10. Change Control

1. Yêu cầu mới được map về BA ID hoặc ghi change request.
2. Đánh giá ảnh hưởng tới scope, API, data, security, UI, test và phase dependency.
3. Must regression được sửa trong Phase 04.
4. Should không nằm critical path được defer với lý do và owner.
5. Quiz/Assignment/Grade/notification không được đưa vào P04 chỉ vì UI có vị trí dự kiến.
6. Thay đổi Accepted ADR phải cập nhật decision register và traceability trong cùng PR.

## 11. Exit Criteria

- Tất cả Must AC có trạng thái `Pass` và evidence.
- Không còn Critical/High defect; Medium có disposition và owner.
- OpenAPI runtime route parity pass.
- `npm run check:ci`, Mongo integration, browser E2E, Docker smoke và secret scan pass.
- Reorder/deadline/completion concurrency tests pass.
- Teacher/Student/Admin object authorization negative tests pass.
- Clean clone onboarding và demo seed có thể lặp lại.
- UI được review trên desktop/mobile, không overlap và có keyboard navigation.
- Handoff contracts cho Phase 05-06 được ghi rõ.

## 12. Status Update Rule

| Trạng thái | Điều kiện |
| --- | --- |
| `READY_FOR_REVIEW` | Bộ planning docs hoàn chỉnh, chưa phê duyệt Gate A |
| `READY_TO_CODE` | Gate A approved và planning PR đã merge |
| `IN_PROGRESS` | Có implementation PR đang mở |
| `IMPLEMENTED_LOCALLY` | Local/runtime evidence pass, remote exit chưa đủ |
| `COMPLETED` | Gate E và post-merge `main` CI pass |

Trạng thái hiện tại: `READY_TO_CODE`; Gate A đã được phê duyệt qua PR `#8`, CI `#18` và merge commit `66f400d`.
