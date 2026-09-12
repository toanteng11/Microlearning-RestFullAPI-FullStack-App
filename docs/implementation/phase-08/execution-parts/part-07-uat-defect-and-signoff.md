# Part 07 - UAT, Defect Closure and Sign-off

**Implementation status:** `LOCAL_PASS_REMOTE_PENDING`

## Outcome

Business fitness is verified for every Must scenario and all release-affecting defects are dispositioned.

## Entry

- Part 06 ready; G2 Pass recommended before final UAT sign-off.

## Tasks

1. Execute UAT 001-032 in clean role sessions; record expected/actual/status/evidence/UTC.
2. Verify Student, Teacher, Admin and Super Admin flows plus explicit denial paths.
3. Log every mismatch as `DEF-P08-###`; separate defects from scope changes `CR-P08-###`.
4. Fix/redeploy creates a new identity when runtime changes; rerun impacted System Test and UAT.
5. Critical/High must be fixed and retested. Medium/Low needs impact, owner, workaround, target and expiry.
6. Write role-specific QA, BA/PO and technical recommendations with `soloProject=true`.

## Exit

All Must UAT rows Pass, Critical/High = 0, no integrity/security/privacy waiver, and `P08-EV-020/025/026` validate. G3/G4 cannot Pass from screenshots without row-level results.

## Implemented controls

- UAT execution is an explicit option of the trusted Phase 08 System Test workflow, preserving the same candidate identity and WIF boundary.
- A run requires `ACCEPT_PHASE_08_UAT`, a unique `P08-G3-UAT-YYYYMMDD-NN` decision ID and solo-project governance; automation cannot invent an independent reviewer.
- Failed, blocked or not-run rows create linked defect entries. Open Critical/High counts are derived from those entries rather than supplied as an unchecked zero.
- `P08-UT-031` and `P08-UT-032` require reviewed Part 08 operations and recovery evidence. The workflow blocks G3 instead of claiming success while those inputs are missing.
- Part 07 becomes `DONE` only when all 31 Must rows pass, the conditional row passes or has an approved N/A decision, final redaction passes and `P08-EV-020/025/026` validate on the exact candidate.
