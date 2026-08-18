# Part 15 - Production Promotion Readiness

## Goal

Chuẩn bị workflow/config/runbook Production được bảo vệ và chỉ promote same verified digest; không triển khai
Production thật trong Phase 07.

## Parent PR

`P07-PR07 - Promotion Readiness And Hardening`

## Dependencies

- Automated Staging chain and rehearsals Pass.
- GitHub `production` environment protected.

## Work

1. implement manual `workflow_dispatch` Production workflow;
2. require protected `production` environment, protected `main`, no-bypass và solo governance policy;
3. validate exact confirmation phrase, digest và release manifest inputs;
4. verify digest has successful Staging record;
5. reject tag/unknown/non-main/unverified digest;
6. use separate Production identity/state/config placeholders;
7. generate plan and stop before actual apply in P07 validation;
8. implement concurrency and rollback inputs;
9. link UAT/Go decision requirements;
10. document traffic/smoke/observation/rollback;
11. verify Staging identity cannot target Production;
12. record Production Atlas/domain/RPO/RTO blockers.

## Validation

- workflow syntax/policy/unit tests Pass;
- invalid digest/missing confirmation/no Go decision path denied;
- no Production secret/resource needed to validate dry path;
- actual Production apply not executed.

## Evidence

`P07-EV-039`, protected environment settings, dry validation report.

## Stop Conditions

- workflow auto-deploys Production from main;
- Staging credentials/state reused;
- confirmation, Go/No-Go hoặc protected environment can be bypassed;
- workflow rebuilds image;
- Production Go blockers not enforced.

## Definition Of Done

- AC-044 Pass;
- promotion workflow ready for Phase 08, actual apply remains blocked.

## Current Status

`LOCAL_PASS_REMOTE_PENDING`.

Đã có `promote-production.yml`, `promotion-contract.mjs`, stable deployment record validation và test
contract. Workflow dùng protected `production` environment, exact Staging digest, UAT/Go-No-Go inputs và
dừng ở Terraform `plan`; chưa có Production apply trong Phase 07. Cần chạy workflow bằng stable record thật
trên GitHub để đóng evidence `P07-EV-039`.
