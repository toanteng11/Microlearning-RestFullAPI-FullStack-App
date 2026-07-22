# Phase 05 Source File Blueprint

## 1. Mục Đích

Tài liệu này chuyển WBS Phase 05 thành bản đồ source cụ thể. Developer dùng tài liệu để biết file nào phải tạo, file nào phải sửa, trách nhiệm của từng file và thứ tự đưa thay đổi vào Pull Request. Đây là blueprint, không phải bằng chứng implementation đã hoàn thành.

## 2. Quy Ước Bắt Buộc

- `Create`: file mới trong Phase 05.
- `Modify`: file hiện có phải thay đổi có kiểm soát.
- Không import Mongoose model xuyên module; giao tiếp qua port/repository adapter.
- Route chỉ xác thực, parse, gọi service và tạo HTTP response.
- Service không nhận `Request`/`Response`; server clock được inject khi có rule thời gian.
- DTO tạo object theo allowlist; không spread raw Mongo record.
- Không tạo route/UI placeholder trả fake success.
- Mỗi runtime route phải có Zod schema, permission, OpenAPI operation và test parity trong cùng PR.
- Tất cả list endpoint P05 dùng `{ success, data: { items }, meta }` như Phase 04.

## 3. Source Baseline Phải Tái Sử Dụng

| Concern | Source hiện có | Cách dùng trong P05 |
| --- | --- | --- |
| Authentication | `shared/auth/authenticate.ts` | Dùng `createAuthenticateMiddleware` và `requirePermission` |
| Permission | `shared/auth/permissions.ts` | Mở rộng union và role map, không tạo permission store thứ hai |
| Validation | `shared/validation/parse.ts` | Dùng strict Zod schema và `parseWithSchema` |
| Error | `shared/errors/app-error.ts`, `shared/middleware/error-handler.ts` | Giữ `AppError` và error envelope hiện có |
| Transaction | `shared/database/unit-of-work.ts` | Dùng `withMongoTransaction`, truyền `ClientSession` rõ |
| Scope | `learning-content/course-scope.reader.ts` | Reuse Teacher ownership và Student enrollment scope |
| Content status | `learning-content/content-schedule.policy.ts` | Reuse effective scheduled status semantics |
| Progress | `learning-content/learning-progress.reader.ts` | Nâng union/version có compatibility test |
| Audit | `audit/phase-four-audit.writer.ts` | Tạo writer P05 cùng allowlist pattern |
| API composition | `phase-four.foundation.ts`, `phase-four.router.ts` | Tạo composition P05 cùng style |
| OpenAPI | `docs/phase-four-*.openapi.ts`, `docs/openapi.ts` | Split theo domain và merge operation manifest |
| Web request | `shared/auth/AuthProvider.tsx` | Dùng `useAuth().request`, không thêm data library mới |
| Web lazy route | `features/learning/learning-route-components.tsx` | Tạo route component exports theo cùng pattern |
| Browser test | `tests/e2e/phase-03-critical-journeys.spec.ts` | Reuse login/seed/navigation convention |

## 4. Cross-Cutting Files Phải Sửa

| File | Action | Thay đổi bắt buộc | PR |
| --- | --- | --- | --- |
| `apps/api/src/shared/auth/permissions.ts` | Modify | Thêm P05 permissions và grant đúng Student/Teacher; `SUPER_ADMIN` vẫn nhận toàn bộ qua `PERMISSIONS` | PR02 |
| `apps/api/src/shared/config/environment.ts` | Modify | Parse P05 feature flags/rate limits; production explicit fields; hard-fail khi file upload bật | PR02 |
| `apps/api/tests/test-fixtures.ts` | Modify | Bổ sung P05 config vào `testConfig` để mọi test compile | PR02 |
| `.env.example` | Modify | Thêm toàn bộ biến P05 với giá trị giả/an toàn | PR02 |
| `apps/api/src/modules/learning-content/learning-activity.reader.ts` | Modify | Nâng descriptor union sang `LESSON | QUIZ | ASSIGNMENT`, version V2 | PR02 |
| `apps/api/src/modules/learning-content/learning-progress.reader.ts` | Modify | Nâng activity union và metric version P05 | PR02 |
| `apps/api/src/modules/learning-progress/learning-progress.model.ts` | Modify | Cho phép ba activity types, giữ unique natural key | PR02 |
| `apps/api/src/modules/learning-progress/learning-progress.types.ts` | Modify | Đổi Lesson-specific input thành generic activity input có discriminator | PR02 |
| `apps/api/src/modules/learning-progress/learning-progress.repository.ts` | Modify | Generic start/complete/reverse completion methods có session support | PR02/PR07 |
| `apps/api/src/shared/database/phase-five-indexes.ts` | Create | Model manifest và named index initialization P05 | PR02 |
| `apps/api/src/server.ts` | Modify | Gọi `initializePhaseFiveIndexes` sau P03/P04 | PR02 |
| `apps/api/src/app.ts` | Modify | Mount `createPhaseFiveRouter` trước `notFoundHandler` | PR03 lần đầu có route thật |
| `apps/api/src/docs/openapi.ts` | Modify | Merge P05 tags/schemas/paths/operation manifest | PR03-PR06 incremental |
| `apps/api/tests/app.test.ts` | Modify | Mở rộng exact runtime/OpenAPI route map và forbidden-field contract | PR03-PR06 |
| `apps/api/src/modules/bootstrap/phase-five-demo-seed.service.ts` | Create | Seed deterministic/idempotent assessments và grading | PR08 |
| `apps/api/src/scripts/seed-demo.ts` | Modify | Chạy PhaseFive seed sau PhaseFour và xuất count JSON | PR08 |
| `apps/api/tests/bootstrap-seed.test.ts` | Modify | Kiểm tra P05 seed first/repeat và no duplicate | PR08 |
| `apps/web/src/app/router.tsx` | Modify | Mount role/permission guarded P05 routes | PR03-PR07 incremental |
| `apps/web/src/features/learning/learning.types.ts` | Modify | Nâng mixed activity/progress DTO, giữ Lesson compatibility | PR07 |
| `apps/web/src/features/learning/pages/StudentCoursePage.tsx` | Modify | Render mixed Classwork từ route Classroom hiện có | PR07 |
| `apps/web/src/features/learning/pages/StudentTodoPage.tsx` | Modify | Route theo server `actionUrl`, hỗ trợ Quiz/Assignment | PR07 |
| `apps/web/src/features/learning/pages/StudentDeadlinePage.tsx` | Modify | Filter/render activity type và effective deadline | PR07 |
| `apps/web/src/features/learning/pages/TeacherCourseDashboardPage.tsx` | Modify | Dùng metric/descriptor P05, không tự tính score | PR07 |
| `apps/web/src/features/learning/pages/AdminCoursesPage.tsx` | Modify | Hiển thị assessment lifecycle counts metadata-only | PR07 |
| `apps/web/src/features/learning/pages/AdminCourseDetailPage.tsx` | Modify | Hiển thị Quiz/Assignment counts, không private deep link | PR07 |
| `playwright.config.ts` | Modify khi cần | Không bắt buộc thêm project mobile; responsive spec có thể đặt viewport cục bộ | PR08 |
| `.github/workflows/ci.yml` | Modify khi cần | Chạy P05 integration/OpenAPI/E2E trong six required jobs, không tạo bypass | PR08 |

## 5. Backend Files Mới Theo Module

### 5.1 Phase Composition

| File | Trách nhiệm |
| --- | --- |
| `apps/api/src/modules/phase-five.foundation.ts` | Khởi tạo/reuse Course/Classroom/Enrollment scope ports và các activity adapters; không khai báo route |
| `apps/api/src/modules/phase-five.router.ts` | Khởi tạo repository/service, middleware, rate limiter và mount 52 P05 operations |
| `apps/api/src/modules/audit/phase-five-audit.writer.ts` | Allowlist audit events/metadata; không ghi answer, submission body, correct key hoặc feedback body |

`phase-five.router.ts` phải có helper `requestIdFrom`, authentication một lần cho các prefix P05 và limiter riêng: general assessment mutation theo actor, Attempt start theo IP, Attempt start theo actor+Quiz và answer save theo actor+Attempt. Submit/turn-in/grade vẫn có state/revision guard bên dưới limiter. Không copy business policy vào handler.

### 5.2 Quiz Authoring

| File | Trách nhiệm |
| --- | --- |
| `modules/quizzes/quiz.types.ts` | Quiz status, release/score policy, record/input/query types |
| `modules/quizzes/quiz.model.ts` | Mongoose schema, timestamps, schemaVersion và named indexes |
| `modules/quizzes/quiz.repository.ts` | Scoped CRUD/CAS/list/count; explicit projection/session |
| `modules/quizzes/quiz.schemas.ts` | Params/query/create/update/status/preview Zod schemas |
| `modules/quizzes/quiz.domain.ts` | Effective status, transition, availability và publish prerequisite |
| `modules/quizzes/quiz.dto.ts` | Teacher detail/list, Student intro và Admin metadata projections |
| `modules/quizzes/quiz.service.ts` | Authoring lifecycle/list/detail/preview; ownership, audit và revision |
| `modules/quizzes/quiz-activity.adapter.ts` | Chuyển Quiz visible thành `LearningActivityDescriptor` V2 |

### 5.3 Question Authoring

| File | Trách nhiệm |
| --- | --- |
| `modules/questions/question.types.ts` | Discriminated union cho bốn Question types và stable option/media types |
| `modules/questions/question.model.ts` | Question collection, embedded bounded options, active/archive state |
| `modules/questions/question.repository.ts` | CRUD, exact-set reorder, aggregate count/maxScore, scoring projection |
| `modules/questions/question.schemas.ts` | Strict type-specific Zod schemas và reorder/media payload |
| `modules/questions/question.policy.ts` | Type validation, normalized uniqueness, publish lock và media allowlist |
| `modules/questions/question.dto.ts` | Teacher projection có key; Student projection tuyệt đối không có key/rubric |
| `modules/questions/question.service.ts` | Create/update/archive/reorder/media commands và Quiz revision CAS |

### 5.4 Quiz Attempt And Scoring

| File | Trách nhiệm |
| --- | --- |
| `modules/quiz-attempts/quiz-attempt.types.ts` | Attempt/snapshot/answer/status/review types |
| `modules/quiz-attempts/quiz-attempt.model.ts` | Immutable snapshot, answer state, terminal fields và partial unique indexes |
| `modules/quiz-attempts/quiz-attempt.repository.ts` | Active/current/history query, number allocation, CAS và transaction helpers |
| `modules/quiz-attempts/quiz-attempt.schemas.ts` | Start/detail/save/submit/list/review/release/regrade schemas |
| `modules/quiz-attempts/quiz-eligibility.policy.ts` | Enrollment, availability, deadline, limit và active-attempt decisions |
| `modules/quiz-attempts/quiz-timeout.policy.ts` | `expiresAt`, expiration boundary và lazy reconciliation decision |
| `modules/quiz-attempts/quiz-attempt.dto.ts` | Student player/result/history và Teacher review/result DTOs tách biệt |
| `modules/quiz-attempts/quiz-attempt.service.ts` | Start/resume/save/submit/list/result/reconcile orchestration |
| `modules/quiz-attempts/quiz-review.service.ts` | Manual review/finalize/release/regrade orchestration |
| `modules/quiz-scoring/scoring.types.ts` | Pure scoring input/output và version constant |
| `modules/quiz-scoring/objective-scoring.policy.ts` | Exact-match objective scoring, không DB/I/O |
| `modules/quiz-scoring/final-score.policy.ts` | `HIGHEST`, deterministic tie-break và releasable result selection |

### 5.5 Assignment And Submission

| File | Trách nhiệm |
| --- | --- |
| `modules/assignments/assignment.types.ts` | Lifecycle, submission methods, late/unsubmit/resubmit policy types |
| `modules/assignments/assignment.model.ts` | Assignment schema và indexes |
| `modules/assignments/assignment.repository.ts` | Scoped CRUD/CAS/list/count |
| `modules/assignments/assignment.schemas.ts` | Teacher/Student params, query và mutation schemas |
| `modules/assignments/assignment.domain.ts` | Lifecycle, availability và publish prerequisite |
| `modules/assignments/assignment.dto.ts` | Teacher/Student/Admin projections |
| `modules/assignments/assignment.service.ts` | Authoring/list/detail/preview/status orchestration |
| `modules/assignments/assignment-activity.adapter.ts` | Assignment -> activity descriptor V2 |
| `modules/submissions/submission.types.ts` | Current/revision/derived row state và payload union |
| `modules/submissions/submission.model.ts` | Current submission natural key/current revision |
| `modules/submissions/submission-revision.model.ts` | Append-only evidence/state history |
| `modules/submissions/submission.repository.ts` | Current/history/roster query và transactional CAS helpers |
| `modules/submissions/submission.schemas.ts` | Save/turn-in/unsubmit/resubmit/history/list schemas |
| `modules/submissions/submission.policy.ts` | Method, completeness, late, unsubmit và resubmit rules |
| `modules/submissions/submission.dto.ts` | Own/Teacher roster/detail DTOs và privacy allowlist |
| `modules/submissions/submission.service.ts` | Draft/turn-in/unsubmit/resubmit/history/roster orchestration |

### 5.6 Grade And Deadline Exception

| File | Trách nhiệm |
| --- | --- |
| `modules/grades/grade.types.ts` | Grade target/status/revision and returned projection types |
| `modules/grades/grade.model.ts` | Current unique Grade per Student/activity |
| `modules/grades/grade-revision.model.ts` | Append-only Grade history |
| `modules/grades/grade.repository.ts` | Draft/return/regrade/history/own-list helpers |
| `modules/grades/grade.schemas.ts` | Grade/return/regrade/history/own-list schemas |
| `modules/grades/grade.policy.ts` | Score bounds, evidence revision và visibility rules |
| `modules/grades/grade.dto.ts` | Teacher history/detail và Student returned-only DTOs |
| `modules/grades/grade.service.ts` | Save/return/regrade/history/own-grade transactions |
| `modules/deadline-exceptions/deadline-exception.types.ts` | Activity key/current/history/effective result types |
| `modules/deadline-exceptions/deadline-exception.model.ts` | Current exception unique by activity + Student |
| `modules/deadline-exceptions/deadline-exception-history.model.ts` | Append-only set/revoke history |
| `modules/deadline-exceptions/deadline-exception.repository.ts` | Current/history/list/CAS helpers |
| `modules/deadline-exceptions/deadline-exception.schemas.ts` | Type/id/student/query/set/revoke schemas |
| `modules/deadline-exceptions/deadline-exception.policy.ts` | Extend-only, future/reason/state validation |
| `modules/deadline-exceptions/effective-deadline.resolver.ts` | Một resolver duy nhất: override active trước default |
| `modules/deadline-exceptions/deadline-exception.dto.ts` | Teacher current/history và Student-safe indicator |
| `modules/deadline-exceptions/deadline-exception.service.ts` | Scope/set/revoke/list/history/audit transaction |

## 6. OpenAPI Files

| File | Operations |
| --- | --- |
| `apps/api/src/docs/phase-five-assessment-authoring.openapi.ts` | 13 Teacher Quiz/Question operations |
| `apps/api/src/docs/phase-five-quiz-attempts.openapi.ts` | 13 Student Attempt + Teacher result/review operations |
| `apps/api/src/docs/phase-five-assignments.openapi.ts` | 15 Teacher/Student Assignment/Submission operations |
| `apps/api/src/docs/phase-five-grading.openapi.ts` | 7 Grade operations, Conditional Gradebook có feature response |
| `apps/api/src/docs/phase-five-deadlines.openapi.ts` | 4 deadline exception operations |

Mỗi file export `tags`, `schemas`, `create...Paths()` và `...OPENAPI_OPERATIONS`. `openapi.ts` merge đủ 52 operation IDs; không trùng path/method và không để runtime route thiếu operation.

## 7. Web Files Mới

### 7.1 Assessments Feature

```text
apps/web/src/features/assessments/
|-- assessment.types.ts
|-- assessment-route-components.tsx
|-- assessment-format.ts
|-- use-quiz-attempt.ts
|-- use-revisioned-draft.ts
|-- components/
|   |-- ActivityStatusBadge.tsx
|   |-- QuestionEditor.tsx
|   |-- QuizSettingsForm.tsx
|   |-- QuizQuestionRenderer.tsx
|   |-- SaveStateIndicator.tsx
|   `-- SubmissionEditor.tsx
|-- pages/
|   |-- TeacherAssessmentsPage.tsx
|   |-- TeacherQuizCreatePage.tsx
|   |-- TeacherQuizBuilderPage.tsx
|   |-- TeacherQuizPreviewPage.tsx
|   |-- StudentQuizIntroPage.tsx
|   |-- StudentQuizAttemptPage.tsx
|   |-- StudentQuizResultPage.tsx
|   |-- TeacherAssignmentCreatePage.tsx
|   |-- TeacherAssignmentEditorPage.tsx
|   `-- StudentAssignmentPage.tsx
|-- assessment-components.test.tsx
`-- assessment-pages.test.tsx
```

`use-revisioned-draft.ts` chỉ quản lý draft/revision request state; không lưu localStorage. `use-quiz-attempt.ts` serialize answer batch, chặn concurrent save và dùng revision trả về từ server.

### 7.2 Grading Feature

```text
apps/web/src/features/grading/
|-- grading.types.ts
|-- grading-route-components.tsx
|-- grading-format.ts
|-- components/
|   |-- GradeEditor.tsx
|   |-- ResultStatusBadge.tsx
|   `-- SubmissionStatusBadge.tsx
|-- pages/
|   |-- TeacherQuizResultsPage.tsx
|   |-- TeacherQuizAttemptReviewPage.tsx
|   |-- TeacherAssignmentSubmissionsPage.tsx
|   |-- TeacherSubmissionGradingPage.tsx
|   |-- StudentGradesPage.tsx
|   `-- StudentGradeDetailPage.tsx
|-- grading-components.test.tsx
`-- grading-pages.test.tsx
```

### 7.3 Deadline Exceptions Feature

```text
apps/web/src/features/deadline-exceptions/
|-- deadline-exception.types.ts
|-- deadline-exception-route-components.tsx
|-- components/DeadlineExceptionForm.tsx
|-- pages/TeacherDeadlineExceptionsPage.tsx
`-- deadline-exceptions.test.tsx
```

## 8. Test File Blueprint

| Layer | File dự kiến |
| --- | --- |
| Domain unit | `apps/api/tests/phase-five-quiz-policy.test.ts`, `phase-five-question-policy.test.ts`, `phase-five-scoring.test.ts`, `phase-five-assignment-policy.test.ts`, `phase-five-submission-policy.test.ts`, `phase-five-grade-policy.test.ts`, `phase-five-deadline-policy.test.ts` |
| Service/unit | `apps/api/tests/phase-five-quiz-service.test.ts`, `phase-five-attempt-service.test.ts`, `phase-five-submission-service.test.ts`, `phase-five-grade-service.test.ts` |
| Data integration | `apps/api/tests/integration/phase-five-data-foundation.integration.test.ts` |
| Quiz integration | `apps/api/tests/integration/phase-five-quiz-attempts.integration.test.ts` |
| Assignment integration | `apps/api/tests/integration/phase-five-submissions.integration.test.ts` |
| Grade/deadline integration | `apps/api/tests/integration/phase-five-grading-deadlines.integration.test.ts` |
| Read model/performance | `apps/api/tests/integration/phase-five-learning-performance.integration.test.ts` |
| OpenAPI | `apps/api/tests/app.test.ts` và P05 schema/example assertions |
| Web component/page | Các `*.test.tsx` trong ba feature folders |
| Desktop E2E | `tests/e2e/phase-05-critical-journeys.spec.ts` |
| Mobile E2E | `tests/e2e/phase-05-responsive-journeys.spec.ts` với viewport `390x844` cục bộ |

Chi tiết ID/assertion nằm trong `test-case-catalog.md`.

## 9. Thứ Tự Compile-Safe

1. Thêm config types/defaults + `testConfig` trong cùng commit.
2. Thêm permissions + tests.
3. Nâng activity/progress unions, đồng thời sửa tất cả compile errors P04 và thêm compatibility tests.
4. Thêm models + index manifest + integration tests trước khi repository/service phụ thuộc.
5. Thêm port/repository/domain policy.
6. Thêm service + DTO + schemas.
7. Mount route thật cùng OpenAPI operation và route map test.
8. Thêm Web route chỉ sau API contract tương ứng đã merge.
9. Mở rộng aggregate P04 sau khi Quiz và Assignment activity adapters hoạt động.
10. Seed/E2E/hardening cuối cùng, nhưng không dồn unit/integration test đến PR08.

## 10. Không Được Tạo

- `phase-five.mock.ts`, fake repository trong production source hoặc endpoint “coming soon”.
- Một collection progress/grade thứ hai chỉ để phục vụ UI.
- Route Classwork mới theo Course; giữ `/classrooms/:classroomId/classwork`.
- Upload controller, GCS client hoặc local file directory trong P05.
- Frontend API client mới bỏ qua `AuthProvider` refresh flow.
- `private-comments` module/route khi chưa có Gate A/PR06 change-control contract; mặc định Conditional này được defer/N/A.
- Generic base repository/service quá rộng chỉ để giảm vài dòng code.
- Cron bắt buộc cho scheduled publish/attempt timeout.

## 11. Blueprint Exit Check

- Mỗi file runtime mới có owner module và PR rõ.
- Không còn folder placeholder không có trách nhiệm.
- 52 operations có vị trí router/OpenAPI/UI hoặc ghi rõ API-only.
- Source modification có regression test tương ứng.
- File upload/P06 analytics không lọt vào blueprint.
- Developer có thể lấy một PR trong `pull-request-execution-guide.md` và xác định chính xác tập file cần làm.
