# Assessment And Grading Rules

## Mục Đích

Tài liệu này quy định Quiz, Question, QuizAttempt, Assignment, Submission, Grade, Feedback, return work và private comment. Mục tiêu là điểm và trạng thái nộp bài luôn gắn đúng Student/assessment/Classroom, không bị double submit, không bị sửa im lặng và chỉ hiển thị cho đúng người.

## Rule Coverage

| Rule ID | Nội dung |
| --- | --- |
| BR-007 | QuizAttempt gắn Student/Quiz/Course/Classroom. |
| BR-031, BR-032 | Question Media optional nhưng subject to upload/access policy. |
| BR-083 đến BR-096 | Quiz publishing/attempt, scoring, Assignment/Submission, grade/feedback, regrade/override. |

## Assessment Scope And Visibility

| Condition | Quiz/Assignment behavior |
| --- | --- |
| Student `ACTIVE` + Enrollment `ACTIVE` + Content published/assigned | Student can view/start/submit only as policy allows. |
| Student not enrolled/inactive | No question/instruction/attempt/submission/grade access. |
| Teacher owner/authorized Course | Can create/publish/view all scoped result/grade. |
| Teacher outside Course scope | Cannot view Question detail, Student answer, Submission, score or grade. |
| Admin | Governance/override only with explicit permission and audit; not daily teaching actor. |
| Archived/closed assessment | No normal new attempt/submission; historical result/grade visibility follows policy. |

## Quiz Rules

### Quiz Publish

| Check | Required behavior |
| --- | --- |
| Teacher scope | Teacher owns/has management permission for Course/Classroom. |
| Basic data | Title/settings/status valid; Course/Classroom publish state allows it. |
| Question | At least one valid Question. Choice Question has required option/correct answer; points are non-negative. |
| Media | Optional image/video must pass storage/type/size/access rule; missing media never invalidates valid text Question. |
| Availability | `availableFrom`, `dueDate`, `timeLimitMinutes`, `attemptLimit`, result visibility policy must be valid if configured. |
| Publish side effect | Student visibility/To-do is created only after successful publish; AuditLog/event according policy. |

### Quiz Attempt State Model

```text
NOT_STARTED
  -> IN_PROGRESS       (Student starts valid attempt)
  -> SUBMITTED         (Student submits before expiry/policy)
  -> TIMED_OUT         (server reaches expiry and finalizes persisted answer state)
  -> NEEDS_REVIEW      (submitted attempt has manual-scored answer pending review)
  -> GRADED/RESULT_PUBLISHED as result policy applies
```

`SUBMITTED`, `TIMED_OUT` and final graded states are immutable for Student. Teacher regrade changes Grade/result record with history; it does not permit Student to edit an old attempt.

### Attempt Rules

| Rule | Expected behavior |
| --- | --- |
| Start | Backend verifies Student scope, Quiz published/available, time window and attempt count before creating attempt. |
| Identity | Attempt has exactly one Student, Quiz, Course, Classroom and sequential `attemptNumber`; no transfer/merge across scope. |
| Limit | `attemptNumber` cannot exceed `attemptLimit`; concurrent start must not create two next attempts. |
| Due date | If `dueDate` configured, MVP default denies new attempt after due time. Teacher may extend/reset availability through authorized content/deadline policy; no client-side clock override. |
| Time limit | If configured, `expiresAt` is calculated server-side from start/time policy. On expiry, system finalizes latest persisted answer state as `TIMED_OUT`; answer submit after expiry does not create a new valid attempt. |
| Submit retry | Same submitted attempt returns idempotent result or defined conflict; it never creates duplicate attempt/score. |
| Close/archive | New attempt denied after close/archive; historical result follows visibility policy. |

### Quiz Scoring And Result Visibility

| Assessment type | Rule |
| --- | --- |
| Objective Question | Backend auto-scores against stored correct answer/policy after valid submission or timeout finalization. |
| Short Answer/manual review | Attempt becomes `NEEDS_REVIEW` where manual score is required. It is not final score/process contribution until review policy completes. |
| Points/max score | Sum and score scale calculated backend; no client-provided total/score is trusted. |
| Result visibility | Student sees score/feedback only when Quiz result policy is `PUBLISHED`/returned. Immediate result is allowed only if Teacher setting permits. |
| Changed Question/scoring | Existing Attempt/score evidence preserved; authorized change triggers regrade/recalculation/version/audit rather than overwrite silently. |

## Assignment And Submission Rules

### Assignment Publish And Status

| Field/policy | Rule |
| --- | --- |
| Instruction/title/max score | Required and valid before publish; `0 <= score <= maxScore`. |
| Submission type | At least one allowed type explicitly configured: text, file, link or mark-done if feature enabled. |
| Due date | Must be explicit for Assignment in MVP; UI displays date/time/timezone. |
| Late submission | `allowLateSubmission` is explicit. Default policy must be visible before Student starts work. |
| Resubmit | `allowResubmit` explicit; it never bypasses closed status. |
| Close | Teacher can close when feature enabled; closed Assignment rejects new submit/resubmit. |

### Submission State Semantics

| State | Meaning | Student behavior | Teacher behavior |
| --- | --- | --- | --- |
| `ASSIGNED` | No valid submission yet. | Can submit if available. | See pending/missing when due passes. |
| `SUBMITTED` | Valid on-time submission exists. | May edit/unsubmit/resubmit only policy allows. | Review/grade/return. |
| `LATE` | Valid submission exists after due date. | May submit only if late allowed/open. | Review/grade/return, late label retained. |
| `MISSING` | Due passed, required work has no valid submission. | Can submit only if late allowed/open. | See support/reminder/close context. |
| `GRADED` | Teacher saved Grade, not necessarily visible to Student. | View depends result/return policy. | May update/regrade with audit. |
| `RETURNED` | Teacher releases work/result/feedback to Student. | Student sees Grade/Feedback; resubmit only policy allows. | Can regrade/return updated result. |

`MISSING` is derived from due/status, not a substitute for deletion. A late submission changes current outcome to `LATE` while retaining submission/history.

### Submit, Unsubmit And Resubmit

| Action | Preconditions | Result |
| --- | --- | --- |
| Submit | Active Student/enrollment, published/available Assignment, allowed type, data valid, before due or late allowed. | Create/update current Submission with server `submittedAt`, late flag/status. |
| Unsubmit | Feature/policy permits, Assignment not closed, result not locked by policy. | Current status returns to appropriate pending state; history/previous submittedAt retained. |
| Resubmit | `allowResubmit=true`, Assignment not closed, Student has current/returned submission as policy permits. | New revision/history recorded; latest valid revision becomes current. |
| Duplicate submit | Same request retried/double click. | Idempotent response or conflict; no multiple current submissions. |
| Submit after close | Assignment closed. | Reject `ASSIGNMENT_CLOSED`; no partial attachment/submission. |
| Submit after due, late disabled | Due passed and `allowLateSubmission=false`. | Reject/mark missing according policy; Student sees clear safe state. |

## Grade, Feedback And Return Work

| Action | Rule |
| --- | --- |
| Grade | Only Teacher owner/authorized actor can grade correct Student/assessment/submission; score range validated against max score. |
| Feedback | Optional unless Course policy requires it; when present, content is non-empty and private to relevant Student/Teacher scope. |
| Save grade | Can keep draft/internal state if workflow supports; Student does not see draft. |
| Return work/result | Makes Grade/Feedback visible to Student according result policy; `returnedAt` stored. |
| Regrade | Authorized Teacher changes grade/feedback with old/new safe audit/timestamp; progress/ranking/report recalculated if formula uses score. |
| Grade override | Admin/Super Admin only when explicit exceptional permission/purpose; reason/audit required. |
| Grade identity | Grade links Student, Classroom, Course, assessment and submission/attempt where applicable; no cross-scope reassignment. |

## Private Comment Rules

- Private comment belongs to one Student and one relevant Assignment/assessment context.
- The linked Student, Teacher scope owner and explicitly authorized staff can view it; other Student cannot see it in list, notification, export or API response.
- Comment text must not be copied into analytics event, public stream or broad Admin report by default.
- Deletion/edit follows retention/audit policy; it must not silently erase grade feedback evidence when record is required.

## Audit And Derived Data

| Action | Required impact |
| --- | --- |
| Quiz submit/timeout | Attempt status/time/score state persisted; To-do/progress update according completion rule. |
| Assignment submit/resubmit/unsubmit | Submission history/current status/late flag; To-do/missing state updated. |
| Grade/regrade/return | AuditLog, Student result visibility, summary/ranking/report recalculation if relevant. |
| Question/score policy change after attempt | Preserve historical evidence; evaluate regrade/rebuild/release communication. |
| Unauthorized access/grade | Deny before exposing answer/score; security/audit log per policy. |

## QA Checklist

- Test Quiz no Question/invalid options/media optional/attempt limit/concurrent retry/time expiry/result visibility/manual review.
- Test Student A cannot view or submit Student B attempt/submission; Teacher B cannot grade Teacher A Course.
- Test Assignment allowed type, due/late disabled/late enabled/closed/unsubmit/resubmit and duplicate submission.
- Test Grade min/max, draft vs returned visibility, feedback privacy, regrade/ranking/report update and audit.
- Test content/Question change after attempt preserves original record and prevents silent score corruption.

## Liên Kết

- Functional requirements: `../07-requirements/functional-requirements.md`.
- Data validation: `../10-data-requirements/data-validation-rules.md`.
- Reporting: `../16-reporting-analytics/metric-definitions.md`.
- Progress/deadline: `learning-progress-deadline-rules.md`.
