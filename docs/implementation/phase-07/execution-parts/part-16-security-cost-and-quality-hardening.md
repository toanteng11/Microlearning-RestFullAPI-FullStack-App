# Part 16 - Security Cost And Quality Hardening

## Goal

Đóng security/IAM/artifact/cost/quota/drift gaps và chứng minh release candidate có thể tái lập từ clean clone.

## Parent PR

`P07-PR07 - Promotion Readiness And Hardening`

## Dependencies

- Parts 01-15 implementation complete.

## Work

1. review public resources/ingress/Swagger policy;
2. review IAM/WIF/service-account keys/environment isolation;
3. run dependency/container/IaC/secret scans;
4. inspect image/state/log/browser/evidence for secrets;
5. verify Atlas network/user/synthetic-data controls;
6. verify budget alerts, scale guardrails, quotas and retention;
7. run drift plan;
8. resolve or time-bound all exceptions;
9. perform clean-clone full CI/container/Terraform validation;
10. deploy release candidate through normal Staging CD;
11. run full cloud smoke and observation;
12. update risks/debt/evidence.

## Validation

- TC-066 and full regression Pass;
- Critical/exploitable High finding `0`;
- active service-account key `0`;
- unexpected drift `0`;
- latest Staging digest/commit/revision consistent;
- clean clone reproducible.

## Evidence

`P07-EV-032..034`, security/cost/clean-clone reports.

## Stop Conditions

- expired/unowned exception;
- secret/data exposure;
- missing budget/owner/quota evidence;
- clean clone relies on local uncommitted files;
- latest Staging differs from release candidate.

## Definition Of Done

- AC-060..063 Pass;
- P07-PR07 merged/main CI/Staging chain Pass.
