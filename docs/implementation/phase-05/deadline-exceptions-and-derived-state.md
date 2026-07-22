# Phase 05 Deadline Exceptions And Derived State

## 1. Mục Đích

P04 hỗ trợ default Lesson deadline và global deadline history. P05 bổ sung assessment deadlines và per-Student exception để Teacher xử lý trường hợp cá nhân mà không thay hạn của cả lớp.

## 2. Deadline Sources

| Activity | Default deadline | Required before publish |
| --- | --- | --- |
| Lesson | `completionDeadline` P04 | Có theo P04 Must policy |
| Quiz | `dueDate` | Có trong P05 Must baseline dù BA cho optional, để To-do rõ |
| Assignment | `dueDate` | Có |

## 3. Effective Deadline Precedence

```text
active Student deadline exception
  ?? activity default deadline
  ?? null (chỉ optional/non-actionable policy)
```

Response phải trả cả `defaultDeadline`, `effectiveDeadline`, `hasException`, `exceptionRevision` khi actor có quyền. Student không thấy internal reason nếu reason chứa thông tin hỗ trợ riêng; UI Student chỉ cần nhãn “Hạn riêng do giảng viên cập nhật” và effective date.

## 4. Exception Scope

Identity unique theo:

```text
studentId + activityType + activityId
```

Record denormalize `classroomId`, `courseId`, optional `moduleId` để scope/query/audit. `activityType` gồm `LESSON`, `QUIZ`, `ASSIGNMENT`.

## 5. Allowed Actions

| Action | Teacher normal flow | Exceptional actor |
| --- | --- | --- |
| Set first extension | Allowed | Allowed |
| Extend existing exception | Allowed | Allowed |
| Shorten below current effective deadline | Denied | Capability + reason/audit |
| Set past deadline | Denied | Capability + reason/audit |
| Revoke exception về default | Allowed nếu không làm deadline ngắn hơn bất lợi; nếu có thì denied | Capability + reason/audit |
| Change archived activity | Denied | Restore hoặc explicit governance flow |
| Change Student ngoài active enrollment | Denied normal | Historical governance only |

## 6. Mutation Contract

Request:

- `deadline`: ISO UTC date-time hoặc `null` khi revoke.
- `reason`: 10-500 ký tự.
- `expectedRevision`: integer >= 0.
- `acknowledgeShortening`: chỉ recognized cho exceptional capability.

Transaction:

```text
authorize Teacher/Course/Student enrollment
  -> resolve activity/default/current effective deadline
  -> validate direction/time/policy/revision
  -> append deadline_exception_history
  -> upsert/revoke current exception
  -> invalidate/recompute scoped Student derived state
  -> AuditLog safe old/new/reason metadata
  -> return new effective state
```

Không gọi notification provider trong transaction.

## 7. History

Append-only history lưu:

- activity/student/course/classroom IDs;
- from/to deadline;
- from/to revision;
- action `SET/EXTEND/SHORTEN/REVOKE`;
- actor ID/role;
- reason;
- changedAt/requestId;
- whether exceptional capability was used.

Student không có endpoint xem reason/history đầy đủ. Teacher owner xem paginated history; Admin chỉ khi governance capability.

## 8. Derived Status

### Quiz

| Condition at `asOf` | Derived state |
| --- | --- |
| No final attempt, before/equal effective due | `NOT_STARTED/IN_PROGRESS` |
| No final attempt, after due | `MISSING` |
| Final attempt submitted at/before due | `COMPLETED_ON_TIME` |
| Final attempt after due (nếu policy cho) | `COMPLETED_LATE` |

Baseline P05 không cho start mới sau due; late Quiz chỉ có thể xuất hiện do exception/reconciliation policy được chấp thuận.

### Assignment

Các giá trị dưới đây là derived roster/activity state tại `asOf`. `Submission.status/isLate/effectiveDeadlineAtSubmit` vẫn là immutable evidence của lần turn-in; deadline exception mới chỉ làm thay đổi projection hiện tại và không viết lại revision history.

| Condition | Derived state |
| --- | --- |
| No valid turn-in before due | `ASSIGNED/IN_PROGRESS` |
| No valid turn-in after due | `MISSING` |
| Turn-in <= effective due | `SUBMITTED` |
| Turn-in > effective due và allowed | `LATE` |
| Grade draft | `GRADED` |
| Grade released | `RETURNED` |

## 9. To-do Integration

P05 response version:

```json
{
  "scopeVersion": "P05_MULTI_ACTIVITY_TODO_V1",
  "asOf": "2026-08-01T10:00:00.000Z",
  "activityTypes": ["LESSON", "QUIZ", "ASSIGNMENT"]
}
```

Canonical active To-do:

- visible + required activity;
- Student active enrollment;
- not completed by activity completion rule;
- Assignment unsubmit đưa lại item;
- result pending/manual review không đưa Quiz lại To-do;
- sort priority: `MISSING`, due soon, no due; then effective deadline, Classroom/Course/order/ID.

## 10. Deadline View Integration

- Filter `activityType`, `classroomId`, `courseId`, date range, status.
- Server-side pagination and stable sort.
- Item trả `effectiveDeadline`, `defaultDeadline` only when useful, exception indicator, derived status, action URL.
- Date range bounded theo existing P04 policy; URL query invalid trả validation error và UI fallback an toàn.

## 11. Progress Integration

Metric version: `P05_REQUIRED_ACTIVITY_COMPLETION_V1`.

```text
completionPercentage = completed required activities / total visible required activities * 100
```

- Lesson complete theo P04.
- Quiz complete khi valid attempt finalizes, kể cả `NEEDS_REVIEW`.
- Assignment complete khi valid turn-in; unsubmit đảo completion.
- Grade/score không làm đổi completion flag.
- Optional activity không vào denominator.
- Denominator 0 trả `percentage=null`, không tự nhận 100%.

P06 có thể dùng Grade để xây weighted `processScore`; P05 không hard-code.

## 12. Recalculation Consistency

P05 ưu tiên query derived from source giống P04. Nếu cache/read model được thêm:

- source transaction commit trước;
- response nêu `asOf`, `metricVersion`, optional `freshness`;
- có rebuild/reconciliation command;
- stale state không được vượt SLA đã định nghĩa;
- exception mutation chỉ invalidates Student/course liên quan.

## 13. Edge Cases

| Case | Expected |
| --- | --- |
| Exception equal default | Allowed nhưng UI có thể khuyên revoke; không đổi derived result |
| Extend sau Student completed | Preserve submitted/completed time; late có thể recalc thành on-time |
| Revoke làm Student thành missing | Confirmation + reason; normal Teacher denied nếu bất lợi theo policy |
| Enrollment removed | Không tạo action mới; historical grade/progress retention theo rule |
| Activity unpublish | Active To-do ẩn; submission/attempt/history không xóa |
| Activity archive | No new action; historical result retained |
| Concurrent exception update | One revision wins, other `409` |
| Time exactly due | `now <= due` còn on-time; sau due mới missing/late |

## 14. Error Codes

`DEADLINE_EXCEPTION_NOT_ALLOWED`, `DEADLINE_SHORTENING_DENIED`, `DEADLINE_IN_PAST`, `ACTIVITY_ARCHIVED`, `STUDENT_NOT_ACTIVE_IN_CLASSROOM`, `CONCURRENT_MODIFICATION`, `INVALID_DEADLINE`.

## 15. Acceptance Focus

- Student A exception không thay Student B.
- To-do/Deadline/Classwork query kế tiếp phản ánh effective deadline.
- Existing completion/submission timestamp không bị rewrite.
- Extend có thể recalc late/missing đúng.
- Non-owner/no reason/past/archive/stale revision không tạo partial history/current state.
