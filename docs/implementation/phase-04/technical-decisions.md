# Phase 04 Technical Decisions

## 1. Quy Ước

- Status hợp lệ: `Proposed`, `Accepted`, `Superseded`, `Rejected`.
- Toàn bộ 36 decision đã được `Accepted` tại Gate A ngày `2026-07-19` qua PR `#8` và merge commit `66f400d`.
- Sau Gate A, implementation phải tuân theo `Accepted` baseline; thay đổi behavior cần impact analysis.

## 2. Decision Register

| ID | Decision | Baseline | Status |
| --- | --- | --- | --- |
| P04-ADR-001 | Course là aggregate root của cấu trúc học | Module/Lesson tham chiếu Course; access resolve qua Course/Classroom | Accepted |
| P04-ADR-002 | Module boundaries tách theo domain | `courses`, `modules`, `lessons`, `flashcards`, `announcements`, `learning-progress` | Accepted |
| P04-ADR-003 | Module P04 không import Mongoose model P03 | Dùng `ClassroomScopeReader`/`EnrollmentAccessReader` ports | Accepted |
| P04-ADR-004 | Course create luôn `DRAFT` | Publish là explicit status mutation | Accepted |
| P04-ADR-005 | Common content lifecycle | `DRAFT/SCHEDULED/PUBLISHED/UNPUBLISHED/ARCHIVED` cho Course/Lesson/Announcement | Accepted |
| P04-ADR-006 | Module lifecycle giản lược | `DRAFT/PUBLISHED/UNPUBLISHED/ARCHIVED`; không có schedule riêng | Accepted |
| P04-ADR-007 | Flashcard lifecycle | `ACTIVE/ARCHIVED`, kế thừa Lesson | Accepted |
| P04-ADR-008 | Scheduled visibility tính tại read time | `effectiveStatus` không phụ thuộc in-process timer | Accepted |
| P04-ADR-009 | Published/Scheduled Lesson body immutable | Unpublish trước khi sửa body/Flashcard | Accepted |
| P04-ADR-010 | Content authoring dùng Markdown | Raw HTML off; sanitize khi render | Accepted |
| P04-ADR-011 | Concurrency edit dùng `expectedUpdatedAt` | Stale write trả `409 CONCURRENT_MODIFICATION` | Accepted |
| P04-ADR-012 | Structure mutation dùng revision | `structureRevision` CAS + transaction | Accepted |
| P04-ADR-013 | Reorder dùng exact-set | Server kiểm tra đủ/không trùng/đúng parent, order từ `0` | Accepted |
| P04-ADR-014 | Deadline có revision riêng | `deadlineRevision` và immutable change collection | Accepted |
| P04-ADR-015 | Published deadline reset cần reason | Reason trim 10-500 ký tự | Accepted |
| P04-ADR-016 | Must chỉ cho gia hạn | Rút ngắn published deadline trả `409 DEADLINE_SHORTENING_NOT_ALLOWED` | Accepted |
| P04-ADR-017 | Deadline lưu UTC | UI chịu trách nhiệm format local timezone | Accepted |
| P04-ADR-018 | Completion idempotent theo natural key | Unique Student + activity type + activity ID | Accepted |
| P04-ADR-019 | Progress source-of-truth là `learning_progress` | Không dual-write materialized summary trong P04 | Accepted |
| P04-ADR-020 | Dashboard/To-do aggregate on demand | Dataset MVP + index; Phase 06 materialize nếu cần | Accepted |
| P04-ADR-021 | Metric version bắt buộc trong response | `P04_LESSON_COMPLETION_V1` | Accepted |
| P04-ADR-022 | Student navigation do server trả | Ordered `previous/next/backUrl`; client không suy đoán visibility | Accepted |
| P04-ADR-023 | Archive là soft delete | `DELETE` endpoint chuyển status, không xóa document | Accepted |
| P04-ADR-024 | Audit trong cùng transaction cho governance mutation | Publish/unpublish/archive/deadline/reorder; completion dùng progress source + structured event | Accepted |
| P04-ADR-025 | URL resources chỉ `https` | Normalize, length limit, unsafe scheme rejected | Accepted |
| P04-ADR-026 | File upload provider là private GCS | Conditional scope; binary không vào Mongo/local disk | Accepted |
| P04-ADR-027 | Student API chỉ trả published projection | Không trả draft fields/status history/internal IDs thừa | Accepted |
| P04-ADR-028 | Admin content governance read-only | Count/detail qua reader; không grant authoring permission | Accepted |
| P04-ADR-029 | OpenAPI là release contract | Runtime route parity và schema examples là CI gate | Accepted |
| P04-ADR-030 | Seed deterministic và idempotent | Không dùng Production credential; fixed semantic fixture names | Accepted |
| P04-ADR-031 | List API dùng page/limit theo P02/P03 | Allowlisted sort + stable `_id` tie-breaker | Accepted |
| P04-ADR-032 | No cross-domain database cascade | Service orchestration + explicit transaction | Accepted |
| P04-ADR-033 | Error không tiết lộ resource ngoài scope | Object-scope lookup trả generic `RESOURCE_NOT_FOUND` | Accepted |
| P04-ADR-034 | Course publish prerequisite | Có ít nhất một valid published/scheduled required Lesson | Accepted |
| P04-ADR-035 | Flashcard không là progress unit v1 | Lesson completion bao phủ hoạt động Flashcard | Accepted |
| P04-ADR-036 | Cache policy | Private/no-store cho authoring, dashboard, To-do và deadline-sensitive reads | Accepted |

## 3. Architecture Rationale

### 3.1 Modular Monolith

P04 tiếp tục Modular Monolith vì transaction, ownership và local development đơn giản hơn microservice. Boundary vẫn được giữ bằng port để Phase 05 đăng ký activity mới mà không sửa logic Classroom.

### 3.2 On-Demand Read Models

Với dataset chuẩn một Course tối đa khoảng 100 Student và 50 Lesson, aggregation có index đủ cho MVP. Materialization quá sớm tạo thêm event/rebuild/consistency failure modes. Performance test là điều kiện quyết định có chuyển một phần sang Phase 06 hay không.

### 3.3 No Dual Draft Version

P04 không xây versioning editor phức tạp. Một Lesson đã published/scheduled phải unpublish mới sửa nội dung. Quy tắc này rõ với Teacher, đảm bảo Student không thấy nội dung đang sửa và làm `publishedRevision` kiểm chứng được.

## 4. Concurrency Contract

| Mutation | CAS input | Atomic boundary | Conflict |
| --- | --- | --- | --- |
| Edit Course/Module/Lesson/Announcement | `expectedUpdatedAt` | Một document + audit nếu critical | `CONCURRENT_MODIFICATION` |
| Reorder Module/Lesson/Flashcard | `expectedStructureRevision` | Parent + child set + audit | `STRUCTURE_REVISION_CONFLICT` |
| Publish/unpublish/archive | `expectedUpdatedAt` | Content + audit | `CONTENT_STATE_CONFLICT` |
| Set/reset deadline | `expectedDeadlineRevision` | Lesson + deadline history + audit | `DEADLINE_REVISION_CONFLICT` |
| Complete Lesson | Natural unique key | Progress source-of-truth; structured event sau first commit | Retry trả current completion |

Client phải refresh resource và cho người dùng quyết định sau conflict; không tự động ghi đè bằng payload cũ.

## 5. Visibility Resolver

Một service duy nhất tính visibility để tránh API lệch nhau:

```text
Teacher authoring access
  = actor ACTIVE
  + role permission
  + current Classroom ownership
  + Classroom not ARCHIVED

Student learning access
  = actor STUDENT ACTIVE
  + Enrollment ACTIVE
  + Classroom ACTIVE
  + Course effective PUBLISHED
  + Module effective PUBLISHED (if present)
  + Lesson effective PUBLISHED
```

Admin governance access không đồng nghĩa Student visibility và không cấp mutation.

## 6. Scheduled Content

- `SCHEDULED` bắt buộc `scheduledPublishAt > now` tại thời điểm tạo schedule.
- Tại read time, nếu `status=SCHEDULED` và `scheduledPublishAt <= now`, resolver xem content là effectively published.
- Teacher response trả cả `status` và `effectiveStatus` để không gây nhầm.
- Reconciliation job có thể materialize thành `PUBLISHED` và AuditLog trong Conditional Should/Phase 07.
- Nếu không có job, behavior Student vẫn đúng; dashboard không phụ thuộc timer trong process Cloud Run.

## 7. Decision Approval Checklist

- [x] Product Owner chấp thuận phased metric và To-do.
- [x] BA chấp thuận ambiguity resolutions.
- [x] Backend chấp thuận collection/index/transaction boundary.
- [x] Frontend chấp thuận authoring lock và conflict UX.
- [x] Security chấp thuận Markdown/URL/GCS policy.
- [x] QA chấp thuận testability và evidence map.
- [x] Planning PR CI xanh và merge vào `main`.

Approval evidence: PR `#8`, Actions run `29692181077`, merge commit `66f400d`, ngày `2026-07-19`. Mọi thay đổi behavior sau baseline này phải có impact analysis và decision update.
