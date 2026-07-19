# Teacher Functions Reference

## Mục Đích

Tài liệu này mô tả các chức năng chính và chức năng con của vai trò **Teacher** trong hệ thống **Microlearning Classroom LMS Platform**.

Nội dung được xây dựng dựa trên định hướng sản phẩm của đồ án và tham khảo nghiệp vụ từ Google Classroom ở mức workflow, không định vị sản phẩm là bản sao của Google Classroom. Các chức năng được điều chỉnh để phù hợp với hệ thống microlearning nội bộ, nơi Teacher tạo Classroom, phân phối bài học ngắn, giao quiz, giao assignment, theo dõi tiến độ và hỗ trợ Student.

## Định Nghĩa Vai Trò

Teacher là người tổ chức hoạt động học tập trong hệ thống.

Teacher có trách nhiệm:

- Tạo và quản lý Classroom.
- Mời Student tham gia bằng Class Code hoặc Invite Link.
- Tạo Module, Lesson, Flashcard, Quiz, Assignment và Resource.
- Đăng Announcement cho lớp.
- Theo dõi quá trình học tập của Student.
- Chấm điểm, trả feedback và hỗ trợ Student hoàn thành khóa học.

Teacher không tự tạo account trong quy trình chính của hệ thống. Account Teacher được Admin mời bằng invitation link, sau đó Teacher tự kích hoạt account và đặt mật khẩu.

## Nguyên Tắc Thiết Kế Chức Năng Teacher

| Nguyên tắc | Mô tả |
| --- | --- |
| Classroom-first | Mọi hoạt động giảng dạy bắt đầu từ Classroom, sau đó mới đến Course, Module và Lesson. |
| Microlearning-first | Nội dung học tập cần ngắn, rõ mục tiêu, dễ hoàn thành và đo được tiến độ. |
| Measurable learning | Mỗi Lesson, Quiz hoặc Assignment nên tạo ra dữ liệu progress hoặc learning outcome. |
| Teacher visibility | Teacher phải nhìn thấy trạng thái học tập của từng Student trong Classroom. |
| Controlled enrollment | Student chỉ tham gia được Classroom bằng Class Code hoặc Invite Link hợp lệ do Teacher chia sẻ. |
| Safe collaboration | Các quyền comment, post, invite, submit và grade cần được kiểm soát rõ ràng. |

## Tổng Quan Nhóm Chức Năng Teacher

| STT | Nhóm chức năng | Capability name | Priority | Giai đoạn đề xuất |
| --- | --- | --- | --- | --- |
| 1 | Quản lý khóa học / lớp học | Teacher Course Management | Must | MVP |
| 2 | Mời và quản lý Student | Student Invitation and Roster Management | Must | MVP |
| 3 | Quản lý co-teacher | Co-teacher Management | Could | Post-MVP |
| 4 | Quản lý bảng tin / thông báo | Course Announcement / Class Stream | Must | MVP |
| 5 | Quản lý nội dung học tập | Classwork / Course Content Management | Must | MVP |
| 6 | Quản lý Module / Topic | Module / Topic Management | Must | MVP |
| 7 | Tạo bài học microlearning | Micro Lesson Management | Must | MVP |
| 8 | Tạo và quản lý Assignment | Assignment Management | Must | MVP |
| 9 | Tạo và quản lý Quiz / Question | Quiz and Question Management | Must | MVP |
| 10 | Quản lý tài liệu học tập | Learning Resource Management | Should | MVP Lite |
| 11 | Chấm điểm và trả bài | Grading and Return Work | Must | MVP |
| 12 | Phản hồi và tương tác với Student | Feedback and Interaction | Must | MVP |
| 13 | Theo dõi tiến độ học tập | Student Progress Tracking | Must | MVP |
| 14 | Quản lý điểm | Gradebook | Should | MVP Lite |
| 15 | Quản lý lịch học / deadline | Calendar and Deadline Management | Should | MVP Lite |
| 16 | Quản lý lớp học online | Online Class Link Management | Could | Post-MVP |
| 17 | Quản lý phụ huynh / người giám hộ | Guardian Management | Won't | Out of MVP |
| 18 | Quản lý cài đặt lớp học | Classroom Settings | Must | MVP |
| 19 | Quản lý thông báo cá nhân | Teacher Notification Settings | Could | Post-MVP |
| 20 | Chia sẻ và tái sử dụng nội dung | Content Reuse and Template | Should | Post-MVP |

## 1. Teacher Course Management

### Mục Tiêu

Cho phép Teacher tạo và quản lý Classroom hoặc Course để tổ chức hoạt động học tập cho Student.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Classroom | Teacher nhập tên lớp, mô tả, môn học, học kỳ hoặc phòng học. | Must |
| Cập nhật Classroom | Teacher chỉnh sửa tên, mô tả, môn học, ảnh bìa hoặc trạng thái lớp. | Must |
| Xem thông tin Classroom | Hiển thị tên lớp, Class Code, Teacher, số lượng Student và trạng thái lớp. | Must |
| Archive Classroom | Teacher lưu trữ lớp sau khi kết thúc học kỳ hoặc khóa học. | Should |
| Delete Classroom | Teacher xóa Classroom nếu chưa có dữ liệu học tập quan trọng hoặc theo quyền được cấp. | Could |
| Open/Close Classroom | Teacher mở hoặc đóng quyền truy cập Classroom. | Must |
| Quản lý Invite Link | Teacher tạo/copy raw link đúng một lần; các lần xem sau chỉ thấy metadata, trạng thái và thời hạn, không tái tạo raw link. | Must |
| Tạo Course trong Classroom | Teacher tạo khóa học/mạch nội dung bên trong Classroom. | Must |
| Mở Course Detail Dashboard | Khi bấm vào Course, Teacher xem dashboard riêng của Course. | Must |
| Xem danh sách bài học trong Course | Dashboard hiển thị tất cả Lesson/Activity Teacher đã tạo trong Course. | Must |
| Xem danh sách Student của Course | Teacher xem Student có quyền học Course, thường kế thừa từ classroom roster. | Must |
| Xem điểm quá trình của Student | Teacher xem process score/progress score của từng Student trong Course. | Must |
| Sắp xếp điểm quá trình cao xuống thấp | Bảng Student Progress mặc định sort từ cao đến thấp theo process score. | Must |

### Business Rules

- Mỗi Classroom active phải có một `class_code` duy nhất.
- Chỉ Teacher sở hữu Classroom hoặc Teacher được phân quyền mới được cập nhật Classroom.
- Classroom đã archive không cho Student mới tham gia, trừ khi Teacher mở lại.
- Không nên xóa cứng Classroom đã có Submission, Grade hoặc Progress. Hệ thống nên dùng soft delete hoặc archive.
- Course thuộc về một Classroom và Teacher chỉ mở được Course mà Teacher sở hữu hoặc được phân quyền quản lý.
- Course Student List lấy từ Student có quyền truy cập Course; mặc định là classroom roster, trừ khi Course được assign cho selected Students.

### Teacher Course Detail Dashboard Đề Xuất

Khi Teacher bấm vào một Course của mình, màn hình mặc định nên là `Course Detail Dashboard`.

Dashboard này cần trả lời nhanh 4 câu hỏi:

1. Course này có những bài học nào?
2. Student nào đang tham gia Course?
3. Mỗi Student đang đạt điểm quá trình bao nhiêu?
4. Bài nào có deadline và Student nào đang trễ?

Các khu vực chính:

| Khu vực | Nội dung |
| --- | --- |
| Course Summary | Tên Course, Classroom, trạng thái, số Lesson, số Student, average progress |
| Lessons / Activities | Tất cả Lesson, Flashcard, Quiz, Assignment, Resource đã tạo trong Course |
| Student List | Danh sách Student có quyền học Course |
| Student Progress Ranking | Bảng process score của Student, mặc định sắp xếp từ cao xuống thấp |
| Deadlines | Deadline hoàn thành từng Lesson/Activity |
| Quick Actions | Add Lesson, Add Quiz, Add Assignment, View Gradebook, View Progress |

### Bảng Student Progress Ranking Đề Xuất

| Cột | Ý nghĩa |
| --- | --- |
| Rank | Thứ hạng theo process score |
| Student name | Họ tên Student |
| Email / Student code | Thông tin định danh |
| Process score | Điểm quá trình từ 0 đến 100 |
| Progress percentage | Tỷ lệ hoàn thành required activities |
| Completed lessons | Số bài học đã hoàn thành |
| Quiz average | Điểm quiz trung bình nếu có |
| Assignment status | Submitted, missing, late, returned |
| Late items | Số item quá hạn |
| Last active | Lần hoạt động gần nhất |

Gợi ý tính `processScore` trong MVP:

```text
Nếu chưa có grade weighting nâng cao:
processScore = progressPercentage

Nếu có Quiz/Assignment:
processScore = completionScore * 60% + quizAverage * 25% + assignmentScore * 15%
```

Trong MVP, có thể bắt đầu bằng công thức đơn giản hơn:

```text
processScore = progressPercentage
```

Sau này khi Gradebook nâng cao hơn, hệ thống có thể cho Teacher cấu hình trọng số.

## 2. Student Invitation and Roster Management

### Mục Tiêu

Cho phép Teacher mời Student tham gia Classroom và quản lý danh sách Student trong lớp.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Chia sẻ Class Code | Teacher chia sẻ mã lớp để Student tự join. | Must |
| Chia sẻ Invite Link | Teacher copy link ngay sau create/regenerate; nếu không còn raw link thì phải regenerate thay vì xem lại token cũ. | Must |
| Xem roster | Teacher xem danh sách Student đã tham gia Classroom. | Must |
| Tìm kiếm Student | Tìm theo họ tên, email hoặc mã Student. | Must |
| Lọc trạng thái Student | Lọc active, invited, removed hoặc blocked. | Should |
| Remove Student | Teacher xóa Student khỏi Classroom khi cần. | Must |
| Reset Class Code | Teacher tạo lại Class Code nếu mã bị lộ. | Should |
| Disable Class Code | Teacher tắt khả năng tự join bằng Class Code. | Should |

### Luồng Nghiệp Vụ Đề Xuất

```text
Teacher mở Classroom
        ↓
Teacher lấy Class Code / Invite Link
        ↓
Student nhập mã hoặc bấm link
        ↓
System validate Classroom và enrollment rule
        ↓
System tạo Enrollment
        ↓
Student xuất hiện trong Roster
```

### Business Rules

- Một Student không được tạo nhiều Enrollment active trong cùng một Classroom.
- Nếu Class Code bị disabled, Student không thể join bằng code nhưng vẫn có thể join bằng Invite Link nếu link còn active.
- Teacher có thể remove Student, nhưng dữ liệu Submission và Grade nên được giữ để audit.

## 3. Co-teacher Management

### Mục Tiêu

Cho phép Teacher mời giảng viên khác cùng hỗ trợ quản lý Classroom.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Mời co-teacher | Teacher nhập email giảng viên khác để mời vào Classroom. | Could |
| Xem danh sách Teacher | Hiển thị owner Teacher và co-teacher. | Could |
| Phân quyền co-teacher | Xác định co-teacher được tạo nội dung, chấm bài hoặc quản lý Student. | Could |
| Remove co-teacher | Owner Teacher xóa co-teacher khỏi Classroom. | Could |
| Transfer ownership | Chuyển quyền sở hữu Classroom cho Teacher khác. | Could |

### Ghi Chú Scope

Chức năng này không bắt buộc trong MVP. Với đồ án hiện tại, có thể đưa vào Post-MVP để giảm độ phức tạp về phân quyền.

## 4. Course Announcement / Class Stream

### Mục Tiêu

Cho phép Teacher đăng thông báo, nhắc deadline và giao tiếp với Student trong Classroom.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Announcement | Teacher viết thông báo cho Classroom. | Must |
| Đính kèm tài liệu | Gắn file, link, video hoặc image vào Announcement. | Should |
| Gửi cho cả lớp | Announcement hiển thị cho toàn bộ Student trong Classroom. | Must |
| Gửi cho một nhóm Student | Chọn một số Student nhận thông báo. | Could |
| Lên lịch đăng | Schedule Announcement theo ngày giờ. | Should |
| Lưu nháp | Save draft trước khi publish. | Should |
| Chỉnh sửa Announcement | Teacher edit nội dung đã đăng. | Must |
| Xóa Announcement | Teacher delete hoặc archive thông báo. | Must |
| Pin Announcement | Ghim thông báo quan trọng ở đầu Stream. | Should |
| Quản lý comment | Bật/tắt comment của Student. | Should |

### Business Rules

- Student chỉ xem được Announcement trong Classroom mà Student đã enroll.
- Nếu Announcement có lịch đăng, Student chỉ thấy sau thời điểm publish.
- Comment của Student phụ thuộc vào setting của Classroom hoặc từng Announcement.

## 5. Classwork / Course Content Management

### Mục Tiêu

Cho phép Teacher quản lý toàn bộ nội dung học tập được giao cho Student trong Classroom.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Course Content | Teacher tạo nội dung học tập trong Classroom. | Must |
| Tạo Material | Tạo tài liệu đọc, PDF, link hoặc video. | Should |
| Tạo Assignment | Tạo bài tập nhỏ cho Student nộp. | Must |
| Tạo Quiz | Tạo bài kiểm tra ngắn. | Must |
| Tạo Micro Lesson | Tạo bài học ngắn theo tinh thần microlearning. | Must |
| Gán Topic/Module | Đưa item vào Module hoặc Topic. | Must |
| Publish content | Công bố nội dung cho Student. | Must |
| Save draft | Lưu nháp nội dung chưa publish. | Should |
| Schedule publish | Lên lịch mở nội dung. | Should |
| Assign to all Students | Giao cho toàn lớp. | Must |
| Assign to selected Students | Giao cho một số Student. | Could |
| Reorder content | Sắp xếp thứ tự học. | Must |

### Cấu Trúc Nội Dung Đề Xuất

```text
Classroom
  └── Course
        └── Module / Topic
              ├── Micro Lesson
              ├── Flashcard
              ├── Quiz
              ├── Assignment
              └── Resource
```

## 6. Module / Topic Management

### Mục Tiêu

Cho phép Teacher chia nội dung học thành các phần nhỏ, có thứ tự và dễ theo dõi.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Module | Tạo chương học, tuần học hoặc chủ đề. | Must |
| Đổi tên Module | Cập nhật tên Module. | Must |
| Thêm mô tả Module | Mô tả mục tiêu học tập của Module. | Should |
| Sắp xếp Module | Move up, move down hoặc drag and drop. | Must |
| Gán Lesson vào Module | Đưa Micro Lesson vào Module phù hợp. | Must |
| Gán Quiz/Assignment vào Module | Gắn hoạt động đánh giá vào Module. | Must |
| Ẩn/hiện Module | Unpublish Module chưa sẵn sàng. | Should |
| Xóa Module | Xóa Module nếu không còn dùng. | Should |

### Business Rules

- Không nên xóa Module nếu bên trong đã có Lesson có Progress, Quiz Attempt hoặc Submission.
- Module có thể ở trạng thái `draft`, `published`, `archived`.

## 7. Micro Lesson Management

### Mục Tiêu

Cho phép Teacher tạo bài học ngắn, dễ hoàn thành, có thể đo được progress.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Lesson | Nhập tiêu đề, mô tả và mục tiêu học tập. | Must |
| Thêm nội dung ngắn | Nội dung text ngắn, rõ trọng tâm. | Must |
| Thêm video | Upload video hoặc gắn video URL. | Should |
| Thêm image | Upload ảnh minh họa. | Should |
| Thêm file | Gắn PDF, slide hoặc tài liệu bổ sung. | Should |
| Thêm Flashcard | Tạo thẻ hỏi đáp trong Lesson. | Must |
| Thêm Mini Quiz | Tạo câu hỏi kiểm tra nhanh sau Lesson. | Must |
| Cài thời lượng | Ví dụ 3 đến 5 phút. | Should |
| Cài deadline hoàn thành bài học | Teacher đặt hạn hoàn thành riêng cho từng Lesson. | Must |
| Đặt lại deadline bài học | Teacher reset deadline của Lesson khi có ngoại lệ và nhập lý do thay đổi. | Must |
| Cài điều kiện hoàn thành | Xem hết bài, làm quiz hoặc đạt điểm tối thiểu. | Must |
| Publish Lesson | Công bố Lesson cho Student. | Must |
| Unpublish Lesson | Ẩn Lesson khỏi Student. | Must |
| Reorder Lesson | Sắp xếp thứ tự Lesson trong Module. | Must |

### Ví Dụ Micro Lesson

```text
Lesson: REST API là gì?
Duration: 5 phút
Content:
- Video 3 phút
- 5 Flashcards
- Mini Quiz 3 câu
Completion Rule:
- Student xem lesson
- Student làm quiz đạt >= 70%
Deadline:
- Hoàn thành trước 2026-07-20 23:59
```

## 8. Assignment Management

### Mục Tiêu

Cho phép Teacher tạo bài tập nhỏ để Student luyện tập, nộp bài và nhận feedback.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Assignment | Nhập title, instruction và nội dung yêu cầu. | Must |
| Gắn Assignment vào Module | Đưa Assignment vào Course Content. | Must |
| Cài max score | Thiết lập điểm tối đa. | Must |
| Cài due date | Thiết lập deadline nộp bài. | Must |
| Cài due time | Thiết lập giờ hết hạn. | Should |
| Cho phép nộp trễ | Bật/tắt late submission. | Should |
| Thêm attachment | Gắn file, link hoặc resource. | Should |
| Assign to Classroom | Giao bài cho toàn lớp. | Must |
| Assign to selected Students | Giao bài cho một số Student. | Could |
| Save draft | Lưu nháp bài tập. | Should |
| Publish Assignment | Công bố bài tập. | Must |
| Schedule Assignment | Hẹn giờ đăng bài tập. | Should |
| Edit Assignment | Sửa nội dung bài tập. | Must |
| Delete Assignment | Xóa hoặc archive bài tập. | Should |

### Data Fields Đề Xuất

```text
Assignment
- assignment_id
- classroom_id
- module_id
- title
- instruction
- max_score
- due_date
- allow_late_submission
- attachment_urls
- status: draft / scheduled / published / closed / archived
```

## 9. Quiz and Question Management

### Mục Tiêu

Cho phép Teacher tạo Quiz ngắn để đánh giá nhanh mức độ hiểu bài của Student.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo Quiz | Nhập quiz title, description và instruction. | Must |
| Tạo câu hỏi single choice | Trắc nghiệm một đáp án đúng. | Must |
| Tạo câu hỏi multiple choice | Trắc nghiệm nhiều đáp án đúng. | Should |
| Tạo câu hỏi true/false | Câu hỏi đúng/sai. | Must |
| Tạo câu hỏi short answer | Câu trả lời ngắn, có thể cần chấm thủ công. | Should |
| Thêm image vào câu hỏi | Teacher có thể gắn ảnh minh họa vào câu hỏi trắc nghiệm nếu cần. | Should |
| Thêm video vào câu hỏi | Teacher có thể gắn video ngắn hoặc video URL vào câu hỏi nếu cần. | Could |
| Preview media trong câu hỏi | Teacher xem trước image/video trong Quiz Builder trước khi publish. | Should |
| Xóa media khỏi câu hỏi | Teacher có thể remove image/video khỏi câu hỏi khi không còn cần. | Should |
| Cài điểm từng câu | Point per question. | Must |
| Cài time limit | Giới hạn thời gian làm bài. | Should |
| Cài attempts | Một lần hoặc nhiều lần làm bài. | Must |
| Random question | Đảo thứ tự câu hỏi. | Could |
| Random answer | Đảo thứ tự đáp án. | Could |
| Auto grading | Tự chấm với câu hỏi có đáp án chuẩn. | Must |
| Manual grading | Teacher chấm câu tự luận ngắn. | Should |
| Xem quiz result | Xem điểm, câu đúng, câu sai và thời điểm làm. | Must |
| Export quiz report | Xuất báo cáo điểm quiz. | Should |

### Business Rules

- Quiz đã publish và đã có attempt không nên sửa trực tiếp câu hỏi cũ. Hệ thống nên tạo version mới hoặc giới hạn các trường được sửa.
- Auto grading áp dụng cho single choice, multiple choice và true/false.
- Short answer có thể ở trạng thái `pending_review` trước khi có điểm cuối cùng.
- Image/video trong Quiz Question là tùy chọn, không bắt buộc để publish Quiz.
- Media đính kèm câu hỏi phải tuân theo file upload policy, file size, file type và quyền truy cập của Classroom.
- Nếu dùng video URL, hệ thống cần validate URL format và chỉ hiển thị video cho Student có quyền làm Quiz.

### Question Media Gợi Ý

Chức năng thêm image/video vào câu hỏi giúp Teacher tạo câu hỏi trực quan hơn, ví dụ:

- Câu hỏi nhìn hình chọn đáp án đúng.
- Câu hỏi xem đoạn video ngắn rồi trả lời.
- Câu hỏi phân tích ảnh chụp màn hình, biểu đồ, đoạn code hoặc tình huống thực tế.

Field gợi ý cho mỗi media:

| Field | Mô tả |
| --- | --- |
| mediaType | `IMAGE` hoặc `VIDEO` |
| mediaUrl | URL file hoặc external video URL |
| caption | Mô tả ngắn cho media |
| altText | Text thay thế cho accessibility |
| displayOrder | Thứ tự hiển thị nếu một câu hỏi có nhiều media |

Ghi chú scope:

- MVP có thể ưu tiên image upload hoặc image URL trước.
- Video upload có thể để Post-MVP nếu hạ tầng storage chưa sẵn sàng.
- Video URL nên được ưu tiên hơn upload video trong giai đoạn đầu để giảm chi phí lưu trữ.

## 10. Learning Resource Management

### Mục Tiêu

Cho phép Teacher chia sẻ tài liệu học tập hỗ trợ Lesson, Quiz hoặc Assignment.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Upload PDF | Teacher upload tài liệu PDF. | Should |
| Upload slide | Teacher upload slide bài giảng. | Should |
| Thêm website link | Gắn link tài liệu ngoài. | Must |
| Thêm video link | Gắn video học tập. | Should |
| Thêm image | Upload ảnh minh họa. | Should |
| Gán Resource vào Module | Đưa tài liệu vào Module hoặc Lesson. | Must |
| Gán Resource cho Classroom | Hiển thị tài liệu cho toàn lớp. | Must |
| Sắp xếp Resource | Đổi thứ tự tài liệu. | Should |
| Edit Resource | Cập nhật tên, mô tả, file hoặc link. | Must |
| Delete Resource | Xóa hoặc archive tài liệu. | Should |
| Download permission | Cho phép hoặc không cho phép Student tải file. | Could |

### Ghi Chú MVP

MVP không cần tích hợp Google Drive đầy đủ. Có thể hỗ trợ upload file cơ bản và lưu file URL trên Cloud storage.

## 11. Grading and Return Work

### Mục Tiêu

Cho phép Teacher xem bài nộp, chấm điểm, gửi feedback và trả bài cho Student.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem danh sách Submission | Teacher xem Student đã nộp, chưa nộp, nộp trễ. | Must |
| Mở bài nộp | Xem text, file hoặc link Student nộp. | Must |
| Nhập điểm | Teacher nhập numeric grade. | Must |
| Lưu điểm nháp | Lưu draft grade trước khi trả bài. | Should |
| Gửi feedback riêng | Teacher nhận xét riêng cho Student. | Must |
| Return work | Trả bài để Student xem điểm và feedback. | Must |
| Return without grade | Trả bài không điểm nếu cần. | Could |
| Return multiple | Trả bài hàng loạt. | Should |
| Update grade | Chỉnh sửa điểm sau khi trả bài. | Should |
| Chấm bằng rubric | Chấm theo tiêu chí định sẵn. | Could |
| Download grades | Tải bảng điểm Submission. | Should |

### Data Fields Đề Xuất

```text
Submission
- submission_id
- assignment_id
- student_id
- submission_text
- submission_file_urls
- status: assigned / submitted / late / graded / returned
- submitted_at
- score
- feedback
- returned_at
```

## 12. Feedback and Interaction

### Mục Tiêu

Cho phép Teacher hỗ trợ Student trong quá trình học tập, đặc biệt qua feedback riêng và comment trong lớp.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Public comment | Teacher comment công khai trong Announcement hoặc Class Stream. | Should |
| Private feedback | Teacher gửi feedback riêng cho Submission. | Must |
| Reply Student question | Teacher trả lời câu hỏi của Student. | Should |
| Comment on Assignment | Teacher trao đổi trong ngữ cảnh Assignment. | Should |
| Comment bank | Teacher lưu comment mẫu. | Could |
| Notify Student | Hệ thống gửi notification khi có feedback. | Must |
| Reminder missing work | Teacher gửi nhắc Student chưa nộp bài. | Should |

### Business Rules

- Feedback riêng chỉ Student nhận feedback và Teacher có quyền mới xem được.
- Public comment tuân theo Classroom Settings về quyền bình luận.
- Feedback sau khi return work phải hiển thị trong Student Grade & Feedback page.

## 13. Student Progress Tracking

### Mục Tiêu

Cho phép Teacher xem toàn bộ quy trình học tập và mức độ hoàn thành của từng Student trong Classroom.

Đây là chức năng rất quan trọng đối với hệ thống microlearning vì nó chứng minh được giá trị khác biệt của sản phẩm: không chỉ giao bài mà còn đo được tiến độ học tập.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem tổng quan Classroom | Tổng Student, active Student, average progress. | Must |
| Xem progress từng Student | % completion, lessons done, quiz done, assignments submitted. | Must |
| Xem điểm quá trình từng Student | Process score từ 0 đến 100 cho từng Student trong Course. | Must |
| Sort progress cao xuống thấp | Mặc định bảng Student Progress sắp xếp process score từ cao đến thấp. | Must |
| Xem progress từng Lesson | Bao nhiêu Student đã hoàn thành từng Lesson. | Must |
| Xem quiz score | Điểm quiz theo Student và theo Quiz. | Must |
| Xem missing work | Student chưa nộp Assignment hoặc chưa làm Quiz. | Must |
| Xem late work | Student nộp trễ hoặc làm bài sau deadline. | Should |
| Xem last active | Thời điểm hoạt động gần nhất của Student. | Should |
| Lọc Student cần hỗ trợ | Lọc theo progress thấp, điểm thấp hoặc inactive. | Should |
| Xem learning risk | Gắn cờ Student có nguy cơ không hoàn thành. | Could |
| Export progress report | Xuất CSV/Excel báo cáo tiến độ. | Should |

### Teacher Progress Dashboard Đề Xuất

| Cột hiển thị | Ý nghĩa |
| --- | --- |
| Student name | Họ tên Student |
| Email / Student code | Thông tin định danh |
| Enrollment status | Active, invited, removed |
| Progress percentage | Tỷ lệ hoàn thành Course/Classroom |
| Process score | Điểm quá trình tổng hợp, mặc định 0 đến 100 |
| Completed lessons | Số Lesson đã hoàn thành |
| Quiz average score | Điểm quiz trung bình |
| Assignment status | Submitted, missing, late, returned |
| Last active | Lần hoạt động gần nhất |
| Risk flag | Cần hỗ trợ hoặc bình thường |

### Business Rules

- Progress phải được cập nhật khi Student hoàn thành Lesson, nộp Assignment hoặc làm Quiz.
- Teacher chỉ xem progress của Student thuộc Classroom mình quản lý.
- Dữ liệu progress nên hỗ trợ lọc theo Classroom, Course, Module và Student.
- Bảng Course Student Progress mặc định sắp xếp theo `processScore DESC`.
- Nếu hai Student có cùng process score, hệ thống có thể sắp xếp tiếp theo `lastActive DESC` hoặc `studentName ASC`.

## 14. Gradebook

### Mục Tiêu

Cho phép Teacher xem, quản lý và xuất bảng điểm của Classroom.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Xem bảng điểm toàn lớp | Hiển thị điểm Quiz, Assignment và final score. | Should |
| Xem điểm từng Student | Student grade profile. | Should |
| Nhập điểm thủ công | Nhập điểm cho Assignment cần chấm tay. | Should |
| Cập nhật điểm | Sửa điểm nếu có thay đổi. | Should |
| Return grade | Trả điểm cho Student. | Must |
| Cài thang điểm | 10 điểm, 100 điểm hoặc custom scale. | Could |
| Cài cách tính điểm | Total points hoặc weighted categories. | Could |
| Export gradebook | Xuất file CSV/Excel. | Should |

### Ghi Chú MVP

MVP có thể triển khai Gradebook ở mức cơ bản:

```text
Gradebook
- student_id
- classroom_id
- quiz_score
- assignment_score
- progress_percentage
- final_score
```

## 15. Calendar and Deadline Management

### Mục Tiêu

Cho phép Teacher quản lý deadline, lịch mở bài và nhắc việc học tập.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Cài due date Assignment | Thiết lập deadline bài tập. | Must |
| Cài due date Quiz | Thiết lập deadline quiz nếu có. | Should |
| Cài deadline từng Lesson | Thiết lập deadline hoàn thành cho từng bài học trong Course. | Must |
| Reset deadline từng Lesson | Đặt lại deadline Lesson khi phát sinh ngoại lệ như nghỉ học, đặt sai deadline, cập nhật nội dung hoặc cần gia hạn. | Must |
| Schedule Lesson | Lên lịch mở Lesson. | Should |
| Schedule Announcement | Lên lịch đăng thông báo. | Should |
| Xem class calendar | Xem lịch hoạt động trong Classroom. | Should |
| Reminder Student | Nhắc Student khi gần deadline. | Should |
| Close Assignment | Đóng bài sau deadline. | Should |
| Allow late submission | Cho phép nộp trễ và đánh dấu late. | Should |

### Business Rules

- Deadline cần hiển thị cho cả Teacher và Student.
- Deadline từng Lesson cần hiển thị trong Course Dashboard, Student To-do và Student Deadline View.
- Mỗi Lesson được publish/assign cho Student cần có deadline riêng.
- Teacher được reset deadline từng Lesson khi có ngoại lệ.
- Khi reset deadline của Lesson đã publish/assigned, Teacher cần nhập lý do thay đổi để phục vụ audit và review.
- Sau khi deadline thay đổi, Student To-do, Deadline View và trạng thái late/missing phải được cập nhật theo deadline mới.
- Bài nộp sau due date được đánh dấu `late` nếu late submission được bật.
- Nếu Assignment bị closed, Student không thể nộp mới trừ khi Teacher mở lại.

## 16. Online Class Link Management

### Mục Tiêu

Cho phép Teacher gắn link học online vào Classroom nếu lớp có buổi học trực tuyến.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Tạo online class link | Nhập meeting title, URL, start time và end time. | Could |
| Hiển thị meeting link | Student thấy link trong Classroom nếu được bật. | Could |
| Ẩn/hiện meeting link | Teacher kiểm soát link có hiển thị hay không. | Could |
| Cập nhật meeting link | Sửa URL hoặc thời gian học. | Could |
| Xóa meeting link | Xóa link không còn dùng. | Could |

### Ghi Chú Scope

MVP không cần tích hợp video meeting thật. Chỉ cần lưu và hiển thị `meeting_url` nếu muốn có lớp học online.

## 17. Guardian Management

### Mục Tiêu

Cho phép quản lý phụ huynh hoặc người giám hộ nhận thông tin học tập của Student.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Mời guardian | Gửi email invite cho phụ huynh. | Won't |
| Xem guardian list | Xem danh sách phụ huynh liên kết với Student. | Won't |
| Email summary | Gửi tóm tắt tiến độ học tập. | Won't |
| Remove guardian | Xóa liên kết guardian. | Won't |

### Ghi Chú Scope

Chức năng này không phù hợp với MVP của đồ án vì đối tượng chính là Teacher và Student trong môi trường LMS nội bộ.

## 18. Classroom Settings

### Mục Tiêu

Cho phép Teacher cấu hình cách Classroom vận hành.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Đổi tên Classroom | Cập nhật tên lớp. | Must |
| Đổi mô tả Classroom | Cập nhật mô tả lớp. | Must |
| Bật/tắt Class Code | Kiểm soát khả năng join bằng code. | Must |
| Reset Class Code | Tạo mã mới khi mã cũ bị lộ. | Should |
| Bật/tắt Invite Link | Kiểm soát khả năng join bằng link. | Should |
| Cài quyền comment | Student được comment hay chỉ Teacher. | Should |
| Cài quyền post | Student có được đăng bài trong Stream hay không. | Could |
| Cài hiển thị grade | Cho phép Student xem overall grade. | Should |
| Cài theme/banner | Đổi ảnh bìa hoặc theme lớp. | Could |

### Business Rules

- Chỉ Teacher sở hữu Classroom hoặc Admin mới được thay đổi settings quan trọng.
- Reset Class Code làm code cũ không còn hợp lệ.
- Nếu tắt Invite Link, các link đang active phải bị vô hiệu hóa.

## 19. Teacher Notification Settings

### Mục Tiêu

Cho phép Teacher kiểm soát loại thông báo mình nhận.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Bật/tắt email notification | Teacher nhận hoặc không nhận email. | Could |
| Bật/tắt in-app notification | Teacher nhận thông báo trong hệ thống. | Should |
| Tùy chỉnh loại notification | Submission mới, comment mới, deadline, progress alert. | Could |
| Tùy chỉnh theo Classroom | Classroom nào bật/tắt notification. | Could |

### Ghi Chú Scope

MVP có thể chỉ cần in-app notification cơ bản cho Submission mới, feedback sent và deadline.

## 20. Content Reuse and Template

### Mục Tiêu

Cho phép Teacher tái sử dụng nội dung để giảm thời gian chuẩn bị lớp mới.

### Chức Năng Con

| Chức năng con | Mô tả | Priority |
| --- | --- | --- |
| Copy Classroom | Nhân bản cấu trúc Classroom. | Should |
| Copy Course | Nhân bản Course sang Classroom khác. | Should |
| Reuse Lesson | Dùng lại Lesson đã tạo. | Should |
| Reuse Quiz | Dùng lại Quiz đã tạo. | Should |
| Reuse Assignment | Dùng lại Assignment. | Should |
| Course template | Lưu Course làm template. | Could |
| Preview content | Xem trước nội dung trước khi import. | Should |

### Ví Dụ

```text
NodeJS K48
        ↓ copy
NodeJS K49
```

## MVP Scope Đề Xuất Cho Teacher

Để đồ án vừa đủ chuyên nghiệp vừa kiểm soát được phạm vi, Teacher nên có 12 nhóm chức năng cốt lõi sau:

```text
Teacher trong hệ thống Microlearning
├── Đăng nhập
├── Quản lý Classroom
├── Mời Student bằng Class Code / Invite Link
├── Quản lý danh sách Student
├── Tạo Module / Topic
├── Tạo Micro Lesson
├── Tạo Flashcard
├── Tạo Quiz
├── Tạo Assignment nhỏ
├── Đăng Announcement
├── Chấm điểm / Feedback
└── Theo dõi Progress của Student
```

## Post-MVP Scope Đề Xuất

Các chức năng sau có giá trị nhưng nên để sau MVP:

| Chức năng | Lý do để Post-MVP |
| --- | --- |
| Co-teacher Management | Tăng độ phức tạp phân quyền. |
| Guardian Management | Không phải đối tượng chính của đồ án. |
| SIS Integration | Phụ thuộc hệ thống quản lý đào tạo ngoài. |
| Advanced Gradebook | Cần nhiều rule về thang điểm và trọng số. |
| Originality Report | Cần tích hợp kiểm tra đạo văn hoặc AI. |
| Full Online Meeting Integration | Cần tích hợp bên thứ ba. |
| Content Template Marketplace | Phù hợp khi hệ thống đã có nhiều Teacher và Course. |

## Use Case Đề Xuất Cho Teacher

| Use Case ID | Use Case Name | Priority |
| --- | --- | --- |
| UC-TEA-01 | Login hệ thống | Must |
| UC-TEA-02 | Tạo Classroom | Must |
| UC-TEA-03 | Cập nhật Classroom | Must |
| UC-TEA-04 | Mời Student tham gia Classroom | Must |
| UC-TEA-05 | Quản lý roster Student | Must |
| UC-TEA-06 | Tạo Module / Topic | Must |
| UC-TEA-07 | Tạo Micro Lesson | Must |
| UC-TEA-08 | Tạo Flashcard | Must |
| UC-TEA-09 | Tạo Quiz | Must |
| UC-TEA-10 | Tạo Assignment | Must |
| UC-TEA-11 | Đăng Announcement | Must |
| UC-TEA-12 | Xem Submission | Must |
| UC-TEA-13 | Chấm điểm và trả Feedback | Must |
| UC-TEA-14 | Xem Dashboard Progress | Must |
| UC-TEA-15 | Xem Gradebook | Should |
| UC-TEA-16 | Quản lý Deadline | Should |
| UC-TEA-17 | Tái sử dụng nội dung | Should |
| UC-TEA-18 | Xem Course Detail Dashboard | Must |
| UC-TEA-19 | Xem Student Progress Ranking Trong Course | Must |
| UC-TEA-20 | Đặt Deadline Cho Từng Lesson | Must |

## Acceptance Criteria Tổng Quát

| ID | Acceptance Criteria |
| --- | --- |
| AC-TEA-001 | Teacher chỉ quản lý được Classroom do mình sở hữu hoặc được phân quyền. |
| AC-TEA-002 | Teacher có thể tạo Classroom và hệ thống tự sinh Class Code duy nhất. |
| AC-TEA-003 | Teacher có thể tạo Invite Link để Student join Classroom. |
| AC-TEA-004 | Teacher xem được danh sách Student đã join Classroom. |
| AC-TEA-005 | Teacher có thể tạo Module, Lesson, Flashcard, Quiz và Assignment. |
| AC-TEA-006 | Student chỉ thấy nội dung đã publish hoặc đã đến lịch mở. |
| AC-TEA-007 | Teacher xem được Submission status theo từng Assignment. |
| AC-TEA-008 | Teacher có thể chấm điểm, nhập feedback và return work cho Student. |
| AC-TEA-009 | Teacher xem được progress từng Student trong Classroom. |
| AC-TEA-010 | Teacher Dashboard hiển thị được số Student, progress trung bình, quiz average score và danh sách Student cần hỗ trợ. |
| AC-TEA-011 | Teacher có thể tùy chọn thêm image hoặc video vào Quiz Question và Student xem được media đó khi làm Quiz. |
| AC-TEA-012 | Khi Teacher mở Course, hệ thống hiển thị Course Detail Dashboard gồm tất cả Lesson/Activity đã tạo trong Course. |
| AC-TEA-013 | Teacher xem được danh sách Student và bảng điểm quá trình của Course, mặc định sắp xếp từ cao xuống thấp. |
| AC-TEA-014 | Teacher có thể đặt deadline hoàn thành cho từng Lesson và deadline đó hiển thị cho Student trong To-do/Deadline View. |
| AC-TEA-015 | Teacher có thể reset deadline của từng Lesson khi có ngoại lệ; hệ thống yêu cầu reason và cập nhật deadline mới sang Student To-do/Deadline View. |

## Kết Luận BA

Vai trò Teacher là trung tâm vận hành của hệ thống Microlearning Classroom LMS Platform. Để sản phẩm chuyên nghiệp, Teacher không chỉ cần tạo khóa học mà còn phải có đủ công cụ để:

1. Tổ chức Classroom.
2. Phân phối nội dung microlearning.
3. Đo lường tiến độ Student.
4. Chấm điểm và phản hồi.
5. Nhận diện Student cần hỗ trợ.

Trong MVP, nên tập trung vào các chức năng giúp chứng minh vòng giá trị chính:

```text
Teacher tạo nội dung
        ↓
Student học bài ngắn
        ↓
System ghi nhận progress
        ↓
Teacher xem dashboard, chấm điểm và feedback
```

Nếu làm tốt các nhóm chức năng này, hệ thống sẽ có bản sắc riêng của microlearning nhưng vẫn giữ được workflow lớp học quen thuộc như các LMS hiện đại.
