# Terraform Infrastructure

## Scope

Thư mục này quản lý Google Cloud foundation của Phase 07. MongoDB Atlas Free vẫn được quản lý bằng
runbook; Terraform không lưu Atlas credential hoặc Secret Manager secret values.

## Layout

- `bootstrap/`: enable API và tạo private versioned GCS state bucket;
- `modules/`: module nội bộ có contract và least-privilege guard;
- `environments/staging/`: Artifact Registry, Staging identities và WIF;
- `environments/production/`: Production identity/WIF definition, không apply trong Phase 07.

## Safe Execution Order

1. chạy `npm run terraform:check`;
2. review `bootstrap/terraform.tfvars.example`, tạo file `terraform.tfvars` local;
3. chạy bootstrap plan/apply bằng Project Owner;
4. chạy `scripts/enable-bootstrap-remote-state.ps1` để migrate bootstrap state;
5. chạy Staging plan, xuất JSON và kiểm tra bằng `npm run terraform:plan:check`;
6. chỉ apply sau khi plan không có delete/public IAM/secret value/service-account key.

Không chạy Production apply trong Phase 07. Không commit `.tfvars`, state, plan binary hoặc credential.
