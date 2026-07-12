# Google Classroom Reference

## Mục Đích

Tài liệu này mô tả cách sử dụng Google Classroom như một nguồn **tham khảo nghiệp vụ và chức năng** cho **Microlearning Classroom LMS Platform**.

Google Classroom được dùng để học hỏi workflow quen thuộc trong môi trường lớp học số. Tuy nhiên, sản phẩm của dự án không phải bản sao Google Classroom, không sao chép thương hiệu, logo, giao diện độc quyền hoặc wording nhận diện. Dự án chọn lọc các nghiệp vụ phù hợp và điều chỉnh theo định hướng microlearning, RESTful API, Docker, CI/CD và Cloud deployment.

## Nguyên Tắc Tham Khảo

| Nguyên tắc | Ý nghĩa |
| --- | --- |
| Reference, not clone | Chỉ tham khảo workflow, không sao chép sản phẩm |
| Business workflow focus | Tập trung vào Classroom, Stream, Classwork, Roster, Submission, Grade, Feedback |
| Product identity riêng | Sản phẩm có tên, UI, scope và cách triển khai riêng |
| Microlearning adaptation | Điều chỉnh workflow để phù hợp Lesson ngắn, Flashcard, Mini Quiz |
| API-first implementation | Mọi workflow phải được thiết kế thành RESTful API rõ ràng |
| Admin governance | Bổ sung năng lực quản trị phù hợp hệ thống nội bộ |

## Reference Modules

| Google Classroom concept | Ý nghĩa tham khảo | Mapping trong dự án |
| --- | --- | --- |
| Classroom | Không gian lớp học do Teacher quản lý | Classroom |
| Stream | Bảng tin lớp, announcement, activity | Class Stream / Announcement |
| Classwork | Nơi đăng Assignment, Material, Question, Quiz | Classwork / Course Content |
| People | Danh sách Teacher, Student | Roster / Enrollment |
| Grades | Điểm và trạng thái bài làm | Gradebook / Progress |
| Assignment | Bài tập có hướng dẫn, deadline, điểm | Assignment |
| Submission | Bài Student nộp | Submission |
| Feedback | Nhận xét riêng hoặc phản hồi bài làm | Feedback |
| Class Code / Invite | Cơ chế tham gia lớp | Class Code và Invite Link |
| Admin Console | Quản trị user, access, report, audit | Admin Dashboard / System Settings |

## Workflow Được Tham Khảo

### Teacher-led Classroom Workflow

```text
Teacher tạo Classroom
        ↓
System sinh Class Code / Invite Link
        ↓
Student tham gia Classroom
        ↓
Teacher đăng Announcement và Classwork
        ↓
Student học, làm Quiz hoặc nộp Assignment
        ↓
Teacher chấm điểm và Feedback
        ↓
Student xem Grade và Progress
```

### Admin Governance Workflow

```text
Admin quản lý users và roles
        ↓
Admin cấu hình platform policies
        ↓
Teacher vận hành Classroom
        ↓
Admin xem reports và audit log
        ↓
Admin xử lý support/offboarding khi cần
```

## Chức Năng Nên Tham Khảo

| Nhóm | Chức năng nên tham khảo | Áp dụng trong dự án |
| --- | --- | --- |
| Classroom | Create, update, archive class | Must |
| Join | Class Code và Invite Link | Must |
| Stream | Announcement, comment permission | Must/Should |
| Classwork | Assignment, Material, Quiz, Topic | Must |
| Roster | Student list, remove Student | Must |
| Submission | Turn in, unsubmit, resubmit, status | Must |
| Grading | Grade, return work, feedback | Must |
| Progress | View grades, submission status, completion | Must |
| Admin | User, role, report, audit, policy | Must/Should |

## Chức Năng Cần Điều Chỉnh Cho Microlearning

| Google Classroom hướng chung | Điều chỉnh trong dự án |
| --- | --- |
| Material hoặc Assignment có thể dài | Tách thành Micro Lesson ngắn |
| Quiz Assignment | Mini Quiz gắn với Lesson hoặc Module |
| Topic | Module/Topic có completion tracking |
| Gradebook | Kết hợp Gradebook với Learning Progress |
| Stream hoạt động rộng | Giữ Stream gọn, ưu tiên Announcement và activity quan trọng |
| Classroom Admin phụ thuộc Google Workspace | Admin trong dự án quản lý users, roles, policies, reports và audit log riêng |

## Chức Năng Không Nên Sao Chép Vào MVP

| Chức năng | Lý do |
| --- | --- |
| Full Google Drive integration | Tăng độ phức tạp và phụ thuộc bên thứ ba |
| Google Meet integration sâu | Không phải trọng tâm microlearning MVP |
| Guardian summaries | Không phù hợp đối tượng chính Teacher/Student |
| SIS integration | Cần hệ thống ngoài và mapping dữ liệu phức tạp |
| Originality reports đầy đủ | Cần provider hoặc AI/plagiarism engine |
| Add-ons marketplace | Không cần cho hệ thống nội bộ giai đoạn đầu |
| Gemini/NotebookLM features | Nên để AI release sau khi core data ổn định |

## Product Boundary

Sản phẩm được phép tham khảo:

- Cách tổ chức Classroom.
- Cách phân vùng Stream, Classwork, People/Roster, Grades.
- Cách xử lý Assignment, Submission, Feedback.
- Cách dùng Class Code/Invite Link để join.
- Cách Admin kiểm soát user, access, report và audit.

Sản phẩm không được:

- Sao chép logo, màu sắc, visual identity hoặc UI layout độc quyền.
- Định vị là Google Classroom clone.
- Dùng wording gây hiểu nhầm là sản phẩm thuộc Google.
- Phụ thuộc vào Google services nếu requirement MVP không yêu cầu.

## Mapping Sang Module Của Dự Án

| Module dự án | Vai trò trong vision | Reference liên quan |
| --- | --- | --- |
| Authentication | Login, register, invitation activation | Google account access ở mức ý tưởng |
| User Management | Admin quản lý Teacher/Student/Admin | Google Workspace Admin |
| Classroom | Không gian lớp học trung tâm | Classroom |
| Enrollment | Student join bằng code/link | Invite students, class code |
| Class Stream | Announcement và activity | Stream |
| Course Content | Module, Lesson, Flashcard, Quiz, Assignment, Resource | Classwork |
| Assignment Submission | Student nộp bài, Teacher review | Assignment/Student work |
| Grading and Feedback | Chấm điểm, return work, feedback | Grades/Feedback |
| Progress Tracking | Completion, score, status | Grades/Progress |
| Admin Governance | Policy, report, audit, configuration | Admin Console |

## Reference-driven Requirements

| Requirement direction | Ý nghĩa |
| --- | --- |
| Classroom phải là entity trung tâm | Course, Enrollment, Classwork và Progress đều cần liên kết Classroom |
| Join flow phải có validation | Mã sai hoặc link hết hạn/không hợp lệ phải có error rõ |
| Teacher phải thấy Roster | Teacher cần quản lý Student trong Classroom |
| Classwork phải có cấu trúc | Module/Topic giúp nội dung không bị lộn xộn |
| Submission phải có status | assigned, submitted, late, graded, returned |
| Feedback phải riêng tư khi cần | Student chỉ xem feedback của mình |
| Progress phải đo được | Lesson completion, quiz attempt, assignment status |
| Admin actions phải audit được | Đổi role, khóa account, chuyển ownership, update setting |

## Điểm Khác Biệt Của Dự Án

| Điểm khác biệt | Mô tả |
| --- | --- |
| Microlearning là trọng tâm | Lesson ngắn, Flashcard, Mini Quiz và Progress rõ |
| API-first | Backend thiết kế như sản phẩm RESTful API có Swagger |
| DevOps-ready | Docker, CI/CD và Cloud deployment là một phần vision |
| Admin governance riêng | Không phụ thuộc Google Admin Console |
| Data model riêng | MongoDB model cho Classroom, Progress, Submission, AuditLog |

## Kết Luận

Google Classroom là nguồn tham khảo tốt cho workflow lớp học số vì nó có mô hình Classroom đơn giản, quen thuộc và dễ hiểu. Tuy nhiên, **Microlearning Classroom LMS Platform** cần giữ bản sắc riêng:

- Lấy microlearning làm trọng tâm.
- Thiết kế API và data model riêng.
- Có Admin governance phù hợp hệ thống nội bộ.
- Có DevOps và Cloud readiness.
- Không sao chép thương hiệu hoặc UI của Google Classroom.

Tài liệu này nên được dùng như một ranh giới sản phẩm: học từ workflow tốt, nhưng xây dựng một sản phẩm độc lập, có giá trị riêng và phù hợp với mục tiêu đồ án.
