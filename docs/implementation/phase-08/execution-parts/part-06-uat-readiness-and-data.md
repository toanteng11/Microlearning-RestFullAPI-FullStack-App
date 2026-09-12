# Part 06 - UAT Readiness and Data

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`

## Outcome

Role-based UAT can run safely and reproducibly on the locked candidate.

## Entry

- G0 Pass; System Test has no known Critical blocker.

## Tasks

1. Provision synthetic Student A/B, Teacher A/B, Admin and Super Admin when in scope.
2. Create separate classrooms/courses, draft/published content, due/late items, submissions, grades and analytics fixtures.
3. Prepare pending/expired/revoked/accepted invitations and valid/invalid join paths.
4. Assign scenario groups 001-032 to the owner acting as explicit personas.
5. Confirm evidence path, capture rules, cleanup IDs and defect template.
6. Verify each account can log in only with its expected role and no credential appears in evidence.

## Exit

Environment/data/persona checklist Pass, catalog expected results are frozen, candidate identity matches and `P08-EV-003` validates. External participants remain optional for the academic profile.

## Implemented controls

- `phase-08-uat.spec.ts` runs the seven catalog groups in isolated browser contexts and emits one machine-readable row for every `P08-UT-001..032` scenario.
- The readiness builder requires all eight synthetic personas, separate contexts, exact release identity, UTC timestamps and a defect record for every non-passing row.
- Credentials, raw tokens and real PII are prohibited from the evidence bundle and remain covered by the final redaction scan.
- Readiness becomes `DONE` only after the implementation PR is on `main` and the exact-candidate workflow produces validated `P08-EV-003`; local tooling alone is not execution evidence.
