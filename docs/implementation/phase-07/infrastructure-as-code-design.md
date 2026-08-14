# Infrastructure As Code Design

## 1. Quyết định

Phase 07 dùng Terraform để quản lý Google Cloud resources và deployment configuration. Console chỉ dùng cho
bootstrap hoặc quan sát; mọi thay đổi lâu dài phải quay lại code.

## 2. Repository layout mục tiêu

```text
infrastructure/
  terraform/
    bootstrap/
      versions.tf
      variables.tf
      main.tf
      outputs.tf
    modules/
      artifact-registry/
      cloud-run-service/
      iam/
      monitoring/
      secret-containers/
      workload-identity/
    environments/
      staging/
        backend.tf
        versions.tf
        providers.tf
        main.tf
        variables.tf
        terraform.tfvars.example
        outputs.tf
      production/
        backend.tf
        versions.tf
        providers.tf
        main.tf
        variables.tf
        terraform.tfvars.example
        outputs.tf
```

Không commit `.tfvars` chứa project secrets hoặc state files.

## 3. Bootstrap boundary

Bootstrap tạo hoặc chuẩn bị:

- GCS bucket remote state;
- bucket versioning và public access prevention;
- state object prefix theo environment;
- Artifact Registry repository nếu cần trước CI;
- deploy service account và WIF bootstrap permissions.

Bootstrap được chạy thủ công bởi project owner, có log/evidence riêng. Sau bootstrap, CD dùng identity ngắn hạn.
Bootstrap root khởi tạo state bucket bằng local state trong một cửa sổ ngắn, sau đó phải migrate chính
bootstrap state vào GCS prefix `bootstrap` và xóa local state an toàn. Không commit bootstrap state.

## 4. Managed resources

Terraform quản lý tối thiểu:

- required Google APIs;
- Artifact Registry Docker repository;
- runtime/deployer service accounts;
- IAM bindings theo least privilege;
- Workload Identity Pool/Provider và attribute conditions;
- Secret Manager secret containers/IAM, không quản lý secret values;
- Cloud Run services và revision configuration;
- private on-demand Cloud Run Staging seed job using the same exact image digest;
- private GCS bucket/lifecycle/IAM for synthetic backup rehearsal, separate from Terraform state;
- Monitoring notification channel reference, dashboard, uptime check và alert policies;
- budget notification integration nếu quyền billing cho phép;
- labels và outputs.

MongoDB Atlas Free hiện hữu không được đưa vào Terraform trong Phase 07 để tránh import/rủi ro credential.
Atlas được quản trị bằng runbook và evidence; hướng IaC cho Atlas là backlog có owner.

## 4.1 Required Google APIs

| API | Requirement |
| --- | --- |
| `run.googleapis.com` | Cloud Run service/job |
| `artifactregistry.googleapis.com` | image repository |
| `secretmanager.googleapis.com` | runtime/test secrets |
| `iam.googleapis.com` | service accounts/IAM |
| `iamcredentials.googleapis.com` | short-lived service-account credentials |
| `sts.googleapis.com` | Workload Identity token exchange |
| `serviceusage.googleapis.com` | API management/bootstrap |
| `cloudresourcemanager.googleapis.com` | project metadata/IAM operations |
| `storage.googleapis.com` | Terraform state and synthetic backup buckets |
| `logging.googleapis.com` | Cloud Logging |
| `monitoring.googleapis.com` | dashboard/uptime/alerts |
| `billingbudgets.googleapis.com` | budget resource when billing permission allows |

Cloud Build API không phải baseline vì image được build trong GitHub Actions. Nếu một provider/action yêu cầu
API ngoài danh sách, PR phải giải thích permission/cost và cập nhật inventory.

## 5. State design

- Backend là GCS, bucket bật versioning.
- Prefix tách `staging` và `production`.
- Không dùng local state trong CI.
- State bucket không public; quyền chỉ cho bootstrap admin và deploy identity cần thiết.
- State không chứa secret value. Resource secret chỉ tham chiếu Secret Manager version.
- State backup/restore procedure được ghi trong runbook.

## 6. Provider and module policy

- Terraform CLI và providers phải có version constraints.
- Commit `.terraform.lock.hcl`.
- Module nội bộ pin theo repository commit vì cùng monorepo.
- Tránh resource `null_resource`/shell imperative nếu provider hỗ trợ declarative resource.
- Variable phải có type, description, validation và sensitive flag khi phù hợp.
- Output chỉ xuất resource name/URL/identity; không output secret.

## 6.1 Module contracts

| Module | Input chính | Output chính | Guard bắt buộc |
| --- | --- | --- | --- |
| `artifact-registry` | project, region, repository, labels | repository URL/name | private IAM, cleanup protection |
| `iam` | environment, service names | runtime/deployer SA emails | no keys, least privilege |
| `workload-identity` | owner/repo/ref/environment claims | provider resource name | exact attribute condition |
| `secret-containers` | secret names, runtime SA | secret resource/version references | no secret value/output |
| `cloud-run-service` | exact image ref, env, secret refs, sizing/probes | service URI/revision/service name | digest validation, public invoker intentional, bounded scale |
| `cloud-run-seed-job` | same image ref, runtime env/secret refs, command override | job name | no public invoker, task count 1, no schedule, environment guard |
| `monitoring` | service/environment/notification target | dashboard/check/policy IDs | owner/runbook labels |
| `backup-bucket` | project number, retention days, operator principals | bucket name | public prevention, uniform access, no state reuse |

Cloud Run module dùng `google_cloud_run_v2_service`, explicit ingress, runtime service account, request-based
billing baseline, startup/liveness probes, min/max scaling, concurrency, timeout, env/secret mapping và labels.
Production root bật deletion protection khi resource thực sự được provision trong Phase 08.

## 7. Image promotion model

Cloud Run module nhận biến `image_ref` bắt buộc ở dạng:

```text
<region>-docker.pkg.dev/<project>/<repository>/<image>@sha256:<digest>
```

Workflow không được truyền mutable tag. `terraform plan` phải cho thấy chính xác revision image thay đổi.

## 7.1 Canonical service URL bootstrap

Terraform dùng project number, service name và region để tính deterministic Cloud Run URL trước khi tạo
revision, sau đó gán URL đó cho `PUBLIC_WEB_URL` và `ALLOWED_ORIGINS`. Sau apply, output `service_uri` phải
được so sánh với canonical URL; mismatch làm deployment fail để tránh CORS/invitation-link drift. Không dùng
self-reference của Cloud Run resource trong chính container environment.

## 8. Plan/apply workflow

### Pull Request

1. `terraform fmt -check -recursive`;
2. `terraform init -backend=false` cho module validation;
3. `terraform validate`;
4. security/static analysis;
5. Staging plan khi identity/read-only access khả dụng;
6. upload plan summary không chứa sensitive data.

### Staging apply

1. CI required checks Pass trên `main`;
2. build/push image và resolve digest;
3. authenticate bằng WIF;
4. init remote backend;
5. plan với exact digest;
6. apply approved/non-interactive plan;
7. ghi outputs và deployment record;
8. cloud smoke; rollback nếu fail.

### Production apply

Chỉ Phase 08 thực thi sau protected environment approval; digest phải trùng digest đã xác nhận trên Staging.

## 9. Drift policy

- Không chỉnh Cloud Run/IAM/monitoring thủ công sau bootstrap.
- Scheduled/manual drift plan chạy ít nhất trước mỗi release.
- Drift quan trọng làm deployment dừng cho đến khi reconcile.
- Emergency console change phải có incident record và PR backfill trong một ngày làm việc.

## 10. Destructive-change controls

Plan bị block nếu có:

- xóa Cloud Run service ngoài approved teardown;
- xóa Secret Manager container hoặc runtime service account;
- thay state bucket/prefix;
- mở IAM public ngoài intended invoker binding;
- tăng max instances/cost đáng kể mà không có approval;
- thay Production resource từ workflow Staging.

## 11. Verification

- clean clone chạy `fmt`, `validate` và static scan;
- plan lần hai sau apply không có drift ngoài known computed fields;
- outputs khớp Cloud Run URL/service account/repository;
- state không chứa canary secret;
- rollback plan về prior digest không thay resource ngoài revision config.
