# Phase 04 Backend Implementation Plan

## 1. Goal

Triển khai API Learning Content theo các vertical slice nhỏ, giữ hệ thống build/test được sau từng PR. Mỗi route phải đi đủ `schema -> service -> repository -> DTO -> OpenAPI -> test`; không merge controller trả placeholder.

## 2. Pre-Implementation Checklist

- Planning Gate A đã `READY_TO_CODE`.
- Branch mới từ `main` đã pull latest; không dùng branch prefix `codex/`.
- `npm ci` và `npm run check:ci` baseline pass.
- Docker Mongo replica set healthy.
- Accepted ADR được cập nhật trạng thái.
- Không đưa local `.env`/credential vào Git.

## 3. Slice 1 - Permissions And Cross-Phase Ports

### Tasks

1. Thêm permission P04 vào `PERMISSIONS` và role matrix.
2. Mở rộng capability tests cho Student/Teacher/Admin/Super Admin.
3. Tạo `ClassroomScopeReader` adapter trên P03 repositories/services.
4. Tạo `EnrollmentAccessReader` batch API cho Student visibility.
5. Tạo P04 `CourseScopeReader`, `LearningActivityReader`, `ClassroomContentReader` interfaces.
6. Wire dependency ở composition root, không singleton ẩn.

### Tests

- Permission snapshot/allow-deny matrix.
- Current owner change được reader phản ánh.
- Removed Enrollment bị từ chối.
- Không import model chéo bằng dependency boundary lint/test nếu khả thi.

### Exit

Không route P04 được expose; typecheck/unit pass và ports có fake adapter cho test.

## 4. Slice 2 - Models, Repositories And Indexes

### Tasks

1. Tạo enum/domain types không phụ thuộc Mongoose.
2. Tạo seven Must models và conditional resource model chỉ khi scope bật.
3. Viết repository projection rõ cho authoring/student/governance.
4. Tạo `phase-four-indexes.ts` với name/key/options manifest.
5. Tích hợp index bootstrap/verification hiện có.
6. Viết repository Mongo integration tests.

### Guardrails

- Mongoose validation là defense-in-depth; Zod/service vẫn là boundary chính.
- Repository không trả Mongoose document ra service consumer.
- Query list luôn truyền limit/sort/projection.
- Append-only deadline repository không có update/delete method.

### Exit

Index manifest pass trên Mongo replica set; no route exposure.

## 5. Slice 3 - Lifecycle, Visibility And Ordering Policies

### Tasks

1. Implement pure lifecycle transition table.
2. Implement `effectiveStatus(now)` với injected clock.
3. Implement publish prerequisite validators.
4. Implement Student ancestor visibility resolver.
5. Implement exact-set validator và canonical order mapper.
6. Implement Markdown/URL validation helpers bằng proven libraries.

### Tests

- Full transition matrix.
- Scheduled before/equal/after boundary.
- Ancestor visibility Cartesian cases.
- Reorder duplicate/missing/foreign/archived IDs.
- XSS/unsafe URL validation corpus.

### Exit

Pure policy coverage đầy đủ trước khi service orchestration dùng chúng.

## 6. Slice 4 - Course And Module API

### Tasks

1. Course create/list/detail/update/status/archive service.
2. Module list/create/update/status/archive service.
3. Atomic Module reorder + Course `structureRevision`.
4. DTO role projection.
5. Register routes trong `phase-four.router.ts`.
6. Add OpenAPI paths/components/examples.
7. Add service/integration/route contract tests.

### Important Cases

- Foreign Teacher receives generic not found.
- Student list only effective published Course.
- Admin không gọi authoring route.
- Course publish requires valid Lesson; do đó status publish test có fixture Lesson hoặc tạm chỉ expose sau Slice 5 trong same release branch.

### Exit

Teacher tạo draft Course/Module và reorder qua Swagger; Student không thấy draft.

## 7. Slice 5 - Lesson And Flashcard Authoring

### Tasks

1. Lesson CRUD/preview/status/archive.
2. Atomic Lesson move/reorder toàn Course.
3. Published/scheduled body lock.
4. Flashcard CRUD/archive/reorder và revision.
5. Sanitized preview DTO.
6. OpenAPI/tests.

### Important Cases

- Module/Course cross-reference bị block.
- Empty/sized Markdown và estimatedMinutes boundary.
- Publish thiếu deadline/content trả prerequisite errors.
- Archive/unpublish không xóa Flashcard/progress fixture.
- Preview không ghi progress và không bypass Teacher ownership.

### Exit

Teacher authoring full structure có thể chạy bằng API; published projection đúng.

## 8. Slice 6 - Deadline And Audit

### Tasks

1. Deadline schema/revision policy.
2. `DeadlineService.change` trong UnitOfWork.
3. Append-only history query.
4. Critical audit writer P04.
5. Rate limit mutation.
6. OpenAPI/test boundary và concurrency.

### Exit

Set/reset/clear matrix pass; parallel writers cho đúng một commit; history/audit rollback test pass.

## 9. Slice 7 - Student Content And Navigation

### Tasks

1. Classroom Classwork query.
2. Role-projected Course structure.
3. Lesson Player DTO + active Flashcards.
4. Previous/Next/Back navigation từ filtered canonical structure.
5. Explicit no-store headers.
6. Authorization and projection tests.

### Exit

Enrolled Student đọc được published content; draft/foreign/removed cases fail đúng; GET không có write side effect.

## 10. Slice 8 - Learning Progress

### Tasks

1. Progress natural key/upsert repository.
2. Idempotent start/complete services.
3. First timestamp preservation.
4. Completion audit/event metadata một lần.
5. Own progress query.
6. Concurrency and retry tests.

### Exit

20 parallel completion requests tạo một record và cùng semantic result; không duplicate first-completion side effect.

## 11. Slice 9 - To-do And Course Dashboard V1

### Tasks

1. Pure derived status function với injected clock.
2. Student To-do/Deadline aggregation.
3. Course activity summary query.
4. Paginated Student progress/ranking query.
5. Metric version/asOf DTO.
6. Explain plan/performance fixture tests.
7. OpenAPI examples không có assessment field giả.

### Exit

Deadline/visibility/completion mutation phản ánh ở query kế tiếp; deterministic rank pass; p95 target đạt dataset baseline hoặc có approved mitigation.

## 12. Slice 10 - Announcement And Governance

### Tasks

1. Announcement CRUD lifecycle và stream projection.
2. Student/Teacher list pagination.
3. `ClassroomContentReader` implementation.
4. Wire `contentCount` vào Admin Classroom response.
5. Optional Admin Course governance endpoints.
6. Audit/security tests.

### Exit

Student chỉ thấy published Stream; Admin count đúng nhưng không có content mutation/body leak.

## 13. Slice 11 - Conditional Learning Resource

Chỉ bắt đầu khi Must critical path xanh và change control duyệt.

### URL Mode

1. Metadata model/repository/service.
2. WHATWG URL parser + HTTPS policy.
3. Owner/enrollment access.
4. React-safe DTO và tests.

### GCS Mode

1. `ObjectStoragePort` và GCS adapter.
2. Upload intent, finalization và authorized access.
3. MIME/size/quarantine/orphan policy.
4. Emulator/fake adapter tests; cloud integration evidence ở Phase 07.

Không merge upload route chỉ hoạt động với hard-coded credential hoặc public bucket.

## 14. Router And Composition Rules

- `createPhaseFourRouter(config, dependencies)` nhận dependencies rõ.
- Authentication middleware reuse P02; không tạo second JWT parser.
- Route order tránh dynamic `/:id` nuốt static path.
- Param/body/query đều `parseWithSchema`.
- Controller chỉ parse/call/map HTTP status/header.
- Root app mount một lần dưới `/api/v1`.

## 15. OpenAPI Workflow

1. Viết schema component cùng Zod/domain decision.
2. Thêm path/operationId/security/errors/examples.
3. Implement route.
4. Add route parity/response contract tests.
5. Chạy `npm run test:openapi`.
6. Mở Swagger và chạy happy/negative sample.

Không chỉnh Swagger thủ công sau khi code xong như một bước trang trí.

## 16. Error And Logging Rules

- Domain policy ném typed `AppError` code đã catalog.
- Mongo duplicate/transient errors map qua shared helper.
- Logger event structured, không interpolate full request body.
- `requestId` đi xuyên service/audit.
- Authorization denial log sampled/rate-controlled.
- Optional dependency error không làm health liveness core fail trừ khi feature flag bật bắt buộc.

## 17. Backend Definition Of Done

- Route behavior đúng API contract và OpenAPI parity.
- Unit/integration/security/concurrency tests pass.
- Mongo index manifest pass.
- No N+1 ở dashboard/To-do; performance evidence lưu.
- No model cross-import vi phạm boundary.
- Audit/redaction verified.
- Demo seed and Docker runtime pass.
- Code review không còn unresolved Critical/High finding.
