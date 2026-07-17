# Phase 02 - Authentication And Users

## 1. Mục tiêu thư mục

Thư mục này là hồ sơ lập kế hoạch code cho `P02 - Authentication and Users`. Nội dung chuyển các yêu cầu BA về đăng ký Student, đăng nhập, session, RBAC, quản trị user và Teacher Invitation thành thiết kế kỹ thuật, backlog, test và phase exit criteria có thể thực hiện trực tiếp.

Phase 02 chỉ được xem là hoàn thành khi Web, API, MongoDB, Swagger, Docker và CI cùng tạo thành các luồng tích hợp chạy được; không công nhận trạng thái `Done` nếu chỉ có API hoặc chỉ có giao diện mock.

## 2. Trạng thái

| Thuộc tính            | Giá trị                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Phase ID              | `P02`                                                              |
| Tên                   | `Authentication and Users`                                         |
| Dependency            | `P01 - Project Foundation` đã hoàn thành                           |
| Planning status       | `Ready for implementation`                                         |
| Implementation status | `In progress - PR-02A contract/runtime foundation`                 |
| Phase owner đề xuất   | Technical Lead                                                     |
| Review bắt buộc       | BA/Product Owner, Backend, Frontend, QA, DevOps, Security Reviewer |
| Phase tiếp theo       | `P03 - Classroom Management`                                       |

## 3. Kết quả nghiệp vụ cần đạt

1. Guest tự đăng ký đúng một account `STUDENT` `ACTIVE`, sau đó phải Login; đăng ký không tạo session hoặc Enrollment.
2. User `ACTIVE` đăng nhập, refresh session, logout và truy cập đúng workspace theo role.
3. Backend kiểm tra account status, role, permission và object scope; frontend route guard không phải lớp bảo mật duy nhất.
4. Admin quản lý riêng `Student List`, `Teacher List` và `Admin List` bằng server-side pagination/filter/sort.
5. Admin tạo Teacher Invitation Link, copy và tự gửi thủ công; hệ thống không tích hợp Gmail/SMTP trong phase này.
6. Teacher dùng invitation hợp lệ để tự đặt password và kích hoạt account `TEACHER` `ACTIVE`.
7. Hành động invitation, status và role nhạy cảm có AuditLog an toàn, không chứa password hoặc raw token.
8. Swagger/OpenAPI phản ánh đầy đủ contract authentication, user management và invitation.

## 4. Danh mục tài liệu

| File                                    | Trách nhiệm chính                                           | Owner đề xuất                |
| --------------------------------------- | ----------------------------------------------------------- | ---------------------------- |
| `phase-plan.md`                         | Mục tiêu, milestone, dependency và governance               | Technical Lead               |
| `scope-and-deliverables.md`             | In scope, out of scope và deliverable                       | BA/Technical Lead            |
| `technical-decisions.md`                | Quyết định kỹ thuật P02-ADR-001 đến P02-ADR-015             | Technical Lead/Security      |
| `development-readiness-review.md`       | Kết quả Gate A và baseline bắt đầu development              | Project Owner/Technical Lead |
| `developer-start-guide.md`              | Hướng dẫn PR-02P, branch PR-02A, verification và merge gate | Technical Lead/Developers    |
| `architecture-and-module-design.md`     | Module boundary, dependency và request flow                 | Backend/Frontend Lead        |
| `security-session-and-rbac.md`          | Password, token, cookie, session, rate limit và RBAC        | Backend/Security             |
| `data-model-and-indexes.md`             | Collection, field, state, index và transaction              | Backend                      |
| `api-contract.md`                       | Endpoint, request/response, error và authorization          | Backend/QA/Frontend          |
| `backend-implementation-plan.md`        | Cấu trúc source và thứ tự code API                          | Backend Lead                 |
| `frontend-implementation-plan.md`       | Route, auth bootstrap, page, component và state             | Frontend Lead                |
| `teacher-invitation-and-admin-users.md` | Hai workflow quản trị trọng tâm                             | BA/Backend/Frontend          |
| `devops-environment-and-seeding.md`     | Mongo replica set, env, bootstrap Admin và CI               | DevOps/Backend               |
| `work-breakdown-structure.md`           | Epic, task, dependency, estimate và output                  | Technical Lead               |
| `testing-strategy.md`                   | Test pyramid, security matrix, E2E và CI                    | QA/Security                  |
| `acceptance-criteria.md`                | Tiêu chí P02-AC có thể kiểm chứng                           | QA/BA                        |
| `traceability-matrix.md`                | BA -> task -> API/UI -> test/evidence                       | BA/QA                        |
| `risk-and-issues.md`                    | Risk, trigger, mitigation và contingency                    | Technical Lead               |
| `implementation-checklist.md`           | Checklist thực thi theo gate                                | Technical Lead/QA            |
| `evidence-register.md`                  | Nơi đăng ký bằng chứng khi code                             | QA/DevOps                    |
| `exit-report.md`                        | Mẫu báo cáo đóng phase                                      | Technical Lead/QA            |

## 5. Trình tự sử dụng

1. Review `scope-and-deliverables.md` và chốt phạm vi Must/Should.
2. Phê duyệt `technical-decisions.md`, đặc biệt session, password, transaction và bootstrap Admin.
3. Backend, Frontend, QA và DevOps review các file thiết kế thuộc workstream của mình.
4. Chuyển task đủ dependency sang `Ready` trong `work-breakdown-structure.md`.
5. Mỗi Pull Request liên kết Task ID, BA ID, acceptance criteria và test evidence.
6. Cập nhật `implementation-checklist.md`, `traceability-matrix.md` và `evidence-register.md` trong quá trình code.
7. Chỉ ký `exit-report.md` khi tất cả Must acceptance criteria đạt và CI/Compose/browser evidence đầy đủ.

## 6. Nguồn chuẩn

- BA baseline: `../../../business-analysis/`.
- Common implementation standards: `../common/`.
- Phase 01 foundation: `../phase-01/`.
- Source code mục tiêu: `../../../apps/api/` và `../../../apps/web/`.
- Runtime/CI: `../../../docker-compose.yml`, `../../../infrastructure/` và `../../../.github/workflows/ci.yml`.

Khi tài liệu Phase 02 xung đột với BA đã được phê duyệt, phải mở change review; không tự thay đổi nghiệp vụ bằng quyết định code.
