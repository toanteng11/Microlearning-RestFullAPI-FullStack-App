# MongoDB Data Model

## Mục Đích

Tài liệu này mô tả thiết kế MongoDB cho hệ thống **Microlearning Classroom LMS Platform**. Thiết kế tập trung vào các collection, reference, embedded document, index và query pattern cần thiết cho ReactJS frontend, Node.js/ExpressJS backend và RESTful API.

## MongoDB Modeling Principles

| Nguyên tắc | Áp dụng trong dự án |
| --- | --- |
| Model theo query thực tế | Ưu tiên các màn hình Student To-do, Teacher Course Dashboard, Admin User Lists |
| Reference cho ownership | User, Classroom, Course dùng ObjectId reference |
| Embed object nhỏ | Question options, attachment metadata có thể embed |
| Read model cho dashboard nặng | CourseProgressSummary, StudentTodoItem có thể materialize |
| Index cho danh sách lớn | Users, enrollments, progress, submissions, audit logs phải có index |
| Soft delete/archive | Không hard delete dữ liệu học tập quan trọng |
| Append-only audit | AuditLog không sửa/xóa bởi user thường |

## Collection List

| Collection | Entity | Priority | Ghi chú |
| --- | --- | --- | --- |
| users | User | Must | Account và profile |
| roles | Role | Must | Seed role |
| permissions | Permission | Must | Seed permission |
| user_sessions | UserSession | Should | Optional nếu dùng refresh token store |
| password_reset_tokens | PasswordResetToken | Should | Reset password secure flow |
| teacher_invitations | TeacherInvitation | Must | Manual copy link |
| system_settings | SystemSetting/Policies | Must | Enrollment/File/Notification/Security settings |
| classrooms | Classroom | Must | Lớp học |
| enrollments | Enrollment | Must | Roster source |
| class_codes | ClassCode | Must | Join bằng code |
| classroom_invite_links | ClassroomInviteLink | Must | Join bằng link |
| courses | Course | Must | Course trong Classroom |
| modules | Module | Must | Module/Topic |
| lessons | Lesson | Must | Micro Lesson |
| flashcards | Flashcard | Must | Flashcard |
| learning_resources | LearningResource | Should | Resource metadata |
| announcements | Announcement | Must | Class Stream |
| quizzes | Quiz | Must | Quiz settings |
| questions | Question | Must | Quiz questions |
| question_media | QuestionMedia | Should | Image/video optional |
| quiz_attempts | QuizAttempt | Must | Student attempts |
| assignments | Assignment | Must | Assignment |
| submissions | Submission | Must | Student submissions |
| grades | Grade | Must | Scores |
| feedback | Feedback | Must | Teacher feedback |
| private_comments | PrivateComment | Should | Assignment comments |
| learning_progress | LearningProgress | Must | Activity progress |
| course_progress_summaries | CourseProgressSummary | Must | Read model/ranking |
| student_todo_items | StudentTodoItem | Should | Optional read model |
| notifications | Notification | Should | In-app notifications |
| report_snapshots | ReportSnapshot | Should | Admin reports |
| audit_logs | AuditLog | Must | Append-only |
| deployment_records | DeploymentRecord | Could | DevOps |
| backup_records | BackupRecord | Should | DevOps backup tracking |

## Core Schema Examples

### users

```json
{
  "_id": "ObjectId",
  "email": "teacher@example.com",
  "passwordHash": "hashed-password",
  "fullName": "Nguyen Van A",
  "role": "TEACHER",
  "status": "ACTIVE",
  "department": "Computer Science",
  "lastLoginAt": "2026-07-10T08:00:00.000Z",
  "lastActiveAt": "2026-07-10T08:30:00.000Z",
  "createdAt": "2026-07-10T08:00:00.000Z",
  "updatedAt": "2026-07-10T08:00:00.000Z"
}
```

### classrooms

```json
{
  "_id": "ObjectId",
  "name": "Node.js Microlearning",
  "description": "Lớp học Node.js nội bộ",
  "ownerTeacherId": "ObjectId",
  "status": "ACTIVE",
  "enrollmentStatus": "OPEN",
  "allowClassCodeJoin": true,
  "allowInviteLinkJoin": true,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### enrollments

```json
{
  "_id": "ObjectId",
  "classroomId": "ObjectId",
  "studentId": "ObjectId",
  "status": "ACTIVE",
  "joinedBy": "CLASS_CODE",
  "joinedAt": "Date",
  "sourceTokenId": null,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### courses

```json
{
  "_id": "ObjectId",
  "classroomId": "ObjectId",
  "ownerTeacherId": "ObjectId",
  "title": "RESTful API Fundamentals",
  "description": "Microlearning course về RESTful API",
  "status": "PUBLISHED",
  "displayOrder": 1,
  "publishedAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### lessons

```json
{
  "_id": "ObjectId",
  "courseId": "ObjectId",
  "moduleId": "ObjectId",
  "title": "HTTP Methods",
  "contentType": "MIXED",
  "content": {},
  "estimatedMinutes": 8,
  "completionDeadline": "Date",
  "deadlineLastUpdatedAt": "Date",
  "deadlineLastUpdatedBy": "ObjectId",
  "deadlineChangeReason": "Gia hạn vì lớp nghỉ đột xuất.",
  "deadlineHistory": [
    {
      "oldDeadline": "Date",
      "newDeadline": "Date",
      "changedBy": "ObjectId",
      "changedAt": "Date",
      "reason": "Gia hạn vì lớp nghỉ đột xuất."
    }
  ],
  "isRequired": true,
  "status": "PUBLISHED",
  "displayOrder": 2,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### questions

```json
{
  "_id": "ObjectId",
  "quizId": "ObjectId",
  "questionText": "HTTP method nào dùng để tạo resource mới?",
  "questionType": "SINGLE_CHOICE",
  "points": 1,
  "options": [
    { "optionId": "A", "text": "GET", "isCorrect": false },
    { "optionId": "B", "text": "POST", "isCorrect": true }
  ],
  "displayOrder": 1,
  "hasMedia": false,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### question_media

```json
{
  "_id": "ObjectId",
  "questionId": "ObjectId",
  "mediaType": "IMAGE",
  "mediaUrl": "https://storage.example.com/question-1.png",
  "caption": "Quan sát sơ đồ request/response",
  "altText": "Sơ đồ request response",
  "mimeType": "image/png",
  "fileSize": 340000,
  "displayOrder": 1,
  "createdAt": "Date"
}
```

### course_progress_summaries

```json
{
  "_id": "ObjectId",
  "courseId": "ObjectId",
  "classroomId": "ObjectId",
  "studentId": "ObjectId",
  "processScore": 86,
  "progressPercentage": 90,
  "completedActivities": 18,
  "totalRequiredActivities": 20,
  "quizAverage": 82,
  "assignmentAverage": 88,
  "missingItems": 1,
  "lateItems": 0,
  "lastActiveAt": "Date",
  "recalculatedAt": "Date"
}
```

### audit_logs

```json
{
  "_id": "ObjectId",
  "actorId": "ObjectId",
  "action": "ACCOUNT_BLOCKED",
  "resourceType": "USER",
  "resourceId": "ObjectId",
  "metadata": {
    "reason": "Policy violation",
    "oldStatus": "ACTIVE",
    "newStatus": "BLOCKED"
  },
  "ipAddress": "127.0.0.1",
  "userAgent": "Browser",
  "severity": "WARNING",
  "createdAt": "Date"
}
```

## Embedding Strategy

| Parent | Embedded | Lý do |
| --- | --- | --- |
| Question | QuestionOption | Options nhỏ, đọc cùng Question |
| Submission | Attachment metadata | Bài nộp thường đọc cùng attachment |
| Announcement | Attachment metadata | Attachment nhỏ, đọc cùng announcement |
| AuditLog | metadata | Metadata gắn với event |
| SystemSetting | value object | Setting đọc theo key |

## Reference Strategy

| Entity | References | Lý do |
| --- | --- | --- |
| Classroom | ownerTeacherId -> User | Teacher profile thay đổi độc lập |
| Course | classroomId, ownerTeacherId | Query theo Classroom/Teacher |
| Lesson/Quiz/Assignment | courseId, moduleId | Query theo Course Dashboard |
| Enrollment | classroomId, studentId | Roster, Student classroom list |
| Submission | assignmentId, studentId | Query submission theo assignment/student |
| LearningProgress | studentId, courseId, activityId | Progress theo nhiều chiều |
| CourseProgressSummary | studentId, courseId | Ranking/sort theo Course |

## Index Strategy

| Collection | Index | Mục đích |
| --- | --- | --- |
| users | `{ email: 1 } unique` | Login và uniqueness |
| users | `{ role: 1, status: 1, fullName: 1 }` | Admin Student/Teacher/Admin lists |
| teacher_invitations | `{ tokenHash: 1 } unique` | Validate invitation |
| teacher_invitations | `{ email: 1, status: 1 }` | Tìm invitation theo email/status |
| classrooms | `{ ownerTeacherId: 1, status: 1 }` | Teacher dashboard |
| enrollments | `{ classroomId: 1, studentId: 1 } unique` | Chặn duplicate join |
| enrollments | `{ studentId: 1, status: 1 }` | Student dashboard |
| class_codes | `{ code: 1, status: 1 }` | Join bằng Class Code |
| classroom_invite_links | `{ tokenHash: 1, status: 1 }` | Join bằng link |
| courses | `{ classroomId: 1, status: 1, displayOrder: 1 }` | Classwork/Course list |
| modules | `{ courseId: 1, displayOrder: 1 }` | Course structure |
| lessons | `{ courseId: 1, status: 1, displayOrder: 1 }` | Course Dashboard |
| quizzes | `{ courseId: 1, status: 1, dueDate: 1 }` | Classwork/To-do |
| assignments | `{ courseId: 1, status: 1, dueDate: 1 }` | Classwork/To-do |
| submissions | `{ assignmentId: 1, studentId: 1 }` | Submission detail |
| submissions | `{ assignmentId: 1, status: 1 }` | Teacher submission table |
| quiz_attempts | `{ quizId: 1, studentId: 1, attemptNumber: 1 }` | Attempt limit |
| learning_progress | `{ studentId: 1, courseId: 1, activityType: 1 }` | Student progress |
| course_progress_summaries | `{ courseId: 1, processScore: -1 }` | Progress ranking |
| student_todo_items | `{ studentId: 1, status: 1, dueDate: 1 }` | Student To-do |
| notifications | `{ recipientId: 1, isRead: 1, createdAt: -1 }` | Notification list |
| audit_logs | `{ actorId: 1, createdAt: -1 }` | Audit filter |
| audit_logs | `{ resourceType: 1, resourceId: 1 }` | Audit detail |

## Important Query Patterns

### Student Dashboard

```text
Input:
- studentId

Query:
- enrollments by studentId/status ACTIVE
- classrooms by classroomId
- student_todo_items by studentId/status active
- learning_progress summary

Output:
- classrooms
- toDoSummary
- upcomingDeadlines
- progressSummary
```

### Teacher Course Detail Dashboard

```text
Input:
- teacherId
- courseId

Query:
- course by courseId and ownerTeacherId
- lessons/quizzes/assignments/resources by courseId
- enrollments by classroomId
- course_progress_summaries by courseId sort processScore DESC

Output:
- courseSummary
- activityList
- studentList
- progressRanking
```

### Admin Role-specific User Lists

```text
Student List:
- users where role = STUDENT
- filter status, keyword, classroomId if needed

Teacher List:
- users where role = TEACHER
- join/aggregate classroom count, course count, invitation status

Admin List:
- users where role in ADMIN/SUPER_ADMIN
- include permission group/status
```

## Data Integrity Controls

| Control | Cách thực hiện |
| --- | --- |
| Unique email | Unique index trên `users.email` |
| Duplicate enrollment | Unique compound index `classroomId + studentId` |
| Active class code uniqueness | Compound/partial unique index theo `code + status` |
| Token security | Chỉ lưu token hash |
| Progress rebuild | Có thể rebuild CourseProgressSummary từ source events/data |
| Audit append-only | Không expose update/delete audit log endpoint cho user thường |

## Backup Scope

Các collection sau bắt buộc nằm trong backup scope:

- users
- teacher_invitations
- classrooms
- enrollments
- courses
- modules
- lessons
- quizzes
- questions
- question_media
- quiz_attempts
- assignments
- submissions
- grades
- feedback
- learning_progress
- course_progress_summaries
- audit_logs
- system_settings

## Migration Notes

- Khi thêm enum mới, cần cập nhật validation backend và Swagger.
- Khi thêm index mới, cần kiểm tra dữ liệu cũ có vi phạm unique constraint không.
- Khi thay đổi progress formula, cần đánh dấu `CourseProgressSummary` để recalculation.
- Khi thay đổi upload provider, không được làm hỏng URL resource cũ.
