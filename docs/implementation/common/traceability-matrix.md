# Implementation Traceability Matrix

## 1. Mục đích

Tài liệu này ánh xạ kế hoạch code với BA baseline và bằng chứng triển khai. Ma trận được cập nhật dần khi từng phase bắt đầu; không thay thế ma trận traceability chi tiết trong `business-analysis/19-traceability/`.

## 2. Phase traceability

| Phase | BA source chính | Capability | Implementation evidence | Test evidence | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| P01 | `14-solution-architecture/`, `15-devops-deployment/`, NFR, API standards | Technical foundation | `apps/`, `docker-compose.yml`, `.github/workflows/ci.yml` | `npm run check`, Docker/API smoke evidence trong `../phase-01/evidence-register.md` | Implemented locally |
| P02 | Authentication, User Roles, FR-001..019, business rules liên quan | Identity, RBAC, user administration, Teacher invitation | Chưa có | Chưa có | Planned |
| P03 | Classroom processes, FR-020..025 | Classroom and enrollment | Chưa có | Chưa có | Planned |
| P04 | Course/content requirements, FR-026..035 | Learning content and deadline | Chưa có | Chưa có | Planned |
| P05 | Assessment requirements, FR-036..048 | Quiz, assignment and grading | Chưa có | Chưa có | Planned |
| P06 | Dashboard/reporting requirements, FR-049..063 | To-do, progress, ranking and reports | Chưa có | Chưa có | Planned |
| P07 | FR-064..075, DevOps and deployment acceptance | Cloud operations and CI/CD | Chưa có | Chưa có | Planned |
| P08 | Acceptance criteria, NFR, risk and release planning | System validation and release | Chưa có | Chưa có | Planned |

## 3. Phase 01 traceability

| Work item | BA source | Kết quả mong đợi | Bằng chứng cần lưu |
| --- | --- | --- | --- |
| P01-E01 | Solution Architecture overview/components | Monorepo và module boundaries | Root workspaces, `../phase-01/architecture-overview.md`, ADR catalog |
| P01-E02 | Technology Stack, UI architecture | React Web skeleton | `apps/web`, Web tests và production build pass |
| P01-E03 | Architecture Components, API requirements | Express API skeleton, health/version | `apps/api`, 7 API tests pass, HTTP smoke pass |
| P01-E04 | Data Architecture, environment contract | MongoDB local/config validation | Mongoose lifecycle, config tests, Compose readiness `MongoDB=UP` |
| P01-E05 | Swagger/OpenAPI requirements | Swagger UI và base contract | Swagger HTTP 200, OpenAPI 3.0.3 validation test pass |
| P01-E06 | Docker Strategy | Reproducible local containers | Web/API images build; ba container healthy |
| P01-E07 | CI/CD Pipeline, NFR quality gates | Pull Request CI baseline | Workflow và PR template có sẵn; remote run pending |
| P01-E08 | Maintainability/Supportability | Standards, setup guide, ADRs | Root README, coding workflow, Definition of Done và 8 ADR |

## 4. Quy tắc cập nhật

- Khi mở Pull Request, thêm Task ID và BA reference vào mô tả.
- Khi merge, điền implementation evidence bằng commit/PR hoặc file path.
- Khi test pass, điền test file/report/pipeline run; không chỉ ghi `Passed` mà thiếu bằng chứng.
- Khi BA requirement đổi, review tất cả phase/work item liên quan và ghi impact.
- Nếu một requirement không được triển khai trong phase dự kiến, ghi phase mới, lý do và phê duyệt.
