# Part 02 - Evidence Contract and Workspace

**Implementation status:** `DONE`.

`PRE_RELEASE` and `FINAL` validation, solo-governance checks, protected post-G5 `APPLY` boundary, redaction and non-overwriting evidence-workspace initialization are implemented, covered by required checks and instantiated for the locked candidate.

## Outcome

Pre-release and final acceptance can be validated independently, with fail-closed and secret-safe artifacts.

## Entry

- Part 01 identity locked.

## Tasks

1. Implement `PRE_RELEASE` and `FINAL` contract stages.
2. Remove the global ban on `APPLY`; allow it only after validated G5 GO in production/exit records.
3. Update readiness composition so G5 does not require G6-G8 evidence.
4. Add solo governance fields and reject false independent-review claims.
5. Create release-scoped artifact directories; never overwrite another release.
6. Ensure reports redact secret-like keys, URI credentials, bearer tokens and private keys.

## Tests

- `npm run phase-08:contract:test` covers all valid statuses and negative boundaries.
- Acceptance PASS rejects missing IDs, duplicate IDs, placeholders and inconsistent counts.
- Pre-release Pass permits post-release criteria Pending; final Pass rejects them.
- APPLY rejects missing GO, wrong release identity and unprotected execution context.

## Evidence and exit

Contract test output and evidence workspace manifest are attached to `P08-EV-003`. Part exits when all validators agree on the same release identity and status vocabulary.

## Actual completion evidence

- `npm run phase-08:contract:test`: `PASS` (32 cases).
- Handoff, profile, identity and readiness validators: `PASS`.
- Release workspace: `artifacts/phase-08/P08-RC-20260910-92cdc07/`.
- Redaction scan: zero findings; raw workspace is release-scoped and excluded from source control.
- Evidence ID: `P08-EV-003`.
