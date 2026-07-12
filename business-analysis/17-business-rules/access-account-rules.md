# Access And Account Rules

## Mục Đích

Tài liệu này đặc tả rule kiểm soát account, authentication, role, permission, object-level scope và ownership. Các rule này được áp dụng cho cả read và mutation API protected; không chỉ dùng để ẩn menu trên ReactJS.

## Rule Coverage

| Rule ID | Nội dung |
| --- | --- |
| BR-001, BR-003, BR-004 | Authentication và Classroom/Course scope. |
| BR-009, BR-015, BR-016 | Role management, blocked account, Teacher create Classroom. |
| BR-020 đến BR-024 | Account/ownership governance. |
| BR-036 đến BR-041 | Active account, no self-escalation, object-level access, safe denial, preserve learning history. |
| BR-097 đến BR-100 | System policy/role governance/offboarding. |

## Authorization Decision Rule

```text
Authenticated session/token valid?
  -> Account status ACTIVE?
      -> Required role/permission granted?
          -> Authorized scope/ownership/membership?
              -> System policy/resource status allows action?
                  -> Execute business action
```

| Check | Rule | Failure result |
| --- | --- | --- |
| Authentication | Token/session must map to a valid user context. | `401`/standard auth error; no private resource detail. |
| Account status | `ACTIVE` required for product/administrative API unless public entry flow explicitly allows Guest. | `403`/`ACCOUNT_NOT_ACTIVE`; revoke/deny session as security policy. |
| Role/permission | Permission must match action, not only page route. | `403 FORBIDDEN`; no mutation. |
| Object scope | Teacher ownership, Student enrollment/self data, Admin governance permission must cover resource. | `403` or safe `404`; no resource leakage. |
| System/resource policy | Join/content/export/deadline/archive policy must allow current action. | Domain error such as `JOIN_METHOD_DISABLED`, `CONTENT_NOT_AVAILABLE`. |
| Validation/business state | Input, transition and dependent data must be valid. | Standard validation/state conflict; no partial write. |

## Account Status Rules

| Status | Login | Product/administrative API | Allowed exception |
| --- | --- | --- | --- |
| `PENDING` | No normal login | No learning/admin action | Teacher Invitation validation/acceptance public entry only. |
| `ACTIVE` | Allowed | Allowed only by role, permission and scope | None; ACTIVE is necessary but never sufficient. |
| `INACTIVE` | Denied or restricted according auth policy | Denied | Authorized Admin restore/unblock process. |
| `BLOCKED` | Denied | Denied; current session must not continue business action | Authorized Admin/Super Admin unblock after review. |
| `DELETED` | Denied | Denied | Record retained for history/retention, no normal restore unless policy permits. |

### Status Transition Rules

| From | To | Actor/condition | Mandatory side effect |
| --- | --- | --- | --- |
| `PENDING` | `ACTIVE` | Valid Teacher invitation acceptance or approved provision flow | Assign intended role; consume invitation; AuditLog. |
| `ACTIVE` | `BLOCKED` | Authorized Admin/Super Admin with reason if policy requires | Revoke/deny active session as security policy; AuditLog; Teacher offboarding check. |
| `BLOCKED` | `ACTIVE` | Authorized Admin/Super Admin after review | AuditLog; do not restore permissions beyond current role. |
| `ACTIVE` | `INACTIVE` | Authorized administrative/offboarding flow | AuditLog; preserve learning/audit history. |
| `INACTIVE` | `ACTIVE` | Authorized restore | AuditLog; recheck role/ownership/policy. |
| Any non-deleted | `DELETED` | Approved soft-delete/retention process | Deny access; preserve linked learning/audit records. |

Status transition never changes role implicitly, except valid Teacher invitation acceptance which creates/activates the intended `TEACHER` account under BR-013/BR-045.

## Role And Permission Rules

| Actor | Baseline allowed scope | Baseline prohibited scope |
| --- | --- | --- |
| Student | Own profile, active enrollment, own progress/submission/grade/feedback | Other Student personal/learning data, content governance, grade, role/policy/audit operations. |
| Teacher | Classroom/Course owned or explicitly assigned, roster/progress/grade inside that scope | Other Teacher Classroom/Course, system role/policy, global audit/user governance. |
| Admin | User/invitation/policy/report/audit actions explicitly granted | Password/raw token/secrets; automatic unrestricted teaching/grading/content change without override permission. |
| Super Admin | Sensitive configuration/admin governance by explicit permission | Plain password/raw token/secret remains prohibited. |

### No Privilege Escalation

- User cannot set `role`, `permission`, `ownerTeacherId`, `status` or governance filter field from client request and assume it is honored.
- Admin cannot grant role/permission beyond their own delegated authority.
- Admin cannot promote themselves to `SUPER_ADMIN` or remove the final active Super Admin.
- Role/status update must target a valid allowed transition, preserve history and create audit record.
- Permission change must take effect through backend authorization context; frontend cached menu/route is not authoritative.

## Object-Level Access Rules

| Resource | Student rule | Teacher rule | Admin rule |
| --- | --- | --- | --- |
| Classroom/Course content | `Enrollment.ACTIVE` + content visible | Owner/explicit assignment | Governance permission; content mutation only override permission. |
| Progress/grade/submission | Self only | Student belongs to owned/authorized Classroom/Course | Governance/report permission only, with projection/purpose. |
| Quiz/Assignment | Assigned/published in enrolled scope | Owned/authorized Course | Override only when permission/purpose allows. |
| File/media | Resource access remains required at view/download time | Resource ownership/scope | Governance only; URL itself grants no right. |
| User record | Own profile only | No global user list | Role-specific list and permission/projection. |
| Audit/export | No default access | No global access | Explicit audit/report/export permission. |

## Classroom Ownership Rules

| Situation | Rule | Result |
| --- | --- | --- |
| Create Classroom | Actor is `TEACHER` + `ACTIVE`, policy permits. | `ownerTeacherId` is current Teacher; AuditLog creation if policy requires. |
| Update/archive/roster/content | Actor is owner or explicit co-management/override permission. | Proceed only inside Classroom/Course scope. |
| Transfer ownership | New owner is `TEACHER` + `ACTIVE`; transfer is authorized. | Atomic ownership update, AuditLog old/new owner, review active content/roster. |
| Block/offboard owner | Active owned Classroom exists. | Transfer ownership or archive before completion, except emergency override audited. |
| Ownership conflict | Invalid/missing/inactive new Teacher. | Reject with `INVALID_NEW_OWNER`; current owner unchanged. |

## Data Preservation Rules

- Blocking/deactivating/deleting a User must not delete linked Enrollment history, Submission, Grade, Feedback, Progress or AuditLog.
- User display in historical report may follow privacy policy (for example status/de-identified label), but referential integrity must remain.
- Removing a role does not silently rewrite historical action/audit actor role; audit records preserve context safely.
- Restoring account does not automatically restore Classroom ownership, Enrollment or permission that was separately removed.

## Error And Audit Rules

| Action | Audit requirement | Safe error direction |
| --- | --- | --- |
| Role/permission change | Must: actor, target, old/new safe values, reason if required, time/requestId | Do not reveal protected permission graph to unauthorized actor. |
| Account block/unblock/deactivate/restore | Must: actor, target, old/new status, reason if provided | No credential/detail leakage. |
| Ownership transfer | Must: actor, Classroom, old/new owner, reason/time | Reject before partial transfer. |
| Unauthorized resource request | Security/API log per policy; audit only for privileged/suspicious action | `403`/safe `404`, no data. |
| Login attempt while blocked/inactive | Auth/security log | Generic safe response according auth policy. |

## Implementation And QA Checklist

- Backend middleware resolves current account status and permission for every protected endpoint.
- Service layer verifies ownership/enrollment before repository/query result is returned or changed.
- Student A/Teacher A/Admin A negative tests cover ID guessing across Student, Classroom, Course, Submission, Grade, Report and File resource.
- Account status/role/ownership transitions are atomic enough to avoid a temporarily unauthorized state.
- Frontend route/menu is consistent with backend decision, but security test calls API directly.

## Liên Kết

- Permission matrix: `../05-user-roles/roles-permissions.md`.
- API authorization: `../11-api-requirements/api-authorization-matrix.md`.
- Security architecture: `../14-solution-architecture/security-architecture.md`.
- Governance/audit detail: `admin-data-audit-rules.md`.
