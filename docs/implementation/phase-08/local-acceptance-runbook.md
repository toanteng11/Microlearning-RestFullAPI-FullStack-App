# Phase 08 - Local-Only Academic Acceptance

## Scope decision

On `2026-09-21`, the solo project owner changed the Phase 08 delivery target from a public Cloud Run
academic demo to a working **local application**. This is a scope change, not evidence that the previous
Cloud release succeeded. The locked Cloud candidate `P08-RC-20260916-8489623`, its G0-G2 results and
earlier infrastructure evidence remain historical records. G3-G8 of that Cloud track are **deferred**, not
`PASS`. No further Production Terraform Apply, secret-value creation, Cloud Run promotion or Cloud
Go/No-Go is required for the local-only deliverable.

The Production IAM/WIF resources already created are not removed by this change. Cleanup, billing and
retention review are separate owner decisions. Do not delete them implicitly while testing local mode.

## Local acceptance gates

| Gate | Required evidence | Pass rule |
| --- | --- | --- |
| L0 - Source | exact commit, clean checkout, CI result | source identity recorded; no uncommitted changes in final run |
| L1 - Quality | `npm run check` | lint, formatting, types, unit tests, contracts and build pass |
| L2 - Runtime | isolated Docker Compose + seeded synthetic data | MongoDB replica set, API `/ready`, Web `/health` and API commit identity pass |
| L3 - Browser | Phase 03/05/06 journeys plus Phase 08 local identity, negative and four-role tests | all selected tests pass, zero unexpected and zero flaky; JSON/JUnit/trace retained |
| L4 - Owner UAT | Student, Teacher, Admin, Super Admin sessions and defect log | expected/actual recorded for core tasks; no open Critical/High defect; owner signs off |

Only L0-L4 may establish `LOCAL_ACADEMIC_ACCEPTANCE`. This is **not** a public deployment or
organization-grade Production claim. Local URLs bind to loopback, use synthetic data and are accessible
only on the owner's machine unless the owner deliberately changes network exposure.

## Automated run

From a clean checkout with Docker Desktop running and Chromium installed:

```powershell
npm ci
npx playwright install chromium
npm run phase-08:local:accept
```

The command checks Docker availability, runs the full quality gate, builds an isolated Compose project, waits for Web/API readiness,
seeds deterministic demo accounts with a random in-memory password, runs the local Phase 03/05/06/08 browser
journeys and removes only its own temporary containers and volume. It does not stop or reset the normal
`microlearning-local` stack. The default temporary host ports are `3300` (Web), `4300` (API) and `27019`
(MongoDB). Override with `PHASE08_LOCAL_WEB_PORT`, `PHASE08_LOCAL_API_PORT` and
`PHASE08_LOCAL_MONGO_PORT` if those ports are in use.

The ignored `artifacts/phase-08/local-acceptance/<run-id>/` folder contains `summary.json`, Playwright
JSON/JUnit and failure diagnostics. A final automated pass requires `summary.status=PASS`,
`sourceDirty=false`, all checks `PASS`, `playwright.expected>0`, `unexpected=0` and `flaky=0`. Do not
publish raw reports without redaction review. The random password is not written to the summary or
repository.

## Manual owner UAT

The automated run uses a temporary database and cleans it after testing. For interactive review use the
normal local stack at `http://localhost:3000` and `http://localhost:4000`, with your own local demo seed
password. In separate browser sessions, verify:

1. Student: sign in, join/view classroom, open lesson, submit assessment, inspect result and progress.
2. Teacher: sign in, manage classroom/content, review submissions, grade and inspect gradebook/report.
3. Admin: sign in, manage users/invitations and inspect governance/reporting without Teacher ownership.
4. Super Admin: sign in and verify the elevated administrative actions in the selected local scope.
5. Negative paths: unauthenticated request (`401`), forbidden role/ownership (`403` or deliberate `404`),
   invalid payload (`422`), duplicate/retry without duplicate membership or submission.

Record each scenario's expected result, actual result, persona, UTC time and screenshot/API evidence.
Log every mismatch and retest after fixing it. A single-person project may sign as PO/QA/Technical Lead
with `soloProject=true` and `independentReview=false`; never claim an independent approval.

## Cloud workflow policy

The main-branch CI remains automatic. Build/publish, Staging deploy and Cloud E2E no longer trigger
automatically after CI or one another; their guarded `workflow_dispatch` paths remain available for an
explicit future scope change. Phase 08 Production promotion remains guarded and is not part of the local
acceptance route.

The existing integrated browser CI job enables `E2E_PHASE08_LOCAL_MODE` and runs the six local Phase 08
cases alongside the earlier critical journeys. A green CI check verifies that runner's seeded stack; it
does not substitute for a successful `summary.json` from the owner's own local acceptance run or L4 UAT.
