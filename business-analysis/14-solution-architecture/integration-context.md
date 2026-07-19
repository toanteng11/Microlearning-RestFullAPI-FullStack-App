# Integration Context

## Mục Đích

Tài liệu này xác định các hệ thống/liên kết giao tiếp với Microlearning Classroom LMS Platform, mức độ ưu tiên và boundary tích hợp. Mục tiêu là tránh hiểu nhầm giữa **chức năng có trong MVP** và **tích hợp tự động với dịch vụ bên ngoài**.

## Context Diagram

```text
Student / Teacher / Admin
          |
          v
Microlearning Classroom LMS Platform
  - ReactJS Web Application
  - Node.js/ExpressJS RESTful API
  - MongoDB / Object Storage
          |
          +--> Swagger/OpenAPI consumer (Developer/QA)
          +--> CI/CD, Container Registry, Cloud Runtime (DevOps)
          +--> Monitoring/Alerting platform (DevOps)
          +--> Object Storage provider (media/files)

Future optional: Email provider, SSO/Identity Provider, HR/SIS/LMS, Analytics platform
```

## Integration Catalog

| INT ID | Hệ thống / Actor | Hướng | Dữ liệu/Protocol | Mục đích | MVP status |
| --- | --- | --- | --- | --- | --- |
| INT-001 | ReactJS Web Application | Frontend -> REST API | HTTPS JSON, auth header | Student/Teacher/Admin thao tác nghiệp vụ | Required |
| INT-002 | MongoDB | API -> Database | TLS database connection | User, Classroom, content, progress, grade, audit data | Required |
| INT-003 | Object Storage | API -> Storage | Provider SDK/HTTPS | File, image/video optional trong Question, attachment/resource | Required khi upload/media trong MVP |
| INT-004 | Swagger UI/OpenAPI | Developer/QA -> API contract | OpenAPI 3.x, HTTPS | Khám phá, test, review API | Required |
| INT-005 | CI/CD + Container Registry | Repository -> build artifact -> Cloud runtime | Provider authenticated integration | Build/test/scan/publish/deploy/smoke test | Required |
| INT-006 | Google Cloud Run runtime | Browser/GitHub Actions -> Cloud Run | HTTPS, immutable application container | Chạy React/API/Swagger cùng origin theo environment | Required cho Cloud deployment |
| INT-007 | Monitoring/Alerting | Runtime -> monitoring platform | log/metrics/health probe | Uptime, error/latency, alert, debugging | Required direction; vendor cần chốt |
| INT-008 | Manual communication channel | Admin -> Teacher | Copy invitation URL qua email/Zalo/Facebook/Messenger/Teams/... | Admin tự gửi link mời Teacher | Required business process, không phải system-to-system API |
| INT-009 | Email service | API -> email provider | Provider API/SMTP | Gửi email tự động/recovery/notification | Out of scope MVP trừ khi scope thay đổi |
| INT-010 | Identity Provider/SSO | Browser/API <-> IdP | OAuth2/OIDC/SAML tùy provider | Login doanh nghiệp | Future |
| INT-011 | HR/SIS/External LMS | API <-> external system | API/file/event contract cần định nghĩa riêng | Đồng bộ user/class/course | Future |
| INT-012 | Analytics product | Web/API -> analytics platform | Event SDK/API | Product analytics nâng cao | Future |

## Quy Tắc Tích Hợp MVP

### Teacher Invitation Không Dùng Gmail Integration

Trong MVP, hệ thống tạo invitation URL cho Admin **copy thủ công**. Admin tự gửi URL qua kênh phù hợp. Vì vậy:

- Không cần OAuth/Gmail API, SMTP hoặc quyền truy cập mailbox của Admin.
- API chỉ tạo, validate, revoke và accept invitation token; không tuyên bố đã gửi email.
- Email Teacher nhập khi tạo invitation là thông tin bind người nhận/audit; không phải trigger tự gửi mail.
- Nếu thêm auto-email sau này, đó là scope/integration mới cần security, retry, delivery status, template và privacy review.

### Object Storage

- Chỉ API/runtime identity được cấp quyền storage cần thiết; trình duyệt không nhận credential dài hạn.
- Nội dung media/download phải qua authorization trước khi cấp quyền truy cập.
- Provider cụ thể, bucket/region, signed URL TTL, lifecycle và backup/replication được DevOps chốt trước Staging có upload thật.

### CI/CD Và Cloud

- Repository/source là input; artifact/container image sau build/test/scan là output có version/commit trace.
- CI/CD chỉ deploy bằng identity có quyền tối thiểu vào environment tương ứng.
- Sau deploy, pipeline/DevOps gọi `/health` và smoke test theo mục 11/15; không đưa API secret ra pipeline log.

## Integration Contract Requirements

| Chủ đề | Yêu cầu |
| --- | --- |
| Versioning | REST API dùng `/api/v1`; breaking change phải review API contract và frontend compatibility. |
| Authentication | Service/provider credential từ secret manager/environment; token phải rotate/revoke theo provider policy. |
| Resilience | Timeout/retry bounded; không retry mutation không idempotent một cách mù quáng; failure phải log có requestId. |
| Error handling | Map provider error thành application error phù hợp, không trả raw provider credential/detail cho client. |
| Data minimization | Chỉ gửi field cần thiết; không đưa password/hash/raw token/score PII sang third party nếu chưa được phê duyệt. |
| Observability | Integration failure có log/metric rõ provider, operation, result (đã mask dữ liệu nhạy cảm). |
| Change management | Thay credential/provider/schema/API version phải có test Staging, rollback/contingency và ADR nếu ảnh hưởng lớn. |

## Câu Hỏi Cần Chốt Trước Production

| Câu hỏi | Owner đề xuất |
| --- | --- |
| Cloud/object storage/monitoring provider nào, ở region nào? | DevOps + Product Owner |
| Có cần upload video thật trong MVP không, giới hạn size/duration/type là gì? | Product Owner + Technical Lead |
| Swagger có public ngoài internet hay chỉ nội bộ/Staging? | Technical Lead + Security reviewer |
| Có auto-email, password reset email hoặc in-app notification ở release sau không? | Product Owner |
| Có cần SSO/HR/SIS integration trong roadmap? | Product Owner + Organization owner |

## Liên Kết

- API: `../11-api-requirements/`.
- Media upload: `data-architecture.md` và `security-architecture.md`.
- Cloud/CI-CD: `deployment-runtime-architecture.md` và `../15-devops-deployment/`.
