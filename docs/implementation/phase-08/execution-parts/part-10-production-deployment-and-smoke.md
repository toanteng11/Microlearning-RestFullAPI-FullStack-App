# Part 10 - Production Deployment and Smoke

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`

## Outcome

The exact tested digest is deployed through the protected workflow and verified on the Production URL.

## Entry

- Exact G5 GO/Conditional Go record for the candidate.
- Protected GitHub `production` environment and WIF are configured.
- Production contains the four synthetic read-only personas used by the Phase 07 cloud-role suite (`student.active@example.test`, `teacher.active@example.test`, `admin.active@example.test`, `superadmin.active@example.test`) plus the supporting course fixture; their shared credential is stored only as the protected environment secret `E2E_DEMO_PASSWORD_PRODUCTION`.

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

## Implemented tooling

- `.github/workflows/promote-production.yml` keeps `PLAN_ONLY` as the default and exposes `APPLY` only behind the protected `production` environment and the explicit `APPLY_PHASE_08_PRODUCTION` confirmation.
- APPLY resolves a successful `Phase 08 Pre-release G5` workflow, verifies the immutable acceptance/decision/lock package, matches its identity to the stable Staging record and enforces the approved UTC deployment window.
- The workflow promotes the exact Staging digest without rebuilding, verifies exact Production secret versions, applies the reviewed Terraform plan, checks 100% traffic, runtime commit/digest, HTTPS smoke and empty post-apply drift.
- `playwright.phase-08-production.config.ts` runs the four-role browser/API smoke against the exact Production URL and emits JSON, JUnit, HTML, trace, screenshot and video evidence without creating or changing learning data.
- `scripts/lib/phase-08-production-deployment.mjs` and `phase-08:production-deployment:validate` enforce the machine-readable `PRODUCTION_DEPLOYMENT` contract for `P08-EV-031/037` and reject mutable images, partial traffic, identity mismatch, failed smoke, secret-like fields and unprotected execution.
- A post-apply failure restores the previous revision when one exists and emits a rollback record; all uploaded evidence receives a final redaction scan and 90-day retention.

Local contract verification is complete. Part 10 remains `LOCAL_PASS_REMOTE_PENDING` until Part 08-09 produce actual G4/G5 evidence and the protected APPLY run succeeds. No Production deployment is claimed by this documentation update.
