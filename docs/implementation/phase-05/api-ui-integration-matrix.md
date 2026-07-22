# Phase 05 API To UI Integration Matrix

## 1. Mục Đích

Ma trận này bảo đảm mọi P05 API có consumer rõ trên React Web hoặc được ghi là API-only có lý do. Một operation chỉ được xem là tích hợp khi UI gọi runtime API thật, xử lý đủ loading/success/empty/error/conflict và có component/E2E evidence.

## 2. Quy Ước Tích Hợp

- Protected request dùng `useAuth().request` và bearer access token hiện có.
- Không tạo mock response trong production path.
- Sau mutation, lấy DTO/revision từ response làm canonical state.
- “Refetch” nghĩa gọi lại endpoint cụ thể sau success; không giả định React Query cache.
- List state nằm trong URL search params khi có `page`, filter hoặc sort để Back giữ context.
- `allowedActions` từ API quyết định command có thể hiển thị/bật; role check frontend chỉ là UX guard.
- `409` revision conflict không overwrite local draft; UI cho Reload/Review.
- `401` để AuthProvider refresh flow xử lý; thất bại mới chuyển Login.
- `403/404` không render dữ liệu private đã tải từ resource khác.

## 3. Teacher Quiz And Question Authoring

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `GET /teacher/courses/{courseId}/quizzes` | `TeacherAssessmentsPage`, tab Quiz, search/filter/page | Render `data.items`, lifecycle, due, `allowedActions`; empty theo filter | Query invalid -> field/filter error; refetch sau create/status/archive |
| `POST /teacher/courses/{courseId}/quizzes` | Submit `TeacherQuizCreatePage` | Điều hướng tới `/teacher/quizzes/{id}/edit`; dùng returned revision | `422` giữ form và focus first error; `404` Course safe not found |
| `GET /teacher/quizzes/{quizId}` | Load `TeacherQuizBuilderPage` | Hydrate settings, revisions, lifecycle và action state | `404` Not Found; không giữ builder data của Quiz trước |
| `PATCH /teacher/quizzes/{quizId}` | Save settings | Thay Quiz snapshot/revision, Save=`SAVED` | `409` Save=`CONFLICT`, giữ draft; Reload gọi GET detail |
| `PATCH /teacher/quizzes/{quizId}/status` | Publish/Schedule/Unpublish/Archive command | Thay lifecycle snapshot; refetch assessments list | Prerequisite `409/422` hiển thị reason list; conflict reload detail |
| `POST /teacher/quizzes/{quizId}/preview` | Preview button | Điều hướng/render `TeacherQuizPreviewPage` bằng Student-safe projection | Không cache correct key; `409` prerequisite hiển thị trong builder |
| `GET /teacher/quizzes/{quizId}/questions` | Builder question list | Render ordered items và current `questionRevision` | Empty có Add Question; refetch sau mutation/reorder |
| `POST /teacher/quizzes/{quizId}/questions` | Add Question | Append/replace từ response, nhận aggregate revision mới | Type validation inline; limit/published lock không làm mất draft |
| `PATCH /teacher/questions/{questionId}` | Save Question | Replace exact Question + aggregate revision | Conflict giữ local editor; archive/not found đóng stale editor |
| `DELETE /teacher/questions/{questionId}` | Archive icon + confirm | Remove item theo response/reload list; update max score | Published lock/conflict giữ list canonical sau refetch |
| `PATCH /teacher/quizzes/{quizId}/questions/reorder` | Move up/down commands | Replace entire ordered list/revision từ response | Exact-set conflict refetch; không optimistic order vĩnh viễn khi failed |
| `PUT /teacher/questions/{questionId}/media` | Conditional media Save | Render approved URL/caption/alt và revision mới | Feature off/host invalid hiển thị actionable; không server-fetch URL |
| `DELETE /teacher/questions/{questionId}/media` | Remove media icon + confirm | Render `media=null`, revision mới | Conflict reload Question; không xóa Question content |

## 4. Student Quiz Attempt

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `GET /students/quizzes/{quizId}` | `StudentQuizIntroPage` load/resume decision | Intro, attempts used/remaining, effective due, `canStart` và reason | `404` safe not found; unavailable reason không tự tính ở React |
| `POST /students/quizzes/{quizId}/attempts` | Start/Resume button | Điều hướng `/student/quiz-attempts/{id}`; `resumed` quyết định notice | Limit/due/unavailable hiển thị stable code; double-click disabled while pending |
| `GET /students/quiz-attempts/{attemptId}` | `StudentQuizAttemptPage` initial/reload | Hydrate public snapshot, saved answers, revision, server expiry | Expired/terminal điều hướng theo returned canonical status; cross-owner `404` |
| `PATCH /students/quiz-attempts/{attemptId}/answers` | Debounced/manual answer save | Update saved answers/revision/lastSavedAt; Save=`SAVED` | Một in-flight request; `409` conflict/expired dừng queue và reload canonical |
| `POST /students/quiz-attempts/{attemptId}/submit` | Submit confirmation | Terminal status/result availability; refetch To-do/progress | Double submit dùng canonical/idempotent response; expired reload result/state |
| `GET /students/quizzes/{quizId}/attempts` | Intro history/attempt summary | Paginated own attempts only | Empty = chưa làm; refetch sau submit/regrade visibility change |
| `GET /students/quiz-attempts/{attemptId}/result` | `StudentQuizResultPage` | Released own result hoặc pending-review state theo contract | Unreleased/cross-owner không lộ score/key; return Course/To-do links luôn có |

## 5. Teacher Quiz Results And Review

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `GET /teacher/quizzes/{quizId}/results` | `TeacherQuizResultsPage`, filters/sort/page | Summary + result rows; Needs Review dễ quét | URL giữ query; refetch sau finalize/release/regrade |
| `GET /teacher/quiz-attempts/{attemptId}` | `TeacherQuizAttemptReviewPage` | Teacher projection gồm answer evidence và review revision | Foreign scope safe `404`; không fetch qua Student endpoint |
| `PUT /teacher/quiz-attempts/{attemptId}/review` | Save review draft | Replace review answers/revision, chưa release | Score bounds inline; conflict giữ local feedback và cho Reload |
| `POST /teacher/quiz-attempts/{attemptId}/review/finalize` | Finalize Review | Attempt -> `GRADED` hoặc release theo policy | `REVIEW_INCOMPLETE` focus first pending answer; refetch result list |
| `POST /teacher/quiz-attempts/{attemptId}/release` | Release/Return Result | Result -> visible; show released timestamp | Invalid state/conflict không giả trạng thái success; refetch detail/list |
| `POST /teacher/quiz-attempts/{attemptId}/regrade` | Regrade dialog với reason | Replace final score/revision, append history server-side | Reason/score validation; refetch Teacher detail/list, Student tự thấy khi policy cho phép |

## 6. Teacher Assignment Authoring And Roster

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `GET /teacher/courses/{courseId}/assignments` | `TeacherAssessmentsPage`, tab Assignment | Paginated activities/lifecycle/due/action | Refetch sau create/status; URL giữ filter/page |
| `POST /teacher/courses/{courseId}/assignments` | Submit `TeacherAssignmentCreatePage` | Điều hướng editor với returned ID/revision | FILE gửi lên luôn bị từ chối P05; field error giữ draft |
| `GET /teacher/assignments/{assignmentId}` | `TeacherAssignmentEditorPage` load | Hydrate settings, methods, policies, revisions | Safe not found; feature-off methods không render như enabled |
| `PATCH /teacher/assignments/{assignmentId}` | Save Assignment settings | Replace canonical Assignment/revision | Conflict giữ local form; Reload explicit |
| `PATCH /teacher/assignments/{assignmentId}/status` | Publish/Schedule/Close/Reopen/Archive | Replace lifecycle; refetch assessment list | Reopen/exceptional transition requires reason; prerequisites shown |
| `POST /teacher/assignments/{assignmentId}/preview` | Preview button | Render Student-safe preview | Không tạo submission; unavailable config shown in editor |
| `GET /teacher/assignments/{assignmentId}/submissions` | `TeacherAssignmentSubmissionsPage` | Roster gồm derived assigned/missing và current evidence metadata | Search/status/page URL; refetch after grade/return/deadline exception |
| `GET /teacher/submissions/{submissionId}` | `TeacherSubmissionGradingPage` | Submission content/current revision/effective deadline/Grade draft | Foreign Student/Classroom safe `404`; Back giữ roster query |

## 7. Student Assignment And Submission

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `GET /students/assignments/{assignmentId}` | `StudentAssignmentPage` | Assignment instructions, policy, effective due, `allowedActions` | Not available/scope state không lộ Teacher draft |
| `GET /students/assignments/{assignmentId}/submission` | Load current own work | Current submission hoặc explicit null/empty draft state | Không dùng `studentId` query; cross-owner impossible by contract |
| `PUT /students/assignments/{assignmentId}/submission` | Save draft | Replace current submission/revision; Save=`SAVED` | `422` method/content error; `409` conflict giữ local answer |
| `POST /students/submissions/{submissionId}/turn-in` | Turn In confirm | State `SUBMITTED/LATE`, submittedAt/effective due canonical; refetch To-do | Closed/late-disabled/conflict không đổi UI state locally |
| `POST /students/submissions/{submissionId}/unsubmit` | Unsubmit confirm khi allowed | State về editable, revision mới; refetch To-do/progress | Returned/closed/policy deny giữ canonical state |
| `POST /students/submissions/{submissionId}/resubmit` | Start resubmission trước return | New current revision/editable state, history retained | P05 không cho after-return resubmit; reason/conflict shown |
| `GET /students/submissions/{submissionId}/history` | History section | Paginated own revisions/events | Không hiển thị Teacher private grade draft hoặc other Student data |

## 8. Grade And Feedback

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `PUT /teacher/submissions/{submissionId}/grade` | Save Grade button | Grade draft/revision canonical; Return có thể được enable | Evidence/Grade revision mismatch -> conflict + reload both evidence/grade |
| `POST /teacher/submissions/{submissionId}/return` | Return Work confirm | Grade/Submission `RETURNED`, returnedAt set atomically | Invalid draft/transaction failure không hiện Student-visible state |
| `POST /teacher/grades/{gradeId}/regrade` | Regrade dialog | New score/feedback/revision/history | Mandatory reason; refetch submission, roster và history |
| `GET /teacher/grades/{gradeId}/history` | Grading detail history | Paginated safe revision metadata/private Teacher view | No raw audit log; filter/page controlled by server |
| `GET /students/me/grades` | `StudentGradesPage` | Returned own Grade list only | Empty = chưa có kết quả được trả; URL filters persisted |
| `GET /students/me/grades/{gradeId}` | `StudentGradeDetailPage` | Own score/max/feedback/returnedAt/action URL | Draft/foreign grade safe `404`; never show stale previous Grade |
| `GET /teacher/courses/{courseId}/gradebook` | Conditional basic Gradebook screen | Derived basic rows, no weighting/export | Feature off hides nav and API returns documented feature error |

## 9. Deadline Exceptions

| API | UI consumer/action | Success state | Error/refresh behavior |
| --- | --- | --- | --- |
| `GET /teacher/activities/{type}/{id}/deadline-exceptions` | `TeacherDeadlineExceptionsPage` list/current state | Paginated Student current overrides/effective due | Search/page URL; foreign activity safe `404` |
| `PUT /teacher/activities/{type}/{id}/deadline-exceptions/{studentId}` | Set/extend deadline form | Replace current exception/revision + audit result | Shortening/past/reason/conflict field errors; refetch roster/activity |
| `POST /teacher/activities/{type}/{id}/deadline-exceptions/{studentId}/revoke` | Revoke confirm | Effective deadline returns default; revision/history updated | Already revoked may idempotent/current; conflict reload current |
| `GET /teacher/activities/{type}/{id}/deadline-exceptions/{studentId}/history` | History panel | Paginated append-only set/revoke events | No Student submission/grade content; stable newest-first sort |

## 10. Existing P04 Read Models Phải Nâng Cấp

| Existing API | Consumer | P05 response change | Trigger cần refetch |
| --- | --- | --- | --- |
| `GET /classrooms/{classroomId}/classwork` | Student Classroom/Course classwork | `descriptorVersion=P05_ACTIVITY_DESCRIPTOR_V2`; mixed Lesson/Quiz/Assignment | Publish/unpublish visible activity; Student route entry |
| `GET /students/me/todo` | Student dashboard To-do | `activityType`, effective deadline, `resultPending`, server `actionUrl`, scope version V2 | Quiz submit, Assignment turn-in/unsubmit, deadline set/revoke |
| `GET /students/me/deadlines` | Student Deadline View | Mixed activity filters, exception indicator và descriptor version V2 | Deadline exception/status/turn-in changes |
| `GET /students/me/progress?courseId=...` | Student Course progress | `metricVersion=P05_REQUIRED_ACTIVITY_COMPLETION_V1` | Lesson complete, Quiz finalize, Assignment turn-in/unsubmit |
| `GET /teacher/courses/{courseId}/dashboard` | Teacher Course dashboard | Basic activity counts/status, metric version | Publish/submit/grade/deadline changes |
| `GET /teacher/courses/{courseId}/activities` | Teacher activity table | Mixed activity rows | Activity/status/deadline change |
| `GET /teacher/courses/{courseId}/students` | Teacher Student table | P05 completion metric only; no weighted score | Completion/submission changes |
| `GET /teacher/courses/{courseId}/progress` | Teacher ranking | Ranking theo completion metric version, không Grade weighting | Completion/submission changes |
| `GET /admin/courses` | Admin governance list | Quiz/Assignment lifecycle counts metadata-only | Assessment lifecycle changes |
| `GET /admin/courses/{courseId}` | Admin governance detail | Assessment counts/status aggregate only | Assessment lifecycle changes |

## 11. UI State Coverage Matrix

Mọi page P05 phải có test cho các state liên quan:

| State | Required behavior |
| --- | --- |
| Loading | Stable dimensions/skeleton; command disabled |
| Empty | Phân biệt không có dữ liệu với filter không match |
| Error | Message tiếng Việt theo stable code; retry đúng GET |
| Forbidden/Not Found | Không leak resource identity/private data |
| Validation | Field association, focus first invalid field |
| Conflict | Giữ draft memory, cho Reload/Review, không silent overwrite |
| Expired/Closed | Reload canonical state, disabled action có lý do |
| Feature Off | Không render fake capability; API error vẫn được map |
| Saving | One in-flight mutation, stable button width |
| Success | Canonical DTO/revision từ server, aggregate refetch đúng |

## 12. Integration Completion Rule

Một row chỉ được đánh `Done` khi có đủ:

1. Runtime route + Zod + permission/scope.
2. OpenAPI operation/schema/example.
3. React consumer/action dùng API thật.
4. Happy + negative component/integration test.
5. State/error behavior trong ma trận được kiểm chứng.
6. Traceability/evidence cập nhật bằng commit/CI URL.

Nếu API đã merge nhưng UI chưa tích hợp, row vẫn là `In Progress`, Phase 05 chưa được tính hoàn thành.
