# Solution Architecture Overview

## Mục Đích

Tài liệu này xác định kiến trúc giải pháp mục tiêu cho **Microlearning Classroom LMS Platform**. Mục tiêu là chuyển các yêu cầu nghiệp vụ, dữ liệu, API, UI/UX và Non-Functional Requirements thành các ranh giới kỹ thuật rõ ràng để Frontend, Backend, QA và DevOps có thể cùng triển khai.

Tài liệu là kiến trúc định hướng cho MVP và Staging. Các quyết định có ảnh hưởng lớn đến chi phí, bảo mật, khả năng mở rộng hoặc vận hành Production phải được Technical Lead phê duyệt trong `architecture-decision-records.md` trước khi triển khai.

## Phạm Vi Kiến Trúc

| Có trong phạm vi | Không quyết định cố định ở tài liệu này |
| --- | --- |
| ReactJS Web Application, Node.js/ExpressJS RESTful API, MongoDB Atlas, Swagger/OpenAPI, Docker, GitHub Actions và Google Cloud Run runtime | UI component library, object storage provider, Production Atlas tier, RPO/RTO và tên domain cụ thể |
| RBAC, object-level authorization, JWT-based authentication, audit logging, health check | Native mobile app, microservices, AI recommendation engine, payment gateway |
| Quy trình Teacher Invitation Link thủ công, Classroom join bằng code/link, progress/grade/to-do | Tích hợp tự động Gmail, Zalo, Facebook, SSO, HR/LMS ở MVP |

## Nguyên Tắc Kiến Trúc

| ID | Nguyên tắc | Áp dụng thực tế |
| --- | --- | --- |
| AP-01 | API-first | Mọi chức năng do ReactJS dùng phải được định nghĩa bằng RESTful API versioned và Swagger/OpenAPI trước hoặc đồng thời khi code. |
| AP-02 | Modular monolith trước | Backend khởi đầu là một service Node.js nhưng tách module theo domain; không tách microservice khi chưa có nhu cầu vận hành rõ ràng. |
| AP-03 | Defense in depth | Kiểm tra authentication, RBAC, ownership/object-level authorization, validation và audit ở backend; frontend chỉ hỗ trợ trải nghiệm, không là lớp bảo mật duy nhất. |
| AP-04 | Stateless runtime | API không giữ session nghiệp vụ trong memory của một instance để có thể chạy nhiều replica sau này. |
| AP-05 | Data ownership rõ ràng | MongoDB là nguồn dữ liệu giao dịch; object storage là nguồn file/media; dashboard summary/read model có thể tái tạo từ dữ liệu nguồn. |
| AP-06 | Observability from day one | Mọi request quan trọng có requestId; error, audit và deployment có log có thể truy vết. |
| AP-07 | Configuration outside code | Secret, URL, feature toggle, environment name phải đi qua environment variables/secret manager, không hard-code. |
| AP-08 | Progressive complexity | Chỉ thêm queue, cache, search engine, event bus hoặc service độc lập khi số liệu tải hoặc nghiệp vụ chứng minh là cần thiết. |

## Bản Đồ Tài Liệu Mục 14

| Tài liệu | Câu hỏi được trả lời | Đối tượng dùng chính |
| --- | --- | --- |
| `system-architecture.md` | Hệ thống gồm những lớp nào và dữ liệu đi theo đường nào? | Tất cả team |
| `architecture-components.md` | Backend/Frontend được chia module và trách nhiệm ra sao? | Frontend, Backend, QA |
| `technology-stack.md` | Công nghệ nào được chọn, bắt buộc hay cần chốt? | Technical Lead, DevOps |
| `data-architecture.md` | MongoDB, read model, media và backup liên hệ thế nào? | Backend, DevOps |
| `security-architecture.md` | Trust boundary và cơ chế bảo vệ dữ liệu là gì? | Backend, QA, DevOps |
| `integration-context.md` | Hệ thống nào tích hợp ở MVP và tương lai? | Technical Lead, Product Owner |
| `deployment-runtime-architecture.md` | Runtime và môi trường chạy được tổ chức thế nào? | DevOps, Backend, QA |
| `architecture-quality-attributes.md` | Kiến trúc đáp ứng NFR bằng biện pháp nào? | Technical Lead, QA, DevOps |
| `architecture-decision-records.md` | Những quyết định kiến trúc nào cần review? | Technical Lead, Product Owner |
| `architecture-review-checklist.md` | Điều kiện để architecture sẵn sàng triển khai/release là gì? | Technical Lead, QA, DevOps |

## Traceability Với BA Package

| Nguồn đầu vào | Kiến trúc phản hồi |
| --- | --- |
| `05-user-roles` | RBAC, permission và object-level authorization ở API layer |
| `06-business-processes` | Invitation Link, Class Code/Link join, content, deadline và grading workflow |
| `07-requirements` đến `09-use-cases` | Domain module, API boundary, UI route và acceptance flow |
| `10-data-requirements` | Collection, index, read model, retention, backup, audit data |
| `11-api-requirements` | `/api/v1`, Swagger/OpenAPI, error standard, health API |
| `12-ui-ux-requirements` | React application shell, protected route, page states, media upload UX |
| `13-non-functional-requirements` | Security, performance, availability, logging, monitoring, maintainability quality gate |
| `15-devops-deployment` | Docker, CI/CD, cloud infrastructure, environment matrix và rollback runbook |

## Mức Độ Quyết Định

- **Baseline kiến trúc MVP:** ReactJS, Node.js, ExpressJS, MongoDB, RESTful API, Swagger/OpenAPI, Docker và modular monolith.
- **Baseline Cloud đã chọn:** một Google Cloud Run application image phục vụ React/API/Swagger cùng origin, MongoDB Atlas, GitHub Actions, Artifact Registry, Secret Manager và Cloud Logging/Monitoring; không dùng Firebase.
- **Cần chốt trước Production:** Atlas tier/region/network/backup, object storage provider, domain/TLS, monitoring retention/alert thresholds, RPO/RTO và resource sizing.

## Tiêu Chí Hoàn Thành Mục 14

Mục 14 được xem là sẵn sàng làm đầu vào implementation khi Technical Lead xác nhận ít nhất các điểm sau:

- Luồng Browser - Frontend - API - Database/Storage và trust boundaries không mâu thuẫn với API/Data/NFR.
- Mỗi domain nghiệp vụ quan trọng có module owner và boundary rõ ràng.
- Không có secret, raw token hoặc quyền truy cập chỉ được kiểm soát ở frontend.
- Môi trường Local, Staging và Production direction có quy ước tách biệt.
- Các ADR có trạng thái, owner review và action để đóng các quyết định còn mở.
