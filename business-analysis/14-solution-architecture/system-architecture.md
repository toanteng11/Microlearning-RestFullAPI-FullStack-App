# System Architecture

## Mục Đích

Tài liệu này mô tả kiến trúc hệ thống ở mức cao và các luồng runtime chính của Microlearning Classroom LMS Platform. Thiết kế dùng **modular monolith** cho MVP: một ReactJS Web Application và một Node.js/ExpressJS API được tách module theo domain, sử dụng MongoDB làm dữ liệu giao dịch chính.

## Sơ Đồ Kiến Trúc Mức Cao

```text
Student / Teacher / Admin Browser
              |
              | HTTPS
              v
  Frontend Hosting / CDN / Reverse Proxy
              |
              | Static ReactJS assets; /api proxy hoặc API URL
              v
       ReactJS Single Page Application
              |
              | HTTPS JSON REST API + Bearer access token
              v
     Node.js + ExpressJS Modular API Service
       |          |              |             |
       |          |              |             +--> Swagger/OpenAPI (controlled access in non-public environments)
       |          |              +--> Structured log / metrics / health endpoint
       |          +--> Object Storage (file, image, video metadata/object)
       +--> MongoDB (transactional data, progress summary, audit log)

CI/CD Pipeline --> build/test/scan --> container registry --> cloud runtime
Monitoring / Alerting <---------------- logs, metrics, health checks
```

## Các Lớp Kiến Trúc

| Lớp | Thành phần | Trách nhiệm | Không được làm |
| --- | --- | --- | --- |
| Presentation | ReactJS SPA, React Router, page/component/state | Hiển thị màn hình, điều hướng, form validation UX, gọi API, xử lý loading/empty/error state | Tin rằng hidden button là kiểm soát quyền; lưu secret; tự tính điểm chính thức |
| Edge/Delivery | CDN, static hosting, reverse proxy, TLS | Phục vụ asset frontend, HTTPS, route SPA fallback, có thể rate limit/WAF | Chứa business rule hoặc database credential |
| Application/API | Express route, controller, service/use case, repository, middleware | Xác thực, phân quyền, business rule, validation, API response, audit, orchestration | Truy cập MongoDB trực tiếp từ controller không kiểm soát; trả raw model nhạy cảm |
| Data | MongoDB, indexes, backup; object storage | Lưu dữ liệu nghiệp vụ, file/media object, read model, audit log | Lưu plain password/raw token hoặc public object mặc định |
| Operations | Docker, CI/CD, registry, cloud runtime, monitoring | Build, cấu hình, deploy, health check, backup, rollback, alert | Đưa secret vào source code/image/log |

## Quy Tắc Giao Tiếp

| From | To | Giao thức / dữ liệu | Quy tắc bắt buộc |
| --- | --- | --- | --- |
| Browser | Frontend host | HTTPS | Chỉ tải static asset; HTTPS ở Staging/Production. |
| ReactJS SPA | REST API | HTTPS, JSON, `Authorization: Bearer <accessToken>` khi protected | Base URL theo environment; lỗi API theo chuẩn mục 11. |
| API | MongoDB | TLS/connection string từ secret | Chỉ repository/data access layer truy cập database. |
| API | Object storage | SDK/HTTPS, credential runtime | Validate ownership/type/size trước upload; lưu metadata và object key, không tin URL do client tự gửi. |
| API | Monitoring/log platform | Structured logs/metrics/health | Mask secret/token/password; gắn requestId/correlationId. |
| CI/CD | Runtime/registry | Authenticated provider integration | Chỉ deploy artifact đã build/test; inject config qua secret/environment. |

## Các Luồng Runtime Trọng Yếu

### Authentication và Protected Request

```text
1. User đăng nhập trên ReactJS.
2. ReactJS gọi POST /api/v1/auth/login qua HTTPS.
3. API validate input, xác thực account ACTIVE và password hash.
4. API cấp access token ngắn hạn; refresh token theo policy an toàn.
5. ReactJS gọi protected API kèm access token.
6. Middleware xác minh token, role, permission và ownership của resource.
7. Service thực thi business rule, ghi AuditLog nếu action nhạy cảm.
8. API trả DTO đã lọc trường nhạy cảm cùng requestId.
```

### Admin Mời Teacher Bằng Link Thủ Công

```text
Admin -> ReactJS -> POST /teacher-invitations -> API
API -> MongoDB: lưu tokenHash, email, expiry, status PENDING
API -> ReactJS: trả raw invitation URL một lần để Admin copy
Admin -> Email/Zalo/Facebook/...: tự gửi invitation URL thủ công
Teacher -> ReactJS invitation page -> API: validate token + email matching
API -> MongoDB: tạo/activate User(role TEACHER) và mark invitation ACCEPTED
```

Hệ thống MVP không bắt buộc kết nối Gmail hoặc tự gửi email. Email Teacher được dùng để bind invitation, kiểm soát người nhận và audit; Admin là người tự chọn kênh gửi link.

### Student Join Classroom

```text
Student chọn Class Code hoặc mở Invite Link
      -> ReactJS gửi token/code tới API
      -> API validate trạng thái Classroom, token/code, expiry, policy join
      -> API kiểm tra duplicate enrollment
      -> MongoDB tạo Enrollment ACTIVE + AuditLog phù hợp
      -> ReactJS chuyển Student tới Classroom Dashboard
```

### Học Tập, Deadline và Dashboard

```text
Teacher publish Lesson/Quiz/Assignment có deadline riêng
      -> API validate ownership và business rule
      -> MongoDB lưu activity + due date
      -> Service tạo/cập nhật To-do read model hoặc tính từ source data

Student hoàn thành/nộp bài
      -> API ghi progress/submission/attempt
      -> Service tính trạng thái ON_TIME/LATE/MISSING và progress summary
      -> Teacher Course Dashboard đọc activity list + roster + ranking processScore DESC

Teacher reset deadline (bắt buộc reason)
      -> API lưu deadline history + AuditLog
      -> cập nhật To-do/Calendar/progress status có liên quan
```

## Ranh Giới Kiến Trúc

| Ranh giới | Quy định |
| --- | --- |
| Frontend và Backend | Frontend chỉ dùng public API contract; không truy cập MongoDB hoặc storage credential. |
| Module nghiệp vụ | Module không ghi trực tiếp vào collection thuộc domain khác nếu chưa đi qua service/API nội bộ đã định nghĩa. |
| Dữ liệu giao dịch và read model | `CourseProgressSummary`/`StudentTodoItem` là read model có thể tái tạo; source of truth vẫn là enrollment, lesson/activity, progress, attempt, submission, grade. |
| File/media và metadata | Object binary nằm trong object storage; MongoDB lưu metadata, ownership, object key, type/size/status. |
| Public và protected endpoint | Chỉ endpoint thật sự public-safe như basic `/health`, login, invitation validation/join flow mới public; endpoint chi tiết phải authorization. |
| Runtime và configuration | Image phải có thể promote giữa environment; khác biệt môi trường nằm ở config/secret, không ở code branch. |

## Kiến Trúc MVP và Hướng Mở Rộng

| Nhu cầu | MVP | Khi cần mở rộng |
| --- | --- | --- |
| API workload | Một stateless API service | Nhiều API replica sau load balancer; autoscaling theo CPU/request/latency. |
| Progress/To-do | Cập nhật đồng bộ hoặc scheduled rebuild có kiểm soát | Queue/worker cho bulk recalculation, notification, video processing. |
| File/media | Object storage, giới hạn type/size | Direct signed upload, virus scan, CDN, transcoding video. |
| Caching | Không bắt buộc; tối ưu index/query trước | Redis/cache khi đo được dashboard/read pressure. |
| Search | Filter/pagination MongoDB | Search service khi full-text/scale vượt khả năng query cần thiết. |
| Service boundary | Modular monolith | Tách service chỉ khi ownership, tải, release cadence hoặc failure isolation chứng minh giá trị. |

## Liên Kết Tài Liệu

- Module chi tiết: `architecture-components.md`.
- Data flow và MongoDB: `data-architecture.md` và `../10-data-requirements/mongodb-data-model.md`.
- API contract: `../11-api-requirements/api-overview.md` và `../11-api-requirements/api-health-devops.md`.
- NFR: `../13-non-functional-requirements/nfr-catalog.md`.
- Triển khai chi tiết: `../15-devops-deployment/`.
