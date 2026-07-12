# Google Classroom Reference Requirements

## Mục Đích

Tài liệu này bổ sung requirements dựa trên việc tham khảo nghiệp vụ từ Google Classroom, tập trung vào các workflow Classroom, Stream, Classwork, Assignment, Submission, Grading và Feedback.

## Business Requirements Bổ Sung

| ID | Business Requirement | Giá trị nghiệp vụ | Priority |
| --- | --- | --- | --- |
| BRQ-GC-001 | Hệ thống phải tham khảo workflow Classroom tương tự Google Classroom ở mức nghiệp vụ. | Teacher và Student có trải nghiệm học tập quen thuộc. | Must |
| BRQ-GC-002 | Hệ thống phải có Class Stream để Teacher đăng thông báo và Student theo dõi cập nhật lớp học. | Tăng khả năng giao tiếp trong Classroom. | Must |
| BRQ-GC-003 | Hệ thống phải có Classwork để quản lý Assignment, Material, Quiz và Micro Lesson. | Tập trung toàn bộ hoạt động học tập trong một khu vực. | Must |
| BRQ-GC-004 | Hệ thống phải hỗ trợ Student nộp Submission và Teacher chấm điểm, gửi Feedback. | Hoàn thiện quy trình giao bài, nộp bài và đánh giá. | Must |
| BRQ-GC-005 | Hệ thống phải có People/Roster để Teacher xem và quản lý Student trong Classroom. | Hỗ trợ quản lý lớp học nội bộ. | Must |
| BRQ-GC-006 | Hệ thống phải có Grades/Progress để theo dõi điểm, trạng thái nộp bài và mức độ hoàn thành. | Hỗ trợ Teacher đánh giá kết quả học tập. | Should |

## Functional Requirements Bổ Sung

| ID | Functional Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| FR-GC-001 | Teacher có thể đăng Announcement/Post lên Class Stream. | Must | Student trong Classroom xem được bài đăng mới. |
| FR-GC-002 | Teacher có thể tạo Assignment trong Classwork. | Must | Assignment có title, instruction, due date và attachment nếu có. |
| FR-GC-003 | Teacher có thể tạo Material trong Classwork. | Should | Student có thể mở và xem Material. |
| FR-GC-004 | Teacher có thể tạo Quiz hoặc Micro Lesson trong Classwork. | Must | Student nhìn thấy item được giao trong Classroom. |
| FR-GC-005 | Student có thể nộp Submission cho Assignment. | Must | Submission được lưu với trạng thái submitted và thời điểm nộp. |
| FR-GC-006 | Teacher có thể xem danh sách Submission theo Assignment. | Must | Teacher xem được trạng thái submitted, missing, returned. |
| FR-GC-007 | Teacher có thể chấm điểm Submission. | Must | Grade được lưu và liên kết với Student, Assignment, Submission. |
| FR-GC-008 | Teacher có thể gửi Feedback cho Submission. | Must | Student xem được Feedback sau khi Teacher trả kết quả. |
| FR-GC-009 | Student có thể xem Grade và Feedback. | Must | Grade và Feedback hiển thị trong Assignment detail. |
| FR-GC-010 | Teacher có thể xem Grades/Progress theo Classroom. | Should | Bảng tổng hợp hiển thị theo Student và Classwork item. |
