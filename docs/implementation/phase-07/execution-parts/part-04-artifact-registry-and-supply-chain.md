# Part 04 - Artifact Registry And Supply Chain

## Current Status

`LOCAL_PASS_REMOTE_PENDING` - private/immutable repository contract, cleanup dry-run, digest validator,
release manifest schema/generator/tests và retention runbook đã có. Registry apply, first publish và
digest-bound Cloud evidence chưa thực hiện.

## Goal

Thiết lập private registry và chain truy vết image digest, commit, scan, SBOM và release manifest.

## Parent PR

`P07-PR02 - Cloud Foundation Identity And Secrets`

## Dependencies

- Part 02 image Pass.
- Part 03 Terraform foundation available.

## Work

1. Terraform Artifact Registry repository cùng region;
2. khóa IAM reader/writer;
3. định nghĩa immutable lookup tag và digest-only deployment input;
4. tạo release manifest generator/schema;
5. generate OCI metadata;
6. integrate image scanner và SBOM;
7. set severity/exception policy;
8. thiết kế retention không xóa active/prior digest;
9. test tag rejection/digest resolution;
10. ghi artifact cleanup/cost runbook.

## Validation

- TC-019..022 Pass;
- repository không public;
- manifest digest/commit/build metadata khớp;
- active/prior digest protected by process;
- scan/SBOM attached to exact digest.

## Evidence

`P07-EV-009`, `P07-EV-016`, redacted registry/IAM/manifest reports.

## Stop Conditions

- deploy `latest` hoặc tag không resolve digest;
- registry public;
- artifact không truy vết commit;
- retention có thể xóa rollback image.

## Definition Of Done

- AC-025..026 artifact portion Pass;
- exact digest accepted by Terraform variable contract.
