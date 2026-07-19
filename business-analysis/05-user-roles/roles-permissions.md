# Roles And Permissions

## Mục Đích

Tài liệu này mô tả chi tiết vai trò người dùng, trạng thái tài khoản, nhóm quyền, nguyên tắc phân quyền và cách hệ thống kiểm tra quyền trong **Microlearning Classroom LMS Platform**.

Phần này rất quan trọng vì hệ thống có nhiều actor khác nhau:

- **Student** học và nộp bài.
- **Teacher** tạo Classroom, Classwork và theo dõi Progress.
- **Admin** quản trị user, role, policy, reports và audit log.
- **Super Admin** quản lý cấu hình nhạy cảm và quyền quản trị cao nhất.

Mục tiêu của tài liệu là đảm bảo mọi hành động trong hệ thống đều được kiểm soát đúng người, đúng quyền, đúng trạng thái và đúng phạm vi dữ liệu.

## Role Model Tổng Quan

Hệ thống sử dụng mô hình **Role-Based Access Control (RBAC)** kết hợp với **Object-Level Access Control**.

Điều đó có nghĩa là:

```text
User có role phù hợp
        +
Account status hợp lệ
        +
Được phép trên resource cụ thể
        +
Không bị chặn bởi system policy
        =
Được thực hiện hành động
```

Ví dụ:

- Teacher có role `TEACHER`, nhưng nếu account bị `BLOCKED` thì không được tạo Classroom.
- Student có role `STUDENT`, nhưng chỉ xem được Classroom mà Student đã enroll.
- Teacher chỉ quản lý Classroom do mình sở hữu, trừ khi được Admin/Super Admin cấp quyền đặc biệt.
- Admin có thể quản trị users, roles, policies, reports và audit log, nhưng không phải actor chính để tạo bài học hằng ngày.

## Danh Sách Role

| Role | Loại | Mô tả ngắn | Có account không | Priority |
| --- | --- | --- | --- | --- |
| Guest | Temporary actor | Người chưa đăng nhập hoặc đang mở invitation/join link | Không bắt buộc | Must |
| Student | Product user | Người học tham gia Classroom và hoàn thành learning activities | Có | Must |
| Teacher | Product user | Giảng viên tạo Classroom, Classwork, đánh giá và theo dõi Student | Có | Must |
| Admin | Operations user | Người vận hành hệ thống, quản lý users, roles, policies, reports, audit log | Có | Must |
| Super Admin | Privileged operations user | Role cao nhất, quản lý cấu hình nhạy cảm và admin permissions | Có | Should |

## Account Status

Role chỉ xác định người dùng **là ai**. Account status xác định người dùng **có được hoạt động hay không**.

| Status | Ý nghĩa | Được login | Được gọi API nghiệp vụ | Ghi chú |
| --- | --- | --- | --- | --- |
| PENDING | Account/invitation đã tạo nhưng chưa kích hoạt | Không hoặc hạn chế | Không | Dùng cho Teacher invitation hoặc account chờ kích hoạt |
| ACTIVE | Account đang hoạt động | Có | Có, theo role | Trạng thái hợp lệ để dùng hệ thống |
| INACTIVE | Account tạm ngưng | Không hoặc hạn chế | Không | Có thể mở lại |
| BLOCKED | Account bị khóa | Không | Không | Dùng khi vi phạm hoặc cần chặn truy cập |
| DELETED | Account đã xóa mềm | Không | Không | Dữ liệu học tập/audit nên được giữ |

## Quy Tắc Kết Hợp Role Và Status

| Rule ID | Quy tắc |
| --- | --- |
| RPR-001 | User chỉ được sử dụng hệ thống đầy đủ khi `status = ACTIVE`. |
| RPR-002 | Account `BLOCKED`, `INACTIVE`, `DELETED` không được gọi API nghiệp vụ. |
| RPR-003 | Teacher chỉ được tạo Classroom khi `role = TEACHER` và `status = ACTIVE`. |
| RPR-004 | Student chỉ được học/nộp bài trong Classroom đã enroll và account đang `ACTIVE`. |
| RPR-005 | Admin chỉ được quản trị user/role/policy nếu account đang `ACTIVE`. |
| RPR-006 | Super Admin là role duy nhất có toàn quyền với system configuration nhạy cảm. |
| RPR-007 | Guest không được xem dữ liệu riêng tư của Classroom, Student, Teacher hoặc Admin. |

## Role Chi Tiết: Guest

### Định Nghĩa

Guest là người chưa xác thực hoặc chưa có session hợp lệ. Guest có thể truy cập một số entry point công khai như Login, Register, Teacher Invitation Link hoặc Classroom Join Link.

### Mục Tiêu

- Đăng nhập vào hệ thống.
- Tự đăng ký account với role cố định `STUDENT`.
- Mở Teacher Invitation Link để kích hoạt account Teacher.
- Mở Classroom Invite Link và được yêu cầu Login/Register nếu cần.

### Quyền Được Phép

| Permission | Mô tả |
| --- | --- |
| `auth.login.view` | Xem login page |
| `auth.login.submit` | Gửi thông tin login |
| `auth.register.view` | Xem Student Register page |
| `auth.register.submit` | Gửi yêu cầu tạo account `STUDENT`; không được chọn role/status |
| `teacher_invitation.open` | Mở Teacher invitation link |
| `classroom_join_link.open` | Mở Classroom join link ở trạng thái public entry |

### Không Được Phép

- Không được xem Classroom private.
- Không được join Classroom nếu chưa authenticated theo policy.
- Không được xem Classwork, Submission, Grade, Feedback.
- Không được gọi API quản trị.

## Role Chi Tiết: Student

### Định Nghĩa

Student là người học trong hệ thống. Student tham gia Classroom bằng Class Code hoặc Invite Link, sau đó học nội dung được Teacher giao.

### Mục Tiêu

- Join Classroom đúng lớp.
- Xem Class Stream và Classwork.
- Học Micro Lesson, Flashcard.
- Làm Quiz.
- Nộp Assignment.
- Xem Progress, Grade, Feedback và Deadline.

### Điều Kiện Truy Cập

Student chỉ được truy cập learning content khi:

```text
role = STUDENT
status = ACTIVE
Enrollment tồn tại
Enrollment status = ACTIVE
Classroom status = ACTIVE
Content đã publish hoặc đã đến lịch mở
```

### Nhóm Quyền Student

| Permission Group | Permissions | Mô tả |
| --- | --- | --- |
| Account | `profile.view`, `profile.update_own` | Xem và cập nhật hồ sơ cá nhân |
| Classroom Joining | `classroom.join_by_code`, `classroom.join_by_link` | Tham gia Classroom |
| Classroom View | `classroom.view_enrolled`, `stream.view`, `classwork.view` | Xem Classroom đã tham gia |
| Learning | `lesson.view`, `lesson.complete`, `flashcard.view`, `resource.view` | Học nội dung |
| Quiz | `quiz.view`, `quiz.attempt`, `quiz.result_own` | Làm quiz và xem kết quả của mình |
| Assignment | `assignment.view`, `submission.create`, `submission.update_own`, `submission.view_own` | Nộp bài và xem bài nộp của mình |
| Grade / Feedback | `grade.view_own`, `feedback.view_own` | Xem điểm và feedback của mình |
| Progress | `progress.view_own` | Xem tiến độ cá nhân |
| Notification | `notification.view_own`, `notification.mark_read_own` | Xem thông báo cá nhân |

### Student Không Được Phép

| Không được phép | Lý do |
| --- | --- |
| Tạo Classroom | Student không phải người tổ chức lớp |
| Tạo Classwork | Chỉ Teacher có quyền tạo nội dung |
| Xem progress của Student khác | Bảo vệ privacy |
| Chấm điểm hoặc feedback | Chỉ Teacher thực hiện |
| Quản lý roster | Chỉ Teacher/Admin |
| Quản lý roles/users/policies | Chỉ Admin/Super Admin |
| Xem AuditLog | Chỉ Admin/Super Admin |

## Role Chi Tiết: Teacher

### Định Nghĩa

Teacher là người tổ chức và dẫn dắt hoạt động học tập trong Classroom. Teacher tạo Classroom, mời Student, tạo nội dung microlearning, giao bài, chấm điểm, feedback và theo dõi Progress.

Teacher account trong MVP được kích hoạt bằng **manual invitation link**:

```text
Admin nhập email Teacher
        ↓
System tạo invitation link
        ↓
Admin copy link và gửi thủ công
        ↓
Teacher mở link, nhập đúng email, tạo mật khẩu
        ↓
Role = TEACHER
Status = ACTIVE
```

### Mục Tiêu

- Tạo và quản lý Classroom.
- Chia sẻ Class Code, Invite Link cho Student.
- Quản lý Roster.
- Tạo Module, Lesson, Flashcard, Quiz, Assignment và Resource.
- Xem Submission.
- Chấm điểm và gửi Feedback.
- Theo dõi Progress từng Student.

### Điều Kiện Truy Cập

Teacher chỉ được quản lý Classroom khi:

```text
role = TEACHER
status = ACTIVE
Teacher là owner của Classroom
hoặc Teacher được cấp quyền quản lý Classroom
hoặc Admin/Super Admin cấp quyền đặc biệt
```

### Nhóm Quyền Teacher

| Permission Group | Permissions | Mô tả |
| --- | --- | --- |
| Account | `profile.view`, `profile.update_own` | Quản lý hồ sơ cá nhân |
| Classroom | `classroom.create`, `classroom.update_owned`, `classroom.archive_owned`, `classroom.view_owned` | Quản lý Classroom sở hữu |
| Join Mechanism | `class_code.view_owned`, `class_code.reset_owned`, `invite_link.view_owned` | Quản lý cách Student join |
| Roster | `roster.view_owned`, `roster.remove_student_owned` | Quản lý Student trong Classroom sở hữu |
| Announcement | `announcement.create_owned`, `announcement.update_owned`, `announcement.delete_owned` | Đăng và quản lý thông báo |
| Module / Topic | `module.create_owned`, `module.update_owned`, `module.delete_owned`, `module.reorder_owned` | Tổ chức nội dung |
| Lesson | `lesson.create_owned`, `lesson.update_owned`, `lesson.publish_owned`, `lesson.unpublish_owned` | Quản lý Micro Lesson |
| Flashcard | `flashcard.create_owned`, `flashcard.update_owned`, `flashcard.delete_owned` | Quản lý Flashcard |
| Quiz | `quiz.create_owned`, `quiz.update_owned`, `quiz.publish_owned`, `quiz.result_view_owned` | Quản lý Quiz |
| Assignment | `assignment.create_owned`, `assignment.update_owned`, `assignment.publish_owned`, `assignment.close_owned` | Quản lý Assignment |
| Submission | `submission.view_owned`, `submission.status_view_owned` | Xem bài nộp của Student trong Classroom sở hữu |
| Grade / Feedback | `grade.create_owned`, `grade.update_owned`, `feedback.create_owned`, `work.return_owned` | Chấm điểm và feedback |
| Progress | `progress.view_classroom_owned`, `progress.view_student_owned` | Xem tiến độ lớp và từng Student |
| Resource | `resource.create_owned`, `resource.update_owned`, `resource.delete_owned` | Quản lý tài liệu học tập |

### Teacher Không Được Phép

| Không được phép | Lý do |
| --- | --- |
| Quản lý user toàn hệ thống | Thuộc Admin |
| Đổi role user | Thuộc Admin/Super Admin |
| Xem AuditLog toàn hệ thống | Thuộc Admin/Super Admin |
| Xem Classroom không sở hữu nếu không được cấp quyền | Bảo vệ dữ liệu lớp khác |
| Cập nhật system settings | Thuộc Admin/Super Admin |
| Tự cấp quyền Teacher/Admin cho người khác | Bảo vệ RBAC |

## Role Chi Tiết: Admin

### Định Nghĩa

Admin là người vận hành hệ thống. Admin không phải actor chính để giảng dạy hằng ngày. Admin tập trung vào quản trị account, role, policy, reports, audit log và governance.

### Mục Tiêu

- Quản lý Teacher, Student và account status.
- Xem riêng Student List, Teacher List và Admin List để tránh trộn dữ liệu user không cần thiết.
- Tạo và copy Teacher invitation link.
- Quản lý Role và Permission theo policy.
- Quản lý Enrollment Policy ở cấp hệ thống.
- Xem Classroom/Course governance.
- Xem Usage Reports và AuditLog.
- Hỗ trợ Teacher offboarding.

### Điều Kiện Truy Cập

Admin chỉ được quản trị khi:

```text
role = ADMIN
status = ACTIVE
permission cụ thể được cấp
action không yêu cầu Super Admin
```

### Nhóm Quyền Admin

| Permission Group | Permissions | Mô tả |
| --- | --- | --- |
| User Management | `user.view_students`, `user.view_teachers`, `user.view_admins`, `user.search`, `user.update_status`, `user.update_profile_admin` | Quản lý account theo từng danh sách role |
| Teacher Invitation | `teacher_invitation.create`, `teacher_invitation.copy_link`, `teacher_invitation.view`, `teacher_invitation.revoke` | Tạo/copy/revoke invitation |
| Account Status | `account.block`, `account.unblock`, `account.deactivate`, `account.restore` | Quản lý trạng thái account |
| Role Management | `role.view`, `role.assign_limited`, `role.revoke_limited` | Quản lý role trong phạm vi được cấp |
| Classroom Governance | `classroom.view_all`, `classroom.status_update_admin`, `classroom.ownership_transfer` | Giám sát và quản trị Classroom |
| Enrollment Policy | `enrollment_policy.view`, `enrollment_policy.update` | Cấu hình Class Code và Invite Link |
| File Policy | `policy.file.view`, `policy.file.update` | Cấu hình upload file |
| Notification Policy | `policy.notification.view`, `policy.notification.update` | Cấu hình notification |
| Reports | `report.view_all`, `report.export` | Xem/xuất report |
| AuditLog | `audit_log.view`, `audit_log.export` | Xem/xuất AuditLog |
| Support | `support.case_view`, `support.user_assist` | Hỗ trợ vận hành |

### Admin Không Được Phép Theo Mặc Định

| Không được phép theo mặc định | Lý do |
| --- | --- |
| Tự đặt hoặc xem mật khẩu Teacher/Student | Vi phạm bảo mật |
| Sửa/xóa AuditLog | AuditLog phải bất biến với user thường |
| Tạo nội dung học tập hằng ngày thay Teacher | Không phải workflow chính của Admin |
| Chấm điểm thay Teacher | Chỉ thực hiện nếu có quyền override đặc biệt |
| Cấp quyền Super Admin | Chỉ Super Admin hiện hữu được làm |
| Sửa system settings nhạy cảm | Thuộc Super Admin hoặc Admin có permission đặc biệt |

## Role Chi Tiết: Super Admin

### Định Nghĩa

Super Admin là role có quyền cao nhất trong hệ thống, dùng cho các thao tác nhạy cảm như cấu hình hệ thống, cấp/thu hồi quyền Admin và quản lý security settings.

### Mục Tiêu

- Quản lý Admin permissions.
- Quản lý system configuration nhạy cảm.
- Quản lý security policy.
- Truy cập đầy đủ reports/audit để kiểm tra hệ thống.
- Thực hiện các thao tác override trong tình huống vận hành đặc biệt.

### Nhóm Quyền Super Admin

| Permission Group | Permissions | Mô tả |
| --- | --- | --- |
| Full Admin Governance | `admin.full_access` | Toàn quyền quản trị hệ thống |
| Admin Permission Management | `admin.create`, `admin.permission_update`, `admin.revoke` | Quản lý quyền Admin |
| System Configuration | `system_setting.view`, `system_setting.update_sensitive` | Cấu hình hệ thống nhạy cảm |
| Security Policy | `security_policy.view`, `security_policy.update` | Password policy, session, rate limit |
| Integration Settings | `integration.view`, `integration.update` | Email/notification/storage provider nếu có |
| Audit / Reports | `audit_log.view_all`, `audit_log.export_all`, `report.view_all` | Audit và report toàn hệ thống |
| Emergency Override | `override.classroom_access`, `override.account_recovery` | Xử lý tình huống đặc biệt |

### Super Admin Governance

- Super Admin phải dùng ít nhất có thể trong vận hành hằng ngày.
- Các hành động của Super Admin phải ghi AuditLog.
- Không nên có nhiều Super Admin trong hệ thống nhỏ.
- Super Admin không được dùng để bỏ qua business process nếu không có lý do vận hành rõ ràng.

## Permission Naming Convention

Để backend dễ kiểm soát, permission nên được đặt theo format:

```text
resource.action.scope
```

Ví dụ:

```text
classroom.create
classroom.update_owned
submission.view_owned
grade.view_own
audit_log.view_all
system_setting.update_sensitive
```

| Thành phần | Ý nghĩa |
| --- | --- |
| resource | Đối tượng được thao tác, ví dụ classroom, quiz, submission |
| action | Hành động, ví dụ create, view, update, delete, export |
| scope | Phạm vi, ví dụ own, owned, all, sensitive |

## Các Loại Scope Trong Permission

| Scope | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| `own` | Dữ liệu của chính user | `grade.view_own` |
| `owned` | Dữ liệu thuộc resource user sở hữu | `classroom.update_owned` |
| `enrolled` | Dữ liệu trong Classroom user đã tham gia | `classwork.view_enrolled` |
| `all` | Dữ liệu toàn hệ thống | `user.view_all` |
| `admin` | Quyền quản trị giới hạn | `classroom.status_update_admin` |
| `sensitive` | Quyền nhạy cảm, thường chỉ Super Admin | `system_setting.update_sensitive` |

## Authorization Check Flow

Mỗi request nghiệp vụ nên được kiểm tra theo thứ tự:

```text
1. User đã authenticated chưa?
        ↓
2. Account status có ACTIVE không?
        ↓
3. Role có permission cần thiết không?
        ↓
4. Resource có tồn tại không?
        ↓
5. User có quyền trên resource cụ thể không?
        ↓
6. System policy có cho phép hành động này không?
        ↓
7. Nếu action nhạy cảm, ghi AuditLog
        ↓
8. Cho phép hoặc từ chối request
```

## Object-Level Rules

| Resource | Rule |
| --- | --- |
| Classroom | Student chỉ xem nếu có Enrollment active; Teacher chỉ quản lý nếu là owner; Admin xem theo governance permission |
| Course / Module / Lesson | Student chỉ xem content đã publish trong Classroom đã enroll |
| Quiz | Student chỉ attempt Quiz được assign/published; Teacher xem result trong Classroom owned |
| Assignment | Student chỉ nộp Assignment trong Classroom đã enroll; Teacher quản lý Assignment owned |
| Submission | Student chỉ xem Submission của mình; Teacher xem Submission trong Classroom owned |
| Grade / Feedback | Student chỉ xem Grade/Feedback của mình; Teacher tạo Grade/Feedback cho Classroom owned |
| AuditLog | Admin/Super Admin xem; user thường không được sửa/xóa |
| TeacherInvitation | Admin/Super Admin tạo, copy, revoke; Teacher chỉ accept bằng token hợp lệ |

## Account Lifecycle Theo Role

### Teacher Lifecycle

```text
Admin nhập email Teacher
        ↓
System tạo invitation link với deliveryMethod = MANUAL_COPY
        ↓
Admin copy link và gửi thủ công
        ↓
Teacher mở link
        ↓
Teacher nhập đúng email được mời
        ↓
Teacher tạo mật khẩu
        ↓
System set Role = TEACHER, Status = ACTIVE
```

### Student Lifecycle

```text
Student register hoặc được tạo account
        ↓
Student login
        ↓
Student join Classroom bằng Code/Link
        ↓
System tạo Enrollment
        ↓
Student học và tạo Progress
```

### Admin Lifecycle

```text
Super Admin hoặc Admin có quyền tạo/cấp account Admin
        ↓
Admin login
        ↓
Admin quản lý users, roles, policies, reports
        ↓
Mọi hành động quan trọng được ghi AuditLog
```

## Permission Risk Classification

| Risk Level | Permission Type | Ví dụ | Kiểm soát |
| --- | --- | --- | --- |
| Low | View own data | Student xem progress cá nhân | Authenticated + ownership |
| Medium | Create/update owned resource | Teacher tạo Lesson | Role + ownership |
| High | Manage other users/resources | Admin khóa account, transfer Classroom | Admin permission + AuditLog |
| Critical | System/security settings | Super Admin đổi security policy | Super Admin + AuditLog + approval |

## Audit Requirements Theo Permission

| Action | Có cần AuditLog | Lý do |
| --- | --- | --- |
| Login failed nhiều lần | Should | Security monitoring |
| Create Teacher Invitation | Must | Onboarding Teacher |
| Copy Teacher Invitation Link | Should | Trace manual sharing nếu triển khai |
| Accept Teacher Invitation | Must | Kích hoạt account |
| Revoke Invitation | Must | Kiểm soát truy cập |
| Change Role | Must | Quyền nhạy cảm |
| Block / Unblock Account | Must | Quản trị user |
| Transfer Classroom Ownership | Must | Bàn giao dữ liệu lớp |
| Update Enrollment Policy | Must | Ảnh hưởng toàn hệ thống |
| Update System Settings | Must | Cấu hình nhạy cảm |
| Grade Submission | Should | Theo dõi đánh giá học tập |

## Business Rules Liên Quan

| Rule | Nội dung |
| --- | --- |
| BR-001 | Student phải authenticated trước khi tham gia Classroom |
| BR-003 | Student chỉ truy cập Classroom đã tham gia |
| BR-004 | Teacher chỉ quản lý Classroom do mình sở hữu, trừ khi có admin permission |
| BR-010 | Admin không được tạo hoặc biết mật khẩu của Teacher |
| BR-011 | Teacher account kích hoạt qua invitation link do Admin tạo/copy/gửi thủ công |
| BR-014A | System không bắt buộc gửi Teacher invitation qua email tự động trong MVP |
| BR-015 | Account `BLOCKED` không được login hoặc gọi API nghiệp vụ |
| BR-020 | Đổi role, khóa account, mở khóa account và chuyển ownership phải ghi AuditLog |
| BR-026 | System configuration nhạy cảm chỉ được thay đổi bởi Super Admin hoặc Admin được cấp quyền |

## Kết Luận

Hệ thống cần phân quyền theo nhiều lớp:

```text
Role
        ↓
Account Status
        ↓
Permission
        ↓
Resource Ownership / Enrollment
        ↓
System Policy
        ↓
AuditLog nếu hành động nhạy cảm
```

Thiết kế này giúp dự án an toàn hơn, rõ nghiệp vụ hơn và dễ triển khai backend hơn. Đây cũng là nền tảng quan trọng để phát triển các phần API, UI, test scenarios và DevOps deployment sau này.
