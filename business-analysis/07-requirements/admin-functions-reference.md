# Admin Functions Reference

## Mục Đích

Tài liệu này mô tả các chức năng chính và chức năng con của vai trò **Admin** trong hệ thống **Microlearning Classroom LMS Platform**.

Nội dung được xây dựng dựa trên tài liệu tham khảo về vai trò Admin trong Google Classroom/Google Workspace for Education, sau đó điều chỉnh lại cho phù hợp với đồ án microlearning nội bộ. Trong hệ thống này, Admin không phải là người tạo bài học hoặc chấm điểm hằng ngày như Teacher; Admin là người quản trị nền tảng, kiểm soát tài khoản, role, chính sách tham gia Classroom, báo cáo, audit log, bảo mật và cấu hình hệ thống.

## Phân Biệt Admin Và Super Admin

| Role | Mục tiêu | Quyền đặc trưng |
| --- | --- | --- |
| Admin | Vận hành hệ thống hằng ngày | Quản lý user, invitation, Classroom governance, reports, audit log và support cases |
| Super Admin | Quản trị quyền cao nhất | Quản lý role nhạy cảm, system configuration, integration settings và admin permissions |

Trong MVP, có thể gộp Admin và Super Admin nếu hệ thống nhỏ. Tuy nhiên, tài liệu BA vẫn nên tách rõ để thể hiện tư duy phân quyền chuyên nghiệp.

## Nguyên Tắc Thiết Kế Chức Năng Admin

| Nguyên tắc | Mô tả |
| --- | --- |
| Security-first | Mọi thao tác quản trị phải có phân quyền, audit log và kiểm soát truy cập. |
| Least privilege | Admin chỉ có quyền cần thiết cho nhiệm vụ vận hành; quyền cấu hình nhạy cảm nên thuộc Super Admin. |
| No password exposure | Admin không được biết hoặc gửi mật khẩu cho Teacher/Student. |
| Policy-driven | Các quyền join Classroom, upload file, notification và account status cần được điều khiển bằng policy. |
| Traceable operations | Các hành động như khóa tài khoản, đổi role, chuyển Classroom ownership phải ghi audit log. |
| Data protection | Khi khóa/xóa account hoặc Classroom, hệ thống phải bảo toàn dữ liệu học tập quan trọng. |

## Tổng Quan Nhóm Chức Năng Admin

| STT | Nhóm chức năng | Capability name | Priority | Giai đoạn đề xuất |
| --- | --- | --- | --- | --- |
| 1 | Quản lý tài khoản người dùng | User Account Management | Must | MVP |
| 2 | Quản lý quyền truy cập hệ thống | Platform Access Management | Must | MVP |
| 3 | Quản lý vai trò Teacher / Student / Admin | Role and Permission Management | Must | MVP |
| 4 | Quản lý quyền tạo Classroom | Classroom Creation Policy Management | Must | MVP |
| 5 | Quản lý cấu hình tham gia Classroom | Classroom Enrollment Policy Management | Must | MVP |
| 6 | Quản lý tổ chức / khoa / đơn vị | Organization Management | Should | MVP Lite |
| 7 | Quản lý upload và chia sẻ file | File Upload and Sharing Policy | Should | MVP Lite |
| 8 | Quản lý phụ huynh / người giám hộ | Guardian Management | Won't | Out of MVP |
| 9 | Quản lý kiểm tra trùng lặp bài nộp | Originality / Plagiarism Policy | Could | Post-MVP |
| 10 | Quản lý notification | Notification Configuration | Should | MVP Lite |
| 11 | Quản lý chuyển ownership Classroom | Classroom Ownership Transfer | Should | MVP Lite |
| 12 | Quản lý quyền rời lớp của Student | Student Unenrollment Policy | Should | MVP Lite |
| 13 | Quản lý add-ons / tích hợp bên thứ ba | Integration and Add-on Management | Could | Post-MVP |
| 14 | Quản lý báo cáo sử dụng | Usage Reporting | Must | MVP |
| 15 | Quản lý audit log / bảo mật | Audit Log and Security Monitoring | Must | MVP |
| 16 | Quản lý analytics cấp tổ chức | Organization Analytics | Should | MVP Lite |
| 17 | Quản lý truy cập tạm thời vào Classroom | Temporary Class Access | Could | Post-MVP |
| 18 | Quản lý system settings / providers | System Configuration Management | Must | MVP |
| 19 | Quản lý offboarding Teacher | Teacher Offboarding Policy | Should | MVP Lite |

## 1. User Account Management

### Mục Tiêu

Cho phép Admin quản lý tài khoản Teacher, Student và Admin trong hệ thống.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem Student List | Hiển thị danh sách riêng các user có role `STUDENT`. | Must |
| Xem Teacher List | Hiển thị danh sách riêng các user có role `TEACHER`. | Must |
| Xem Admin List | Hiển thị danh sách riêng các user có role `ADMIN` hoặc `SUPER_ADMIN`. | Must |
| Advanced User Search | Tìm kiếm nâng cao trên toàn bộ user khi Admin cần tra cứu chéo. | Should |
| Tìm kiếm user | Tìm theo họ tên, email, role, trạng thái hoặc đơn vị. | Must |
| Tạo invitation cho Teacher | Admin nhập email Teacher để hệ thống tạo invitation link. | Must |
| Copy invitation link | Admin copy link và tự gửi thủ công qua email, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp. | Must |
| Tạo Student account | Admin tạo hoặc import tài khoản Student nếu hệ thống yêu cầu. | Should |
| Cập nhật thông tin user | Cập nhật họ tên, email phụ, đơn vị, mã số hoặc trạng thái. | Must |
| Khóa tài khoản | Chuyển account sang `BLOCKED` để không cho đăng nhập. | Must |
| Mở khóa tài khoản | Chuyển account về `ACTIVE` sau khi kiểm tra. | Must |
| Deactivate account | Chuyển account sang `INACTIVE` khi user tạm dừng sử dụng. | Should |
| Reset password flow | Gửi link reset password, không đặt mật khẩu thay user. | Must |
| Xóa tài khoản | Xóa mềm account khi user nghỉ học/nghỉ dạy. | Should |
| Khôi phục tài khoản | Restore account trong thời gian cho phép. | Could |
| Bulk import user | Import danh sách user từ CSV/Excel. | Could |

### Thiết Kế Danh Sách User Theo Role

Không nên để màn hình `User Management` mặc định hiển thị lẫn toàn bộ Student, Teacher và Admin trong cùng một bảng. Cách đó không tối ưu vì:

- Số lượng Student thường lớn hơn Teacher/Admin rất nhiều.
- Mỗi role cần cột thông tin khác nhau.
- Mỗi role có action quản trị khác nhau.
- Admin dễ thao tác nhầm nếu tất cả role bị trộn trong một danh sách.
- Phân quyền thao tác với Admin/Super Admin cần kiểm soát chặt hơn Student/Teacher.

Thiết kế đề xuất:

```text
Admin User Management
├── Student List
├── Teacher List
├── Admin List
└── Advanced User Search
```

#### Student List

| Thành phần | Mô tả |
| --- | --- |
| Mục tiêu | Quản lý tài khoản người học |
| Dữ liệu chính | Full name, email, student code, status, classroom count, last active |
| Filter | Status, organization/department, classroom, created date |
| Actions | View detail, block, unblock, deactivate, restore, reset password flow |
| Ghi chú | Không hiển thị action liên quan Teacher invitation hoặc Classroom ownership |

#### Teacher List

| Thành phần | Mô tả |
| --- | --- |
| Mục tiêu | Quản lý tài khoản giảng viên |
| Dữ liệu chính | Full name, email, status, invitation status, classroom count, course count, last active |
| Filter | Status, invitation status, department, active classroom count |
| Actions | View detail, create/copy invitation, block, unblock, deactivate, offboarding |
| Ghi chú | Nếu Teacher còn Classroom active, hệ thống phải cảnh báo trước khi block/deactivate |

#### Admin List

| Thành phần | Mô tả |
| --- | --- |
| Mục tiêu | Quản lý tài khoản quản trị |
| Dữ liệu chính | Full name, email, role, permission group, status, last active |
| Filter | Role, status, permission group |
| Actions | View detail, update permission, deactivate, block |
| Ghi chú | Chỉ Super Admin hoặc Admin có quyền phù hợp mới được thay đổi quyền Admin khác |

#### Advanced User Search

| Thành phần | Mô tả |
| --- | --- |
| Mục tiêu | Tra cứu nhanh khi Admin không biết user thuộc role nào |
| Dữ liệu chính | Full name, email, role, status |
| Filter | Role, status, keyword |
| Actions | View detail; action chỉnh sửa vẫn phụ thuộc role và permission |
| Ghi chú | Đây là chức năng hỗ trợ, không thay thế 3 danh sách chính |

### Business Rules

- Admin không được biết mật khẩu của user.
- Teacher nên được onboarding bằng manual invitation link do Admin copy và gửi thủ công.
- Account bị `BLOCKED` không thể login, join Classroom hoặc tạo nội dung.
- Xóa account nên là soft delete để giữ audit log, Submission, Grade và Progress.
- `User Management` phải tách ít nhất 3 danh sách: Student List, Teacher List và Admin List.
- `All Users` hoặc Advanced Search không được là màn hình mặc định nếu hệ thống có nhiều user.

## 2. Platform Access Management

### Mục Tiêu

Cho phép Admin kiểm soát user nào được truy cập nền tảng và dịch vụ nào được bật trong hệ thống.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật/tắt access theo user | Cho phép hoặc chặn một user cụ thể. | Must |
| Bật/tắt access theo role | Kiểm soát quyền truy cập của Student, Teacher, Admin. | Must |
| Bật/tắt access theo organization | Cho phép một khoa, lớp hoặc đơn vị sử dụng hệ thống. | Should |
| Quản lý account status | `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED`. | Must |
| Cấu hình login policy | Cài rule về password, session timeout hoặc login attempt. | Should |
| Cấu hình maintenance mode | Tạm khóa nền tảng khi bảo trì. | Could |

### Business Rules

- Account `PENDING` chưa được phép sử dụng đầy đủ.
- Account `ACTIVE` được sử dụng theo role được cấp.
- Account `BLOCKED` không được truy cập API nghiệp vụ.

## 3. Role and Permission Management

### Mục Tiêu

Cho phép Admin hoặc Super Admin quản lý role, permission và quyền truy cập theo mô hình RBAC.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem danh sách role | `ADMIN`, `TEACHER`, `STUDENT`, `SUPER_ADMIN`. | Must |
| Gán role cho user | Gán role phù hợp cho tài khoản. | Must |
| Đổi role user | Chuyển Student thành Teacher hoặc Teacher thành Student nếu có lý do. | Should |
| Thu hồi role | Gỡ quyền Teacher/Admin khi user không còn nhiệm vụ. | Must |
| Quản lý permission | Xác định quyền theo từng role. | Should |
| Kiểm soát quyền Admin | Chỉ Super Admin được cấp hoặc thu hồi quyền Admin nhạy cảm. | Must |
| Xem lịch sử đổi role | Audit ai đổi role, đổi lúc nào, lý do gì. | Must |

### Business Rules

- Student không tự đổi role thành Teacher.
- Teacher không được cấp quyền Admin.
- Việc cấp quyền Admin hoặc Super Admin phải được ghi audit log.

## 4. Classroom Creation Policy Management

### Mục Tiêu

Cho phép Admin quy định ai được tạo Classroom trong hệ thống.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Cho Teacher tạo Classroom | Chỉ Teacher active được tạo Classroom. | Must |
| Chặn Student tạo Classroom | Student không có quyền tạo Classroom. | Must |
| Cấp quyền tạo Classroom đặc biệt | Admin cấp quyền cho một user cụ thể nếu cần. | Could |
| Tạm khóa quyền tạo Classroom | Tạm thời chặn Teacher tạo Classroom mới. | Should |
| Xem lịch sử tạo Classroom | Theo dõi Teacher nào tạo lớp, thời điểm tạo. | Should |

### Rule Đề Xuất Cho Đồ Án

```text
Chỉ account có Role = TEACHER và Status = ACTIVE mới được tạo Classroom.
```

## 5. Classroom Enrollment Policy Management

### Mục Tiêu

Cho phép Admin cấu hình cách Student tham gia Classroom.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật/tắt join bằng Class Code | Cho phép hoặc chặn Student join bằng mã lớp. | Must |
| Bật/tắt join bằng Invite Link | Cho phép hoặc chặn join bằng link. | Must |
| Chỉ cho Student nội bộ tham gia | Chặn email ngoài domain/tổ chức nếu cần. | Should |
| Cho phép Student ngoài tổ chức | Mở quyền tham gia cho user ngoài tổ chức. | Could |
| Cấu hình approval khi join | Student join cần Teacher/Admin duyệt. | Could |
| Giới hạn số lượng Student | Cài max enrollment cho Classroom. | Should |

### Business Rules

- Nếu Admin tắt join bằng Class Code, mọi `class_code` active không thể dùng để join.
- Policy toàn hệ thống có độ ưu tiên cao hơn setting riêng của Classroom.

## 6. Organization Management

### Mục Tiêu

Cho phép Admin quản lý đơn vị tổ chức như khoa, lớp, trung tâm hoặc chương trình đào tạo.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo organization unit | Tạo khoa, bộ môn, khóa hoặc trung tâm. | Should |
| Cập nhật organization unit | Đổi tên, mã đơn vị, mô tả hoặc trạng thái. | Should |
| Gán user vào đơn vị | Gán Teacher/Student vào khoa hoặc lớp hành chính. | Should |
| Lọc báo cáo theo đơn vị | Xem analytics theo khoa hoặc nhóm. | Should |
| Quản lý partner organization | Lưu danh sách tổ chức đối tác nếu có liên kết đào tạo. | Could |
| Cấu hình policy theo đơn vị | Một số đơn vị có policy riêng. | Could |

### Ghi Chú MVP

Nếu đồ án cần gọn, có thể chỉ lưu `department`, `class_name`, `student_code` trong user profile thay vì xây module organization phức tạp.

## 7. File Upload and Sharing Policy

### Mục Tiêu

Cho phép Admin kiểm soát file upload, loại file, dung lượng và link ngoài.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật/tắt upload file | Cho phép Teacher/Student upload file. | Should |
| Cấu hình file type | Cho phép PDF, image, video, doc, slide. | Should |
| Cấu hình max file size | Giới hạn dung lượng file. | Should |
| Cấu hình storage provider | Cloudinary, S3 hoặc local storage. | Should |
| Cho phép external link | Teacher được gắn link ngoài. | Should |
| Chặn domain link không an toàn | Không cho dùng link từ domain bị block. | Could |
| Xem file usage | Theo dõi dung lượng đã sử dụng. | Could |

### Business Rules

- File upload phải được validate type và size.
- File nguy hiểm hoặc không đúng định dạng phải bị reject.
- Student chỉ truy cập được file thuộc Classroom đã enroll.

## 8. Guardian Management

### Mục Tiêu

Quản lý phụ huynh hoặc người giám hộ nhận thông tin học tập của Student.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật guardian feature | Cho phép dùng người giám hộ. | Won't |
| Mời guardian | Gửi invitation cho phụ huynh. | Won't |
| Xem guardian list | Xem guardian theo Student. | Won't |
| Guardian email summary | Gửi tóm tắt học tập định kỳ. | Won't |
| Remove guardian | Xóa liên kết guardian. | Won't |

### Ghi Chú Scope

Chức năng này không nên nằm trong MVP vì đồ án tập trung vào Teacher và Student trong LMS nội bộ.

## 9. Originality / Plagiarism Policy

### Mục Tiêu

Cho phép Admin bật/tắt kiểm tra trùng lặp bài nộp hoặc kiểm tra đạo văn nếu hệ thống có tích hợp tương ứng.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật/tắt originality check | Cho phép kiểm tra trùng lặp bài nộp. | Could |
| Cấu hình scope kiểm tra | Kiểm tra trong cùng lớp, toàn hệ thống hoặc nguồn ngoài. | Could |
| Cấu hình retention | Quy định bài nộp có được dùng làm dữ liệu đối chiếu hay không. | Could |
| Xem báo cáo trùng lặp | Admin/Teacher xem similarity report nếu có quyền. | Could |
| Tắt lưu bài nộp để đối chiếu | Bảo vệ privacy nếu cần. | Could |

### Ghi Chú Scope

Không bắt buộc cho đồ án. Nếu muốn thể hiện hướng mở rộng, có thể để Post-MVP hoặc AI release.

## 10. Notification Configuration

### Mục Tiêu

Cho phép Admin cấu hình các kênh thông báo và loại sự kiện được gửi thông báo.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật/tắt email notification | Cho phép gửi email cho Teacher/Student. | Should |
| Bật/tắt in-app notification | Cho phép notification trong hệ thống. | Must |
| Bật/tắt push notification | Dành cho mobile app nếu có. | Could |
| Cấu hình email provider | SMTP, SendGrid hoặc provider tương đương. | Should |
| Cấu hình notification type | Announcement, Submission, Feedback, Deadline, account/security notification. | Should |
| Gửi system announcement | Admin gửi thông báo toàn hệ thống. | Should |
| Xem notification log | Theo dõi trạng thái gửi thành công/thất bại. | Could |

### Business Rules

- Teacher invitation trong MVP dùng manual copy link, không bắt buộc email notification tự động.
- Notification quan trọng như account blocked hoặc password reset phải có log.

## 11. Classroom Ownership Transfer

### Mục Tiêu

Cho phép Admin chuyển Classroom từ Teacher này sang Teacher khác khi giảng viên nghỉ, đổi lớp hoặc cần bàn giao.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem Classroom theo Teacher | Xem toàn bộ Classroom một Teacher đang sở hữu. | Should |
| Chuyển owner Classroom | Gán Classroom cho Teacher mới. | Should |
| Giữ Teacher cũ làm co-teacher | Nếu hệ thống hỗ trợ co-teacher. | Could |
| Chuyển nội dung liên quan | Course, Module, Lesson, Quiz, Assignment vẫn thuộc Classroom. | Should |
| Ghi nhận lý do transfer | Admin nhập lý do chuyển ownership. | Should |
| Audit transfer | Lưu log actor, old owner, new owner, timestamp. | Must |

### Luồng Đề Xuất

```text
Admin chọn Classroom
        ↓
Admin chọn Teacher mới
        ↓
System kiểm tra Teacher mới ACTIVE
        ↓
System chuyển ownership
        ↓
System ghi AuditLog
```

## 12. Student Unenrollment Policy

### Mục Tiêu

Cho phép Admin quy định Student có được tự rời Classroom hay chỉ Teacher/Admin mới được remove.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Cho Student tự rời lớp | Student có thể self-unenroll. | Should |
| Chỉ Teacher được remove | Student không tự rời được. | Should |
| Admin force remove | Admin remove Student khỏi Classroom khi cần xử lý. | Should |
| Ghi enrollment status | `ACTIVE`, `REMOVED`, `LEFT`, `BLOCKED`. | Must |
| Lưu lịch sử rời lớp | Audit ai remove, thời điểm, lý do. | Must |

### Policy Đề Xuất Cho Đồ Án

```text
Enrollment setting:
- STUDENT_CAN_LEAVE
- ONLY_TEACHER_CAN_REMOVE
- ADMIN_CAN_FORCE_REMOVE
```

## 13. Integration and Add-on Management

### Mục Tiêu

Cho phép Admin quản lý các tích hợp bên thứ ba phục vụ notification, upload, video, meeting hoặc analytics.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Quản lý email provider | SMTP, SendGrid hoặc service tương đương. | Should |
| Quản lý storage provider | S3, Cloudinary hoặc local storage. | Should |
| Quản lý video provider | YouTube, Vimeo hoặc upload video. | Could |
| Quản lý meeting provider | Google Meet, Zoom hoặc link thủ công. | Could |
| Quản lý analytics provider | Logging/monitoring hoặc BI tool. | Could |
| Bật/tắt integration | Enable/disable theo system setting. | Could |
| Kiểm tra integration health | Xem trạng thái kết nối. | Could |

### Ghi Chú Scope

MVP chỉ cần cấu hình cơ bản cho upload file và in-app notification. Email provider có thể để Post-MVP vì Teacher invitation dùng manual copy link.

## 14. Usage Reporting

### Mục Tiêu

Cho phép Admin xem báo cáo sử dụng hệ thống để đánh giá mức độ vận hành và học tập.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem tổng số user | Tổng Teacher, Student, Admin. | Must |
| Xem active users | Số user hoạt động trong khoảng thời gian. | Must |
| Xem tổng Classroom | Tổng số Classroom active/archived. | Must |
| Xem tổng Course | Tổng Course đã tạo/publish. | Must |
| Xem tổng Lesson | Tổng Micro Lesson trong hệ thống. | Should |
| Xem tổng Quiz | Tổng Quiz và quiz attempts. | Should |
| Xem completion rate | Tỷ lệ hoàn thành trung bình. | Must |
| Xem average quiz score | Điểm quiz trung bình toàn hệ thống. | Should |
| Xem activity trend | Số lượt học theo ngày/tuần/tháng. | Should |
| Export report | Xuất CSV/Excel. | Should |

### Admin Dashboard Đề Xuất

```text
Admin Dashboard
├── Total Teachers
├── Total Students
├── Total Classrooms
├── Active Classrooms
├── Total Courses
├── Total Lessons
├── Total Quizzes
├── Locked Accounts
├── Average Completion Rate
└── Recent Platform Activity
```

## 15. Audit Log and Security Monitoring

### Mục Tiêu

Cho phép Admin xem lịch sử hành động quan trọng để kiểm tra vận hành, bảo mật và trách nhiệm người dùng.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem audit log | Xem danh sách event quan trọng. | Must |
| Lọc theo actor | Ai thực hiện hành động. | Must |
| Lọc theo action | Create, update, delete, block, transfer, login. | Must |
| Lọc theo resource type | User, Classroom, Course, Lesson, Assignment, Submission. | Must |
| Lọc theo date range | Khoảng thời gian xảy ra event. | Must |
| Xem IP address | Theo dõi IP của hành động nhạy cảm. | Should |
| Export audit log | Xuất CSV phục vụ kiểm tra. | Should |
| Security alert | Cảnh báo event đáng chú ý như login failed nhiều lần. | Could |
| Investigation note | Admin ghi chú khi xử lý sự kiện. | Could |

### Data Fields Đề Xuất

```text
AuditLog
- audit_log_id
- actor_id
- action
- resource_type
- resource_id
- metadata
- ip_address
- user_agent
- created_at
```

### Ví Dụ

```text
Admin xem log:
Teacher A đã remove Student B khỏi Classroom NodeJS lúc 10:30.
```

## 16. Organization Analytics

### Mục Tiêu

Cho phép Admin xem analytics cấp hệ thống, cấp khoa/đơn vị hoặc cấp Classroom để phát hiện xu hướng học tập.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem completion toàn hệ thống | Tỷ lệ hoàn thành trung bình. | Should |
| Xem top Classroom active | Lớp có nhiều hoạt động nhất. | Should |
| Xem Classroom có completion thấp | Phát hiện lớp cần hỗ trợ. | Should |
| Xem Student ít hoạt động | Danh sách Student inactive hoặc progress thấp. | Should |
| Xem Teacher activity | Teacher tạo nhiều nội dung hoặc ít hoạt động. | Should |
| Lọc theo organization | Theo khoa, lớp hoặc chương trình. | Could |
| Lọc theo date range | Ngày, tuần, tháng, học kỳ. | Should |
| Export analytics | Xuất báo cáo. | Could |

### Ghi Chú MVP

MVP nên có analytics cơ bản, không cần BI dashboard phức tạp.

## 17. Temporary Class Access

### Mục Tiêu

Cho phép Admin hoặc staff được cấp quyền xem tạm thời một Classroom để hỗ trợ kiểm tra, tư vấn hoặc xử lý sự cố.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| View Classroom as Admin | Admin xem Classroom ở chế độ read-only. | Could |
| Request temporary access | Staff yêu cầu quyền truy cập tạm thời. | Could |
| Approve temporary access | Super Admin phê duyệt. | Could |
| Ghi lý do truy cập | Bắt buộc nhập reason. | Could |
| Hết hạn truy cập | Quyền tự hết hạn sau thời gian cấu hình. | Could |
| Notify Teacher | Teacher biết Admin/staff đã truy cập. | Could |

### Ghi Chú Scope

Với MVP, Admin có thể xem dữ liệu tổng quan nhưng không nên sửa nội dung Teacher nếu không có quyền đặc biệt.

## 18. System Configuration Management

### Mục Tiêu

Cho phép Admin/Super Admin quản lý cấu hình hệ thống phục vụ vận hành.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Cấu hình app name | Tên hệ thống, logo, thông tin tổ chức. | Could |
| Cấu hình email provider | SMTP host, sender, template. | Should |
| Cấu hình upload provider | Local, S3, Cloudinary hoặc storage khác. | Should |
| Cấu hình file policy | File type, max size, max files per submission. | Should |
| Cấu hình Enrollment Policy | Class Code và Invite Link. | Must |
| Cấu hình notification policy | Bật/tắt email và in-app notification. | Should |
| Cấu hình security policy | Password rule, session timeout, failed login limit. | Should |
| Cấu hình feature flags | Bật/tắt feature theo release. | Could |
| Xem system health | Kiểm tra API, database, storage, email. | Could |

### Business Rules

- Chỉ Super Admin được sửa cấu hình nhạy cảm như security, provider và feature flags.
- Mọi thay đổi system setting phải ghi audit log.

## 19. Teacher Offboarding Policy

### Mục Tiêu

Cho phép Admin xử lý khi Teacher nghỉ dạy, chuyển lớp hoặc bị khóa tài khoản mà không làm mất dữ liệu Classroom.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Kiểm tra Classroom active | Xem Teacher còn Classroom đang hoạt động không. | Should |
| Cảnh báo trước khi khóa Teacher | Nếu Teacher còn lớp active, hệ thống cảnh báo. | Must |
| Chuyển Classroom ownership | Chuyển lớp sang Teacher khác. | Should |
| Archive Classroom | Lưu trữ lớp nếu không còn dùng. | Should |
| Khóa account Teacher | Chặn login sau khi xử lý lớp. | Must |
| Bảo toàn dữ liệu học tập | Giữ Course, Progress, Submission, Grade. | Must |
| Audit offboarding | Lưu lý do, người thực hiện và thời điểm. | Must |

### Luồng Đề Xuất

```text
Admin muốn khóa tài khoản Teacher
        ↓
System kiểm tra Teacher còn Classroom active không
        ↓
Nếu còn active, Admin phải transfer ownership hoặc archive Classroom
        ↓
System khóa account Teacher
        ↓
System ghi AuditLog
```

## MVP Scope Đề Xuất Cho Admin

Với đồ án Microlearning Classroom LMS Platform, Admin nên tập trung vào 10 nhóm chức năng cốt lõi:

```text
Admin trong hệ thống Microlearning
├── Đăng nhập hệ thống
├── Quản lý tài khoản Teacher
├── Tạo và copy Teacher invitation link
├── Quản lý tài khoản Student
├── Quản lý Role và Permission
├── Quản lý Classroom / Course governance
├── Quản lý Enrollment Policy
├── Quản lý Notification cơ bản
├── Xem Admin Dashboard / Reports
├── Xem Audit Log
└── Quản lý System Configuration cơ bản
```

## Post-MVP Scope Đề Xuất

| Chức năng | Lý do để Post-MVP |
| --- | --- |
| Guardian Management | Không phải đối tượng chính của đồ án. |
| Originality / Plagiarism Check | Cần tích hợp AI hoặc plagiarism service. |
| Add-on Marketplace | Chưa cần trong hệ thống nội bộ giai đoạn đầu. |
| Temporary Class Access workflow | Cần rule bảo mật và notification phức tạp. |
| Advanced Organization Analytics | Cần dữ liệu lớn và mô hình phân cấp đơn vị rõ. |
| SIS / External LMS Integration | Phụ thuộc hệ thống ngoài. |
| Advanced Security Alerting | Cần logging/monitoring chuyên sâu. |

## Use Case Đề Xuất Cho Admin

| Use Case ID | Use Case Name | Priority |
| --- | --- | --- |
| UC-ADM-01 | Login hệ thống | Must |
| UC-ADM-02 | Xem Admin Dashboard | Must |
| UC-ADM-03 | Quản lý Teacher account | Must |
| UC-ADM-04 | Tạo và copy Teacher invitation link | Must |
| UC-ADM-05 | Quản lý Student account | Must |
| UC-ADM-06 | Khóa / mở khóa account | Must |
| UC-ADM-07 | Quản lý Role và Permission | Must |
| UC-ADM-08 | Quản lý Classroom / Course governance | Must |
| UC-ADM-09 | Chuyển Classroom ownership | Should |
| UC-ADM-10 | Cấu hình Enrollment Policy | Must |
| UC-ADM-11 | Cấu hình File Upload Policy | Should |
| UC-ADM-12 | Cấu hình Notification | Should |
| UC-ADM-13 | Xem Usage Reports | Must |
| UC-ADM-14 | Xem Audit Log | Must |
| UC-ADM-15 | Export Reports | Should |
| UC-ADM-16 | Quản lý System Configuration | Must |
| UC-ADM-17 | Offboarding Teacher | Should |

## Acceptance Criteria Tổng Quát

| ID | Acceptance Criteria |
| --- | --- |
| AC-ADM-001 | Admin có thể mở riêng Student List, Teacher List và Admin List; mỗi danh sách chỉ hiển thị đúng role tương ứng, có search/filter/pagination và action phù hợp với role đó. |
| AC-ADM-002 | Admin có thể tạo invitation link, copy link để gửi thủ công cho Teacher và theo dõi trạng thái invitation. |
| AC-ADM-003 | Admin không được đặt hoặc xem mật khẩu của Teacher/Student. |
| AC-ADM-004 | Admin có thể khóa/mở khóa account và account bị khóa không thể login. |
| AC-ADM-005 | Chỉ Super Admin hoặc Admin có quyền phù hợp mới được thay đổi role nhạy cảm. |
| AC-ADM-006 | Admin có thể bật/tắt join bằng Class Code và Invite Link ở cấp hệ thống. |
| AC-ADM-007 | Admin có thể xem tất cả Classroom và trạng thái active/archived/blocked. |
| AC-ADM-008 | Admin có thể chuyển Classroom ownership sang Teacher active khác. |
| AC-ADM-009 | Admin Dashboard hiển thị tổng user, active user, total Classroom, total Course, completion rate và platform activity. |
| AC-ADM-010 | Audit Log ghi nhận các hành động quan trọng như đổi role, khóa account, chuyển ownership, cập nhật system settings. |
| AC-ADM-011 | Admin có thể export report hoặc audit log khi được cấp quyền. |
| AC-ADM-012 | Khi offboarding Teacher còn Classroom active, hệ thống phải cảnh báo và yêu cầu xử lý ownership/archive trước khi khóa account. |

## Kết Luận BA

Admin trong hệ thống Microlearning Classroom LMS Platform là vai trò bảo đảm nền tảng vận hành an toàn, có kiểm soát và có thể audit. Admin không tập trung vào giảng dạy, mà tập trung vào:

1. Quản lý account và role.
2. Quản lý policy tham gia Classroom.
3. Quản lý Classroom governance.
4. Theo dõi usage report và analytics.
5. Kiểm tra audit log và bảo mật.
6. Quản lý system configuration.
7. Bảo toàn dữ liệu khi offboarding Teacher.

Vòng giá trị chính của Admin trong hệ thống:

```text
Admin cấu hình platform
        ↓
Admin mời và quản lý Teacher/Student
        ↓
Teacher vận hành Classroom
        ↓
Student học và tạo dữ liệu progress
        ↓
Admin xem reports, audit log và xử lý governance
```

Nếu triển khai tốt các nhóm chức năng Admin cốt lõi, hệ thống sẽ không chỉ là một ứng dụng học tập mà trở thành một LMS nội bộ có khả năng vận hành, kiểm soát, báo cáo và mở rộng chuyên nghiệp.
