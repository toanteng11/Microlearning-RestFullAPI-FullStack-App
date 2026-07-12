# Technical And DevOps Use Cases

## Mục Đích

Tài liệu này đặc tả các use case kỹ thuật và DevOps cần thiết để hệ thống **Microlearning Classroom LMS Platform** có thể vận hành như một web product chuyên nghiệp: RESTful API rõ ràng, Swagger/OpenAPI đầy đủ, Docker local runtime, CI/CD, Cloud deployment, health check, monitoring, backup và rollback.

## UC-016 - Xem Swagger API Documentation

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Developer / QA |
| Priority | Must |
| Related FR | FR-067 |
| UI Touchpoints | `/api-docs` hoặc Swagger UI route |
| API Touchpoints | OpenAPI JSON/YAML |

### Preconditions

- Backend service đang chạy.
- Swagger/OpenAPI được generate hoặc maintain trong source code.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Developer/QA | Mở Swagger UI. |
| 2 | System | Hiển thị API groups: Auth, Classroom, Course, Quiz, Assignment, Progress, Admin. |
| 3 | Developer/QA | Mở endpoint cần xem. |
| 4 | System | Hiển thị method, path, auth requirement, request schema, response schema, error examples. |
| 5 | Developer/QA | Dùng Swagger để hiểu contract hoặc test thử endpoint nếu environment cho phép. |

### Acceptance Criteria

- Swagger bao phủ endpoint MVP.
- Endpoint protected có security scheme rõ.
- Có schema cho success và error response.

## UC-072 - Chuẩn Hóa RESTful API Và Error Response

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Developer / QA |
| Priority | Must |
| Related FR | FR-065, FR-066 |
| API Touchpoints | Toàn bộ `/api/v1` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Developer | Thiết kế endpoint theo resource và version `/api/v1`. |
| 2 | Developer | Áp dụng response format chuẩn cho success/error. |
| 3 | QA | Gọi endpoint với request hợp lệ và không hợp lệ. |
| 4 | System | Trả status code và payload nhất quán. |
| 5 | Frontend | Hiển thị message phù hợp dựa trên error response. |

### Response Chuẩn Gợi Ý

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": []
  }
}
```

### Business Rules

- Không hard-code message kỹ thuật khó hiểu trên frontend.
- API lỗi authorization phải phân biệt `401 Unauthorized` và `403 Forbidden`.
- Không trả stack trace ra production.

## UC-073 - Server-side Pagination / Filter / Sort

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Developer / QA |
| Priority | Must |
| Related FR | FR-064 |
| API Touchpoints | List endpoints |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Frontend | Gọi list API với `page`, `limit`, `sortBy`, `sortOrder`, filter. |
| 2 | Backend | Validate query params. |
| 3 | Backend | Query MongoDB với index/filter phù hợp. |
| 4 | Backend | Trả data và pagination metadata. |
| 5 | Frontend | Render table/list và pagination controls. |

### Endpoints Áp Dụng

| Nhóm | Ví dụ |
| --- | --- |
| Admin users | `/api/v1/admin/users/students`, `/teachers`, `/admins` |
| Teacher tables | roster, submissions, progress ranking |
| Student lists | To-do, Classwork, Progress |
| Audit logs | `/api/v1/admin/audit-logs` |
| Reports | report list/export filter |

## UC-074 - Docker Compose Local Runtime

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Developer / DevOps Engineer |
| Priority | Must |
| Related FR | FR-071, FR-073 |
| Touchpoints | `docker-compose.yml`, frontend container, backend container, MongoDB container |

### Preconditions

- Docker/Docker Compose đã được cài.
- `.env` local có cấu hình cần thiết.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Developer | Clone project và tạo `.env` từ `.env.example`. |
| 2 | Developer | Chạy Docker Compose. |
| 3 | System | Start MongoDB, backend API, frontend app. |
| 4 | Developer | Mở frontend URL và Swagger/API health. |
| 5 | System | App local chạy nhất quán giữa các máy. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Port conflict | Hướng dẫn đổi port trong env/compose. |
| EX-002 | MongoDB chưa ready | Backend retry hoặc health check báo degraded. |
| EX-003 | Thiếu env | Backend fail fast với message rõ, không dùng secret hard-code. |

## UC-075 - CI/CD Và Cloud Deployment

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | DevOps Engineer |
| Priority | Must |
| Related FR | FR-072, FR-073 |
| Touchpoints | CI/CD pipeline, Cloud platform, environment variables |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Developer | Push code hoặc tạo pull request. |
| 2 | CI | Chạy lint/test/build frontend và backend. |
| 3 | CI | Fail pipeline nếu lint/test/build lỗi. |
| 4 | CD | Deploy artifact/container lên Cloud environment khi điều kiện release đạt. |
| 5 | System | Cấu hình env vars cho API URL, DB URL, JWT secret, storage config. |
| 6 | DevOps | Kiểm tra health check và smoke test sau deploy. |

### Business Rules

- Không deploy nếu build/test fail.
- Không hard-code secrets trong source.
- Mỗi deployment nên có version hoặc commit reference.

## UC-076 - Health Check Và Monitoring

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | DevOps Engineer / Admin |
| Priority | Must |
| Related FR | FR-070, FR-074 |
| API Touchpoints | `GET /health`, monitoring/logging tools |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Monitoring/DevOps | Gọi health check endpoint. |
| 2 | System | Kiểm tra API process và dependency cơ bản như MongoDB. |
| 3 | System | Trả status `UP`, `DEGRADED` hoặc `DOWN` theo thiết kế. |
| 4 | DevOps/Admin | Xem log/health để biết trạng thái vận hành. |

### Acceptance Criteria

- Health check không lộ secrets.
- Có log lỗi API quan trọng.
- Có cơ sở phát hiện downtime hoặc degraded state.

## UC-077 - Backup MongoDB

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | DevOps Engineer |
| Priority | Must |
| Related FR | FR-075 |
| Data Scope | User, Classroom, Course, Lesson, Quiz, Assignment, Submission, Progress, Grade, AuditLog |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | DevOps | Xác định backup schedule hoặc manual backup trước release. |
| 2 | System/DevOps | Chạy backup MongoDB theo strategy. |
| 3 | DevOps | Lưu backup ở vị trí an toàn theo environment. |
| 4 | DevOps | Kiểm tra backup file/log. |
| 5 | DevOps | Ghi nhận backup time/version nếu cần. |

### Business Rules

- Backup phải bảo vệ dữ liệu học tập và audit log.
- Không lưu backup public.
- Cần có quy trình restore ở mức cơ bản.

## UC-078 - Rollback Deployment

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | DevOps Engineer |
| Priority | Must |
| Related FR | FR-075 |
| Touchpoints | Deployment pipeline, release version, rollback notes |

### Trigger

- Deployment mới gây lỗi nghiêm trọng.
- Student/Teacher không thể truy cập workflow chính.
- Health check báo down/degraded sau release.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | DevOps | Xác nhận lỗi release mới. |
| 2 | DevOps | Chọn last known good version. |
| 3 | DevOps | Thực hiện rollback app/container/deployment. |
| 4 | System | Khởi động lại version ổn định. |
| 5 | DevOps | Kiểm tra health check và smoke test. |
| 6 | DevOps | Ghi nhận incident/rollback note. |

### Business Rules

- Rollback không được xóa dữ liệu học tập.
- Nếu migration database có rủi ro, cần backup trước release.
- Admin/Stakeholder cần được thông báo nếu downtime ảnh hưởng demo/UAT.

## UC-079 - Audit Important Actions

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | System / Admin |
| Priority | Must |
| Related FR | FR-069 |
| API Touchpoints | Audit service/middleware |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Actor | Thực hiện action quan trọng. |
| 2 | System | Xác định action có cần audit không. |
| 3 | System | Ghi audit log gồm actorId, action, resourceType, resourceId, metadata, timestamp. |
| 4 | Admin | Xem log trong Audit Log page. |

### Actions Cần Audit

| Action | Lý do |
| --- | --- |
| Create/copy/revoke/accept Teacher Invitation | Quản lý cấp tài khoản Teacher |
| Change Role/Permission | Quyền nhạy cảm |
| Block/Unblock Account | Ảnh hưởng truy cập hệ thống |
| Update Enrollment Policy | Ảnh hưởng join flow |
| Transfer Classroom Ownership | Ảnh hưởng trách nhiệm lớp học |
| Publish/Unpublish Content | Ảnh hưởng Student access |
| Return Grade/Feedback | Ảnh hưởng kết quả học tập |

## Ghi Chú DevOps Dễ Hiểu

| Khái niệm | Cách hiểu đơn giản |
| --- | --- |
| Docker | Đóng gói app để chạy giống nhau ở máy dev và cloud |
| CI | Tự động kiểm tra code trước khi merge/deploy |
| CD | Tự động đưa app đã pass kiểm tra lên môi trường chạy thật |
| Health Check | API báo app còn sống và kết nối dependency được không |
| Monitoring | Theo dõi lỗi/downtime để biết khi hệ thống có vấn đề |
| Backup | Sao lưu dữ liệu để tránh mất thông tin học tập |
| Rollback | Quay về phiên bản ổn định nếu bản mới lỗi |
