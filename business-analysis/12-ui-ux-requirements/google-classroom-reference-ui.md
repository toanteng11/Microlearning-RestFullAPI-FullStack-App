# Google Classroom Reference UI Notes

## Mục Đích

Tài liệu này ghi nhận các điểm tham khảo từ Google Classroom ở mức nghiệp vụ và tổ chức workflow. Dự án **Microlearning Classroom LMS Platform** không phải phiên bản sao chép của Google Classroom, không sao chép thương hiệu, layout chi tiết, màu sắc hoặc UI identity của Google.

Điểm cần học hỏi là cách một LMS classroom-oriented tổ chức:

- Classroom list.
- Stream/announcement.
- Classwork.
- People/roster.
- Grades/progress.
- Assignment detail.
- Submission/feedback.

## Nguyên Tắc Tham Khảo

| Nguyên tắc | Ý nghĩa |
| --- | --- |
| Tham khảo workflow | Có thể học cách chia khu vực chức năng quen thuộc để user dễ hiểu. |
| Không copy visual identity | Không sao chép màu sắc, logo, icon, spacing hoặc layout nhận diện của Google Classroom. |
| Điều chỉnh theo microlearning | Hệ thống cần nhấn mạnh Lesson ngắn, Quiz, Flashcard, deadline và To-do. |
| Điều chỉnh theo LMS nội bộ | Admin có vai trò vận hành rõ hơn Google Classroom thông thường. |
| Manual Teacher Invitation | Admin tạo link và tự gửi thủ công, không phụ thuộc Gmail. |

## Mapping Từ Google Classroom Sang Dự Án

| Google Classroom concept | Dự án này dùng | Ghi chú |
| --- | --- | --- |
| Class | Classroom | Không gian học do Teacher tạo, Student tham gia bằng Code/Link. |
| Stream | Classroom Stream / Announcements | Dùng cho thông báo và hoạt động mới. |
| Classwork | Course Content / Classwork | Chứa Micro Lesson, Quiz, Assignment, Resource. |
| People | Classroom Roster | Teacher xem Student list, Admin có thể governance ở cấp hệ thống. |
| Grades | Gradebook / Progress | Teacher xem grade, submission status và progress ranking. |
| Assignment | Assignment | Student nộp bài, Teacher chấm điểm và feedback. |
| Material | Resource | Tài liệu học, file, link hoặc media. |
| Topic | Module/Topic | Nhóm bài học trong Course. |

## Màn Hình Tham Khảo Theo Role

| Screen tham khảo | Role | Cách áp dụng trong dự án |
| --- | --- | --- |
| Classroom List | Student, Teacher | Hiển thị Classroom đã tham gia hoặc đang dạy. |
| Classroom Stream | Student, Teacher | Hiển thị announcements và hoạt động mới. |
| Classroom Classwork | Student, Teacher | Hiển thị Lesson, Quiz, Assignment, Resource theo module/topic. |
| Classroom People | Teacher | Hiển thị roster Student trong Classroom. |
| Classroom Grades | Teacher | Hiển thị Gradebook và Student progress. |
| Assignment Detail | Student, Teacher | Student xem/nộp bài; Teacher xem instruction/submission. |
| Submission Page | Student | Student upload/nộp bài và xem trạng thái. |
| Grade And Feedback Page | Student, Teacher | Student xem feedback; Teacher chấm điểm và trả bài. |

## Navigation Gợi Ý Trong Classroom

```text
Stream | Classwork | People | Grades
```

Điều chỉnh theo role:

| Role | Tab nên thấy |
| --- | --- |
| Student | Stream, Classwork, Grades cá nhân nếu phù hợp. |
| Teacher | Stream, Classwork, People, Grades. |
| Admin | Không dùng tab classroom thường ngày làm mặc định; Admin dùng governance views riêng. |

## Điểm Cần Bổ Sung Riêng Cho Microlearning

Google Classroom không phải lúc nào cũng nhấn mạnh microlearning flow. Dự án này cần bổ sung:

- Student To-do nằm ngay trên Dashboard.
- Lesson ngắn có progress/completion rõ.
- Flashcard trong lesson nếu cần.
- Quiz Builder có optional image/video trong câu hỏi.
- Teacher Course Detail Dashboard có Student Progress Ranking.
- Deadline cho từng Lesson/Quiz/Assignment.
- Admin Teacher Invitation manual copy link.
- Admin User Management tách Student List, Teacher List, Admin List.

## UI Ghi Chú Cho Dev

- Dùng tab hoặc navigation trong Classroom để user dễ định vị.
- Không đưa quá nhiều chức năng Admin vào màn hình Classroom của Teacher/Student.
- Teacher cần thấy nhanh các action: Add Lesson, Add Quiz, Add Assignment, View Roster, View Progress.
- Student cần thấy nhanh action: Start, Continue, Submit, Review.
- Các trạng thái như Missing, Late, Submitted, Graded, Returned phải hiển thị rõ bằng text và badge.

## Acceptance Criteria

- Tài liệu UI có thể tham khảo workflow Google Classroom nhưng không mô tả sản phẩm là clone.
- Classroom Detail có tổ chức nội dung quen thuộc: Stream/Classwork/People/Grades hoặc biến thể tương đương.
- Student Dashboard vẫn ưu tiên To-do và microlearning tasks, không chỉ là Classroom list.
- Teacher Course Dashboard có progress ranking và deadline theo activity.
- Admin có workspace riêng cho governance, invitation, user management và reports.
