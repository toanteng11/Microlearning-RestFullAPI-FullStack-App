# Part 11 - Cloud Smoke And E2E

## Goal

Xác minh exact Staging revision trên HTTPS cho routing, auth/security và critical journeys của bốn role.

## Parent PR

`P07-PR05 - Cloud Smoke And Role Journeys`

## Dependencies

- Part 10 automated Staging deploy Pass.
- Synthetic role identities seeded securely.

## Work

1. create Cloud test config from deployment record;
2. implement health/ready/version/routing/Swagger checks;
3. verify HTTPS, cookies, proxy, CORS, headers, rate limit;
4. implement Student critical journey;
5. implement Teacher critical journey;
6. implement Admin and Super Admin boundaries/journeys;
7. implement negative auth/RBAC/ownership/concurrency tests;
8. use unique run ID and guarded cleanup;
9. configure Playwright traces/screenshots redaction/retention;
10. publish JUnit/HTML summary with digest/revision;
11. manage flakes without retrying business assertions blindly;
12. integrate as Staging stable gate.

## Validation

- TC-044..057 Pass;
- all four roles complete intended workflows;
- wrong role/resource access denied;
- API `404`/SPA deep links correct;
- no real data/secret in artifacts.

## Evidence

`P07-EV-020..025`, API/Playwright reports and workflow URL.

## Stop Conditions

- any Critical journey skipped/flaky unresolved;
- cleanup can target non-Staging data;
- credentials hard-coded or shown in artifacts;
- auth/RBAC/ownership mismatch.

## Definition Of Done

- AC-045..052 Pass;
- P07-PR05 merged and latest automated Staging cloud suite Pass.
