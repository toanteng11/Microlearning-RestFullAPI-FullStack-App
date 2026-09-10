# Part 06 - UAT Readiness and Data

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

Environment/data/persona checklist Pass, catalog expected results are frozen, candidate identity matches and `P08-EV-004..008` are available. External participants remain optional for the academic profile.
