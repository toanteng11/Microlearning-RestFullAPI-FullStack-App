# UI And UX Acceptance

## Mục Đích

UI/UX acceptance xác nhận người dùng hoàn thành workflow chính một cách rõ ràng, nhất quán và không bị lạc/ngắt ngữ cảnh. UI test không thay thế backend authorization, nhưng phải phản ánh đúng permission/state/error từ API.

## Shared UI Acceptance

| ID | Given / When | Expected pass condition | Priority |
| --- | --- | --- | --- |
| UI-AC-001 | Given any P0 page loads data | Loading state appears without layout break; data state replaces it predictably. | Must |
| UI-AC-002 | Given valid query with no data | Empty state explains absence and provides safe next action; no false error/blank screen. | Must |
| UI-AC-003 | Given API/network/domain error | Safe error state and retry/back action appear; no stack trace/secret/internal detail. | Must |
| UI-AC-004 | Given role/status/permission changes | Navigation/action visibility follows current backend context; hidden UI does not create broken/dead-end experience. | Must |
| UI-AC-005 | Given form mutation | Required field, validation, pending/submitting, success and failure feedback are visible; double click does not create confusing duplicate state. | Must |
| UI-AC-006 | Given table/list large data | Server pagination/filter/sort state visible and stable; no client-side all-data load. | Must |
| UI-AC-007 | Given status/deadline/grade indicator | Meaning not communicated by color alone; label/text/tooltip gives clear status. | Must |
| UI-AC-008 | Given keyboard form/navigation | Focus order, label, error text and primary controls are usable at baseline accessibility level. | Should |

## Student Flow Acceptance

| ID | Scenario | Expected pass condition | Priority |
| --- | --- | --- | --- |
| UI-STU-001 | Student Dashboard | Classroom, To-do, upcoming deadline, progress/feedback sections reflect scoped data with loading/empty/error state. | Must |
| UI-STU-002 | To-do item | Shows title/type/Classroom/Course/deadline/status/action; completed/late/missing state understandable. | Must |
| UI-STU-003 | Join Code/Link | Clear entry/validation/login-required/policy-disabled/duplicate result; no raw token/code leakage in UI history. | Must |
| UI-STU-004 | Lesson/Quiz/Assignment | Student can understand availability, deadline, progress/submission state, required action and safe failure/retry. | Must |
| UI-STU-005 | Grade/Feedback | Student sees only released own result; draft/other Student data absent. | Must |
| UI-STU-006 | Navigation | Back/Previous/Next/breadcrumb/return-To-do preserve safe context and warn before losing unsaved work. | Must |

## Teacher Flow Acceptance

| ID | Scenario | Expected pass condition | Priority |
| --- | --- | --- |
| UI-TEA-001 | Course Dashboard | Activity list, roster, deadline and ranking display owned Course scope; filter/sort/pagination clear. | Must |
| UI-TEA-002 | Content publish | Draft/publish/archive states and prerequisite validation are visible; Student visibility is not claimed before API success. | Must |
| UI-TEA-003 | Deadline reset | Current/new deadline, required reason, affected scope, confirmation/success/error/history feedback clear. | Must |
| UI-TEA-004 | Quiz Question Media | Media optional, preview/removal/upload validation clear; text Question remains usable without media. | Should |
| UI-TEA-005 | Submission/grading | Submitted/late/missing/graded/returned state clear; score boundary/feedback/return action feedback clear. | Must |
| UI-TEA-006 | Progress ranking | Default Process Score DESC and tie behavior/filter/freshness communicated; “needs support” shows reason, not judgment label. | Must |

## Admin Flow Acceptance

| ID | Scenario | Expected pass condition | Priority |
| --- | --- | --- |
| UI-ADM-001 | User management | Student/Teacher/Admin List separated; search/filter/pagination/action follow delegated permissions. | Must |
| UI-ADM-002 | Teacher invitation | Create/copy/manual distribution explanation, expiry/revoke/result state clear; no password/raw token retained in list. | Must |
| UI-ADM-003 | Sensitive action | Block, role, ownership, policy/export action uses confirmation/reason where required and displays safe outcome/Audit reference. | Must |
| UI-ADM-004 | Report/export | Scope/filter/freshness/job status/expiry/error clearly shown; no unauthorized export button/action success. | Should |

## Responsive And Accessibility Acceptance

- Student core flow Dashboard -> To-do -> Lesson/Quiz/Assignment -> submission/result is usable on target desktop and mobile viewport.
- Text, table/filter/action, date/deadline/status and form error do not overlap or truncate critical meaning at supported viewport.
- Icon-only controls have accessible label/tooltip where needed; familiar navigation controls remain understandable.
- Modal/confirmation traps focus appropriately and can close safely; destructive/important actions require explicit action.
- Image/video Question Media has meaningful `altText`/caption where available; media failure has fallback text/state.

## UI Evidence

- Screenshot/video per role and viewport only when it documents behavior; do not include secret/PII/private content unnecessarily.
- Browser console/network test confirms no critical front-end error, broken API base URL/CORS/mixed content issue in UAT environment.
- UI result is paired with API/data evidence for mutation/security-sensitive flow.

## Liên Kết

- UI requirements: `../12-ui-ux-requirements/`.
- Navigation: `../12-ui-ux-requirements/navigation-controls.md`.
- Accessibility NFR: `../13-non-functional-requirements/usability-accessibility.md`.
