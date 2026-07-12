# Deployment Environment Matrix

## Mục Đích

Environment tách biệt giúp team kiểm tra thay đổi mà không ảnh hưởng người dùng/dữ liệu thật. Một environment không chỉ khác `NODE_ENV`; nó khác data, secret, domain, quyền, resource, deploy policy và monitoring.

## Ma Trận Environment

| Thuộc tính | Local Development | CI/Test | Staging | Production |
| --- | --- | --- | --- | --- |
| Mục đích | Code/debug/integration của Developer | Tự động lint/test/build/scan | QA, UAT, demo, integration/cloud verification | Người dùng thật/release chính thức |
| Data | Synthetic seed/Local data | Ephemeral fixture hoặc test DB | Synthetic/sanitized test data ưu tiên | Dữ liệu thật theo privacy/retention |
| Frontend URL | `localhost` | Temporary runner URL nếu cần | Staging domain | Production domain HTTPS |
| API URL | `localhost` | Ephemeral/internal | Staging API domain | Production API domain |
| Database | Local MongoDB container | Ephemeral/isolated test DB | Staging MongoDB riêng | Production MongoDB riêng, backup |
| Secret | Local developer secret không commit | CI secret scope tối thiểu | Staging secret riêng | Production secret riêng, restricted access |
| Deploy source | Developer command/Compose | Pipeline only | CI/CD artifact/image | Approved CI/CD artifact/image only |
| Approval | Không bắt buộc | Không áp dụng | Theo team policy | Bắt buộc theo release policy |
| Access | Developer | CI runtime | Project team/reviewer | End user; operator least privilege |
| Logging | Console/local tool | CI log/artifact | Central log/monitoring | Central log/monitoring/alert/retention |
| Backup | Không bắt buộc, reset được | Không cần persistent | Snapshot trước demo/change rủi ro nếu có | Scheduled backup + pre-release backup theo policy |
| Availability | Best effort | Ephemeral | Sprint/demo target | Production availability target theo NFR |

## Quy Tắc Tách Biệt Environment

- Không dùng Production `MONGODB_URI`, JWT secret, storage credential hoặc deploy token ở Local/CI/Staging.
- Không dùng Production data cho Staging/CI trừ khi có approval privacy, masking và kiểm soát access rõ ràng.
- Không dùng chung invitation/auth token secret giữa Staging và Production.
- Domain/CORS/API base URL phải explicit theo environment; không cho phép wildcard Production chỉ để xử lý lỗi cấu hình.
- Artifact/image có thể giống nhau giữa Staging và Production, nhưng configuration/secret/deployment target phải khác nhau.
- Chỉ CI/CD identity được phép deploy Staging/Production theo permission policy; không deploy Production từ máy cá nhân bằng credential dùng chung.

## Configuration Inventory

| Logical key | Class | Local | CI/Test | Staging | Production | Ghi chú |
| --- | --- | --- | --- | --- | --- | --- |
| `APP_ENV` | Config | Required | Required | `staging` | `production` | Hiển thị/trace environment, không thay thế security. |
| `APP_VERSION` / `COMMIT_SHA` | Metadata | Optional | Generated | Required | Required | Dùng version endpoint/startup/deployment trace. |
| `PORT` | Config | Required | Required | Required | Required | Runtime platform có thể inject. |
| `PUBLIC_WEB_URL` | Config | Required | Optional | Required | Required | Dùng CORS/link generation khi cần. |
| `API_BASE_URL` public frontend equivalent | Public config | Required | Required | Required | Required | Chỉ URL API, không phải secret. |
| `MONGODB_URI` | Secret | Required | Required | Required | Required | Database riêng từng environment. |
| Access/refresh token signing secrets | Secret | Required | Required | Required | Required | Tách per environment, có rotation plan. |
| `ALLOWED_ORIGINS` | Security config | Required | Required | Required | Required | Exact trusted origins. |
| Storage bucket/region | Config | Optional | Optional | Required nếu upload | Required nếu upload | Bucket/path tách environment. |
| Storage runtime credential | Secret/identity | Local credential | CI scoped identity | Staging identity | Production identity | Least privilege; không gửi frontend. |
| Monitoring DSN/endpoint | Secret/config | Optional | Optional | Required direction | Required | Không gửi PII/secret. |
| Log level | Config | `debug` phù hợp | `info` | `info` | `info`/`warn` policy | Production không console debug nhạy cảm. |
| Feature flag | Config | Optional | Optional | Optional | Controlled | Có owner/default/rollback plan. |

## Data Policy Theo Environment

| Data action | Local/CI | Staging | Production |
| --- | --- | --- | --- |
| Seed Student/Teacher/Admin | Synthetic account | Synthetic/sanitized account | Chỉ qua process quản trị hợp lệ |
| Teacher invitation | Test token | Test token, manual link test | Theo business process và audit |
| File/media | Dummy file/test media | Sanitized, size bounded | Private storage/policy đầy đủ |
| Backup restore test | Safe reset/fixture | Isolated target, approval nếu data nhạy cảm | Chỉ runbook/recovery authorized |
| Analytics/log review | Không log secret | Mask PII phù hợp | Retention/access policy đầy đủ |

## Promotion Flow

```text
Commit/Merge -> CI artifact/image
      -> Staging deploy + health/smoke/QA evidence
      -> approval + release record
      -> Production deploy of same immutable artifact/image
      -> production health/smoke/monitoring
```

Không rebuild lại từ branch khác ngay trước Production. Nếu cần thay đổi source sau Staging test, đó là release candidate mới và phải quay lại CI/Staging validation.

## Environment Readiness Checklist

| Check | Staging | Production |
| --- | --- | --- |
| Domain/TLS/API base URL/CORS đúng | Must | Must |
| Runtime secret/config được inject và không lộ log | Must | Must |
| MongoDB connection, index/backup direction | Must | Must |
| Object storage private access nếu upload | Must khi áp dụng | Must khi áp dụng |
| `/health` và version endpoint | Must | Must |
| API/UI smoke Student/Teacher/Admin | Must | Must |
| Monitoring/log receipt | Should | Must |
| Rollback artifact/runbook | Must | Must |
| Backup/pre-release recovery decision | Should | Must/Should theo risk |
| Production approval/release note | N/A/Policy | Must |

## Liên Kết

- Secret policy: `configuration-secret-management.md`.
- Pipeline promotion: `ci-cd-pipeline.md`.
- Cloud release: `cloud-deployment.md` và `deployment-runbook.md`.
