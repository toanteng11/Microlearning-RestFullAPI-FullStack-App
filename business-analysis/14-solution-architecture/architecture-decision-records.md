# Architecture Decision Records

## Mục Đích

Architecture Decision Record (ADR) lưu bối cảnh, quyết định, hệ quả và người cần phê duyệt cho các lựa chọn có ảnh hưởng dài hạn. ADR giúp đội dự án biết vì sao một giải pháp được chọn, tránh quyết định ngầm và là đầu vào cho change control khi có thay đổi sau này.

## Quy Ước Trạng Thái

| Status | Ý nghĩa |
| --- | --- |
| Proposed | Đã có phân tích sơ bộ nhưng chưa là quyết định được phê duyệt để implementation/release. |
| Recorded Baseline (Draft) | Đã được ghi nhận để team triển khai và kiểm thử thống nhất trong BA Draft; cần approver xác nhận trước release gate liên quan. |
| Accepted | Technical Lead và stakeholder liên quan đã chấp thuận; có thể dùng làm baseline. |
| Superseded | Được thay bằng ADR mới; ADR cũ vẫn được giữ lịch sử. |
| Rejected | Đã xem xét và không chọn; giữ lại lý do để tránh lặp thảo luận. |
| Deprecated | Không còn áp dụng vì technology/process đã hết vòng đời. |

## ADR Template

| Trường | Nội dung yêu cầu |
| --- | --- |
| ADR ID / Title | Mã duy nhất và tên ngắn, rõ quyết định. |
| Status / Date | Trạng thái, ngày tạo/cập nhật. |
| Owner / Approver | Người soạn và người có quyền chấp thuận. |
| Context | Business/NFR/constraint và vấn đề cần giải quyết. |
| Options considered | Ít nhất option chọn và option thay thế phù hợp. |
| Decision | Quyết định cụ thể, boundary áp dụng. |
| Consequences | Lợi ích, trade-off, rủi ro, việc cần làm. |
| Validation / Links | Test, metric, document/repository liên quan. |

## ADR Catalog

| ADR ID | Title | Status | Owner / approver | Quyết định tóm tắt |
| --- | --- | --- | --- | --- |
| ADR-001 | ReactJS Web Application | Proposed | Frontend Lead / Technical Lead | ReactJS cho web frontend SPA. |
| ADR-002 | Node.js and ExpressJS RESTful API | Proposed | Backend Lead / Technical Lead | Node.js LTS + ExpressJS cho modular REST API. |
| ADR-003 | MongoDB as Primary Operational Database | Proposed | Backend Lead / Technical Lead | MongoDB làm dữ liệu giao dịch/document store chính. |
| ADR-004 | Modular Monolith for MVP | Proposed | Technical Lead / Product Owner | Một API deployable tách module domain, không microservices sớm. |
| ADR-005 | REST API Versioning and OpenAPI | Proposed | Backend Lead / Technical Lead | `/api/v1` và OpenAPI 3.x/Swagger là API contract. |
| ADR-006 | JWT Access and Refresh Token Security Model | Recorded Baseline (Draft) | Technical Lead / Security Reviewer | Access JWT trong memory, opaque refresh cookie, rotation/revocation và same-site policy. |
| ADR-007 | Manual Teacher Invitation Link Distribution | Accepted | Product Owner / Technical Lead | Admin copy invitation URL và gửi thủ công; không auto-email/Gmail integration trong MVP. |
| ADR-008 | Object Storage for Files and Media | Proposed | Backend Lead + DevOps / Technical Lead | Binary file/media ngoài MongoDB; metadata/object key trong MongoDB. |
| ADR-009 | Dockerized Build and Environment Configuration | Proposed | DevOps / Technical Lead | Docker image, config/secret outside code; Docker Compose cho Local. |
| ADR-010 | Google Cloud Deployment Baseline | Accepted | Product Owner + DevOps / Technical Lead | Cloud Run + MongoDB Atlas + GitHub Actions; một Cloud Run application phục vụ Web/API cùng origin, không dùng Firebase. |
| ADR-011 | Read Models for To-do and Progress Ranking | Proposed | Backend Lead / Technical Lead | `StudentTodoItem` và `CourseProgressSummary` có thể materialize/rebuild. |
| ADR-012 | API-based Media Upload Authorization | Proposed | Backend Lead / Technical Lead | API kiểm tra quyền/type/size/ownership, storage private; direct signed upload là hướng sau. |
| ADR-013 | Auditability of Privileged and Learning-impacting Actions | Proposed | Backend Lead / Technical Lead | Audit append-only cho invitation, role/status, enrollment governance, deadline, grade. |

## ADR Chi Tiết

### ADR-001: ReactJS Web Application

| Field | Nội dung |
| --- | --- |
| Status | Recorded Baseline (Draft) |
| Context | Cần web application đa role, nhiều page/route, form và dashboard tương tác. |
| Options considered | ReactJS SPA; server-rendered web; native mobile first. |
| Decision | Dùng ReactJS để xây Student/Teacher/Admin web application; routing/protected page/API client dùng chuẩn thống nhất. |
| Consequences | Phù hợp UI giàu tương tác và component reuse; cần xử lý client route, loading/error state, access token UX và static frontend deploy. |
| Validation | Review với UI requirements mục 12; frontend build/lint/E2E critical flow trong CI. |

### ADR-002: Node.js and ExpressJS RESTful API

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Cần backend RESTful API cho ReactJS, Swagger/OpenAPI, RBAC và MongoDB. |
| Options considered | Node.js/ExpressJS; Node.js framework khác; backend runtime khác. |
| Decision | Dùng Node.js LTS và ExpressJS, tổ chức service theo module/domain với middleware chung. |
| Consequences | Đồng nhất JavaScript/TypeScript ecosystem nếu team chọn; cần convention validation/error/logging/testing rõ để tránh controller phình lớn. |
| Validation | API contract, auth/authorization integration test, health endpoint và Docker build. |

### ADR-003: MongoDB as Primary Operational Database

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Domain có content phân cấp, question option/media metadata, progress, read model và dashboard query. |
| Options considered | MongoDB; relational database; nhiều database ngay từ đầu. |
| Decision | MongoDB là database nghiệp vụ chính; collection/index theo query pattern, reference cho ownership và embed object nhỏ. |
| Consequences | Linh hoạt document model; team phải kiểm soát validation, index, query/pagination, migration và data integrity nghiêm túc. |
| Validation | Data model/index review mục 10, backup/restore test, query plan cho dashboard/list quan trọng. |

### ADR-004: Modular Monolith for MVP

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | MVP cần delivery nhanh nhưng có nhiều domain: identity, invitation, classroom, content, assessment, progress, admin, audit. |
| Options considered | Modular monolith; microservices; monolith không module. |
| Decision | Một Node.js API deployable, chia module/domain và service/repository boundary rõ; giao tiếp nội bộ qua service interface/event abstraction đơn giản. |
| Consequences | Đơn giản hơn deployment/debug; cần kỷ luật dependency/ownership để tránh “big ball of mud”. Tách service chỉ khi có dữ liệu vận hành chứng minh. |
| Validation | Module dependency review và architecture checklist trước mỗi release lớn. |

### ADR-005: REST API Versioning and OpenAPI

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | React, QA và future integration cần contract có version, ví dụ và error format rõ. |
| Options considered | REST `/api/v1` + OpenAPI; unversioned REST; GraphQL. |
| Decision | Dùng RESTful API prefix `/api/v1`, OpenAPI 3.x/Swagger như contract và documentation. |
| Consequences | Dễ consume/test; breaking change cần version/deprecation/change-control, Swagger phải cập nhật cùng code. |
| Validation | Swagger quality gate và contract/integration test. |

### ADR-006: JWT Access and Refresh Token Security Model

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Web app cần authentication stateless nhưng phải xử lý expiry, logout, reset/status change và token leak. |
| Options considered | JWT access + refresh token; server session; external identity provider. |
| Decision | Access JWT ngắn hạn chỉ được giữ trong JavaScript memory và gửi qua `Authorization: Bearer`; tuyệt đối không lưu access token trong `localStorage` hoặc `sessionStorage`. Refresh token là opaque random token, chỉ được set bằng cookie `HttpOnly`, `Secure` tại Staging/Cloud, `SameSite=Lax`, `Path=/api/v1/auth`; response refresh không trả raw refresh token cho JavaScript. Database chỉ lưu token hash, expiry, session family, actor và metadata tối thiểu. MVP triển khai Frontend/API cùng site qua reverse proxy; CORS chỉ cho origin đã cấu hình và endpoint refresh/logout kiểm tra `Origin`/`Referer`. Mỗi refresh phải rotate token; logout, token reuse, password reset hoặc account bị block phải revoke session family liên quan. Cross-site cookie (`SameSite=None`) không thuộc baseline và chỉ được mở qua Change Control + security review. |
| Consequences | API vẫn stateless theo request nhưng có session record để revoke; Frontend phải xử lý reload bằng refresh flow, không dùng persistent browser storage. Local development có thể không bật cờ `Secure` khi chạy HTTP localhost, nhưng Staging/Cloud không có ngoại lệ này. |
| Validation | Threat review; test expired/rotated/reused/revoked token, logout, reset, block, CORS/Origin-Referer, cookie attribute và token-storage scan; NFR-SEC-001 đến 012. Formal acceptance của Technical Lead và Security Reviewer là release gate cho auth. |

### ADR-007: Manual Teacher Invitation Link Distribution

| Field | Nội dung |
| --- | --- |
| Status | Accepted |
| Context | Admin cần cung cấp account Teacher nhưng không được biết password; MVP không muốn phụ thuộc Gmail/SMTP/provider email. |
| Options considered | Admin tạo password; hệ thống auto-email; Admin copy link và tự gửi. |
| Decision | Admin nhập email Teacher, tạo secure invitation URL, copy URL và tự gửi qua email/Zalo/Facebook/Messenger/Teams hoặc kênh phù hợp. Teacher mở link, xác nhận thông tin/tạo password; account `TEACHER` được activate khi invitation hợp lệ. |
| Consequences | Không cần tích hợp mailbox; Admin chịu trách nhiệm chọn kênh gửi. API phải không tuyên bố email đã gửi và phải bảo vệ token/expiry/revoke/email matching. |
| Validation | Process/use case/API/acceptance test cho create-copy-revoke-expired-used-email mismatch. |

### ADR-008: Object Storage for Files and Media

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Lesson/resource/submission và QuestionMedia image/video không phù hợp để lưu binary lớn trong MongoDB. |
| Options considered | MongoDB binary; object storage; public file server. |
| Decision | Dùng object storage private cho binary; MongoDB lưu ownership, metadata và object key. |
| Consequences | Scale/lifecycle tốt hơn; phát sinh provider credential, signed URL/private access, orphan cleanup và backup policy. |
| Validation | Upload/download authorization, invalid file test, private object test, lifecycle review. |

### ADR-009: Dockerized Build and Environment Configuration

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Dev/QA/DevOps cần build/runtime nhất quán Local, Staging và Cloud. |
| Options considered | Manual host setup; Docker; VM image only. |
| Decision | Giữ Dockerfile frontend/backend và Docker Compose cho Local/CI; bổ sung multi-stage `microlearning-app` image cho Cloud Run, trong đó Node.js phục vụ React build, API và Swagger cùng origin. Config/secret inject runtime, không hard-code/bake vào image. |
| Consequences | Local integration vẫn tách service để debug; Cloud chỉ promote một image/digest nên same-origin auth và rollback đơn giản hơn. Team cần duy trì production Dockerfile, image scan, env inventory và SPA/API route order. |
| Validation | Local compose, CI build, staging deploy, secret scan/config review. |

### ADR-010: Google Cloud Deployment Baseline

| Field | Nội dung |
| --- | --- |
| Status | Accepted ngày 2026-07-17 |
| Context | Đồ án cần một Cloud target đủ nhỏ cho ngân sách học tập nhưng vẫn chứng minh Docker, CI/CD, secret, monitoring và rollback. Auth baseline dùng refresh cookie `SameSite=Lax` và yêu cầu Frontend/API cùng site. Product Owner không chọn Firebase. |
| Options considered | Google Cloud Run single-origin application + MongoDB Atlas + GitHub Actions; tách static host/API trên hai origin; Render Free; Azure Container Apps; tự quản lý VM/Kubernetes. |
| Decision | Dùng Google Cloud Run làm managed runtime. Production image nhiều stage build React và Node.js API, sau đó một Cloud Run service phục vụ React routes, `/api/v1/*`, `/api-docs`, `/health` và `/ready` trên cùng origin. Dùng MongoDB Atlas làm managed MongoDB; GitHub Actions làm CI/CD; Google Artifact Registry lưu immutable image; Google Secret Manager cấp runtime secret; Cloud Logging/Monitoring nhận log, metric và alert. Region Cloud Run mặc định `asia-southeast1` (Singapore); Atlas chọn provider/region gần nhất có tier phù hợp. Firebase không thuộc baseline. |
| Consequences | Deployment, CORS và cookie đơn giản hơn; chỉ một public service cần health/rollback. React và API cùng release image nên frontend rollback độc lập không còn là mặc định. Cloud Run/Atlas Free Tier chỉ dùng cho Development, Staging, demo hoặc tải nhỏ; Production thật phải review quota, backup, network, Atlas tier và cost. GitHub Actions phải ưu tiên Workload Identity Federation/short-lived identity thay vì service-account key dài hạn. |
| Validation | Multi-stage image build; same-origin login/refresh/logout E2E; Artifact Registry digest trace; Staging deploy; `/health`/`/ready`/version/Swagger smoke; Secret Manager access review; Atlas connection/index/backup decision; budget/quota evidence; rollback rehearsal. |

### ADR-011: Read Models for To-do and Progress Ranking

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Student To-do và Teacher ranking đọc thường xuyên, tổng hợp từ nhiều nguồn và có deadline/score thay đổi. |
| Options considered | Aggregate every request; materialized read models; external analytics store. |
| Decision | Cho phép `StudentTodoItem` và `CourseProgressSummary` làm read model MongoDB; source records vẫn authoritative và summary phải rebuild được. |
| Consequences | Dashboard nhanh/đơn giản query hơn; cần xử lý stale/recalculate/retry/version công thức. |
| Validation | Regression for completion/deadline/grade, rebuild test, p95 measurement. |

### ADR-012: API-based Media Upload Authorization

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Teacher có thể thêm image/video vào Question; content/submission có thể có file. Cần tránh public bucket/unauthorized attachment. |
| Options considered | Client upload trực tiếp không kiểm soát; backend proxy upload; API authorization + signed upload future. |
| Decision | API luôn authorize/validate before persistence; private storage. MVP có thể dùng bounded backend upload; direct signed upload chỉ thêm khi provider/size/load yêu cầu. |
| Consequences | Bảo mật rõ; backend upload lớn có thể tăng tải nên phải có limit/timeout. |
| Validation | Ownership/type/size/private URL tests; performance observation. |

### ADR-013: Auditability of Privileged and Learning-impacting Actions

| Field | Nội dung |
| --- | --- |
| Status | Proposed |
| Context | Admin/Teacher action ảnh hưởng account, invitation, enrollment, deadline và grade cần truy vết để support/UAT. |
| Options considered | Chỉ application log; AuditLog collection; external audit system. |
| Decision | Dùng append-only AuditLog nghiệp vụ với actor/action/resource/time/requestId/metadata safe/reason khi bắt buộc. |
| Consequences | Truy vết tốt hơn; cần kiểm soát PII, retention/index và không expose update/delete audit API cho user thường. |
| Validation | Audit event test theo NFR-LOG-003 và data retention review. |

## Quy Trình Thay Đổi ADR

1. Người đề xuất tạo ADR mới hoặc cập nhật ADR hiện có với context/options/impact.
2. Technical Lead review impact tới API, data, security, DevOps, cost và timeline.
3. Product Owner phê duyệt khi quyết định thay đổi scope/cost/roadmap.
4. Khi Accepted, cập nhật tài liệu liên quan, traceability, implementation task và test/quality gate.
5. Khi thay thế quyết định, tạo ADR mới và mark ADR cũ `Superseded`, không xóa lịch sử.
