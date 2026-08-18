# Part 06 - Secret And Runtime Configuration

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING` on `2026-08-17`. Secret containers/IAM, exact-version mapping, secure input
script, runtime coverage verifier và rotation runbook đã implement/validate. Actual container apply và initial
version records còn Pending.

## Goal

Đưa secret/config vào Cloud Run bằng Secret Manager exact versions và Production fail-fast schema.

## Parent PR

`P07-PR02 - Cloud Foundation Identity And Secrets`

## Dependencies

- Part 01 runtime schema.
- Part 03 Terraform foundation.
- Part 05 runtime identity.

## Work

1. inventory và phân loại all env variables;
2. đồng bộ runtime schema, `.env.example`, Terraform variables;
3. add automated schema-to-Terraform explicit-field coverage check;
4. Terraform secret containers/IAM, không secret values;
5. owner thêm initial secret versions thủ công an toàn;
6. Cloud Run references pinned version numbers;
7. test config missing/default/invalid failures;
8. test secret state/image/log/browser redaction;
9. implement/document secret rotation and rollback window;
10. ensure deployment record chỉ ghi resource/version ID;
11. review GitHub environment variables/secrets.

## Validation

- TC-005..006, 026, 032..033 Pass;
- state/plan/image/log không có canary;
- version pin visible, value hidden;
- invalid Production config cannot become ready.

## Evidence

`P07-EV-015`, config tests, no-secret canary report.

## Stop Conditions

- plaintext secret trong Terraform/GitHub variable;
- Cloud Run secret dùng unmanaged `latest` contrary to policy;
- Production starts with placeholder/default secret;
- evidence screenshot lộ value.

## Definition Of Done

- AC-010, 020, 024 Pass;
- P07-PR02 merged, main CI Pass.
