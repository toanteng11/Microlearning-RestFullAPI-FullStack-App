# Smoke And E2E Strategy

## 1. Mục tiêu

Chứng minh exact Cloud revision hoạt động end-to-end cho bốn role, trên browser thật và MongoDB Atlas, đồng
thời kiểm tra các đặc trưng chỉ xuất hiện sau deployment như HTTPS, proxy, cookie, deep link và scale.

## 2. Test layers

| Layer | Nơi chạy | Mục tiêu |
| --- | --- | --- |
| Container smoke | CI/local Docker | image có thể start và phục vụ all routes |
| Infrastructure smoke | sau Terraform apply | URL, IAM, secret, probe, version |
| API cloud smoke | Staging | auth/RBAC/core APIs với Atlas |
| Browser E2E | Staging | workflows thật và responsive UI |
| Operational smoke | Staging | logs, metrics, alert, rollback hook |

## 3. Test identities

Tạo bốn synthetic account dành riêng Staging:

- `SUPER_ADMIN`;
- `ADMIN`;
- `TEACHER`;
- `STUDENT`.

Password nằm trong protected test secret, không hard-code. Seed phải idempotent hoặc reset có guard
`APP_ENV=staging` và database name allowlist.

Seed chạy bằng private on-demand Cloud Run Job cùng application digest. GitHub workflow chỉ yêu cầu thực thi
Job và đọc execution status; không tải MongoDB URI về runner. Dedicated E2E WIF identity chỉ được lấy
synthetic test password từ Secret Manager, mask ngay trước browser run. `E2E_WEB_URL` và `E2E_API_URL` cùng
trỏ Cloud Run service URL trong same-origin suite.

## 4. Critical browser journeys

Chiến lược có hai lớp: full mutation journey tiếp tục chạy trong required CI bằng disposable local test
database; Cloud Staging suite dùng representative read-only journey trên idempotent synthetic fixture để có
thể rerun an toàn. Cloud mutation chỉ được bật khi record có unique run ID và guarded cleanup được chứng
minh.

### Student

1. Cloud: login, Dashboard/To Do, progress/report, concurrent tabs và logout;
2. CI mutation: join bằng code/link, lesson, assessment save/submit và result.

### Teacher

1. Cloud: login, owned course progress, gradebook/ranking/report, foreign ownership denial và logout;
2. CI mutation: tạo nội dung/assessment, deadline exception, submission review/chấm/regrade.

### Admin

1. Cloud: login, tách danh sách Student/Teacher/Admin, governance/audit report và logout;
2. CI mutation: teacher invitation và user state/role governance.

### Super Admin

1. Cloud: login, admin governance, role boundary và system/report access;
2. CI mutation: protected Admin role/state transition invariants.

## 5. Negative journeys

- Student gọi Teacher/Admin endpoint -> `403`.
- Actor truy cập resource course không thuộc quyền -> `403/404` theo anti-enumeration contract.
- Unauthenticated protected route -> login/`401`.
- Expired/revoked refresh token -> session kết thúc đúng.
- Invalid course code/link -> error UI rõ, không join.
- Duplicate submit/join concurrent -> không tạo duplicate.
- API unknown route trả JSON, SPA deep link vẫn mở.

## 6. Cloud-specific checks

- HTTPS và secure cookie;
- same-origin API không CORS error;
- forwarded protocol/IP xử lý đúng;
- direct SPA reload;
- Cloud Run cold start trong startup budget;
- version endpoint khớp digest;
- scale 2 instances không làm sai session/data;
- log có request ID và không chứa credential.

## 7. Data isolation and cleanup

- Test run có unique prefix/run ID.
- Không phụ thuộc thứ tự test.
- Cleanup chỉ xóa synthetic records thuộc run ID.
- Failure vẫn cố gắng cleanup nhưng giữ diagnostic references.
- Không dùng global destructive reset trên database ngoài allowlist.

## 8. Flake policy

- Retry chỉ cho browser/network action được định danh, không che assertion nghiệp vụ.
- Một test chỉ Pass sau retry phải ghi flaky signal.
- Quarantine không áp dụng cho critical auth/RBAC/data journeys.
- Screenshot/video/trace chỉ upload khi phù hợp và phải redaction data.

## 9. Pass criteria

- Tất cả Must smoke/API/browser cases Pass.
- `0` critical/high functional or security defects.
- Không CORS/cookie/deep-link/version mismatch.
- Test cleanup hoàn tất.
- JUnit/Playwright report gắn commit, digest, revision và URL.
