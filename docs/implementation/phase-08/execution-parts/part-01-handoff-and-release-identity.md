# Part 01 - Handoff and Release Identity

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`.

The corrected G0 validator now requires the Phase 07 Pass decision, full commit SHA, matching registry/deployed image digests, Staging revision/HTTPS URL, rollback baseline, residual risks and Production `NO_GO`. It no longer requires System Test, UAT, G5 or Production outputs. Actual handoff acceptance remains pending.

## Outcome

One immutable candidate is accepted from Phase 07 without requiring future Phase 08 results.

## Entry

- Part 00 complete.
- Phase 07 final Pass and stable Staging evidence exist.

## Tasks

1. Correct `validatePhase08Handoff` according to `../source-and-workflow-blueprint.md`.
2. Extract full commit SHA, immutable image reference/digest, Staging revision/URL and stable workflow run.
3. Verify registry digest equals deployed Cloud Run digest and commit lineage.
4. Record prior stable revision/digest for rollback.
5. Carry P07 residual risks and keep Production decision `NO_GO` at G0.
6. Generate and validate the handoff JSON; archive its redacted report.

## Tests

- Positive: exact P07 Pass/stable identity is accepted.
- Negative: short SHA, mutable tag, placeholder, digest mismatch, missing rollback target or production GO is rejected.
- Run `npm run handoff:contract:test` and Phase 08 identity validation.

## Evidence and exit

`P08-EV-001` is accepted handoff; `P08-EV-002` is identity/lineage proof. G0 Pass locks the candidate. Runtime behavior changes after this point require a new candidate.
