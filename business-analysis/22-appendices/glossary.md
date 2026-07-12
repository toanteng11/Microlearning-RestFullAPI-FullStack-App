# Glossary

## Mục Đích Và Quy Ước

Glossary định nghĩa thuật ngữ dự án theo cách dùng trong bộ BA. Nội dung giải thích bằng tiếng Việt, nhưng giữ tên domain/technical chuẩn bằng tiếng Anh khi cần để map sang code, API, Swagger và UI. Nếu định nghĩa này khác với source rule/requirement đã phê duyệt, source document theo domain được ưu tiên và BA cập nhật glossary.

### Tên Role Chuẩn

| Tên chuẩn | Cách hiểu trong dự án | Không nên hiểu là |
| --- | --- | --- |
| Student | Role người học trong Internal LMS; tiếng Việt là **học sinh/sinh viên** tùy bối cảnh tổ chức. | Learner có một role khác hoặc Guardian. |
| Teacher | Role tạo/quản lý Classroom và hoạt động học; tiếng Việt là **giảng viên/giáo viên**. | Admin có quyền sở hữu nội dung mặc định. |
| Admin | Role quản trị user, policy, report, audit và governance theo permission. | Có quyền bỏ qua mọi rule/audit. |
| Super Admin | Admin có permission nhạy cảm khi system cấu hình. | Một actor bắt buộc phải có trong mọi flow MVP. |
| Guest | Người chưa authenticated chỉ được truy cập public entry flow hợp lệ. | Được đọc Classroom/content/private data. |

`Learner` chỉ được dùng khi tham chiếu tài liệu người dùng hoặc thuật ngữ chung; trong requirement, API và UI role chuẩn là `Student`.

## Product Và Learning Terms

| Thuật ngữ | Định nghĩa theo dự án |
| --- | --- |
| Microlearning | Mô hình học theo đơn vị nội dung ngắn, tập trung và có thể hoàn thành/ghi nhận tiến độ theo Activity. |
| Internal LMS | Learning Management System phục vụ môi trường nội bộ, ưu tiên workflow Admin–Teacher–Student. |
| Classroom | Không gian lớp học do Teacher sở hữu/quản lý, chứa roster, settings, Stream và Course/Classwork scope. |
| Course | Khóa học/nội dung học thuộc một Classroom, có Module, Activity, Student progress và Teacher dashboard. |
| Module / Topic | Nhóm tổ chức Course content theo thứ tự hiển thị `displayOrder`. |
| Activity | Đơn vị hành động học như Lesson, Quiz, Assignment hoặc Material/Resource khi policy cho phép. |
| Micro Lesson / Lesson | Bài học ngắn do Teacher tạo; Student hoàn thành theo completion policy. |
| Flashcard | Nội dung hỏi/đáp ngắn gắn Lesson/Module, có thể là required Activity theo policy. |
| Class Stream | Khu vực announcement và hoạt động lớp; chỉ reference workflow, không yêu cầu sao chép giao diện bên ngoài. |
| Classwork | Khu vực tổ chức Lesson, Quiz, Assignment, Resource và hoạt động học trong Classroom/Course. |
| Assignment | Bài tập có instruction, submission policy, due date/deadline và có thể được Teacher grade/return. |
| Submission | Bài nộp của một Student cho Assignment; có status/time/history theo policy. |
| Quiz Attempt | Một lần làm Quiz của Student, lưu answer/status/time/score theo attempt policy. |
| Grade | Điểm/kết quả đánh giá của Quiz hoặc Assignment; chỉ visible khi Teacher return/publish theo rule. |
| Feedback | Nhận xét của Teacher cho Student trong scope bài làm; private feedback không hiển thị cho Student khác. |
| Progress | Trạng thái/record học của Student theo Classroom/Course/Activity, ví dụ not started, in progress, completed, late hoặc missing. |
| `progressPercentage` | Tỷ lệ hoàn thành do backend/service tính theo policy Course; frontend chỉ hiển thị. |
| `processScore` | Điểm quá trình dùng cho Course Dashboard/ranking. MVP mặc định có thể bằng `progressPercentage`; weighted formula cần decision/version riêng. |
| Progress Ranking | Danh sách progress/score trong Course do Teacher xem, mặc định `processScore DESC` và có tie-break theo Business Rules. |
| Student To-do | Danh sách Activity actionable/pending của Classroom Student đang active enrollment; completed/valid submitted item rời danh sách chính nhưng còn history/report. |
| Completion Deadline | Hạn hoàn thành Activity/Lesson. Published/assigned Lesson theo MVP policy phải có deadline. |
| Due Date | Hạn nộp/hoàn thành cho Assignment/Quiz/Activity tùy content policy; cần phân biệt với thời điểm publish/close. |
| Late | Hoàn thành/nộp sau deadline khi policy còn cho phép. |
| Missing | Quá deadline nhưng chưa có completion/submission hợp lệ theo policy. |
| Deadline Reset | Teacher có quyền đổi deadline trong scope Course, cần reason/history/AuditLog và recalculation liên quan. |

## Account, Access Và Security Terms

| Thuật ngữ | Định nghĩa theo dự án |
| --- | --- |
| Authentication | Xác minh danh tính User trước khi tạo authenticated session/token. |
| Authorization | Quyết định một authenticated User có được thực hiện action trên resource cụ thể hay không. |
| RBAC | Role-Based Access Control; kiểm tra role/permission theo policy. |
| Object-Level Access Control | Kiểm tra thêm ownership, enrollment, Classroom/Course scope hoặc permission trên resource; role đúng vẫn có thể bị deny. |
| Account Status | Trạng thái account như `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED`; chỉ `ACTIVE` mới làm API nghiệp vụ protected theo rule. |
| Teacher Invitation | Record/token lifecycle để Admin mời Teacher tự kích hoạt account. Delivery MVP là `MANUAL_COPY`. |
| `MANUAL_COPY` | System tạo/trả link để Admin copy và tự gửi qua kênh ngoài. Nó không xác nhận email/Zalo/Facebook/Teams đã gửi hoặc người nhận đã đọc. |
| Invitation Token | Token bí mật gắn invitation; one-time, expiry, revoke, email matching và chỉ lưu hash/digest ở database. |
| Class Code | Mã join dùng cho Classroom active, chỉ hợp lệ khi system/Classroom policy cho phép. |
| Invite Link | Link join Classroom hoặc Teacher activation tùy context; luôn cần server-side validation, không tự cấp quyền chỉ vì biết URL. |
| JWT / Access Token | Credential phiên làm việc theo auth policy; expiry/storage/revoke phải tuân Security ADR. |
| Refresh Token | Credential dùng làm mới session/access token theo policy; không được log/expose raw value. |
| Secret | Credential nhạy cảm như JWT secret, database URI, Cloud key; không commit, log hoặc đưa vào frontend bundle. |
| Password Hashing | Lưu password dưới hash an toàn, không lưu/gửi plain text password. |
| AuditLog | Record append-only cho hành động nghiệp vụ/nhạy cảm, ví dụ invitation, role/status, deadline reset, grade/regrade, export/policy. |

## Data, API Và UI Terms

| Thuật ngữ | Định nghĩa theo dự án |
| --- | --- |
| RESTful API | API HTTP theo resource/action contract, versioned theo `/api/v1`, có auth/authorization/error schema rõ. |
| Swagger / OpenAPI | Contract và tài liệu API machine-readable/human-readable; cập nhật khi endpoint/schema/error/auth thay đổi. |
| API Contract | Thỏa thuận về path, method, request, response, status/error, auth/authorization, pagination/filter/sort và compatibility. |
| Pagination | Cơ chế trả list theo page/limit/cursor thay vì tải toàn bộ dữ liệu lớn. |
| Read Model | Dữ liệu summary/denormalized tối ưu đọc như `StudentTodoItem` hoặc `CourseProgressSummary`; không thay source-of-truth khi chưa có reconciliation policy. |
| Idempotency | Retry/double click cùng action không tạo duplicate Enrollment, Progress, Submission hoặc score transition sai. |
| Data Migration | Thay đổi schema/index/data cần compatibility, backup, validation/reconciliation và recovery direction. |
| ReactJS Frontend | Web client role-specific, gọi REST API và không tự làm source-of-truth cho authorization/score/deadline. |
| Loading / Empty / Error State | Trạng thái UI bắt buộc của P0 flow: đang tải, chưa có dữ liệu hoặc lỗi/retry; tránh màn hình mơ hồ/dead-end. |
| Navigation Controls | Back, Previous, Next, breadcrumb hoặc return context để User không mất đường quay lại trong flow chính. |

## DevOps, Quality Và Release Terms

| Thuật ngữ | Định nghĩa theo dự án |
| --- | --- |
| Docker / Docker Compose | Cách package/chạy service nhất quán cho local/dev và nền tảng deployment. |
| CI/CD | Continuous Integration/Continuous Delivery hoặc Deployment; pipeline build/test/scan/artifact/deploy theo gate. |
| Artifact / Image Digest | Output immutable có version/commit/digest để trace/rollback. Không dùng `latest` là căn cứ duy nhất. |
| Environment | Local, CI, Development/Integration, Staging/UAT hoặc Cloud Demo/Production-like với config/access riêng. |
| Health Check | Endpoint/signal cho biết service/dependency đang UP/DEGRADED/DOWN theo policy. |
| Observability | Khả năng hiểu trạng thái qua logs, metrics, traces/correlation, health, version và alert. |
| Backup | Bản sao dữ liệu/private configuration reference theo policy để hỗ trợ recovery; backup tồn tại không thay thế restore rehearsal. |
| Restore | Khôi phục dữ liệu từ backup theo runbook/authority, ưu tiên target isolated để verify. |
| Rollback | Quay application/config artifact về stable version; không mặc định khôi phục database. |
| Forward Fix | Sửa tiếp theo hướng tương thích thay vì rollback khi data/migration không thể quay an toàn. |
| RPO | Maximum acceptable data loss tính theo thời gian kể từ backup phù hợp. |
| RTO | Target thời gian khôi phục service/data; cần rehearsal trước khi claim readiness. |
| Release Candidate (RC) | Artifact versioned đã qua required CI và sẵn sàng Staging/UAT theo scope freeze. |
| Go / Conditional Go / No-Go | Kết quả readiness review: release đạt, đạt có waiver an toàn, hoặc chưa đủ điều kiện phát hành. |
| UAT | User Acceptance Testing: xác nhận workflow/business acceptance với representative và evidence thật. |
| Waiver | Chấp nhận tạm thời một criterion chưa đạt trong điều kiện kiểm soát; không dùng cho critical security/privacy/data integrity risk. |

## Liên Kết

- Roles/access: `../05-user-roles/`.
- Business Rules: `../17-business-rules/`.
- API/Data/NFR/DevOps: `../10-data-requirements/`, `../11-api-requirements/`, `../13-non-functional-requirements/`, `../15-devops-deployment/`.
- Reference boundary: `google-classroom-reference-glossary.md`.
