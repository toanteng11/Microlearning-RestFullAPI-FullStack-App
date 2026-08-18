# Bootstrap Runbook

Bootstrap là thao tác owner-only và ban đầu dùng local state đã được `.gitignore`.

```powershell
Copy-Item terraform.tfvars.example terraform.tfvars
terraform init
terraform plan -out bootstrap.tfplan
terraform show -json bootstrap.tfplan > bootstrap.tfplan.json
node ../../../scripts/check-terraform-plan.mjs bootstrap.tfplan.json
terraform apply bootstrap.tfplan
../../../scripts/enable-bootstrap-remote-state.ps1
```

Script cuối copy `backend.tf.template` thành ignored `backend.tf`, sau đó chạy `terraform init
-migrate-state`. Xác minh state object có prefix `phase-07/bootstrap` trước khi xóa local backup do
Terraform tạo. Không dùng `force-unlock` nếu chưa xác định owner của lock.
