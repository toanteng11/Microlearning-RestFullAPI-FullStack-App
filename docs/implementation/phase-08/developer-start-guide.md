# Phase 08 — Developer and Release Operator Start Guide

## Preconditions

- Windows/local prerequisites follow root `README.md`: Node.js `24.14.0`, npm `11.9.0`, Git, Docker where local E2E is required.
- Never use Production credentials locally; use synthetic data and approved GitHub/Cloud identities.
- Read P07 handoff, this directory README, `package.json`, relevant workflow and release records before execution.
- Read `release-profile-and-solo-governance.md`, `source-and-workflow-blueprint.md` and `execution-parts/README.md`; start at Part 00.

## Required order

1. Create a Phase 08 branch from current protected `main`; confirm clean baseline and do not reuse a stale candidate identity.
2. Review and merge P08-PR00/P08-PR01 (Part 00-02); corrected contracts must be green on the protected branch before an actual candidate is accepted.
3. Run Part 03-07 on the exact Staging candidate.
4. Prepare Production in Part 08, record G5 in Part 09, and only then enable/use protected APPLY in Part 10.
5. Complete Part 11-13 and final clean-checkout verification.

## Local verification commands (existing scripts)

```powershell
npm ci
npm run check:ci
npm run test:openapi
npm run test:e2e
npm run release:contract:test
npm run operations:contract:test
npm run observability:contract:test
npm run promotion:contract:test
npm run hardening:contract:test
npm run exit:contract:test
npm run handoff:contract:test
npm run phase-08:contract:test
npm run terraform:fmt:check
npm run terraform:validate
npm run terraform:policy:test
npm run terraform:security
```

Record validation commands become usable after Part 02:

```powershell
npm run phase-08:profile:validate -- <release-profile.json> <report.json>
npm run phase-08:handoff:validate -- <handoff.json> <report.json>
npm run phase-08:release:init -- <release-profile.json> [artifact-root]
npm run phase-08:acceptance:validate -- <acceptance-evidence.json> <report.json>
npm run phase-08:identity:validate -- <identity.json> <other-record.json> --report <report.json>
npm run phase-08:system-test:validate -- <system-test-summary.json> <report.json>
npm run phase-08:uat:validate -- <uat-summary.json> <report.json>
npm run phase-08:decision:validate -- <go-no-go.json> <report.json>
npm run phase-08:readiness:validate -- <readiness-pack.json> <report.json>
npm run phase-08:exit:validate -- <exit-record.json> <report.json>
```

Only run `npm run test:e2e:cloud` when the approved Staging URL, synthetic secret and Cloud identity are available. Existing workflow `.github/workflows/cloud-e2e.yml` is the authoritative CI invocation.

## Release identity discipline

Use `npm run release-manifest:validate -- <manifest> --verify-files`, `npm run release:lineage:validate` and `npm run deployment-record:validate -- <record> <trusted-run>` only with actual files produced by workflows. Do not invent arguments, paths or IDs.

## Evidence handling

Store generated evidence under `artifacts/phase-08/<release-id>/`, scan with `npm run e2e:artifacts:scan -- <path> <report>`, and redact secrets/PII before upload. Never commit raw credentials or unreviewed cloud output. Templates may contain `PENDING`; a final Pass/GO record may not.
