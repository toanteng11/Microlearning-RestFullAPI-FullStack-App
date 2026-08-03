# Part 03 - Terraform Foundation And State

## Goal

Tạo Terraform roots/modules và remote state an toàn để resource Cloud có thể tái lập, review và rollback.

## Parent PR

`P07-PR02 - Cloud Foundation Identity And Secrets`

## Dependencies

- Part 00 `DONE`.
- Part 02 image contract ổn định.

## Work

1. pin Terraform/provider versions và commit lockfile;
2. tạo `bootstrap`, modules và environment roots theo blueprint;
3. bootstrap GCS state bucket với versioning/public prevention;
4. tách Staging/Production prefixes;
5. enable required GCP APIs declaratively;
6. tạo Cloud Run module variables/validation/outputs;
7. tạo monitoring/secret/IAM module skeletons;
8. thêm labels/naming contract;
9. thêm fmt/validate/security/plan scripts/workflow;
10. thêm destructive/public IAM policy checks;
11. test state canary không chứa secret;
12. document bootstrap/recovery/drift.

## Validation

- TC-023..026 Pass;
- clean clone Terraform init/validate Pass;
- state private/versioned/tách environment;
- plan chỉ có expected resources;
- second plan sau apply về sau phải clean.

## Evidence

`P07-EV-010..012`, redacted bootstrap/state/plan records.

## Stop Conditions

- state local/public/chung environment;
- secret value trong variable/state/output;
- plan unexpected destroy/public IAM;
- unpinned provider/tool.

## Definition Of Done

- AC-017..020 Pass ở mức foundation;
- Terraform design/code review accepted.
