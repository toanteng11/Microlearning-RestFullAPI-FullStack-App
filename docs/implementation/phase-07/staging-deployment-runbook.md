# Staging Deployment Runbook

## 1. Mục đích

Hướng dẫn triển khai một release candidate lên Staging theo exact digest và thu thập evidence có thể tái lập.

## 2. Preconditions

- Gate A `APPROVED`.
- Required main CI Pass cho commit mục tiêu.
- Image build/scan/SBOM Pass.
- Secret versions đã tồn tại và runtime identity có quyền.
- Atlas Staging network/user/database đã xác minh.
- Prior stable digest/revision được ghi để rollback.
- Không có active incident hoặc Terraform apply khác.

## 3. Deployment input

```text
release_id:
git_commit:
image_repository:
image_digest:
staging_secret_versions:
terraform_environment: staging
operator/workflow_run:
prior_stable_revision:
prior_stable_digest:
```

Nếu input image là tag hoặc digest thiếu, dừng.

## 4. Automated procedure

1. verify release manifest và main CI run;
2. authenticate GCP bằng OIDC/WIF;
3. `terraform init` với Staging backend;
4. `terraform validate`;
5. first deploy tạo saved plan với `provision_service=false`, review policy rồi apply private seed Job;
6. chạy seed Job để tạo indexes và synthetic data trước khi public service startup;
7. tạo saved plan thứ hai với exact image digest/secret versions và `provision_service=true`;
8. kiểm tra plan không có destructive/unexpected cross-environment/public IAM change;
9. `terraform apply` exact saved service plan;
10. capture service URL, revision, service account và deployed digest;
11. poll `/ready` trong startup budget;
12. so sánh actual service URL với deterministic `PUBLIC_WEB_URL`/`ALLOWED_ORIGINS`;
13. chạy post-deploy smoke/E2E và kiểm tra version/digest;
14. chạy observation window, post-apply drift plan và publish redacted deployment record.

Workflow first deploy là `.github/workflows/first-deploy-staging.yml`. Chỉ dispatch từ `main`, nhập exact
image digest, app version, UTC build time và confirmation chính xác `DEPLOY_STAGING`. Năm GitHub variables
`GCP_SECRET_VERSION_*_STAGING` chỉ chứa numeric version IDs, không chứa secret values.

## 5. First-deploy additional checks

- DNS/HTTPS Cloud Run URL hoạt động.
- React SPA deep links không `404` server-side.
- secure cookie được browser chấp nhận.
- Swagger/OpenAPI tải đúng origin.
- Atlas indexes và transaction suite Pass.
- scale-to-zero/cold start behavior được đo.
- budget/monitoring resources tồn tại.
- public accessibility chỉ mở ở intended service; IAM/service accounts không public ngoài invoker design.
- private seed Job dùng cùng digest, không có public invoker; first seed execution Pass trước actor E2E.

## 6. Smoke order

1. `/health`;
2. `/ready`;
3. version/digest;
4. React root và deep link;
5. Swagger/OpenAPI;
6. Student login/join/learning/submission/report;
7. Teacher login/course/content/assessment/gradebook/report;
8. Admin/Super Admin protected actions/report;
9. logout/refresh/session behavior;
10. negative RBAC/ownership cases.

## 7. Failure decision

| Kết quả | Quyết định |
| --- | --- |
| pre-traffic readiness fail | revision không nhận traffic; investigate |
| API/UI critical smoke fail | rollback ngay |
| version/digest mismatch | rollback và severity High |
| logging/monitoring thiếu nhưng app ổn | không mark stable; sửa trong maintenance window |
| non-critical cosmetic issue | ghi defect, Product Owner quyết định conditional |
| suspected secret/data exposure | revoke/rotate, isolate, incident Critical |

## 8. Rollback trigger

Rollback nếu bất kỳ Must cloud smoke fail, error rate tăng vượt ngưỡng, readiness không ổn định, auth/RBAC
sai, dữ liệu bị ghi sai hoặc digest không khớp.

## 9. Deployment record

```text
deployment_id:
started_at_utc:
completed_at_utc:
git_commit:
image_digest:
terraform_plan_artifact:
cloud_run_service:
cloud_run_revision:
cloud_run_url:
atlas_database:
secret_version_ids:
smoke_report:
monitoring_check:
decision: PASS | ROLLED_BACK | FAILED
prior_revision:
rollback_record:
```

## 10. Post-deployment observation

Theo dõi tối thiểu 15 phút hoặc thời gian đã chốt:

- request/error/latency;
- instance/concurrency/memory;
- Mongo connection/error;
- readiness failures;
- security/auth anomalies;
- budget/quota bất thường.

Chỉ sau observation window và evidence đầy đủ mới đánh dấu revision `STAGING_STABLE`.
