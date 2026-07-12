# Learning Progress And Deadline Rules

## Mục Đích

Tài liệu này quy định cách hệ thống tạo Progress, Student To-do, Course completion, Process Score, ranking, deadline, late/missing và reset deadline. Đây là rule cốt lõi của LMS vì một sai lệch nhỏ có thể làm Student thấy sai việc cần làm hoặc Teacher đánh giá sai tiến độ.

## Rule Coverage

| Rule ID | Nội dung |
| --- | --- |
| BR-005, BR-006 | Học/completion chỉ trong scope hợp lệ và Course completion. |
| BR-029, BR-034, BR-035 | To-do, ranking default, deadline visibility. |
| BR-069 đến BR-082 | Progress source, To-do, late/missing, idempotency, score, deadline reset/recalculation/support indicator. |

## Progress Creation And Update

```text
Student action or system assessment event
  -> Student ACTIVE + Enrollment ACTIVE?
      -> Activity belongs to visible Classroom/Course scope?
          -> Activity completion/submission rule satisfied?
              -> write/update LearningProgress idempotently
              -> update To-do/summary/ranking as needed
              -> return authoritative result
```

| Rule | Expected behavior |
| --- | --- |
| Scope | Progress only belongs to one Student, Classroom, Course and activity identity; Student cannot create progress for another Student. |
| Visibility | Draft/unpublished/archived content or inactive Enrollment cannot create new normal Progress. |
| Idempotency | Repeated complete/save/submit request for same state does not duplicate record, count or score. |
| Timestamp | Store started/completed/submitted timestamps server-side or validate safely; client time is not trusted as final deadline evidence. |
| Source | Lesson/Flashcard/Resource/Quiz/Assignment use their own completion policy; opening a page is not automatically completion unless policy explicitly says so. |
| Rebuild | StudentTodoItem/CourseProgressSummary may be rebuilt from source progress/submission/attempt/grade/activity data. |

## Required Activity And Course Completion

| Concept | Rule |
| --- | --- |
| Required activity | Activity is included only when `isRequired=true` or Course policy marks it required for enrolled Student. |
| Baseline Course completion | All required Lesson and Quiz must satisfy completion policy, preserving BR-006. Required Assignment/Material/Flashcard also participate only when Course policy marks them required. |
| Score threshold | A minimum score/passing rule applies only when explicit Course policy exists; no implicit score threshold is assumed. |
| Optional activity | Can be shown in history/engagement but does not block Course completion by default. |
| No required activity | Progress percentage is `N/A` or policy-defined; system must not divide by zero or automatically claim completion without policy. |
| Course archive | Archive does not erase achieved completion; it prevents new activity unless restored/override. |

## Progress And Process Score

| Metric | Authoritative definition |
| --- | --- |
| `progressPercentage` | `(completed required activities / total required activities) * 100`, with `N/A` when denominator is zero. |
| `processScore` MVP default | `processScore = progressPercentage` as current MVP direction. |
| Future formula | May use configured completion/quiz/assignment weighting only after Product Owner/Technical Lead approves formula, effective date and recalculation strategy. |
| Ranking | Sort default `processScore DESC`; tie-break `progressPercentage DESC`, `lastActiveAt DESC`, then stable Student identifier ASC. |
| Calculation owner | Backend/service/report job only; ReactJS displays value and never defines competing formula. |
| Regrade/recalculation | Grade, required policy, deadline, enrollment or formula change triggers scoped summary/ranking recalculation as applicable. |

## Student To-do Rules

| To-do state | Inclusion rule | Student action |
| --- | --- | --- |
| Pending | Required/actionable activity visible in active enrollment and not completed/submitted according policy. | Open activity. |
| Due soon | Pending item whose deadline falls in configurable due-soon window. | Prioritize/open activity. |
| Missing | Required item past deadline without valid completion/submission. | Complete/submit only if activity late policy remains open; Teacher can support. |
| Late | Item completed/submitted after deadline. | Leaves main pending To-do but remains in history/report/late filter. |
| Completed/on time | Valid completion/submission at or before deadline, or no deadline. | Leaves main pending To-do; visible in history/progress. |
| Not applicable | Item hidden, archived, removed from scope or no longer assigned by authorized policy. | Removed from current To-do without deleting historical record. |

To-do item must carry safe title, activity type, Classroom/Course context, deadline/status/action link and freshness. Action link is validated server-side when Student opens activity.

## Deadline Model

| Activity | Deadline policy |
| --- | --- |
| Lesson | Every Lesson `PUBLISHED`/assigned to Student has `completionDeadline` in MVP, unless explicit Course policy exception is approved. |
| Assignment | Due date and late/resubmit/close policy must be explicit before publish. |
| Quiz | Due date is supported when configured; attempt/time/late policy determines availability after due date. |
| Required Material/Resource | Deadline only if it is actionable/required by Course policy; otherwise it is reference material. |
| Draft | May not have deadline until publish/assign. |
| Archived | Cannot receive normal deadline reset; restore/override required. |

All date comparison uses server-side UTC storage and organization/report display timezone policy. UI must show timezone/clear date-time context so Student and Teacher interpret due status identically.

## Late And Missing Decision Table

| Required? | Deadline | Current server time | Valid completion/submission | Late allowed/open? | Derived status |
| --- | --- | --- | --- | --- | --- |
| No | Any/none | Any | Any | N/A | Not blocking Course completion; may show activity history. |
| Yes | None | Any | No | N/A | Pending, no late/missing state. |
| Yes | Future | Before/equal deadline | No | N/A | Pending/Due Soon if window. |
| Yes | Passed | After deadline | No | Yes | Missing; Student may still complete/submit, result becomes Late. |
| Yes | Passed | After deadline | No | No/closed | Missing; action unavailable or contact Teacher. |
| Yes | Passed | After deadline | Yes, completed after deadline | N/A | Completed with Late flag/status. |
| Yes | Any | Any | Yes, completed at/before deadline | N/A | Completed on time. |

`MISSING` and `LATE` must not be confused: Missing means no valid work at evaluation time; Late means valid work exists after deadline. API/data model may store combined status or separate completion/due status, but report/UI must preserve this semantic.

## Reset Deadline Rules

### Preconditions

1. Actor is Teacher owner/authorized manager of Course or approved Admin override.
2. Lesson/Activity is not archived, unless restored/authorized exception.
3. New deadline is valid and within policy; original/current deadline and affected scope are resolved server-side.
4. For published/assigned Lesson, a non-empty reason is mandatory.
5. New deadline is normally current/future time. A past deadline correction requires explicit authorized exception, reason and audit.

### Mutation And Side Effects

```text
Validate actor + resource + new deadline + reason
  -> persist deadline history (old/new/actor/time/reason)
  -> update current deadline
  -> AuditLog deadline reset
  -> recalculate To-do, Calendar, late/missing, summary/ranking/report scope
  -> return new deadline + recalculation/freshness state
```

| Change | Default rule |
| --- | --- |
| Extend deadline | Allowed for Teacher scope; applies to affected active enrollments; late/missing recalculated. |
| Shorten deadline | Should be prevented after Student is affected; requires explicit override/communication review if policy permits. |
| Remove deadline from published required Lesson | Denied by MVP deadline rule; unpublish/archive/policy exception is required. |
| Reset after completion/submission | Preserve original activity timestamps and deadline history; derive new late/missing result from current approved deadline rule. |
| Reset archived Lesson | Denied until restore or authorized override. |
| Reset failure | No current deadline/history/To-do partial update; error/monitor/retry/rebuild path. |

## Students Needing Support

This is an assistance indicator, not a grade or judgment. It may be derived when configurable rule detects one or more: `MISSING` item, repeated `LATE`, progress under threshold, or no activity beyond threshold. The dashboard must show reason(s), scope/time and freshness; Teacher decides human intervention.

## Audit And Notifications

- Deadline reset requires AuditLog with actor, Lesson/Activity, old/new date, reason, time/requestId.
- In-app notification/reminder is `Should`; a notification failure never rolls back a successful deadline change, but failure must be observable/retryable if service exists.
- No automatic external email/Gmail notification is assumed in MVP.

## QA Checklist

- Test complete/retry/double click produces one Progress/To-do transition and correct ranking.
- Test required/optional/no-deadline, before/equal/after deadline, closed/late-allowed, and timezone boundary states.
- Test deadline extension/recalculation/history/audit and rejected non-owner/no-reason/past/archive/reset attempt.
- Test Course completion with all required, an optional incomplete, missing required, and explicit future score threshold policy.
- Test Student A cannot affect/view Student B progress; Teacher B cannot reset Teacher A Lesson.

## Liên Kết

- Deadline UI: `../12-ui-ux-requirements/lesson-deadline-management.md`.
- Data/read model: `../10-data-requirements/mongodb-data-model.md`, `../14-solution-architecture/data-architecture.md`.
- Reporting definitions: `../16-reporting-analytics/metric-definitions.md`.
- Assessment: `assessment-grading-rules.md`.
