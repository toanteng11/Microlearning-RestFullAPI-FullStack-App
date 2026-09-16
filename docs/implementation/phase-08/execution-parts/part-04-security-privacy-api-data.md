# Part 04 - Security, Privacy, API and Data Regression

## Outcome

Release safety is proven across role authorization, object ownership, secrets, privacy and data integrity.

## Entry

- Part 03 runner operational.

## Tasks

1. Map Must security/privacy/API/data BA IDs to concrete automated or inspected evidence.
2. Test cross-user and cross-classroom access using two Students and two Teachers.
3. Verify disabled/inactive roles, token rotation/reuse/logout, invitation expiry/revoke/reuse and rate limits.
4. Inspect representative API projections/logs/errors/exports for hash/token/secret/PII leakage.
5. Verify pagination bounds, validation, NoSQL operator rejection, compound indexes and transaction/idempotency behavior.
6. Run dependency audit, secret scan, image/SBOM/lineage checks and cloud security verification.

## Exit

No open Critical/High security, privacy, access, data-loss, grade, deadline or progress defect. Every Must has evidence in the System Test summary and traceability matrix.

## Stop

Credential exposure, cross-scope read/write, unsafe production error, incorrect grade/progress or data corruption immediately produces G2 Fail and incident containment.

## Implementation status

`DONE` on exact candidate `P08-RC-20260916-8489623`.

- `tests/e2e/phase-08-quality.spec.ts` verifies blocked Student/Teacher identities, Student/Admin and Teacher/Admin RBAC, two-Student/two-Teacher ownership isolation, NoSQL operator rejection, pagination bounds, response redaction and idempotent analytics retry.
- `scripts/lib/phase-08-quality.mjs` requires every security/data check ID and rejects missing, duplicate or failed evidence.
- Existing dependency, Terraform, artifact-redaction, lineage and cloud identity checks remain enforced in `.github/workflows/phase-08-system-test.yml` before G2 can Pass.
- Raw and summarized evidence is written below `security-performance/` and is rescanned before upload.

Remote workflow `35078334825` passed all 11 required security/data checks, dependency audit, Terraform format/security and redaction controls. The 90-day artifact `phase-08-system-test-P08-RC-20260916-8489623` (ID `10438877244`) records `P08-EV-015/016`; final redaction scanned 35 files with zero findings.
