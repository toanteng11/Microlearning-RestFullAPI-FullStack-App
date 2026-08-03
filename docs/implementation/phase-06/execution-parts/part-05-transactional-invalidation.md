# Part 05 - Transactional Invalidation

## Goal

Bảo đảm mọi source mutation ảnh hưởng reporting ghi durable invalidation intent trong cùng
MongoDB transaction.

## Parent PR

`P06-PR02 - Foundation`

## Dependencies

- Part 04 `DONE`.
- `source-event-invalidation-matrix.md` Accepted.

## Files

Create:

```text
apps/api/src/modules/learning-content/reporting-invalidation.writer.ts
apps/api/src/modules/phase-six.foundation.ts
```

Modify:

```text
apps/api/src/app.ts
apps/api/src/modules/phase-four.router.ts
apps/api/src/modules/phase-five.router.ts
Enrollment/Classroom/Course/Lesson/Quiz/Assignment services
Quiz Attempt/Review/Submission/Grade/Deadline Exception services
Student Learning service
```

## Work

1. Tạo neutral `ReportingInvalidationWriter` port.
2. Tạo một `phaseSixFoundation` duy nhất trong composition root.
3. Inject writer bắt buộc vào Phase Four/Five factories.
4. Không có production default/noop writer.
5. Ghi source state và intent bằng cùng `ClientSession`.
6. Wrap `StudentLearningService.start/complete` và `QuizReviewService.saveReview`.
7. Reuse transaction hiện có cho các mutation còn lại.
8. Không invalidate `saveAnswers` theo V1 nếu matrix không yêu cầu.
9. Coalesce multiple reasons mà không mất newest watermark.

## Tests

- `P06-IT-005..007`.
- `P06-IT-016`.
- Transaction rollback, retry, duplicate intent và stale worker cases.
- Focused unit test phải truyền fake writer explicit.

## Stop Conditions

- Source commit nhưng intent không commit atomic.
- Refresh được gọi bên trong source transaction.
- Producer import reporting Mongoose model.
- Production composition có noop.

## Definition Of Done

- `P06-AC-012` và `P06-AC-013` Pass.
- Source rollback không để intent mồ côi.
- Refresh failure sau commit không rollback source.
- Production composition test xác nhận đúng một real writer.

## Implementation Result

`DONE` tại commit `1afe813`.

- Một neutral writer port và một real Mongo writer được tạo đúng composition root.
- Writer bắt buộc được inject qua Phase Three/Four/Five; không có production noop/default.
- Các source mutations trong matrix ghi invalidation bằng cùng session; `saveAnswers` không
  invalidate theo V1.
- Replica-set tests chứng minh source+intent cùng commit/rollback, stale worker không xóa intent
  mới và refresh lỗi sau commit không rollback source.
