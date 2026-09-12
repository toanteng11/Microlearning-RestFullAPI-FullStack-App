# Part 03 - System Test Automation

**Implementation status:** `DONE`.

## Outcome

The exact Staging candidate receives repeatable technical, integration and end-to-end regression coverage.

## Entry

- G0 Pass; HTTPS Staging healthy; synthetic accounts/data ready.
- Required CI on candidate commit is green.

## Tasks

1. Create the Phase 08 Playwright config and System Test suite from the source blueprint.
2. Reuse existing Phase 02-07 unit/integration/E2E tests; do not duplicate lower-level cases without value.
3. Exercise health/version/Swagger, auth/session, invitation, classroom/content, assessment/grading, analytics and operations P0 paths.
4. Include API negative checks for 401/403/404, invalid payloads, duplicate/retry and ownership boundaries.
5. Generate machine-readable results, traces on retry and a contract-valid System Test summary.
6. Run against the locked URL/revision and compare returned build identity.

## Required commands

`npm ci`, `npm run check:ci`, `npm run test:openapi`, relevant contract suites and the Phase 08 cloud/system workflow.

## Exit

All Must System Test rows Pass, Critical/High = 0, identity matches and `P08-EV-010/015/016` are stored. Blocked/Not Run is not G2 Pass.

## Actual execution

- Dedicated config: `playwright.phase-08.config.ts`; dedicated suite: `tests/e2e/phase-08-system.spec.ts`.
- Six Must scenarios passed: platform identity/OpenAPI; 401/422/404; RBAC/ownership/idempotent retry; Student P0; Teacher P0; Admin/SuperAdmin P0.
- Result: `6 PASS`, `0 FAIL`, `0 BLOCKED`, `0 NOT_RUN`, `0 WAIVED`, Critical/High findings `0`.
- Playwright emits JSON, JUnit and HTML; trace is retained on first retry with screenshot/video on failure.
- `P08-EV-010`: `system-test/system-test-summary.json` and raw Playwright reports.
- `P08-EV-015`: negative/RBAC/ownership/integrity rows in the System Test summary plus final redaction report.
- `P08-EV-016`: `security-performance/scan-summary.json`, Terraform/Trivy output and checksums; retention is 90 days.
- Live identity verification and stale-record reconciliation both pass for the locked candidate.
- GitHub workflow run: `34702722300` (`success`) on commit `8dc74d8b169c480c22be47fd58b4b530505f9e7c`.
- Release: `P08-RC-20260912-8dc74d8`; Staging revision: `microlearning-staging-00024-vzw`; immutable image digest: `sha256:43c2c73406bfabbba6a75bd37c8e618d6260820d118cb8d8ee72c9a36f130fa2`.
- Uploaded artifact: `phase-08-system-test-P08-RC-20260912-8dc74d8`, ID `10301290616`, digest `sha256:207c1526bcb92fadf3a0d739312a27756a19e92fe915e0bea02f72fa355d0851`, retention expiry `2026-12-11T15:36:07Z`.
- Machine-readable summary records 6/6 Must Pass, retry/flaky/Critical/High = 0, redaction reviewed and `P08-EV-010/015/016` present.

The remote completion condition is satisfied. A changed deployed commit, image or revision starts a new candidate at G0 and invalidates reuse of this G2 decision.
