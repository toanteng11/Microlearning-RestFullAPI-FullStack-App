# IAM And Workload Identity

## 1. Mục tiêu

GitHub Actions triển khai lên Google Cloud bằng token ngắn hạn qua OpenID Connect và Workload Identity
Federation. Không tạo hoặc lưu service-account JSON key.

## 2. Identities

| Identity | Mục đích | Không được phép |
| --- | --- | --- |
| `ml-runtime-staging` | Cloud Run runtime đọc secret/log/kết nối Atlas | deploy, quản trị IAM, push image |
| `ml-seed-staging` | Private seed Job đọc Staging app/seed secrets và ghi synthetic data | public invocation, deploy, Production access |
| `ml-e2e-staging` | Cloud E2E đọc duy nhất synthetic test password | Mongo URI, deploy, IAM, Production access |
| `ml-github-staging` | Terraform/apply và deploy Staging | đọc secret payload, quản trị billing |
| `ml-pr-plan-sa` nếu cần | PR plan/read-only | apply, deploy, mutate IAM |
| `ml-runtime-production` | Production runtime tương lai | dùng cho Staging |
| `ml-github-production` | Protected Production promotion | chạy từ unprotected branch |

Tên thực tế phải tuân `resource-naming-and-labeling.md` và giới hạn của GCP.

## 3. WIF trust boundary

Provider condition phải giới hạn tối thiểu:

- đúng GitHub organization/user `toanteng11`;
- đúng repository `Microlearning-RestFullAPI-FullStack-App`;
- Staging deploy chỉ từ ref `refs/heads/main` hoặc protected environment context đã chốt;
- Production chỉ từ GitHub environment `production` và workflow file cố định;
- không trust mọi repository trong GitHub organization.

Subject/attribute mapping được ghi trong Terraform và có negative test bằng branch không được phép.

Expected GitHub OIDC subjects khi job gắn environment:

```text
repo:toanteng11/Microlearning-RestFullAPI-FullStack-App:environment:staging
repo:toanteng11/Microlearning-RestFullAPI-FullStack-App:environment:production
```

Terraform mapping tối thiểu gồm `google.subject=assertion.sub`, `attribute.repository`, `attribute.ref` và
`attribute.job_workflow_ref`; không dùng actor username làm trust anchor. Condition phải kiểm tra exact
repository, expected subject, protected source ref và expected workflow file. Deployer/E2E identities có
workflow-ref conditions riêng; case khác chữ/tên repository sai phải bị deny.

## 4. Permission model

### Runtime identity

Chỉ cần:

- access đúng Secret Manager secrets ở environment tương ứng;
- ghi log/metric thông qua nền tảng;
- quyền nền tảng tối thiểu cần cho Cloud Run execution.

### Staging deploy identity

Chỉ cần resource permissions để:

- push/read Artifact Registry theo workflow boundary;
- quản lý Cloud Run Staging service;
- act as Staging runtime service account;
- đọc/ghi Terraform state nếu workflow apply;
- quản lý resource Terraform đã chốt;
- không được truy cập secret payload nếu Cloud Run chỉ tham chiếu secret.

Nếu một predefined role rộng hơn cần thiết, ghi risk/debt và kế hoạch custom role hoặc tách bootstrap/apply.

### Seed identity

Chỉ nhận `secretAccessor` trên secret versions cần cho compiled seed command và quyền nền tảng tối thiểu để
Job chạy. Public application runtime identity không nhận quyền đọc seed password; seed identity không được
dùng để deploy hoặc gọi Production resource.

### E2E identity

Chỉ nhận quyền access `ml-stg-seed-demo-password` và các read-only deployment metadata thật sự cần. Workflow
mask password ngay sau retrieval. E2E identity không được access Mongo URI/app signing peppers, chạy
Terraform apply hoặc quản trị Cloud Run.

## 5. GitHub workflow permissions

Mặc định:

```yaml
permissions:
  contents: read
```

Deployment job mới bổ sung:

```yaml
permissions:
  contents: read
  id-token: write
```

Không cấp `write-all`. Pull request từ fork/untrusted context không được nhận deploy token.

## 6. Bootstrap sequence

1. Project Owner đăng nhập `gcloud` bằng account quản trị.
2. Terraform bootstrap tạo pool/provider và service accounts.
3. Bind WIF principalSet vào deploy service account.
4. Configure GitHub non-secret variables: project ID, region, WIF provider, service account email.
5. Chạy workflow identity diagnostics chỉ đọc project metadata.
6. Chạy negative test từ branch/ref không được trust.
7. Sau khi Pass mới cấp apply permissions cần thiết.

Negative cases tối thiểu: feature branch không gắn environment, repository khác, fork PR, environment sai và
workflow không thuộc protected source. Test không được xin token từ code chưa được trust chỉ để “xem có fail”.

## 7. Security verification

- repository/org secrets không chứa JSON key;
- GCP service-account keys list rỗng cho deploy/runtime identities;
- OIDC token chỉ exchange được từ expected repository/ref/environment;
- runtime identity không deploy được;
- deploy identity không đọc secret payload ngoài contract;
- Staging identity không mutate Production resource;
- IAM policy export được lưu dạng redacted evidence.

## 8. Rotation and revocation

- WIF không cần rotate private key; review trust condition mỗi phase/release.
- Khi repository đổi tên/owner, trust phải cập nhật trước deployment.
- Khi nghi ngờ compromise: disable provider/binding, cancel workflows, revoke sessions, audit logs, sau đó
  mới khôi phục.
- Remove obsolete principal bindings ngay khi workflow bị thay thế.

## 9. Evidence

- Workload Identity pool/provider resource names;
- attribute condition đã redaction hợp lý;
- service account names và role matrix;
- successful auth workflow URL;
- negative branch/ref test;
- proof không có active service-account keys.
