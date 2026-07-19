# API Request And Response Schemas

## Mục Đích

Tài liệu này mô tả các schema request/response quan trọng để Frontend, Backend và QA có cùng cách hiểu về dữ liệu API. Đây là bản BA-level schema, không thay thế hoàn toàn OpenAPI YAML/JSON nhưng là nền tảng để viết Swagger.

## Common Schemas

### UserSummary

```json
{
  "id": "64f000000000000000000001",
  "fullName": "Nguyen Van A",
  "email": "teacher@example.com",
  "role": "TEACHER",
  "status": "ACTIVE",
  "lastActiveAt": "2026-07-10T10:00:00.000Z"
}
```

### ClassroomSummary

```json
{
  "id": "64f000000000000000000010",
  "name": "Node.js Microlearning",
  "description": "Lớp học Node.js nội bộ",
  "status": "ACTIVE",
  "ownerTeacher": {
    "id": "64f000000000000000000001",
    "fullName": "Nguyen Van A"
  },
  "memberCount": 32
}
```

Business notes:

- `memberCount` là số Enrollment có `status = ACTIVE` tại thời điểm query; backend tính từ Enrollment source of truth, client không được gửi field này trong mutation.
- Public Invite preview không được dùng `ClassroomSummary` vì không được lộ `memberCount`, description đầy đủ hoặc dữ liệu membership.

### ArchiveClassroomRequest

```json
{
  "reason": "Kết thúc học kỳ 1",
  "expectedUpdatedAt": "2026-07-19T08:00:00.000Z"
}
```

- Request dùng với `DELETE /api/v1/classrooms/{classroomId}`; `reason` và `expectedUpdatedAt` là bắt buộc.
- Chỉ owner Teacher được gọi trong Must baseline. Đây là archive mềm; không xóa Enrollment, credential history hoặc AuditLog.

### PreviewClassroomInviteRequest

```json
{
  "token": "<opaque-classroom-invite-token>"
}
```

- Request dùng với `POST /api/v1/classrooms/invite-links/preview`.
- Token không nằm trong API path/query; response dùng `Cache-Control: no-store` và chỉ trả projection tối thiểu.

### AdminClassroomGovernanceSummary

```json
{
  "id": "64f000000000000000000010",
  "name": "Node.js Microlearning",
  "ownerTeacher": {
    "id": "64f000000000000000000001",
    "fullName": "Nguyen Van A"
  },
  "status": "ACTIVE",
  "enrollmentStatus": "OPEN",
  "memberCount": 32,
  "createdAt": "2026-07-01T08:00:00.000Z",
  "updatedAt": "2026-07-19T08:00:00.000Z"
}
```

`memberCount` là required trong Admin governance list/detail của Phase 03. `contentCount` không thuộc contract Phase 03 vì Course/Lesson/Classwork được triển khai từ Phase 04.

### ActivitySummary

```json
{
  "id": "64f000000000000000000020",
  "type": "LESSON",
  "title": "HTTP Methods",
  "status": "PUBLISHED",
  "dueDate": "2026-08-01T23:59:00.000Z",
  "displayOrder": 1
}
```

## Auth Schemas

### Login Request

```json
{
  "email": "student@example.com",
  "password": "Password123!"
}
```

### Login Response

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "user": {
      "id": "64f000000000000000000001",
      "email": "student@example.com",
      "fullName": "Tran Thi B",
      "role": "STUDENT",
      "status": "ACTIVE"
    }
  }
}
```

Refresh token không xuất hiện trong JSON. Backend đặt opaque refresh token trong cookie `HttpOnly`, `Secure` ở Staging/Production và `SameSite=Lax`; frontend chỉ giữ access token trong memory theo security baseline.

## Student Dashboard Schemas

### Student Dashboard Response

```json
{
  "success": true,
  "data": {
    "classrooms": [],
    "todoSummary": {
      "total": 8,
      "late": 1,
      "dueSoon": 2
    },
    "progressSummary": {
      "averageProgress": 72,
      "completedActivities": 18,
      "totalRequiredActivities": 25
    },
    "upcomingDeadline": {
      "activityId": "64f000000000000000000020",
      "activityType": "QUIZ",
      "title": "REST API Quiz",
      "dueDate": "2026-08-01T23:59:00.000Z"
    }
  }
}
```

### TodoItem

```json
{
  "id": "todo_123",
  "classroomId": "64f000000000000000000010",
  "courseId": "64f000000000000000000011",
  "activityId": "64f000000000000000000020",
  "activityType": "LESSON",
  "title": "HTTP Methods",
  "classroomName": "Node.js Microlearning",
  "dueDate": "2026-08-01T23:59:00.000Z",
  "status": "NOT_STARTED",
  "actionUrl": "/student/lessons/64f000000000000000000020"
}
```

## Teacher Course Dashboard Schema

```json
{
  "success": true,
  "data": {
    "course": {
      "id": "64f000000000000000000011",
      "title": "RESTful API Fundamentals",
      "status": "PUBLISHED",
      "classroomId": "64f000000000000000000010"
    },
    "summary": {
      "totalStudents": 32,
      "totalActivities": 20,
      "averageProgress": 76,
      "lateItems": 5
    },
    "activities": [],
    "students": [],
    "progressRanking": []
  }
}
```

### CourseProgressRow

```json
{
  "studentId": "64f000000000000000000101",
  "studentName": "Le Van C",
  "email": "student@example.com",
  "processScore": 92,
  "progressPercentage": 90,
  "completedActivities": 18,
  "totalRequiredActivities": 20,
  "missingItems": 0,
  "lateItems": 1,
  "lastActiveAt": "2026-07-10T09:30:00.000Z"
}
```

### LessonDeadlineUpdateRequest

```json
{
  "completionDeadline": "2026-07-20T16:59:00.000Z",
  "reason": "Gia hạn vì lớp nghỉ đột xuất.",
  "notifyStudents": true
}
```

### LessonDeadlineUpdateResponse

```json
{
  "success": true,
  "data": {
    "lessonId": "64f000000000000000000020",
    "oldDeadline": "2026-07-18T16:59:00.000Z",
    "newDeadline": "2026-07-20T16:59:00.000Z",
    "deadlineLastUpdatedAt": "2026-07-10T10:30:00.000Z",
    "deadlineLastUpdatedBy": "64f000000000000000000001",
    "deadlineChangeReason": "Gia hạn vì lớp nghỉ đột xuất.",
    "studentTodoRefreshRequired": true,
    "calendarRefreshRequired": true
  }
}
```

Business notes:

- `reason` bắt buộc khi Lesson đã publish/assigned và Teacher reset deadline.
- Backend cần tính lại trạng thái late/missing theo deadline mới.
- Response nên trả đủ dữ liệu để Frontend cập nhật Teacher Course Dashboard, Student To-do và Student Calendar.

## Admin User List Schemas

### StudentListItem

```json
{
  "id": "64f000000000000000000101",
  "fullName": "Le Van C",
  "email": "student@example.com",
  "studentCode": "STU001",
  "status": "ACTIVE",
  "classroomCount": 3,
  "lastActiveAt": "2026-07-10T09:30:00.000Z"
}
```

### TeacherListItem

```json
{
  "id": "64f000000000000000000001",
  "fullName": "Nguyen Van A",
  "email": "teacher@example.com",
  "status": "ACTIVE",
  "invitationStatus": "ACCEPTED",
  "classroomCount": 4,
  "courseCount": 12,
  "hasActiveClassroom": true,
  "lastActiveAt": "2026-07-10T09:30:00.000Z"
}
```

### AdminListItem

```json
{
  "id": "64f000000000000000000201",
  "fullName": "Admin User",
  "email": "admin@example.com",
  "role": "ADMIN",
  "permissionGroup": "OPERATIONS_ADMIN",
  "status": "ACTIVE",
  "lastActiveAt": "2026-07-10T09:30:00.000Z"
}
```

## Quiz Schemas

### QuestionWithMedia

```json
{
  "id": "64f000000000000000000301",
  "questionText": "Quan sát hình và chọn HTTP method phù hợp.",
  "questionType": "SINGLE_CHOICE",
  "points": 1,
  "options": [
    { "optionId": "A", "text": "GET" },
    { "optionId": "B", "text": "POST" }
  ],
  "media": [
    {
      "id": "64f000000000000000000401",
      "mediaType": "IMAGE",
      "mediaUrl": "https://storage.example.com/q1.png",
      "caption": "Request tạo resource",
      "altText": "Sơ đồ request tạo resource"
    }
  ]
}
```

### SubmitQuizAttemptRequest

```json
{
  "answers": [
    {
      "questionId": "64f000000000000000000301",
      "answer": "B"
    }
  ]
}
```

## Assignment Submission Schemas

### SubmitAssignmentRequest

```json
{
  "submissionType": "TEXT",
  "textAnswer": "Đây là câu trả lời của em.",
  "attachments": []
}
```

### SubmissionStatusItem

```json
{
  "submissionId": "64f000000000000000000501",
  "studentId": "64f000000000000000000101",
  "studentName": "Le Van C",
  "status": "SUBMITTED",
  "submittedAt": "2026-07-10T09:30:00.000Z",
  "isLate": false,
  "score": null,
  "returnedAt": null
}
```

## AuditLog Schema

```json
{
  "id": "64f000000000000000000901",
  "actor": {
    "id": "64f000000000000000000201",
    "fullName": "Admin User",
    "email": "admin@example.com"
  },
  "action": "ACCOUNT_BLOCKED",
  "resourceType": "USER",
  "resourceId": "64f000000000000000000101",
  "metadata": {
    "oldStatus": "ACTIVE",
    "newStatus": "BLOCKED",
    "reason": "Violation"
  },
  "severity": "WARNING",
  "createdAt": "2026-07-10T09:30:00.000Z"
}
```

## Privacy Rules For Schemas

API response không được chứa:

```text
passwordHash
tokenHash
rawToken
refreshToken secret ngoài auth response
internal provider secrets
```

Teacher/Admin list schemas chỉ trả field phục vụ UI, không trả toàn bộ document MongoDB.
