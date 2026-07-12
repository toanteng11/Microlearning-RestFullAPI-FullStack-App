# Phase 01 Risk And Issues

## 1. Risk Register

| ID | Rủi ro | Probability/Impact | Mitigation | Residual status |
| --- | --- | --- | --- | --- |
| P01-R01 | Tool/dependency dư thừa | Medium/Medium | ADR và purpose review | Controlled |
| P01-R02 | Node version khác local/Docker/CI | Medium/High | Pin `24.14.0` ở mọi runtime | Controlled |
| P01-R03 | Local và container behavior lệch nhau | Medium/High | Test cả npm dev và Compose | Controlled |
| P01-R04 | Swagger lệch implementation | Medium/High | Same-PR update và parser test | Controlled |
| P01-R05 | Secret lọt Git/image/log | Medium/High | Ignore, redaction, audit/review, Gitleaks secret scan | Controlled; remote scan evidence pending |
| P01-R06 | CI chậm hoặc bị bỏ qua | Medium/Medium | npm cache và required checks | Branch protection configured; secret scan required check pending until first remote run |
| P01-R07 | Over-engineering | Medium/Medium | Modular Monolith, không queue/K8s | Controlled |
| P01-R08 | DevOps learning curve kéo dài | High/Medium | Tài liệu area-specific và command evidence | Monitor Phase 02 |

## 2. Issues Đã Gặp

| ID | Issue | Root cause | Resolution | Status |
| --- | --- | --- | --- | --- |
| P01-I01 | `.git` rỗng, Git không nhận repository | Chưa khởi tạo metadata | `git init -b main` | Closed |
| P01-I02 | npm registry/cache bị sandbox chặn | Windows/AppData permission | Chạy approved npm access, lock dependencies | Closed |
| P01-I03 | MongoDB Compose không bind được `27017` | Host đã có MongoDB local | Không publish database host port | Closed |
| P01-I04 | Web test thiếu `VITE_API_BASE_URL` | Test env chưa khai báo public config | Thêm Vitest test env | Closed |
| P01-I05 | Swagger/browser visual automation không chạy | Browser runtime bị Windows chặn `AppData` | Giữ automated/HTTP evidence; mở manual browser action | Open evidence |
| P01-I06 | Repository chưa có GitHub remote | External repository chưa được cung cấp | Remote đã được cấu hình và push lên GitHub | Closed |
| P01-I07 | Secret Scan chưa có trong CI | Phase 01 CI ban đầu chỉ có quality gate và dependency audit | Thêm `Secret scan` job bằng Gitleaks Action | Closed; remote evidence pending |

## 3. Residual Risks Cho Phase 02

- Chưa có auth threat model và token storage decision.
- Chưa có rate limit/session revocation/password hashing implementation.
- Detailed system health đang public-safe tạm thời; cần Admin/DevOps protection khi có RBAC.
- Secret scan đã cấu hình nhưng cần Pull Request run để có evidence và để GitHub cho chọn `Secret scan` làm required check.

## 4. Escalation Rule

Critical/High security, secret exposure, data integrity hoặc CI bypass phải chặn merge. Medium risk có thể chấp nhận khi có owner, deadline và decision record; không được để “accepted” vô thời hạn.
