# Phase 05 REST API Contract

## 1. Contract Conventions

- Base path: `/api/v1`.
- JSON UTF-8; timestamps ISO 8601 UTC.
- Auth: existing HttpOnly session/access token flow.
- Mutations use strict Zod schemas and reject unknown fields.
- IDs in route; owner/student/system fields không nhận từ body khi có thể derive.
- Pagination: `page`, `limit` (default 20, max 100), stable sort + `_id` tie-breaker.
- Concurrency: explicit expected revision/updatedAt.
- Standard envelope/error theo Phase 01-04.
- OpenAPI operationId unique và parity với runtime route.

## 2. Response Envelopes

### Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_..."
  }
}
```

### Paginated

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
  "filters": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "The resource was changed by another request",
    "details": {
      "currentRevision": 3
    },
    "requestId": "req_..."
  }
}
```

Error details không chứa correct answer, other Student identity, submission body hoặc feedback.

## 3. Teacher Quiz Endpoints

| Method | Path | Operation ID | Capability |
| --- | --- | --- | --- |
| GET | `/teacher/courses/{courseId}/quizzes` | `listTeacherCourseQuizzes` | `quiz.manage_owned` |
| POST | `/teacher/courses/{courseId}/quizzes` | `createQuiz` | `quiz.manage_owned` |
| GET | `/teacher/quizzes/{quizId}` | `getTeacherQuiz` | `quiz.manage_owned` |
| PATCH | `/teacher/quizzes/{quizId}` | `updateQuiz` | `quiz.manage_owned` |
| PATCH | `/teacher/quizzes/{quizId}/status` | `changeQuizStatus` | `quiz.publish_owned` |
| POST | `/teacher/quizzes/{quizId}/preview` | `previewQuiz` | `quiz.manage_owned` |
| GET | `/teacher/quizzes/{quizId}/questions` | `listQuizQuestions` | `quiz.manage_owned` |
| POST | `/teacher/quizzes/{quizId}/questions` | `createQuizQuestion` | `quiz.manage_owned` |
| PATCH | `/teacher/questions/{questionId}` | `updateQuizQuestion` | `quiz.manage_owned` |
| DELETE | `/teacher/questions/{questionId}` | `archiveQuizQuestion` | `quiz.manage_owned` |
| PATCH | `/teacher/quizzes/{quizId}/questions/reorder` | `reorderQuizQuestions` | `quiz.manage_owned` |
| PUT | `/teacher/questions/{questionId}/media` | `setQuestionMedia` | `quiz.manage_owned` |
| DELETE | `/teacher/questions/{questionId}/media` | `removeQuestionMedia` | `quiz.manage_owned` |

### Create Quiz Request

```json
{
  "moduleId": null,
  "title": "REST API Fundamentals Quiz",
  "instruction": "Chọn đáp án đúng cho từng câu hỏi.",
  "isRequired": true,
  "availableFrom": "2026-08-01T00:00:00.000Z",
  "dueDate": "2026-08-08T16:59:59.000Z",
  "attemptLimit": 2,
  "timeLimitMinutes": 15,
  "resultReleasePolicy": "IMMEDIATE",
  "scorePolicy": "HIGHEST"
}
```

Response starts `DRAFT`, `contentRevision=1`, `questionRevision=0`, `maxScore=0`.

### Update Quiz Request

```json
{
  "title": "REST API Fundamentals Quiz - Updated",
  "dueDate": "2026-08-10T16:59:59.000Z",
  "expectedContentRevision": 1
}
```

### Change Quiz Status

```json
{
  "status": "PUBLISHED",
  "scheduledPublishAt": null,
  "reason": "Quiz is ready for the classroom",
  "expectedContentRevision": 2,
  "expectedQuestionRevision": 4
}
```

### Create Question

```json
{
  "type": "SINGLE_CHOICE",
  "prompt": "HTTP method nào thường dùng để tạo resource?",
  "points": 2,
  "isRequired": true,
  "options": [
    { "label": "GET" },
    { "label": "POST" },
    { "label": "DELETE" }
  ],
  "correctOptionIndexes": [1],
  "expectedQuestionRevision": 0
}
```

API có thể trả stable option IDs; subsequent update gửi `correctOptionIds`, không dựa vào index. Correct config chỉ có trong Teacher DTO.

### Short Answer Question

```json
{
  "type": "SHORT_ANSWER",
  "prompt": "Giải thích ý nghĩa của idempotency.",
  "points": 5,
  "isRequired": true,
  "rubric": "Nêu được retry không tạo thêm side effect.",
  "expectedQuestionRevision": 3
}
```

### Reorder Questions

```json
{
  "orderedQuestionIds": ["...q2", "...q1", "...q3"],
  "expectedQuestionRevision": 4
}
```

List phải là exact active Question ID set; transaction tăng revision một lần.

### Set URL Media

```json
{
  "kind": "IMAGE_URL",
  "url": "https://allowed.example.edu/http-status.png",
  "caption": "HTTP response example",
  "altText": "Ví dụ response HTTP 201"
}
```

Feature disabled trả `FEATURE_NOT_ENABLED`.

## 4. Student Quiz Endpoints

| Method | Path | Operation ID | Purpose |
| --- | --- | --- | --- |
| GET | `/students/quizzes/{quizId}` | `getStudentQuizIntro` | Intro/settings/attempt availability |
| POST | `/students/quizzes/{quizId}/attempts` | `startQuizAttempt` | Start/resume active attempt |
| GET | `/students/quiz-attempts/{attemptId}` | `getOwnQuizAttempt` | Resume/current state |
| PATCH | `/students/quiz-attempts/{attemptId}/answers` | `saveQuizAnswers` | Save bounded answer batch |
| POST | `/students/quiz-attempts/{attemptId}/submit` | `submitQuizAttempt` | Finalize attempt |
| GET | `/students/quizzes/{quizId}/attempts` | `listOwnQuizAttempts` | Own history/status |
| GET | `/students/quiz-attempts/{attemptId}/result` | `getOwnQuizResult` | Released own result |

### Quiz Intro Response

```json
{
  "id": "quiz-id",
  "title": "REST API Fundamentals Quiz",
  "instructionHtml": "<p>...</p>",
  "attemptLimit": 2,
  "attemptsUsed": 0,
  "attemptsRemaining": 2,
  "timeLimitMinutes": 15,
  "defaultDeadline": "2026-08-08T16:59:59.000Z",
  "effectiveDeadline": "2026-08-10T16:59:59.000Z",
  "hasDeadlineException": true,
  "resultReleasePolicy": "IMMEDIATE",
  "canStart": true,
  "unavailableReason": null
}
```

Intro không trả Question/correct answer trước start.

### Start Attempt Response

```json
{
  "attempt": {
    "id": "attempt-id",
    "attemptNumber": 1,
    "status": "IN_PROGRESS",
    "startedAt": "2026-08-02T10:00:00.000Z",
    "expiresAt": "2026-08-02T10:15:00.000Z",
    "revision": 1,
    "questions": [
      {
        "id": "question-id",
        "type": "SINGLE_CHOICE",
        "prompt": "HTTP method nào thường dùng để tạo resource?",
        "points": 2,
        "options": [
          { "id": "option-a", "label": "GET" },
          { "id": "option-b", "label": "POST" }
        ],
        "media": null
      }
    ],
    "answers": []
  },
  "resumed": false
}
```

### Save Answers Request

```json
{
  "answers": [
    {
      "questionId": "question-id",
      "selectedOptionIds": ["option-b"]
    }
  ],
  "expectedAttemptRevision": 1
}
```

Short answer dùng `textAnswer`; request không được gửi score/correctness.

### Submit Request

```json
{
  "expectedAttemptRevision": 2,
  "confirmUnanswered": true
}
```

Response trả terminal/current status, result availability và safe score nếu policy cho phép.

## 5. Teacher Quiz Result Endpoints

| Method | Path | Operation ID |
| --- | --- | --- |
| GET | `/teacher/quizzes/{quizId}/results` | `listQuizResults` |
| GET | `/teacher/quiz-attempts/{attemptId}` | `getTeacherQuizAttempt` |
| PUT | `/teacher/quiz-attempts/{attemptId}/review` | `saveQuizManualReview` |
| POST | `/teacher/quiz-attempts/{attemptId}/review/finalize` | `finalizeQuizManualReview` |
| POST | `/teacher/quiz-attempts/{attemptId}/release` | `releaseQuizResult` |
| POST | `/teacher/quiz-attempts/{attemptId}/regrade` | `regradeQuizAttempt` |

Result list query: `page`, `limit`, `keyword`, `status`, `sort=score:desc|submittedAt:asc|studentName:asc`.

Manual review request:

```json
{
  "answers": [
    {
      "questionId": "short-question-id",
      "awardedPoints": 4,
      "feedback": "Câu trả lời đúng ý chính."
    }
  ],
  "expectedReviewRevision": 1
}
```

Regrade/finalize requires reason when changing already final/released score.

## 6. Teacher Assignment Endpoints

| Method | Path | Operation ID |
| --- | --- | --- |
| GET | `/teacher/courses/{courseId}/assignments` | `listTeacherCourseAssignments` |
| POST | `/teacher/courses/{courseId}/assignments` | `createAssignment` |
| GET | `/teacher/assignments/{assignmentId}` | `getTeacherAssignment` |
| PATCH | `/teacher/assignments/{assignmentId}` | `updateAssignment` |
| PATCH | `/teacher/assignments/{assignmentId}/status` | `changeAssignmentStatus` |
| POST | `/teacher/assignments/{assignmentId}/preview` | `previewAssignment` |
| GET | `/teacher/assignments/{assignmentId}/submissions` | `listAssignmentSubmissions` |
| GET | `/teacher/submissions/{submissionId}` | `getTeacherSubmission` |

### Create Assignment Request

```json
{
  "moduleId": null,
  "title": "Thiết kế REST endpoint",
  "instruction": "Nộp mô tả API bằng văn bản.",
  "maxScore": 10,
  "isRequired": true,
  "allowedSubmissionTypes": ["TEXT", "LINK"],
  "allowLateSubmission": true,
  "allowUnsubmit": true,
  "allowResubmit": true,
  "availableFrom": null,
  "dueDate": "2026-08-12T16:59:59.000Z"
}
```

`FILE` khi P05 trả validation/feature error.

### Change Status Request

```json
{
  "status": "PUBLISHED",
  "reason": "Assignment is ready",
  "expectedContentRevision": 2
}
```

Reopen `CLOSED -> PUBLISHED` bắt buộc reason.

## 7. Student Assignment Endpoints

| Method | Path | Operation ID |
| --- | --- | --- |
| GET | `/students/assignments/{assignmentId}` | `getStudentAssignment` |
| GET | `/students/assignments/{assignmentId}/submission` | `getOwnAssignmentSubmission` |
| PUT | `/students/assignments/{assignmentId}/submission` | `saveAssignmentSubmissionDraft` |
| POST | `/students/submissions/{submissionId}/turn-in` | `turnInAssignment` |
| POST | `/students/submissions/{submissionId}/unsubmit` | `unsubmitAssignment` |
| POST | `/students/submissions/{submissionId}/resubmit` | `startAssignmentResubmission` |
| GET | `/students/submissions/{submissionId}/history` | `listOwnSubmissionHistory` |

### Save Draft Request

```json
{
  "submissionType": "TEXT",
  "textAnswer": "Thiết kế endpoint POST /api/v1/books...",
  "links": [],
  "markDone": false,
  "expectedSubmissionRevision": 0
}
```

`expectedSubmissionRevision=0` nghĩa create-if-absent. API trả current revision.

### Turn In Request

```json
{
  "expectedSubmissionRevision": 1
}
```

### Resubmit Request

```json
{
  "reason": "Cập nhật bài làm theo feedback",
  "expectedSubmissionRevision": 3
}
```

## 8. Grade And Feedback Endpoints

| Method | Path | Operation ID | Actor |
| --- | --- | --- | --- |
| PUT | `/teacher/submissions/{submissionId}/grade` | `saveSubmissionGrade` | Teacher |
| POST | `/teacher/submissions/{submissionId}/return` | `returnSubmission` | Teacher |
| POST | `/teacher/grades/{gradeId}/regrade` | `regradeAssessment` | Teacher |
| GET | `/teacher/grades/{gradeId}/history` | `listGradeHistory` | Teacher |
| GET | `/students/me/grades` | `listOwnGrades` | Student |
| GET | `/students/me/grades/{gradeId}` | `getOwnGrade` | Student |
| GET | `/teacher/courses/{courseId}/gradebook` | `getBasicCourseGradebook` | Conditional Teacher |

### Save Grade

```json
{
  "score": 8,
  "feedback": "Cấu trúc endpoint rõ ràng, cần bổ sung validation.",
  "expectedEvidenceRevision": 2,
  "expectedGradeRevision": 0
}
```

### Return

```json
{
  "expectedGradeRevision": 1
}
```

### Regrade

```json
{
  "score": 9,
  "feedback": "Đã bổ sung validation đầy đủ.",
  "reason": "Chấm lại sau khi rà soát rubric",
  "expectedGradeRevision": 2
}
```

Student list query supports `page`, `limit`, `classroomId`, `courseId`, `activityType`, `status`, stable returnedAt sort. Chỉ returned own Grades.

## 9. Deadline Exception Endpoints

| Method | Path | Operation ID |
| --- | --- | --- |
| GET | `/teacher/activities/{activityType}/{activityId}/deadline-exceptions` | `listActivityDeadlineExceptions` |
| PUT | `/teacher/activities/{activityType}/{activityId}/deadline-exceptions/{studentId}` | `setStudentDeadlineException` |
| POST | `/teacher/activities/{activityType}/{activityId}/deadline-exceptions/{studentId}/revoke` | `revokeStudentDeadlineException` |
| GET | `/teacher/activities/{activityType}/{activityId}/deadline-exceptions/{studentId}/history` | `listStudentDeadlineExceptionHistory` |

`activityType` path enum uses lower-case `lessons|quizzes|assignments` at HTTP boundary and maps to canonical enum.

### Set Exception

```json
{
  "deadline": "2026-08-15T16:59:59.000Z",
  "reason": "Gia hạn theo trường hợp cá nhân đã được xác nhận",
  "expectedRevision": 0
}
```

### Revoke

```json
{
  "reason": "Khôi phục hạn chung sau khi hoàn tất hỗ trợ",
  "expectedRevision": 1
}
```

Baseline dùng `POST /.../revoke` để request luôn mang được `reason` và `expectedRevision` qua proxy/client một cách nhất quán. Không đồng thời mount biến thể `DELETE`; OpenAPI và runtime chỉ công bố một operation canonical.

## 10. P04 Read Model Extensions

### Student Classwork

`GET /students/me/courses/{courseId}/classwork` trả mixed activities và `descriptorVersion=P05_ACTIVITY_DESCRIPTOR_V2`.

### To-do

`GET /students/me/todo` thêm `activityType=LESSON|QUIZ|ASSIGNMENT`, `effectiveDeadline`, `resultPending`, correct action URL.

### Deadlines

`GET /students/me/deadlines` thêm filter/activity rows Quiz/Assignment và exception indicator.

### Progress

`GET /students/me/progress` trả `metricVersion=P05_REQUIRED_ACTIVITY_COMPLETION_V1`.

### Teacher Course Dashboard

Existing endpoints thêm counts/status cơ bản nhưng không đổi weighted process score. Response luôn có metric/descriptor version để Web không đoán.

### Admin Course Governance

Existing `GET /admin/courses` và `GET /admin/courses/{courseId}` thêm `quizCount`, `assignmentCount` và lifecycle count tổng hợp. Projection không chứa Question body/correct key, Attempt answer, Submission content, Student Grade hoặc Feedback. Assignment/Quiz effectiveness report, average score và missing rate thuộc Phase 06.

## 11. List Filtering And Sorting

| Endpoint | Filters | Stable default sort |
| --- | --- | --- |
| Teacher Quizzes | keyword/status/module/due range | displayOrder, id |
| Quiz results | keyword/status/result release | score desc, submittedAt, studentId |
| Teacher Assignments | keyword/status/module/due range | displayOrder, id |
| Submission roster | keyword/status/deadline exception | status priority, Student name, studentId |
| Own Grades | classroom/course/type | returnedAt desc, id desc |
| Deadline exceptions | student keyword/active | deadline asc, studentId |

Invalid enum/date/sort returns `400 VALIDATION_ERROR`; no silent fallback for unsupported sort.

## 12. Error Catalog

### Authorization/Scope

`AUTHENTICATION_REQUIRED`, `ACCOUNT_NOT_ACTIVE`, `ACCESS_DENIED`, `RESOURCE_NOT_FOUND`, `ENROLLMENT_NOT_ACTIVE`.

### Quiz/Attempt

`QUIZ_NOT_AVAILABLE`, `QUIZ_HAS_NO_VALID_QUESTION`, `QUIZ_DUE_PASSED`, `ATTEMPT_LIMIT_REACHED`, `ATTEMPT_EXPIRED`, `ATTEMPT_ALREADY_FINALIZED`, `INVALID_ATTEMPT_ANSWER`, `REVIEW_INCOMPLETE`.

### Assignment/Submission

`ASSIGNMENT_NOT_AVAILABLE`, `ASSIGNMENT_CLOSED`, `LATE_SUBMISSION_NOT_ALLOWED`, `SUBMISSION_METHOD_NOT_ALLOWED`, `SUBMISSION_INCOMPLETE`, `UNSUBMIT_NOT_ALLOWED`, `RESUBMIT_NOT_ALLOWED`, `SUBMISSION_REVISION_MISMATCH`.

### Grade/Deadline/Feature

`INVALID_GRADE_SCORE`, `GRADE_NOT_READY_TO_RETURN`, `DEADLINE_EXCEPTION_NOT_ALLOWED`, `DEADLINE_SHORTENING_DENIED`, `FEATURE_NOT_ENABLED`, `CONCURRENT_MODIFICATION`, `INVALID_STATE_TRANSITION`.

## 13. HTTP Semantics

- `200`: read/update/idempotent replay.
- `201`: create Quiz/Question/Assignment/first Attempt/first Submission.
- `204`: archive/remove media only when no response useful; project may consistently use envelope instead.
- `400`: malformed query/path.
- `401`: unauthenticated.
- `403/404`: safe authorization/existence policy.
- `409`: lifecycle/concurrency/limit/expired/feature state.
- `422`: semantically invalid payload/scoring/content.
- `429`: rate limit.

## 14. OpenAPI Requirements

- Tags: `Quizzes`, `Quiz Questions`, `Quiz Attempts`, `Assignments`, `Submissions`, `Grades`, `Deadline Exceptions`.
- Separate Teacher/Student schemas; never reuse secret-bearing schema.
- Happy + validation + forbidden + conflict examples.
- Cookie/security scheme và CSRF expectations mô tả đúng runtime.
- Feature-disabled response documented cho conditional routes.
- Every operationId in parity manifest; no undocumented mounted route.
- Swagger UI at `/api-docs`; JSON at `/api/v1/openapi.json`.

## 15. Contract Test Requirements

1. Runtime path/method equals OpenAPI operation.
2. Request examples validate against schemas.
3. Student response recursively excludes forbidden fields.
4. Pagination/filter/sort metadata stable.
5. Error codes/status match implementation.
6. Conditional feature off behavior match docs.
7. P04 Lesson route/schema regression remains Pass.
