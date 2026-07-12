# Security And Privacy Acceptance

## Mục Đích

Tài liệu này xác định acceptance criteria cho authentication, authorization, token/invitation, data privacy, upload/media, audit và report/export. Đây là gate bắt buộc trước demo/release có dữ liệu thật hoặc Cloud environment.

## Security Acceptance Catalog

| ID | Given / When | Expected pass condition | Priority | Traceability |
| --- | --- | --- | --- | --- |
| SEC-AC-001 | Given password create/login/reset/invitation acceptance | Password is hash-only at rest; plain password never appears in API/log/audit/UI/Admin view. | Must | NFR-SEC-001, BR-010/014/102 |
| SEC-AC-002 | Given access/refresh/reset/invitation token operation | Expiry/revoke/one-time/hash policy enforced; raw token/link not persisted/logged. | Must | NFR-SEC-002/003/005, BR-012/044/046/047 |
| SEC-AC-003 | Given Student/Teacher/Admin protected API request | Backend verifies authenticated ACTIVE account, permission and object scope; hidden UI is not sole control. | Must | NFR-SEC-004, BR-036 to 040 |
| SEC-AC-004 | Given Student A requests Student B data/Teacher A requests Teacher B scope | API denies safely and returns no progress/submission/grade/report/media data. | Must | NFR-PRV-002/003, BR-039/040 |
| SEC-AC-005 | Given invitation email mismatch/expired/revoked/accepted token | Activation fails atomically and safely; no duplicate or partial Teacher account. | Must | BR-045 to 049 |
| SEC-AC-006 | Given malicious/invalid API input/query/filter | Validation/allowlist prevents invalid enum/ObjectId/operator/sort/pagination injection; error is standard/safe. | Must | NFR-SEC-006, data validation rules |
| SEC-AC-007 | Given registration/auth/invitation/join endpoint burst or repeated failed login | System returns controlled throttling/cooldown without account/token detail leak and without partial User/Enrollment creation. | Must | NFR-SEC-007 |
| SEC-AC-008 | Given invalid server exception/dependency failure | Production response has no stack trace, database URI, provider detail or secret; server log has requestId/safe context. | Must | NFR-SEC-008, NFR-LOG-002 |
| SEC-AC-009 | Given upload/view/download media | Type/size/ownership/access is validated; private object URL/key alone cannot bypass scope. | Must if upload/media | NFR-SEC-009, BR-025/103 |
| SEC-AC-010 | Given role/status/ownership/policy/deadline/grade/export action | Required append-only AuditLog exists with safe actor/resource/time/reason/value, no secret/raw token/full content. | Must | NFR-SEC-010, BR-101/102 |
| SEC-AC-011 | Given Admin/User/report API response | Projection excludes passwordHash/tokenHash/raw token/refresh token/secret/internal metadata not needed by UI. | Must | NFR-PRV-001/004 |
| SEC-AC-012 | Given report/export request/download | Role/object scope, private expiring delivery, re-authorization and audit prevent cross-scope data leak. | Must if export release | NFR-PRV-009, BR-105/108/109 |
| SEC-AC-013 | Given Staging/UAT data/evidence | Uses synthetic/sanitized data and does not expose Production secrets/backups/PII in artifact. | Must | NFR-PRV-006/007 |
| SEC-AC-014 | Given Browser login, refresh, logout, password reset or account block | Access JWT is absent from `localStorage`/`sessionStorage`; refresh token is opaque and has the required cookie attributes; rotation, session-family revoke, CORS allowlist and Origin/Referer controls are enforced. | Must | NFR-SEC-012, ADR-006, DEC-013 |
| SEC-AC-015 | Given password create/reset/login attempts | System enforces the 12-128 character boundary and leading/trailing-space rule, avoids account enumeration, and applies the configured rate-limit/cooldown. | Must | NFR-SEC-007/011, DEC-014 |

## Negative Authorization Matrix

| Actor | Attempt | Expected result |
| --- | --- | --- |
| Guest | Open private Course/Student dashboard/Submission by URL | Redirect/deny; no private data. |
| BLOCKED Student | Join/view/submit activity with old session | Deny all business action. |
| Student A | Read/update Student B progress/grade/submission/export | Deny safely. |
| Teacher A | View/grade/reset deadline in Teacher B Course | Deny safely. |
| Admin without delegated permission | Change Super Admin/role/policy or access sensitive audit/export | Deny and audit privileged attempt when policy requires. |
| Any User | Read file/object with copied URL outside current scope | Deny/expired controlled URL. |
| User | Manipulate `role`, `ownerTeacherId`, `studentId`, filter/sort in request | Backend ignores/denies unauthorized scope/escalation. |

## Privacy Acceptance Checks

- Student personal learning data, feedback and private comment never appear in other Student view, Teacher outside scope, aggregate chart too small or analytics event payload.
- Admin governance view uses minimal field projection and does not default to full content/answer/submission inspection.
- Teacher invitation raw link is shown only as needed to authorized Admin; manual external delivery is not tracked as proof of delivery.
- AuditLog/error/log/export/evidence are reviewed for password, token, secret, full file/content and PII leakage.
- Data deactivation/archive preserves official learning history but denies active access according role/status.

## Evidence

| Check | Suggested evidence |
| --- | --- |
| API authorization | Negative API response/status/requestId and no returned data. |
| Token/invitation | Safe database field/audit/log review, state transition result. |
| Upload/media | Valid/invalid upload, out-of-scope download denial, storage policy evidence. |
| Audit | Audit record ID/fields/redaction review. |
| Export | Job/access expiry/re-authorization/audit evidence. |
| Secret | Repository/CI/image/runtime config review without revealing secret value. |

## Exit Rule

Any fail in Must security/privacy acceptance is release-blocking until fixed and retested. It cannot receive ordinary business waiver; only a formal security risk decision by authorized authority could change scope, and production release remains blocked until mitigation is accepted.

## Liên Kết

- Security NFR: `../13-non-functional-requirements/security-requirements.md`, `../13-non-functional-requirements/privacy-compliance.md`.
- Business Rules: `../17-business-rules/access-account-rules.md`, `../17-business-rules/admin-data-audit-rules.md`.
- Architecture: `../14-solution-architecture/security-architecture.md`.
