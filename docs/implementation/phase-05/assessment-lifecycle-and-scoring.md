# Phase 05 Assessment Lifecycle And Scoring

## 1. Quiz Lifecycle

```text
DRAFT -> SCHEDULED -> PUBLISHED -> UNPUBLISHED -> PUBLISHED
  |          |             |             |
  +----------+-------------+-------------+-> ARCHIVED
```

| Current | Allowed next | Preconditions |
| --- | --- | --- |
| `DRAFT` | `SCHEDULED`, `PUBLISHED`, `ARCHIVED` | Valid Quiz + Question set + ownership |
| `SCHEDULED` | `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` | Teacher publish now/reconcile hoặc Teacher cancels |
| `PUBLISHED` | `UNPUBLISHED`, `ARCHIVED` | Existing attempt retained |
| `UNPUBLISHED` | `PUBLISHED`, `ARCHIVED` | Revalidate current assessment revision |
| `ARCHIVED` | None trong normal flow | Historical result read-only theo policy |

Student chỉ thấy/start Quiz khi Quiz, Course, optional Module, Classroom, Enrollment và availability đều hợp lệ.

Khi `scheduledPublishAt <= now`, effective-status resolver coi Quiz là published cho read/eligibility dù stored status vẫn `SCHEDULED`; explicit mutation/reconciliation có thể chuẩn hóa stored status sau đó. Vì vậy P05 không phụ thuộc cron nhưng mọi query phải dùng cùng resolver.

## 2. Publish Prerequisites

- Teacher có `quiz.publish_owned` và quản lý Course parent.
- Title 2-150, instruction tối đa 100.000 ký tự.
- `attemptLimit` integer 1-10.
- `timeLimitMinutes` null hoặc integer 1-180.
- `availableFrom < dueDate` nếu cả hai có.
- `dueDate` phải sau server `now` khi publish lần đầu, trừ authorized correction.
- Có 1-100 active Question.
- Mỗi Question có 1-100 integer points; tổng `maxScore` 1-1000.
- Choice/true-false correct answer hợp lệ.
- `IMMEDIATE` bị từ chối nếu có `SHORT_ANSWER` cần manual review.
- Optional media phải pass feature flag/allowlist; media vắng mặt không chặn Question text hợp lệ.

Publish tăng `publishedRevision`, chụp scoring manifest hash/version và ghi AuditLog metadata. Không copy toàn bộ correct answer vào AuditLog.

## 3. Question Lifecycle And Mutation

Question stored status: `ACTIVE` hoặc `ARCHIVED`.

- Question chỉ mutate khi Quiz không `PUBLISHED/SCHEDULED`.
- Mọi Question create/update/archive dùng Quiz aggregate `expectedQuestionRevision`; mutation thành công tăng revision đúng một lần.
- Reorder gửi exact ordered active Question IDs và `expectedQuestionRevision`.
- Question ID và option ID ổn định qua reorder.
- Sau khi đã có Attempt, Teacher có thể unpublish và tạo revision mới; attempt cũ không trỏ live scoring data để tính lại tự động.
- Archive Question không xóa snapshot trong Attempt.

## 4. Question Validation

### 4.1 Common

| Field | Rule |
| --- | --- |
| `prompt` | 1-10.000 ký tự, normalized UTF-8 |
| `type` | Một trong bốn type baseline |
| `points` | Integer 1-100 khi active/publish |
| `isRequired` | Boolean, mặc định true |
| `explanation` | Optional, Teacher/result projection tùy release; tối đa 10.000 |
| `media` | Optional metadata, tối đa 1 item P05 |

### 4.2 Type-Specific

| Type | Rule |
| --- | --- |
| `SINGLE_CHOICE` | 2-10 options, unique normalized label, đúng 1 option correct |
| `MULTIPLE_CHOICE` | 2-10 options, correct set có ít nhất 1, exact-set scoring |
| `TRUE_FALSE` | Canonical two options; đúng 1 answer |
| `SHORT_ANSWER` | Không options/correctOptionIds; optional private rubric/reference |

## 5. Attempt State Machine

```text
IN_PROGRESS
  -> SUBMITTED ---------> GRADED -> RESULT_RELEASED
  -> TIMED_OUT ---------> GRADED -> RESULT_RELEASED
  -> NEEDS_REVIEW ------> GRADED -> RESULT_RELEASED
```

`SUBMITTED` được dùng khi objective scoring hoàn tất nhưng result chưa release. Nếu policy `IMMEDIATE`, command submit có thể transactionally đi thẳng tới `RESULT_RELEASED` sau khi tạo Grade/result projection.

## 6. Start Attempt

### Preconditions

1. Actor `STUDENT`, account/enrollment active.
2. Quiz effective `PUBLISHED`, `availableFrom <= now <= dueDate` nếu configured.
3. Không có active `IN_PROGRESS` attempt; nếu có thì trả attempt đó để resume.
4. Số terminal/current attempts nhỏ hơn `attemptLimit`.
5. Course/Classroom không archived/locked theo access policy.

### Transaction

```text
reconcile expired active attempt
  -> find resumable active attempt
  -> count/allocate next attemptNumber
  -> load active Question + scoring snapshot
  -> create Attempt(IN_PROGRESS, startedAt, expiresAt, revision=1)
  -> create/update LearningProgress(IN_PROGRESS)
  -> return Student-safe attempt projection
```

Unique indexes chặn hai attempt cùng number và hơn một active attempt. Duplicate start trả current active attempt, không tăng limit.

## 7. Attempt Snapshot

Attempt snapshot phải chứa đủ dữ liệu chấm độc lập với Question live:

- `assessmentRevision`, Quiz title/settings/maxScore snapshot.
- Question ID/version/type/prompt/points/required/order.
- Option ID/label/order.
- Scoring key (correct option IDs) trong server-only subdocument.
- Short-answer rubric/reference trong server-only subdocument.
- Media metadata version đã authorize tại thời điểm start.

DTO Student chỉ trả phần public. Repository/log serializer không được dump snapshot scoring key.

## 8. Save Answers

- Endpoint nhận one or bounded batch answers và `expectedAttemptRevision`.
- Chỉ `IN_PROGRESS`, trước `expiresAt`.
- Answer question ID phải thuộc snapshot.
- Choice answer option ID phải thuộc snapshot option set.
- Short answer tối đa 20.000 ký tự; normalized nhưng giữ newline cần thiết.
- Server set `lastSavedAt`, tăng revision; client timestamp chỉ dùng telemetry không authoritative.
- Save retry với cùng revision/state có defined idempotent response hoặc `409`, không overwrite answer mới.

## 9. Timeout Reconciliation

`expiresAt = min(startedAt + timeLimit, due/effective deadline)` khi có các giới hạn tương ứng.

Mọi GET active, save, submit và Teacher result list gọi reconciler:

1. Nếu `now < expiresAt`, không đổi.
2. Nếu expired và vẫn `IN_PROGRESS`, transactionally freeze latest persisted answers.
3. Auto-score objective answers.
4. Nếu có short answer cần review: `NEEDS_REVIEW`; ngược lại `TIMED_OUT` rồi tạo final score state theo release policy.
5. Cập nhật activity completion/To-do.
6. Ghi safe audit/metric, không ghi answer body.

Không tin timer React để quyết định hợp lệ; UI countdown chỉ là trình bày.

## 10. Submit Attempt

### Request Guard

- `expectedAttemptRevision` bắt buộc.
- Optional `confirmUnanswered=true` chỉ là UX; backend chấp nhận unanswered nếu policy không yêu cầu hoặc trả validation details nếu required.
- Attempt ownership và active state.
- Server now chưa quá expiry; nếu quá thì reconciliation quyết định state.

### Scoring

| Type | Algorithm |
| --- | --- |
| Single choice | Selected option ID equals correct option ID |
| Multiple choice | Sorted unique selected set equals correct set |
| True/false | Selected canonical option equals correct |
| Short answer | `manualStatus=PENDING`; auto points 0 tạm thời, không final |
| Unanswered | 0 points |

`objectiveScore`, `manualScore`, `totalScore`, `maxScore` được tính server. P05 dùng integer point; không floating rounding.

### Idempotency

- First valid submit finalizes attempt exactly once.
- Retry terminal attempt trả same safe result với `idempotentReplay=true` hoặc `409 ATTEMPT_ALREADY_FINALIZED`; không tạo Grade/progress trùng.
- Concurrent submit chỉ một transaction thắng.

## 11. Manual Review And Regrade

Teacher owner mở attempt detail Teacher projection, nhập point/feedback cho từng short answer:

- Score mỗi answer integer trong `[0, question.points]`.
- Tất cả manual answers phải reviewed trước attempt `GRADED`.
- Save draft review dùng `expectedReviewRevision` và chưa release.
- Finalize review tính total score, cập nhật final Grade candidate theo `HIGHEST` policy.
- Regrade giữ old/new score, reason 10-500, actor/time/revision trong history và AuditLog.
- Thay final attempt có thể đổi Grade current; không xóa attempt cũ.

## 12. Result Release

| Policy | Behavior |
| --- | --- |
| `IMMEDIATE` | Chỉ objective Quiz; submit tạo released result ngay |
| `AFTER_REVIEW` | Release tự động khi manual review hoàn tất |
| `TEACHER_RETURN` | Teacher explicit return/release |

Student result DTO có thể gồm score, maxScore, attempt number, submittedAt, status và Teacher feedback. Correct answer/explanation chỉ trả nếu một future explicit review policy được bật; mặc định P05 không trả scoring key.

## 13. Final Score Policy

- `HIGHEST`: Grade/result summary lấy attempt có `totalScore` cao nhất trong các final attempts.
- Tie: attempt submitted sớm hơn thắng, sau đó `_id` ổn định.
- `NEEDS_REVIEW` không tham gia final score tới khi graded.
- Mọi attempt vẫn hiển thị trong Teacher result list; Student history theo policy.

## 14. Basic Performance Metrics

Teacher result endpoint trả:

- roster count, started count, submitted count, needs review count, released count.
- average released/final score, max/min, completion rate.
- paginated Student rows với latest/best attempt metadata.

Không trả question-level analytics nâng cao, discrimination index hoặc export trong Must P05.

## 15. Error Catalog

| Code | HTTP | Khi nào |
| --- | --- | --- |
| `QUIZ_NOT_AVAILABLE` | 409 | Chưa tới availability hoặc unpublished |
| `QUIZ_DUE_PASSED` | 409 | Không được start sau effective due |
| `ATTEMPT_LIMIT_REACHED` | 409 | Hết số lần làm |
| `ATTEMPT_EXPIRED` | 409 | Save/submit sau expiry |
| `ATTEMPT_ALREADY_FINALIZED` | 409 | Terminal attempt bị submit lại |
| `INVALID_ATTEMPT_ANSWER` | 422 | Question/option không thuộc snapshot |
| `QUIZ_HAS_NO_VALID_QUESTION` | 409 | Publish prerequisite fail |
| `QUIZ_HAS_MANUAL_QUESTION` | 409 | `IMMEDIATE` không phù hợp |
| `REVIEW_INCOMPLETE` | 422 | Còn short answer chưa chấm |
| `CONCURRENT_MODIFICATION` | 409 | Revision stale |

## 16. Audit Events

`QUIZ_CREATED`, `QUIZ_STATUS_CHANGED`, `QUIZ_REVISION_PUBLISHED`, `ATTEMPT_STARTED`, `ATTEMPT_FINALIZED`, `QUIZ_REVIEW_FINALIZED`, `QUIZ_RESULT_RELEASED`, `QUIZ_REGRADED`.

Audit metadata chỉ gồm IDs, revision, status, score summary và reason đã allowlist; không chứa prompt private, answer text, correct key hoặc feedback body.
