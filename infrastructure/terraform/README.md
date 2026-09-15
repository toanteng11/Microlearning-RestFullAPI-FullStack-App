# Terraform Infrastructure

## Scope

Thư mục này quản lý Google Cloud foundation của Phase 07. MongoDB Atlas Free vẫn được quản lý bằng
runbook; Terraform không lưu Atlas credential hoặc Secret Manager secret values.

## Layout

- `bootstrap/`: enable API và tạo private versioned GCS state bucket;
- `modules/`: module nội bộ có contract và least-privilege guard;
- `environments/staging/`: Artifact Registry, Staging identities và WIF;
- `environments/production/`: Phase 08 Production state, identity/WIF, runtime, secret-container and monitoring contract. Provision flags default to `false`; Part 08 only creates a reviewed plan.

## Safe Execution Order

1. chạy `npm run terraform:check`;
2. review `bootstrap/terraform.tfvars.example`, tạo file `terraform.tfvars` local;
3. chạy bootstrap plan/apply bằng Project Owner;
4. chạy `scripts/enable-bootstrap-remote-state.ps1` để migrate bootstrap state;
5. chạy Staging plan, xuất JSON và kiểm tra bằng `npm run terraform:plan:check`;
6. chỉ apply sau khi plan không có delete/public IAM/secret value/service-account key.

Không chạy Production apply trước G5 và protected Part 10 workflow. Không commit `.tfvars`, state, plan binary, raw plan JSON hoặc credential.
