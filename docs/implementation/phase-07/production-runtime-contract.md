# Production Runtime Contract

## 1. Mục đích

Tài liệu này quy định hành vi bắt buộc của tiến trình Node.js khi chạy image Production trên Cloud Run.
Contract được dùng chung cho code, Dockerfile, Terraform, smoke test và runbook vận hành.

## 2. Runtime topology

- Một Cloud Run service chạy một Node.js process.
- Process phục vụ REST API, Swagger UI/OpenAPI JSON và React static assets cùng origin.
- MongoDB Atlas là dependency bên ngoài duy nhất bắt buộc để readiness đạt `200`.
- Container không lưu session, upload hoặc dữ liệu nghiệp vụ trên filesystem cục bộ.
- Mỗi revision phải có thể scale ngang mà không cần sticky session.

## 3. Startup contract

Trình tự khởi động bắt buộc:

1. đọc và validate toàn bộ environment variables;
2. khởi tạo logger và gắn metadata version;
3. kết nối MongoDB với timeout hữu hạn;
4. đăng ký middleware, API routes, Swagger và static routes;
5. bind server trên `0.0.0.0:$PORT`;
6. chuyển readiness sang `ready=true`;
7. ghi một structured log `application.started`.

Nếu bước 1-5 thất bại, process phải log lỗi đã redaction và thoát khác `0`; không chạy ở trạng thái cấu hình
một phần.

## 4. Environment contract

| Biến | Bắt buộc | Nguồn | Quy tắc |
| --- | --- | --- | --- |
| `NODE_ENV` | Có | Cloud Run env | Phải là `production` |
| `APP_ENV` | Có | Terraform | `staging` hoặc `production` |
| `PORT` | Có | Cloud Run | Parse được thành port hợp lệ |
| `MONGODB_URI` | Có | Secret Manager | Không log, không trả về client |
| `PUBLIC_WEB_URL` | Có | Terraform | Exact HTTPS Cloud Run origin |
| `ACCESS_TOKEN_SECRET` | Có | Secret Manager | Tối thiểu theo auth contract hiện hữu |
| `AUTH_IDENTITY_PEPPER` | Có | Secret Manager | Khác access-token/classroom-code secret |
| `CLASSROOM_CODE_PEPPER` | Có | Secret Manager | Khác hai secret còn lại |
| `ALLOWED_ORIGINS` | Có | Terraform | Same-origin URL; không dùng `*` |
| `APP_VERSION` | Có | CD | Semver/release identifier |
| `COMMIT_SHA` | Có | CD | Full Git SHA được build |
| `IMAGE_DIGEST` | Có | CD | `sha256:<64-hex>` |
| `BUILD_TIME` | Có | CD | ISO-8601 UTC |
| `LOG_LEVEL` | Có | Terraform | `info` mặc định; không `debug` ở Production |
| `TRUST_PROXY_HOPS` | Có | Terraform | Baseline `1`; phải được client-IP/rate-limit test xác minh |
| `MONGODB_MAX_POOL_SIZE` | Có | Terraform | Baseline `10` mỗi instance |
| `MONGODB_MIN_POOL_SIZE` | Có | Terraform | Baseline `0`, phù hợp scale-to-zero |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | Có | Terraform | Bounded; baseline giữ `10000` |
| `MONGODB_CONNECT_TIMEOUT_MS` | Có | Terraform | Bounded; baseline giữ `10000` |
| `MONGODB_SOCKET_TIMEOUT_MS` | Có | Terraform | Bounded và lớn hơn normal query budget |
| Các limit/feature flag Phase 04-06 | Có | Terraform | Giữ yêu cầu explicit ở `staging`/`production` |

Các biến nghiệp vụ hiện có vẫn được validate bởi schema của ứng dụng. Danh sách thực tế phải được đồng
bộ giữa `.env.example`, runtime schema, `staging-configuration-baseline.md`, Terraform variables và
deployment workflow.

## 5. Health endpoints

| Endpoint | Ý nghĩa | MongoDB | Auth | Response |
| --- | --- | --- | --- | --- |
| `GET /health` | Process còn sống | Không query | Không | `200` nếu event loop/server hoạt động |
| `GET /ready` | Revision sẵn sàng nhận traffic | Có kiểm tra trạng thái kết nối | Không | `200` ready, `503` not ready |
| `GET /api/v1/system/version` | Trace release | Không bắt buộc query | Không | version, commit, digest, build time, environment |

Không trả hostname database, secret, stack trace hoặc full configuration trong ba endpoint này.

## 6. Probe policy

- Startup probe gọi `/ready`, initial delay phù hợp và tổng budget tối thiểu `120s`.
- Liveness probe gọi `/health`; không gọi MongoDB để tránh restart storm khi Atlas gián đoạn.
- Readiness probe của nền tảng chỉ bật sau khi tính năng được xác nhận ổn định; application readiness vẫn là
  contract bắt buộc.
- Probe timeout và failure threshold phải được Terraform quản lý, không chỉnh tay trong Console.

Baseline ban đầu:

| Probe | Period | Timeout | Failure threshold |
| --- | ---: | ---: | ---: |
| Startup | `5s` | `3s` | `24` |
| Liveness | `30s` | `3s` | `3` |

## 7. Shutdown contract

Khi nhận `SIGTERM`:

1. readiness chuyển sang `false`;
2. ngừng nhận request mới;
3. chờ request đang xử lý trong bounded budget;
4. đóng HTTP server;
5. đóng MongoDB connection/pool;
6. flush log rồi thoát `0`.

Cloud Run chỉ cho container một cửa sổ khoảng `10s` sau `SIGTERM` trước `SIGKILL`; application budget phải
nhỏ hơn giới hạn này (baseline `8s`, force-exit trước `10s`) và ghi `application.shutdown_timeout` khi vượt.
Timer `10s` hiện hữu phải được giảm để chừa thời gian cho log/OS cleanup.

## 8. Cloud Run baseline

| Thuộc tính | Staging baseline | Ghi chú |
| --- | --- | --- |
| CPU | `1 vCPU` | Điều chỉnh bằng evidence tải |
| Memory | `512 MiB` | Alert khi thường xuyên vượt 75% |
| Concurrency | `20` | Bảo vệ MongoDB Free và Node.js |
| Min instances | `0` | Chấp nhận cold start ở Staging |
| Max instances | `2` | Giới hạn cost và connection pool |
| Request timeout | `60s` | API dài hơn phải thiết kế lại |
| Container port | `PORT` | Không hard-code ngoài runtime |
| Ingress | `all` cho public app | API vẫn được auth/RBAC bảo vệ |

MongoDB pool baseline là tối đa `10` connection mỗi instance; tổng worst case Staging không vượt `20`.

## 9. Logging contract

Mỗi request log tối thiểu:

- timestamp UTC;
- severity;
- event name;
- request/correlation ID;
- method, normalized route, status, duration;
- actor ID đã pseudonymize khi có;
- environment, service, revision, commit và digest.

Không log token, cookie, authorization header, password, invitation token, MongoDB URI, raw assessment
answer hoặc dữ liệu cá nhân không cần thiết.

## 10. Acceptance checks

- Cấu hình thiếu hoặc sai làm process fail fast.
- `/health` vẫn `200` khi dependency giả lập mất kết nối; `/ready` trả `503`.
- `SIGTERM` đóng server và MongoDB không tạo unhandled rejection.
- Version endpoint khớp Git SHA/image digest của deployment record.
- Hai instance dùng chung database hoạt động mà không cần local state.
- Không có secret trong log startup, error hoặc endpoint phản hồi.
