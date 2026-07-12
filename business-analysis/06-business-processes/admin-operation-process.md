# Admin Operation Process

## Mục Đích

Tài liệu này mô tả các quy trình vận hành của **Admin** trong hệ thống **Microlearning Classroom LMS Platform**. Admin không phải là người giảng dạy hằng ngày, nhưng là actor chịu trách nhiệm đảm bảo hệ thống hoạt động có kiểm soát: user đúng role, account đúng status, Classroom không bị bỏ quản lý, enrollment policy rõ ràng, dữ liệu có thể audit và hệ thống sẵn sàng vận hành trên Cloud.

Admin process đặc biệt quan trọng trong dự án này vì:

- Teacher account không tự đăng ký tự do, mà được Admin mời bằng `Manual Invitation Link`.
- Student tham gia Classroom bằng `Class Code`, `Invite Link`, nên cần policy kiểm soát.
- Hệ thống phục vụ môi trường học tập nội bộ, nên cần quản trị account, role, permission và audit.
- Dự án có mục tiêu học DevOps, nên Admin/DevOps cần hiểu các điểm vận hành như environment, deployment, monitoring, backup và rollback.

## Process Summary

| Thuộc tính | Giá trị |
| --- | --- |
| Process ID | BP-005 |
| Process Name | Admin Operation Process |
| Process Owner | Admin |
| Supporting Actors | Teacher, Student, System, DevOps Engineer |
| Trigger | Có nhu cầu quản trị user, policy, classroom governance, reports hoặc system operation |
| Priority | Must Have |
| Frequency | Hằng ngày, hằng tuần hoặc theo sự kiện vận hành |
| Input | User account, role request, invitation request, policy setting, report request |
| Output | Updated user status, invitation link, audit log, reports, operation action |

## Phạm Vi

### In Scope

- Admin login vào Admin Dashboard.
- Admin quản lý Teacher, Student và Admin account qua các danh sách riêng: `Student List`, `Teacher List`, `Admin List`.
- Admin tạo Teacher invitation link và copy link để gửi thủ công.
- Admin cập nhật account status như active, inactive, blocked.
- Admin quản lý role/permission theo RBAC.
- Admin cấu hình Enrollment Policy cho Class Code và Invite Link.
- Admin giám sát Classroom/Course governance.
- Admin transfer ownership hoặc archive Classroom khi Teacher nghỉ dạy.
- Admin xem learning reports, usage reports và platform analytics.
- Admin xem audit log và security events.
- Admin cấu hình một số system settings trong phạm vi MVP.
- Admin phối hợp với DevOps Engineer để hiểu deployment, monitoring, backup và rollback.

### Out Of Scope Cho MVP

- Admin chỉnh sửa nội dung học tập hằng ngày thay Teacher.
- Enterprise SSO phức tạp.
- Multi-tenant organization hierarchy nâng cao.
- Billing/payment administration.
- Automated email delivery provider management.
- Security operation center chuyên sâu.

## Actor Và Trách Nhiệm

| Actor | Trách nhiệm |
| --- | --- |
| Admin | Quản trị users, roles, invitation, policy, audit, reports và support |
| Teacher | Nhận invitation, quản lý Classroom/nội dung, phối hợp khi cần support/offboarding |
| Student | Sử dụng hệ thống học tập, có thể cần Admin support khi account gặp sự cố |
| System | Thực thi permission, lưu cấu hình, ghi audit và cung cấp reports |
| DevOps Engineer | Quản lý deployment, CI/CD, Docker, Cloud, monitoring, backup và rollback |

## Preconditions

- Admin có account `ACTIVE`.
- Admin đã login thành công.
- Admin có role `ADMIN` hoặc `SUPER_ADMIN`.
- System đã cấu hình RBAC và Object-Level Access Control.
- Các API quản trị được bảo vệ bằng authentication/authorization.

## Postconditions

Sau khi Admin operation hoàn tất:

- Account, role, status, invitation hoặc policy được cập nhật đúng.
- System ghi audit log cho hành động quản trị.
- Nếu thao tác ảnh hưởng Teacher/Student, người dùng liên quan nhìn thấy thay đổi phù hợp.
- Reports phản ánh dữ liệu mới nhất hoặc theo thời điểm được tính toán.
- Các operation liên quan deployment/monitoring/backup có record hoặc checklist theo dõi.

## Main Flow Tổng Quát

```text
Admin login
        ↓
Admin mở Admin Dashboard
        ↓
Admin chọn nhóm tác vụ: Users / Invitations / Roles / Policy / Reports / Audit / System
        ↓
System kiểm tra quyền Admin
        ↓
Admin thực hiện thao tác quản trị
        ↓
System validate rule và cập nhật dữ liệu
        ↓
System ghi AuditLog
        ↓
Admin xem kết quả hoặc thông báo lỗi
```

## Subprocess 1 - Quản Lý User Account

### Trigger

Admin cần xem, tìm kiếm, cập nhật hoặc xử lý account của Teacher/Student/Admin.

### Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Admin | Mở `User Management` | Hiển thị các entry point `Student List`, `Teacher List`, `Admin List` và `Advanced User Search` |
| 2 | Admin | Chọn `Student List`, `Teacher List` hoặc `Admin List` | System chỉ trả user thuộc role tương ứng |
| 3 | Admin | Tìm kiếm/filter theo status/email/name/đơn vị hoặc tiêu chí riêng của role | System trả danh sách phù hợp, có pagination |
| 4 | Admin | Mở user detail | Hiển thị thông tin account, role, status, classroom liên quan |
| 5 | Admin | Chọn thao tác update status hoặc profile field được phép | System validate quyền |
| 6 | Admin | Xác nhận thay đổi | System cập nhật user |
| 7 | System | Ghi audit log | Lưu adminId, action, targetUserId, before/after |
| 8 | Admin | Xem kết quả | System hiển thị success/failure message |

### Business Rules

- Admin không được xem hoặc thay đổi password plain text.
- Password chỉ được reset qua forgot password hoặc secure reset flow nếu có.
- Admin không nên xóa cứng user; nên dùng deactivate/block/archive theo policy.
- Thay đổi role/status phải được audit.
- `SUPER_ADMIN` có quyền cao hơn `ADMIN` nếu hệ thống phân cấp admin.
- `User Management` không nên tải toàn bộ Student, Teacher và Admin vào một bảng mặc định.
- `Student List`, `Teacher List` và `Admin List` phải có search, filter, sort và pagination riêng.

## Subprocess 2 - Tạo Teacher Invitation Link

### Trigger

Admin cần cấp account cho Teacher mới.

### Flow

```text
Admin mở Teacher Invitation Management
        ↓
Admin nhập email Teacher
        ↓
System tạo invitation token
        ↓
System tạo invitation link
        ↓
Admin copy link
        ↓
Admin tự gửi thủ công qua email / Zalo / Facebook / Messenger / Teams
        ↓
Teacher kích hoạt account
```

### Business Rules

- Delivery method là `MANUAL_COPY`.
- System không bắt buộc tự gửi email invitation trong MVP.
- Admin nhập email để định danh Teacher và ràng buộc invitation.
- Teacher phải tự tạo password.
- Invitation token có expiry, one-time use và có thể revoke.
- Hành động create/copy/revoke/accept invitation phải được audit.

Chi tiết đầy đủ được mô tả trong `teacher-invitation-process.md`.

## Subprocess 3 - Quản Lý Role Và Permission

### Trigger

Admin cần cấp, thu hồi hoặc điều chỉnh quyền người dùng.

### Flow

1. Admin mở user detail hoặc Role Management.
2. Admin chọn role hiện tại của user.
3. Admin chọn role mới hoặc permission group được phép.
4. System kiểm tra Admin có quyền thay đổi role này không.
5. System cảnh báo nếu thay đổi ảnh hưởng đến Classroom ownership hoặc quyền truy cập.
6. Admin xác nhận.
7. System cập nhật role/permission.
8. System vô hiệu session/token cũ nếu cần.
9. System ghi audit log.

### Business Rules

- Role phải thuộc danh sách hợp lệ như `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN`.
- Không cho user tự nâng quyền của chính mình.
- Không cho Admin thường cấp quyền `SUPER_ADMIN` nếu không có quyền.
- Nếu remove role Teacher, cần xử lý Classroom ownership trước.
- Permission thực thi theo RBAC kết hợp Object-Level Access Control.

## Subprocess 4 - Quản Lý Enrollment Policy

### Trigger

Admin muốn kiểm soát cách Student tham gia Classroom.

### Flow

```text
Admin mở Enrollment Policy Settings
        ↓
Admin bật/tắt Class Code, Invite Link
        ↓
System validate policy
        ↓
Admin lưu thay đổi
        ↓
System áp dụng policy cho Classroom join requests mới
        ↓
System ghi AuditLog
```

### Policy Có Thể Quản Lý

| Policy | Ý nghĩa |
| --- | --- |
| Allow Class Code Join | Cho phép Student join bằng Class Code |
| Allow Invite Link Join | Cho phép Student join bằng Invite Link |
| Allow Teacher Regenerate Code | Cho phép Teacher tạo lại Class Code |
| Allow Teacher Disable Link | Cho phép Teacher tắt Invite Link |
| Max Students Per Classroom | Giới hạn số Student nếu MVP cần |
| Late Enrollment Policy | Cho phép Student join sau thời điểm bắt đầu lớp nếu cần |

### Business Rules

- Admin policy là rule cấp hệ thống và có thể override Classroom-level settings.
- Nếu Admin tắt một join method, Teacher không thể dùng method đó cho join request mới.
- Tắt join method không remove Student đã tham gia trước đó.
- Mọi thay đổi policy phải được audit.

## Subprocess 5 - Classroom Governance

### Trigger

Admin cần giám sát, archive, transfer ownership hoặc xử lý Classroom có vấn đề.

### Flow

1. Admin mở `Classroom Management`.
2. Admin tìm kiếm Classroom theo Teacher, status, title hoặc thời gian tạo.
3. Admin mở Classroom detail ở chế độ quản trị.
4. System hiển thị owner, members count, content count, activity status và risk flags nếu có.
5. Admin chọn action phù hợp: view, archive, restore, transfer ownership, lock enrollment.
6. System kiểm tra quyền và cảnh báo tác động.
7. Admin xác nhận.
8. System cập nhật Classroom.
9. System ghi audit log.

### Business Rules

- Admin không chỉnh sửa nội dung học tập thường ngày nếu không có lý do governance.
- Transfer ownership cần đảm bảo Teacher mới có role `TEACHER` và status `ACTIVE`.
- Archive Classroom không nên xóa progress/submission.
- Lock enrollment chỉ chặn Student mới join, không xóa Student hiện có.

## Subprocess 6 - Teacher Offboarding

### Trigger

Teacher nghỉ dạy, chuyển lớp hoặc không còn quyền sử dụng hệ thống.

### Flow

```text
Admin chọn Teacher cần offboarding
        ↓
System kiểm tra Classroom active của Teacher
        ↓
Nếu còn Classroom active, Admin chọn transfer ownership hoặc archive Classroom
        ↓
System cập nhật Classroom ownership/status
        ↓
Admin deactivate hoặc block Teacher account
        ↓
System revoke active sessions nếu cần
        ↓
System ghi AuditLog
```

### Business Rules

- Không nên deactivate Teacher nếu Teacher còn Classroom active chưa có phương án xử lý.
- Classroom có Student đang học cần ưu tiên transfer ownership thay vì archive.
- Deactivate Teacher không được xóa dữ liệu bài giảng, submission và grade.
- Admin phải ghi lý do offboarding nếu hệ thống yêu cầu.

## Subprocess 7 - Reports Và Analytics

### Trigger

Admin cần xem tình hình sử dụng hệ thống hoặc báo cáo học tập cấp tổng quan.

### Reports Gợi Ý

| Report | Nội dung |
| --- | --- |
| User Report | Số lượng Student, Teacher, Admin theo status |
| Classroom Report | Số Classroom active/archived, số Student theo lớp |
| Learning Progress Report | Completion rate theo Classroom/Teacher |
| Quiz Performance Report | Điểm trung bình, số attempt, câu hỏi khó |
| Assignment Submission Report | Tỷ lệ nộp đúng hạn/trễ hạn/chưa nộp |
| Platform Usage Report | Active users, login frequency, activity trend |
| Audit Report | Hành động quản trị, security events |

### Business Rules

- Admin xem reports theo quyền được cấp.
- Dữ liệu cá nhân của Student cần được hiển thị đúng mục đích và không vượt quá quyền.
- Reports nên hỗ trợ filter theo thời gian, Teacher, Classroom và status.
- Reports cần phân biệt dữ liệu active và archived.

## Subprocess 8 - Audit Log Và Security Event Review

### Trigger

Admin cần kiểm tra hành động hệ thống hoặc sự kiện bất thường.

### Flow

1. Admin mở `Audit Log`.
2. Admin filter theo actor, target, action, date range hoặc severity.
3. System hiển thị log phù hợp.
4. Admin mở log detail.
5. Admin ghi chú hoặc tạo support case nếu cần.

### Audit Events Quan Trọng

| Event | Vì sao cần audit |
| --- | --- |
| Teacher invitation created/copied/revoked/accepted | Kiểm soát cấp account Teacher |
| Role changed | Ảnh hưởng quyền truy cập |
| Account blocked/deactivated | Ảnh hưởng khả năng sử dụng |
| Class Code regenerated | Ảnh hưởng join flow |
| Invite Link disabled/regenerated | Ảnh hưởng join flow |
| Classroom ownership transferred | Ảnh hưởng trách nhiệm giảng dạy |
| Content published/unpublished/archived | Ảnh hưởng Student access |
| Assignment graded | Ảnh hưởng kết quả học tập |
| Failed login nhiều lần | Dấu hiệu rủi ro bảo mật |

## Subprocess 9 - System Settings Và DevOps Awareness

### Trigger

Admin hoặc DevOps Engineer cần kiểm tra cấu hình vận hành.

### Nội Dung Cần Quản Lý/Hiểu

| Nhóm | Ý nghĩa đơn giản |
| --- | --- |
| Environment | Môi trường chạy app: local, development, staging, production |
| Docker | Đóng gói app để chạy nhất quán giữa các môi trường |
| CI/CD | Tự động build, test và deploy khi code thay đổi |
| Cloud Deployment | Đưa app lên server/cloud để Teacher và Student truy cập thật |
| API Documentation | Swagger/OpenAPI giúp kiểm tra và hiểu RESTful API |
| Monitoring | Theo dõi lỗi, downtime, API latency |
| Backup | Sao lưu MongoDB để tránh mất dữ liệu |
| Rollback | Quay lại bản ổn định nếu bản deploy mới lỗi |

### Business Rules

- Production secrets không được hard-code trong source code.
- Deployment phải có checklist hoặc pipeline rõ ràng.
- MongoDB production cần backup theo lịch.
- Khi deploy lỗi ảnh hưởng Student/Teacher, cần có rollback plan.
- Swagger/OpenAPI nên phản ánh đúng API đang chạy.

## Alternative Flows

| Mã | Tình huống | Luồng thay thế |
| --- | --- | --- |
| ALT-001 | Admin tạo nhầm invitation | Admin revoke invitation trước khi Teacher accept |
| ALT-002 | Teacher nghỉ dạy nhưng còn lớp active | Admin transfer ownership cho Teacher khác |
| ALT-003 | Student bị khóa nhầm | Admin review audit và restore status nếu hợp lệ |
| ALT-004 | Join method bị lạm dụng | Admin tắt policy hoặc yêu cầu Teacher regenerate code/link |
| ALT-005 | Deployment mới có lỗi | DevOps rollback version cũ và Admin thông báo người dùng nếu cần |

## Exception Flows

| Mã | Tình huống lỗi | Hành vi hệ thống |
| --- | --- | --- |
| EX-001 | Admin không đủ quyền | Từ chối thao tác và ghi security event nếu cần |
| EX-002 | User không tồn tại | Hiển thị lỗi không tìm thấy |
| EX-003 | Role change gây mất owner Classroom | Chặn thay đổi và yêu cầu transfer ownership |
| EX-004 | Policy setting không hợp lệ | Không lưu và hiển thị lỗi validation |
| EX-005 | Audit log không tải được | Hiển thị lỗi và cho retry |
| EX-006 | Report query quá lớn | Yêu cầu giảm filter hoặc xử lý phân trang |
| EX-007 | Cloud service lỗi | Hiển thị trạng thái degraded và DevOps xử lý theo incident process |

## Data Outputs

| Dữ liệu | Mô tả |
| --- | --- |
| User | Account của Student/Teacher/Admin |
| RoleAssignment | Role/permission được gán cho user |
| TeacherInvitation | Invitation link cho Teacher |
| EnrollmentPolicy | Cấu hình join methods cấp hệ thống |
| ClassroomGovernanceRecord | Dữ liệu archive/transfer/lock Classroom |
| AuditLog | Log hành động quản trị |
| ReportSnapshot | Dữ liệu report theo thời điểm |
| SystemSetting | Cấu hình hệ thống |
| DeploymentRecord | Ghi nhận version/deployment nếu hệ thống quản lý trong dashboard |

## UI Touchpoints

| Màn hình | Mục đích |
| --- | --- |
| Admin Dashboard | Tổng quan users, classrooms, reports và alerts |
| User Management | Entry point quản lý account theo role |
| Student List | Quản lý tài khoản Student |
| Teacher List | Quản lý tài khoản Teacher và invitation/offboarding |
| Admin List | Quản lý tài khoản Admin/Super Admin theo quyền |
| Teacher Invitation Management | Tạo/copy/revoke invitation link |
| Role Management | Quản lý role/permission |
| Enrollment Policy Settings | Bật/tắt Class Code và Invite Link |
| Classroom Management | Xem, archive, transfer ownership hoặc lock Classroom |
| Reports Dashboard | Xem usage, learning progress, quiz, assignment |
| Audit Log | Theo dõi hành động quan trọng |
| System Settings | Cấu hình hệ thống trong phạm vi được phép |

## API Touchpoints

| API Group | Mục đích |
| --- | --- |
| Admin User API | Tìm kiếm, cập nhật status, xem user detail theo role-specific list |
| Role/Permission API | Gán role và kiểm tra permission |
| Teacher Invitation API | Tạo, copy metadata, revoke invitation |
| Enrollment Policy API | Quản lý join policy |
| Classroom Admin API | Archive, transfer ownership, lock enrollment |
| Reporting API | Lấy reports và analytics |
| Audit API | Lấy audit logs và security events |
| System Settings API | Quản lý cấu hình hệ thống |
| Health Check API | Kiểm tra trạng thái dịch vụ phục vụ DevOps |

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| BP005-BR001 | Admin operation phải được bảo vệ bằng authentication và authorization |
| BP005-BR002 | Mọi thao tác thay đổi user, role, policy, classroom governance phải được audit |
| BP005-BR003 | Admin không được biết hoặc đặt password plain text cho Teacher |
| BP005-BR004 | Teacher invitation trong MVP dùng `MANUAL_COPY` |
| BP005-BR005 | Admin policy có thể override Classroom-level join settings |
| BP005-BR006 | Deactivate Teacher cần kiểm tra Classroom active trước |
| BP005-BR007 | Archive Classroom không được xóa dữ liệu học tập đã phát sinh |
| BP005-BR008 | Admin chỉ xem/chỉnh dữ liệu học tập theo quyền governance, không thay thế vai trò Teacher |
| BP005-BR009 | Reports phải tôn trọng quyền truy cập và bảo vệ dữ liệu Student |
| BP005-BR010 | Production deployment phải có backup, monitoring và rollback plan |

## Acceptance Checkpoints

- Admin login được vào Admin Dashboard.
- Admin mở được Student List, Teacher List và Admin List riêng biệt.
- Mỗi danh sách user có search/filter/sort/pagination và chỉ hiển thị đúng role tương ứng.
- Admin tạo được Teacher invitation link và copy link.
- Admin có thể revoke invitation chưa accept.
- Admin cập nhật account status và System ghi audit log.
- Admin cấu hình bật/tắt Class Code và Invite Link.
- Admin transfer ownership Classroom khi Teacher offboarding.
- Admin xem được reports cơ bản.
- Admin xem được audit log.
- System từ chối thao tác nếu Admin không đủ quyền.

## Ghi Chú Cho DevOps Và QA

- QA cần test các thao tác Admin với nhiều role khác nhau để đảm bảo không vượt quyền.
- CI/CD nên có test cho RBAC, invitation, policy và audit log.
- DevOps cần đảm bảo Admin Dashboard trên Cloud gọi đúng API base URL theo environment.
- Health check endpoint nên được dùng để xác định service có sẵn sàng hay không.
- Backup MongoDB phải bảo vệ dữ liệu user, classroom, submission, progress và audit.
- Rollback cần được chuẩn bị trước mỗi lần release vì lỗi Admin operation có thể ảnh hưởng toàn hệ thống.
