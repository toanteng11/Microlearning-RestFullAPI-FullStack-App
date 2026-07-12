# Data Validation Rules

## Mục Đích

Tài liệu này xác định quy tắc validation dữ liệu cho hệ thống **Microlearning Classroom LMS Platform**. Validation phải được thực hiện ở backend là lớp bắt buộc, frontend chỉ hỗ trợ trải nghiệm người dùng. Mọi validation quan trọng phải được phản ánh trong RESTful API và Swagger/OpenAPI.

## Validation Principles

| Nguyên tắc | Mô tả |
| --- | --- |
| Backend is source of validation truth | Không tin dữ liệu chỉ vì frontend đã validate |
| Consistent error response | API trả error code/message/details nhất quán |
| Validate before write | Không lưu dữ liệu chưa hợp lệ |
| Validate permission and ownership | Dữ liệu hợp lệ về format vẫn phải kiểm quyền |
| Avoid leaking sensitive data | Lỗi auth/token không tiết lộ thông tin nhạy cảm |
| Keep enum consistent | Enum phải thống nhất giữa backend, frontend và Swagger |

## Common Validation Rules

| Field / Nhóm | Quy tắc | Error Code |
| --- | --- | --- |
| ObjectId | Phải đúng format ObjectId nếu là path/query param | INVALID_ID |
| required field | Không được null/undefined/empty string | REQUIRED_FIELD |
| string length | Không vượt min/max theo field | INVALID_LENGTH |
| enum | Giá trị phải thuộc danh sách cho phép | INVALID_ENUM |
| date | Phải là ISO date hợp lệ | INVALID_DATE |
| pagination page | `page >= 1` | INVALID_PAGINATION |
| pagination limit | `1 <= limit <= 100` hoặc theo policy | INVALID_PAGINATION |
| sort field | Chỉ cho sort field whitelist | INVALID_SORT |
| file size | Không vượt file upload policy | FILE_TOO_LARGE |
| file type | MIME type/extension phải được cho phép | FILE_TYPE_NOT_ALLOWED |

## User Validation

| Entity | Field | Quy tắc | Error Code |
| --- | --- | --- | --- |
| User | email | Required, email format, lowercase, unique | EMAIL_INVALID / EMAIL_ALREADY_EXISTS |
| User | password | Đạt password policy, không lưu plain text | PASSWORD_POLICY_FAILED |
| User | fullName | Required, 2-100 ký tự | INVALID_FULL_NAME |
| User | role | `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN` | INVALID_ROLE |
| User | status | `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED` | INVALID_STATUS |
| User | studentCode | Unique nếu được dùng | STUDENT_CODE_DUPLICATED |
| Student self-registration | role/status | Backend gán cố định `STUDENT`/`ACTIVE`; không lấy role/status do client gửi | FORBIDDEN_FIELD / INVALID_ROLE |
| Student self-registration | side effects | Chỉ tạo User; không tạo session, Enrollment, Progress hoặc To-do | INVALID_REGISTRATION_SIDE_EFFECT |

## Authentication And Token Validation

| Flow | Quy tắc | Error Code |
| --- | --- | --- |
| Login | Email/password đúng, account `ACTIVE` | INVALID_CREDENTIALS / ACCOUNT_NOT_ACTIVE |
| Classroom join | Bắt buộc session hợp lệ, role `STUDENT`, status `ACTIVE` trước khi validate/tạo Enrollment | UNAUTHORIZED / FORBIDDEN / ACCOUNT_NOT_ACTIVE |
| Refresh token | Token còn hạn, chưa revoked | TOKEN_INVALID |
| Reset password | Reset token còn hạn, one-time use | RESET_TOKEN_INVALID |
| Teacher invitation | Token còn hạn, status `PENDING`, email khớp | INVITATION_INVALID |
| Join by invite | Token active, policy cho phép, Classroom active | JOIN_TOKEN_INVALID |

## TeacherInvitation Validation

| Field / Action | Quy tắc | Error Code |
| --- | --- | --- |
| email | Required, email format | EMAIL_INVALID |
| tokenHash | Unique, không expose raw token | TOKEN_INVALID |
| expiresAt | Phải lớn hơn `createdAt` | INVALID_EXPIRY |
| accept invitation | Email Teacher nhập phải khớp email invitation | INVITATION_EMAIL_MISMATCH |
| revoke invitation | Chỉ revoke được `PENDING` invitation | INVITATION_NOT_REVOKABLE |
| create invitation | Không tạo invitation mới nếu Teacher đã `ACTIVE` trừ khi policy cho phép | TEACHER_ALREADY_ACTIVE |

## Classroom And Enrollment Validation

| Entity | Field / Action | Quy tắc | Error Code |
| --- | --- | --- | --- |
| Classroom | name | Required, 2-120 ký tự | INVALID_CLASSROOM_NAME |
| Classroom | ownerTeacherId | User phải role `TEACHER`, status `ACTIVE` | INVALID_TEACHER_OWNER |
| Classroom | status | `ACTIVE`, `ARCHIVED`, `LOCKED` | INVALID_CLASSROOM_STATUS |
| ClassCode | code | Unique khi active, đúng format | INVALID_CLASS_CODE |
| Enrollment | classroomId + studentId | Không có duplicate active enrollment | DUPLICATE_ENROLLMENT |
| Enrollment | joinedBy | Chỉ `CLASS_CODE` hoặc `INVITE_LINK`; giá trị khác bị từ chối | INVALID_JOIN_METHOD |
| Join Classroom | Admin policy và Classroom setting phải cho phép | JOIN_METHOD_DISABLED |
| Remove Student | Teacher/Admin phải có quyền | FORBIDDEN |

## Course And Content Validation

| Entity | Field | Quy tắc | Error Code |
| --- | --- | --- | --- |
| Course | title | Required, 2-150 ký tự | INVALID_COURSE_TITLE |
| Course | classroomId | Classroom tồn tại và Teacher có quyền | CLASSROOM_NOT_FOUND / FORBIDDEN |
| Course | status | `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` | INVALID_CONTENT_STATUS |
| Module | title | Required | INVALID_MODULE_TITLE |
| Module | displayOrder | Number >= 0 | INVALID_ORDER |
| Lesson | title | Required | INVALID_LESSON_TITLE |
| Lesson | estimatedMinutes | 1-60 nếu có | INVALID_ESTIMATED_TIME |
| Lesson | completionDeadline | Date hợp lệ, nên lớn hơn hiện tại khi set mới; bắt buộc khi Lesson được publish/assign nếu course policy yêu cầu deadline | INVALID_DEADLINE |
| Lesson | deadlineChangeReason | Bắt buộc khi reset deadline của Lesson đã publish/assigned | DEADLINE_REASON_REQUIRED |
| Lesson | status | `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` | INVALID_CONTENT_STATUS |
| Flashcard | frontText/backText | Không rỗng | INVALID_FLASHCARD |
| LearningResource | url | URL hợp lệ hoặc file metadata hợp lệ | INVALID_RESOURCE_URL |

## Quiz And Question Validation

| Entity | Field / Action | Quy tắc | Error Code |
| --- | --- | --- |
| Quiz | title | Required | INVALID_QUIZ_TITLE |
| Quiz | attemptLimit | >= 1 nếu có | INVALID_ATTEMPT_LIMIT |
| Quiz | timeLimitMinutes | >= 1 nếu có | INVALID_TIME_LIMIT |
| Quiz | dueDate | Date hợp lệ | INVALID_DUE_DATE |
| Quiz | publish | Phải có ít nhất một Question hợp lệ | QUIZ_HAS_NO_QUESTION |
| Question | questionText | Required dù có media | INVALID_QUESTION_TEXT |
| Question | questionType | `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER` | INVALID_QUESTION_TYPE |
| Question | points | >= 0 | INVALID_POINTS |
| QuestionOption | options | Choice question phải có đủ options | INVALID_OPTIONS |
| QuestionOption | correctAnswer | Single choice chỉ có một đáp án đúng | INVALID_CORRECT_ANSWER |
| QuestionMedia | mediaType | `IMAGE`, `VIDEO` | INVALID_MEDIA_TYPE |
| QuestionMedia | mediaUrl | URL hợp lệ hoặc file hợp lệ | INVALID_MEDIA_URL |
| QuizAttempt | submit | Không submit trùng completed attempt | ATTEMPT_ALREADY_SUBMITTED |
| QuizAttempt | attemptNumber | Không vượt attemptLimit | ATTEMPT_LIMIT_REACHED |

## Assignment And Submission Validation

| Entity | Field / Action | Quy tắc | Error Code |
| --- | --- | --- |
| Assignment | title | Required | INVALID_ASSIGNMENT_TITLE |
| Assignment | instruction | Required | INVALID_ASSIGNMENT_INSTRUCTION |
| Assignment | maxScore | >= 0 | INVALID_MAX_SCORE |
| Assignment | allowedSubmissionTypes | Có ít nhất một type | INVALID_SUBMISSION_POLICY |
| Submission | submissionType | Thuộc allowedSubmissionTypes | SUBMISSION_TYPE_NOT_ALLOWED |
| Submission | textAnswer | Required nếu type `TEXT` | TEXT_ANSWER_REQUIRED |
| Submission | attachments | File/link hợp lệ nếu type `FILE`/`LINK` | INVALID_ATTACHMENT |
| Submission | resubmit | Chỉ cho nếu `allowResubmit = true` và assignment chưa đóng | RESUBMIT_NOT_ALLOWED |
| Grade | score | 0 <= score <= maxScore | INVALID_SCORE |
| Feedback | content | Không rỗng | INVALID_FEEDBACK |

## Progress And Dashboard Validation

| Entity | Field / Action | Quy tắc | Error Code |
| --- | --- | --- |
| LearningProgress | activityType | `LESSON`, `FLASHCARD`, `RESOURCE`, `QUIZ`, `ASSIGNMENT` | INVALID_ACTIVITY_TYPE |
| LearningProgress | progressPercentage | 0-100 | INVALID_PROGRESS |
| LearningProgress | status | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `MISSING`, `LATE`, `NEEDS_REVIEW` | INVALID_PROGRESS_STATUS |
| CourseProgressSummary | processScore | 0-100 | INVALID_PROCESS_SCORE |
| StudentTodoItem | actionUrl | Phải map đến activity hợp lệ | INVALID_TODO_ACTION |

## Admin Governance Validation

| Action | Quy tắc | Error Code |
| --- | --- | --- |
| View Student List | Actor phải có permission `user.view_students` | FORBIDDEN |
| View Teacher List | Actor phải có permission `user.view_teachers` | FORBIDDEN |
| View Admin List | Actor phải có permission `user.view_admins` | FORBIDDEN |
| Change role | Không cho self privilege escalation | FORBIDDEN |
| Block Teacher | Nếu Teacher còn Classroom active, yêu cầu offboarding theo policy | TEACHER_HAS_ACTIVE_CLASSROOM |
| Transfer ownership | Teacher mới phải role `TEACHER`, status `ACTIVE` | INVALID_NEW_OWNER |
| Update policy | Actor phải có permission phù hợp; ghi AuditLog | FORBIDDEN |

## Error Response Standard

API validation error nên trả:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      {
        "field": "email",
        "code": "EMAIL_INVALID",
        "message": "Email không đúng định dạng"
      }
    ]
  }
}
```

## QA Checklist

- Test required fields.
- Test enum invalid.
- Test permission denied.
- Test duplicate email/enrollment.
- Test invalid/expired/revoked token.
- Test file type/size.
- Test deadline and late status.
- Test processScore/progress range.
- Test list pagination/filter/sort with invalid params.
