# Part 10 - Staging Deployment CD

## Goal

Tự động promote exact build digest lên Staging bằng Terraform, chạy post-deploy gates và rollback khi fail.

## Parent PR

`P07-PR04 - Build Publish And Staging CD`

## Dependencies

- Part 08 first deploy stable.
- Part 09 release manifest available.

## Work

1. bind workflow to GitHub `staging` environment;
2. verify manifest/main CI/digest lineage;
3. add single-environment concurrency lock;
4. WIF auth and Terraform init/plan/apply;
5. policy-check plan and exact image ref;
6. capture outputs/revision/URL;
7. wait readiness/version match;
8. trigger smoke suite;
9. publish deployment record/evidence;
10. mark stable only after all gates;
11. invoke rollback path on Must failure;
12. add manual recovery/re-run input validation.

## Validation

- successful main build reaches Staging without manual credential;
- mutable/unknown digest rejected;
- failed readiness/smoke does not mark stable;
- apply/evidence failures fail workflow;
- post-apply drift clean.

## Evidence

`P07-EV-019..020`, workflow chain, deployment/rollback records.

## Stop Conditions

- concurrent apply to same state;
- tag deployment;
- workflow can target Production;
- failed smoke still returns success.

## Definition Of Done

- AC-038..043 Pass;
- P07-PR04 merged, main CI and first automated Staging chain Pass.
