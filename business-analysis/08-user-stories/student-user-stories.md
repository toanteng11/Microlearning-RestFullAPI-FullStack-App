# Student User Stories

## Mục Đích

Tài liệu này mô tả chi tiết user stories cho vai trò **Student** trong hệ thống **Microlearning Classroom LMS Platform**. Student là người học, tham gia Classroom bằng `Class Code`, `Invite Link`, sau đó học Lesson, làm Quiz, nộp Assignment, xem Progress, Grade và Feedback.

## Student Journey Tổng Quan

```text
Login/Register nếu được phép
        ↓
Join Classroom bằng Code/Link
        ↓
Mở Student Dashboard
        ↓
Xem To-do / Deadline / Notification
        ↓
Mở Lesson / Flashcard / Quiz / Assignment / Resource
        ↓
Hoàn thành activity
        ↓
Xem Progress / Grade / Feedback
```

## Epic STU-01 - Account Và Entry Point

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-001 | Là Student, tôi muốn tự đăng ký account và Login để truy cập các chức năng học tập. | Must | FR-001, FR-002 | Student đăng ký được account `STUDENT`; registration không tự đăng nhập; sau Login thành công vào Student Dashboard hoặc quay lại join context. |
| US-STU-012 | Là Student, tôi muốn hệ thống chỉ cho tôi truy cập dữ liệu của chính mình để bảo vệ quyền riêng tư. | Must | FR-005, FR-068 | Student không xem được Progress, Grade, Submission hoặc Feedback của Student khác. |
| US-STU-013 | Là Student, tôi muốn xem profile cá nhân để kiểm tra thông tin tài khoản. | Should | FR-005 | Profile hiển thị họ tên, email, role, status và thông tin học sinh nếu có. |
| US-STU-014 | Là Student, tôi muốn cập nhật thông tin cá nhân được phép để hồ sơ chính xác. | Should | FR-005 | Student chỉ sửa field được policy cho phép; role/status/email chính không tự ý sửa nếu bị khóa. |

## Epic STU-02 - Join Classroom

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-002 | Là Student, tôi muốn tham gia Classroom bằng Class Code để truy cập Course của Teacher. | Must | FR-021, FR-023 | Code hợp lệ, Classroom active, policy cho phép thì Student được thêm vào roster; duplicate join không tạo bản ghi trùng. |
| US-STU-003 | Là Student, tôi muốn tham gia Classroom bằng Invite Link để vào lớp nhanh hơn. | Must | FR-022, FR-023 | Link hợp lệ mở join flow; sau authentication Student được enroll vào Classroom. |
| US-STU-015 | Là Student, tôi muốn xem preview Classroom trước khi xác nhận join để tránh vào nhầm lớp. | Should | FR-023 | Preview hiển thị tên Classroom, Teacher, mô tả ngắn nếu policy cho phép; không lộ nội dung riêng tư. |
| US-STU-016 | Là Student, tôi muốn được thông báo rõ khi Class Code sai, hết hạn hoặc bị tắt. | Must | FR-011, FR-021, FR-065 | Join fail hiển thị message rõ; không tạo enrollment; có nút nhập lại code. |
| US-STU-017 | Là Student, tôi muốn được thông báo khi Invite Link bị tắt hoặc hết hạn. | Must | FR-011, FR-022, FR-065 | Link/token không hợp lệ hiển thị lỗi; không enroll Student. |
| US-STU-018 | Là Student, tôi muốn biết mình đã ở trong Classroom nếu bấm join lại để tránh nhầm lẫn. | Must | FR-023 | Duplicate join hiển thị trạng thái đã tham gia và nút đi đến Classroom. |

## Epic STU-03 - Student Dashboard Và To-do

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-005 | Là Student, tôi muốn xem các Classroom đã tham gia để biết Course nào cần học. | Must | FR-049, FR-051 | Dashboard hiển thị danh sách Classroom đã enroll, trạng thái active và progress tóm tắt nếu có. |
| US-STU-009 | Là Student, tôi muốn xem khu vực To-do / Việc cần làm trên Dashboard để biết các bài học, quiz và assignment chưa hoàn thành từ tất cả Classroom. | Must | FR-049, FR-050 | To-do list hiển thị item chưa hoàn thành, Classroom, loại việc, deadline, status và action mở chi tiết. |
| US-STU-010 | Là Student, tôi muốn bấm vào một việc cần làm để đi thẳng đến Lesson, Quiz hoặc Assignment tương ứng. | Must | FR-050, FR-057 | Click To-do item mở đúng màn hình chi tiết và giữ ngữ cảnh quay lại To-do. |
| US-STU-019 | Là Student, tôi muốn To-do sắp xếp các việc gần deadline hoặc quá hạn lên trước để ưu tiên làm bài. | Must | FR-050, FR-056 | To-do sort theo due date/status; item late/missing được đánh dấu rõ. |
| US-STU-020 | Là Student, tôi muốn lọc To-do theo Classroom để tập trung vào một lớp cụ thể. | Should | FR-050, FR-064 | Filter classroomId chỉ hiển thị việc thuộc Classroom đã chọn; có clear filter. |
| US-STU-021 | Là Student, tôi muốn lọc To-do theo loại activity như Lesson, Quiz, Assignment, Material để dễ xử lý. | Should | FR-050, FR-064 | Filter activityType hoạt động đúng; count/list cập nhật theo filter. |
| US-STU-022 | Là Student, tôi muốn item đã hoàn thành rời khỏi danh sách To-do chính để danh sách gọn hơn. | Must | FR-050, FR-059 | Khi Lesson/Quiz/Assignment hoàn thành, item chuyển trạng thái completed và không còn trong To-do active. |
| US-STU-023 | Là Student, tôi muốn xem empty state khi không có việc cần làm để biết mình đã hoàn thành các nhiệm vụ hiện tại. | Must | FR-050 | To-do empty state hiển thị rõ, không gây hiểu nhầm là lỗi tải dữ liệu. |
| US-STU-024 | Là Student, tôi muốn dashboard hiển thị deadline gần nhất để không bỏ sót việc quan trọng. | Must | FR-049, FR-056 | Dashboard có upcoming deadline hoặc overdue summary từ các Classroom đã tham gia. |

## Epic STU-04 - Classroom, Stream Và Classwork

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-025 | Là Student, tôi muốn mở Classroom detail để xem Stream, Classwork và thông tin lớp. | Must | FR-051 | Student chỉ xem Classroom đã enroll; detail có Stream/Classwork hoặc tab tương đương. |
| US-STU-026 | Là Student, tôi muốn xem Announcement trong Class Stream để nắm thông báo từ Teacher. | Must | FR-035, FR-051 | Announcement đã publish hiển thị đúng thời gian, Teacher, nội dung; Student thuộc Classroom mới xem được. |
| US-STU-027 | Là Student, tôi muốn xem Classwork theo Course/Module/Topic để học theo cấu trúc rõ ràng. | Must | FR-026, FR-028, FR-051 | Classwork hiển thị Course, Module, Lesson, Quiz, Assignment, Resource đã publish/assign. |
| US-STU-028 | Là Student, tôi muốn tìm kiếm hoặc lọc Classwork khi lớp có nhiều nội dung. | Should | FR-051, FR-064 | Search/filter theo title/type/status trả kết quả đúng và không tải quá nhiều dữ liệu một lần. |
| US-STU-029 | Là Student, tôi muốn thấy trạng thái từng activity như not started, in progress, completed, missing, late. | Must | FR-050, FR-054, FR-059 | UI hiển thị status đúng theo progress/submission/deadline. |

## Epic STU-05 - Lesson, Flashcard Và Resource

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-006 | Là Student, tôi muốn hoàn thành short lessons để học theo từng bước nhỏ. | Must | FR-052, FR-059 | Lesson completion được lưu vào Progress; completedAt được ghi khi đạt rule hoàn thành. |
| US-STU-030 | Là Student, tôi muốn mở Lesson Player để học nội dung được Teacher publish. | Must | FR-052 | Lesson hiển thị title, content, media/resource nếu có; chỉ content có quyền mới mở được. |
| US-STU-031 | Là Student, tôi muốn tiếp tục Lesson đang học dở để không mất tiến độ. | Should | FR-052, FR-059 | System lưu startedAt/progress status; quay lại Lesson thấy trạng thái phù hợp. |
| US-STU-032 | Là Student, tôi muốn xem deadline của Lesson ngay trong Lesson Player để biết thời hạn hoàn thành. | Must | FR-030, FR-052, FR-056 | Deadline hiển thị nếu Teacher đã đặt; late status rõ khi quá hạn. |
| US-STU-033 | Là Student, tôi muốn học Flashcard để ôn tập nhanh kiến thức. | Must | FR-031, FR-053 | Flashcard hiển thị câu hỏi/câu trả lời đúng Lesson/Module; completion được tính nếu required. |
| US-STU-034 | Là Student, tôi muốn mở Learning Resource như PDF, image, video URL, link hoặc attachment để học thêm. | Should | FR-032, FR-068 | Resource mở được nếu có quyền; lỗi file/link hiển thị rõ; không xem được resource ngoài quyền. |
| US-STU-035 | Là Student, tôi muốn biết resource nào bắt buộc và resource nào chỉ tham khảo để ưu tiên học. | Should | FR-032, FR-050, FR-059 | Required resource có status/progress; optional resource không chặn completion nếu policy không yêu cầu. |

## Epic STU-06 - Quiz Và Assessment

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-007 | Là Student, tôi muốn làm Quiz để kiểm tra mức độ hiểu bài. | Must | FR-036, FR-039 | Student mở Quiz được assign/published, trả lời câu hỏi và submit attempt hợp lệ. |
| US-STU-036 | Là Student, tôi muốn xem instruction, points, time limit và attempt limit trước khi bắt đầu Quiz. | Must | FR-036, FR-039 | Quiz intro hiển thị setting quan trọng; Student xác nhận bắt đầu nếu cần. |
| US-STU-037 | Là Student, tôi muốn trả lời câu hỏi single choice, multiple choice, true/false và short answer. | Must | FR-037, FR-039 | UI input phù hợp question type; validation trước submit nếu câu bắt buộc. |
| US-STU-038 | Là Student, tôi muốn xem image/video trong câu hỏi Quiz nếu Teacher thêm media để hiểu câu hỏi tốt hơn. | Should | FR-038, FR-039 | Media hiển thị đúng trong question; không có media thì question vẫn hiển thị bình thường. |
| US-STU-039 | Là Student, tôi muốn được cảnh báo trước khi submit Quiz để tránh nộp nhầm. | Should | FR-039 | Confirm submit hiển thị nếu còn câu chưa trả lời hoặc attempt sẽ kết thúc. |
| US-STU-040 | Là Student, tôi muốn xem score tự động sau khi làm Quiz khách quan nếu Teacher cho phép. | Must | FR-039, FR-040, FR-055 | Objective questions được chấm; score hiển thị theo visibility policy. |
| US-STU-041 | Là Student, tôi muốn biết câu trả lời short answer đang chờ Teacher review nếu chưa có điểm ngay. | Should | FR-040, FR-055 | Attempt status `PENDING_REVIEW` hoặc tương đương hiển thị rõ. |
| US-STU-042 | Là Student, tôi muốn hệ thống chặn submit trùng attempt đã hoàn tất để tránh sai dữ liệu. | Must | FR-039 | Attempt completed không thể submit lại nếu policy không cho phép; lỗi hiển thị rõ. |

## Epic STU-07 - Assignment Và Submission

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-043 | Là Student, tôi muốn xem Assignment instruction, due date, max score và attachment trước khi làm bài. | Must | FR-042, FR-051 | Assignment detail hiển thị đầy đủ thông tin; Student chỉ xem assignment thuộc Classroom đã enroll. |
| US-STU-044 | Là Student, tôi muốn nộp Assignment bằng text để gửi câu trả lời ngắn. | Must | FR-043 | Submission text được lưu; status chuyển submitted; submittedAt được ghi. |
| US-STU-045 | Là Student, tôi muốn nộp Assignment bằng file nếu Teacher yêu cầu. | Must | FR-043, FR-068 | File upload đúng type/size policy; metadata lưu; Student thấy file đã đính kèm. |
| US-STU-046 | Là Student, tôi muốn nộp Assignment bằng link nếu bài làm nằm ở nguồn ngoài. | Should | FR-043 | Link được validate format; submission lưu URL; lỗi link hiển thị rõ. |
| US-STU-047 | Là Student, tôi muốn mark as done khi Assignment chỉ yêu cầu xác nhận hoàn thành. | Should | FR-043 | Nếu policy cho phép, Student có thể mark done; submission status cập nhật. |
| US-STU-048 | Là Student, tôi muốn unsubmit/resubmit Assignment nếu policy cho phép để sửa bài trước deadline. | Should | FR-044 | Unsubmit/resubmit cập nhật status, giữ lịch sử thời điểm; không cho nếu Teacher/Policy khóa. |
| US-STU-049 | Là Student, tôi muốn biết bài nộp bị late hay missing để tự điều chỉnh. | Must | FR-043, FR-050, FR-056 | Status late/missing tính theo due date và submittedAt; hiển thị trong To-do/Classwork. |
| US-STU-050 | Là Student, tôi muốn nhận feedback hoặc private comment của Teacher trong Assignment. | Should | FR-047, FR-055 | Student chỉ thấy comment/feedback của chính mình; notification nếu có. |

## Epic STU-08 - Progress, Grade Và Feedback

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-008 | Là Student, tôi muốn xem Progress để biết còn nội dung nào cần hoàn thành. | Must | FR-054, FR-059 | Progress hiển thị completed/not started/in progress/missing/late và percentage theo Classroom/Course. |
| US-STU-051 | Là Student, tôi muốn xem My Learning Progress theo từng Course để biết mức độ hoàn thành của mình. | Must | FR-054, FR-059 | Course progress hiển thị completed activities, total activities, percentage và last activity. |
| US-STU-052 | Là Student, tôi muốn xem Grade & Feedback của chính mình để biết kết quả học tập. | Must | FR-055 | Student chỉ xem grade/feedback của mình; không truy cập được dữ liệu người khác. |
| US-STU-053 | Là Student, tôi muốn biết bài nào đã được Teacher return để xem điểm và feedback cuối cùng. | Must | FR-046, FR-048, FR-055 | Returned work hiển thị grade, feedback, returnedAt; nếu chưa return thì không hiển thị điểm theo policy. |
| US-STU-054 | Là Student, tôi muốn xem summary điểm Quiz/Assignment để biết điểm mạnh/yếu. | Should | FR-055 | Grade summary theo Classroom/Course hiển thị score, max score, status và feedback availability. |

## Epic STU-09 - Calendar, Notification Và Navigation

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-STU-055 | Là Student, tôi muốn xem Learning Calendar/Deadline View để quản lý thời gian học. | Should | FR-056 | Calendar hiển thị Lesson/Quiz/Assignment deadlines theo Classroom/Course; filter cơ bản nếu có. |
| US-STU-056 | Là Student, tôi muốn nhận in-app notification về announcement, deadline, feedback hoặc submission status. | Should | FR-058 | Notification hiển thị đúng event, có trạng thái read/unread và link đến resource liên quan. |
| US-STU-057 | Là Student, tôi muốn đánh dấu notification đã đọc để danh sách thông báo gọn hơn. | Should | FR-058 | Notification chuyển read; unread count cập nhật. |
| US-STU-011 | Là Student, tôi muốn có nút Back / Previous / Next trong các màn hình học tập để không bị mất phương hướng khi học nhiều bài liên tiếp. | Must | FR-057 | Lesson, Quiz, Assignment và Classroom Detail có điều hướng quay lại hoặc chuyển tiếp phù hợp. |
| US-STU-058 | Là Student, tôi muốn breadcrumb trong các trang sâu để biết mình đang ở Classroom/Course/Lesson nào. | Must | FR-057 | Breadcrumb hiển thị ngữ cảnh cha; click về trang cha không mất dữ liệu đã lưu. |
| US-STU-059 | Là Student, tôi muốn form đang nhập có cảnh báo khi rời trang để tránh mất bài làm. | Should | FR-057 | Nếu đang làm Assignment/Quiz chưa submit, hệ thống cảnh báo trước khi điều hướng. |
| US-STU-060 | Là Student, tôi muốn danh sách lớn có pagination hoặc load more để trang không bị chậm. | Must | FR-064 | Classroom/Classwork/To-do/Progress list dùng pagination/filter/sort phù hợp. |

## Student Story Notes

| Chủ đề | Ghi chú BA |
| --- | --- |
| To-do | Đây là điểm rất quan trọng để Student không bỏ sót việc Teacher giao. |
| Join Classroom | Code/Link đều phải kiểm policy của Admin và setting của Teacher. |
| Progress | Không chỉ tính Lesson; cần tính cả Quiz, Assignment và Material nếu required. |
| Privacy | Student chỉ xem dữ liệu của chính mình. |
| Navigation | Back/Previous/Next/breadcrumb là requirement bắt buộc để tránh UX bị gãy. |
