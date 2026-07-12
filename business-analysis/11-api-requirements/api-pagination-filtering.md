# API Pagination, Filtering And Sorting

## Mục Đích

Tài liệu này xác định chuẩn pagination, filtering, sorting và search cho các list API. Quy tắc quan trọng: **không tải toàn bộ dữ liệu về ReactJS rồi lọc ở client** đối với danh sách lớn như Student List, Teacher List, Admin List, Progress Ranking, Submission Status và Audit Log.

## Standard Query Parameters

| Parameter | Type | Required | Default | Mô tả |
| --- | --- | --- | --- | --- |
| page | Number | Không | 1 | Số trang hiện tại, bắt đầu từ 1 |
| limit | Number | Không | 20 | Số item mỗi trang |
| keyword | String | Không | null | Search theo text |
| sortBy | String | Không | createdAt | Field dùng để sort |
| sortOrder | Enum | Không | desc | `asc` hoặc `desc` |
| status | String | Không | null | Lọc trạng thái |

## Pagination Validation

| Rule | Error |
| --- | --- |
| `page >= 1` | `INVALID_PAGINATION` |
| `1 <= limit <= 100` | `INVALID_PAGINATION` |
| `sortBy` phải nằm trong whitelist của endpoint | `INVALID_SORT` |
| `sortOrder` chỉ được `asc` hoặc `desc` | `INVALID_SORT` |

## Standard List Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "filters": {
    "keyword": "",
    "status": "ACTIVE"
  }
}
```

## Admin User List Query Examples

```text
GET /api/v1/admin/users/students?keyword=an&status=ACTIVE&page=1&limit=20
GET /api/v1/admin/users/teachers?invitationStatus=PENDING&hasActiveClassroom=true&page=1&limit=20
GET /api/v1/admin/users/admins?role=ADMIN&status=ACTIVE&page=1&limit=20
GET /api/v1/admin/users/search?keyword=nguyen&role=TEACHER&page=1&limit=20
```

## Student API Query Examples

```text
GET /api/v1/students/me/todo?status=NOT_STARTED&activityType=QUIZ&page=1&limit=20
GET /api/v1/students/me/todo?classroomId={classroomId}&dueBefore=2026-08-01
GET /api/v1/students/me/progress?classroomId={classroomId}&courseId={courseId}
GET /api/v1/students/me/grades?courseId={courseId}&page=1&limit=20
```

## Teacher API Query Examples

```text
GET /api/v1/teacher/courses/{courseId}/progress?sortBy=processScore&sortOrder=desc&page=1&limit=20
GET /api/v1/teacher/classrooms/{classroomId}/students?keyword=mai&status=ACTIVE&page=1&limit=20
GET /api/v1/teacher/assignments/{assignmentId}/submissions?status=LATE&page=1&limit=20
GET /api/v1/teacher/quizzes/{quizId}/results?page=1&limit=20
```

## Admin Reports And Audit Query Examples

```text
GET /api/v1/admin/reports/usage?from=2026-07-01&to=2026-07-31
GET /api/v1/admin/reports/progress?classroomId={classroomId}&teacherId={teacherId}
GET /api/v1/admin/audit-logs?action=ACCOUNT_BLOCKED&from=2026-07-01&to=2026-07-31&page=1&limit=50
GET /api/v1/admin/audit-logs?resourceType=USER&resourceId={userId}
```

## Endpoint-specific Sort Whitelist

| Endpoint | Allowed sortBy |
| --- | --- |
| `/admin/users/students` | `fullName`, `email`, `status`, `lastActiveAt`, `createdAt` |
| `/admin/users/teachers` | `fullName`, `email`, `status`, `lastActiveAt`, `classroomCount`, `createdAt` |
| `/admin/users/admins` | `fullName`, `email`, `role`, `status`, `lastActiveAt` |
| `/students/me/todo` | `dueDate`, `status`, `activityType`, `createdAt` |
| `/teacher/courses/{courseId}/progress` | `processScore`, `progressPercentage`, `missingItems`, `lateItems`, `lastActiveAt` |
| `/teacher/assignments/{assignmentId}/submissions` | `submittedAt`, `status`, `isLate`, `score` |
| `/admin/audit-logs` | `createdAt`, `action`, `resourceType`, `severity` |

## Search Behavior

| API | keyword search fields |
| --- | --- |
| Student List | fullName, email, studentCode |
| Teacher List | fullName, email, department |
| Admin List | fullName, email |
| Classroom List | name, subject, owner teacher name |
| Course List | title, description |
| Roster | Student fullName, email, studentCode |
| Audit Log | action, resourceType, actor email nếu support |

## Performance Requirements

| Requirement | Mô tả |
| --- | --- |
| Server-side pagination | List API phải xử lý page/limit ở backend |
| Projection | List response chỉ trả field cần hiển thị |
| Index-backed filters | Field filter chính phải có index theo mục 10 |
| Default limit | Không trả danh sách không giới hạn |
| Max limit | API phải giới hạn limit tối đa |
| Stable sorting | Sort phải ổn định, có fallback `_id` hoặc `createdAt` nếu cần |

## Frontend Notes

- Khi user đổi filter, frontend nên reset về `page = 1`.
- Khi API trả `totalPages = 0`, UI hiển thị empty state.
- Khi API lỗi validation query, UI hiển thị message và reset filter nếu cần.
- Table URL nên lưu query params để user refresh trang không mất filter.
