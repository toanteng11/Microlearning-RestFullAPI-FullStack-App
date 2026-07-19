# Configuration And Secret Management

## Mục Đích

Tài liệu này quy định cách quản lý configuration và secret để ứng dụng chạy đúng ở từng environment mà không làm lộ thông tin nhạy cảm. Sai secret/config có thể làm lộ database, cho phép token giả, mở CORS quá rộng hoặc deploy nhầm environment; vì vậy đây là phần bắt buộc của DevOps, không phải việc “để sau”.

## Accepted Cloud Secret Baseline

| Nơi quản lý | Dữ liệu được phép chứa | Quy tắc |
| --- | --- | --- |
| Google Secret Manager | `MONGODB_URI`, JWT/session signing material và runtime credential nhạy cảm | Cloud Run service account chỉ có `secretAccessor` trên đúng secret cần dùng; tách Staging/Production. |
| GitHub Environments/Actions | Non-secret deploy metadata và bootstrap reference tối thiểu | Ưu tiên Workload Identity Federation; không lưu service-account JSON key dài hạn. |
| Cloud Run environment variables | Config không nhạy cảm như environment, log level, public URL, TTL/rate settings | Secret phải được map từ Secret Manager, không paste plain value vào revision config nếu tránh được. |
| MongoDB Atlas | Database user/role/network policy | Password/URI chỉ đi qua Secret Manager; không ghi vào BA, runbook, screenshot hoặc GitHub log. |

Firebase configuration và Firebase secret không thuộc baseline. Free Tier/plan limit của Secret Manager phải được kiểm tra lại ở Phase 07; chỉ giữ active secret versions cần thiết và phá hủy version cũ sau rotation grace đã phê duyệt.

## Phân Loại

| Loại | Ví dụ | Có thể vào frontend bundle? | Có thể commit repository? | Cách quản lý |
| --- | --- | --- | --- | --- |
| Public configuration | API base URL, app version, public environment name | Có | Có thể dưới dạng giá trị không nhạy cảm/template | Build config/platform variable. |
| Runtime application config | Port, log level, feature flag, allowed origin | Không cần thiết | Default/template không nhạy cảm | Environment variable/config service. |
| Secret | MongoDB URI, JWT signing key, storage credential, monitoring auth DSN nếu sensitive | Không | Không | Secret manager/protected CI environment/runtime identity. |
| Deployment credential | Registry/cloud deploy token, IaC credential | Không | Không | CI/CD protected credential/short-lived identity. |
| User data | Password, access token, submission content | Không | Không | Database/storage, không coi là deployment config. |

Quy tắc tuyệt đối: mọi biến public frontend (`VITE_*`, `REACT_APP_*` hoặc prefix tương đương) phải được xem là **public**. Không có tên biến “trông bí mật” nào khiến secret an toàn trong browser bundle.

## Secret Inventory

| Secret / protected value | Consumer | Quyền tối thiểu | Rotation / lifecycle |
| --- | --- | --- | --- |
| MongoDB connection URI | Backend runtime, backup job nếu có | Read/write database theo role tách biệt khi khả thi | Rotate khi compromise/personnel change/policy; test connection sau rotate. |
| Access token signing secret/key | Backend runtime | Chỉ API auth component | Rotate theo policy; cần strategy token invalidation/key version. |
| Refresh token signing secret/key | Backend runtime | Chỉ auth/session component | Tách với access token secret; rotate theo policy. |
| Object storage runtime identity/credential | Backend upload/download service | Bucket/prefix/action cần thiết | Prefer runtime identity/short-lived credential; revoke khi không dùng. |
| CI registry credential | CI publish/pull artifact | Push/pull scope cần thiết | Protected; rotate/revoke khi pipeline/user compromise. |
| CI cloud deploy credential | CI deploy job | Environment-specific deploy permission | Production credential protected/approval-gated; audit usage. |
| Monitoring/error tracking credential | Runtime/CI | Ingest-only nếu provider hỗ trợ | Không log value; rotate theo vendor policy. |
| Backup encryption/storage credential | Authorized backup/restore operator/job | Backup scope only | Store separate from app credential; test restore after change. |

## Secret Lifecycle

```text
Create/obtain secret
  -> store in approved secret system
  -> grant least-privilege consumer/environment access
  -> inject at runtime or protected CI job
  -> verify health/smoke without printing value
  -> rotate/revoke when scheduled or incident occurs
  -> record owner, last rotation and dependent services
```

| Step | Requirement |
| --- | --- |
| Create | Không dùng giá trị yếu/default/commit sample secret làm Production secret. |
| Store | Không commit `.env` thật; không paste secret vào ticket/chat/document/screenshot. |
| Access | Chỉ service account/job/operator cần thiết được read/use; access phải revocable. |
| Inject | API đọc runtime environment/secret mount/identity; không bake secret vào Docker layer. |
| Verify | Chỉ xác minh presence/health, không echo secret trong pipeline/startup log. |
| Rotate | Cần owner, thời điểm, dependency list, rollback/dual-key plan nếu token signing key. |
| Revoke | Revoke ngay khi leak/suspicion/user offboarding; redeploy/restart service nếu cần. |

## `.env` Và Configuration Template Policy

| File/asset | Được commit? | Nội dung |
| --- | --- | --- |
| `.env.example` | Có | Key name, safe placeholder, description; không giá trị thật. |
| `.env` | Không | Local secret/config của từng Developer. |
| `.env.staging`, `.env.production` thật | Không | Secret/config của environment; quản lý ngoài repository. |
| `config-schema` / validation code | Có | Danh sách key bắt buộc, type, default safe, error message không lộ secret. |
| IaC secret reference | Có nếu không chứa value | Reference/identifier; value vẫn ở secret store. |

Application Backend phải fail-fast với message an toàn khi thiếu config bắt buộc, ví dụ: `Required configuration MONGODB_URI is missing`. Message không được in giá trị secret.

## Configuration Validation

| Category | Check lúc start/deploy | Ví dụ failure |
| --- | --- | --- |
| Environment identity | `APP_ENV` hợp lệ và khớp deployment target | Production container chạy với Staging config. |
| URL/origin | `PUBLIC_WEB_URL`, API base URL, `ALLOWED_ORIGINS` parse được/allow exact origin | Browser bị CORS hoặc link invitation sai domain. |
| Auth | Signing secret tồn tại, TTL hợp lệ, access/refresh secret không bị dùng chung trái policy | Login/refresh unsafe hoặc fail. |
| Database | URI có mặt, TLS/policy valid, connection check không log URI | API start “healthy giả” khi DB lỗi. |
| Storage | Bucket/region/policy/identity khả dụng khi upload release | Upload success nhưng media public hoặc orphan. |
| Observability | Log level/DSN valid nếu enabled | Không có log/metric sau release. |
| Build metadata | Version/commit/environment có trong `/version`/startup log | Không trace được bản deploy. |

## Access Control Matrix

| Action | Developer | QA | DevOps | Technical Lead | CI/CD identity |
| --- | --- | --- | --- | --- | --- |
| Create/update Local `.env` | Allowed | Allowed for test tools | Allowed | Allowed | N/A |
| View Staging application secret | Need-to-know | Normally no | Allowed | Break-glass/approval | Use only |
| View Production application secret | Normally no | No | Restricted/approved | Break-glass/approval | Use only |
| Use Production deploy credential | No | No | Controlled | Approval policy | Allowed only protected deploy job |
| Rotate secret | C | I | R | A | Executes automation if defined |
| Audit secret access | I | I | R | A | Provider audit trail |

## Incident Response Khi Lộ Secret

1. Không paste lại secret vào log/ticket/chat để “xác nhận”.
2. Thông báo Technical Lead/DevOps theo incident channel, xác định scope/environment/dependency.
3. Revoke/rotate secret bị nghi ngờ; cập nhật secret store/CI/runtime, rồi redeploy/restart an toàn.
4. Invalidate token/session/key hoặc database credential liên quan theo impact assessment.
5. Kiểm tra access log, pipeline log, repository history, artifact/image và monitoring để đánh giá exposure.
6. Ghi incident, root cause và prevention action; bổ sung secret scanning/rule nếu cần.

## Acceptance Checklist

- Repository có `.env.example`/configuration schema nhưng không có secret thật.
- Staging/Production mỗi environment dùng secret riêng, CORS/domain/database/storage riêng.
- CI/CD log không echo secret; Docker image không chứa secret layer.
- Secret owner, access policy, rotation/revocation process và break-glass contact được ghi nhận ngoài public documentation nếu cần.
- Health/version/smoke test pass sau mỗi thay đổi config/secret quan trọng.
