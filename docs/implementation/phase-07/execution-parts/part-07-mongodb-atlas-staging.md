# Part 07 - MongoDB Atlas Staging

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING` on `2026-08-17`. TLS/SRV/database/pool contract, guarded seed/index command,
read-only diagnostic và opt-in transaction cleanup đã implement. Connected Atlas report, connection budget và
negative old-credential evidence phải được chạy trên Cloud trước `DONE`.

## Goal

Chuẩn bị Atlas synthetic Staging với credential mới, TLS, least privilege, bounded pool và verified data
contracts.

## Parent PR

`P07-PR03 - Atlas And First Staging Deployment`

## Dependencies

- Part 00 Atlas rotation/network/data decisions.
- Part 06 Secret Manager/runtime config.

## Work

1. tạo dedicated Staging database/user;
2. rotate/revoke old credential và negative-connect test;
3. configure network rule/waiver with owner/expiry;
4. store URI as new secret version;
5. configure TLS, pool max 10, min 0 và bounded timeouts;
6. compile environment-guarded non-interactive synthetic seed command;
7. run schema/index/transaction/invariant verification;
8. test app readiness on connection success/failure;
9. measure connections with planned max instances;
10. define private on-demand seed Job input/output/timeout/retry policy;
11. document Atlas Free limitations and P08 Production block.

## Validation

- TC-034..041 Pass;
- only synthetic records;
- no URI/password in output;
- required indexes/transactions Pass;
- connection budget <= 20 baseline at max two instances.

## Evidence

`P07-EV-005`, `P07-EV-017`, redacted Atlas/user/network/test records.

## Stop Conditions

- old credential still works;
- database/user/environment ambiguous;
- real PII/data present;
- broad network access without approved time-bound waiver;
- pool unbounded.

## Definition Of Done

- AC-027..034 Pass or AC-034 explicit Production block recorded.
