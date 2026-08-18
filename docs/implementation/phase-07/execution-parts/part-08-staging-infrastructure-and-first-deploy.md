# Part 08 - Staging Infrastructure And First Deploy

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING` on `2026-08-17`. Cloud Run service/private seed Job, exact digest/secret versions,
probes, scale/concurrency, intentional public IAM policy, two-step first-deploy workflow và HTTPS smoke verifier
đã implement/validate. Terraform apply, service URL, revision và observation evidence còn Pending.

## Goal

Provision Cloud Run Staging bằng Terraform và deploy exact image digest lần đầu với HTTPS/probes/scale/IAM
đúng baseline.

## Parent PR

`P07-PR03 - Atlas And First Staging Deployment`

## Dependencies

- Parts 03-07 implementation ready.
- Image digest Pass scan/container smoke.
- Prior Terraform plan reviewed.

## Work

1. run Terraform init/validate/plan;
2. review resource/IAM/public/cost changes;
3. apply saved plan through approved identity;
4. deploy exact digest and pinned secret versions;
5. capture outputs/service URL/revision/digest/runtime SA;
6. wait startup/readiness;
7. verify health/version/HTTPS;
8. verify static/API/Swagger basic routes;
9. verify Cloud Run min/max/concurrency/timeout/probes;
10. provision private seed Job with the same digest and no public invoker;
11. execute idempotent seed once and capture redacted Job result;
12. inspect startup/Job/log redaction;
13. run first-deploy index/transaction checks;
14. record observation window and post-apply drift plan.

## Validation

- TC-042..049 applicable first-deploy cases Pass;
- Cloud Run revision digest equals manifest;
- readiness stable and version metadata exact;
- no unexpected drift;
- no secret in logs/config output.

## Evidence

`P07-EV-011`, `P07-EV-018`, first deployment record and smoke result.

## Stop Conditions

- plan has unexpected delete/public IAM;
- digest/config/revision mismatch;
- readiness unstable or auth route exposed;
- deployment requires manual Console drift to work.

## Definition Of Done

- AC-038..041 and first-deploy portions Pass;
- P07-PR03 merged/main CI Pass;
- Staging revision marked stable only after observation.
