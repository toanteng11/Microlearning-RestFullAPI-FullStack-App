# Phase 04 Content Lifecycle And Visibility

## 1. Mục Đích

Khóa state machine và visibility policy dùng chung cho API Teacher, Student, Admin, dashboard, To-do và Lesson Player. Không route nào được tự viết lại rule visibility riêng.

## 2. Status Definitions

| Status | Ý nghĩa | Student visibility | Teacher mutation |
| --- | --- | --- | --- |
| `DRAFT` | Đang soạn, chưa phát hành | Không | Edit/preview/schedule/publish/archive |
| `SCHEDULED` | Đã khóa nội dung, chờ thời điểm | Khi `scheduledPublishAt <= now` và ancestor hợp lệ | Unschedule/unpublish/archive; body locked |
| `PUBLISHED` | Đang phát hành | Có nếu toàn bộ ancestor/access hợp lệ | Unpublish/archive; body locked |
| `UNPUBLISHED` | Đã gỡ khỏi học viên | Không cho truy cập mới | Edit/preview/republish/archive |
| `ARCHIVED` | Terminal read-only history | Không cho truy cập mới | Không mutation trong Must baseline |

Module không có `SCHEDULED`; Flashcard dùng `ACTIVE/ARCHIVED` và kế thừa Lesson.

## 3. Effective Status

```text
effectiveStatus(content, now):
  if status == SCHEDULED and scheduledPublishAt <= now -> PUBLISHED
  else -> status
```

`effectiveStatus` không ghi database trong read path. API Teacher có thể trả `status=SCHEDULED`, `effectiveStatus=PUBLISHED`; Student chỉ nhận published projection. Một reconciliation job về sau được phép materialize status nhưng không được thay đổi visibility semantics.

## 4. Course State Machine

```text
DRAFT
  -> SCHEDULED
  -> PUBLISHED
  -> ARCHIVED

SCHEDULED
  -> DRAFT       (cancel schedule before due)
  -> PUBLISHED   (explicit or effective by time)
  -> UNPUBLISHED
  -> ARCHIVED

PUBLISHED
  -> UNPUBLISHED
  -> ARCHIVED

UNPUBLISHED
  -> DRAFT       (edit workflow)
  -> SCHEDULED
  -> PUBLISHED
  -> ARCHIVED

ARCHIVED (terminal in P04)
```

### Course Publish Preconditions

- Actor có `course.publish_owned` và còn là Classroom owner.
- User/Classroom không bị inactive/archived.
- Course title/description hợp lệ.
- Có ít nhất một required Lesson có effective `PUBLISHED` hoặc future `SCHEDULED`.
- Mọi Lesson dùng để thỏa prerequisite có deadline hợp lệ.
- `scheduledPublishAt` bắt buộc nếu target `SCHEDULED`.
- `expectedUpdatedAt` khớp.

Course archive không cascade đổi status child. Child history được giữ; ancestor resolver làm chúng không còn visible.

## 5. Module State Machine

```text
DRAFT -> PUBLISHED -> UNPUBLISHED -> PUBLISHED
  |          |             |
  +----------+-------------+-> ARCHIVED
```

- Module publish chỉ khi Course chưa `ARCHIVED` và Teacher có ownership.
- Module có Lesson published vẫn có thể unpublish; Student mất access mới, progress giữ nguyên.
- Module archive không hard delete Lesson.
- Module không có schedule riêng; Lesson schedule vẫn bị ancestor visibility chi phối.

## 6. Lesson State Machine

```text
DRAFT
  -> SCHEDULED
  -> PUBLISHED
  -> ARCHIVED

SCHEDULED
  -> DRAFT / UNPUBLISHED / PUBLISHED / ARCHIVED

PUBLISHED
  -> UNPUBLISHED / ARCHIVED

UNPUBLISHED
  -> DRAFT / SCHEDULED / PUBLISHED / ARCHIVED

ARCHIVED (terminal)
```

### Lesson Publish Preconditions

- Title 2-150 ký tự.
- Markdown content sau trim không rỗng và không vượt giới hạn.
- `estimatedMinutes` trong `1..60`.
- `completionDeadline > now`.
- Module cha, nếu có, thuộc đúng Course và không archived.
- Course/Classroom không archived và ownership hiện tại hợp lệ.
- Flashcard active, nếu có, đều có front/back hợp lệ.
- `expectedUpdatedAt` khớp.

### Published Content Lock

- `PUBLISHED`/`SCHEDULED`: không sửa title, body, estimated time, required flag, Module assignment hoặc Flashcard.
- Deadline có mutation riêng và revision riêng.
- Reorder Lesson được phép nếu Course không archived; không thay content body.
- Teacher muốn sửa body phải chuyển `UNPUBLISHED`, sửa và publish lại.
- Progress đã có không bị xóa khi unpublish/republish.

## 7. Announcement State Machine

Announcement dùng common lifecycle nhưng không có deadline/progress. Publish prerequisite:

- Classroom `ACTIVE` và Teacher còn sở hữu.
- Content text/Markdown hợp lệ.
- Link attachment, nếu bật, qua URL policy.
- Scheduled announcement cần `scheduledPublishAt > now`.

Student Stream chỉ trả effective published Announcement. Unpublish/archive không xóa AuditLog.

## 8. Visibility Matrix

| Resource | Teacher owner | Enrolled Student | Admin governance | Guest |
| --- | --- | --- | --- | --- |
| Draft Course/Module/Lesson | Read/edit | Không | Metadata tối thiểu nếu governance route cho phép | Không |
| Published Course structure | Read/edit lifecycle | Read | Read-only summary | Không |
| Published Lesson content | Read/preview | Read | Không trả body mặc định | Không |
| Unpublished/Archived content | Read history | Không access mới | Read-only metadata | Không |
| Flashcard | Theo Lesson | Theo Lesson | Không body mặc định | Không |
| Announcement published | Read | Read | Metadata governance | Không |
| Deadline history | Read | Chỉ deadline hiện tại | Read audit metadata khi có permission | Không |
| Student progress | Course owner | Chỉ chính mình | Không trong P04 | Không |

## 9. Student Visibility Algorithm

```text
1. Authenticate session and load ACTIVE Student.
2. Load requested content scope without revealing foreign metadata.
3. Resolve Classroom through Course.
4. Require ACTIVE Enrollment for actor + Classroom.
5. Require Classroom ACTIVE.
6. Require Course effective PUBLISHED.
7. If Module exists, require Module PUBLISHED.
8. Require Lesson effective PUBLISHED.
9. Return student projection only.
```

Failure ở bước 2 hoặc object scope trả `404 RESOURCE_NOT_FOUND`. Failure do enrollment đã biết trong current Classroom route có thể trả `403 ENROLLMENT_REQUIRED`; contract phải nhất quán và có negative test.

## 10. Teacher Ownership Algorithm

```text
1. Authenticate ACTIVE Teacher/Super Admin capability.
2. Resolve Course -> Classroom.
3. Read current Classroom owner from P03 port.
4. Require actor ID equals owner ID for Teacher mutation.
5. Require Classroom state permits requested operation.
6. Validate optimistic concurrency.
7. Apply domain transition and audit.
```

Không tin `ownerTeacherId`, `classroomId`, `courseId` do client gửi nếu chúng có thể suy ra từ resource hiện tại.

## 11. Ordering And Navigation

- Course structure order: Module `displayOrder`, rồi Lesson `displayOrder`, cuối cùng `_id`.
- Unmoduled Lesson nằm trong synthetic section `UNASSIGNED`, vị trí do contract xác định sau các Module.
- Student navigation loại mọi item không visible trước khi tính Previous/Next.
- Navigation response gồm `previous`, `next`, `back` với ID/title/route; null ở biên.
- Reorder request phải chứa đúng ID của tất cả active child trong parent.
- Duplicate/missing/foreign/archived ID làm toàn transaction fail.

## 12. Archive And Historical Access

- Archive không xóa content/progress/deadline history.
- Student không mở mới archived content từ URL cũ.
- Existing completion record vẫn được Teacher nhìn trong historical reporting phù hợp.
- Course progress denominator tại `asOf` chỉ dùng visible required set hiện tại; response trả version/asOf để giải thích biến động.
- Data retention/purge ngoài archive thuộc policy về sau, không có API P04.

## 13. Invariants

| ID | Invariant |
| --- | --- |
| P04-INV-001 | Course luôn thuộc đúng một Classroom |
| P04-INV-002 | Module luôn thuộc đúng một Course |
| P04-INV-003 | Lesson luôn thuộc đúng một Course; Module optional phải cùng Course |
| P04-INV-004 | Flashcard luôn thuộc đúng một Lesson |
| P04-INV-005 | Student không nhận draft/internal projection |
| P04-INV-006 | Published/Scheduled Lesson luôn có deadline |
| P04-INV-007 | Archived content không nhận mutation P04 |
| P04-INV-008 | Unpublish/archive không xóa progress |
| P04-INV-009 | Ordering trong parent deterministic |
| P04-INV-010 | Visibility resolver là source duy nhất cho all Student reads |

## 14. Test Obligations

- Mỗi transition hợp lệ có unit test.
- Mỗi transition không hợp lệ có error code test.
- Scheduled boundary test dùng fake clock ở trước/bằng/sau thời điểm.
- Ancestor matrix test gồm inactive Classroom, draft Course, unpublished Module, scheduled Lesson.
- Foreign owner/enrollment và guessed ID không làm lộ title/status.
- Published content lock và preservation of progress có integration test.
- Navigation bỏ qua hidden/archived item và ổn định sau reorder.
