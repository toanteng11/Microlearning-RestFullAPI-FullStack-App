# Classroom Join Process

## Mục Đích

Tài liệu này mô tả quy trình **Student tham gia Classroom** trong hệ thống **Microlearning Classroom LMS Platform**. Đây là process quan trọng vì Student chỉ có thể học nội dung, làm quiz và nộp assignment sau khi được thêm vào classroom roster hợp lệ.

Hệ thống hỗ trợ 2 phương thức join chính:

- `Class Code`
- `Invite Link`

Các phương thức này được tham khảo từ hành vi quen thuộc của các nền tảng Classroom/LMS hiện đại, nhưng được thiết kế phù hợp với dự án riêng, không phụ thuộc vào Google Classroom API.

## Process Summary

| Thuộc tính | Giá trị |
| --- | --- |
| Process ID | BP-002 |
| Process Name | Classroom Join Process |
| Process Owner | Student |
| Supporting Actors | Guest, Teacher, System, Admin |
| Trigger | Student nhập Class Code hoặc mở Invite Link |
| Priority | Must Have |
| Frequency | Khi Student tham gia lớp mới |
| Input | Classroom, join method, Student account |
| Output | Enrollment record, roster update, join event, Student access permission |

## Phạm Vi

### In Scope

- Teacher tạo, xem, copy, regenerate hoặc disable `Class Code`.
- Teacher tạo, copy, regenerate hoặc disable `Invite Link`.
- Student join Classroom bằng Class Code.
- Student join Classroom bằng Invite Link.
- System validate Classroom status, join method status, token/code và Student account.
- System thêm Student vào classroom roster.
- System xử lý trùng enrollment, invalid code, expired/disabled link và archived Classroom.
- Admin cấu hình policy cấp hệ thống cho phép/bật/tắt từng join method.

### Out Of Scope Cho MVP

- Join Classroom bằng Google account hoặc Google Classroom import.
- Tự động đồng bộ roster từ hệ thống bên ngoài.
- Join bằng payment/subscription.
- Enrollment approval nhiều bước phức tạp.
- Join bằng SSO enterprise nâng cao.

## Actor Và Trách Nhiệm

| Actor | Trách nhiệm |
| --- | --- |
| Student | Sử dụng Class Code hoặc Invite Link để yêu cầu tham gia Classroom |
| Teacher | Tạo Classroom, cấu hình join methods và chia sẻ thông tin join cho Student |
| System | Validate request, tạo enrollment, cập nhật roster và ghi event/audit |
| Admin | Thiết lập enrollment policy cấp hệ thống và giám sát khi có sự cố |

## Preconditions

- Teacher account có `Role = TEACHER` và `Status = ACTIVE`.
- Teacher đã tạo Classroom.
- Classroom có `Status = ACTIVE`.
- Admin policy không tắt phương thức join đang được dùng.
- Join method được Teacher bật cho Classroom.
- Student phải có account `STUDENT` với `Status = ACTIVE` và đã login trước khi hệ thống tạo Enrollment.
- Nếu chưa có account, Guest có thể tự đăng ký Student account; đăng ký thành công không tự động join Classroom.

## Postconditions

Sau khi join thành công:

- Student được thêm vào `ClassroomEnrollment` hoặc classroom roster.
- Student có quyền xem Classroom theo role `STUDENT`.
- Student có thể truy cập Stream, Classwork, Learning Module, Quiz, Assignment và Resource đã publish/assign.
- Teacher thấy Student trong danh sách members.
- System ghi event join để phục vụ analytics/audit.

## Main Flow Tổng Quát

```text
Teacher tạo Classroom
        ↓
Teacher bật Class Code / Invite Link
        ↓
Teacher chia sẻ thông tin join cho Student
        ↓
Student đăng ký account nếu chưa có
        ↓
Student login
        ↓
Student gửi join request
        ↓
System xác thực Student
        ↓
System validate Classroom và join method
        ↓
System kiểm tra Student đã join chưa
        ↓
System tạo enrollment
        ↓
Student được chuyển vào Classroom
```

## Subprocess 1 - Join By Class Code

### Trigger

Student nhận `Class Code` từ Teacher và nhập vào hệ thống.

### Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Teacher | Mở Classroom Settings | Hiển thị Class Code hiện tại nếu được bật |
| 2 | Teacher | Copy hoặc chia sẻ Class Code | Class Code được chia sẻ ngoài hệ thống |
| 3 | Student | Login vào hệ thống | System xác thực Student |
| 4 | Student | Chọn `Join Classroom` | System hiển thị form nhập Class Code |
| 5 | Student | Nhập Class Code | System chuẩn hóa code và validate |
| 6 | System | Kiểm tra Classroom | Classroom phải tồn tại và `ACTIVE` |
| 7 | System | Kiểm tra enrollment | Nếu chưa tham gia, tạo enrollment mới |
| 8 | System | Cập nhật roster | Student xuất hiện trong Classroom members |
| 9 | System | Điều hướng Student | Student được chuyển đến Classroom Detail |

### Business Rules

- Class Code phải unique ở cấp hệ thống hoặc unique đủ để không nhầm Classroom.
- Class Code phải có thể regenerate bởi Teacher.
- Khi regenerate Class Code, code cũ không còn dùng để join mới.
- Student đã join Classroom thì nhập lại Class Code sẽ được chuyển vào Classroom hiện có, không tạo duplicate enrollment.
- Nếu Admin tắt Class Code policy, mọi Class Code join request phải bị từ chối.

## Subprocess 2 - Join By Invite Link

### Trigger

Student mở `Invite Link` được Teacher chia sẻ.

### Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Teacher | Tạo hoặc copy Invite Link | System tạo link chứa token hoặc join key |
| 2 | Teacher | Gửi link cho Student | Link có thể gửi qua email, Zalo, Messenger, LMS nội bộ hoặc kênh phù hợp |
| 3 | Student | Mở Invite Link | System đọc token/join key |
| 4 | System | Kiểm tra authentication | Nếu chưa login, yêu cầu Login; nếu chưa có account, cho phép chuyển sang Student Register và giữ join context |
| 5 | Student | Register nếu cần, sau đó Login | System chỉ tiếp tục khi account `STUDENT` đang `ACTIVE` và session hợp lệ |
| 6 | System | Validate Invite Link | Kiểm tra token, status, expiry và Classroom |
| 7 | System | Kiểm tra enrollment | Nếu chưa tham gia, tạo enrollment |
| 8 | System | Điều hướng Student | Student được chuyển đến Classroom Detail |

### Business Rules

- Invite Link phải có trạng thái kiểm soát như `ACTIVE`, `DISABLED`, `EXPIRED` nếu có expiry.
- Teacher có thể regenerate hoặc disable Invite Link.
- Invite Link không nên là đường public không kiểm soát; link phải gắn với Classroom và join policy.
- Nếu Student mở link nhưng chưa login, System phải giữ context để sau login Student vẫn có thể tiếp tục join.
- Invite Link có thể không cần ràng buộc email Student trong MVP, trừ khi Teacher/Admin bật policy hạn chế.

## Subprocess 3 - Student Registration Trước Khi Join

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Guest | Mở `/register` trực tiếp hoặc từ Invite Link | Hiển thị form full name, email, password và confirm password; giữ join context an toàn nếu có |
| 2 | Guest | Gửi thông tin đăng ký | Backend normalize/validate email, password policy và uniqueness |
| 3 | System | Tạo account | Gán cố định `Role = STUDENT`, `Status = ACTIVE`; hash password; bỏ qua/từ chối mọi role/status do client tự gửi |
| 4 | System | Hoàn tất đăng ký | Không tạo auth session, Enrollment, Progress hoặc To-do; chuyển đến Login |
| 5 | Student | Login bằng account vừa tạo | System xác thực account `ACTIVE` và tạo session hợp lệ |
| 6 | System | Khôi phục join context nếu có | Student xác nhận join; system validate lại Code/Link trước khi tạo Enrollment |

### Business Rules

- Student self-registration là capability `Must` của MVP; Teacher/Admin/Super Admin không được tạo qua public registration endpoint.
- Registration và Classroom Enrollment là hai transaction độc lập; đăng ký thành công không có nghĩa là đã tham gia bất kỳ Classroom nào.
- Mọi endpoint tạo Enrollment phải yêu cầu authenticated Student `ACTIVE`; Guest gọi trực tiếp phải bị từ chối `401`.
- Join context chỉ được dùng để điều hướng sau Login, không được xem là bằng chứng authorization và không chứa raw secret không cần thiết.

## Alternative Flows

| Mã | Tình huống | Luồng thay thế |
| --- | --- | --- |
| ALT-001 | Student chưa có account | Student register trước, sau đó System tiếp tục join flow |
| ALT-002 | Student đã join Classroom | System không tạo enrollment mới, điều hướng vào Classroom |
| ALT-003 | Teacher muốn đổi Class Code | Teacher regenerate code, System vô hiệu code cũ |
| ALT-004 | Teacher muốn tạm dừng enrollment | Teacher disable join methods hoặc Admin policy tắt join |
| ALT-005 | Classroom yêu cầu Teacher approval | System tạo enrollment status `PENDING_APPROVAL` nếu policy này được bật sau MVP |

## Exception Flows

| Mã | Tình huống lỗi | Hành vi hệ thống |
| --- | --- | --- |
| EX-001 | Class Code không hợp lệ | Hiển thị lỗi và cho Student nhập lại |
| EX-002 | Class Code đã bị regenerate | Hiển thị lỗi code không còn hiệu lực |
| EX-003 | Invite Link hết hạn | Hiển thị lỗi link đã hết hạn |
| EX-004 | Invite Link bị disabled | Từ chối join request |
| EX-006 | Classroom đã archived | Không cho join mới |
| EX-007 | Student account bị blocked/inactive | Không cho join và yêu cầu liên hệ Admin/Teacher |
| EX-008 | Enrollment policy bị Admin tắt | Hiển thị thông báo phương thức tham gia không khả dụng |
| EX-009 | Classroom đã đạt giới hạn member | Từ chối join nếu có max capacity rule |

## Enrollment Status

| Status | Ý nghĩa |
| --- | --- |
| ACTIVE | Student đang là thành viên hợp lệ của Classroom |
| PENDING_APPROVAL | Chờ Teacher/Admin duyệt, dùng nếu policy approval được bật |
| REMOVED | Student đã bị remove khỏi Classroom |
| LEFT | Student tự rời Classroom nếu hệ thống cho phép |
| BLOCKED | Student bị chặn tham gia Classroom |

## Data Outputs

| Dữ liệu | Mô tả |
| --- | --- |
| ClassroomEnrollment | Bản ghi Student tham gia Classroom |
| ClassroomRoster | Danh sách thành viên Classroom |
| JoinToken/InviteLink | Token hoặc link join được Teacher tạo |
| ClassCode | Mã lớp dùng để Student tham gia |
| JoinEvent | Event ghi nhận thời điểm và phương thức Student join |
| AuditLog | Log cho các hành động regenerate/disable/join quan trọng |

## UI Touchpoints

| Màn hình | Mục đích |
| --- | --- |
| Teacher Classroom Settings | Teacher bật/tắt Class Code và Invite Link |
| Teacher Members Page | Teacher xem Student đã tham gia |
| Student Join Classroom Screen | Student nhập Class Code |
| Invite Link Landing Page | Student mở link mời |
| Student Classroom Detail | Student vào Classroom sau khi join thành công |
| Admin Enrollment Policy Screen | Admin bật/tắt join methods cấp hệ thống |

## API Touchpoints

| API Group | Mục đích |
| --- | --- |
| Classroom API | Lấy thông tin Classroom và status |
| Enrollment API | Join Classroom, kiểm tra enrollment, remove member |
| Join Code API | Generate/regenerate/disable Class Code |
| Invite Link API | Generate/regenerate/disable Invite Link |
| Auth API | Public Student registration, sau đó Login bắt buộc trước khi join |
| Audit API | Ghi log join và cấu hình join method |

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| BP002-BR001 | Student phải có account `STUDENT` `ACTIVE` và authenticated session hợp lệ trước khi Enrollment được tạo/kích hoạt |
| BP002-BR002 | Classroom phải `ACTIVE` thì mới cho Student join |
| BP002-BR003 | Mỗi Student chỉ có một enrollment active trong cùng một Classroom |
| BP002-BR004 | Teacher chỉ quản lý join methods của Classroom mình sở hữu hoặc được phân quyền |
| BP002-BR005 | Admin policy có quyền override join method cấp hệ thống |
| BP002-BR006 | Class Code và Invite Link phải có khả năng disable/regenerate |
| BP002-BR008 | Join action phải được ghi nhận để Teacher/Admin có thể audit khi cần |

## Acceptance Checkpoints

- Guest tự đăng ký được account `STUDENT`; registration không tự tạo session hoặc Enrollment.
- Guest gọi join API bị từ chối; Student chỉ join được sau Login thành công.
- Student có thể join Classroom bằng Class Code hợp lệ.
- Student có thể join Classroom bằng Invite Link hợp lệ.
- Student đã join không bị tạo duplicate enrollment.
- Class Code cũ không dùng được sau khi regenerate.
- Invite Link disabled/expired không cho Student join.
- Classroom archived không cho Student mới tham gia.
- Teacher thấy Student trong members sau khi join thành công.
- Admin có thể tắt từng join method ở cấp policy nếu cần.

## Ghi Chú Cho DevOps Và QA

- CI/CD nên có test cho cả Class Code và Invite Link vì đây là luồng đầu vào của toàn bộ learning process.
- API cần idempotent khi Student join lại Classroom đã tham gia, tránh duplicate data.
- Monitoring nên theo dõi tỷ lệ lỗi của endpoint join vì lỗi ở đây sẽ chặn Student học.
