# Secret Version Operations Runbook

## Mục tiêu

Tạo và xoay vòng Secret Manager version mà không đưa payload vào Terraform, GitHub variable, command line,
file tạm, log hoặc evidence. Runbook này chỉ chạy sau khi plan/apply secret containers đã được review.

## Thêm initial version

1. Xác nhận `gcloud config get-value project` là `microlearning-platform-502716`.
2. Chạy từ repository root:

```powershell
.\scripts\add-secret-version.ps1 -SecretId ml-staging-mongodb-uri
```

3. Nhập giá trị tại secure prompt. Script chuyển payload trực tiếp vào `gcloud ... --data-file=-` qua stdin.
4. Chỉ ghi lại `secretId` và version number trả về; không chụp màn hình lúc nhập.
5. Lặp lại cho bốn secret còn lại.

## Initial inventory Staging

| Secret ID | Runtime | Seed Job | Cloud E2E |
| --- | --- | --- | --- |
| `ml-staging-mongodb-uri` | Accessor | Accessor | Không |
| `ml-staging-access-token-secret` | Accessor | Accessor | Không |
| `ml-staging-auth-identity-pepper` | Accessor | Accessor | Không |
| `ml-staging-classroom-code-pepper` | Accessor | Accessor | Không |
| `ml-staging-seed-demo-password` | Không | Accessor | Accessor |

Deployer chỉ có quyền xem metadata container; không có `secretAccessor`. Cloud Run/Terraform dùng exact numeric
version. Alias `latest` bị cấm trong Production-like deployment.

## Rotation và rollback

1. Tạo credential upstream mới nếu secret là Mongo URI.
2. Thêm version mới bằng script.
3. Cập nhật approved version number và deploy revision mới.
4. Smoke auth/database, quan sát log redaction và giữ revision cũ trong rollback window.
5. Revoke credential upstream cũ, kiểm tra negative-connect, rồi disable old version sau khi hết window.

Không destroy version đang được revision ổn định hoặc rollback target tham chiếu.
