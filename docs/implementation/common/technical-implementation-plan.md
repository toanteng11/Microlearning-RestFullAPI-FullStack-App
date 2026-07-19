# Technical Implementation Plan

## 1. Mục tiêu

Kế hoạch này chia việc xây dựng Microlearning thành các phase có kết quả kiểm chứng được. Mỗi phase tạo ra một increment chạy được, hạn chế xây dựng nhiều chức năng rời rạc nhưng chưa thể tích hợp thành luồng nghiệp vụ hoàn chỉnh.

## 2. Phạm vi kỹ thuật mục tiêu

- Frontend: ReactJS, TypeScript, Vite và React Router.
- Backend: Node.js LTS, TypeScript, ExpressJS và RESTful API.
- Database: MongoDB với Mongoose.
- API documentation: OpenAPI 3.x và Swagger UI.
- Local runtime: Docker và Docker Compose.
- Automation: CI/CD với lint, type check, test, build, security scan và deployment gate.
- Deployment: Google Cloud Run + MongoDB Atlas + GitHub Actions theo ADR-010; một production application image phục vụ React/API/Swagger cùng origin, không dùng Firebase.
- Architecture: Modular Monolith, tách module theo domain nhưng chạy chung một API service trong MVP.

Việc dùng TypeScript không thay đổi nền tảng ReactJS/Node.js; nó bổ sung kiểm tra kiểu để giảm lỗi tích hợp và hỗ trợ bảo trì.

## 3. Các phase triển khai

| Phase | Tên                      | Kết quả chính                                                                          | Dependency               | Trạng thái                      |
| ----- | ------------------------ | -------------------------------------------------------------------------------------- | ------------------------ | ------------------------------- |
| 01    | Project Foundation       | Repository, Web/API skeleton, MongoDB local, Swagger, Docker Compose và CI baseline    | BA architecture baseline | Completed                       |
| 02    | Authentication and Users | Student registration, login/session, RBAC, Admin user lists và Teacher invitation      | Phase 01                 | Merged; `39/39` Pass            |
| 03    | Classroom Management     | Classroom CRUD, enrollment, class code, invite link, roster và enrollment policy       | Phase 02                 | Completed; `45/45` Pass         |
| 04    | Learning Content         | Course, module, lesson, resource, publish lifecycle và deadline                        | Phase 03                 | `READY_TO_CODE`; Not Started    |
| 05    | Assessments and Grading  | Quiz, assignment, submission, grading, feedback và deadline exception                  | Phase 04                 | Planned                         |
| 06    | Reporting and Analytics  | Student To-do, progress, process score, ranking và Admin reports                       | Phase 05                 | Planned                         |
| 07    | DevOps and Deployment    | Container registry, Staging/Production pipeline, Cloud, monitoring, backup và rollback | Phase 01-06              | Planned                         |
| 08    | Testing and Release      | E2E, security/performance test, UAT, defect closure và MVP release                     | Phase 01-07              | Planned                         |

## 4. Cách tổ chức increment

Mỗi phase đi qua cùng một vòng đời:

```text
BA Requirement Review
  -> Technical Design
  -> API/Data Contract
  -> Implementation
  -> Automated Test
  -> Integration Review
  -> Demo/UAT Evidence
  -> Phase Exit Review
```

Không bắt đầu task phụ thuộc khi contract đầu vào chưa được chốt. Các task độc lập trong cùng phase có thể làm song song sau khi Technical Design được review.

## 5. Quy tắc ưu tiên

1. Bảo mật, phân quyền và tính đúng của dữ liệu được ưu tiên hơn tiện ích giao diện.
2. Luồng Must trong MVP được triển khai trước capability Should.
3. Backend là nguồn kiểm soát cuối cho authorization, deadline, score và progress.
4. API contract phải được cập nhật cùng source code; Swagger không được để lệch implementation.
5. Mỗi phase phải giữ hệ thống build và test được, không tích lũy lỗi để xử lý ở Phase 08.

## 6. Quản lý dependency và quyết định

| Decision                           | Hạn chót                         | Owner đề xuất                    | Tác động nếu chưa chốt                          |
| ---------------------------------- | -------------------------------- | -------------------------------- | ----------------------------------------------- |
| Package manager và workspace       | Đầu Phase 01                     | Technical Lead                   | Không thể khóa cấu trúc monorepo và CI install. |
| Node.js LTS major version          | Đầu Phase 01                     | Technical Lead/DevOps            | Docker, local và CI có thể khác runtime.        |
| Authentication token storage       | Trước Phase 02                   | Technical Lead/Security reviewer | Không thể hoàn thiện session design.            |
| Object storage provider            | Accepted cho conditional upload  | DevOps/Backend Lead              | Google Cloud Storage private; URL-only nếu P04 defer upload. |
| Cloud và CI/CD provider            | Accepted 2026-07-17              | Product Owner/DevOps             | Google Cloud Run + MongoDB Atlas + GitHub Actions; implementation ở Phase 07. |
| Production domain và TLS ownership | Trước Phase 07                   | Product Owner/DevOps             | Không thể hoàn thiện public deployment.         |

## 7. Quản lý tiến độ

Mỗi task dùng các trường tối thiểu: `Task ID`, mô tả, owner, dependency, estimate, acceptance criteria, bằng chứng và trạng thái. Trạng thái hợp lệ gồm `Backlog`, `Ready`, `In progress`, `In review`, `Blocked`, `Done`.

Tiến độ phase được đánh giá bằng số task đạt `Done` và mức đạt exit criteria; không dùng phần trăm cảm tính. Task có code nhưng chưa test/review không được tính hoàn thành.

## 8. Kiểm soát thay đổi

- Thay đổi kỹ thuật không ảnh hưởng behavior có thể được Technical Lead phê duyệt và ghi lại trong ADR.
- Thay đổi API, dữ liệu, role, business rule hoặc acceptance criteria phải cập nhật tài liệu BA liên quan và traceability.
- Thay đổi làm tăng phạm vi phase phải có đánh giá effort, dependency, risk và quyết định đưa vào hoặc chuyển phase sau.
- Quyết định tạm thời phải có owner và ngày cần chốt; không để `TBD` vô thời hạn.

## 9. Báo cáo phase

Khi kết thúc mỗi phase, báo cáo phải có: phạm vi đã hoàn thành, phạm vi chuyển tiếp, demo link hoặc command kiểm chứng, test result, issue còn mở, risk mới, technical debt được chấp nhận và quyết định cho phase tiếp theo.
