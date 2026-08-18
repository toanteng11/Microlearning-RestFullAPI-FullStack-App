# Terraform Bootstrap And Recovery Runbook

## 1. Mục tiêu và phạm vi

Runbook này dùng cho bootstrap Terraform state của Phase 07 trong project
`microlearning-platform-502716`. Thao tác bootstrap do project owner thực hiện thủ công; GitHub deployer
không được dùng quyền owner. Phase 07 chỉ apply `bootstrap` và `staging` sau khi plan được review, không apply
root `production`.

## 2. Điều kiện trước khi chạy

1. `gcloud auth list` chỉ ra đúng operator account.
2. `gcloud config get-value project` trả về `microlearning-platform-502716`.
3. Billing/budget vẫn hoạt động và region là `asia-southeast1`.
4. Branch/commit đang review không chứa `.tfstate`, `.tfvars` thật hoặc credential.
5. `npm run terraform:check` Pass; plan policy không có destroy/public IAM/cross-environment finding.
6. Lưu URL PR, commit SHA, operator và thời gian bắt đầu trong evidence record.

## 3. Bootstrap state bucket

```powershell
Set-Location infrastructure/terraform/bootstrap
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init -input=false
terraform plan -input=false -out=bootstrap.tfplan
terraform show -no-color bootstrap.tfplan
terraform apply bootstrap.tfplan
```

Trước apply phải xác nhận plan chỉ enable required APIs và tạo bucket
`microlearning-tfstate-759791798260`. Bucket phải có `uniform_bucket_level_access=true`,
`public_access_prevention=enforced`, versioning bật và `force_destroy=false`.

## 4. Migrate bootstrap state

Từ repository root, chạy:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/enable-bootstrap-remote-state.ps1
```

Script tạo file `backend.tf` đã bị `.gitignore`, sau đó chạy `terraform init -migrate-state`. Khi migrate xong:

1. `terraform state list` vẫn liệt kê đúng bootstrap resources;
2. GCS có object dưới prefix `phase-07/bootstrap`;
3. local `terraform.tfstate*` được xóa sau khi đối chiếu remote state;
4. `git status` không xuất hiện state/backend runtime file.

## 5. Environment state isolation

| Root | Bucket | Prefix | Phase 07 apply |
| --- | --- | --- | --- |
| Bootstrap | `microlearning-tfstate-759791798260` | `phase-07/bootstrap` | Owner only |
| Staging | cùng bucket | `phase-07/staging` | Sau reviewed plan |
| Production | cùng bucket | `phase-07/production` | Không; Phase 08 |

Không copy/move state object giữa các prefix. Không dùng `terraform workspace` thay cho ranh giới này.

## 6. State secret canary

Tạo canary giả, không dùng secret thật:

```powershell
$env:TF_SECRET_CANARY = 'PHASE_07_STATE_CANARY_DO_NOT_STORE'
terraform show -json tfplan > plan.json
node scripts/check-terraform-plan.mjs plan.json plan-policy.json
```

Sau apply, operator tải state vào vị trí tạm an toàn và tìm canary. Kết quả phải bằng `0`; không upload raw
state làm evidence. Chỉ lưu report có số lượng match và state generation/version đã redaction.

## 7. Recovery từ GCS object version

Chỉ recovery khi state bị hỏng/mất và đã mở incident record:

1. khóa mọi workflow apply;
2. ghi object generation hiện tại bằng `gcloud storage ls --all-versions`;
3. chọn generation cuối cùng đã biết là tốt;
4. tải generation vào máy operator, kiểm tra checksum và không chia sẻ file;
5. dùng `terraform state push` chỉ sau review hai bước của chính operator: đọc plan và gõ confirmation;
6. chạy `terraform plan`; expected result là no-op hoặc đúng change đã được incident phê duyệt;
7. xóa bản state tạm và ghi recovery evidence đã redaction.

Không xóa state bucket, tắt versioning hoặc dùng `force-unlock` khi chưa xác minh lock owner. `force-unlock`
chỉ dùng khi chắc chắn không còn apply process đang chạy.

## 8. Stop và rollback

Dừng ngay khi plan có destroy, public IAM, Production mutation, secret canary hoặc resource ngoài inventory.
Không sửa trực tiếp state để “cho plan sạch”. Quay về commit đã biết tốt, tạo plan mới và cập nhật incident/risk
record trước khi thực hiện lại.
