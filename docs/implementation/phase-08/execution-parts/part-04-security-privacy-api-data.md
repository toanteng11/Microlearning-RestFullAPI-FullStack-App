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
