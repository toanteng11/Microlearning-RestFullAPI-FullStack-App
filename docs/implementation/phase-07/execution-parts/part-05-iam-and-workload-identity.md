# Part 05 - IAM And Workload Identity Federation

## Current Status

`LOCAL_PASS_REMOTE_PENDING` - dedicated identities, bounded role/actAs contract, exact WIF claim conditions,
positive/negative workflows, no-key verifier và revocation runbook đã có. Cloud apply và workflow runs vẫn
Pending.

## Goal

Cho GitHub Actions authenticate/deploy bằng OIDC token ngắn hạn và least-privilege identities.

## Parent PR

`P07-PR02 - Cloud Foundation Identity And Secrets`

## Dependencies

- Part 03 foundation.
- GitHub environment direction approved in Part 00.

## Work

1. Terraform runtime/deployer identities tách environment;
2. tạo WIF pool/provider;
3. map claims và condition đúng repository/ref/environment;
4. bind Staging deployer, runtime secret access và actAs tối thiểu;
5. cấu hình GitHub non-secret variables;
6. workflow identity diagnostic với `id-token: write` scoped job;
7. positive test from authorized context;
8. negative test from unauthorized branch/context;
9. verify runtime cannot deploy và Staging cannot mutate Production;
10. verify service-account active keys bằng `0`;
11. export/review redacted IAM policy;
12. document revoke/incident procedure.

## Validation

- TC-027..031 Pass;
- no JSON key in GitHub/GCP/repository;
- trust không rộng toàn organization/repositories;
- deployer không đọc secret payload ngoài contract.

## Evidence

`P07-EV-013..014`, positive/negative workflow URLs, no-key result.

## Stop Conditions

- workflow cần long-lived JSON key;
- untrusted PR/ref exchange token được;
- predefined role quá rộng không có review/mitigation;
- Staging principal có Production mutation access.

## Definition Of Done

- AC-021..023 Pass;
- identity path ready for Staging deployment.
