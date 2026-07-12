# Admin User Stories

## Mục Đích

Tài liệu này mô tả chi tiết user stories cho vai trò **Admin** và **Super Admin** trong hệ thống **Microlearning Classroom LMS Platform**. Admin không phải người giảng dạy hằng ngày; Admin quản trị account, role, invitation, enrollment policy, classroom governance, reports, audit log và system settings.

## Admin Journey Tổng Quan

```text
Login Admin Dashboard
        ↓
Quản lý Student List / Teacher List / Admin List
        ↓
Tạo Teacher invitation link và copy gửi thủ công
        ↓
Quản lý role, permission và account status
        ↓
Cấu hình Enrollment Policy
        ↓
Theo dõi Classroom/Course governance
        ↓
Xem Reports / Audit Log
        ↓
Xử lý offboarding và system settings
```

## Epic ADM-01 - Admin Dashboard

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-003 | Là Admin, tôi muốn review platform reports để hiểu learning performance. | Must | FR-016 | Admin Dashboard hiển thị total users, active users, total classrooms, total courses, completion rate và recent activity. |
| US-ADM-018 | Là Admin, tôi muốn xem summary theo Student, Teacher và Admin để nắm cấu trúc user của hệ thống. | Must | FR-016, FR-009 | Dashboard hiển thị total Student, total Teacher, total Admin và số account theo status. |
| US-ADM-019 | Là Admin, tôi muốn truy cập nhanh Student List, Teacher List và Admin List từ Dashboard. | Must | FR-009, FR-057 | Quick links mở đúng list theo role; không hiển thị action vượt quyền. |
| US-ADM-020 | Là Admin, tôi muốn xem cảnh báo vận hành như Teacher invitation pending, account blocked hoặc Classroom thiếu owner. | Should | FR-008, FR-012, FR-016 | Dashboard có alert/summary phù hợp; click mở detail liên quan. |

## Epic ADM-02 - Role-specific User Management

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-001 | Là Admin, tôi muốn quản lý users theo từng danh sách Student, Teacher và Admin để kiểm soát quyền truy cập platform hiệu quả hơn. | Must | FR-009 | Admin có thể mở riêng Student List, Teacher List và Admin List; mỗi danh sách chỉ hiển thị đúng role, có search/filter/pagination và action phù hợp. |
| US-ADM-001A | Là Admin, tôi muốn xem Student List để quản lý tài khoản người học. | Must | FR-009A | Danh sách chỉ hiển thị `STUDENT`, có search theo tên/email/mã Student, filter theo status/classroom/organization nếu có và action quản trị phù hợp. |
| US-ADM-001B | Là Admin, tôi muốn xem Teacher List để quản lý tài khoản giảng viên và invitation/offboarding. | Must | FR-009B | Danh sách chỉ hiển thị `TEACHER`, có search/filter, xem invitation status, classroom count và cảnh báo khi Teacher còn Classroom active. |
| US-ADM-001C | Là Admin hoặc Super Admin, tôi muốn xem Admin List để quản lý tài khoản quản trị. | Must | FR-009C | Danh sách chỉ hiển thị `ADMIN`/`SUPER_ADMIN`; thao tác thay đổi permission yêu cầu quyền phù hợp và ghi audit log. |
| US-ADM-021 | Là Admin, tôi muốn Advanced User Search để tìm nhanh user khi chưa biết họ thuộc role nào. | Should | FR-009, FR-064 | Search toàn hệ thống trả name, email, role, status; action chỉnh sửa vẫn phụ thuộc role/permission. |
| US-ADM-022 | Là Admin, tôi muốn phân trang các danh sách user để không tải dữ liệu quá lớn. | Must | FR-009, FR-064 | Student/Teacher/Admin list có page/limit/total; frontend không tải toàn bộ users rồi lọc client-side. |
| US-ADM-023 | Là Admin, tôi muốn lọc user theo status để xử lý account active, blocked, inactive hoặc deleted. | Must | FR-004, FR-009, FR-064 | Filter status trả đúng danh sách; status hiển thị rõ trên từng row. |
| US-ADM-024 | Là Admin, tôi muốn mở User Detail để xem thông tin account, role, status và dữ liệu liên quan. | Must | FR-009 | User detail hiển thị đúng theo role; Student có classroom/progress summary, Teacher có classroom/course count, Admin có permission group. |

## Epic ADM-03 - Student Account Management

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-025 | Là Admin, tôi muốn xem Student account detail để hỗ trợ khi Student gặp vấn đề. | Must | FR-009A | Detail hiển thị profile, status, classroom count, last active và action được phép. |
| US-ADM-026 | Là Admin, tôi muốn khóa Student account khi cần chặn truy cập hệ thống. | Must | FR-004, FR-009A | Status chuyển `BLOCKED`; Student không login/gọi API nghiệp vụ; action ghi audit log. |
| US-ADM-027 | Là Admin, tôi muốn mở khóa Student account sau khi xử lý xong để Student học tiếp. | Must | FR-004, FR-009A | Status chuyển `ACTIVE`; Student có thể truy cập lại nếu các điều kiện khác hợp lệ. |
| US-ADM-028 | Là Admin, tôi muốn deactivate Student account khi Student tạm dừng học. | Should | FR-004, FR-009A | Status chuyển `INACTIVE`; dữ liệu học tập cũ được giữ. |
| US-ADM-029 | Là Admin, tôi muốn restore Student account nếu account bị xóa mềm nhầm. | Could | FR-004, FR-009A | Account `DELETED` trong thời gian cho phép có thể restore theo policy; audit log ghi nhận. |
| US-ADM-030 | Là Admin, tôi muốn reset password flow cho Student mà không biết mật khẩu của họ. | Must | FR-003, FR-009A | Admin không đặt/xem password plain text; hệ thống tạo reset flow an toàn. |

## Epic ADM-04 - Teacher Account Và Invitation Management

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-005 | Là Admin, tôi muốn tạo và copy invitation link để tự gửi thủ công cho Teacher qua email, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp. | Must | FR-006 | Invitation được tạo với status `PENDING`, delivery method `MANUAL_COPY`, có expiry và hiển thị link để Admin copy. |
| US-ADM-031 | Là Admin, tôi muốn nhập email Teacher khi tạo invitation để ràng buộc link với đúng người được mời. | Must | FR-006, FR-007 | Email được validate; Teacher activation phải dùng đúng email đã mời. |
| US-ADM-032 | Là Admin, tôi muốn copy invitation link bằng một nút rõ ràng để tự gửi qua kênh bên ngoài. | Must | FR-006 | Copy thành công hiển thị success state; hệ thống không bắt buộc gửi email tự động trong MVP. |
| US-ADM-006 | Là Admin, tôi muốn xem trạng thái invitation để biết Teacher đã kích hoạt tài khoản hay chưa. | Must | FR-008 | Danh sách invitation hiển thị `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`, email, createdAt, expiresAt. |
| US-ADM-007 | Là Admin, tôi muốn revoke invitation chưa dùng để kiểm soát quyền truy cập. | Must | FR-008 | Invitation `PENDING` bị revoke không thể dùng để kích hoạt account; action ghi audit log. |
| US-ADM-033 | Là Admin, tôi muốn resend theo nghĩa copy lại link còn hiệu lực để gửi lại thủ công nếu Teacher chưa nhận được. | Should | FR-006, FR-008 | Hệ thống cho copy lại link nếu invitation còn valid; không gửi email tự động. |
| US-ADM-034 | Là Admin, tôi muốn tạo invitation mới khi invitation cũ hết hạn. | Should | FR-006, FR-008 | Invitation cũ `EXPIRED`; invitation mới có token/expiry mới. |
| US-ADM-035 | Là Admin, tôi muốn xem Teacher account detail để biết Teacher đang quản lý Classroom/Course nào. | Must | FR-009B, FR-012 | Detail hiển thị profile, status, invitation status nếu có, active classroom count, course count. |
| US-ADM-036 | Là Admin, tôi muốn hệ thống cảnh báo khi khóa/deactivate Teacher còn Classroom active. | Must | FR-013, FR-009B | Nếu Teacher còn Classroom active, UI yêu cầu transfer/archive hoặc xác nhận theo policy trước khi khóa. |

## Epic ADM-05 - Admin Account, Role Và Permission

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-002 | Là Admin, tôi muốn quản lý roles để permissions được bảo mật. | Must | FR-010 | Chỉ Admin/Super Admin có quyền phù hợp mới được gán, đổi hoặc thu hồi role. |
| US-ADM-037 | Là Super Admin, tôi muốn tạo hoặc cấp quyền Admin cho user phù hợp để vận hành hệ thống. | Should | FR-010, FR-009C | User được gán role/permission hợp lệ; action ghi audit log. |
| US-ADM-038 | Là Super Admin, tôi muốn thu hồi quyền Admin khi user không còn nhiệm vụ quản trị. | Must | FR-010, FR-009C | Permission bị thu hồi; session/token cũ có thể bị vô hiệu; audit log ghi nhận. |
| US-ADM-039 | Là Admin, tôi muốn xem permission group của Admin khác nhưng chỉ thao tác nếu có quyền. | Must | FR-010, FR-009C | UI hiển thị read-only nếu không đủ quyền; API chặn action vượt quyền. |
| US-ADM-040 | Là Admin, tôi muốn hệ thống ngăn tôi tự nâng quyền chính mình để bảo vệ RBAC. | Must | FR-010 | Self privilege escalation bị từ chối; action có thể ghi security event. |
| US-ADM-041 | Là Admin, tôi muốn xem lịch sử đổi role để biết ai đã thay đổi quyền của user. | Must | FR-010, FR-017, FR-069 | Audit log hiển thị actor, target, old role, new role, timestamp, reason nếu có. |

## Epic ADM-06 - Account Status Và Security Actions

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-008 | Là Admin, tôi muốn khóa hoặc mở khóa account để xử lý vi phạm hoặc hỗ trợ user. | Must | FR-004, FR-009 | Account `BLOCKED` không thể login; account được mở khóa chuyển về `ACTIVE`; audit log ghi nhận. |
| US-ADM-042 | Là Admin, tôi muốn nhập lý do khi block/deactivate account để lịch sử vận hành rõ ràng. | Should | FR-004, FR-069 | Reason lưu trong audit metadata nếu policy yêu cầu. |
| US-ADM-043 | Là Admin, tôi muốn hệ thống cảnh báo trước khi thay đổi status account có dữ liệu quan trọng. | Should | FR-004, FR-012, FR-013 | Cảnh báo Teacher còn Classroom active, Student còn submission/progress; không hard delete dữ liệu. |
| US-ADM-044 | Là Admin, tôi muốn revoke active sessions của account bị block để chặn truy cập ngay. | Should | FR-004, FR-005 | Token/session cũ không còn gọi API nghiệp vụ sau khi block. |

## Epic ADM-07 - Enrollment Policy

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-009 | Là Admin, tôi muốn cấu hình chính sách tham gia Classroom để kiểm soát Class Code và Invite Link. | Must | FR-011 | Admin có thể bật/tắt từng phương thức join ở cấp hệ thống; policy áp dụng trước Classroom settings. |
| US-ADM-045 | Là Admin, tôi muốn bật/tắt Class Code Join để kiểm soát việc Student nhập mã lớp. | Must | FR-011 | Khi tắt, mọi Class Code mới/cũ không join được; Student nhận thông báo phù hợp. |
| US-ADM-046 | Là Admin, tôi muốn bật/tắt Invite Link Join để kiểm soát join bằng link. | Must | FR-011 | Khi tắt, invite link không enroll Student mới; Student cũ không bị remove. |
| US-ADM-048 | Là Admin, tôi muốn cấu hình giới hạn số Student trong Classroom nếu cần. | Should | FR-011 | Max enrollment được validate khi Student join; lỗi rõ nếu lớp đầy. |
| US-ADM-049 | Là Admin, tôi muốn mọi thay đổi Enrollment Policy được audit để trace khi join flow bị ảnh hưởng. | Must | FR-011, FR-069 | Audit log ghi actor, old value, new value, timestamp. |

## Epic ADM-08 - Classroom/Course Governance Và Ownership

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-010 | Là Admin, tôi muốn xem tất cả Classroom/Course để giám sát vận hành hệ thống. | Must | FR-012 | Admin xem owner, status, member count, content count và trạng thái vận hành. |
| US-ADM-004 | Là Admin, tôi muốn review published content để duy trì chất lượng. | Should | FR-012 | Admin xem Course/Classroom đã publish, owner Teacher và trạng thái hoạt động ở chế độ governance. |
| US-ADM-050 | Là Admin, tôi muốn tìm kiếm Classroom theo Teacher, title hoặc status để xử lý nhanh. | Must | FR-012, FR-064 | Search/filter/pagination hoạt động đúng; không tải toàn bộ Classroom một lần. |
| US-ADM-051 | Là Admin, tôi muốn archive Classroom ở chế độ governance khi lớp không còn dùng hoặc có vấn đề. | Should | FR-012 | Archive không xóa progress/submission/grade; action ghi audit log. |
| US-ADM-011 | Là Admin, tôi muốn chuyển Classroom ownership khi Teacher nghỉ dạy hoặc đổi lớp. | Should | FR-013 | Classroom được chuyển sang Teacher active khác và ghi audit log. |
| US-ADM-052 | Là Admin, tôi muốn xem Classroom active của một Teacher trước khi offboarding. | Should | FR-013, FR-012 | System hiển thị danh sách Classroom active/archived owned by Teacher. |
| US-ADM-053 | Là Admin, tôi muốn lock enrollment của Classroom nếu join method bị lạm dụng. | Should | FR-011, FR-012 | Student mới không join được; Student hiện tại không bị xóa; audit log ghi nhận. |

## Epic ADM-09 - File, Notification Và System Settings

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-012 | Là Admin, tôi muốn cấu hình file upload policy để kiểm soát file type và dung lượng. | Should | FR-014 | File sai type hoặc vượt size bị từ chối; policy áp dụng cho upload liên quan. |
| US-ADM-013 | Là Admin, tôi muốn cấu hình notification để kiểm soát email và in-app notification. | Should | FR-015 | Admin bật/tắt notification theo kênh và loại sự kiện; Teacher invitation email không bắt buộc MVP. |
| US-ADM-016 | Là Admin, tôi muốn cấu hình system settings cơ bản để vận hành platform. | Must | FR-019 | Thay đổi cấu hình nhạy cảm được kiểm tra quyền và ghi audit log. |
| US-ADM-054 | Là Super Admin, tôi muốn quản lý security policy như password rule, session timeout hoặc failed login limit. | Should | FR-019 | Chỉ Super Admin/Admin có quyền nhạy cảm được sửa; audit log ghi nhận. |
| US-ADM-055 | Là Admin, tôi muốn xem system health cơ bản để biết API/database có hoạt động không. | Could | FR-070, FR-074 | Health status hiển thị ở mức an toàn, không lộ secrets. |

## Epic ADM-10 - Reports, Analytics Và Export

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-056 | Là Admin, tôi muốn xem User Report để biết số lượng Student, Teacher, Admin theo status. | Must | FR-016 | Report hiển thị tổng theo role/status và cập nhật theo dữ liệu hiện tại hoặc snapshot. |
| US-ADM-057 | Là Admin, tôi muốn xem Classroom/Course Report để biết lớp nào đang hoạt động. | Must | FR-016, FR-012 | Report hiển thị total/active/archived Classroom, total Course, owner Teacher. |
| US-ADM-058 | Là Admin, tôi muốn xem Learning Progress Report để đánh giá mức độ hoàn thành học tập. | Must | FR-016, FR-059 | Report hiển thị completion rate theo Classroom/Course/Teacher nếu có dữ liệu. |
| US-ADM-059 | Là Admin, tôi muốn xem Assignment/Quiz summary để biết hoạt động học tập có hiệu quả không. | Should | FR-016, FR-041, FR-045 | Report hiển thị attempt/submission/average score/missing rate ở mức tổng quan. |
| US-ADM-015 | Là Admin, tôi muốn export reports hoặc audit log để phục vụ kiểm tra và báo cáo. | Should | FR-018 | File export được tạo theo bộ lọc đã chọn và quyền truy cập. |
| US-ADM-060 | Là Admin, tôi muốn filter reports theo date range, Teacher, Classroom hoặc status để phân tích đúng phạm vi. | Should | FR-016, FR-018, FR-064 | Filter ảnh hưởng đúng dữ liệu report; export phản ánh filter hiện tại. |

## Epic ADM-11 - Audit Log Và Security Monitoring

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-014 | Là Admin, tôi muốn xem Audit Log để biết ai đã thực hiện hành động quan trọng. | Must | FR-017, FR-069 | Audit log lọc được theo actor, action, resource type và date range. |
| US-ADM-061 | Là Admin, tôi muốn xem audit detail để hiểu before/after của một thay đổi quan trọng. | Must | FR-017, FR-069 | Detail hiển thị actor, target, action, metadata, timestamp, IP/userAgent nếu có. |
| US-ADM-062 | Là Admin, tôi muốn filter Audit Log theo action như role change, account block, policy update hoặc ownership transfer. | Must | FR-017, FR-069 | Filter action trả đúng event; pagination hoạt động. |
| US-ADM-063 | Là Admin, tôi muốn Audit Log không bị user thường sửa/xóa để giữ tính tin cậy. | Must | FR-017, FR-069 | User không có quyền không update/delete audit log; API chặn thao tác. |
| US-ADM-064 | Là Admin, tôi muốn ghi chú xử lý vào sự kiện audit nếu cần investigation. | Could | FR-017 | Note lưu riêng theo quyền; không sửa nội dung log gốc. |

## Epic ADM-12 - Teacher Offboarding

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-017 | Là Admin, tôi muốn offboarding Teacher an toàn để không mất dữ liệu lớp học. | Should | FR-013, FR-009B | Nếu Teacher còn Classroom active, hệ thống yêu cầu transfer/archive trước khi khóa account. |
| US-ADM-065 | Là Admin, tôi muốn chọn Teacher mới khi chuyển ownership để lớp tiếp tục vận hành. | Should | FR-013 | Teacher mới phải `ACTIVE` và role `TEACHER`; transfer ghi audit log. |
| US-ADM-066 | Là Admin, tôi muốn archive Classroom thay vì transfer nếu lớp đã kết thúc. | Should | FR-012, FR-013 | Archive giữ Course, Submission, Progress, Grade và AuditLog. |
| US-ADM-067 | Là Admin, tôi muốn xem checklist offboarding trước khi deactivate Teacher để tránh bỏ sót lớp active. | Should | FR-013 | Checklist hiển thị active classrooms, pending submissions nếu có, suggested action. |
| US-ADM-068 | Là Admin, tôi muốn lưu lý do offboarding để lịch sử quản trị rõ ràng. | Should | FR-069 | Reason lưu trong audit metadata hoặc offboarding record. |

## Epic ADM-13 - UX Và Navigation Cho Admin

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-ADM-069 | Là Admin, tôi muốn có Back/Breadcrumb trong các trang quản trị để quay lại đúng danh sách trước đó. | Must | FR-057 | Từ User Detail quay lại đúng Student/Teacher/Admin List và giữ filter/page nếu có. |
| US-ADM-070 | Là Admin, tôi muốn các bảng quản trị có loading, empty và error state để biết hệ thống đang xử lý gì. | Must | FR-065 | Không có màn hình trắng; lỗi API có message và retry nếu phù hợp. |
| US-ADM-071 | Là Admin, tôi muốn các action nguy hiểm có confirm dialog để tránh thao tác nhầm. | Must | FR-004, FR-010, FR-013, FR-069 | Block, role change, revoke invitation, transfer ownership, archive cần xác nhận và audit. |
| US-ADM-072 | Là Admin, tôi muốn UI ẩn hoặc disable action mà tôi không có quyền để giảm rủi ro thao tác sai. | Must | FR-005, FR-010 | UI phản ánh permission; API vẫn là lớp kiểm quyền cuối cùng. |

## Admin Story Notes

| Chủ đề | Ghi chú BA |
| --- | --- |
| User Lists | Không dùng một bảng `All Users` làm mặc định; phải tách Student List, Teacher List, Admin List. |
| Teacher Invitation | MVP dùng manual copy link, Admin tự gửi qua email/Zalo/Facebook/Messenger/Teams hoặc kênh phù hợp. |
| Password | Admin không biết và không đặt password plain text cho user. |
| Audit | Role change, account block, policy update, ownership transfer, invitation actions phải có audit log. |
| Governance | Admin có thể xem Classroom/Course để quản trị, nhưng không thay Teacher giảng dạy hằng ngày. |
