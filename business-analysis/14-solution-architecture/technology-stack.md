# Technology Stack

## Mục Đích

Tài liệu này ghi nhận công nghệ mục tiêu, vai trò, mức độ quyết định và tiêu chí chọn lựa. Không phải mọi library đều cần chốt ở giai đoạn BA; các công nghệ **Baseline** là cam kết phạm vi hiện tại, còn các mục **Cần chốt** phải được Technical Lead/DevOps review trước khi Production.

## Stack Baseline

| Tầng | Công nghệ / chuẩn | Mức độ | Vai trò và lưu ý |
| --- | --- | --- | --- |
| Frontend | ReactJS | Baseline | Xây dựng Single Page Application cho Student, Teacher và Admin. |
| Frontend routing | React Router hoặc router tương đương | Baseline direction | Route public/protected, navigation Back/Previous/Next, deep link và 404. |
| HTTP client | Fetch API hoặc Axios | Cần chốt 1 lựa chọn | API client thống nhất, timeout, header auth, error mapping; không dùng lẫn tùy tiện giữa feature. |
| Backend runtime | Node.js LTS | Baseline | Chạy RESTful API; dùng phiên bản LTS được team chốt và lock trong CI/Docker. |
| Backend framework | ExpressJS | Baseline | Routing, middleware, validation, auth, error handler. |
| Data access | Mongoose hoặc MongoDB Node.js driver | Cần chốt 1 lựa chọn | Schema validation/query abstraction; chọn một chuẩn repository. |
| Database | MongoDB | Baseline | Transactional document store, index, backup/restore strategy. |
| API contract | OpenAPI 3.x và Swagger UI | Baseline | Contract, endpoint documentation, example, auth scheme, validation QA. |
| Authentication | JWT access token + refresh token policy | Baseline direction | Token lifetime, storage strategy, rotation/revocation phải tuân `security-architecture.md`. |
| File/media | Cloud object storage S3-compatible hoặc provider equivalent | Baseline direction | Image/video/attachment; MongoDB chỉ giữ metadata/object key. |
| Container | Docker | Baseline | Đóng gói frontend/backend nhất quán. |
| Local orchestration | Docker Compose | Baseline | Chạy local dependencies; không là production orchestrator mặc định. |
| CI/CD | Provider được chốt sau | Cần chốt | Lint, test, build, scan, publish image, deploy, smoke test, rollback signal. |
| Cloud runtime | Managed container/VM platform được chốt sau | Cần chốt | Chạy API, static host/CDN, managed MongoDB/object storage/secret/monitoring. |

## Lựa Chọn Khuyến Nghị Theo Mục Đích

| Nhu cầu | Khuyến nghị | Lý do | Không nên làm ở MVP |
| --- | --- | --- | --- |
| UI | Chọn một design/component library tương thích React hoặc xây dựng shared component nhỏ | Nhất quán form/table/modal/status/accessibility | Trộn nhiều UI libraries gây nặng và lệch trải nghiệm |
| Form validation | Schema validation thống nhất client và server; server là nguồn kiểm soát cuối | Lỗi hiển thị rõ; chống input sai | Chỉ validate ở frontend |
| State server | Một giải pháp query/cache server-state thống nhất nếu app phức tạp | Refetch, loading/error state, invalidation sau mutation | Dùng global state cho toàn bộ dữ liệu API không cần thiết |
| Password hash | Bcrypt/Argon2 theo policy Technical Lead chốt | Không lưu plain password | Tự viết crypto/password algorithm |
| Validation API | Một validation library/schema rõ ràng | Validate body/query/params và response critical | Chuyển object request trực tiếp vào Mongo query |
| Logging | Structured JSON logger | Dễ search requestId, level, event | `console.log` không format ở Production |
| Testing | Unit + integration API + E2E/UI cho critical flow | Có bằng chứng requirement/NFR | Chỉ manual test trước deploy |
| Static assets | CDN/static hosting | React tải nhanh, tách runtime API | Serve toàn bộ frontend qua API container khi cloud có static hosting phù hợp |

## Version và Dependency Policy

- Chỉ sử dụng Node.js **LTS** và pin major version trong `.nvmrc`, Dockerfile và CI setup sau khi team chốt.
- Lock file của frontend/backend là bắt buộc để build lặp lại được.
- Không dùng package đã end-of-life, có critical vulnerability chưa được chấp thuận hoặc không có maintainer tin cậy.
- Cập nhật dependency theo cadence; security update critical phải được đánh giá ưu tiên.
- Dependency mới phải có mục đích, license phù hợp và không trùng trách nhiệm với library đã có.

## Environment Configuration Contract

| Nhóm config | Ví dụ logical key | Quy tắc |
| --- | --- | --- |
| Application | `APP_ENV`, `APP_VERSION`, `PORT`, `PUBLIC_WEB_URL` | Không chứa secret; phải khác rõ Local/Staging/Production. |
| Database | `MONGODB_URI` | Secret; TLS khi cloud; không log full URI. |
| Auth | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, token TTL | Secret; rotation policy; không build vào frontend. |
| Storage | `STORAGE_BUCKET`, `STORAGE_REGION`, credential/provider identity | Credential là secret; frontend không nhận write credential dài hạn. |
| CORS/security | `ALLOWED_ORIGINS`, rate-limit settings | Whitelist exact origin cho Staging/Production. |
| Observability | `LOG_LEVEL`, `MONITORING_DSN` | Không đẩy PII/secret vào log/trace. |
| Build frontend | `VITE_API_BASE_URL` hoặc key tương đương | Chỉ public API base URL; tất cả `PUBLIC_*` coi là public. |

## Công Nghệ Chưa Chọn Và Quyết Định Cần Có

| Chủ đề | Quyết định cần chốt | Owner đề xuất | Thời điểm |
| --- | --- | --- | --- |
| Cloud provider | Chọn provider/region, cost limit và managed services | Product Owner + DevOps | Trước Staging cloud |
| CI/CD provider | Chọn provider có secret, artifact, log và deployment integration | DevOps | Trước pipeline chính thức |
| MongoDB service | Managed MongoDB/Atlas hay self-managed; plan, region, backup | Technical Lead + DevOps | Trước dữ liệu Staging thật |
| Object storage | Provider, bucket policy, retention, signed URL policy | DevOps + Backend Lead | Trước media upload |
| UI library | Thư viện hoặc design system nội bộ | Frontend Lead | Trước xây nhiều màn hình |
| Token storage | Cookie httpOnly hay phương án client storage phù hợp threat model | Technical Lead + Security reviewer | Trước hoàn thiện auth |
| Observability vendor | Log/metrics/error tracking/alerting | DevOps | Trước release Staging |

## Không Thuộc Stack MVP

- Native iOS/Android app.
- Microservices, Kubernetes, service mesh hoặc event bus phức tạp khi chưa có load/ownership justification.
- Tự vận hành SMTP/Gmail integration cho Teacher Invitation Link.
- AI recommendation/generative content, payment gateway, video conference platform.

## Liên Kết

- Bảo mật: `security-architecture.md`.
- Runtime: `deployment-runtime-architecture.md` và `../15-devops-deployment/`.
- API specification: `../11-api-requirements/swagger-openapi-requirements.md`.
- NFR: `../13-non-functional-requirements/maintainability-supportability.md`.
