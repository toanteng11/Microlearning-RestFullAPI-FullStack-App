# Workload Identity Revocation Runbook

## 1. Trust contract

Staging token exchange chỉ được chấp nhận khi đồng thời đúng repository name/ID, owner name/ID, subject
environment `staging`, ref `refs/heads/main` và một workflow file nằm trong allowlist Terraform. Production
dùng pool/provider/service account riêng và chỉ allow `promote-production.yml` trong environment
`production`.

Không dùng service-account JSON key. `id-token: write` chỉ tồn tại ở job cần authenticate.

## 2. Positive và negative validation

1. Merge Terraform/WIF source qua protected `main`.
2. Owner apply foundation từ reviewed plan.
3. Thêm ba GitHub repository variables đã nêu trong developer guide.
4. Chạy `Identity Diagnostic` từ `main`; job phải authenticate, project match và account key count bằng `0`.
5. Chạy `Identity Negative Test`; auth action phải fail và assertion job phải Pass.
6. Lưu hai workflow URL cùng sanitized artifacts; không lưu OIDC/access token.

Negative test không được coi là Pass nếu repository variables trống. Workflow kiểm tra precondition trước khi
thử token exchange để tránh false positive.

## 3. Permission review

- `ml-runtime-staging`: không có Run admin/developer, Artifact Registry writer hoặc IAM role.
- `ml-seed-staging`: không public, không deploy, không Production access.
- `ml-e2e-staging`: chỉ nhận secret access cụ thể ở Part 06.
- `ml-github-staging`: không Owner/Editor, không truy cập secret payload; chỉ actAs runtime/seed đã duyệt.
- Staging principal không có binding trên Production-specific resource.

Deployer dùng `roles/iam.securityReviewer` để Terraform đọc/refresh IAM policies mà nó quản lý. Đây là quyền
read-only nhưng có phạm vi quan sát rộng; risk được chấp nhận cho project cá nhân Phase 07 và phải được xem
xét thay bằng custom role ở hardening Part 16. Secret Manager chỉ cấp `viewer`; Admin/Accessor/VersionAdder
bị module validation cấm vì có thể đọc hoặc ghi payload.

Nếu predefined role rộng hơn nhu cầu, ghi risk và tách custom role/bootstrap responsibility trước exit.

## 4. Emergency revoke

Khi nghi ngờ workflow/repository compromise:

1. cancel mọi deployment workflow đang chạy;
2. disable Staging WIF provider hoặc xóa binding `roles/iam.workloadIdentityUser`;
3. disable deployer service account nếu cần containment mạnh hơn;
4. kiểm tra Cloud Audit Logs cho STS, IAM Credentials, Artifact Registry, Cloud Run và Secret Manager;
5. so sánh deployed revision/digest với release register;
6. rotate secret bị ảnh hưởng theo Part 06 runbook, dù WIF bản thân không có private key;
7. sửa trust condition/workflow, plan và review lại;
8. chỉ re-enable sau positive/negative/no-key tests Pass.

Không tạo JSON key để “deploy tạm” khi WIF bị khóa. Nếu cần emergency deployment, dùng owner-operated
break-glass procedure có incident record và backfill IaC.

## 5. Repository rename hoặc workflow move

Đổi owner/repository/workflow path làm condition cũ deny theo thiết kế. Cập nhật immutable IDs và exact
workflow refs trong Terraform, review plan, apply bởi owner, chạy lại positive/negative tests rồi mới xóa trust
cũ.
