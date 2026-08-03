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

### Student

1. login;
2. xem Dashboard/To Do;
3. join course bằng code hoặc link;
4. mở lesson;
5. làm assessment/submit;
6. xem status/progress/report được phép;
7. logout.

### Teacher

1. login;
2. mở/tạo course test theo fixture policy;
3. xem thành viên;
4. tạo/chỉnh lesson deadline và deadline exception;
5. xem submission/chấm điểm;
6. mở gradebook/ranking/report;
7. logout.

### Admin

1. login;
2. lọc danh sách Student/Teacher/Admin;
3. tạo teacher invitation và kiểm tra link contract;
4. quản trị trạng thái user theo quyền;
5. xem audit/report được phép.

### Super Admin

1. login;
2. truy cập governance chức năng riêng;
3. kiểm tra boundary với Admin;
4. xem report/system status được phép.

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
