# Phase 05 Backend Implementation Plan

## 1. Mục Tiêu

Triển khai backend theo vertical slice, mỗi slice có domain policy, repository, service, route, OpenAPI và test. Không tạo toàn bộ model trước rồi để workflow chưa tích hợp.

Gate B/PR02 được phép tạo model/repository foundation vì WBS yêu cầu index, CAS và transaction contract sớm, nhưng mỗi file phải có integration test thật; không tạo class rỗng hoặc method `TODO`. PR03-PR06 phải lần lượt đưa foundation đó vào vertical workflow hoàn chỉnh.

Nguồn thực thi chi tiết:

- `source-file-blueprint.md`: file Create/Modify và vị trí composition chính xác.
- `runtime-contract-catalog.md`: constants, permission, port, DTO và service signatures.
- `test-case-catalog.md`: test IDs/assertions phải pass.
- `pull-request-execution-guide.md`: phạm vi từng branch/PR.

Khi folder tree rút gọn bên dưới khác blueprint, `source-file-blueprint.md` là bản đồ file canonical; domain behavior vẫn theo lifecycle/data/security documents.

## 2. Proposed Folder Structure

```text
apps/api/src/modules/
|-- quizzes/
|   |-- quiz.model.ts
|   |-- quiz.repository.ts
|   |-- quiz.schemas.ts
|   |-- quiz.domain.ts
|   |-- quiz.service.ts
|   `-- quiz.dto.ts
|-- questions/
|   |-- question.model.ts
|   |-- question.repository.ts
|   |-- question.schemas.ts
|   |-- question.policy.ts
|   |-- question.service.ts
|   `-- question.dto.ts
|-- quiz-attempts/
|   |-- quiz-attempt.model.ts
|   |-- quiz-attempt.repository.ts
|   |-- quiz-attempt.schemas.ts
|   |-- quiz-attempt.service.ts
|   |-- quiz-timeout.policy.ts
|   `-- quiz-attempt.dto.ts
|-- quiz-scoring/
|   |-- objective-scoring.policy.ts
|   |-- final-score.policy.ts
|   `-- scoring.types.ts
|-- assignments/
|-- submissions/
|-- grades/
|-- deadline-exceptions/
`-- phase-five.router.ts
```

Tên file/folder tiếng Anh; nội dung docs tiếng Việt theo quy ước.

## 3. Slice 0 - Contract And Permission Foundation

### Tasks

1. Thêm capability constants và role mapping.
2. Nâng `LearningActivityDescriptor`/progress port lên V2 có compatibility test.
3. Tạo P05 schema/version constants và shared activity type.
4. Tạo empty composition adapters/interfaces, không route placeholder trả fake success.
5. Mở OpenAPI manifest Phase Five với zero/initial operations có test incremental.

### Exit

- P02-P04 tests Pass.
- Permission unit tests Pass.
- No cross-module model import.
- Không route public chưa có service thật.

## 4. Slice 1 - Quiz And Question Authoring

### Domain/Data

- Quiz/Question models/indexes.
- Lifecycle/publish prerequisite pure policies.
- Question type validator và exact-set reorder.
- Teacher/Student DTO split ngay từ đầu.

### API

- Teacher Quiz list/create/detail/update/status/preview.
- Question list/create/update/archive/reorder.
- Conditional URL media set/remove với feature off default.

### Tests

- All type boundaries, max counts, option/correct set.
- Ownership/foreign Course/Module.
- Lifecycle/body lock/revision conflict.
- Publish no question/zero total/manual+immediate error.
- Student serializer leak test.

### Exit

Teacher có thể tạo Quiz hoàn chỉnh và publish qua API/Swagger; Student intro chỉ visible đúng scope.

## 5. Slice 2 - Student Attempt And Objective Scoring

### Domain/Data

- Attempt model with snapshot/partial unique indexes.
- Snapshot builder đọc Question projection private.
- Pure scoring policies với golden fixtures.
- Timeout/effective expiry policy.
- Attempt repository transaction helpers.

### API

- Student intro/start/get/save answers/submit/list own/result.
- Start resume semantics.
- Terminal submit idempotency.

### Integration

- Create/update `learning_progress` Quiz activity.
- To-do removes Quiz after finalize.

### Tests

- Concurrent double-start/double-submit.
- Attempt limit/time boundary/effective deadline.
- Manipulated score/option/question IDs.
- Exact scoring all objective types.
- Snapshot unchanged after Question revision.

## 6. Slice 3 - Manual Review And Result Release

- Teacher result list/detail.
- Manual answer review draft/finalize.
- Final `HIGHEST` score selection.
- Grade candidate/current creation.
- `IMMEDIATE/AFTER_REVIEW/TEACHER_RETURN` visibility.
- Regrade reason/history/AuditLog.
- Student own result projection.

Exit requires short-answer attempt đi từ start đến released result mà không sửa Question live.

## 7. Slice 4 - Assignment Authoring And Student Submission

### Domain/Data

- Assignment model/lifecycle/policy.
- Submission current + revision models.
- Derived roster status policy.
- URL/link feature policy; FILE hard-disabled.

### API

- Teacher list/create/detail/update/status/preview.
- Student detail/get own draft/save/turn-in/unsubmit/resubmit/history.
- Teacher paginated Submission roster/detail.

### Tests

- Due equal/before/after; late enabled/disabled; closed/unpublished.
- All enabled methods; FILE rejected.
- Concurrent first save/turn-in.
- Revision history and unsubmit completion reversal.
- Roster includes missing/assigned Student without placeholder document.

## 8. Slice 5 - Grade, Feedback And Return

- Grade/GradeRevision models and indexes.
- Grade service supports Assignment evidence and Quiz attempt adapter.
- Save draft, return, regrade, history.
- Evidence revision mismatch protection.
- Own Grade list/detail.
- Conditional private comment chỉ sau Must tests xanh và approved change-control có endpoint/model/privacy contract; nếu không, defer/N/A.

Transaction test phải chứng minh Grade không visible nếu return fails giữa chừng.

## 9. Slice 6 - Deadline Exception

- Generic ActivityDeadlineReader adapters cho Lesson/Quiz/Assignment.
- Current/history models and policy.
- Teacher list/set/revoke/history endpoints.
- Extend-only P05 flow; shorten/past/revoke-to-earlier deadline bị từ chối.
- EffectiveDeadlineResolver integration vào Attempt/Submission/To-do/Deadline.
- Scoped recalculation tests Student A/B.

## 10. Slice 7 - P04 Read Model Integration

Refactor có kiểm soát:

- Activity composite reader merges Lesson/Quiz/Assignment.
- Student Classwork mixed projection.
- To-do/Deadline filter and action URL expansion.
- Progress metric V2 và Student own progress.
- Teacher Course activity/student summary fields cơ bản.
- Existing Admin Course governance thêm Quiz/Assignment lifecycle counts bằng metadata-only adapter.
- P04 Lesson behavior remains byte/contract compatible where promised.

Không copy business logic Quiz/Assignment vào `student-learning.service.ts`; service gọi adapter/port.

## 11. Slice 8 - OpenAPI, Seed And Hardening

- Phase Five OpenAPI split files nếu lớn: authoring, attempts, assignments, grading.
- Route-operation parity.
- Demo seed deterministic/idempotent.
- Rate limit and structured metric/log.
- Performance query explain.
- Reconciliation dry-run services.
- Security/DTO recursive leak suite.

## 12. Repository Rules

- Repository nhận ObjectId đã validate hoặc normalize tại boundary.
- Projection chỉ select field cần thiết.
- Sort luôn `_id` tie-breaker.
- Session passed explicitly vào transaction mutation.
- Unique duplicate mapped thành domain conflict code.
- Không catch-and-ignore Mongo error.

## 13. Service Rules

- Authorization before reading private projection.
- Server `now` injectable cho deterministic tests.
- Pure policy không gọi DB.
- Transaction command nhỏ, không render Markdown/network call.
- Audit writer allowlist metadata.
- Error code stable; message có thể localized ở Web.

## 14. DTO Rules

- Explicit object construction; không spread raw record.
- Date to ISO.
- IDs to string.
- Student/Teacher/Admin DTO riêng.
- `correctOptionIds`, rubric, answer body, draft grade excluded theo projection.
- DTO contract snapshots + forbidden-field recursive tests.

## 15. Test File Strategy

```text
apps/api/tests/
|-- quiz-*.test.ts
|-- question-*.test.ts
|-- quiz-attempt-*.test.ts
|-- scoring-*.test.ts
|-- assignment-*.test.ts
|-- submission-*.test.ts
|-- grade-*.test.ts
|-- deadline-exception-*.test.ts
`-- integration/phase-five-*.integration.test.ts
```

## 16. Backend Definition Of Done

- Lint/typecheck/build Pass.
- Unit/integration/coverage gates Pass.
- OpenAPI parity Pass.
- Transaction/race tests Pass on replica set.
- No answer/grade privacy leak.
- Index manifest/explain Pass.
- P02-P04 regression Pass.
- Swagger examples execute against seeded runtime.
