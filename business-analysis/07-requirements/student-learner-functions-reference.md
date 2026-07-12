# Student Learner Functions Reference

## Mục Đích

Tài liệu này tổng hợp các chức năng cần có của `Learner` theo tài liệu tham khảo người dùng cung cấp, đồng thời map sang thuật ngữ hiện tại của dự án là `Student`.

Trong phạm vi BA hiện tại:

```text
Learner = Student
```

Google Classroom chỉ được dùng làm nguồn tham khảo nghiệp vụ và chức năng. Hệ thống không cần sao chép toàn bộ Google Classroom, mà chọn các chức năng phù hợp với mô hình **Microlearning Classroom LMS Platform**.

## Tổng Quan Nhóm Chức Năng

| STT | Nhóm chức năng Learner/Student | Tên module đề xuất trong hệ thống | Priority MVP |
| --- | --- | --- | --- |
| 1 | Tham gia lớp học | Classroom Joining | Must |
| 2 | Trang chủ Learner | Student Dashboard | Must |
| 3 | Bảng tin lớp học | Class Stream / Class Announcement | Must |
| 4 | Xem nội dung học tập | Classwork / Course Content | Must |
| 5 | Làm và nộp bài tập | Assignment Submission | Must |
| 6 | Làm quiz / câu hỏi | Quiz / Question | Must |
| 7 | Theo dõi tiến độ học của bản thân | My Learning Progress | Must |
| 8 | Xem điểm và phản hồi | Grade & Feedback | Must |
| 9 | Xem lịch học / deadline | Learning Calendar / Deadline | Should |
| 10 | Quản lý tài liệu học tập | Learning Resources | Should |

## 1. Tham Gia Lớp Học

### Mô Tả

Student có thể tham gia Classroom bằng nhiều phương thức được Teacher hoặc Admin cung cấp. Sau khi tham gia thành công, tài khoản Student được ghi danh vào Classroom và có thể truy cập Classroom đó trên các thiết bị khác khi đăng nhập cùng account.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Nhập Class Code | Student nhập mã lớp để tham gia Classroom |
| Bấm Invite Link | Student mở link mời để tham gia Classroom |
| Validate account | System kiểm tra Student đăng nhập đúng account |
| Xử lý lỗi join | System báo mã sai, account sai, token hết hạn hoặc Classroom không khả dụng |

### Flow Đề Xuất

```text
Student nhập Class Code hoặc bấm Invite Link
        ↓
System validate Classroom và invitation
        ↓
System ghi danh Student vào Classroom
        ↓
Student truy cập Class Stream và Classwork
```

## 2. Student Dashboard

### Mô Tả

Student Dashboard là màn hình chính của người học sau khi login. Màn hình này hiển thị các Classroom đã tham gia, việc cần làm, deadline gần nhất, thông báo mới và tiến độ học tập tổng quan.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem danh sách Classroom | Hiển thị Classroom đã tham gia |
| Mở Classroom | Click vào class card để vào lớp |
| Xem To-do list / Việc cần làm | Hiển thị Lesson, Quiz, Assignment hoặc Classwork item mà Student chưa hoàn thành |
| Xem deadline | Hiển thị bài sắp đến hạn |
| Mở nhanh việc cần làm | Click vào item trong To-do để đi thẳng đến lesson, quiz hoặc assignment detail |
| Lọc việc cần làm | Lọc theo Classroom, loại việc, deadline hoặc status nếu có nhiều dữ liệu |
| Sắp xếp việc cần làm | Ưu tiên việc quá hạn, sắp đến hạn và chưa bắt đầu |
| Quản lý notification | Bật/tắt thông báo nếu hệ thống hỗ trợ |
| Rời lớp | Student có thể unenroll nếu rule cho phép |

### Quy Tắc Hiển Thị To-do / Việc Cần Làm

Khu vực `To-do` trên Student Dashboard là chức năng **Must Have** vì đây là nơi Student biết mình cần làm gì tiếp theo sau khi đăng nhập. Nếu thiếu khu vực này, Student dễ phải vào từng Classroom để kiểm tra thủ công, làm giảm trải nghiệm học tập.

To-do list cần hiển thị các item sau:

| Loại item | Khi nào xuất hiện trong To-do | Khi nào biến mất khỏi To-do |
| --- | --- | --- |
| Micro Lesson | Lesson đã publish/assign nhưng Student chưa hoàn thành | Student hoàn thành lesson hoặc Teacher unpublish/archive lesson |
| Quiz | Quiz đã assign nhưng Student chưa submit hoặc chưa đạt điều kiện hoàn thành | Student submit quiz hợp lệ hoặc hết quyền truy cập |
| Assignment | Assignment đã assign nhưng Student chưa nộp hoặc cần nộp lại | Student submit/turn in hoặc Teacher mark returned/completed theo rule |
| Material bắt buộc | Material được Teacher đánh dấu required nhưng Student chưa mở/mark done | Student mở hoặc mark done theo rule |

Mỗi To-do item nên có tối thiểu:

- Title của việc cần làm.
- Classroom name.
- Teacher name nếu cần.
- Activity type: `Lesson`, `Quiz`, `Assignment`, `Material`.
- Due date hoặc trạng thái không có deadline.
- Status: `NOT_STARTED`, `IN_PROGRESS`, `MISSING`, `LATE`, `NEEDS_REVISION`.
- Action chính: `Start`, `Continue`, `Submit`, `Review` hoặc `Open`.

### Empty State Của To-do

Khi Student không còn việc cần làm, dashboard không được để trống khó hiểu. System cần hiển thị trạng thái rõ ràng:

```text
Bạn chưa có việc cần làm.
Các bài học, quiz hoặc assignment mới từ Teacher sẽ xuất hiện tại đây.
```

### Ghi Chú BA

- To-do không phải là một loại bài học mới; đây là **danh sách tổng hợp** từ Lesson, Quiz, Assignment, Material và Progress.
- To-do nên lấy dữ liệu từ tất cả Classroom mà Student đã tham gia.
- Một item đã hoàn thành không nên tiếp tục nằm trong tab việc cần làm chính, nhưng có thể xuất hiện trong tab `Completed` nếu hệ thống hỗ trợ.
- Teacher không cần tạo To-do riêng; To-do được tạo gián tiếp khi Teacher publish/assign content.

## 3. Class Stream / Class Announcement

### Mô Tả

Class Stream là bảng tin của Classroom. Teacher dùng Stream để đăng Announcement, thông báo Classwork mới hoặc nhắc deadline. Student dùng Stream để theo dõi hoạt động mới trong lớp.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem announcement | Student xem thông báo từ Teacher |
| Xem thông tin Classroom | Tên lớp, mô tả, Teacher |
| Comment | Student comment nếu Teacher bật quyền |
| Post lên Stream | Student đăng bài nếu Teacher bật quyền |
| Mention bạn học | Mention bằng @ nếu hệ thống hỗ trợ |
| Xem overall grade | Xem điểm tổng quan nếu Teacher chia sẻ |

### Ghi Chú MVP

MVP nên ưu tiên:

- Xem announcement.
- Xem thông tin Classroom.
- Nhận thông báo Classwork mới.

Comment, post của Student và mention có thể để sau MVP.

## 4. Classwork / Course Content

### Mô Tả

Classwork là nơi Student xem toàn bộ nội dung học tập được Teacher giao, gồm Micro Lesson, Module, Flashcard, Quiz, Assignment và Material.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem danh sách bài học | Hiển thị Assignment, Quiz, Lesson, Material |
| Xem theo topic/module | Lọc nội dung theo chủ đề hoặc module |
| Mở chi tiết bài | Xem instruction, deadline, attachment |
| Bắt đầu học | Mở Lesson, Flashcard hoặc Video |
| Bắt đầu làm bài | Mở Assignment hoặc Quiz |
| Xem material | Mở PDF, video, image, link hoặc file đính kèm |

## 5. Assignment Submission

### Mô Tả

Student có thể làm và nộp bài tập trực tuyến. Tùy loại bài, hệ thống có thể hỗ trợ `Turn in`, `Mark as done`, `Unsubmit`, `Resubmit` và private comment cho Teacher.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem instruction | Student xem yêu cầu bài tập |
| Nhập nội dung bài làm | Student nộp text answer nếu bài yêu cầu |
| Upload file | Student đính kèm file |
| Đính kèm link | Student gửi URL |
| Turn in | Student nộp bài |
| Mark as done | Student đánh dấu hoàn thành với bài không cần file |
| Unsubmit | Student hủy nộp để sửa nếu còn hạn |
| Resubmit | Student nộp lại sau khi chỉnh sửa |
| Private comment | Student gửi comment riêng cho Teacher |

### Data Gợi Ý

```text
student_id
assignment_id
submission_text
submission_file
submission_link
status: assigned / submitted / late / returned
submitted_at
returned_at
```

## 6. Quiz / Question

### Mô Tả

Student có thể làm quiz hoặc trả lời question trong Classwork. Hệ thống microlearning nên hỗ trợ quiz ngắn, tính điểm nhanh và lưu số lần làm bài.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Làm quiz | Student mở quiz và trả lời câu hỏi |
| Trả lời question | Student trả lời câu hỏi ngắn |
| Submit answer | Student gửi câu trả lời |
| Xem trạng thái | Đã nộp, chưa nộp, đang làm |
| Nhận điểm | Xem điểm nếu Teacher hoặc system trả điểm |
| Xem feedback | Xem nhận xét nếu có |

### Loại Câu Hỏi Đề Xuất

- Multiple choice.
- True/False.
- Short answer.
- Flashcard-based question.
- Auto grading cho câu hỏi khách quan.
- Manual grading cho câu hỏi tự luận ngắn.

## 7. My Learning Progress

### Mô Tả

Student cần xem được tiến độ học tập của bản thân trong từng Classroom hoặc Course.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem tổng số bài | Tổng số Lesson, Quiz, Assignment được giao |
| Xem bài đã hoàn thành | Nội dung đã hoàn thành |
| Xem bài chưa học | Nội dung chưa bắt đầu |
| Xem quiz đã làm | Quiz attempts và score |
| Xem bài còn thiếu | Missing assignments |
| Xem bài trễ hạn | Late / Done late |
| Xem % progress | Tỷ lệ hoàn thành Course/Classroom |
| Lọc theo status | Assigned, Submitted, Returned, Missing, Late |

## 8. Grade & Feedback

### Mô Tả

Student có thể xem điểm và phản hồi từ Teacher sau khi bài được chấm hoặc quiz được trả kết quả.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem điểm từng bài | Assignment grade hoặc quiz score |
| Xem điểm tổng quan | Overall grade nếu Teacher chia sẻ |
| Xem Teacher feedback | Nhận xét của Teacher |
| Xem rubric feedback | Nếu hệ thống hỗ trợ rubric |
| Xem returned work | Bài đã được Teacher trả |
| Xem grading status | Graded, Returned, Pending |

### Data Gợi Ý

```text
quiz_score
assignment_score
teacher_feedback
rubric_feedback
returned_at
grading_status
```

## 9. Learning Calendar / Deadline

### Mô Tả

Student cần xem được deadline của Assignment, Quiz hoặc lịch mở bài học. Đây là chức năng nên có để giảm tình trạng quên bài hoặc nộp trễ.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem lịch Classroom | Lịch các hoạt động trong Classroom |
| Xem deadline | Assignment due date, quiz due date |
| Xem sự kiện lớp | Class events nếu có |
| Nhắc việc học | Theo dõi bài sắp đến hạn |
| Lọc theo Classroom | Xem deadline theo từng Classroom |

## 10. Learning Resources

### Mô Tả

Student cần truy cập tài liệu học tập được Teacher chia sẻ. Với hệ thống microlearning, phần này có thể đơn giản hơn Google Drive nhưng vẫn cần đủ để mở tài liệu.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Xem file lớp học | Tài liệu Teacher giao |
| Mở PDF | Tài liệu đọc |
| Xem video | Video bài học ngắn |
| Xem image | Hình ảnh minh họa |
| Mở link | Link tài liệu ngoài |
| Tải file đính kèm | Download nếu Teacher cho phép |

## 11. Navigation Controls Cho Student

### Mô Tả

Các màn hình của Student phải có điều hướng rõ ràng để tránh tình trạng người học bị kẹt trong một trang hoặc không biết cách quay lại. Đây là nhóm chức năng nhỏ nhưng rất quan trọng khi triển khai ReactJS.

### Chức Năng Con

| Chức năng | Mô tả |
| --- | --- |
| Back button | Quay lại màn hình trước hoặc màn hình cha hợp lý |
| Next button | Đi tới bước tiếp theo, bài tiếp theo hoặc trang tiếp theo nếu có |
| Previous button | Quay lại bài trước/trang trước trong cùng một chuỗi học |
| Breadcrumb | Hiển thị ngữ cảnh như Dashboard > Classroom > Assignment |
| Return to Dashboard | Cho phép Student quay về Student Dashboard nhanh |

### Quy Tắc Điều Hướng

- Lesson Player nên có `Back to Classwork`, `Previous Lesson` và `Next Lesson` nếu lesson nằm trong một module có thứ tự.
- Quiz page nên có `Back to Classwork` trước khi bắt đầu và chỉ cho `Submit` khi Student xác nhận.
- Assignment detail nên có `Back to To-do` nếu Student mở bài từ To-do list.
- Classroom detail nên có đường quay về Student Dashboard.
- Khi browser history không có trang trước, `Back` nên fallback về màn hình cha hợp lý thay vì gây lỗi.

## Danh Sách Chức Năng Nên Có Trong MVP

MVP nên ưu tiên các chức năng sau:

```text
Student
├── Login
├── Join Classroom bằng Class Code / Invite Link
├── Xem Student Dashboard
├── Xem To-do / Việc cần làm trên Dashboard
├── Xem danh sách Classroom đã tham gia
├── Xem Class Stream / Announcement
├── Xem Classwork
├── Xem Micro Lesson
├── Học video / tài liệu ngắn
├── Làm Flashcard
├── Làm Quiz
├── Nộp Assignment nhỏ
├── Xem My Learning Progress
├── Xem Quiz Score
├── Xem Grade & Feedback
├── Xem deadline
├── Xem Learning Resources
└── Sử dụng Back / Next / Previous để điều hướng rõ ràng
```

## Chức Năng Có Thể Để Sau MVP

- Student post lên Stream.
- Mention bạn học.
- Join online meeting.
- Đồng bộ Google Calendar.
- Tích hợp Google Drive thật.
- Tạo Docs/Slides/Sheets trực tiếp trong hệ thống.
- Record audio/video/screencast.
- Rubric feedback nâng cao.

## Kết Luận BA

Nhóm chức năng Student/Learner cần tập trung vào 4 năng lực chính:

1. Tham gia Classroom dễ dàng và có kiểm soát.
2. Xem nội dung học tập rõ ràng theo Classwork.
3. Làm bài, nộp bài, làm quiz và nhận feedback.
4. Theo dõi tiến độ, điểm số và deadline của bản thân.

Nếu làm tốt các phần này, sản phẩm sẽ giữ được tinh thần tham khảo Google Classroom nhưng vẫn có bản chất microlearning: học ngắn, quiz nhanh, nội dung rõ, progress minh bạch.
