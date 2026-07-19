# Functional Requirements

## Mục Đích

Tài liệu này là catalog **Functional Requirements** của hệ thống **Microlearning Classroom LMS Platform**. Nội dung được viết để Developer có thể triển khai, QA có thể viết test case, Product Owner có thể review scope và Business Analyst có thể trace sang user stories, use cases, API, data model, UI/UX và UAT.

## Nhóm Requirement

| Nhóm | Mô tả |
| --- | --- |
| Authentication & Account | Đăng nhập, đăng ký, session, password, account status |
| Authorization & RBAC | Role, permission, object-level access control |
| Teacher Invitation | Admin tạo invitation link, copy link thủ công, Teacher kích hoạt account |
| Admin Operation | User management, policy, reports, audit, system settings |
| Classroom & Enrollment | Classroom, roster, Class Code và Invite Link |
| Course & Content | Course, Course Dashboard, Module, Lesson, Flashcard, Resource |
| Quiz & Assessment | Quiz, question, answer, media, attempt, score |
| Assignment & Submission | Assignment, submission, grading, feedback, return work |
| Student Learning | Student Dashboard, To-do, Classwork, learning progress, deadline |
| Teacher Analytics | Progress Dashboard, Course Progress Ranking, Gradebook |
| UI Navigation | Back, Previous, Next, breadcrumb, empty/loading/error state |
| API & Documentation | RESTful API, Swagger/OpenAPI, error format, pagination |
| DevOps Foundation | Docker, CI/CD, Cloud deployment, health check, backup, rollback |

## Functional Requirements Catalog

| ID | Requirement | Actor chính | Priority | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| FR-001 | System cho phép user login, logout và refresh session/token. | User | Must | User hợp lệ login được; token/session hết hạn được xử lý; logout vô hiệu session hiện tại. |
| FR-002 | System cho phép Guest tự đăng ký Student account trong MVP. | Guest/Student | Must | Account được gán cố định role `STUDENT`, status `ACTIVE`; password được hash; đăng ký không tạo session hoặc Enrollment và chuyển user đến Login. |
| FR-003 | System hỗ trợ forgot/reset password bằng secure flow. | User | Should | User nhận hoặc mở reset flow; password mới được hash; token reset hết hạn/one-time. |
| FR-004 | System quản lý account status gồm `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED`. | Admin/System | Must | Account `BLOCKED` không thể login hoặc gọi API nghiệp vụ. |
| FR-005 | System áp dụng RBAC và object-level access control. | System | Must | Student/Teacher/Admin chỉ truy cập đúng dữ liệu và chức năng được phép. |
| FR-006 | Admin tạo Teacher invitation link bằng email Teacher và delivery method `MANUAL_COPY`. | Admin | Must | System tạo token bảo mật, status `PENDING`, expiry và trả link để Admin copy. |
| FR-007 | Teacher mở invitation link và tự kích hoạt account. | Teacher | Must | Teacher nhập full name, email, password; email matching đúng; account active với role `TEACHER`. |
| FR-008 | Admin quản lý invitation lifecycle. | Admin | Must | Admin xem `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`; revoke được invitation chưa accept. |
| FR-009 | Admin quản lý user theo từng danh sách riêng: Student List, Teacher List và Admin List. | Admin | Must | User Management không hiển thị lẫn toàn bộ role trong một danh sách mặc định; Admin có thể vào từng list theo role để xem/search/filter/action phù hợp. |
| FR-010 | Admin/Super Admin quản lý role và permission. | Admin/Super Admin | Must | Chỉ user có quyền phù hợp được gán/thu hồi role; hành động ghi audit log. |
| FR-011 | Admin cấu hình Enrollment Policy cấp hệ thống. | Admin | Must | Admin bật/tắt Class Code và Invite Link; policy được áp dụng trước Classroom settings. |
| FR-012 | Admin xem tất cả Classroom/Course ở chế độ governance. | Admin | Must | Admin xem owner, status, member count, content count và trạng thái vận hành. |
| FR-013 | Admin chuyển Classroom ownership khi Teacher offboarding hoặc bàn giao. | Admin | Should | Teacher mới phải `ACTIVE`; ownership transfer ghi audit log. |
| FR-014 | Admin cấu hình File Upload Policy. | Admin | Should | Cấu hình allowed file types, max file size, upload provider. |
| FR-015 | Admin cấu hình Notification Policy. | Admin | Should | Cấu hình in-app/email notification theo loại event; Teacher invitation email không bắt buộc MVP. |
| FR-016 | Admin xem Admin Dashboard và Usage Reports. | Admin | Must | Dashboard hiển thị users, classrooms, courses, completion, recent activity. |
| FR-017 | Admin xem và lọc Audit Log. | Admin | Must | Lọc theo actor, action, resource type, date range; audit log không sửa/xóa bởi user thường. |
| FR-018 | Admin export reports hoặc audit log khi có quyền. | Admin | Should | File export phản ánh đúng bộ lọc và quyền truy cập. |
| FR-019 | Super Admin/Admin có quyền quản lý system configuration cơ bản. | Super Admin/Admin | Must | Thay đổi setting nhạy cảm được kiểm quyền và ghi audit log. |
| FR-020 | Teacher tạo, cập nhật, archive và mở/đóng Classroom. | Teacher | Must | Teacher quản lý Classroom mình sở hữu hoặc được phân quyền. |
| FR-021 | System tạo Class Code duy nhất cho Classroom active. | Teacher/System | Must | Student join được bằng code hợp lệ; code cũ bị vô hiệu khi regenerate. |
| FR-022 | Teacher tạo/copy/regenerate/disable Invite Link cho Classroom. | Teacher | Must | Raw link chỉ trả đúng một lần khi create/regenerate; list/detail chỉ trả metadata. Link cũ không join được sau disable/regenerate và link hợp lệ mở secure preview/join flow nếu policy cho phép. |
| FR-023 | Student đã login join Classroom bằng Class Code hoặc Invite Link. | Student | Must | Chỉ account `STUDENT` `ACTIVE` có session hợp lệ được join; join thành công tạo enrollment/roster record; Guest nhận `401`; duplicate join không tạo bản ghi trùng. |
| FR-024 | Teacher quản lý classroom roster. | Teacher | Must | Teacher xem, tìm kiếm, lọc, remove Student theo quyền; dữ liệu học tập được bảo toàn. |
| FR-025 | Teacher quản lý Classroom Settings. | Teacher | Must | Teacher bật/tắt/reset Class Code và Invite Link; quản lý quyền comment/post theo policy. |
| FR-026 | Teacher tạo Course trong Classroom. | Teacher | Must | Course được liên kết Classroom, owner Teacher và trạng thái `DRAFT` hoặc `PUBLISHED`. |
| FR-027 | System cung cấp Teacher Course Detail Dashboard khi Teacher mở Course. | Teacher | Must | Dashboard hiển thị Course summary, Lesson/Activity list, Student list, progress ranking và deadline. |
| FR-028 | Teacher tạo, cập nhật, sắp xếp Module/Topic trong Course. | Teacher | Must | Module/Topic lưu đúng order, title, description và chứa content items. |
| FR-029 | Teacher tạo, chỉnh sửa, preview, publish, unpublish Micro Lesson. | Teacher | Must | Lesson có title, content, status; Student chỉ thấy item publish/assign. |
| FR-030 | Teacher đặt và reset deadline hoàn thành cho từng Lesson/Activity. | Teacher | Must | `completionDeadline` lưu đúng; khi reset deadline của Lesson đã publish/assigned phải có reason; hiển thị deadline mới cho Teacher và Student To-do/Deadline View. |
| FR-031 | Teacher tạo Flashcard trong Lesson/Module. | Teacher | Must | Flashcard có câu hỏi/câu trả lời và hiển thị đúng ngữ cảnh học. |
| FR-032 | Teacher quản lý Learning Resource như PDF, image, video URL, link, attachment. | Teacher | Should | Resource gắn vào Classroom/Course/Module/Lesson và Student mở được nếu có quyền. |
| FR-033 | System quản lý lifecycle content gồm `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`. | Teacher/System | Must | Content status quyết định visibility; unpublish/archive không xóa progress cũ. |
| FR-034 | Teacher preview content như Student trước khi publish. | Teacher | Should | Preview hiển thị gần giống trải nghiệm Student, gồm media/attachment nếu có. |
| FR-035 | Teacher đăng Announcement trong Class Stream. | Teacher | Must | Student trong Classroom xem được Announcement đã publish. |
| FR-036 | Teacher tạo Quiz và cấu hình instruction, points, attempt limit, time limit, due date. | Teacher | Must | Quiz lưu được setting và publish được khi có ít nhất một question hợp lệ. |
| FR-037 | Teacher tạo Question type `single_choice`, `multiple_choice`, `true_false`, `short_answer`. | Teacher | Must | Question lưu đáp án/scoring rule phù hợp; auto-grade cho objective questions. |
| FR-038 | Teacher tùy chọn thêm image/video vào Quiz Question. | Teacher | Should | Media preview được, xóa được; question không có media vẫn hợp lệ. |
| FR-039 | Student làm Quiz và submit attempt. | Student | Must | Attempt lưu answers, submittedAt, score/status; không submit trùng attempt đã hoàn tất. |
| FR-040 | System tự chấm Quiz khách quan và hỗ trợ manual review cho short answer. | System/Teacher | Must/Should | Auto score đúng với đáp án chuẩn; short answer có thể pending review. |
| FR-041 | Teacher xem Quiz result và quiz performance. | Teacher | Must | Teacher xem score theo Student, câu đúng/sai, attempt time và average score. |
| FR-042 | Teacher tạo Assignment với instruction, max score, due date, attachment và submission policy. | Teacher | Must | Assignment publish được khi có title/instruction hợp lệ. |
| FR-043 | Student nộp Assignment bằng text, file, link hoặc mark as done nếu policy cho phép. | Student | Must | Submission lưu content/file/link/status/submittedAt. |
| FR-044 | Student unsubmit/resubmit Assignment nếu policy cho phép. | Student | Should | Submission status cập nhật đúng, giữ lịch sử thời điểm. |
| FR-045 | Teacher xem Submission status theo Assignment. | Teacher | Must | Teacher xem submitted, missing, late, graded, returned theo từng Student. |
| FR-046 | Teacher chấm điểm, gửi feedback và return work. | Teacher | Must | Student thấy grade/feedback sau khi Teacher return. |
| FR-047 | System hỗ trợ private comment/feedback trong ngữ cảnh Assignment. | Teacher/Student | Should | Comment chỉ Student liên quan và Teacher có quyền xem. |
| FR-048 | System ghi nhận Grade và Feedback liên kết Student, Assignment/Quiz, Classroom/Course. | System | Must | Grade/Feedback truy xuất được ở Student và Teacher views. |
| FR-049 | Student Dashboard hiển thị Classroom, To-do, deadline gần nhất và progress summary; notification chỉ hiển thị khi In-app Notification được bật. | Student | Must | Student thấy ngay việc cần làm sau login, không phụ thuộc tính năng Notification. |
| FR-050 | Student To-do tổng hợp Lesson, Quiz và Assignment chưa hoàn thành; Material chỉ xuất hiện khi Resource Management được bật và Material được đánh dấu required/actionable. | Student/System | Must | Item có title, classroom, type, due date, status, action; hoàn thành thì rời danh sách chính. |
| FR-051 | Student xem Class Stream và Classwork của Classroom đã join. | Student | Must | Student chỉ thấy content thuộc Classroom đã enroll và được publish/assign. |
| FR-052 | Student mở Lesson Player và hoàn thành Lesson. | Student | Must | System ghi startedAt/completedAt/progress status theo completion rule. |
| FR-053 | Student học Flashcard trong Lesson/Module. | Student | Must | Flashcard hiển thị đúng và có thể được tính progress nếu required. |
| FR-054 | Student xem My Learning Progress theo Classroom/Course. | Student | Must | Hiển thị completed, not started, in progress, missing, late, percentage. |
| FR-055 | Student xem Grade & Feedback của chính mình. | Student | Must | Student không xem được grade/feedback của người khác. |
| FR-056 | Student xem Learning Calendar/Deadline View. | Student | Should | Hiển thị Lesson/Quiz/Assignment deadlines theo Classroom/Course. |
| FR-057 | UI cung cấp Back, Previous, Next, breadcrumb hoặc return link ở flow chính. | Student/Teacher/Admin | Must | User quay về ngữ cảnh cha hoặc chuyển bài/step không mất dữ liệu. |
| FR-058 | System hỗ trợ in-app notification cơ bản. | User/System | Should | Notification cho announcement, feedback, deadline, submission nếu bật. |
| FR-059 | System ghi Learning Progress theo Student, Classroom, Course, Activity. | System | Must | Progress cập nhật khi hoàn thành Lesson, Quiz, Assignment; required Material chỉ được tính khi Resource Management được bật. |
| FR-060 | Teacher Progress Dashboard hiển thị progress từng Student trong Classroom. | Teacher | Must | Dashboard có progress %, completed lessons, quiz score, assignment status, last active. |
| FR-061 | Course Student Progress Ranking sort `processScore DESC`. | Teacher | Must | Bảng progress trong Course mặc định điểm cao xuống thấp. |
| FR-062 | Gradebook Basic hiển thị điểm Quiz/Assignment theo Student. | Teacher | Should | Teacher xem, lọc, export điểm cơ bản nếu có quyền. |
| FR-063 | System tính hoặc trả về `processScore` cho Course Dashboard. | System | Must | MVP có thể dùng `processScore = progressPercentage`; frontend không hard-code công thức. |
| FR-064 | System hỗ trợ search, filter, sort, pagination cho danh sách lớn. | User/System | Must | Users, classrooms, students, submissions, audit logs, progress ranking có phân trang/lọc/sort. |
| FR-065 | System chuẩn hóa error response cho RESTful API. | Developer/QA | Must | API trả code/message/details nhất quán để frontend hiển thị lỗi rõ. |
| FR-066 | System cung cấp RESTful API versioned theo `/api/v1`. | Developer | Must | Endpoint theo resource, dùng JSON, có auth/authorization phù hợp. |
| FR-067 | System document API bằng Swagger/OpenAPI. | Developer/QA | Must | OpenAPI contract bao phủ auth, classroom, course, quiz, assignment, progress, admin APIs và được cập nhật cùng API change. |
| FR-067A | System hiển thị API documentation bằng Swagger UI. | Developer/QA/DevOps | Must | `GET /api-docs` hiển thị Swagger UI từ cùng OpenAPI specification tại `GET /api/v1/openapi.json`; Local/Development hỗ trợ thử API bằng synthetic test credential, Staging/Production tuân exposure policy an toàn. |
| FR-068 | System bảo vệ upload/media/resource bằng access control. | System | Must | Student chỉ truy cập file/media thuộc Classroom/Course có quyền. |
| FR-069 | System ghi audit log cho hành động quan trọng. | System/Admin | Must | Create invitation, role change, account block, ownership transfer, policy update, content publish được log. |
| FR-070 | System hỗ trợ health check endpoint phục vụ DevOps. | DevOps | Must | Health check phản ánh trạng thái API và dependencies cơ bản. |
| FR-071 | Project chạy được bằng Docker/Docker Compose cho local hoặc demo. | DevOps/Developer | Must | Frontend/backend/database chạy được theo hướng dẫn. |
| FR-072 | CI/CD pipeline build, test và deploy được hệ thống. | DevOps | Must | Pipeline chạy lint/test/build/deploy theo branch/release policy. |
| FR-073 | Cloud deployment sử dụng environment variables cho config nhạy cảm. | DevOps | Must | Không hard-code secrets/API URL/database URL trong source code. |
| FR-074 | System có logging/monitoring foundation. | DevOps/Admin | Must | Có log lỗi API, health status và cơ sở theo dõi downtime. |
| FR-075 | System có backup và rollback strategy ở mức nền tảng. | DevOps | Must | MongoDB backup và rollback deployment được mô tả/thực hành trong DevOps docs. |

## Child Requirements Cho FR-009 - Admin User Management Lists

FR-009 được tách thành các chức năng nhỏ hơn để tránh màn hình User Management bị quá tải và để mỗi role có action phù hợp với nghiệp vụ riêng.

| Child ID | Chức năng | Actor | Priority | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| FR-009A | Admin xem Student List. | Admin | Must | Danh sách chỉ hiển thị user có role `STUDENT`; hỗ trợ search theo tên/email/mã Student, filter status/organization/classroom nếu có, pagination và action như view detail, block/unblock, deactivate, restore. |
| FR-009B | Admin xem Teacher List. | Admin | Must | Danh sách chỉ hiển thị user có role `TEACHER`; hỗ trợ search theo tên/email, filter status/invitation status/department, xem số Classroom/Course đang quản lý và action như create invitation, view detail, block/unblock, offboarding. |
| FR-009C | Admin xem Admin List. | Admin/Super Admin | Must | Danh sách chỉ hiển thị user có role `ADMIN` hoặc `SUPER_ADMIN`; action nhạy cảm như cấp/thu hồi Admin permission phải yêu cầu quyền phù hợp và ghi audit log. |

### Ghi Chú Thiết Kế Cho FR-009

- `All Users` có thể tồn tại dưới dạng advanced/global search, nhưng không nên là màn hình mặc định của Admin User Management.
- Mỗi list phải có empty state, loading state, error state và pagination.
- Các action hiển thị trên từng dòng user phải theo role và permission hiện tại của Admin.
- Với hệ thống lớn, frontend nên dùng API filter theo role thay vì tải toàn bộ users rồi lọc ở client.

## Requirement Notes Theo Domain

### Student Domain

Student workflow bắt buộc gồm:

```text
Login/Register nếu được phép
        ↓
Join Classroom bằng Code/Link
        ↓
Mở Student Dashboard
        ↓
Xem To-do / Deadline
        ↓
Mở Lesson / Quiz / Assignment
        ↓
Hoàn thành activity
        ↓
Xem Progress / Grade / Feedback
```

### Teacher Domain

Teacher workflow bắt buộc gồm:

```text
Kích hoạt account qua invitation
        ↓
Tạo Classroom
        ↓
Tạo Course
        ↓
Tạo Module / Lesson / Flashcard / Quiz / Assignment
        ↓
Đặt deadline cho Lesson/Activity
        ↓
Publish content
        ↓
Xem Course Dashboard / Progress Ranking
        ↓
Chấm điểm và Feedback
```

### Admin Domain

Admin workflow bắt buộc gồm:

```text
Login Admin Dashboard
        ↓
Tạo Teacher invitation link
        ↓
Copy link và gửi thủ công
        ↓
Quản lý Student List / Teacher List / Admin List
        ↓
Quản lý role / status theo quyền
        ↓
Cấu hình enrollment policy
        ↓
Xem reports / audit log
        ↓
Xử lý governance / offboarding
```

## Requirement Dependencies

| Requirement | Phụ thuộc |
| --- | --- |
| Student To-do | Assignment/Lesson/Quiz publish, Progress, Deadline |
| Teacher Course Dashboard | Course, Lesson, Roster, Progress, Gradebook |
| Progress Ranking | Progress tracking, Quiz score, Assignment score |
| Teacher Invitation | Admin account, token generation, email matching |
| Swagger/OpenAPI | API endpoint catalog và response schema |
| Cloud Deployment | Docker, environment variables, CI/CD |

## Acceptance Coverage

Mỗi FR Must phải có ít nhất:

- User story hoặc use case liên quan.
- Acceptance criteria rõ.
- Test scenario hoặc UAT case.
- API/data/UI impact nếu có.
- Business rule nếu requirement có logic nghiệp vụ.
