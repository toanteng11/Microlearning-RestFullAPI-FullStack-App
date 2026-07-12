# System Acceptance Criteria

## Mục Đích

System Acceptance xác nhận các module riêng lẻ hoạt động cùng nhau theo workflow LMS thật, dữ liệu nhất quán và hệ thống đủ điều kiện UAT/release. Đây là acceptance ở cấp hệ thống, không thay thế unit test hay API contract test.

## System Acceptance Baseline

| Group | System must demonstrate |
| --- | --- |
| Authentication and Access | Guest tự đăng ký chỉ được account `STUDENT`; registration không tạo session/Enrollment; account status, role, permission và object scope được enforce ở backend. |
| Teacher onboarding | Admin tạo/copy manual invitation, Teacher tự tạo password, token one-time/expiry/email matching, no auto-email dependency. |
| Classroom learning | Teacher tạo/điều hành Classroom/Course; Student join Code/Link, xem content scoped và học/nộp bài. |
| Progress and deadline | To-do, deadline, late/missing, completion, process score/ranking và reset deadline có history/recalculation. |
| Assessment | Quiz/Assignment/Submission/Grade/Feedback/private scope hoạt động end-to-end. |
| Administration | Role-specific user lists, account/status/ownership/policy/audit governance đúng. |
| Reporting | Dashboard/report/export đúng scope, metric definition/freshness, privacy/audit. |
| API/Data | Swagger, validation, error, pagination, idempotency, source/read-model/audit integrity. |
| Quality and Operations | Security/privacy, UI states/navigation, performance baseline, Docker/CI-CD/Cloud health/rollback evidence. |

## End-to-End System Acceptance Flows

### Flow SA-01: Teacher Onboarding To Classroom Delivery

```text
Admin creates/copies Teacher invitation link
  -> Admin manually sends via external channel
  -> Teacher activates account with matching email/password
  -> Teacher creates Classroom and Course
  -> Teacher creates/publishes Lesson with deadline and Quiz/Assignment
  -> Student joins Classroom and sees scoped To-do
```

Pass when every state transition is persisted/audited as required, no password/raw invitation token is exposed after use, and user sees correct role-specific dashboard.

### Flow SA-02: Student Learning To Teacher Feedback

```text
Student opens To-do
  -> Starts/completes Lesson
  -> Starts/submits Quiz or Assignment
  -> Late/missing status follows deadline policy
  -> Teacher sees roster/progress/submission
  -> Teacher grades/returns feedback
  -> Student sees own result only
  -> Teacher ranking/report updates where formula requires
```

Pass when retry/double click does not duplicate record; Student/Teacher outside scope cannot view data; grade/progress/audit/read-model outcomes agree.

### Flow SA-02A: Student Registration To Classroom Join

```text
Guest registers Student account
  -> System creates STUDENT/ACTIVE without session or Enrollment
  -> Student logs in
  -> System restores optional join context
  -> Student confirms Code/Link join
  -> System revalidates join credential and creates one Enrollment
```

Pass when role/status injection is impossible, Guest join API returns `401`, invalid Login creates no Enrollment, and successful Login plus valid join data produces exactly one Enrollment.

### Flow SA-03: Deadline Exception

```text
Teacher owner resets published Lesson deadline with reason
  -> old/new deadline history and AuditLog persist
  -> Student To-do/Calendar update
  -> late/missing/process/report summary recalculate
  -> original Progress/Submission/Attempt remain intact
```

Pass when non-owner/no reason/archived/invalid deadline cases are denied without partial write.

### Flow SA-04: Admin Governance And Release Readiness

```text
Admin opens role-specific user list
  -> performs authorized invitation/status/ownership/policy action
  -> AuditLog records safe event
  -> report/export respects scope
  -> Staging release passes health/version/role smoke
  -> release/rollback/backup evidence is available
```

Pass when self-escalation, sensitive-data exposure, cross-role list access and Teacher offboarding without transfer/archive are prevented.

## Cross-Cutting Acceptance Criteria

| Category | Must pass condition |
| --- | --- |
| Data integrity | No duplicate active Enrollment, QuizAttempt/submission mutation policy violation, missing history after deadline/grade change or ownership transfer. |
| Authorization | Negative API tests verify Student/Teacher/Admin cannot access resource outside current scope. |
| Error handling | Invalid input/state/dependency errors return standard safe response; UI has error/retry state where appropriate. |
| Audit | Required invitation, role/status, policy, deadline, grade/regrade, export actions have redacted append-only AuditLog. |
| Privacy | No password/hash/raw token/secret/full content appears in normal API response, UI, export or log evidence. |
| Performance | P95/list pagination/index target at least meets current NFR Staging baseline. |
| Usability | Student/Teacher/Admin P0 screens have loading/empty/error state and no dead-end navigation. |
| Deployment | Docker/CI-CD/Cloud health/version/HTTPS/CORS/SPA fallback/role smoke/rollback path verified. |

## System Acceptance Entry Criteria

- Functional Requirements, Business Rules and API/Data/UI documents relevant to release are baseline-reviewed.
- Build deployed to a stable UAT/Staging environment with test accounts/data and no known blocker preventing execution.
- Swagger/API contract and environment endpoints are available to QA/UAT team.
- Test data supports at least Student, Teacher, Admin, Super Admin (if in scope), multiple Classroom/Course and negative scope cases.
- Quality gate preconditions including health and no secret configuration issue are met.

## System Acceptance Exit Criteria

- All Must acceptance criteria in release scope pass with evidence.
- All Critical/High defects are fixed and retested, or a formal waiver has approved risk/mitigation/expiry.
- No unresolved security/privacy/data-loss issue exists.
- Product Owner/BA/QA/Technical Lead/DevOps complete relevant sign-off or documented conditional decision.
- Known limitations and Post-MVP/Should criteria are recorded in release note/backlog, not hidden as pass.

## Evidence Minimum

- Test execution ID, tester/date/environment/build/commit.
- Screenshot/video only where useful, API response/requestId, Swagger link, safe database/read-model/audit check.
- Health/version/CI-CD/monitoring/backup/rollback record for operations gate.
- Defect/retest/waiver reference and final sign-off record.

## Traceability

- Detailed criterion: `acceptance-criteria-catalog.md`.
- UAT: `uat-plan.md`, `uat-execution-and-signoff.md`.
- Business Rule baseline: `../17-business-rules/`.
- NFR gate: `../13-non-functional-requirements/nfr-quality-gates.md`.
