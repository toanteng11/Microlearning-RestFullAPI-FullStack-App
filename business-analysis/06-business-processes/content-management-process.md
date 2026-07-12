# Content Management Process

## Mục Đích

Tài liệu này mô tả quy trình **Teacher tạo và quản lý nội dung học tập** trong hệ thống **Microlearning Classroom LMS Platform**. Đây là process cốt lõi giúp Teacher biến một Classroom thành không gian học tập có cấu trúc, gồm micro lesson, quiz, assignment, resource và feedback.

Nội dung trong hệ thống cần phục vụ mô hình microlearning:

- Bài học ngắn, tập trung vào một mục tiêu học tập cụ thể.
- Nội dung dễ publish, chỉnh sửa và assign cho Classroom.
- Student có thể học nhanh, làm quiz ngắn và nhận feedback.
- Teacher có thể theo dõi tiến độ từng Student và toàn bộ Classroom.

## Process Summary

| Thuộc tính | Giá trị |
| --- | --- |
| Process ID | BP-004 |
| Process Name | Content Management Process |
| Process Owner | Teacher |
| Supporting Actors | Student, System, Admin |
| Trigger | Teacher muốn tạo hoặc cập nhật nội dung học tập |
| Priority | Must Have |
| Frequency | Theo kế hoạch giảng dạy của Teacher |
| Input | Classroom, learning objective, lesson content, quiz/assignment data |
| Output | Published content, assigned activities, progress data, gradebook records |

## Phạm Vi

### In Scope

- Teacher tạo Classroom.
- Teacher cấu hình thông tin Classroom, visibility, join methods và basic settings.
- Teacher tạo learning module/topic.
- Teacher tạo micro lesson.
- Teacher tạo quiz với câu hỏi và đáp án.
- Teacher có thể tùy chọn thêm image/video vào quiz question nếu cần minh họa.
- Teacher tạo assignment với deadline, instruction và file policy.
- Teacher upload hoặc liên kết learning resource.
- Teacher publish, unpublish, schedule hoặc archive content.
- Teacher assign content cho toàn bộ Classroom.
- Teacher mở Course Detail Dashboard để xem tất cả bài học đã tạo, danh sách Student và progress ranking.
- Teacher xem progress, submission, score và feedback.

### Out Of Scope Cho MVP

- Marketplace bán nội dung.
- Content approval workflow nhiều cấp.
- AI sinh nội dung tự động.
- SCORM/xAPI import nâng cao.
- Collaborative authoring real-time.
- Versioning phức tạp như enterprise CMS.

## Actor Và Trách Nhiệm

| Actor | Trách nhiệm |
| --- | --- |
| Teacher | Tạo Classroom, tạo nội dung, publish activity, giao bài, chấm điểm và feedback |
| Student | Truy cập nội dung đã publish/assign và thực hiện learning activities |
| System | Lưu content, validate quyền, publish/unpublish, tính progress và cung cấp API |
| Admin | Quản trị policy, hỗ trợ governance, chỉ can thiệp nội dung khi có quyền override |

## Preconditions

- Teacher có account `ACTIVE`.
- Teacher có role `TEACHER`.
- Teacher đã login thành công.
- Teacher có quyền tạo hoặc quản lý Classroom.
- Nếu Teacher chỉnh sửa Classroom có sẵn, Teacher phải là owner/co-teacher hoặc được cấp quyền.
- File upload policy, size limit và allowed types đã được cấu hình nếu có upload resource.

## Postconditions

Sau khi process hoàn tất:

- Classroom, Module, Lesson, Quiz, Assignment hoặc Resource được tạo/cập nhật.
- Content có trạng thái rõ ràng như `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`.
- Student thấy nội dung nếu content đã publish và Student thuộc Classroom.
- System có dữ liệu để tính progress, gradebook và reports.
- Audit log được ghi cho các hành động quan trọng như publish, unpublish, delete, archive.

## Main Flow Tổng Quát

```text
Teacher login
        ↓
Teacher tạo hoặc chọn Classroom
        ↓
Teacher tạo learning module/topic
        ↓
Teacher tạo micro lesson / quiz / assignment / resource
        ↓
System lưu nội dung ở trạng thái DRAFT
        ↓
Teacher review nội dung
        ↓
Teacher publish hoặc schedule nội dung
        ↓
Student truy cập nội dung
        ↓
System ghi nhận progress/submission/score
        ↓
Teacher mở Course Detail Dashboard
        ↓
Teacher xem lessons, student list, progress ranking và deadline
```

## Subprocess 1 - Tạo Classroom

### Trigger

Teacher muốn mở một lớp học mới.

### Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Teacher | Mở Teacher Dashboard | Hiển thị danh sách Classroom |
| 2 | Teacher | Chọn `Create Classroom` | Hiển thị form tạo Classroom |
| 3 | Teacher | Nhập tên lớp, mô tả, môn học/nhóm học nếu có | Validate required fields |
| 4 | Teacher | Lưu Classroom | Tạo Classroom với `Status = ACTIVE` hoặc `DRAFT` theo thiết kế |
| 5 | System | Sinh Class Code mặc định nếu policy cho phép | Class Code sẵn sàng để Teacher copy |
| 6 | Teacher | Cấu hình join methods | Bật/tắt Class Code và Invite Link |
| 7 | System | Lưu settings | Classroom sẵn sàng nhận Student |

### Business Rules

- Teacher là owner mặc định của Classroom do mình tạo.
- Classroom phải có tên hợp lệ.
- Teacher chỉ thấy Classroom mình sở hữu, được mời làm co-teacher hoặc được Admin cấp quyền.
- Admin có thể archive/transfer ownership trong trường hợp governance/offboarding.

## Subprocess 2 - Tạo Module Hoặc Topic

### Trigger

Teacher muốn tổ chức nội dung theo chủ đề hoặc lộ trình.

### Flow

1. Teacher mở Classroom.
2. Teacher chọn `Classwork` hoặc `Learning Modules`.
3. Teacher tạo module/topic mới.
4. Teacher nhập title, description, order và learning objective.
5. System lưu module/topic ở trạng thái active.
6. Teacher thêm lesson, quiz, assignment hoặc resource vào module/topic.

### Business Rules

- Module/topic thuộc về một Classroom.
- Module/topic có thể có thứ tự hiển thị.
- Student chỉ thấy module/topic khi có ít nhất một content được publish hoặc module được set visible.

## Subprocess 3 - Tạo Micro Lesson

### Trigger

Teacher muốn tạo bài học ngắn cho Student.

### Flow

| Step | Actor | Hành động | System Response |
| --- | --- | --- | --- |
| 1 | Teacher | Chọn `Create Lesson` | Hiển thị lesson editor |
| 2 | Teacher | Nhập title, objective, estimated duration | Validate required fields |
| 3 | Teacher | Thêm nội dung text/video/link/resource | Lưu content block |
| 4 | Teacher | Chọn module/topic | Gắn lesson vào cấu trúc học |
| 5 | Teacher | Save Draft | Lesson có `Status = DRAFT` |
| 6 | Teacher | Preview lesson | Hiển thị như Student sẽ thấy |
| 7 | Teacher | Publish lesson | Lesson có `Status = PUBLISHED` |
| 8 | System | Cập nhật visibility | Student trong Classroom có thể truy cập |

### Business Rules

- Lesson phải có title và nội dung tối thiểu trước khi publish.
- Lesson có thể có `completionDeadline` riêng để Student biết hạn hoàn thành.
- Nếu Lesson có deadline, deadline phải hiển thị trong Student To-do và Course Dashboard.
- Lesson có thể lưu draft nhiều lần trước khi publish.
- Khi Teacher chỉnh sửa lesson đã publish, cần xác định rule: cập nhật trực tiếp hoặc tạo version mới sau MVP.
- Unpublish lesson không được xóa progress đã ghi nhận.

## Subprocess 3A - Mở Course Detail Dashboard

### Trigger

Teacher bấm vào một Course do mình quản lý.

### Flow

1. Teacher mở Teacher Dashboard hoặc Classroom Detail.
2. Teacher chọn một Course.
3. System kiểm tra Teacher có quyền quản lý Course.
4. System tải Course summary.
5. System hiển thị tất cả Lesson/Activity Teacher đã tạo trong Course.
6. System hiển thị Student list có quyền học Course.
7. System tính hoặc lấy Course progress của từng Student.
8. System hiển thị bảng Student Progress Ranking, mặc định sort `processScore DESC`.
9. Teacher có thể mở từng Lesson, chỉnh deadline, xem Student detail hoặc mở Gradebook.

### Dashboard Cần Hiển Thị

| Khu vực | Nội dung |
| --- | --- |
| Course Summary | Course title, Classroom, status, total lessons, total students, average progress |
| Lesson List | Tất cả Lesson/Activity theo Module/Topic, status, deadline, completion count |
| Student List | Student có quyền học Course |
| Student Progress Ranking | Điểm quá trình, progress percentage, completed lessons, missing/late item |
| Quick Actions | Add Lesson, Edit Deadline, View Student Detail, View Gradebook |

### Business Rules

- Course Dashboard chỉ hiển thị cho Teacher sở hữu Course, co-teacher được phân quyền hoặc Admin có quyền governance.
- Student list mặc định lấy từ classroom roster.
- Nếu Course chỉ được assign cho selected Students, Student list chỉ hiển thị selected Students.
- Student Progress Ranking mặc định sắp xếp `processScore DESC`.
- Course Dashboard phải hiển thị các Lesson ở cả trạng thái `DRAFT`, `PUBLISHED`, `SCHEDULED`, `UNPUBLISHED` cho Teacher; Student chỉ thấy item được publish/assign.

## Subprocess 4 - Tạo Quiz

### Trigger

Teacher muốn kiểm tra nhanh mức độ hiểu bài của Student.

### Flow

1. Teacher chọn `Create Quiz`.
2. Teacher nhập title, instruction, total points, due date nếu có.
3. Teacher thêm câu hỏi.
4. Teacher tùy chọn thêm image hoặc video vào câu hỏi nếu cần minh họa.
5. Teacher preview câu hỏi để kiểm tra media hiển thị đúng.
6. Teacher cấu hình đáp án đúng nếu câu hỏi auto-grade.
7. Teacher cấu hình attempt limit, show score policy và time limit nếu có.
8. System validate quiz có ít nhất một câu hỏi hợp lệ.
9. Teacher save draft.
10. Teacher preview quiz.
11. Teacher publish/assign quiz cho Classroom.
12. Student làm quiz và xem media trong câu hỏi nếu có.
13. System lưu attempt và score.
14. Teacher xem kết quả trong Gradebook.

### Business Rules

- Quiz phải có ít nhất một question trước khi publish.
- Nếu question auto-grade, phải có đáp án đúng hoặc scoring rule.
- Image/video trong question là tùy chọn, không bắt buộc.
- Media trong question phải tuân theo file upload policy, allowed type và max size.
- Attempt limit phải rõ ràng.
- Show score policy quyết định Student có thấy score ngay hay chờ Teacher review.

## Subprocess 5 - Tạo Assignment

### Trigger

Teacher muốn giao bài cần Student nộp sản phẩm hoặc câu trả lời.

### Flow

1. Teacher chọn `Create Assignment`.
2. Teacher nhập title, instruction, due date, points và rubric nếu có.
3. Teacher chọn submission type: text, file, link hoặc mixed nếu hệ thống hỗ trợ.
4. Teacher cấu hình file policy nếu cho upload.
5. Teacher save draft.
6. Teacher preview assignment.
7. Teacher publish/assign assignment.
8. Student nộp bài.
9. Teacher review submission.
10. Teacher nhập grade và feedback.

### Business Rules

- Assignment phải có instruction rõ ràng trước khi publish.
- Due date là optional nhưng nên có để hỗ trợ progress dashboard.
- Nếu cho upload file, file phải tuân theo size/type policy.
- Teacher có thể cho phép hoặc không cho phép resubmission.

## Subprocess 6 - Quản Lý Resource

### Trigger

Teacher muốn cung cấp tài liệu tham khảo cho Student.

### Flow

1. Teacher chọn `Add Resource`.
2. Teacher upload file hoặc nhập external link.
3. System validate file/link.
4. Teacher đặt title, description và module/topic.
5. Teacher publish resource.
6. Student mở resource trong Classroom.

### Business Rules

- Resource phải thuộc Classroom hoặc module/topic cụ thể.
- File upload phải tuân theo policy.
- External link cần validate URL format.
- Nếu resource bị delete/unpublish, Student không thấy resource mới nhưng activity history vẫn được giữ nếu cần audit.

## Content Lifecycle

| Status | Ý nghĩa |
| --- | --- |
| DRAFT | Nội dung đang soạn, Student chưa thấy |
| SCHEDULED | Nội dung đã lên lịch publish |
| PUBLISHED | Nội dung đang hiển thị cho Student |
| UNPUBLISHED | Nội dung tạm ẩn khỏi Student |
| ARCHIVED | Nội dung không còn active nhưng giữ lịch sử |
| DELETED | Nội dung bị xóa mềm hoặc xóa theo policy |

## Alternative Flows

| Mã | Tình huống | Luồng thay thế |
| --- | --- | --- |
| ALT-001 | Teacher lưu draft | Content được lưu nhưng Student chưa thấy |
| ALT-002 | Teacher schedule publish | Content tự publish theo thời gian cấu hình nếu hệ thống hỗ trợ |
| ALT-003 | Teacher unpublish content | Student không còn thấy content, progress cũ giữ nguyên |
| ALT-004 | Teacher duplicate lesson/quiz | System tạo bản sao để Teacher chỉnh sửa nhanh |
| ALT-005 | Teacher chuyển ownership Classroom | Admin hỗ trợ transfer ownership nếu Teacher nghỉ dạy |

## Exception Flows

| Mã | Tình huống lỗi | Hành vi hệ thống |
| --- | --- | --- |
| EX-001 | Teacher không có quyền Classroom | Từ chối truy cập hoặc chỉnh sửa |
| EX-002 | Thiếu required field | Hiển thị lỗi validation |
| EX-003 | Quiz không có question | Không cho publish |
| EX-004 | Assignment thiếu instruction | Không cho publish |
| EX-005 | File upload quá dung lượng | Từ chối upload và hiển thị lỗi |
| EX-006 | File type không được phép | Từ chối upload |
| EX-007 | Content đang được Student làm | Cảnh báo trước khi unpublish/archive |
| EX-008 | API/network error khi save | Không mất dữ liệu đang nhập nếu có autosave/draft support |

## Data Outputs

| Dữ liệu | Mô tả |
| --- | --- |
| Classroom | Lớp học do Teacher tạo |
| ClassroomSettings | Cấu hình join method, visibility và policy |
| Module/Topic | Nhóm nội dung học tập |
| Lesson | Micro lesson |
| Quiz | Bài kiểm tra ngắn |
| Question | Câu hỏi trong quiz |
| QuestionMedia | Image/video tùy chọn gắn với câu hỏi |
| Assignment | Bài tập Teacher giao |
| Resource | Tài liệu hoặc link tham khảo |
| GradebookRecord | Điểm số và trạng thái đánh giá |
| CourseProgressSummary | Điểm quá trình và progress tổng hợp theo từng Student trong Course |
| ContentAuditLog | Log publish/unpublish/archive/delete |

## UI Touchpoints

| Màn hình | Mục đích |
| --- | --- |
| Teacher Dashboard | Xem và tạo Classroom |
| Teacher Course Detail Dashboard | Xem lessons, student list, progress ranking và deadline của Course |
| Classroom Settings | Cấu hình tên lớp, join methods và policy |
| Classwork/Learning Modules | Quản lý module, lesson, quiz, assignment |
| Lesson Editor | Soạn micro lesson |
| Quiz Builder | Tạo câu hỏi và scoring rule |
| Assignment Editor | Giao bài và cấu hình submission |
| Resource Manager | Upload hoặc quản lý tài liệu |
| Preview Mode | Teacher xem nội dung như Student |
| Progress Dashboard | Theo dõi mức độ hoàn thành |
| Gradebook | Chấm điểm và feedback |

## API Touchpoints

| API Group | Mục đích |
| --- | --- |
| Classroom API | Tạo/cập nhật/archive Classroom |
| Classroom Settings API | Quản lý join methods và settings |
| Module API | Tạo/cập nhật module/topic |
| Lesson API | Tạo/cập nhật/publish lesson |
| Quiz API | Tạo quiz, question, answer, scoring rule |
| Assignment API | Tạo assignment và submission policy |
| Resource API | Upload file hoặc lưu external link |
| Progress API | Cập nhật completion khi Student học |
| Teacher Course Dashboard API | Lấy Course summary, lessons, student list và progress ranking |
| Gradebook API | Lấy submission, score và feedback |
| Audit API | Ghi log hành động nội dung quan trọng |

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| BP004-BR001 | Teacher là actor chính tạo và quản lý learning content |
| BP004-BR002 | Admin không chỉnh sửa nội dung học tập thường ngày, chỉ can thiệp khi có governance/override permission |
| BP004-BR003 | Content ở trạng thái `DRAFT` không hiển thị cho Student |
| BP004-BR004 | Content phải đạt điều kiện tối thiểu trước khi publish |
| BP004-BR005 | Unpublish/archive content không được xóa learning progress đã ghi nhận |
| BP004-BR006 | Teacher chỉ xem/chấm submission thuộc Classroom mình quản lý |
| BP004-BR007 | File/resource phải tuân theo upload policy |
| BP004-BR008 | Publish/unpublish/delete/archive content phải được audit |
| BP004-BR009 | Question media là optional; câu hỏi không có image/video vẫn hợp lệ nếu đủ nội dung và đáp án/scoring rule |
| BP004-BR010 | Student chỉ xem được media của Quiz Question nếu Student có quyền truy cập Quiz đó |
| BP004-BR011 | Khi Teacher mở Course, dashboard phải hiển thị toàn bộ Lesson/Activity Teacher đã tạo trong Course |
| BP004-BR012 | Bảng progress trong Course mặc định sắp xếp Student theo `processScore DESC` |
| BP004-BR013 | Lesson/Activity có deadline phải hiển thị trong Course Dashboard và Student To-do/Deadline View |

## Acceptance Checkpoints

- Teacher tạo được Classroom mới.
- Teacher bật/tắt được Class Code và Invite Link theo policy.
- Teacher tạo được lesson draft và publish cho Student.
- Teacher có thể đặt deadline hoàn thành cho từng Lesson.
- Teacher mở Course Detail Dashboard và thấy tất cả Lesson/Activity đã tạo.
- Teacher xem được Student Progress Ranking mặc định từ điểm cao xuống thấp.
- Teacher tạo được quiz có câu hỏi hợp lệ.
- Teacher có thể thêm image/video tùy chọn vào Quiz Question và preview trước khi publish.
- Teacher tạo được assignment có instruction và due date.
- Student chỉ thấy content đã publish/assign.
- Teacher xem được progress sau khi Student học.
- Teacher chấm được assignment và gửi feedback.
- Content unpublish không làm mất progress cũ.

## Ghi Chú Cho DevOps Và QA

- CI/CD nên có test cho create/update/publish/unpublish content.
- Upload resource cần kiểm tra giới hạn file trong cả local Docker và Cloud environment.
- MongoDB backup cần bao gồm Classroom, content, question, submission, grade và progress.
- Monitoring nên theo dõi lỗi save/publish vì lỗi tại đây ảnh hưởng trực tiếp đến khả năng Teacher giảng dạy.
