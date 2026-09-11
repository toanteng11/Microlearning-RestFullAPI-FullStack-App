# Part 00 - Baseline, Profile and Governance

**Implementation status:** `DONE`.

Release profile `ACADEMIC_DEMO_RELEASE`, `soloProject=true`, synthetic-only scope, role assignments and release-scoped workspace contract are implemented and validated for `P08-RC-20260910-92cdc07`. No independent-review claim is made.

## Outcome

Release scope and the honest claim for the final product are fixed before any execution.

## Entry

- Phase 07 exit/handoff documents and raw evidence are accessible.
- BA acceptance, release, DevOps and NFR sources are available.

## Tasks

1. Select `ACADEMIC_DEMO_RELEASE` or `ORGANIZATION_PRODUCTION` and record rationale.
2. Freeze included Must capabilities, conditional capabilities and explicit exclusions.
3. Record `soloProject`, actor identity and role assignments without claiming independence.
4. Choose release ID format `P08-RC-<UTC-date>-<short-sha>` and artifact retention location.
5. Open or carry forward risks for Atlas, budget, backup, alert route and production apply.
6. Confirm no real user data is allowed under the academic profile.

## Verification and evidence

- Review `../release-profile-and-solo-governance.md` and BA scope/release criteria.
- Produce profile decision and scope-freeze record linked to `P08-EV-001`.

## Exit

Profile, owner, scope/non-goals, role model and stop conditions are approved for planning. No placeholder appears in the accepted G0 record.

## Stop

Real data/SLA is requested while academic controls remain selected, or release authority is represented inaccurately.

## Actual completion evidence

- Profile and handoff validators: `PASS`.
- Candidate: `92cdc07051eace7062957c89b412bcbda920b254`.
- Readiness record: `artifacts/phase-08/P08-RC-20260910-92cdc07/identity/g0-g1-readiness.json`.
- Evidence IDs: `P08-EV-001`, `P08-EV-003`.
