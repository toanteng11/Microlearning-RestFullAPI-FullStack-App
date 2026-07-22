# Phase 05 Scope And Deliverables

## 1. Scope Statement

Phase 05 cung cấp assessment workflow hoàn chỉnh trên Course/Classroom đã tồn tại: Teacher giao Quiz/Assignment, Student thực hiện, Teacher review/grade/return, Student xem kết quả của chính mình. Increment phải bảo toàn ownership, enrollment, content visibility, deadline, progress và navigation contract của Phase 03-04.

## 2. Actor Scope

| Actor | Trong scope | Không nằm trong daily workflow |
| --- | --- | --- |
| Student | Xem assessment published, làm Quiz, nộp Assignment, xem own result/grade | Xem đáp án chuẩn trước release, dữ liệu Student khác, tự sửa score/deadline |
| Teacher | Quản lý assessment trong Course owned, xem result/submission, review/grade/return | Quản lý Course của Teacher khác, override global policy |
| Admin | Read-only governance metadata và exceptional action nếu capability rõ | Chấm bài hằng ngày hoặc đọc private answer mặc định |
| Super Admin | Exceptional governance có reason/audit | Bypass privacy mà không purpose/capability |
| System | Server time, scoring, derived state, audit và reconciliation | Tin client score/time/status |

## 3. Must Functional Scope

### 3.1 Quiz Authoring

- Tạo Quiz dưới một Course, có thể gắn Module.
- Metadata: title, instruction, isRequired, displayOrder, availability, due date.
- Settings: `attemptLimit`, optional `timeLimitMinutes`, `resultReleasePolicy`, `scorePolicy`.
- Lifecycle: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`; effective scheduling tái sử dụng server-time policy của P04, không cần scheduler mới.
- Publish prerequisite: Course/Module hợp lệ, ít nhất một Question hợp lệ, tổng điểm > 0, availability/deadline hợp lệ.
- Unpublish/archive giữ attempt, result, grade và audit cũ.

### 3.2 Question Builder

- `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`.
- Tạo, sửa, archive và reorder exact-set với `questionRevision`.
- Option có stable ID để snapshot/answer không phụ thuộc vị trí mảng.
- Correct answer và rubric chỉ có trong Teacher/scoring projection.
- Student projection tuyệt đối không trả `isCorrect`, acceptable answer hoặc rubric bí mật.
- Attempt snapshot bảo vệ lịch sử khi Teacher sửa Quiz sau này.

### 3.3 Quiz Attempt And Scoring

- Student xem Quiz intro trước khi bắt đầu.
- Start attempt transactionally, giới hạn một active attempt và không vượt attempt limit.
- Lưu answer theo revision; resume active attempt trên thiết bị/refresh hợp lệ.
- Submit idempotent; server chấm objective question từ scoring snapshot.
- Expiry dùng server clock và `expiresAt`; answer sau expiry bị từ chối.
- Short answer chuyển attempt sang `NEEDS_REVIEW`.
- Teacher manual review, regrade và release result với history.
- Student chỉ xem own result theo release policy.

### 3.4 Assignment Authoring

- Tạo Assignment dưới Course, có thể gắn Module.
- Title, instruction, max score, isRequired, due date, display order.
- Submission policy: `TEXT`, conditional `LINK`, conditional `MARK_DONE`; `FILE` deferred P07.
- `allowLateSubmission`, `allowUnsubmit`, `allowResubmit` là explicit boolean.
- Lifecycle: `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `CLOSED`, `ARCHIVED`; effective scheduling tái sử dụng server-time policy của P04.
- Closed rejects new turn-in/resubmit; reopen yêu cầu reason/audit.

### 3.5 Submission Workflow

- Một current Submission cho mỗi Student/Assignment.
- Save draft có optimistic revision và không làm To-do hoàn thành.
- Turn in tạo immutable revision/event với server `submittedAt`.
- Late xác định bằng effective deadline của Student.
- Unsubmit/resubmit chỉ khi policy và lifecycle cho phép; giữ lịch sử.
- `MISSING` là derived state khi quá hạn chưa có valid turn-in.
- Duplicate/retry không tạo nhiều current Submission.

### 3.6 Grade, Feedback And Return

- Teacher xem paginated Submission roster kể cả Student chưa nộp bằng Enrollment + Submission left join.
- Grade score trong `[0, maxScoreSnapshot]`.
- Feedback private, sanitized, không xuất hiện trong Stream/report rộng.
- Grade draft không visible cho Student.
- Return work/result phát hành Grade/Feedback và ghi `returnedAt`.
- Regrade dùng expected revision, append-only history và AuditLog.
- Student own Grades page không trả dữ liệu người khác.

### 3.7 Deadline Exception

- Teacher set/replace/revoke deadline exception cho một Student và một `LESSON/QUIZ/ASSIGNMENT`.
- Default Must chỉ cho extend; shorten/past override cần exceptional capability ngoài daily Teacher flow.
- Reason 10-500 ký tự, expected revision và immutable history.
- Effective deadline precedence: active Student exception > activity default.
- Chỉ To-do/Deadline/late-missing của Student liên quan được tính lại.

### 3.8 Cross-Cutting Read Models

- Student Classwork hiển thị Lesson/Quiz/Assignment visible theo canonical order.
- To-do/Deadline View mở rộng `activityTypes` sang `LESSON`, `QUIZ`, `ASSIGNMENT`.
- Quiz completed khi attempt hợp lệ được submit/timed out; manual score pending không giữ item trong active To-do.
- Assignment completed cho active To-do khi valid Submission được turn in; unsubmit đưa item trở lại.
- Progress metric version `P05_REQUIRED_ACTIVITY_COMPLETION_V1`; Grade không được tự động đưa vào weighted process score.
- Teacher Dashboard có activity/status/submission/result summary cơ bản; analytics sâu thuộc P06.
- Existing Admin Course governance chỉ được mở rộng Quiz/Assignment lifecycle counts; không trả Question, Attempt answer, Submission body, Grade hoặc Feedback.

## 4. Conditional Scope

| ID | Capability | Entry condition | Fallback |
| --- | --- | --- | --- |
| P05-CS-001 | Question image URL | HTTPS + host allowlist + CSP + fallback text | Text-only Question |
| P05-CS-002 | Question video URL | Approved provider + sandboxed embed | Link/fallback text |
| P05-CS-003 | Assignment LINK | URL validation + no server-side fetch | TEXT only |
| P05-CS-004 | MARK_DONE | Teacher explicitly enables | TEXT submission |
| P05-CS-005 | Private comments | Privacy/audit/moderation tests pass | Grade feedback only |
| P05-CS-006 | Basic Gradebook | Submission/Grade Must path stable | Per-assessment result pages |

## 5. Deferred Scope

| Capability | Target | Reason |
| --- | --- | --- |
| Question image/video upload | P07 | Private GCS upload, malware/type/size/finalization chưa triển khai |
| Assignment FILE submission | P07 | Cần authorized upload/download, retention, orphan cleanup |
| Teacher attachment upload | P07 | Cùng storage boundary |
| Advanced Gradebook/export | P06 | Reporting, weighting và export governance |
| Weighted process score/ranking | P06 | Cần metric governance đa hoạt động |
| Notification | P06/P07 | Không chặn source transaction; cần retry/observability |
| Resubmit after `RETURNED` | Post-MVP | P05 giữ returned evidence ổn định; re-open/resubmit sau trả bài cần policy/regrade UX riêng |
| Plagiarism/proctoring | Post-MVP | Chi phí, privacy và scope lớn |

## 6. Deliverables

### 6.1 Backend

- Domain modules: `quizzes`, `questions`, `quiz-attempts`, `assignments`, `submissions`, `grades`, `deadline-exceptions`.
- Reader/writer ports để tích hợp P04 mà không import Mongoose model xuyên module.
- Zod request/query schemas, DTO projection và standard errors.
- Mongo repositories/indexes/transactions/concurrency guards.
- Scoring/manual review/release and derived-state policies.
- Phase Five router và composition wiring.

### 6.2 Frontend

- Teacher Quiz list/builder/results/review.
- Student Quiz intro/player/result.
- Teacher Assignment list/editor/submission table/detail/grading.
- Student Assignment detail/draft/turn-in/result.
- Student own Grades page.
- Deadline exception control trong Teacher Student/activity context.
- P04 Classwork/To-do/Deadline/Dashboard được mở rộng có kiểm soát.

### 6.3 Data And Contract

- Collection/index manifest và migration preflight.
- OpenAPI tags/schemas/operations/examples cho P05.
- Versioned activity/progress/grade contracts bàn giao P06.
- Deterministic demo seed có Student trạng thái khác nhau.

### 6.4 Quality And Operations

- Unit, component, integration, contract và E2E suites.
- Concurrency, IDOR, answer leakage, grade privacy và XSS/unsafe URL tests.
- Docker/clean-clone/browser evidence.
- CI required checks, dependency audit và secret scan.

## 7. Dependency Contract

| Dependency | Cách sử dụng |
| --- | --- |
| P02 Identity/RBAC | Active session, role/capability, Admin governance |
| P03 Classroom/Enrollment | Teacher owner scope, active Student enrollment, roster |
| P04 Course/Module | Parent scope, effective visibility, structure revision |
| P04 Activity Reader | Mở rộng union bằng adapter, không sửa Lesson thành assessment |
| P04 Progress/To-do | Mở rộng activity type và metric version |
| P04 Deadline | Dùng server UTC/history semantics; thêm Student-specific override |
| P07 Storage | Deferred upload contract; không dùng local persistent disk |

## 8. Phase Boundary Rules

1. Không thêm report/export phức tạp chỉ vì đã có Grade.
2. Không lưu correct answer trong DTO Student, log, analytics hoặc HTML source.
3. Không tạo placeholder file upload dùng local container disk.
4. Không dùng Grade làm process score nếu P06 chưa chấp thuận công thức.
5. Không tạo placeholder Submission cho mọi Student; `ASSIGNED/MISSING` được derive.
6. Không sửa source record cũ khi regrade/resubmit; history phải kiểm chứng được.
7. Không cho Admin đọc private answer/feedback mặc định chỉ vì là Admin.

## 9. Definition Of Done

- Must deliverable có source, test và evidence.
- Runtime/OpenAPI route parity Pass.
- Attempt/submission/grade transaction và concurrent retry Pass.
- Cross-Student/Course/Teacher IDOR tests Pass.
- Objective scoring/reference implementation có golden fixtures.
- Browser critical journeys desktop/mobile Pass, không overlap hoặc mất dữ liệu.
- To-do/Deadline/Classwork regression của Lesson Pass.
- CI PR và post-merge main xanh, không Critical/High defect.
