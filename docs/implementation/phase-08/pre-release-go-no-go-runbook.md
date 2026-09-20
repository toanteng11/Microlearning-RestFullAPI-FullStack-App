# Phase 08 - Pre-release Acceptance and G5 Runbook

## Purpose

This runbook creates the immutable G5 decision package for one exact release candidate. It does not deploy Production and it cannot replace missing System Test, UAT, backup/restore or operations evidence.

## Required inputs

Prepare these six JSON files under the release-scoped evidence workspace:

| Input | Required state |
| --- | --- |
| `identity/release-identity.json` | exact commit, immutable image digest, Staging revision and canonical URL |
| `system-test/system-test-summary.json` | valid `PASS`, Critical/High = 0 |
| `uat/uat-summary.json` | valid `PASS`, all Must scenarios Pass, signed solo-role recommendations |
| `production-plan/production-readiness.json` | valid `PASS`, `PLAN_ONLY`, backup/isolated restore/RPO/RTO and operations proof present |
| `exit/pre-release-evidence-index.json` | every `P08-EV-001..026` pre-release evidence ID exactly once as `PASS` |
| `exit/g5-decision-request.json` | explicit decision, rationale, role recommendations and approved UTC deployment window |

Each `artifact` in the evidence index must include the exact release ID. An evidence row must include `id`, `status`, `artifact`, `recordedAtUtc`, `actor`, `expectedResult`, `actualResult` and `redactionReviewed: true`.

## Protected workflow procedure

After the redacted Part 08 readiness record and evidence index have been reviewed on `main`, run **Phase 08 Pre-release G5** through Actions with:

- `confirmation=RECORD_PHASE_08_G5`.
- The exact release ID.
- The successful **Phase 08 System Test** run that includes both `system-test/system-test-summary.json` and `uat/uat-summary.json` for that release.
- The successful **Phase 08 Production Promotion** `PLAN_ONLY` run for that release.
- A reviewed decision, decision ID, rationale and a future UTC deployment window.
- `conditions_json=[]` for `GO`/`NO_GO`; for `CONDITIONAL_GO`, a non-empty JSON array containing only reviewed Medium/Low, waivable conditions with owner, expiry, workaround, mitigation and communication.

The workflow downloads those two retained artifacts, checks their provenance, verifies every identity field and the Terraform plan hash, then reads only the reviewed redacted files from `artifacts/phase-08/<release-id>/`: `production-plan/production-readiness.json` and `exit/pre-release-evidence-index.json`. It creates `g5-decision-request.json` from the dispatch inputs, produces `exit/g5/` and uploads `phase-08-g5-<release-id>` for 90 days. It does not authenticate to Google Cloud, read Secret Manager payloads, or apply Terraform.

Do not run G5 with a local fixture, a copied old artifact, or an evidence index whose records are not bound to the same release identity. A failed source verification is a stop condition, not an invitation to edit the generated G5 package.

## Decision request

Use this shape and replace every angle-bracket value with reviewed actual data:

```json
{
  "actor": "<release-owner>",
  "recordedAtUtc": "<UTC-timestamp>",
  "decision": "GO",
  "decisionId": "P08-G5-YYYYMMDD-01",
  "rationale": "<evidence-based-rationale>",
  "decidedAtUtc": "<UTC-timestamp>",
  "recommendations": {
    "technicalLead": "GO",
    "qa": "GO",
    "devOps": "GO"
  },
  "governance": {
    "soloProject": true,
    "independentReview": false,
    "actor": "<release-owner>"
  },
  "conditions": [],
  "approvedDeploymentWindow": {
    "startsAtUtc": "<UTC-timestamp>",
    "endsAtUtc": "<UTC-timestamp>"
  }
}
```

For `CONDITIONAL_GO`, every condition must have an `issueId`, `severity` (`MEDIUM` or `LOW`), waivable `category`, `owner`, `expiryUtc`, safe `workaround`, `mitigation` and `communication`. Security, privacy, access control, data integrity, grading integrity and deadline integrity are not waivable. A condition must expire after the deployment window.

## Generate and verify

```powershell
npm run phase-08:pre-release:generate -- `
  artifacts/phase-08/<release-id>/identity/release-identity.json `
  artifacts/phase-08/<release-id>/system-test/system-test-summary.json `
  artifacts/phase-08/<release-id>/uat/uat-summary.json `
  artifacts/phase-08/<release-id>/production-plan/production-readiness.json `
  artifacts/phase-08/<release-id>/exit/pre-release-evidence-index.json `
  artifacts/phase-08/<release-id>/exit/g5-decision-request.json `
  artifacts/phase-08/<release-id>/exit/g5

npm run phase-08:pre-release:verify -- `
  artifacts/phase-08/<release-id>/exit/g5/pre-release-acceptance.json `
  artifacts/phase-08/<release-id>/exit/g5/go-no-go-decision.json `
  artifacts/phase-08/<release-id>/exit/g5/g5-decision-lock.json
```

The generator refuses to overwrite an existing G5 directory. A corrected candidate or decision must use a new release/decision identity and rerun the affected gates.

## Output and gate result

The output directory contains:

- `pre-release-acceptance.json`: `P08-AC-001..010` Pass and post-release criteria Pending.
- `go-no-go-decision.json`: exact gate results, recommendations, decision and deployment window.
- `g5-decision-lock.json`: SHA-256 values for both records and exact candidate identity.

Part 09 is `DONE` only when this package validates from actual G2/G3/G4 evidence, is retained as `P08-EV-030`, and the decision is `GO` or approved `CONDITIONAL_GO`. `NO_GO` is a valid decision record but does not open Part 10.
