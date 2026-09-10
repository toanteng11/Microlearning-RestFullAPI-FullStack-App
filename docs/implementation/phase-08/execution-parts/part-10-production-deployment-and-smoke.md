# Part 10 - Production Deployment and Smoke

## Outcome

The exact tested digest is deployed through the protected workflow and verified on the Production URL.

## Entry

- Exact G5 GO/Conditional Go record for the candidate.
- Protected GitHub `production` environment and WIF are configured.

## Tasks

1. Dispatch `promote-production.yml` with `APPLY`, release ID, full SHA and immutable digest.
2. Workflow revalidates G2/G3/G5 artifacts and refuses mismatch or mutable tag.
3. Review/apply Terraform plan without rebuilding the image.
4. Capture Cloud Run service/revision/URL/traffic, Terraform apply result and prior revision.
5. Run health/readiness/version, HTTPS/CORS/SPA, login and representative Student/Teacher/Admin smoke.
6. Verify database target, secret references, logs, alert ingestion and no Staging reference.
7. Shift/retain traffic according to runbook; rollback immediately on stop condition.

## Exit

Production status is `ACTUAL`, identity is exact, smoke Pass and `P08-EV-031/037` are complete. A failed smoke ends as `ROLLED_BACK` or `NO_GO`, never partial Pass.
