# API Overview

## Mục Đích

Tài liệu này xác định tiêu chuẩn thiết kế RESTful API cho backend service của **Microlearning Classroom LMS Platform**. API phải đủ rõ để ReactJS frontend gọi được, QA test được, Swagger/OpenAPI document được và DevOps kiểm tra vận hành được.

## API Style

| Thành phần | Quy chuẩn |
| --- | --- |
| Architecture style | RESTful API |
| Base path | `/api/v1` |
| Request body | JSON |
| Response body | JSON |
| Authentication | JWT access token + optional refresh token |
| Authorization | RBAC + object-level access control |
| Documentation | Swagger/OpenAPI |
| Transport | HTTPS ở Cloud/Staging/Production |

## RESTful Naming Convention

| Rule | Ví dụ đúng | Tránh |
| --- | --- | --- |
| Dùng danh từ số nhiều cho resource | `/classrooms`, `/courses` | `/getClassrooms` |
| Dùng nested route khi resource phụ thuộc cha rõ | `/classrooms/{classroomId}/students` | `/studentsByClassroom` |
| Dùng action route cho command không thuần CRUD | `/classrooms/join-by-code` | `/classrooms/code` mơ hồ |
| Dùng admin/teacher prefix cho role-specific API | `/admin/users/students`, `/teacher/courses/{id}/dashboard` | `/users?role=student` làm default cho admin UI |
| Dùng kebab-case hoặc lowercase path | `/teacher-invitations` | `/teacherInvitations` |

## HTTP Methods

| Method | Mục đích | Ví dụ |
| --- | --- | --- |
| GET | Lấy dữ liệu | `GET /api/v1/students/me/todo` |
| POST | Tạo mới hoặc thực hiện command | `POST /api/v1/classrooms/join-by-code` |
| PUT | Thay thế toàn bộ resource | `PUT /api/v1/courses/{courseId}` |
| PATCH | Cập nhật một phần hoặc status | `PATCH /api/v1/admin/users/{userId}/status` |
| DELETE | Xóa mềm/archive/disable | `DELETE /api/v1/classrooms/{classroomId}` |

## HTTP Status Codes

| Status | Khi nào dùng |
| --- | --- |
| 200 OK | GET/PATCH/PUT thành công |
| 201 Created | Tạo resource thành công |
| 204 No Content | Xóa/disable thành công không cần body |
| 400 Bad Request | Request sai format chung |
| 401 Unauthorized | Chưa authenticated hoặc token invalid |
| 403 Forbidden | Authenticated nhưng không đủ quyền |
| 404 Not Found | Resource không tồn tại hoặc không được phép biết resource |
| 409 Conflict | Duplicate hoặc conflict business rule |
| 422 Unprocessable Entity | Validation error chi tiết |
| 429 Too Many Requests | Rate limit nếu triển khai |
| 500 Internal Server Error | Lỗi server không mong đợi |
| 503 Service Unavailable | Service/dependency unavailable |

## Success Response Standard

### Single Resource

```json
{
  "success": true,
  "data": {
    "id": "64f000000000000000000001",
    "title": "RESTful API Fundamentals"
  },
  "meta": {
    "requestId": "req_123"
  }
}
```

### List Resource

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
  "meta": {
    "requestId": "req_123"
  }
}
```

## Request Metadata

API nên hỗ trợ hoặc tạo:

| Header / Metadata | Mục đích |
| --- | --- |
| Authorization | Bearer token |
| Content-Type | `application/json` hoặc multipart upload |
| X-Request-Id | Trace request, có thể client gửi hoặc server tạo |
| User-Agent | Audit/security monitoring |
| IP address | Audit log cho action nhạy cảm |

## API Security Baseline

- Protected API phải có authentication middleware.
- Role-specific API phải có authorization middleware.
- Resource-specific API phải kiểm object-level access.
- Không expose `passwordHash`, `tokenHash`, raw invitation token, refresh token secret.
- Admin action quan trọng phải ghi AuditLog.
- Upload API phải validate file type/size.
- Error response production không trả stack trace.

## API UX Requirements Cho Frontend

API phải hỗ trợ frontend hiển thị:

| UI State | API requirement |
| --- | --- |
| Loading | Response không quá nặng, list có pagination |
| Empty state | List API trả data rỗng + pagination đúng |
| Error state | Error code/message đủ rõ |
| Disabled action | API trả permission/status để UI disable nếu cần |
| Back/return context | Detail API đủ dữ liệu để render breadcrumb/title |
| Table filters | API hỗ trợ query filter/sort |
| Toast success | Command API trả data trạng thái mới |

## API Audit Rules

Các API sau phải ghi AuditLog:

- Create/copy/revoke/accept Teacher Invitation.
- Block/unblock/deactivate account.
- Change role/permission.
- Update Enrollment Policy.
- Transfer Classroom ownership.
- Archive Classroom/Course nếu ảnh hưởng dữ liệu học tập.
- Publish/unpublish content nếu cần trace.
- Return grade/feedback nếu cần trace học tập.

## API Versioning Rule

- MVP dùng `/api/v1`.
- Không tạo endpoint không version như `/api/classrooms`.
- Breaking change phải tạo version mới hoặc migration plan.
- Deprecated endpoint phải được ghi trong Swagger nếu vẫn còn tồn tại.
