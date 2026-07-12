# Learning Process

## Mục Đích

Tài liệu này mô tả chi tiết quy trình học tập của **Student** trong hệ thống **Microlearning Classroom LMS Platform**. Quy trình bắt đầu từ khi Student đã tham gia một Classroom hợp lệ và kết thúc khi Student hoàn thành các learning activities được Teacher giao, bao gồm micro lesson, quiz, assignment, resource và feedback.

Mục tiêu của process là đảm bảo:

- Student có thể học nội dung ngắn, rõ ràng, phù hợp mô hình microlearning.
- System ghi nhận đúng tiến độ học tập của từng Student.
- Teacher có dashboard để xem mức độ hoàn thành của từng Student và toàn bộ Classroom.
- Dữ liệu learning progress có thể dùng cho reports, gradebook, analytics và audit khi cần.

## Process Summary

| Thuộc tính | Giá trị |
| --- | --- |
| Process ID | BP-001 |
| Process Name | Learning Process |
| Process Owner | Student |
| Supporting Actors | Teacher, System, Admin |
| Trigger | Student mở Classroom hoặc learning activity được assign |
| Priority | Must Have |
| Frequency | Hằng ngày hoặc theo lịch học của Classroom |
| Input | Student account, Classroom enrollment, published learning content |
| Output | Lesson progress, quiz attempt, assignment submission, score, feedback, completion status |

## Phạm Vi

### In Scope

- Student xem danh sách Classroom đã tham gia.
- Student xem `To-do` / `Việc cần làm` trên Dashboard để biết activity chưa hoàn thành.
- Student truy cập Stream, Classwork, Module, Lesson, Quiz, Assignment và Resource.
- Student học micro lesson và đánh dấu hoàn thành theo rule của hệ thống.
- Student làm quiz và nhận score nếu quiz được auto-grade.
- Student nộp assignment nếu Teacher giao bài.
- Student xem score, feedback và trạng thái hoàn thành.
- Teacher xem tiến độ của từng Student trên Classroom Progress Dashboard.
- System ghi nhận progress, completion, attempt, submission và audit event liên quan.

### Out Of Scope Cho MVP

- AI tutor cá nhân hóa lộ trình học.
- Live class hoặc video conference.
- Proctoring chống gian lận nâng cao.
- Certificate tự động nâng cao.
- Adaptive learning engine phức tạp.

## Actor Và Trách Nhiệm

| Actor | Trách nhiệm |
| --- | --- |
| Student | Học lesson, làm quiz, nộp assignment, xem feedback và theo dõi tiến độ cá nhân |
| Teacher | Tạo nội dung, giao activity, theo dõi progress, chấm điểm và feedback |
| System | Validate quyền truy cập, ghi progress, tính completion, lưu attempt/submission và cập nhật dashboard |
| Admin | Không can thiệp học tập hằng ngày, chỉ xem reports/governance nếu có quyền |

## Preconditions

- Student có account hợp lệ với `Status = ACTIVE`.
- Student đã login thành công.
- Student đã tham gia Classroom bằng `Class Code`, `Invite Link`.
- Classroom đang ở trạng thái `ACTIVE`.
- Teacher đã publish hoặc assign ít nhất một learning activity.
- Student có quyền truy cập vào activity theo classroom roster và visibility rule.

## Postconditions

Sau khi process hoàn tất một phần hoặc toàn bộ:

- System cập nhật `LearningProgress`.
- System lưu `LessonCompletion`, `QuizAttempt` hoặc `AssignmentSubmission` nếu có.
- Student nhìn thấy trạng thái mới nhất của activity.
- Teacher nhìn thấy dữ liệu mới trên Progress Dashboard hoặc Gradebook.
- System ghi audit/event log cho các hành động quan trọng như submit quiz, submit assignment, grade, feedback.

## Main Flow - Student Học Nội Dung Được Giao

```text
Student login
        ↓
Student mở Student Dashboard
        ↓
System hiển thị Classroom đã tham gia và To-do / Việc cần làm
        ↓
Student chọn Classroom hoặc mở activity trực tiếp từ To-do
        ↓
System hiển thị Stream / Classwork / Learning Modules
        ↓
Student chọn learning activity
        ↓
System kiểm tra quyền truy cập và trạng thái activity
        ↓
Student học lesson / xem resource / làm quiz / nộp assignment
        ↓
System lưu tiến độ hoặc kết quả
        ↓
System cập nhật completion status
        ↓
Teacher xem tiến độ trên Progress Dashboard
```

## Detailed Main Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Student | Login vào hệ thống | Xác thực credentials/JWT session |
| 2 | Student | Mở Student Dashboard | Hiển thị Classroom đang tham gia, To-do list, deadline và activity cần làm |
| 3 | Student | Chọn một Classroom | Kiểm tra enrollment và classroom status |
| 4 | System | Tải Classroom hoặc To-do activity data | Hiển thị Stream, Classwork, Module, Deadline, Progress hoặc activity detail |
| 5 | Student | Chọn lesson/quiz/assignment | Kiểm tra visibility, due date và quyền truy cập |
| 6 | Student | Thực hiện learning activity | Ghi nhận learning event theo loại activity |
| 7 | System | Cập nhật progress | Tính completion, score hoặc submission status |
| 8 | Student | Xem kết quả tạm thời hoặc hoàn tất | Hiển thị status như `IN_PROGRESS`, `COMPLETED`, `SUBMITTED`, `GRADED` |
| 9 | Teacher | Mở Progress Dashboard | Xem Student nào đã hoàn thành, chưa hoàn thành hoặc cần review |

## Subprocess 1 - Học Micro Lesson

### Trigger

Student chọn một `Micro Lesson` trong Classroom.

### Flow

1. Student mở lesson.
2. System kiểm tra lesson đã `PUBLISHED` và Student thuộc Classroom.
3. System hiển thị lesson content, video/resource nếu có, estimated duration và activity requirement.
4. Student đọc/xem nội dung.
5. System ghi nhận `startedAt` nếu là lần đầu mở lesson.
6. Student bấm `Mark As Done` hoặc System tự đánh dấu hoàn thành theo rule.
7. System cập nhật `completionStatus = COMPLETED`.
8. System cập nhật progress tổng của Module/Classroom.
9. Teacher thấy lesson completion trên Progress Dashboard.

### Business Rules

- Student chỉ được học lesson thuộc Classroom mà Student đã enroll.
- Lesson phải ở trạng thái `PUBLISHED` hoặc được assign trực tiếp cho Student.
- Nếu lesson yêu cầu thời lượng tối thiểu, System chỉ cho hoàn thành khi điều kiện được đáp ứng.
- Nếu lesson bị Teacher unpublish, Student không được mở lesson mới nhưng progress cũ vẫn được giữ.

## Subprocess 2 - Làm Quiz

### Trigger

Student chọn quiz được Teacher assign.

### Flow

1. Student mở quiz.
2. System kiểm tra quiz status, classroom enrollment, attempt limit và due date.
3. System hiển thị quiz instruction, số câu hỏi, thời lượng nếu có.
4. Student bắt đầu attempt.
5. System tạo `QuizAttempt` với status `IN_PROGRESS`.
6. Student trả lời câu hỏi.
7. Student submit quiz.
8. System validate attempt.
9. Nếu quiz hỗ trợ auto-grade, System tính score.
10. System cập nhật `QuizAttempt.status = SUBMITTED` hoặc `GRADED`.
11. System cập nhật progress.
12. Student xem score nếu Teacher cấu hình cho phép hiển thị ngay.
13. Teacher xem score trong Gradebook.

### Business Rules

- Quiz chỉ được submit một lần cho mỗi attempt.
- Nếu quiz có `attemptLimit`, Student không được vượt quá số lần cho phép.
- Nếu quá due date, System xử lý theo late submission policy của Teacher/Classroom.
- Câu hỏi tự luận nếu có sẽ cần Teacher review thủ công.
- Score hiển thị cho Student phụ thuộc vào quiz setting.

## Subprocess 3 - Nộp Assignment

### Trigger

Student mở assignment cần nộp.

### Flow

1. Student mở assignment detail.
2. System hiển thị instruction, due date, file policy và rubric nếu có.
3. Student nhập nội dung hoặc upload file.
4. System validate file type, file size và required fields.
5. Student bấm `Submit`.
6. System tạo hoặc cập nhật `AssignmentSubmission`.
7. System gán status `SUBMITTED` hoặc `LATE_SUBMITTED`.
8. Teacher review submission.
9. Teacher nhập grade và feedback.
10. Student xem grade/feedback sau khi Teacher trả kết quả.

### Business Rules

- Student chỉ được submit assignment thuộc Classroom đã enroll.
- Nếu Teacher cho phép resubmit, Student có thể nộp lại trước hoặc sau due date theo policy.
- Nếu assignment đã được Teacher grade, việc resubmit cần theo setting của Teacher.
- File upload phải tuân theo policy của hệ thống.

## Subprocess 4 - Xem Feedback Và Grade

### Trigger

Teacher đã grade hoặc phản hồi bài làm.

### Flow

1. Student mở Grade/Feedback area trong Classroom.
2. System hiển thị danh sách activity đã được grade.
3. Student chọn một quiz/assignment.
4. System hiển thị score, feedback, rubric hoặc comment của Teacher.
5. Student có thể xem trạng thái đã hoàn thành hoặc cần làm lại nếu Teacher yêu cầu.

### Business Rules

- Student chỉ xem được grade/feedback của chính mình.
- Teacher xem được grade/feedback của Student trong Classroom mình quản lý.
- Admin chỉ xem dữ liệu grade ở cấp governance/report nếu được cấp quyền phù hợp.

## Alternative Flows

| Mã | Tình huống | Luồng thay thế |
| --- | --- | --- |
| ALT-001 | Student chưa hoàn thành lesson | System lưu status `IN_PROGRESS` và cho Student tiếp tục sau |
| ALT-002 | Student làm quiz nhưng chưa submit | System giữ `QuizAttempt = IN_PROGRESS` nếu quiz policy cho phép |
| ALT-003 | Student nộp assignment trễ | System đánh dấu `LATE_SUBMITTED` nếu late submission được cho phép |
| ALT-004 | Teacher unpublish activity | Student không thấy activity mới, progress cũ không bị xóa |
| ALT-005 | Student bị remove khỏi Classroom | Student mất quyền truy cập nội dung Classroom sau thời điểm bị remove |
| ALT-006 | Student mở activity từ To-do | System giữ context để Student có thể quay lại To-do sau khi xem/làm activity |

## Exception Flows

| Mã | Tình huống lỗi | Hành vi hệ thống |
| --- | --- | --- |
| EX-001 | Student chưa login | Điều hướng về Login |
| EX-002 | Student chưa enroll Classroom | Từ chối truy cập và hiển thị thông báo không có quyền |
| EX-003 | Classroom đã archived | Không cho thực hiện activity mới, chỉ cho xem dữ liệu nếu policy cho phép |
| EX-004 | Activity không tồn tại | Hiển thị lỗi `Not Found` |
| EX-005 | Activity chưa published | Hiển thị lỗi nội dung chưa khả dụng |
| EX-006 | Quiz attempt đã submit | Không cho submit lại attempt cũ |
| EX-007 | File assignment không hợp lệ | Hiển thị lỗi file type/file size |
| EX-008 | Network/API error | Hiển thị retry message và không ghi nhận completion sai |

## Trạng Thái Learning Activity

| Status | Ý nghĩa |
| --- | --- |
| NOT_STARTED | Student chưa mở activity |
| IN_PROGRESS | Student đã bắt đầu nhưng chưa hoàn thành |
| COMPLETED | Student đã hoàn thành lesson hoặc activity không cần grade |
| SUBMITTED | Student đã nộp quiz/assignment |
| LATE_SUBMITTED | Student nộp sau due date |
| GRADED | Teacher/System đã có score hoặc feedback |
| NEEDS_REVISION | Teacher yêu cầu Student chỉnh sửa hoặc nộp lại |

## Data Outputs

| Dữ liệu | Mô tả |
| --- | --- |
| LearningProgress | Tiến độ tổng của Student theo Classroom/Module/Activity |
| LessonCompletion | Trạng thái hoàn thành lesson |
| QuizAttempt | Lần làm quiz, câu trả lời, score, thời gian submit |
| AssignmentSubmission | Nội dung/file nộp bài, trạng thái, thời gian nộp |
| Grade | Điểm số hoặc đánh giá |
| Feedback | Nhận xét của Teacher |
| ActivityEvent | Event phục vụ analytics và audit |

## UI Touchpoints

| Màn hình | Mục đích |
| --- | --- |
| Student Dashboard | Xem Classroom, To-do / Việc cần làm, deadline và tiến độ tổng |
| Classroom Detail | Xem Stream, Classwork, Members, Grades nếu có |
| Lesson Viewer | Học micro lesson |
| Quiz Attempt Screen | Làm quiz |
| Assignment Submission Screen | Nộp assignment |
| Grade/Feedback Screen | Xem điểm và feedback |
| Teacher Progress Dashboard | Teacher theo dõi tiến độ của từng Student |
| Teacher Gradebook | Teacher xem/chấm điểm activity |

## API Touchpoints

| API Group | Mục đích |
| --- | --- |
| Auth API | Login và xác thực session |
| Classroom API | Lấy Classroom mà Student đã enroll |
| Learning Content API | Lấy lesson, module, resource |
| Progress API | Ghi và đọc learning progress |
| Quiz API | Tạo attempt, submit answer, tính score |
| Assignment API | Submit assignment, upload file, update submission |
| Grade API | Lấy score, feedback và gradebook data |
| Audit/Event API | Ghi event quan trọng |
| Student Dashboard API | Lấy dashboard summary và To-do list của Student |

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| BP001-BR001 | Student chỉ truy cập được Classroom mà Student đã tham gia hợp lệ |
| BP001-BR002 | Student chỉ thấy content đã được Teacher publish hoặc assign |
| BP001-BR003 | Progress phải được tính theo từng Student, từng Classroom và từng activity |
| BP001-BR004 | Quiz attempt sau khi submit không được sửa trực tiếp |
| BP001-BR005 | Assignment submission phải lưu thời điểm nộp để xác định đúng hạn/trễ hạn |
| BP001-BR006 | Teacher có thể xem progress của tất cả Student trong Classroom mình sở hữu hoặc được phân quyền |
| BP001-BR007 | Student chỉ được xem grade và feedback của chính mình |
| BP001-BR008 | System không được mất progress đã ghi nhận khi Teacher chỉnh sửa hoặc unpublish content |
| BP001-BR009 | To-do list trên Student Dashboard phải hiển thị các activity chưa hoàn thành từ tất cả Classroom mà Student đã tham gia |
| BP001-BR010 | Khi Student mở activity từ To-do, hệ thống phải hỗ trợ quay lại To-do hoặc Dashboard bằng điều hướng rõ ràng |

## Acceptance Checkpoints

- Student có thể mở Dashboard và thấy Classroom đã tham gia.
- Student có thể thấy To-do / Việc cần làm trên Dashboard.
- Student có thể mở Lesson, Quiz hoặc Assignment trực tiếp từ To-do.
- Student có thể học một lesson đã publish và progress được cập nhật.
- Student có thể làm quiz và System lưu attempt đúng.
- Student có thể nộp assignment và Teacher thấy submission.
- Teacher có thể xem mức độ hoàn thành của từng Student.
- Student không thể truy cập Classroom hoặc activity không thuộc quyền của mình.
- Các lỗi phổ biến như invalid activity, archived Classroom, expired session được xử lý rõ ràng.

## Ghi Chú Cho DevOps Và QA

- DevOps cần đảm bảo API ghi progress không bị mất dữ liệu khi deploy version mới.
- CI/CD nên chạy test cho các flow chính: lesson completion, quiz submit, assignment submit.
- MongoDB backup cần bao gồm progress, submission, quiz attempt và grade.
- Monitoring nên theo dõi lỗi API liên quan đến `Progress API`, `Quiz API` và `Assignment API` vì đây là các điểm ảnh hưởng trực tiếp đến trải nghiệm học tập.
