# Access Control Matrix

## Mục Đích

Tài liệu này mô tả ma trận phân quyền chi tiết cho các role trong **Microlearning Classroom LMS Platform**.

Ma trận này dùng để:

- Thiết kế middleware authorization ở backend.
- Thiết kế role-based routing ở frontend.
- Xác định test cases cho QA.
- Giúp Product Owner và BA kiểm tra đúng phạm vi quyền của từng actor.
- Làm cơ sở cho AuditLog và security review.

## Ký Hiệu Trong Ma Trận

| Ký hiệu | Ý nghĩa |
| --- | --- |
| Yes | Được phép theo mặc định |
| No | Không được phép |
| Own | Chỉ dữ liệu của chính user |
| Owned | Chỉ resource do user sở hữu |
| Enrolled | Chỉ Classroom/Course mà Student đã tham gia |
| All | Toàn hệ thống |
| Policy | Phụ thuộc system policy hoặc classroom setting |
| Permission | Chỉ được phép nếu có permission cụ thể |
| Read-only | Chỉ xem, không sửa |
| N/A | Không áp dụng |

## Preconditions Chung

Mọi quyền trong ma trận chỉ hợp lệ khi:

```text
User authenticated nếu action yêu cầu login
Account status = ACTIVE
Role phù hợp
Resource tồn tại
Object-level access hợp lệ
System policy không chặn action
```

Nếu account status là `BLOCKED`, `INACTIVE` hoặc `DELETED`, mọi quyền nghiệp vụ đều bị từ chối.

## Matrix 1: Authentication And Account

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Login Page | Yes | Yes | Yes | Yes | Yes |
| Submit Login | Yes | Yes | Yes | Yes | Yes |
| Register Student Account | Yes | No | No | No | No |
| View Own Profile | No | Own | Own | Own | Own |
| Update Own Profile | No | Own | Own | Own | Own |
| Change Own Password | No | Own | Own | Own | Own |
| Reset Password Request | Policy | Yes | Yes | Yes | Yes |
| Logout | No | Yes | Yes | Yes | Yes |
| Login When BLOCKED | No | No | No | No | No |

## Matrix 2: Teacher Invitation

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| Open Teacher Invitation Link | Yes | N/A | N/A | N/A | N/A |
| Validate Invitation Token | Yes | N/A | N/A | N/A | N/A |
| Accept Teacher Invitation | Yes | N/A | N/A | N/A | N/A |
| Create Teacher Invitation | No | No | No | Yes | Yes |
| View Teacher Invitation List | No | No | No | Yes | Yes |
| Copy Teacher Invitation Link | No | No | No | Yes | Yes |
| Revoke Teacher Invitation | No | No | No | Yes | Yes |
| Resend Invitation Email Automatically | No | No | No | No | No |
| View Teacher Password | No | No | No | No | No |

Ghi chú:

- MVP dùng `deliveryMethod = MANUAL_COPY`.
- Admin tạo link, copy link và tự gửi thủ công qua email cá nhân, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp.
- Hệ thống không bắt buộc tự gửi email invitation.
- Teacher phải nhập đúng email được mời khi accept invitation.

## Matrix 3: Classroom Access

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| Create Classroom | No | No | Yes | Permission | Yes |
| View Classroom List | No | Enrolled | Owned | All / Read-only | All |
| View Classroom Detail | No | Enrolled | Owned | All / Read-only | All |
| Update Classroom | No | No | Owned | Permission | Yes |
| Archive Classroom | No | No | Owned | Permission | Yes |
| Delete Classroom | No | No | No by default | Permission | Permission |
| Transfer Classroom Ownership | No | No | No | Permission | Yes |
| View Classroom Settings | No | Enrolled limited | Owned | All / Read-only | All |
| Update Classroom Settings | No | No | Owned | Permission | Yes |

Ghi chú:

- Teacher là owner chính của Classroom.
- Admin có quyền governance, không phải actor tạo lớp hằng ngày.
- Xóa Classroom nên là soft delete/archive nếu đã có learning data.

## Matrix 4: Classroom Join And Enrollment

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| Open Classroom Invite Link | Yes | Yes | Yes | Yes | Yes |
| Join By Class Code | No | Yes | No | No | No |
| Join By Invite Link | No | Yes | No | No | No |
| Leave Classroom | No | Policy | No | No | No |
| View Own Enrollment | No | Own | N/A | All | All |
| View Classroom Roster | No | Enrolled limited | Owned | All | All |
| Remove Student From Classroom | No | No | Owned | Permission | Yes |
| Force Remove Student | No | No | No | Permission | Yes |
| Update Enrollment Policy | No | No | No | Yes | Yes |

Ghi chú:

- Student luôn phải authenticated, có role `STUDENT` và status `ACTIVE` trước khi join; Guest chỉ được mở entry link/preview tối thiểu.
- System-level Enrollment Policy ưu tiên hơn Classroom setting.
- Nếu Admin tắt Class Code Join, tất cả Class Code active không thể dùng để join.

## Matrix 5: Class Stream / Announcement

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Announcement | No | Enrolled | Owned | All / Read-only | All |
| Create Announcement | No | No by default | Owned | Permission | Yes |
| Update Announcement | No | No | Owned | Permission | Yes |
| Delete Announcement | No | No | Owned | Permission | Yes |
| Pin Announcement | No | No | Owned | Permission | Yes |
| Comment On Announcement | No | Policy | Policy | Permission | Permission |
| Disable Comments | No | No | Owned | Permission | Yes |

## Matrix 6: Classwork Content

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Classwork | No | Enrolled | Owned | All / Read-only | All |
| Create Module / Topic | No | No | Owned | Permission | Yes |
| Update Module / Topic | No | No | Owned | Permission | Yes |
| Reorder Module / Topic | No | No | Owned | Permission | Yes |
| Create Micro Lesson | No | No | Owned | Permission | Yes |
| Update Micro Lesson | No | No | Owned | Permission | Yes |
| Publish / Unpublish Lesson | No | No | Owned | Permission | Yes |
| Create Flashcard | No | No | Owned | Permission | Yes |
| Create Resource | No | No | Owned | Permission | Yes |
| View Resource | No | Enrolled | Owned | All / Read-only | All |

Ghi chú:

- Student chỉ xem content đã publish hoặc đã đến lịch mở.
- Admin có thể có permission override trong tình huống governance, nhưng không phải người tạo content mặc định.

## Matrix 7: Quiz

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Quiz | No | Enrolled | Owned | All / Read-only | All |
| Create Quiz | No | No | Owned | Permission | Yes |
| Update Quiz | No | No | Owned | Permission | Yes |
| Publish Quiz | No | No | Owned | Permission | Yes |
| Attempt Quiz | No | Enrolled | No | No | No |
| Submit Quiz Attempt | No | Enrolled | No | No | No |
| View Own Quiz Result | No | Own | N/A | All / Read-only | All |
| View Classroom Quiz Results | No | No | Owned | All / Read-only | All |
| Export Quiz Report | No | No | Owned | Permission | Yes |

## Matrix 8: Assignment And Submission

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Assignment | No | Enrolled | Owned | All / Read-only | All |
| Create Assignment | No | No | Owned | Permission | Yes |
| Update Assignment | No | No | Owned | Permission | Yes |
| Publish Assignment | No | No | Owned | Permission | Yes |
| Close Assignment | No | No | Owned | Permission | Yes |
| Create Submission | No | Enrolled | No | No | No |
| Update Own Submission | No | Own + Policy | No | No | No |
| Unsubmit / Resubmit | No | Own + Policy | No | No | No |
| View Own Submission | No | Own | N/A | All / Read-only | All |
| View Classroom Submissions | No | No | Owned | All / Read-only | All |
| Mark Submission Late | System | System | System | System | System |

Ghi chú:

- Late status nên do system tính dựa trên due date và submittedAt.
- Student không được xem Submission của Student khác.

## Matrix 9: Grading, Feedback And Gradebook

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Own Grade | No | Own | N/A | All / Read-only | All |
| View Own Feedback | No | Own | N/A | All / Read-only | All |
| View Classroom Gradebook | No | No | Owned | All / Read-only | All |
| Grade Submission | No | No | Owned | Permission | Yes |
| Update Grade | No | No | Owned | Permission | Yes |
| Create Feedback | No | No | Owned | Permission | Yes |
| Return Work | No | No | Owned | Permission | Yes |
| Export Gradebook | No | No | Owned | Permission | Yes |

Ghi chú:

- Admin chỉ chấm điểm nếu có quyền override đặc biệt; mặc định Teacher chịu trách nhiệm chấm.
- Student chỉ xem grade/feedback sau khi Teacher return hoặc policy cho phép.

## Matrix 10: Progress And Analytics

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Own Progress | No | Own | N/A | All / Read-only | All |
| View Classroom Progress | No | No | Owned | All / Read-only | All |
| View Student Progress In Owned Classroom | No | No | Owned | All / Read-only | All |
| View System Completion Rate | No | No | No | Yes | Yes |
| View Teacher Activity Analytics | No | No | No | Yes | Yes |
| Export Progress Report | No | No | Owned | Permission | Yes |
| View At-risk Student Flag | No | No | Owned | All / Read-only | All |

## Matrix 11: Admin Governance

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Admin Dashboard | No | No | No | Yes | Yes |
| View All Users | No | No | No | Yes | Yes |
| Search Users | No | No | No | Yes | Yes |
| Update Account Status | No | No | No | Yes | Yes |
| Block / Unblock Account | No | No | No | Yes | Yes |
| Soft Delete Account | No | No | No | Permission | Yes |
| View Roles | No | No | No | Yes | Yes |
| Assign Student/Teacher Role | No | No | No | Permission | Yes |
| Assign Admin Role | No | No | No | No | Yes |
| Revoke Admin Role | No | No | No | No | Yes |
| View System Policies | No | No | No | Yes | Yes |
| Update Enrollment Policy | No | No | No | Yes | Yes |
| Update File Upload Policy | No | No | No | Permission | Yes |
| Update Notification Policy | No | No | No | Permission | Yes |
| View Usage Reports | No | No | No | Yes | Yes |
| Export Reports | No | No | No | Permission | Yes |
| View AuditLog | No | No | No | Yes | Yes |
| Export AuditLog | No | No | No | Permission | Yes |
| Delete/Edit AuditLog | No | No | No | No | No |

## Matrix 12: System Configuration

| Action | Guest | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- |
| View Basic System Settings | No | No | No | Yes | Yes |
| Update App Name/Branding | No | No | No | Permission | Yes |
| Update Security Policy | No | No | No | No | Yes |
| Update Password Policy | No | No | No | No | Yes |
| Update JWT/Session Config | No | No | No | No | Yes |
| Update Storage Provider | No | No | No | No | Yes |
| Update Email/Notification Provider | No | No | No | No | Yes |
| Update Feature Flags | No | No | No | Permission | Yes |
| View System Health | No | No | No | Yes | Yes |

## Step-by-step Authorization Examples

### Example 1: Student Join Classroom By Class Code

```text
1. Student login thành công
2. System kiểm tra account status = ACTIVE
3. Student nhập Class Code
4. System kiểm tra Enrollment Policy có cho join bằng Class Code không
5. System kiểm tra Class Code tồn tại và Classroom active
6. System kiểm tra Student chưa enroll Classroom này
7. System tạo Enrollment status = ACTIVE
8. Student được truy cập Classroom
```

### Example 2: Teacher Create Assignment

```text
1. Teacher login thành công
2. System kiểm tra role = TEACHER và status = ACTIVE
3. Teacher chọn Classroom
4. System kiểm tra Teacher là owner của Classroom
5. Teacher nhập Assignment information
6. System validate required fields và due date
7. System tạo Assignment
8. Nếu publish, Student trong Classroom nhìn thấy Assignment
```

### Example 3: Admin Create And Copy Teacher Invitation Link

```text
1. Admin login thành công
2. System kiểm tra role = ADMIN hoặc SUPER_ADMIN
3. System kiểm tra account status = ACTIVE
4. Admin nhập email Teacher
5. System kiểm tra email chưa có active Teacher account
6. System tạo invitation token và lưu tokenHash
7. System set deliveryMethod = MANUAL_COPY
8. System trả invitationLink cho Admin
9. Admin copy link
10. Admin tự gửi thủ công qua email / Zalo / Facebook / Messenger / Teams
```

### Example 4: Teacher Accept Invitation

```text
1. Teacher mở invitation link
2. System validate token tồn tại
3. System kiểm tra token chưa expired, chưa accepted, chưa revoked
4. System hiển thị form activation
5. Teacher nhập Full Name, Email, Password, Confirm Password
6. System kiểm tra Email khớp email được mời
7. System hash password
8. System tạo hoặc kích hoạt account
9. System set Role = TEACHER, Status = ACTIVE
10. System set invitation status = ACCEPTED
```

### Example 5: Admin Block Teacher Account

```text
1. Admin login thành công
2. System kiểm tra Admin có permission block account
3. Admin chọn Teacher account
4. System kiểm tra Teacher còn Classroom active không
5. Nếu còn Classroom active, system cảnh báo cần transfer/archive nếu policy yêu cầu
6. Admin xác nhận hành động
7. System set account status = BLOCKED
8. System ghi AuditLog
```

## Permission Testing Checklist

| Test Area | Cần kiểm tra |
| --- | --- |
| Guest Access | Guest không xem được dữ liệu private |
| Student Access | Student chỉ xem Classroom đã enroll |
| Teacher Ownership | Teacher không sửa Classroom của Teacher khác |
| Admin Governance | Admin xem được toàn hệ thống nhưng không lộ password/token raw |
| Super Admin | Chỉ Super Admin sửa system settings nhạy cảm |
| Blocked Account | Account BLOCKED không login/gọi API được |
| Invitation | Manual copy link, email matching, token expiry, revoke, one-time use |
| AuditLog | Hành động nhạy cảm được ghi log |

## Matrix Implementation Notes

### Backend

- Nên có middleware kiểm tra authentication.
- Nên có middleware kiểm tra account status.
- Nên có permission guard theo role.
- Nên có ownership/enrollment guard theo resource.
- Nên ghi AuditLog cho action nhạy cảm.

### Frontend

- Menu và route phải ẩn theo role.
- UI không thay thế backend authorization.
- Nếu user không có quyền, frontend hiển thị forbidden/permission error rõ ràng.
- Student, Teacher, Admin nên có navigation riêng.

### QA

- Mỗi role cần test cả positive và negative case.
- Cần test cross-role access, ví dụ Student cố mở admin route.
- Cần test object-level access, ví dụ Teacher A cố sửa Classroom của Teacher B.
- Cần test account status, đặc biệt `BLOCKED`.

## Kết Luận

Access Control Matrix của dự án cần được hiểu theo 4 lớp:

```text
Role permission
        ↓
Account status
        ↓
Object ownership / Enrollment
        ↓
System policy
```

Ma trận này là input quan trọng cho backend authorization, frontend routing, API documentation, QA test scenarios và security review. Mọi thay đổi quyền phải đi qua change control nếu ảnh hưởng đến MVP hoặc security.
