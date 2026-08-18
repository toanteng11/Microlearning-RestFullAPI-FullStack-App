# Terraform Identity Supply Chain Evidence

## 1. Evidence scope

Đây là local pre-PR evidence cho Part 03-05 trên branch `feature/phase-07-runtime-container`, ngày
`2026-08-16`. Base commit khi bắt đầu là `792e203`. Vì thay đổi chưa commit/PR và Cloud foundation chưa apply,
tài liệu này không được dùng để đánh dấu các part `DONE`.

## 2. Local results

| Control | Result | Evidence |
| --- | --- | --- |
| Terraform layout | Pass | bootstrap, staging, production roots và 6 modules đúng blueprint |
| Terraform version/provider | Pass | Terraform `1.15.8`; Google provider `7.39.0`; lockfiles có Windows/Linux checksums |
| Terraform fmt | Pass | `terraform fmt -recursive infrastructure/terraform` |
| Terraform init/validate | Pass | bootstrap, staging và production đều `Success! The configuration is valid.` |
| Plan policy unit tests | Pass | destroy/replace/public IAM/key/secret version/tag/cross-env/canary đều bị reject |
| Release contract tests | Pass | exact digest accepted; latest/tag/whitespace/invalid manifest rejected |
| Production image local manifest | Pass | 63,798,557-byte non-root image; commit/scan/SBOM hashes validated; scope remains `LOCAL_ONLY` |
| Workflow YAML parse | Pass | infrastructure plan, positive identity và negative identity workflows parse thành công |
| IaC Trivy scan | Pass | Trivy `0.69.2` pinned image; `0` Critical/High finding; generated JSON gitignored |
| Existing Artifact Registry audit | Pass With Import Pending | repository private, Docker/Standard, immutable tags và cleanup dry-run; declarative import added |

## 3. Implemented controls

- GCS state bucket contract: uniform access, public prevention, versioning, prevent destroy và tách prefix.
- Artifact Registry: private writer binding, immutable tags, deletion protection, cleanup dry run và rollback
  window 20 versions.
- Dedicated runtime/seed/E2E/deployer accounts; Owner/Editor và Secret Manager payload roles bị validation
  cấm. Deployer chỉ có Secret Manager viewer.
- WIF condition kiểm tra exact repository/owner names và numeric IDs, main ref, environment subject và exact
  `workflow_ref` claims; không dùng reusable-only `job_workflow_ref`.
- GitHub workflows không dùng JSON key; chỉ cloud jobs nhận `id-token: write`.
- Production root tách state/account/provider và ở validation-only trong Phase 07.
- Release manifest liên kết image metadata, registry digest, scan và SBOM checksum.

## 4. Remote evidence still required

1. P07-PR01 phải merge trước theo dependency WBS.
2. P07-PR02 clean checkout chạy `Terraform quality` Pass.
3. Owner review/apply bootstrap và migrate state; xác minh private/versioned/no-secret.
4. Owner apply Staging foundation từ plan policy Pass.
5. Artifact Registry private/IAM/cleanup dry-run được kiểm tra trên Cloud.
6. Authorized identity workflow Pass; unauthorized workflow bị deny; active key count bằng `0`.
7. Registry publish tạo exact digest release manifest ở Part 09.

Chỉ sau các evidence trên và Part 06 Pass mới có thể đóng P07-PR02/Part 03-06.

Read-only Cloud audit cũng xác nhận state bucket chưa tồn tại, Phase 07 service accounts chưa tồn tại và WIF
pool chưa tồn tại. Vì vậy không có resource nào được nhận nhầm là đã bootstrap/apply.
