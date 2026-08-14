# Manual Prerequisites

## 1. Mục đích

Đây là danh sách công việc bắt buộc do Project Owner thực hiện hoặc xác nhận trước khi code/deploy Phase 07.
Không đưa credential thật vào evidence, issue, PR hoặc ảnh chụp.

## 2. Workstation prerequisites

| Tool | Phiên bản/policy | Cách xác minh | Evidence |
| --- | --- | --- | --- |
| Git | phiên bản đang được hỗ trợ | `git --version` | text output |
| Node.js | khớp `engines` của repository | `node --version` | text output |
| npm | lockfile compatible | `npm --version` | text output |
| Docker Desktop | Linux containers hoạt động | `docker version` | redacted output |
| Google Cloud CLI | phiên bản hiện hành | `gcloud version` | text output |
| Terraform | version đã pin | `terraform version` | text output |
| MongoDB Database Tools | version compatible với Atlas | `mongodump --version`, `mongorestore --version` | bắt buộc trước Part 13 |

Gate A ngày `2026-08-14` đã xác nhận Git/Node/npm/Docker, `gcloud` và Terraform hoạt động. MongoDB Database
Tools chưa chặn Part 01 nhưng vẫn bắt buộc trước Part 13.

## 3. Google Cloud prerequisites

Project owner phải xác nhận cho project `microlearning-platform-502716`:

1. project mở được và đúng owner/account;
2. billing account đã link;
3. Cloud Run, Artifact Registry, Secret Manager, IAM Credentials, STS, Cloud Build nếu dùng, Logging và
   Monitoring APIs có thể enable;
4. region baseline `asia-southeast1` được chấp nhận;
5. quota Cloud Run/Artifact Registry đủ cho Staging;
6. budget amount, email nhận cảnh báo và escalation owner đã có;
7. không lưu service-account JSON key trên máy hoặc GitHub.

Evidence được phép gồm project ID, billing linked status, budget name, region và account email đã che một
phần. Không chụp billing instrument.

Sau khi cài Google Cloud CLI, chạy và lưu output đã che thông tin không cần thiết:

```powershell
gcloud auth login
gcloud auth application-default login
gcloud config set project microlearning-platform-502716
gcloud config set run/region asia-southeast1
gcloud projects describe microlearning-platform-502716
gcloud billing projects describe microlearning-platform-502716
gcloud services list --enabled --project microlearning-platform-502716
```

`application-default login` chỉ phục vụ bootstrap/plan local có kiểm soát; GitHub Actions vẫn bắt buộc WIF.
Không chạy hoặc lưu `gcloud auth print-access-token` làm evidence.

Sau khi cài Terraform, xác minh:

```powershell
terraform version
terraform -help
```

MongoDB Database Tools không chặn P07-PR01 nhưng phải sẵn sàng trước backup/restore rehearsal:

```powershell
mongodump --version
mongorestore --version
```

## 4. GitHub prerequisites

- Branch protection `main` còn hiệu lực.
- Required checks hiện tại tiếp tục bắt buộc.
- Tạo GitHub Environments `staging` và `production`.
- `staging` có thể auto-deploy từ protected `main`.
- Dự án cá nhân áp dụng `solo-project-governance.md`: Pull Request không yêu cầu independent approval;
  Production chỉ chạy bằng `workflow_dispatch`, exact digest và confirmation phrase.
- Khi chưa có collaborator, Production required reviewer là `APPROVED_NA`; không tạo reviewer giả.
- Environment variables chỉ chứa non-secret identifiers.
- Không tạo long-lived GCP credential secret; dùng OIDC/WIF.
- Repository settings cho workflow permission ở mức read mặc định, từng job xin `id-token: write` khi cần.

## 5. MongoDB Atlas prerequisites

Do credential Atlas từng được trao đổi ngoài secret manager, phải xử lý như đã bị lộ:

1. tạo database user Staging mới với tên không chứa thông tin cá nhân;
2. sinh password dài/ngẫu nhiên;
3. cập nhật Secret Manager qua kênh bảo mật;
4. kiểm tra ứng dụng kết nối bằng user mới;
5. revoke/delete user/password cũ;
6. xác minh old credential không còn hiệu lực;
7. chạy secret scan repository/history theo quy trình hiện có;
8. không ghi connection string vào tài liệu/evidence.

Atlas database Staging phải riêng, ví dụ `microlearning_staging`; chỉ dùng synthetic data.

## 6. Atlas network decision

Atlas Free hiện tại không cung cấp đầy đủ private networking/native backup cho Production. Gate A phải chọn
và ghi một trong hai hướng:

| Phương án | Dùng trong Phase 07 | Điều kiện |
| --- | --- | --- |
| Time-bound public allowlist waiver | Có thể dùng cho synthetic Staging/demo | TLS, least-privilege user, expiry, owner, không dữ liệu thật |
| Static egress/NAT + narrow allowlist | Tốt hơn nhưng có thể phát sinh cost/complexity | được owner duyệt cost |
| Paid Atlas/private connectivity | Production direction | chốt ở Phase 08 trước Go |

Không được dùng `0.0.0.0/0` rồi mô tả là Production-secure. Nếu tạm dùng cho bài demo, waiver phải nêu rõ
rủi ro, thời hạn và kế hoạch đóng.

## 7. Secret bootstrap

Các secret containers được Terraform tạo trước. Project Owner thêm secret versions bằng Console hoặc
`gcloud secrets versions add` từ input an toàn. Danh sách tối thiểu:

- MongoDB URI;
- `ACCESS_TOKEN_SECRET`;
- `AUTH_IDENTITY_PEPPER` dùng cho identity/opaque-token hashing theo contract hiện hữu;
- `CLASSROOM_CODE_PEPPER`;
- seed/E2E password nếu cloud smoke thực sự cần.

Secret evidence chỉ ghi secret resource name và version number, không ghi value.

## 8. Gate A evidence form

```text
Date (UTC):
Decision owner:
Governance mode: SOLO_PROJECT
GCP project access: PASS | FAIL
Billing linked: PASS | FAIL
Budget configured: PASS | FAIL
gcloud installed/authenticated: PASS | FAIL
Terraform installed: PASS | FAIL
Atlas credential rotated and old revoked: PASS | FAIL
Atlas network option + waiver expiry:
Synthetic-only data approved: PASS | FAIL
GitHub environments direction approved: PASS | FAIL
Production deferred to Phase 08 accepted: PASS | FAIL
Decision: APPROVED | REJECTED
```

## 9. Stop conditions

- Credential cũ chưa revoke.
- Billing/project quyền không rõ.
- Atlas chứa dữ liệu thật trong Free/public environment.
- Người thực hiện định dùng service account JSON key.
- Production có auto-deploy, chấp nhận source ngoài protected `main`, cho bypass, hoặc thiếu manual
  confirmation contract theo `solo-project-governance.md`.
- Gate A có bất kỳ Must item `FAIL` hoặc `Pending`.

## 10. Gate A Verification Result

Gate A đã `APPROVED` ngày `2026-08-14`. Bằng chứng sanitized nằm tại
`gate-a-readiness-evidence.md`. Planning PR và post-merge main CI vẫn là activation gate trước Part 01.
