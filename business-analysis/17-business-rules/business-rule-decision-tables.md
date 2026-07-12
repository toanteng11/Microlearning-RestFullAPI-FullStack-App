# Business Rule Decision Tables

## Mục Đích

Decision table diễn đạt rule nhiều điều kiện theo cách Dev và QA có thể triển khai/test trực tiếp. Các bảng dưới đây là tóm tắt quyết định; rule chi tiết vẫn nằm ở file domain tương ứng.

## 1. Protected Action Authorization

| Auth valid | Account ACTIVE | Permission | Scope/ownership | Policy/resource state | Decision |
| --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | Any | Deny authentication; no data. |
| Yes | No | Any | Any | Any | Deny account not active; no mutation. |
| Yes | Yes | No | Any | Any | Deny forbidden; no resource data. |
| Yes | Yes | Yes | No | Any | Deny scope/ownership; safe `403/404`. |
| Yes | Yes | Yes | Yes | No | Deny domain/policy/state conflict. |
| Yes | Yes | Yes | Yes | Yes | Validate input and execute; audit if required. |

Applies to Teacher content/deadline/grading, Student learning/submission, Admin governance/report/export, and file/media access.

## 2. Teacher Invitation Acceptance

| Token match | State PENDING | Not expired | Email match | Password valid | Account conflict | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | Any | Any | Reject safe invalid invitation. |
| Yes | No | Any | Any | Any | Any | Reject used/revoked/terminal invitation. |
| Yes | Yes | No | Any | Any | Any | Reject expired; mark/resolve EXPIRED. |
| Yes | Yes | Yes | No | Any | Any | Reject email mismatch; keep Pending if no abuse policy changes it. |
| Yes | Yes | Yes | Yes | No | Any | Validation error; keep Pending. |
| Yes | Yes | Yes | Yes | Yes | Yes | Reject conflict safely; no partial activation. |
| Yes | Yes | Yes | Yes | Yes | No | Atomically activate Teacher, hash password, mark invitation Accepted, audit. |

## 3. Classroom Join

| Student auth/ACTIVE | Global method enabled | Classroom enabled/active | Credential valid | Existing active enrollment | Historical removed/left | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | Any | Any | Require login/deny. |
| Yes | No | Any | Any | Any | Any | Deny `JOIN_METHOD_DISABLED`. |
| Yes | Yes | No | Any | Any | Any | Deny Classroom/method not joinable. |
| Yes | Yes | Yes | No | Any | Any | Deny invalid/expired/revoked code/link. |
| Yes | Yes | Yes | Yes | Yes | Any | Return duplicate/idempotent result; no new Enrollment. |
| Yes | Yes | Yes | Yes | No | Yes | Deny by default; Teacher/Admin phải mở quyền rejoin, sau đó Student gửi lại Class Code/Invite Link hợp lệ. |
| Yes | Yes | Yes | Yes | No | No | Create one active Enrollment, audit/event, update safe read models. |

## 4. Content Visibility

| Classroom/enrollment active | Content status | Student assigned/scope valid | Student can view/start? | Can create new Progress/Attempt/Submission? |
| --- | --- | --- | --- | --- |
| No | Any | Any | No | No |
| Yes | DRAFT/SCHEDULED before availability | Any | No | No |
| Yes | PUBLISHED | No | No unless content policy allows broad class view | No |
| Yes | PUBLISHED | Yes | Yes | Yes, per activity policy |
| Yes | UNPUBLISHED | Historical only per policy | No new activity | No |
| Any | ARCHIVED | Historical only per policy | No new activity | No |

## 5. Deadline Derived State

| Required | Deadline state | Valid completion/submission | Late allowed/open | Current result |
| --- | --- | --- | --- | --- |
| No | Any | Any | Any | Optional/non-blocking; no Course block by default. |
| Yes | No deadline | No | Any | Pending, no late/missing. |
| Yes | Before/equal deadline | No | Any | Pending or Due Soon. |
| Yes | Past deadline | No | Yes | Missing; may submit/complete late. |
| Yes | Past deadline | No | No/closed | Missing; no normal action. |
| Yes | Past deadline | Yes after deadline | Any | Completed/submitted late. |
| Yes | Any | Yes at/before deadline | Any | Completed/submitted on time. |

## 6. Deadline Reset

| Authorized actor | Lesson archived | Reason supplied | New deadline valid | Change type | Decision |
| --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | Any | Deny ownership/permission. |
| Yes | Yes | Any | Any | Any | Deny; restore/override required. |
| Yes | No | No | Any | Published/assigned | Deny `DEADLINE_REASON_REQUIRED`. |
| Yes | No | Yes | No | Any | Validation/exception denial; no partial change. |
| Yes | No | Yes | Yes | Extension | Persist history/audit; update deadline; recalculate affected To-do/status/summary. |
| Yes | No | Yes | Past/shortening exception | Exception policy approved | Persist reason/audit/communication review; recalculate. |

## 7. Assignment Submission

| Active scope | Assignment published/open | Submission type allowed | Before due | Late allowed | Resubmit allowed/current state | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | Any | Any | Deny. |
| Yes | No | Any | Any | Any | Any | Deny closed/unavailable. |
| Yes | Yes | No | Any | Any | Any | Validation deny. |
| Yes | Yes | Yes | Yes | Any | Initial/re-submit per policy | Accept on-time submission. |
| Yes | Yes | Yes | No | Yes | Initial/re-submit per policy | Accept and mark late. |
| Yes | Yes | Yes | No | No | Any | Deny late submit; remain/derive missing. |
| Yes | Yes | Yes | Any | Any | Resubmit not allowed/closed | Deny resubmit; preserve existing history. |

## 8. Teacher Offboarding

| Actor authorized | Teacher active Classrooms | Emergency security action | New active Teacher/Archive plan | Decision |
| --- | --- | --- | --- | --- |
| No | Any | Any | Any | Deny. |
| Yes | No | No | N/A | Block/deactivate; audit; preserve history. |
| Yes | Yes | No | No | Deny/require transfer or archive. |
| Yes | Yes | No | Yes | Transfer/archive then complete offboarding; audit all action. |
| Yes | Yes | Yes | Any | Immediate block allowed; audit/reason; mandatory follow-up transfer/archive. |

## 9. Sensitive Report Export

| Account/permission | Authorized scope | Filter/size valid | Export policy/reason | Current access at download | Decision |
| --- | --- | --- | --- | --- | --- |
| No | Any | Any | Any | Any | Deny. |
| Yes | No | Any | Any | Any | Deny no data. |
| Yes | Yes | No | Any | Any | Validate/limit deny; no job/file. |
| Yes | Yes | Yes | No | Any | Deny/request reason according policy. |
| Yes | Yes | Yes | Yes | No | Invalidate/deny download; regenerate only if current access restored. |
| Yes | Yes | Yes | Yes | Yes | Generate private expiring export and audit request/complete/download. |

## QA Usage

- Mỗi row `Deny` là một negative API test không chỉ UI test.
- Mỗi row `Execute/Accept` xác minh data mutation, side effect, audit and no duplicate.
- Nếu thêm policy/status mới, update affected decision table before implementation so ambiguous branch is resolved by Product Owner/Technical Lead.
