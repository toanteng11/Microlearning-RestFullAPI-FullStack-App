# Phase 04 Deadline And Derived State

## 1. Mục Đích

Định nghĩa deadline toàn Lesson, lịch sử thay đổi, trạng thái `UPCOMING/MISSING/LATE/COMPLETED`, Student To-do và Course Dashboard v1. Backend là nguồn tính toán duy nhất; client không tự suy diễn bằng đồng hồ riêng ngoài hiển thị đếm ngược.

## 2. Deadline Scope

- P04 deadline áp dụng cho toàn bộ Student của Lesson.
- Mỗi Lesson có tối đa một `completionDeadline` hiện hành.
- Per-Student exception thuộc Phase 05, không nằm trong schema/API P04.
- Deadline là ISO-8601 timestamp UTC; frontend bắt buộc gửi offset hoặc `Z`.
- Teacher UI hiển thị local time và timezone trước khi xác nhận.

## 3. Deadline Operations

| Operation | Allowed state | Rule |
| --- | --- | --- |
| Set lần đầu | `DRAFT`, `UNPUBLISHED` | Deadline phải ở tương lai |
| Clear | `DRAFT`, `UNPUBLISHED` | Reason không bắt buộc; history vẫn ghi nếu từng có value |
| Extend | Mọi non-archived state | Published/Scheduled bắt buộc reason |
| Shorten | `DRAFT`, `UNPUBLISHED` | Được phép nếu vẫn ở tương lai |
| Shorten published | Không trong Must | Trả `DEADLINE_SHORTENING_NOT_ALLOWED` |
| Change archived | Không | Trả `CONTENT_ARCHIVED` |

## 4. Request Contract

```json
{
  "completionDeadline": "2026-08-10T16:59:59.000Z",
  "reason": "Gia hạn do lịch nghỉ của lớp",
  "expectedDeadlineRevision": 2
}
```

- `completionDeadline=null` chỉ hợp lệ khi clear ở state cho phép.
- `reason` trim; khi bắt buộc phải từ 10 đến 500 ký tự.
- `expectedDeadlineRevision` integer không âm.
- Server lấy actor/time/requestId; client không gửi audit identity.

## 5. Atomic Write

Trong một Mongo transaction:

1. Load Lesson và Course scope.
2. Authorize current Classroom owner.
3. Validate lifecycle và deadline revision.
4. Validate old/new deadline và reason.
5. Update Lesson deadline fields, tăng revision.
6. Insert `lesson_deadline_changes` immutable record.
7. Insert AuditLog `LESSON_DEADLINE_CHANGED`.
8. Commit.

Không update `learning_progress`; derived query đọc deadline mới. Nếu history/audit fail, toàn mutation rollback.

## 6. Deadline History Record

| Field | Rule |
| --- | --- |
| `_id` | ObjectId |
| `lessonId` | Required, immutable |
| `courseId` | Required, query/audit context |
| `classroomId` | Required, governance context |
| `fromDeadline` | UTC hoặc null |
| `toDeadline` | UTC hoặc null |
| `fromRevision` | Integer |
| `toRevision` | `fromRevision + 1` |
| `reason` | Required theo operation |
| `actorId` | Server derived |
| `requestId` | Correlation ID |
| `changedAt` | Server clock UTC |

Collection này không có update/delete route.

## 7. Progress Status Function

Input: Lesson visibility/required/deadline, Student progress và trusted server `now`.

```text
if completedAt exists:
  if deadline exists and completedAt > deadline -> LATE
  else -> COMPLETED
else if startedAt exists:
  if deadline exists and now >= deadline -> MISSING
  else -> IN_PROGRESS
else:
  if deadline exists and now >= deadline -> MISSING
  else -> NOT_STARTED
```

`LATE` vẫn được tính completed trong progress percentage. `MISSING` chưa được tính completed. Response có thể trả `isOverdue` và `completionTiming` để UI không parse enum sai.

## 8. To-do Query V1

### Include

- Required, visible Lesson.
- Student có Enrollment `ACTIVE`.
- Chưa `COMPLETED` hoặc `LATE`.
- Deadline hiện hành không null.

### Default Sort

1. Missing/overdue trước.
2. `completionDeadline ASC`.
3. Classroom title ASC.
4. Course order, Lesson order.
5. Lesson ID ASC.

### Filters

- `scope=all|overdue|upcoming`.
- `classroomId` optional và phải thuộc Student.
- `from/to` optional cho Deadline View, giới hạn range 366 ngày.
- `page`, `limit` theo common list contract.

### Response Metadata

```json
{
  "scopeVersion": "P04_LESSON_TODO_V1",
  "asOf": "2026-07-19T10:00:00.000Z",
  "activityTypes": ["LESSON"]
}
```

## 9. Completion Contract

### First Completion

- Nếu chưa có record: upsert `COMPLETED`, set `startedAt` nếu null, set `completedAt=now`.
- Response `201`, `newlyCompleted=true`.

### Retry

- Nếu đã completed: không đổi `completedAt`, không tạo duplicate audit/event.
- Response `200`, `newlyCompleted=false`.

### Start Tracking

- Lesson read có thể upsert `IN_PROGRESS` một lần bằng endpoint start riêng hoặc server behavior được quyết định trong API contract.
- P04 chọn explicit `POST /lessons/:lessonId/start` để GET không có side effect.
- Retry start idempotent và không hạ `COMPLETED` về `IN_PROGRESS`.

### Authorization

- Chỉ Student tự complete Lesson mình đang được phép xem.
- Teacher/Admin không complete thay Student trong P04.
- Completion sau unpublish/archive bị chặn; history cũ giữ nguyên.

## 10. Course Progress V1

```text
required = visible required Lesson IDs at asOf
completed = required IDs with Student progress COMPLETED
progressPercentage = required.empty ? 0 : completed.count / required.count * 100
processScore = progressPercentage
```

Các count bắt buộc trả:

- `requiredLessons`.
- `completedLessons`.
- `inProgressLessons`.
- `notStartedLessons`.
- `missingLessons`.
- `lateCompletedLessons`.

Response luôn có `metricVersion` và `asOf`.

## 11. Dashboard Consistency

- Deadline update có hiệu lực với query tiếp theo sau commit.
- Completion có hiệu lực với To-do/dashboard query tiếp theo sau commit.
- P04 không chấp nhận eventual lag do materialized view vì chưa dùng summary collection.
- Một request dashboard dùng một `asOf` duy nhất để tránh mỗi row tính ở thời điểm khác.
- Aggregation phải filter enrollment/content trước khi group để tránh data leak.

## 12. Edge Cases

| Case | Expected behavior |
| --- | --- |
| Deadline đúng bằng `now` | Overdue/Missing nếu chưa complete |
| Complete đúng deadline | On time khi `completedAt <= deadline` |
| Deadline extend sau Student missing | Derived state chuyển khỏi Missing nếu new deadline ở tương lai |
| Deadline extend sau late completion | `LATE` có thể thành `COMPLETED` theo deadline hiện hành; history giải thích thay đổi |
| Lesson đổi required true -> false | Không còn trong denominator/To-do sau publish workflow hợp lệ |
| Student removed | Không còn dashboard active ranking/To-do; progress giữ |
| Course unpublished | To-do ẩn; progress giữ |
| Retry complete đồng thời | Một record, một first-completion timestamp |
| Client clock sai | Không ảnh hưởng business state; server clock thắng |

## 13. Performance Baseline Dataset

- 1 Classroom, 5 Course.
- Mỗi Course 10 Module, 50 Lesson.
- 100 active Student/Course.
- 5,000 progress records/Course worst-case.
- To-do Student tối đa 250 Lesson trong enrolled scope chuẩn.

Mục tiêu Course Dashboard p95 dưới 2 giây và Student To-do p95 dưới 1 giây trên môi trường test chuẩn sau warm connection. Nếu không đạt, tối ưu index/pipeline trước; materialization cần ADR mới.

## 14. Required Tests

- Set/clear/extend/blocked shorten lifecycle matrix.
- Reason boundary và UTC parsing.
- Revision race: chỉ một writer commit.
- Transaction rollback khi history/audit fail.
- Boundary `before/equal/after deadline` bằng fake clock.
- Completion retry và concurrent duplicate.
- To-do removal sau completion và reappearance rules sau visibility change.
- Dashboard denominator khi Lesson publish/unpublish/required thay đổi.
- Cross-Student/Course access negative tests.
