# Part 11 - Cloud Smoke And E2E

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING` ngày `2026-08-17`. Cloud verifier, four-role Playwright suite, promotion contract
và artifact-redaction gate đã Pass lint/type/list local; actual Staging execution vẫn Pending.

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

## Implemented Source

- `.github/workflows/cloud-e2e.yml` chỉ nhận exact successful `Deploy Staging` artifact, kiểm tra candidate
  lineage rồi checkout đúng deployed commit;
- dedicated `ml-e2e-staging` WIF identity chỉ được đọc exact synthetic password secret, không có quyền đọc
  MongoDB URI hay application secrets;
- `scripts/verify-cloud-security.mjs` kiểm tra HTTPS, health/ready, release identity, SPA/deep links, API
  `404`, Swagger/OpenAPI, headers, CORS và rate-limit qua proxy;
- `tests/e2e/phase-07-cloud-roles.spec.ts` chứa bốn journey độc lập cho Student, Teacher, Admin và Super Admin,
  đồng thời kiểm tra secure cookie, no persistent token, logout, `401/403/404`, ownership và concurrent
  session/read;
- `playwright.cloud.config.ts` khóa một worker, không retry business assertion, không trace/video và chỉ chụp
  screenshot khi fail;
- `scripts/promote-stable-deployment.mjs` chỉ đổi candidate thành `PASS/STABLE` khi cloud report và role
  report cùng khớp commit, digest và revision;
- `scripts/scan-e2e-artifacts.mjs` chặn password canary, MongoDB URI, bearer JWT, private key và credential file
  trước khi upload artifact.

## Test Scope Decision

Cloud suite dùng fixture synthetic idempotent và các journey read-only đại diện để rerun an toàn trên shared
Staging. Full mutation workflows như tạo Quiz/Assignment, submit, regrade và deadline exception tiếp tục là
required CI browser gates; không lặp lại mutation không cleanup trên persistent Atlas Staging. Việc mở rộng
Cloud mutation suite chỉ hợp lệ khi có run-scoped fixture và guarded cleanup API.

## Remote Completion Gates

- Cloud security report Pass trên exact candidate URL;
- đủ bốn Playwright tests Pass và không retry che lỗi;
- artifact redaction report có `0` finding;
- stable deployment record khớp exact commit/digest/revision;
- workflow URL/artifact URL được ghi vào `evidence-register.md`.
