# Admin Data And Audit Rules

## Mục Đích

Tài liệu này quy định governance rules cho Admin/Super Admin: user list theo role, invitation/account lifecycle, system policy, Classroom ownership/offboarding, data retention, file access và AuditLog. Admin có quyền vận hành nhưng không được trở thành “bypass” không kiểm soát cho privacy hoặc lịch sử học tập.

## Rule Coverage

| Rule ID | Nội dung |
| --- | --- |
| BR-009, BR-020 đến BR-028 | Role, account/ownership, system setting, AuditLog. |
| BR-041, BR-097 đến BR-104 | Retention, policy precedence, self-escalation, offboarding, audit/file/settings. |
| BR-105 đến BR-109 | Report/export governance liên quan. |

## Admin User Management Rules

| List | Default data scope | Allowed actions |
| --- | --- | --- |
| Student List | Only `role=STUDENT`; projection needed for support/governance. | View detail by permission, block/unblock/deactivate/restore, authorized enrollment support. |
| Teacher List | Only `role=TEACHER`; invitation/classroom management summary where authorized. | Create/copy/revoke invitation, block/offboard, transfer ownership process. |
| Admin List | Only `ADMIN`/`SUPER_ADMIN`; high sensitivity. | View/manage only delegated permission; self-escalation/final Super Admin protection. |

Admin list/filter/sort/export runs server-side with role/permission/projection. A global “All Users” search, if later enabled, still must not expose fields/actions outside the caller delegated authority.

## System Policy Precedence

```text
Security/compliance and global system policy
        > role/permission and account status
        > Classroom/Course/Assessment setting
        > individual resource setting
        > UI preference/local browser state
```

| Policy area | Global policy examples | Resource-level result |
| --- | --- | --- |
| Classroom join | Enable/disable Class Code và Invite Link; enrollment restriction. | Teacher cannot enable disabled global method. |
| File/media | Type/size/scan/private storage policy. | Course/Question cannot attach disallowed file. |
| Security | Password/token/session/rate-limit/CORS policy. | Feature setting cannot weaken global security. |
| Reporting/export | Export enablement, format/row limit/retention. | Teacher export remains bounded by global policy. |
| Notification | In-app/optional channel policy. | Classroom preference cannot force unavailable external provider. |

Policy change must validate value/scope/effective time, apply atomically or reject, and store safe old/new metadata in AuditLog. A policy update must not expose raw secret or cause partial inconsistent join/export behavior.

## Role And Permission Governance

- Only Super Admin or Admin with delegated role-management permission can change sensitive role/permission.
- Admin cannot grant a permission/role outside their delegated authority, promote self, or remove the last active Super Admin.
- Role change does not bypass account `ACTIVE` requirement, ownership/membership rules or system policy.
- Sensitive role/status/permission actions require target/actor validation, optional reason by policy, AuditLog and immediate server-side enforcement.
- Admin cannot see/reset a User password, raw access/refresh token, raw invitation token, database/storage credential or secret through governance feature.

## Teacher Offboarding And Ownership Transfer

| Situation | Required decision |
| --- | --- |
| Teacher has no active Classroom | Admin may block/deactivate by permission; preserve history/audit. |
| Teacher has active Classroom | Transfer each Classroom to active Teacher or archive it before ordinary offboarding. |
| New owner invalid/inactive/not Teacher | Reject transfer; current ownership unchanged. |
| Emergency block/security incident | Authorized override may block immediately; AuditLog/reason; follow-up transfer/archive task required. |
| Transfer complete | Update owner atomically; record old/new owner, actor/time/reason; new owner gets future management, historical audit preserved. |

Admin transfer does not move Student Submission/Grade identity to new Teacher or alter Course completion. It changes management scope only.

## Data Retention And Deletion Rules

| Resource | Default action | Prohibited/controlled behavior |
| --- | --- | --- |
| User with learning history | `INACTIVE`, `BLOCKED` or soft `DELETED`. | No normal hard delete of linked progress/submission/grade/audit. |
| Classroom/Course with activity | Archive/unpublish. | No hard delete that breaks referenced record. |
| Lesson/Quiz/Assignment with attempt/submission | Archive/version/protected change. | No silent delete/correct-answer overwrite. |
| Teacher Invitation | Preserve terminal state history for audit. | Do not retain raw token. |
| AuditLog | Append-only, retention controlled. | User/Admin normal update/delete endpoint prohibited. |
| Export/snapshot | Private TTL and cleanup. | No public permanent data dump. |

Any exceptional hard delete/anonymization is outside MVP and needs approved retention/legal/security process, backup/impact assessment and audit.

## Audit Log Rules

### Required Events

| Event group | Examples of action |
| --- | --- |
| Invitation | Create, copy when tracking enabled, revoke, accept. |
| Account/role | Block/unblock/deactivate/restore, role/permission assign/revoke. |
| Classroom governance | Ownership transfer, archive/lock, enrollment governance exception. |
| System policy | Join/file/notification/security/report policy update. |
| Content/learning impact | Publish/unpublish/archive where policy requires, deadline reset, grade/regrade/return, exceptional override. |
| Reporting/export | Sensitive report/export request/complete/download per policy. |
| Operations | Security/deployment/backup action according DevOps policy. |

### Audit Record Minimum

```text
actorId / actorRole
action
resourceType / resourceId
timestamp / requestId
safe oldValue / newValue when applicable
reason when rule requires
result/status
```

AuditLog must exclude plain password, raw token/link/code, secret/env value, full file/submission content and stack trace. Audit log is not a substitute for application error log or analytics event.

## File And Media Governance

- System file policy has priority over Teacher resource preference.
- File/media object is private; access is checked against current role/ownership/enrollment at download/view time.
- Admin governance access to file is not blanket public access; it requires permission and support/governance purpose.
- Cleanup/orphan removal must not break referenced Question Media, Submission attachment or LearningResource; age/reference/owner is checked and action audited when required.

## Error And Recovery Rules

| Failed operation | Required result |
| --- | --- |
| Role/status/ownership validation fails | No partial update; current authorization preserved. |
| Policy change fails validation/apply | No partially enabled join/file/report policy; error recorded safely. |
| Audit write fails during critical mutation | Follow Technical Lead policy: fail closed for high-risk governance action or queue/retry with monitored guarantee; never silently lose audit. |
| Soft delete/archive | Historical report/read model may be recalculated or show historical label; referential links remain. |
| Export cleanup fails | File remains private, alert/incident action; never make file public to simplify access. |

## QA Checklist

- Test each Admin role list returns only correct role/projection/action.
- Test Admin self-escalation/final Super Admin removal/delegated-permission violation denial.
- Test Teacher offboarding with/without active Classroom, valid/invalid ownership transfer and emergency override audit.
- Test policy precedence: global join/file/export disable overrides Classroom/Teacher setting.
- Test AuditLog presence/immutability/redaction for all required event groups.
- Test soft delete/archive preserves Student progress, Grade, Submission and report integrity.

## Liên Kết

- Roles: `../05-user-roles/roles-permissions.md`.
- Data retention: `../10-data-requirements/data-retention-privacy.md`.
- Logging/audit: `../13-non-functional-requirements/logging-monitoring.md`.
- Reporting/export: `reporting-export-rules.md`.
