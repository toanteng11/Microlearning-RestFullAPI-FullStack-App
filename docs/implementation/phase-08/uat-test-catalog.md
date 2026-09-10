# Phase 08 — UAT Test Catalog

Every row requires UAT Run ID, exact candidate identity, actor, synthetic data IDs, expected/actual, evidence path, UTC tester and defect/retest reference. Initial status is `PENDING`.

| ID | Scenario/actor | Expected outcome | Priority | Status |
|---|---|---|---|---|
| P08-UT-001 | Guest register Student | `STUDENT/ACTIVE`, no session/Enrollment | Must | `PENDING` |
| P08-UT-002 | Login/landing for four roles | role/status access correct | Must | `PENDING` |
| P08-UT-003 | Admin manual Teacher invitation | one-time/expiry/email match, no raw token | Must | `PENDING` |
| P08-UT-004 | Invitation expired/revoked/reuse | safe denial, no partial account | Must | `PENDING` |
| P08-UT-005 | Teacher Classroom/Course | owner/scope/status correct | Must | `PENDING` |
| P08-UT-006 | Student Class Code join | one Enrollment, roster/audit correct | Must | `PENDING` |
| P08-UT-007 | Invite Link join | scope/expiry/disabled/duplicate enforced | Must | `PENDING` |
| P08-UT-008 | Content lifecycle | draft/published/archived visibility | Must | `PENDING` |
| P08-UT-009 | Lesson completion | idempotent progress/To-do | Must | `PENDING` |
| P08-UT-010 | To-do/deadline | pending/completed/late/missing policy | Must | `PENDING` |
| P08-UT-011 | Quiz attempt/retry | score/status and no duplicate | Must | `PENDING` |
| P08-UT-012 | Assignment submit | on-time/late/closed/link policy | Must | `PENDING` |
| P08-UT-013 | Grade/return/regrade | range, visibility, summary/audit | Must | `PENDING` |
| P08-UT-014 | Cross-scope assessment | unauthorized data denied | Must | `PENDING` |
| P08-UT-015 | Deadline reset | history and downstream recalculation | Must | `PENDING` |
| P08-UT-016 | Deadline reset denial | no owner/reason/invalid partial write | Must | `PENDING` |
| P08-UT-017 | Required/optional completion | policy gates correct | Must | `PENDING` |
| P08-UT-018 | Teacher dashboard/ranking | owned data, score/tie/pagination | Must | `PENDING` |
| P08-UT-019 | Admin user/status | role-specific action and policy | Must | `PENDING` |
| P08-UT-020 | Teacher offboarding | transfer/archive prerequisite, history | Must | `PENDING` |
| P08-UT-021 | Report/filter/export | freshness/scope/permission | Must | `PENDING` |
| P08-UT-022 | AuditLog | safe append-only required events | Must | `PENDING` |
| P08-UT-023 | API validation/idempotency | standard error/no duplicate/partial write | Must | `PENDING` |
| P08-UT-024 | Swagger/OpenAPI | same-origin contract/auth policy | Must | `PENDING` |
| P08-UT-025 | Browser session security | cookie/rotation/revocation | Must | `PENDING` |
| P08-UT-026 | Password/cooldown | boundaries/no enumeration/cooldown | Must | `PENDING` |
| P08-UT-027 | Conditional media/link | disabled or approved policy | Conditional | `PENDING` |
| P08-UT-028 | Cloud health/version | exact commit/digest/revision | Must | `PENDING` |
| P08-UT-029 | Four-role cloud journeys | Student/Teacher/Admin/Super Admin | Must | `PENDING` |
| P08-UT-030 | Negative auth/RBAC/ownership | correct denial/no leak | Must | `PENDING` |
| P08-UT-031 | Deployment/observability | safe logs, dashboard/alert route | Must | `PENDING` |
| P08-UT-032 | Backup/restore/rollback review | approved recovery evidence | Must | `PENDING` |

## Execution record

```text
UAT Run ID / Scenario ID: <PENDING>
Release / commit / image digest / revision / URL: <PENDING>
Actor / synthetic data: <PENDING>
Preconditions and steps: <PENDING>
Expected / actual: <PENDING>
Evidence filename(s): <PENDING>
Status: PASS | FAIL | BLOCKED | NOT RUN | WAIVED | APPROVED_NA
Defect/CR/retest / tester / UTC: <PENDING>
```
