# Phase 07 Resource Naming And Labeling

## 1. Naming Rules

- Lowercase, hyphen-separated, ổn định và không chứa email/MSSV/secret.
- Tên thể hiện product và environment nhưng không lặp project ID không cần thiết.
- Không đổi tên Cloud Run service sau khi public URL/evidence đã được tạo.
- Terraform resource address ổn định; rename dùng `moved` block/import plan khi cần.

## 2. Canonical Names

| Type | Staging | Production |
| --- | --- | --- |
| Cloud Run service | `microlearning-staging` | `microlearning-production` |
| Cloud Run seed job | `microlearning-staging-seed` | Not provisioned by default |
| Runtime service account | `ml-runtime-staging` | `ml-runtime-production` |
| Seed Job service account | `ml-seed-staging` | Not provisioned by default |
| Cloud E2E service account | `ml-e2e-staging` | Separate Production identity if approved |
| GitHub deploy service account | `ml-github-staging` | `ml-github-production` |
| Atlas database | `microlearning_staging` | `microlearning_production` |
| Atlas app user | `microlearning_staging_app` | `microlearning_production_app` |
| Secret prefix | `ml-staging-` | `ml-production-` |
| Monitoring prefix | `microlearning-staging-` | `microlearning-production-` |
| Terraform state prefix | `phase-07/staging` | `phase-07/production` |

Remote-state bucket dùng global-unique pattern `microlearning-tfstate-<project-number>`. Bucket là shared
bootstrap resource; environment isolation nằm ở state prefix, IAM và workflow input validation.

Synthetic backup rehearsal dùng bucket riêng `microlearning-staging-backups-<project-number>`, bật uniform
bucket-level access, public access prevention và short lifecycle. Không lưu backup trong Terraform state
bucket.

Atlas password, Secret Manager versions và personal usernames không xuất hiện trong naming catalog.

## 3. Artifact Naming

```text
asia-southeast1-docker.pkg.dev/<project>/microlearning/microlearning-app:sha-<12-char-sha>
asia-southeast1-docker.pkg.dev/<project>/microlearning/microlearning-app@sha256:<digest>
```

- Tag `sha-*` phục vụ con người; digest là deployment identity.
- Optional release tag `vX.Y.Z` chỉ thêm sau Phase 08 approval và trỏ cùng digest.
- Không deploy `latest`; nếu tạo `latest` cho convenience thì không dùng trong Terraform/Cloud Run.

## 4. Required Labels

| Label | Example |
| --- | --- |
| `app` | `microlearning` |
| `environment` | `staging` |
| `managed_by` | `terraform` |
| `phase` | `phase-07` |
| `owner` | `project-owner` |
| `cost_center` | `student-project` |
| `data_classification` | `synthetic` |

Không đặt PII hoặc credential trong label. `commit_sha` và version nên dùng Cloud Run revision label
hoặc annotation phù hợp, không thay thế system version endpoint.

## 5. Retention Naming

- Prior stable digest phải được đánh dấu trong deployment record trước cleanup.
- Registry cleanup không xóa digest đang được Cloud Run revision tham chiếu hoặc rollback target.
- Backup artifact synthetic dùng timestamp UTC, environment, schema version và checksum; không dùng
  tên người dùng hoặc Classroom thật.
