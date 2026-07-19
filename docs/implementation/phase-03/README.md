# Phase 03 - Classroom Management

## 1. Mục Đích

Phase 03 xây dựng increment Classroom Management hoàn chỉnh trên nền Identity/RBAC của Phase 02. Sau phase này, Teacher có thể tạo và quản lý Classroom; Student đã đăng nhập có thể tham gia bằng Class Code hoặc Invite Link; Teacher xem và quản lý roster; Admin kiểm soát Enrollment Policy và giám sát Classroom ở cấp hệ thống.

Phase này chỉ tạo container Classroom và quan hệ Enrollment. Course, Module, Lesson, Stream, Announcement, Quiz, Assignment, Grade, Progress và To-do không được triển khai sớm; các capability đó thuộc Phase 04-06.

## 2. Trạng Thái

| Thuộc tính            | Giá trị                                                                       |
| --------------------- | ----------------------------------------------------------------------------- |
| Phase ID              | `P03`                                                                         |
| Tên                   | `Classroom Management`                                                        |
| Dependency            | Phase 02 Authentication and Users đã merge vào `main` tại `61aa049`           |
| Planning status       | `READY_TO_CODE`                                                               |
| Implementation status | `NOT_STARTED`                                                                 |
| Gate A closure        | PR #5; Actions run #11 `6/6`; merge commit `1e8ad41`                         |
| Phase tiếp theo       | `P04 - Learning Content`                                                      |

Phase 03 được phép bắt đầu development. Chỉ đổi `Implementation status` thành `IN_PROGRESS` khi task code đầu tiên thực sự bắt đầu và được liên kết với WBS/evidence.

## 3. Business Outcome

- Teacher `ACTIVE` tạo, xem, cập nhật, đóng/mở enrollment và archive Classroom mình sở hữu.
- System tạo Class Code duy nhất, cho phép regenerate/disable và vô hiệu code cũ.
- Teacher tạo, copy một lần, regenerate hoặc disable Classroom Invite Link.
- Guest mở Invite Link được xem preview an toàn; phải đăng ký/Login thành Student `ACTIVE` trước khi join.
- Student join bằng Code/Link, không tạo duplicate Enrollment khi retry hoặc double click.
- Teacher xem roster có search/filter/sort/pagination và remove Student theo soft state.
- Student xem danh sách Classroom đã enroll và mở Classroom overview theo đúng scope.
- Admin bật/tắt từng join method ở cấp hệ thống; global policy luôn thắng Classroom setting.
- Admin xem Classroom governance list/detail; hành động nhạy cảm có AuditLog.

## 4. BA Baseline

| Nhóm                    | ID chính                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional Requirements | `FR-011`, `FR-012`, `FR-020..025`, `FR-064`, `FR-065`, `FR-067/067A`, `FR-069`                                                                |
| User Stories            | `US-TCH-001..003`, `US-TCH-017`, `US-TCH-031..033`, `US-TCH-078/079`; `US-STU-002/003/005/015..018/025/060`; `US-ADM-009/010/045/046/049/050` |
| Use Cases               | `UC-003..007`, `UC-024`, `UC-031/032`, `UC-052/053`, `UC-064`                                                                                 |
| Business Rules          | `BR-001..004`, `BR-016..020`, `BR-041`, `BR-050..057`, `BR-097`, `BR-099..101`                                                                |
| BA Acceptance           | `AC-JOIN-001..003`, `DATA-AC-002`, `TS-003..006`, `TS-024/025`, `SEC-AC-003/007`                                                              |

## 5. Must Scope

1. Classroom lifecycle và owner-scoped authorization.
2. Class Code lifecycle, safe generation và join.
3. Classroom Invite Link lifecycle, safe preview và join.
4. Enrollment transaction, uniqueness, status và roster.
5. Student Classroom list/detail overview.
6. Teacher Classroom list/create/detail/settings/roster.
7. Admin Enrollment Policy.
8. Admin Classroom governance list/detail.
9. Teacher offboarding guard đối với Classroom đang active.
10. OpenAPI, unit/integration/component/E2E/security/concurrency tests.
11. Docker/CI/seed/evidence cập nhật cho P03.

## 6. Conditional Should

- Transfer Classroom ownership cho Teacher `ACTIVE` khác.
- Admin lock/unlock enrollment của một Classroom.
- `maxStudents` và capacity enforcement.
- Rejoin sau `REMOVED/LEFT` qua explicit approval.
- Student Classroom preview trước khi xác nhận join bằng Class Code.
- Classroom interaction setting được lưu để Phase 04 sử dụng.

Should chỉ được kéo vào sau khi toàn bộ Must critical path không bị ảnh hưởng và có Change Control/owner rõ.

## 7. Out Of Scope

- QR Code join.
- Auto email/SMS/Zalo/Messenger delivery.
- Google Classroom import/synchronization.
- Course, Module, Lesson, Resource, Stream, Announcement.
- Quiz, Assignment, Submission, Grade, Progress, To-do.
- Multi-teacher/co-teacher và enrollment approval nhiều bước.
- Student tự rời/rejoin Classroom trong Must baseline.
- Cloud deployment Production; thực hiện ở Phase 07.

## 8. Tài Liệu Phase

| File                                    | Mục đích                                             |
| --------------------------------------- | ---------------------------------------------------- |
| `scope-and-deliverables.md`             | Khóa scope, actor, dependency và deliverable         |
| `technical-decisions.md`                | Quyết định kỹ thuật bắt buộc trước code              |
| `architecture-and-module-design.md`     | Boundary, module map và request flow                 |
| `classroom-lifecycle-and-enrollment.md` | Lifecycle Classroom/credential/Enrollment            |
| `security-ownership-and-governance.md`  | Permission, object scope, abuse control và audit     |
| `data-model-and-indexes.md`             | Collection, field, index, transaction và migration   |
| `api-contract.md`                       | Endpoint, schema, response/error và OpenAPI contract |
| `backend-implementation-plan.md`        | Thứ tự triển khai backend                            |
| `frontend-implementation-plan.md`       | Route, page, state và API integration React          |
| `devops-environment-and-seeding.md`     | Env, Compose, fixtures, CI và observability          |
| `testing-strategy.md`                   | Test matrix từ unit tới E2E/concurrency/security     |
| `acceptance-criteria.md`                | Điều kiện Pass/Fail kiểm chứng được                  |
| `traceability-matrix.md`                | BA -> task -> API/UI/data -> test                    |
| `work-breakdown-structure.md`           | Task, dependency, output, estimate và status         |
| `implementation-checklist.md`           | Gate thực thi theo từng nhóm                         |
| `risk-and-issues.md`                    | Risk, mitigation, contingency và issue log           |
| `developer-start-guide.md`              | Trình tự bắt đầu code và PR strategy                 |
| `development-readiness-review.md`       | Gate A review trước implementation                   |
| `evidence-register.md`                  | Danh mục evidence phải thu thập                      |
| `exit-report.md`                        | Mẫu đóng phase sau implementation                    |

## 9. Definition Of Ready Tóm Tắt

- Must/Should/Out of scope không mâu thuẫn.
- API request/response/error và permission/object scope đã khóa.
- Collection/index/transaction/concurrency behavior đã khóa.
- Raw Code/Invite Token không lưu hoặc log.
- UI route, loading/empty/error/forbidden/success state đã định nghĩa.
- Acceptance criteria map được tới test/evidence.
- WBS có dependency và critical path.
- Không còn decision `TBD` chặn code.

## 10. Exit Signal

Phase 03 chỉ `Completed` khi Must scope chạy bằng API/MongoDB thật, `P03` acceptance criteria đều Pass, CI trên Pull Request/main xanh, Swagger khớp route, browser E2E pass, không còn Critical/High defect và exit report được review.
