# Phase 04 Scope And Deliverables

## 1. Scope Statement

Phase 04 cung cấp năng lực tạo, phát hành và học nội dung microlearning trong một Classroom đã tồn tại. Increment phải tạo giá trị sử dụng thật cho Teacher và Student, đồng thời cung cấp contract ổn định để Phase 05 thêm assessment và Phase 06 thêm analytics mà không viết lại ownership, visibility, deadline hay activity ordering.

## 2. Actor Scope

| Actor | Có trong Phase 04 | Không có trong Phase 04 |
| --- | --- | --- |
| Teacher | Quản lý content của Classroom mình sở hữu; xem lesson-progress v1 | Co-teacher, gradebook đầy đủ, content marketplace |
| Student | Xem content published trong Classroom đang enroll; complete Lesson | Quiz attempt, Assignment submission, Grade |
| Admin | Read-only governance Course/content count | Soạn/sửa content thay Teacher |
| Super Admin | Có permission catalog đầy đủ theo cơ chế hiện tại | Bypass business invariant âm thầm |
| System | Visibility, deadline state, completion, audit, ordering | Notification delivery và background analytics |

## 3. In-Scope Functional Map

### 3.1 Course

- Tạo Course `DRAFT` trong Classroom `ACTIVE` do Teacher sở hữu.
- List theo Classroom, status, search và pagination ổn định.
- Xem Course detail và structure.
- Sửa title/description theo optimistic concurrency.
- Schedule/publish/unpublish/archive theo transition matrix.
- Không hard delete Course có content hoặc progress.

### 3.2 Module

- Tạo, sửa, archive Module/Topic trong Course được sở hữu.
- Reorder toàn danh sách Module bằng exact ID set.
- Module có `displayOrder` liên tục từ `0` và stable `_id` tie-breaker.
- Student chỉ thấy Module hiệu lực và có ít nhất một item nhìn thấy.

### 3.3 Micro Lesson

- Tạo Lesson trong Course, gắn Module tùy chọn.
- Soạn title, Markdown content, estimated minutes và required flag.
- Sửa, preview, schedule, publish, unpublish và archive.
- Reorder Lesson trong cùng container; move giữa Module phải là explicit mutation.
- Published/Scheduled Lesson bị khóa body; phải unpublish trước khi sửa nội dung.

### 3.4 Deadline

- Set deadline trước publish hoặc reset sau publish.
- Published/Scheduled Lesson bắt buộc có deadline hợp lệ.
- Reset sau publish bắt buộc reason; history lưu old/new/actor/time/reason.
- Default cho phép gia hạn; rút ngắn deadline bị chặn trong Must scope.
- To-do, late/missing và Course Dashboard đọc deadline mới ngay sau commit.

### 3.5 Flashcard

- Tạo, sửa, archive và reorder Flashcard trong Lesson.
- `frontText` và `backText` bắt buộc; giới hạn kích thước được validate.
- Flashcard kế thừa visibility của Lesson và ancestor.
- Flashcard không tạo progress record riêng trong Must baseline; hoàn thành Lesson là đơn vị tính progress v1.

### 3.6 Announcement

- Teacher tạo draft, sửa, publish, unpublish và archive Announcement.
- Student chỉ thấy Announcement published của Classroom đang enroll.
- Stream list có pagination, sort mới nhất và empty/loading/error states.
- External link attachment chỉ có khi Conditional Resource scope được bật.

### 3.7 Student Learning

- Classroom Detail có tab Stream và Classwork.
- Course detail hiển thị Module/Lesson theo order và visibility.
- Lesson Player render Markdown đã sanitize, deadline, estimated time và Flashcard.
- Previous/Next dựa trên server-provided ordered navigation, không tự suy đoán bằng DOM.
- Completion mutation idempotent; completed item biến mất khỏi active To-do.
- Deadline View và To-do trong P04 chỉ tổng hợp Lesson.

### 3.8 Teacher Course Dashboard V1

- Course summary: status, deadline range, published/total Lesson count.
- Activity list: Lesson status, required, deadline và completion count.
- Student list: member identity tối thiểu, completion count, percentage, late/missing và last activity.
- Ranking mặc định: `processScore DESC`, `progressPercentage DESC`, `lastActiveAt DESC`, `studentId ASC`.
- `processScore = progressPercentage` với `metricVersion=P04_LESSON_COMPLETION_V1`.

## 4. Conditional Scope

| ID | Capability | Điều kiện kéo vào | Fallback |
| --- | --- | --- | --- |
| P04-CS-001 | External `LINK`/`VIDEO_URL` resource | Must tests xanh trước M6 | Defer P05/P07 |
| P04-CS-002 | GCS `FILE/PDF/IMAGE` upload | Bucket/IAM/CORS/security review approved | Chỉ URL resource |
| P04-CS-003 | Autosave/recovery | Không làm yếu optimistic concurrency | Manual Save + warning |
| P04-CS-004 | Scheduled reconciliation job | Cloud Scheduler/service identity sẵn sàng | Read-time effective status |
| P04-CS-005 | Duplicate/reuse content | Ownership/version policy approved | Teacher tạo mới |

## 5. Explicitly Out Of Scope

- Quiz và Question media.
- Assignment, Submission, private feedback và Grade.
- Per-Student deadline exception; P04 deadline áp dụng toàn Lesson.
- Materialized StudentTodoItem/CourseProgressSummary; P04 dùng aggregation từ source-of-truth.
- Notification creation/delivery khi publish hoặc đổi deadline.
- Admin chỉnh sửa, publish hoặc archive content thay Teacher.
- Public Course catalog và guest content access.
- File lưu trên API filesystem, MongoDB GridFS hoặc Firebase.

## 6. Dependency Contract From Phase 03

| Dependency | Cách dùng trong P04 | Failure behavior |
| --- | --- | --- |
| `ClassroomOwnershipReader` | Xác minh Teacher sở hữu Classroom/Course | `404 RESOURCE_NOT_FOUND` để tránh enumeration |
| Enrollment repository/reader | Xác minh Student `ACTIVE` trong Classroom | `403 ENROLLMENT_REQUIRED` hoặc generic not found theo route |
| Classroom lifecycle | Chỉ `ACTIVE` cho mutation/publish mới | `409 CLASSROOM_NOT_ACTIVE` |
| Auth session/RBAC | Actor identity và coarse permission | `401/403` theo middleware hiện tại |
| Audit writer | Ghi publish/archive/deadline/completion-sensitive action | Transaction rollback nếu Must audit thất bại |
| Mongo UnitOfWork | Mutation đa collection | Không partial state |

Không import trực tiếp Mongoose model của module Phase 03 vào service P04. Tích hợp qua reader/service port đã định nghĩa.

## 7. Handoff Contract To Later Phases

| Consumer | Contract P04 cung cấp |
| --- | --- |
| Phase 05 | `CourseScopeReader`, content ancestor visibility, ordered activity container, deadline policy, `LearningActivityDescriptor` |
| Phase 06 | `LearningProgressReader`, Lesson completion events/source data, To-do query interface, metric version và rebuild rule |
| Phase 07 | Env contract, health/readiness, optional GCS port, log/audit event catalog |
| Phase 08 | Stable seed identities, E2E journeys, acceptance/evidence baseline |

P04 không tạo dependency từ content module sang Quiz/Assignment module chưa tồn tại. Phase 05 đăng ký activity adapter vào contract chung.

## 8. Deliverables

### Source Code

- API modules: `courses`, `modules`, `lessons`, `flashcards`, `announcements`, `learning-progress`, `learning-content` composition router.
- Shared ports/policies: content access, lifecycle, ordering, deadline, activity descriptor.
- React features: `courses`, `lesson-authoring`, `learning-player`, `announcements`, `student-todo`.
- Permission catalog và role capability updates.
- Mongoose indexes/migration verification.

### API And Documentation

- OpenAPI path/schema/security/error examples cho toàn bộ Must route.
- Swagger tags và examples dùng được bởi QA.
- Phase docs, ADR, traceability, evidence và exit report.

### Quality

- Unit/integration/component/E2E/concurrency/security test.
- Demo seed có Teacher, hai Student, Classroom, Course, Lessons, Flashcards, Announcement và progress khác nhau.
- Docker integrated smoke, clean clone và visual review.

## 9. Non-Functional Scope

| Area | Requirement áp dụng |
| --- | --- |
| Security | RBAC + object authorization; sanitized content; URL allowlist; no cross-Classroom access |
| Reliability | Transaction cho reorder/deadline+audit/completion; retry idempotent |
| Performance | Pagination/index; tránh N+1; dashboard p95 dưới 2 giây với dataset chuẩn |
| Accessibility | WCAG-oriented keyboard/focus/label/heading/status semantics |
| Maintainability | Modular boundary, typed DTO, no duplicate lifecycle logic |
| Observability | Structured event, requestId, actor/resource IDs; không log body content không cần thiết |
| Compatibility | Responsive desktop/mobile; current supported browsers của P01 |

## 10. Scope Acceptance

Scope được chấp thuận khi reviewer xác nhận:

1. P04 tạo ra workflow Teacher-to-Student chạy thật.
2. Không có Quiz/Assignment/reporting placeholder được tính như hoàn thành.
3. Course Dashboard/To-do v1 có định nghĩa metric và source data rõ.
4. Upload file không chặn Must scope.
5. Handoff P05/P06 đủ cụ thể để không phá API/data P04.
