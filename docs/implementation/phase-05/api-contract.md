# Phase 05 REST API Contract

## 1. Contract Conventions

- Base path: `/api/v1`.
- JSON UTF-8; timestamps ISO 8601 UTC.
- Auth API protected: `Authorization: Bearer <accessToken>` theo `AuthProvider`; refresh token chỉ đi qua HttpOnly cookie ở auth refresh flow hiện có.
- Mutations use strict Zod schemas and reject unknown fields.
- IDs in route; owner/student/system fields không nhận từ body khi có thể derive.
- Pagination: `page`, `limit` (default 20, max 100), stable sort + `_id` tie-breaker.
- Concurrency: explicit expected revision cho mọi P05 mutation có thể bị ghi đè.
- Envelope/error bám đúng middleware và list contract đang chạy ở Phase 04.
- OpenAPI operationId unique và parity với runtime route.

## 2. Response Envelopes

### Success

```json
{
  "success": true,
  "data": {}
}
```

`x-request-id` luôn nằm trong response header. Success body không tự thêm `requestId`; chỉ thêm `meta` khi endpoint thực sự có metadata nghiệp vụ như phân trang.

### Paginated

```json
{
  "success": true,
  "data": {
    "items": []
  },
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

Filter đã áp dụng được phản ánh bằng query canonical/response domain khi thật sự cần; không tạo top-level `pagination` hoặc `filters` mới cho P05. Cấu trúc này phải dùng lại `Pagination` hiện có của Phase 04.

### Error

```json
{
  "success": false,
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "The resource was changed by another request",
    "details": [
      {
        "field": "expectedContentRevision",
        "code": "STALE_REVISION",
        "message": "Expected revision 2 but current revision is 3"
      }
    ]
  },
  "meta": {
    "requestId": "req_...",
    "timestamp": "2026-08-01T10:00:00.000Z",
    "path": "/api/v1/teacher/quizzes/quiz-id"
  }
}
```

`error.details` luôn là mảng `ErrorDetail` theo middleware hiện tại. Web dùng `error.code`/`details[].code`, không parse `message` để quyết định logic. Error details không chứa correct answer, other Student identity, submission body hoặc feedback.

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

Question list trả `data.items`, `data.questionRevision` và `data.maxScore`. Mọi Question mutation trả canonical Question/order, aggregate `questionRevision`, `maxScore` và `auditId`; Web không tự tăng revision hoặc tự cộng điểm.

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
  "altText": "Ví dụ response HTTP 201",
  "expectedQuestionRevision": 5
}
```

Feature disabled trả `FEATURE_NOT_ENABLED`.

Archive Question request:

```json
{
  "reason": "Question is no longer used",
  "expectedQuestionRevision": 6
}
```

Remove media request:

```json
{
  "expectedQuestionRevision": 7
}
```

Hai `DELETE` operations trả `200` mutation envelope với aggregate `questionRevision` mới; không dùng `204` vì Web cần canonical revision để tiếp tục edit an toàn.

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

Save answer response luôn trả canonical `revision`, `lastSavedAt`, saved answer projection và answered/total counts. Submit response trả `idempotentReplay`, `resultAvailable` và `resultUrl` nullable để Web không tự suy diễn release policy.

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

`getBasicCourseGradebook` luôn nằm trong route/OpenAPI parity manifest. Khi `BASIC_GRADEBOOK_ENABLED=false`, endpoint trả `409 FEATURE_NOT_ENABLED`; Web không hiển thị navigation. Khi bật, response chỉ là derived basic grid, không weighting/export.

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

### Conditional Private Comments

Private Comments chưa có operation trong 52-endpoint baseline và mặc định được defer/N/A nếu không có quyết định `Enabled` trước P05-PR06. Nếu Product Owner bật capability này, phải mở change-control bổ sung endpoint, schema, permission, privacy test, WBS/AC và OpenAPI trước khi code; không tự phát sinh route ngoài parity manifest.

## 10. P04 Read Model Extensions

### Student Classwork

Giữ route Phase 04 `GET /classrooms/{classroomId}/classwork`; mở rộng response thành mixed activities và trả `data.descriptorVersion=P05_ACTIVITY_DESCRIPTOR_V2`. Không tạo route Classwork thứ hai theo `courseId`.

### To-do

`GET /students/me/todo` thêm `activityType=LESSON|QUIZ|ASSIGNMENT`, `effectiveDeadline`, `resultPending`, correct action URL và `data.scopeVersion=P05_MIXED_ACTIVITY_TODO_V2`.

### Deadlines

`GET /students/me/deadlines` thêm filter/activity rows Quiz/Assignment, exception indicator và `data.descriptorVersion=P05_ACTIVITY_DESCRIPTOR_V2`.

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

Invalid enum/date/sort đi qua `parseWithSchema` và trả `422 VALIDATION_ERROR`; no silent fallback for unsupported sort.

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
- `204`: không dùng cho 52 P05 operations; archive/remove media trả `200` vì phải trả revision canonical.
- `400`: malformed transport syntax nếu shared HTTP parser phân loại được; Zod path/query/body validation không dùng status này.
- `401`: unauthenticated.
- `403/404`: safe authorization/existence policy.
- `409`: lifecycle/concurrency/limit/expired/feature state.
- `422`: Zod path/query/body validation và semantically invalid scoring/content.
- `429`: rate limit.

## 14. OpenAPI Requirements

- Tags: `Quizzes`, `Quiz Questions`, `Quiz Attempts`, `Assignments`, `Submissions`, `Grades`, `Deadline Exceptions`.
- Separate Teacher/Student schemas; never reuse secret-bearing schema.
- Happy + validation + forbidden + conflict examples.
- Protected P05 operations dùng `bearerAuth`; `refreshCookie` chỉ mô tả trên auth refresh/logout operations hiện có. Không gắn cookie security hoặc CSRF contract giả vào P05 resource routes.
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
