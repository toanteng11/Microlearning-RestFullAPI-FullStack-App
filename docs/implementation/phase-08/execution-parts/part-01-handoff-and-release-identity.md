# Part 01 - Handoff and Release Identity

**Implementation status:** `DONE`.

The corrected G0 validator requires the Phase 07 Pass decision, full commit SHA, matching registry/deployed image digests, Staging revision/HTTPS URL, rollback baseline, residual risks and Production `NO_GO`. The actual handoff and runtime identity for `P08-RC-20260910-92cdc07` have been validated; G0 is `PASS`.

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

## Actual completion evidence

- Live revision: `microlearning-staging-00013-6ns`, 100% traffic.
- Live URL: `https://microlearning-staging-bu73wlfj5a-as.a.run.app`.
- Immutable image: `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning/microlearning-app@sha256:5cabccd99633e331160fbcae0df64cbfcb058090718d0ba6b9fe650aeefde981`.
- CI/Build/Deploy/Cloud E2E runs share the exact commit and report `success`.
- The stale source revision `00012-qw2` is explicitly reconciled to provider/runtime revision `00013-6ns`; commit, URL and digest match.
- Evidence: `identity/handoff.json`, `identity/release-identity.json`, `identity/provider-observation.json`, `identity/staging-identity-reconciliation.json` under the release artifact root.
