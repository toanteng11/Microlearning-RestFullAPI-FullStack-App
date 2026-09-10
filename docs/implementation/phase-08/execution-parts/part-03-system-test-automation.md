# Part 03 - System Test Automation

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
