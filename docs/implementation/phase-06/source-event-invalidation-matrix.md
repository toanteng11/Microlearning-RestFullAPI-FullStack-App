# Phase 06 Source Event Invalidation Matrix

## 1. Mục Đích

Tài liệu này chỉ rõ mutation nào phải làm stale report scope nào và invalidation được ghi ở đâu.
Nó đóng crash gap giữa source transaction và reporting summary.

## 2. Integration Port

Port trung lập nằm tại:
`apps/api/src/modules/learning-content/reporting-invalidation.writer.ts`.

```ts
interface ReportingInvalidationWriter {
  invalidateStudentCourse(
    input: {
      classroomId: ObjectId;
      courseId: ObjectId;
      studentId: ObjectId;
      reasons: readonly ReportingInvalidationReason[];
      sourceChangedAt: Date;
    },
    session: ClientSession,
  ): Promise<void>;

  invalidateCourse(
    input: {
      classroomId: ObjectId;
      courseId: ObjectId;
      reasons: readonly ReportingInvalidationReason[];
      sourceChangedAt: Date;
    },
    session: ClientSession,
  ): Promise<void>;

  invalidateClassroom(
    input: {
      classroomId: ObjectId;
      reasons: readonly ReportingInvalidationReason[];
      sourceChangedAt: Date;
    },
    session: ClientSession,
  ): Promise<void>;
}
```

P06 cung cấp Mongo adapter. Focused unit tests có thể dùng fake/noop writer nhưng vẫn phải truyền
test `ClientSession`; composition chạy application không được có fallback noop. Việc bắt buộc
`ClientSession` ở producer port là compile-time guard cho quy tắc atomic source/invalidation.

## 3. Transaction Rule

- Mutation đã dùng `withMongoTransaction`: ghi durable invalidation trong cùng `ClientSession`,
  trước commit.
- Refresh/rebuild summary không chạy trong source transaction.
- Invalidation write lỗi do cùng Mongo transaction có thể làm transaction retry/fail; đây là
  consistency intent nhỏ, không phải report calculation.
- Refresh/rebuild lỗi sau commit không rollback source mutation.
- Mutation progress chưa có transaction phải được wrap để source write + invalidation atomic.
- `reasons` phải non-empty và thuộc canonical enum trong `runtime-contract-catalog.md`.
- Idempotent replay cùng scope key thực hiện set-union reasons và giữ `sourceChangedAt` mới nhất.

## 4. Classroom And Enrollment

| Source method | Scope | Reasons | Transaction |
| --- | --- | --- | --- |
| `EnrollmentService.joinByCode` | Classroom -> all visible Courses | `ROSTER_CHANGED` | Existing transaction |
| `EnrollmentService.joinByToken` | Classroom -> all visible Courses | `ROSTER_CHANGED` | Existing transaction |
| `EnrollmentService.removeStudent` | Classroom -> all Courses; Student rows removed | `ROSTER_CHANGED` | Existing transaction |
| Classroom archive/lock/ownership change | Classroom | `GOVERNANCE_CHANGED` | Producer transaction/policy |

`invalidateClassroom` chỉ upsert một durable `CLASSROOM` scope trong source transaction. P06
read-recovery hoặc rebuild/reconciliation command mở rộng thành Course scopes theo bounded batch
sau commit; không tạo unbounded query/write trong source service. Parent intent chỉ được resolve
sau khi mọi Course intent đã upsert; trong thời gian đó freshness lookup phải xét parent Classroom
scope.

## 5. Course And Activity Lifecycle

| Source method | Scope | Reasons | Transaction |
| --- | --- | --- | --- |
| `CourseService.create/update/changeStatus/archive` | Course | `ACTIVITY_CHANGED` hoặc `GOVERNANCE_CHANGED` | Existing transaction |
| `LessonService.create/update/changeStatus/archive/reorder` | Course | `ACTIVITY_CHANGED` | Existing transaction |
| `QuizService.create/update/changeStatus` | Course | `ACTIVITY_CHANGED` | Existing transaction |
| `AssignmentService.create/update/changeStatus` | Course | `ACTIVITY_CHANGED` | Existing transaction |

Mọi thay đổi `isRequired`, visibility, lifecycle, maxScore hoặc default deadline là Course-wide.
Title/reorder chỉ ảnh hưởng projection/order nhưng vẫn invalidate Course để DTO đồng nhất.

## 6. Learning Progress

| Source method | Scope | Reasons | Transaction |
| --- | --- | --- | --- |
| `StudentLearningService.start` | Student/Course | `PROGRESS_CHANGED` | New transaction required |
| `StudentLearningService.complete` | Student/Course | `PROGRESS_CHANGED` | New transaction required |
| `QuizAttemptService.start` | Student/Course | `PROGRESS_CHANGED` | Existing transaction |
| `QuizAttemptService.submit/finalize timeout` | Student/Course | [`PROGRESS_CHANGED`, `ASSESSMENT_CHANGED`] | Existing finalize transaction |
| `SubmissionService.saveDraft` | Student/Course | `PROGRESS_CHANGED` | Existing transaction |
| `SubmissionService.turnIn` | Student/Course | [`PROGRESS_CHANGED`, `ASSESSMENT_CHANGED`] | Existing transaction |
| `SubmissionService.unsubmit/resubmit` | Student/Course | [`PROGRESS_CHANGED`, `ASSESSMENT_CHANGED`] | Existing transaction |

`saveAnswers` không đổi P06 `lastActiveAt` V1 vì metric chỉ dùng `learning_progress.lastActiveAt`.
Nếu sau này save answer phải tính activity, phải tăng definition version.

## 7. Grade And Review

| Source method | Scope | Reasons | Transaction |
| --- | --- | --- | --- |
| `GradeService.save` | Student/Course | `GRADE_CHANGED` | Existing transaction |
| `GradeService.returnWork` | Student/Course | `GRADE_CHANGED` | Existing transaction |
| `GradeService.regrade` | Student/Course | `GRADE_CHANGED` | Existing transaction |
| `QuizReviewService.saveReview` | Student/Course | `ASSESSMENT_CHANGED` | New transaction required |
| `QuizReviewService.finalizeReview` | Student/Course | [`ASSESSMENT_CHANGED`, `GRADE_CHANGED`] | Existing transaction |
| `QuizReviewService.release` | Student/Course | [`ASSESSMENT_CHANGED`, `GRADE_CHANGED`] | Existing transaction |
| `QuizReviewService.regrade` | Student/Course | [`ASSESSMENT_CHANGED`, `GRADE_CHANGED`] | Existing transaction |

Grade `DRAFT` làm đổi Teacher Gradebook/ungraded count; Grade `RETURNED` thêm Student/Admin
eligible aggregate.

## 8. Deadline Exception

| Source method | Scope | Reasons | Transaction |
| --- | --- | --- | --- |
| `DeadlineExceptionService.set` | Student/Course | `DEADLINE_EXCEPTION_CHANGED` | Existing transaction |
| `DeadlineExceptionService.revoke` | Student/Course | `DEADLINE_EXCEPTION_CHANGED` | Existing transaction |

History read không invalidate.

## 9. Reporting Definition

| Action | Scope | Reasons |
| --- | --- | --- |
| Activate new metric version | All affected Courses | `METRIC_VERSION_CHANGED` |
| Manual repair | Requested Course/Student | `MANUAL_REBUILD` |

P06 V1 không expose metric activation UI. Version change là controlled deployment/migration.
Một reason trong bảng tương ứng singleton array; cú pháp `[...]` biểu diễn mutation có nhiều
reasons và writer phải ghi chúng trong một upsert.

## 10. Router/Composition Changes

Source hiện tại có signature:

```ts
createPhaseFourRouter(config, classrooms);
createPhaseFiveRouter(config, classrooms);
```

P06 thay đổi contract một lần, không dùng optional production dependency:

```ts
interface PhaseFourRouterDependencies {
  reportingInvalidationWriter: ReportingInvalidationWriter;
}

interface PhaseFiveRouterDependencies {
  reportingInvalidationWriter: ReportingInvalidationWriter;
}

createPhaseFourRouter(config, classrooms, dependencies);
createPhaseFiveRouter(config, classrooms, dependencies);
```

Composition sequence bắt buộc:

1. `app.ts` tạo một `ClassroomRepository`.
2. `createPhaseSixFoundation(config, classrooms)` tạo Mongo invalidation writer và reporting
   services/repositories.
3. `app.ts` truyền đúng writer instance vào Phase Four và Phase Five router.
4. `app.ts` truyền cùng foundation vào `createPhaseSixRouter`.
5. Source services nhận interface, không import P06 models.
6. Production startup/typecheck phải fail nếu thiếu writer; noop chỉ được khởi tạo trực tiếp trong
   focused unit tests.
7. Route cutover xóa registration cũ trước khi mount P06 router; thứ tự mount không được dùng để
   che duplicate handler.

## 11. Read-Time Recovery

- Student-specific pending invalidation: bounded refresh trước response.
- Course-wide invalidation với active roster `<=100`: source snapshot full Course trong request
  budget, sau đó batch upsert.
- Vượt bound/budget: stale/partial hoặc explicit rebuild-required response.
- Reconciliation command phát hiện missed invalidation/orphan/mismatch.

## 12. Tests

- Every mapped mutation writes expected scope/reasons.
- Two-reason mutation coalesces without losing either reason.
- Transaction rollback leaves no source/invalidation partial pair.
- Idempotent replay coalesces.
- Fault in summary refresh does not rollback source.
- Classroom invalidation expands bounded Courses.
- Course-wide and Student invalidation precedence.
- saveAnswers does not alter last-active V1.
- Deadline/Grade transitions update only affected Student where possible.
