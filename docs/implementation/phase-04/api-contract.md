# Phase 04 API Contract

## 1. Contract Baseline

- Base path: `/api/v1`.
- Authentication: current JWT access session/cookie contract từ Phase 02.
- Content type: `application/json; charset=utf-8`.
- Timestamp: ISO-8601 UTC.
- Identifier: Mongo ObjectId serialized string.
- Success envelope: `{ "success": true, "data": ..., "meta": ... }`.
- Error envelope: common `AppError` contract với `requestId`.
- OpenAPI: mọi endpoint trong file này phải xuất hiện ở `/api-docs` và OpenAPI JSON.

## 2. Common List Contract

| Query | Default | Limit | Rule |
| --- | --- | --- | --- |
| `page` | `1` | min 1 | Integer |
| `limit` | `20` | max 100 | Integer |
| `search` | none | max 100 chars | Trim/normalize |
| `status` | route-specific | allowlist | Không nhận arbitrary Mongo value |
| `sort` | route-specific | allowlist | Stable `_id` tie-breaker |

```json
{
  "success": true,
  "data": { "items": [] },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## 3. Course Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `GET` | `/courses?classroomId=...` | owned/enrolled view | `200` | Role-scoped Course list |
| `POST` | `/courses` | `course.create` | `201` | Tạo Course draft |
| `GET` | `/courses/{courseId}` | owned/enrolled view | `200` | Role-specific detail |
| `PATCH` | `/courses/{courseId}` | `course.update_owned` | `200` | Sửa metadata draft/unpublished |
| `PATCH` | `/courses/{courseId}/status` | `course.publish_owned` | `200` | Schedule/publish/unpublish |
| `DELETE` | `/courses/{courseId}` | `course.archive_owned` | `204` | Soft archive |
| `GET` | `/courses/{courseId}/structure` | owned/enrolled view | `200` | Canonical Module/Lesson tree |

### Create Course

```json
{
  "classroomId": "507f1f77bcf86cd799439011",
  "title": "Backend Fundamentals",
  "description": "Các bài học ngắn về REST API"
}
```

Server set `status=DRAFT`, owner, order, revisions. Body không nhận `status`, `ownerTeacherId`, `publishedAt`.

### Update Course

```json
{
  "title": "Backend Fundamentals",
  "description": "Nội dung cập nhật",
  "expectedUpdatedAt": "2026-07-19T03:00:00.000Z"
}
```

### Change Course Status

```json
{
  "targetStatus": "PUBLISHED",
  "scheduledPublishAt": null,
  "expectedUpdatedAt": "2026-07-19T03:00:00.000Z"
}
```

`targetStatus` allowlist `DRAFT/SCHEDULED/PUBLISHED/UNPUBLISHED`. Archive dùng `DELETE` để giữ catalog BA; endpoint luôn soft archive.

### Common Archive Request

Course, Module, Lesson, Flashcard và Announcement archive nhận body:

```json
{
  "reason": "Nội dung không còn được sử dụng",
  "expectedUpdatedAt": "2026-07-19T03:10:00.000Z"
}
```

- `expectedUpdatedAt` bắt buộc để ngăn archive trên bản dữ liệu stale.
- `reason` trim 5-500 ký tự; bắt buộc cho Course/Lesson/Announcement, optional cho Flashcard/empty Module chưa publish.
- Thành công trả `204` không body; retry với token cũ trả `409`, không giả thành công lần hai.

## 4. Module Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `GET` | `/courses/{courseId}/modules` | owned/enrolled view | `200` | List role-projected Module |
| `POST` | `/courses/{courseId}/modules` | `course.update_owned` | `201` | Tạo Module draft |
| `PATCH` | `/modules/{moduleId}` | `course.update_owned` | `200` | Sửa Module metadata |
| `PATCH` | `/modules/{moduleId}/status` | `course.publish_owned` | `200` | Publish/unpublish Module |
| `DELETE` | `/modules/{moduleId}` | `course.archive_owned` | `204` | Soft archive Module |
| `PATCH` | `/courses/{courseId}/modules/reorder` | `content.reorder_owned` | `200` | Reorder exact Module set |

### Create/Update Module

```json
{
  "title": "Module 1 - REST Basics",
  "description": "Khái niệm nền tảng"
}
```

Update thêm `expectedUpdatedAt`.

### Reorder Modules

```json
{
  "orderedModuleIds": [
    "507f1f77bcf86cd799439021",
    "507f1f77bcf86cd799439022"
  ],
  "expectedStructureRevision": 4
}
```

Response trả canonical items và `structureRevision=5`. Missing/duplicate/foreign/archived ID trả `422 ORDER_SET_MISMATCH`; stale revision trả `409`.

## 5. Lesson Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `GET` | `/courses/{courseId}/lessons` | owned/enrolled view | `200` | List/filter Lesson projection |
| `POST` | `/lessons` | `lesson.manage_owned` | `201` | Tạo Lesson draft |
| `GET` | `/lessons/{lessonId}` | owned/enrolled view | `200` | Teacher nhận Markdown source; Student nhận sanitized `contentHtml` |
| `PATCH` | `/lessons/{lessonId}` | `lesson.manage_owned` | `200` | Sửa editable Lesson |
| `PATCH` | `/lessons/{lessonId}/status` | `course.publish_owned` | `200` | Schedule/publish/unpublish |
| `DELETE` | `/lessons/{lessonId}` | `course.archive_owned` | `204` | Soft archive |
| `POST` | `/lessons/{lessonId}/preview` | `lesson.manage_owned` | `200` | Sanitized Student-like preview |
| `PATCH` | `/courses/{courseId}/lessons/reorder` | `content.reorder_owned` | `200` | Reorder/move Lesson structure |

### Create Lesson

```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "moduleId": "507f1f77bcf86cd799439021",
  "title": "REST Resource Naming",
  "content": "## Mục tiêu\n\nĐặt tên resource bằng danh từ.",
  "contentFormat": "MARKDOWN",
  "estimatedMinutes": 8,
  "isRequired": true,
  "completionDeadline": "2026-08-10T16:59:59.000Z"
}
```

### Update Lesson

Cho phép: title, content, estimatedMinutes, isRequired. Chỉ `DRAFT/UNPUBLISHED`; thêm `expectedUpdatedAt`. `moduleId/order/deadline/status` có endpoint riêng.

### Change Lesson Status

```json
{
  "targetStatus": "SCHEDULED",
  "scheduledPublishAt": "2026-07-25T01:00:00.000Z",
  "expectedUpdatedAt": "2026-07-19T03:10:00.000Z"
}
```

### Reorder/Move Lessons

```json
{
  "containers": [
    {
      "moduleId": "507f1f77bcf86cd799439021",
      "orderedLessonIds": ["...031", "...032"]
    },
    {
      "moduleId": null,
      "orderedLessonIds": ["...033"]
    }
  ],
  "expectedStructureRevision": 7
}
```

Request phải chứa exact active Lesson set của toàn Course để move/reorder atomic. Giới hạn 500 Lesson.

## 6. Deadline Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `PATCH` | `/teacher/lessons/{lessonId}/deadline` | `lesson.deadline_manage_owned` | `200` | Set/reset/clear deadline |
| `GET` | `/teacher/lessons/{lessonId}/deadline-history` | `lesson.deadline_manage_owned` | `200` | Paginated immutable history |

Request theo `deadline-and-derived-state.md`. Response:

```json
{
  "success": true,
  "data": {
    "lessonId": "...",
    "completionDeadline": "2026-08-10T16:59:59.000Z",
    "deadlineRevision": 3,
    "deadlineLastUpdatedAt": "2026-07-19T04:00:00.000Z"
  }
}
```

## 7. Flashcard Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `GET` | `/lessons/{lessonId}/flashcards` | owned/enrolled view | `200` | Role-projected list |
| `POST` | `/lessons/{lessonId}/flashcards` | `lesson.manage_owned` | `201` | Tạo card |
| `PATCH` | `/flashcards/{flashcardId}` | `lesson.manage_owned` | `200` | Sửa card |
| `DELETE` | `/flashcards/{flashcardId}` | `lesson.manage_owned` | `204` | Soft archive card |
| `PATCH` | `/lessons/{lessonId}/flashcards/reorder` | `content.reorder_owned` | `200` | Reorder exact active cards |

Create/update body:

```json
{
  "frontText": "HTTP 201 dùng khi nào?",
  "backText": "Khi request tạo resource thành công.",
  "expectedUpdatedAt": "2026-07-19T04:00:00.000Z"
}
```

`expectedUpdatedAt` chỉ ở update. Reorder dùng `expectedFlashcardRevision`.

## 8. Announcement Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `GET` | `/classrooms/{classroomId}/announcements` | owner/enrolled view | `200` | Teacher all-state hoặc Student published Stream |
| `POST` | `/classrooms/{classroomId}/announcements` | `announcement.manage_owned` | `201` | Tạo draft |
| `PATCH` | `/announcements/{announcementId}` | `announcement.manage_owned` | `200` | Sửa draft/unpublished |
| `PATCH` | `/announcements/{announcementId}/status` | `announcement.manage_owned` | `200` | Schedule/publish/unpublish |
| `DELETE` | `/announcements/{announcementId}` | `announcement.manage_owned` | `204` | Soft archive |

Body create: `{ "content": "Lớp học bắt đầu lúc 08:00." }`. Status mutation dùng common target/schedule/CAS contract.

## 9. Student Learning Endpoints

| Method | Path | Permission | Success | Chức năng |
| --- | --- | --- | --- | --- |
| `GET` | `/classrooms/{classroomId}/classwork` | `learning.view_enrolled` | `200` | Published Course/Module/Lesson tree |
| `GET` | `/lessons/{lessonId}` | `learning.view_enrolled` | `200` | Lesson Player DTO + navigation |
| `POST` | `/lessons/{lessonId}/start` | `learning.complete_own` | `200/201` | Idempotent first start |
| `POST` | `/lessons/{lessonId}/complete` | `learning.complete_own` | `200/201` | Idempotent completion |
| `GET` | `/students/me/todo` | `learning.view_enrolled` | `200` | Lesson-only To-do v1 |
| `GET` | `/students/me/deadlines` | `learning.view_enrolled` | `200` | Deadline range view |
| `GET` | `/students/me/progress` | `learning.view_enrolled` | `200` | Own Course progress v1 |

### Lesson Player DTO

```json
{
  "lesson": {
    "id": "...",
    "courseId": "...",
    "moduleId": "...",
    "title": "REST Resource Naming",
    "contentHtml": "<h2>Mục tiêu</h2><p>Đặt tên resource bằng danh từ.</p>",
    "contentFormat": "MARKDOWN",
    "estimatedMinutes": 8,
    "isRequired": true,
    "completionDeadline": "2026-08-10T16:59:59.000Z",
    "progress": {
      "status": "IN_PROGRESS",
      "startedAt": "...",
      "completedAt": null,
      "derivedStatus": "IN_PROGRESS"
    },
    "flashcards": []
  },
  "navigation": {
    "back": { "label": "Backend Fundamentals", "url": "/student/courses/..." },
    "previous": null,
    "next": { "id": "...", "title": "HTTP Status Codes", "url": "/student/lessons/..." },
    "breadcrumb": [
      { "label": "Backend 01", "url": "/student/classrooms/.../classwork" },
      { "label": "Backend Fundamentals", "url": "/student/courses/..." },
      { "label": "REST Basics", "url": "/student/courses/...#module-..." },
      { "label": "REST Resource Naming", "url": "/student/lessons/..." }
    ]
  },
  "asOf": "2026-07-19T04:10:00.000Z"
}
```

Teacher authoring DTO dùng trường `content` để trả Markdown source. Student/preview DTO không trả source này mà chỉ trả `contentHtml` đã render qua Markdown parser, tắt raw HTML và sanitize theo allowlist. Frontend không render lại source bằng `dangerouslySetInnerHTML`; chỉ dùng HTML đã sanitize từ contract này trong renderer được kiểm soát.

### Start/Complete Response

```json
{
  "success": true,
  "data": {
    "progress": {
      "status": "COMPLETED",
      "startedAt": "2026-07-19T04:10:00.000Z",
      "completedAt": "2026-07-19T04:20:00.000Z"
    },
    "newlyCompleted": true
  }
}
```

## 10. Teacher Course Dashboard Endpoints

| Method | Path | Permission | Chức năng |
| --- | --- | --- | --- |
| `GET` | `/teacher/courses/{courseId}/dashboard` | `course.progress_view_owned` | Summary + first activity/student slices |
| `GET` | `/teacher/courses/{courseId}/activities` | same | Paginated/filter activity list |
| `GET` | `/teacher/courses/{courseId}/students` | same | Paginated Student summary |
| `GET` | `/teacher/courses/{courseId}/progress` | same | Ranking v1 |

Common query: `page`, `limit`, `search`, `sort`, `progressStatus`, `deadlineStatus`. Default ranking contract nằm trong BA alignment.

Dashboard response bắt buộc:

```json
{
  "metricVersion": "P04_LESSON_COMPLETION_V1",
  "asOf": "2026-07-19T04:30:00.000Z",
  "summary": {
    "totalLessons": 10,
    "publishedLessons": 8,
    "requiredLessons": 7,
    "activeStudents": 25,
    "averageProgressPercentage": 62.4
  }
}
```

Không có grade/Quiz/Assignment field giả trong P04 response.

## 11. Admin Governance Endpoints

| Method | Path | Permission | Chức năng |
| --- | --- | --- | --- |
| `GET` | `/admin/courses` | `content.governance_view` | Course metadata list |
| `GET` | `/admin/courses/{courseId}` | `content.governance_view` | Course governance summary |

Existing `/admin/classrooms` và detail được thêm `contentCount`. Admin DTO không trả Lesson body/Flashcard content/Student progress.

## 12. Learning Resource Endpoints - Conditional

| Method | Path | Success | Chức năng |
| --- | --- | --- | --- |
| `GET` | `/resources/{resourceId}` | `200` | Authorized metadata/access action |
| `POST` | `/resources` | `201` | Create external URL metadata |
| `PATCH` | `/resources/{resourceId}` | `200` | Update editable metadata |
| `DELETE` | `/resources/{resourceId}` | `204` | Soft archive |
| `POST` | `/resources/uploads` | `201` | Conditional GCS upload intent |
| `POST` | `/resources/{resourceId}/access` | `200` | Conditional short-lived access URL |

Không document/enable upload routes nếu GCS security gate chưa đạt.

## 13. Error Catalog

| HTTP | Code | Trường hợp |
| --- | --- | --- |
| `400` | `INVALID_JSON` | JSON malformed |
| `401` | `AUTHENTICATION_REQUIRED` | Missing/expired auth |
| `403` | `ACCESS_DENIED` | Thiếu coarse permission |
| `403` | `ENROLLMENT_REQUIRED` | Không active enrollment trong known context |
| `404` | `RESOURCE_NOT_FOUND` | Không tồn tại hoặc ngoài object scope |
| `409` | `CONCURRENT_MODIFICATION` | `expectedUpdatedAt` stale |
| `409` | `STRUCTURE_REVISION_CONFLICT` | Reorder revision stale |
| `409` | `DEADLINE_REVISION_CONFLICT` | Deadline revision stale |
| `409` | `CONTENT_STATE_CONFLICT` | Transition/state không hợp lệ |
| `409` | `CONTENT_PUBLISH_PREREQUISITE_FAILED` | Thiếu content/deadline/ancestor |
| `409` | `DEADLINE_SHORTENING_NOT_ALLOWED` | Rút ngắn published deadline |
| `409` | `CONTENT_ARCHIVED` | Mutation terminal content |
| `413` | `PAYLOAD_TOO_LARGE` | Body/resource vượt giới hạn |
| `422` | `VALIDATION_ERROR` | Field invalid |
| `422` | `ORDER_SET_MISMATCH` | Reorder set sai |
| `422` | `UNSAFE_RESOURCE_URL` | URL scheme/shape không an toàn |
| `429` | `RATE_LIMITED` | Abuse control |
| `503` | `DEPENDENCY_UNAVAILABLE` | Optional storage dependency unavailable |

Error details chỉ trả field/path/revision an toàn; không trả Mongo/internal stack hoặc existence ngoài scope.

## 14. Cache And Header Contract

- Authoring, preview, deadline, dashboard, To-do, progress: `Cache-Control: private, no-store`.
- Student published content vẫn dùng `private, no-store` trong P04 vì visibility/progress phụ thuộc session.
- Mọi response có `x-request-id`.
- Mutation JSON có `Content-Type` đúng; `204` không có body.
- Optional signed URL response luôn `no-store`.

## 15. Idempotency And Retry

| Endpoint | Retry semantics |
| --- | --- |
| Start/complete Lesson | Natural-key idempotent; first `201`, retry `200` |
| Status mutation | CAS; retry với stale timestamp trả `409` thay vì side effect lặp |
| Deadline mutation | Revision CAS; exact retry sau success trả conflict/current state |
| Reorder | Revision CAS; exact retry sau success trả conflict/current canonical structure |
| Create Course/Lesson | Không idempotent mặc định; UI disable double submit |

Nếu thêm `Idempotency-Key` sau này cần common store/TTL ADR, không implement ad hoc cho một route.

## 16. OpenAPI Requirements

- Tags: `Courses`, `Modules`, `Lessons`, `Flashcards`, `Deadlines`, `Announcements`, `Learning Progress`, `Teacher Course Dashboard`, `Admin Content Governance`, conditional `Learning Resources`.
- Mỗi operation có unique `operationId`.
- Schema dùng enums/ranges/maxLength/format đầy đủ.
- Examples ít nhất: success, validation, forbidden/not found, conflict.
- Security requirement áp dụng từng operation; public route không tồn tại trong P04.
- Student/Teacher projection là schema riêng, không `oneOf` mơ hồ thiếu discriminator.
- OpenAPI path parity test fail nếu route thiếu docs hoặc docs không có route.

## 17. API Acceptance Gate

- Route manifest và OpenAPI parity pass.
- Authorization matrix pass cho Teacher owner/foreign Teacher/Student/Admin.
- Request boundary và common error envelope pass.
- Reorder/deadline/completion concurrency pass.
- Student projection không có draft/audit/internal fields.
- Swagger UI thử được full happy path với demo identities.
- No undocumented Must endpoint hoặc placeholder response.
