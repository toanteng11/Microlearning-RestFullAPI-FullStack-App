# Phase 05 Assignment, Submission And Grading

## 1. Assignment Lifecycle

```text
DRAFT -> SCHEDULED -> PUBLISHED -> UNPUBLISHED -> PUBLISHED
                         |              |
                         +-> CLOSED ----+-> PUBLISHED (reopen with reason)
                         |
                         +-----------------> ARCHIVED
```

| State | Student view/action | Teacher action |
| --- | --- | --- |
| `DRAFT` | Không thấy | Edit/publish/archive |
| `SCHEDULED` | Chưa thấy trước thời điểm | Edit schedule/unpublish/archive |
| `PUBLISHED` | View/save/turn in theo policy | Edit bị giới hạn, close/unpublish/archive |
| `UNPUBLISHED` | Không tạo action mới; history giữ | Edit/republish/archive |
| `CLOSED` | View history/result; không turn in/resubmit | Reopen có reason hoặc archive |
| `ARCHIVED` | Historical access theo policy | Read-only normal flow |

`SCHEDULED` dùng cùng effective-status resolver của P04/Quiz: khi `scheduledPublishAt <= now`, Student read/submit eligibility coi Assignment là published dù stored status chưa được explicit reconciliation. Mọi endpoint phải dùng resolver chung, không dựa riêng vào cron.

## 2. Assignment Publish Prerequisites

- Teacher owner Course và có capability.
- Title 2-150; instruction 1-100.000 ký tự.
- `maxScore` integer 1-1000.
- `dueDate` bắt buộc và sau `availableFrom/now` khi publish lần đầu.
- Ít nhất một enabled submission method.
- Must baseline có `TEXT`; `LINK/MARK_DONE` theo conditional feature/policy.
- `FILE` không được advertise/accept khi storage capability disabled.
- `allowLateSubmission`, `allowUnsubmit`, `allowResubmit` explicit.
- Course/Module/Classroom effective state cho phép publish.

## 3. Submission Method Validation

| Method | Payload | Validation |
| --- | --- | --- |
| `TEXT` | `textAnswer` | 1-100.000 ký tự khi turn in |
| `LINK` | 1-5 HTTPS URLs | Syntax/length/scheme/host policy; không server fetch |
| `MARK_DONE` | Boolean confirmation | Chỉ khi Teacher enabled; không kèm fake text |
| `FILE` | Upload references | Rejected `FEATURE_NOT_ENABLED` trong P05 |

Draft có thể chưa đủ dữ liệu turn-in nhưng phải pass type/size safety cơ bản.

## 4. Stored And Derived States

### 4.1 Stored Submission

`DRAFT`, `SUBMITTED`, `LATE`, `GRADED`, `RETURNED`.

### 4.2 Derived Roster Row

Roster status là projection theo `asOf`, `submittedAt`, Grade state và **effective deadline hiện tại**. Submission vẫn giữ `status`, `isLate` và `effectiveDeadlineAtSubmit` như bằng chứng tại lần turn-in; vì vậy một deadline exception cấp sau đó có thể đổi roster display từ `LATE` thành `SUBMITTED` mà không sửa lịch sử turn-in.

| Condition | Derived status |
| --- | --- |
| Không current Submission, chưa due | `ASSIGNED` |
| Không valid turn-in, đã due | `MISSING` |
| Current `DRAFT`, chưa due | `IN_PROGRESS` |
| Current `DRAFT`, đã due | `MISSING` |
| Current valid turn-in trước/equal due | `SUBMITTED` |
| Current valid turn-in sau due | `LATE` |
| Grade draft saved | `GRADED` |
| Grade returned | `RETURNED` |

Effective due date dùng Student deadline exception trước default Assignment due date.

## 5. Current Submission And History

Mỗi Student/Assignment có tối đa một current Submission document. Mọi meaningful transition tạo append-only `submission_revisions` hoặc `submission_events`:

- draft saved;
- turned in;
- unsubmitted;
- resubmission draft/turned in;
- grade state changed;
- returned.

History lưu revision number, state, safe content snapshot/hash, submittedAt, isLate, actor/time/reason. Nếu future FILE enabled, history chỉ lưu object metadata/version, không signed URL.

## 6. Save Draft

- Student active/enrolled, Assignment visible và chưa archived/closed.
- Payload method thuộc enabled policy.
- `expectedSubmissionRevision` để tránh ghi đè tab/thiết bị khác.
- Upsert natural key `{assignmentId, studentId}`.
- Save draft không đặt `submittedAt`, không hoàn thành To-do.
- Nếu Assignment unpublished sau khi draft tồn tại, Student có thể xem safe draft/history theo policy nhưng không turn in.

## 7. Turn In

### Preconditions

1. Current Assignment effective `PUBLISHED`.
2. Student active/enrolled.
3. Submission payload đầy đủ theo method.
4. Assignment chưa closed/archived.
5. Nếu `now > effectiveDueDate`, `allowLateSubmission=true`.
6. Expected revision khớp.

### Transaction

```text
resolve effective deadline
  -> validate policy/content/revision
  -> append immutable revision/event
  -> set state SUBMITTED or LATE + server submittedAt
  -> update activity progress/completion
  -> invalidate scoped To-do/deadline/dashboard cache/read
  -> audit safe metadata
```

Duplicate turn-in cùng terminal revision trả idempotent current result hoặc conflict; không tạo duplicate current/history.

## 8. Unsubmit

- Chỉ `SUBMITTED/LATE` chưa có Grade draft, trừ policy riêng.
- Assignment `PUBLISHED`, chưa `CLOSED/ARCHIVED`.
- `allowUnsubmit=true`.
- Default chỉ trước/equal effective due date; late unsubmit cần Teacher-approved policy.
- Chuyển current về `DRAFT`, giữ previous submittedAt trong history.
- Activity completion đảo về incomplete; To-do xuất hiện lại theo effective deadline.
- Có confirmation rõ trên UI.

## 9. Resubmit

- `allowResubmit=true`.
- Cho phép sau unsubmit trước khi Grade/Return; resubmit sau `RETURNED` deferred Post-MVP.
- Tạo revision mới; không sửa nội dung revision đã grade.
- Assignment vẫn open; late rule áp dụng theo thời điểm turn in mới.
- Grade cũ giữ trong history; current Grade chuyển draft/review-needed theo policy, không silently giữ score cho content mới.

## 10. Submission Roster Query

Teacher table không chỉ query `submissions`; phải left join/merge active Enrollment roster với current Submission:

- Student identity projection tối thiểu.
- Derived status theo `asOf` server.
- effective due date và exception indicator.
- submittedAt, isLate, submission revision.
- Grade state/score release metadata.
- Search normalized name/email/student code.
- Filter `ASSIGNED/IN_PROGRESS/MISSING/SUBMITTED/LATE/GRADED/RETURNED`.
- Stable sort mặc định status priority, submittedAt, Student name, Student ID.
- Pagination server-side; không tải toàn roster về React để lọc.

## 11. Grade Lifecycle

```text
NO_GRADE -> DRAFT -> RETURNED
                ^       |
                +-------+ (regrade creates new revision)
```

Grade identity unique theo `{studentId, activityType, activityId}` và link current evidence (`submissionId/revision` hoặc `attemptId`).

### Save Grade Draft

- Teacher owner/authorized.
- Submission/Attempt thuộc đúng Student/Classroom/Course/activity.
- Integer score `0..maxScoreSnapshot`.
- Feedback optional 0-20.000; nếu present phải non-empty sau trim.
- Expected grade revision.
- Student projection không trả draft score/feedback.

### Return Work/Result

- Grade draft hợp lệ.
- Với Assignment, current Submission revision phải là revision được grade; nếu Student đã resubmit, yêu cầu review lại.
- Transactionally set Grade `RETURNED`, `returnedAt`, `returnedBy`, update Submission/Attempt result state và append history/AuditLog.
- Student thấy score, max score, feedback, returnedAt và activity link ngay ở query kế tiếp.

### Regrade

- Teacher nhập reason 10-500.
- Expected grade revision bắt buộc.
- Old/new score/feedback hash/state lưu history; AuditLog chỉ safe summary.
- Nếu Grade đang `RETURNED`, regrade tạo draft mới hoặc return updated result theo explicit command; không thay visible result nửa chừng.
- P06 read model/event được invalidated/recalculated khi triển khai.

## 12. Quiz Grade Integration

- Attempt lưu raw computed score theo assessment snapshot.
- Final Grade summary chọn attempt theo `HIGHEST` policy.
- Manual review/regrade cập nhật attempt reviewed scores và Grade current trong transaction.
- Result release dùng cùng Grade visibility boundary với Assignment.
- Student grade list có `activityType`, activity title, score, max score, status, returnedAt; không lộ answer key.

## 13. Feedback And Private Comment

### Must Feedback

- Feedback current thuộc Grade và chỉ Teacher scope + Student owner xem.
- Sanitize/render an toàn; không raw HTML.
- Không log full text, không đưa vào broad report/export mặc định.

### Conditional Private Comment

- Thread thuộc Assignment + Student; participant chỉ Student liên quan và Teacher owner.
- Comment 1-5.000 ký tự, timestamps, author role.
- Edit/delete nếu bật phải giữ audit/retention semantics.
- Không thay thế Grade feedback hoặc Stream Announcement.

## 14. Own Grade Projection

Student endpoint chỉ trả Grade `RETURNED` của current Student:

- activity/classroom/course identity và title;
- activity type;
- score/maxScore/percentage derived;
- feedback;
- returnedAt;
- status/action URL;
- attempt/submission reference safe nếu cần navigation.

Không nhận `studentId` từ query/body để chọn người khác. Teacher/Admin projection dùng endpoint khác và capability khác.

## 15. Errors

| Code | HTTP | Ý nghĩa |
| --- | --- | --- |
| `ASSIGNMENT_NOT_AVAILABLE` | 409 | Không published/available |
| `ASSIGNMENT_CLOSED` | 409 | Đã đóng |
| `LATE_SUBMISSION_NOT_ALLOWED` | 409 | Quá hạn và late disabled |
| `SUBMISSION_METHOD_NOT_ALLOWED` | 422 | Method không enabled |
| `SUBMISSION_INCOMPLETE` | 422 | Thiếu payload cần thiết |
| `UNSUBMIT_NOT_ALLOWED` | 409 | Policy/state không cho phép |
| `RESUBMIT_NOT_ALLOWED` | 409 | Policy/state không cho phép |
| `SUBMISSION_REVISION_MISMATCH` | 409 | Grade nhắm revision cũ |
| `INVALID_GRADE_SCORE` | 422 | Ngoài range |
| `GRADE_NOT_READY_TO_RETURN` | 409 | Draft/evidence chưa hợp lệ |
| `FEATURE_NOT_ENABLED` | 409 | FILE/media/private comment chưa bật |

## 16. Audit Events

`ASSIGNMENT_CREATED`, `ASSIGNMENT_STATUS_CHANGED`, `SUBMISSION_SAVED`, `SUBMISSION_TURNED_IN`, `SUBMISSION_UNSUBMITTED`, `SUBMISSION_RESUBMITTED`, `GRADE_SAVED`, `WORK_RETURNED`, `GRADE_REVISED`.

Không log submission text, link đầy đủ nếu nhạy cảm, feedback body hoặc future signed URL.
