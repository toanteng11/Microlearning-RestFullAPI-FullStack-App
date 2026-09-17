# Part 12 - Training, Support and Communications

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`

## Outcome

Intended users know how to access the release and the owner can support, diagnose and recover it.

## Entry

- Production smoke Pass; known issues are current.

## Tasks

1. Update user guidance for Student, Teacher, Admin and Super Admin in release scope.
2. Document login/demo-account handling without publishing passwords in the repository.
3. Prepare operator guidance for deploy, health/version, logs, alerts, secret rotation, backup/restore and rollback.
4. Publish release note with actual version, included/excluded scope, known issues and support contact.
5. Record communication audience/channel/time and acknowledgement where applicable.
6. Confirm ownership and response expectations for the academic demo; do not claim organizational support coverage.

## Exit

Training/support/comms artifacts are reviewed, redacted and linked to `P08-EV-044`. Every known issue has workaround/owner/target or blocks G8.

## Implemented tooling

- `phase-08:handover:record:validate` requires acknowledgement for Student, Teacher, Admin, Super Admin/Operations and Support materials, plus six operational capabilities from release identity through rollback escalation.
- The handover record requires actual release/support communications, a named bounded academic-demo support window and tracks every known issue with a workaround, owner and UTC target.
- It rejects a claimed 24/7 organizational SLA, unresolved Critical/High known issues, placeholders and secret-like fields.

The code is locally verified. Part 12 becomes `DONE` only when the actual material acknowledgements and communications are attached to `P08-EV-044`.
