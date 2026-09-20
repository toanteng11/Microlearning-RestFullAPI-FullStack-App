# Part 09 - Pre-release Acceptance and Go/No-Go

## Outcome

A deployment decision is made from pre-release evidence without depending on post-release results.

## Entry

- G2 System Test Pass.
- G3 UAT Pass and G4 defect/change closure Pass.
- Part 08 Production readiness Pass.

## Tasks

1. Generate `PRE_RELEASE` acceptance for `P08-AC-001..010`.
2. Verify evidence IDs, exact identity, redaction and status accounting.
3. Record QA, Technical Lead, DevOps and PO recommendations separately under solo governance.
4. Decide `GO`, `CONDITIONAL_GO` or `NO_GO` with rationale and UTC timestamp.
5. For Conditional Go, require only Medium/Low issue, safe workaround, owner, expiry, communication and no forbidden waiver category.
6. Bind the decision to the exact release ID/digest and approved deployment window.

## Implemented tooling

- `scripts/lib/phase-08-pre-release.mjs` composes acceptance and G5 records only from valid, identity-matched G2/G3/G4 inputs.
- `scripts/generate-phase-08-pre-release.mjs` writes a release-scoped package and refuses overwrite.
- `scripts/verify-phase-08-pre-release.mjs` verifies the package checksums before Part 10 consumes it.
- `scripts/test-phase-08-pre-release-tooling.mjs` covers successful generation, missing evidence, identity mismatch, tampering and overwrite protection.
- `.github/workflows/phase-08-pre-release.yml` is the protected `Phase 08 Pre-release G5` workflow required by Part 10. It downloads the exact System Test/UAT and Production `PLAN_ONLY` artifacts, validates the identity and plan hash against reviewed redacted records, creates the immutable G5 package and retains it for 90 days.
- [Pre-release G5 runbook](../pre-release-go-no-go-runbook.md) defines the actual evidence inputs and operator procedure.

Implementation status: `LOCAL_PASS_REMOTE_PENDING`. Code and contract tests are complete; actual G5 remains `PENDING` until G3 UAT and G4 Production readiness artifacts exist for the exact candidate.

## Exit

`P08-EV-030` validates and G5 decision is immutable. GO has zero conditions and zero Critical/High defects. Any candidate change invalidates the decision and returns to the impacted gate.
