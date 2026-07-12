# Data Indexing And Query Strategy

## Mục Đích

Tài liệu này mô tả các query quan trọng và index cần có để hệ thống web chạy ổn định khi dữ liệu tăng. Phần này đặc biệt quan trọng cho các màn hình danh sách lớn như `Student List`, `Teacher List`, `Admin List`, `Teacher Progress Ranking`, `Student To-do`, `Submission Status` và `Audit Log`.

## Query Strategy Principles

| Nguyên tắc | Mô tả |
| --- | --- |
| Server-side pagination | Không tải toàn bộ dữ liệu rồi lọc ở ReactJS |
| Index theo filter/sort chính | Field thường filter/sort phải có index phù hợp |
| Projection rõ ràng | API list chỉ trả field cần hiển thị |
| Avoid heavy joins in hot path | Với MongoDB, query dashboard nặng nên dùng read model nếu cần |
| Consistent query params | Dùng `page`, `limit`, `sortBy`, `sortOrder`, `keyword`, `status` |

## Standard List Query Parameters

| Parameter | Type | Mô tả |
| --- | --- | --- |
| page | Number | Trang hiện tại, bắt đầu từ 1 |
| limit | Number | Số item mỗi trang |
| keyword | String | Tìm kiếm theo tên/email/title |
| status | String | Lọc trạng thái |
| sortBy | String | Field sort |
| sortOrder | Enum | `asc` hoặc `desc` |

## Admin User Lists

### Student List

| Query | Index đề xuất |
| --- | --- |
| `role=STUDENT&status=ACTIVE` | `{ role: 1, status: 1 }` |
| Search name/email/studentCode | Text index hoặc normalized keyword fields |
| Filter classroomId | Query qua `enrollments` rồi map `studentId` |

Output nên chỉ gồm:

```text
id, fullName, email, studentCode, status, classroomCount, lastActiveAt
```

### Teacher List

| Query | Index đề xuất |
| --- | --- |
| `role=TEACHER&status=ACTIVE` | `{ role: 1, status: 1 }` |
| Filter invitationStatus | `teacher_invitations.email/status` hoặc denormalized field |
| Filter hasActiveClassroom | Aggregate classrooms by ownerTeacherId/status |

Output nên chỉ gồm:

```text
id, fullName, email, status, invitationStatus, classroomCount, courseCount, lastActiveAt
```

### Admin List

| Query | Index đề xuất |
| --- | --- |
| `role in ADMIN/SUPER_ADMIN` | `{ role: 1, status: 1 }` |
| Filter permissionGroup | Nếu có field permissionGroup thì index `{ permissionGroup: 1 }` |

## Student To-do Query

### Option A - Aggregation

Nguồn dữ liệu:

- enrollments
- lessons/quizzes/assignments/resources
- learning_progress
- submissions/quiz_attempts

Ưu điểm:

- Không duplicate data.
- Luôn phản ánh dữ liệu mới.

Nhược điểm:

- Query phức tạp nếu dữ liệu lớn.

### Option B - Materialized `student_todo_items`

Nguồn cập nhật:

- Activity publish/unpublish
- Deadline changed/reset
- Student progress changed
- Submission/Quiz attempt changed

Ưu điểm:

- Dashboard nhanh.
- Filter/sort dễ.

Nhược điểm:

- Cần sync/rebuild khi data thay đổi.

### Index

| Collection | Index |
| --- | --- |
| student_todo_items | `{ studentId: 1, status: 1, dueDate: 1 }` |
| student_todo_items | `{ studentId: 1, classroomId: 1, status: 1 }` |

## Teacher Course Progress Ranking

Course Progress Ranking cần sort mặc định:

```text
processScore DESC
```

Index:

| Collection | Index | Mục đích |
| --- | --- | --- |
| course_progress_summaries | `{ courseId: 1, processScore: -1 }` | Ranking trong Course |
| course_progress_summaries | `{ courseId: 1, missingItems: -1 }` | Tìm Student cần hỗ trợ |
| course_progress_summaries | `{ studentId: 1, courseId: 1 }` | Student detail/progress |

## Submission Status Table

| Query | Index |
| --- | --- |
| Submissions by assignment | `{ assignmentId: 1, status: 1 }` |
| Submission by assignment/student | `{ assignmentId: 1, studentId: 1 }` |
| Late submissions | `{ assignmentId: 1, isLate: 1 }` |

## Audit Log Query

Audit Log thường filter theo:

- actor
- action
- resource type
- resource id
- date range

Index đề xuất:

| Index | Mục đích |
| --- | --- |
| `{ createdAt: -1 }` | Danh sách audit mới nhất |
| `{ actorId: 1, createdAt: -1 }` | Filter theo actor |
| `{ action: 1, createdAt: -1 }` | Filter theo action |
| `{ resourceType: 1, resourceId: 1 }` | Xem lịch sử resource |

## API Response Projection

Không nên trả document đầy đủ ở list API. Ví dụ:

```text
GET /api/v1/admin/users/students

Return:
- id
- fullName
- email
- studentCode
- status
- classroomCount
- lastActiveAt
```

Không return:

```text
- passwordHash
- tokenHash
- reset tokens
- internal security metadata
```

## Performance Acceptance Criteria

| Scenario | Tiêu chí |
| --- | --- |
| Admin Student List | Có pagination, không tải toàn bộ Student |
| Teacher Progress Ranking | Sort `processScore DESC` ở backend |
| Student To-do | Sort deadline/status ở backend hoặc read model |
| Audit Log | Filter date range không timeout với dữ liệu vừa phải |
| Submission Table | Filter submitted/missing/late nhanh |

## Notes For Implementation

- MVP có thể bắt đầu bằng aggregation đơn giản, nhưng phải thiết kế field/index để nâng cấp read model.
- Khi collection tăng lớn, cân nhắc background job để rebuild summary.
- Mọi query theo keyword cần thống nhất cách normalize tiếng Việt nếu search tiếng Việt được yêu cầu.
