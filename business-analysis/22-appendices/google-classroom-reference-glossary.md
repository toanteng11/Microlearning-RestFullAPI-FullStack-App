# Google Classroom Reference Glossary

## Mục Đích Và Boundary

Google Classroom là nguồn tham khảo workflow/chức năng để thiết kế trải nghiệm Classroom LMS dễ hiểu. Dự án **Microlearning Classroom LMS Platform** không phải clone, không tích hợp Google Classroom API trong MVP và không sao chép brand, logo, UI độc quyền, template hoặc nội dung của Google.

Thuật ngữ trong bảng dưới được dùng để hiểu mô hình nghiệp vụ; implementation phải dùng scope, role, Business Rules và UI/API/Data requirements của dự án.

## Thuật Ngữ Và Mapping

| Google Classroom reference term | Ý nghĩa workflow tham khảo | Mapping trong dự án | Boundary / khác biệt |
| --- | --- | --- | --- |
| Classroom | Không gian tổ chức lớp, thành viên và hoạt động. | `Classroom` do Teacher quản lý, có settings/roster/Course scope. | Không dùng Google account/classroom integration mặc định. |
| Class Code | Mã để member tham gia lớp. | `Class Code` join method, subject to system/Classroom policy. | Cần active state, uniqueness và server validation theo BR. |
| Class Link | Link để tham gia lớp. | `Invite Link` cho Student Classroom join. | Không tự cấp access; policy/expiry/enrollment validation áp dụng. |
| Class Stream | Announcement và activity feed của lớp. | `Class Stream` / Announcement basic. | MVP chỉ cần announcement basic, không sao chép interaction/reaction UI. |
| Classwork | Khu vực tổ chức việc học. | Course/Module/Lesson/Quiz/Assignment/Resource scope. | Microlearning bổ sung Lesson/Flashcard/To-do/deadline logic riêng. |
| Topic | Nhóm nội dung Classwork. | `Module / Topic` với `displayOrder`. | Data model/visibility theo project content lifecycle. |
| Assignment | Bài tập có due date và submission. | `Assignment`, `Submission`, grade/feedback. | Late/resubmit/return/private scope theo BR-089 đến BR-096. |
| Quiz Assignment | Bài kiểm tra/quiz gắn lớp. | `Quiz` với Question, Attempt, auto/manual grading. | Không phụ thuộc Google Forms; optional question media cần policy riêng. |
| Material | Tài liệu không yêu cầu nộp bài. | Learning Resource/Material nếu feature được approved. | Resource/upload là Should/MVP Lite; access/storage policy bắt buộc khi đưa vào release. |
| People | Quản lý Teacher/Student members. | Teacher Roster và Admin role-specific user lists. | Co-teacher/guardian không mặc định thuộc MVP. |
| Grades | Theo dõi điểm cho hoạt động. | Grade, Gradebook Basic, `processScore`, Progress Ranking. | MVP default score formula/visibility/audit theo project rules, không copy formula bên ngoài. |
| Feedback | Nhận xét từ Teacher. | Feedback/private comment sau grading/return. | Chỉ visible theo Student/Teacher authorized scope. |
| Archived Class | Lớp không còn active nhưng được giữ lịch sử. | Classroom/Course/Content `ARCHIVED` lifecycle. | Archive không mặc định xóa Progress/Submission/Audit history. |
| Teacher invitation | Mời Teacher vào hệ sinh thái. | Admin tạo/copy manual Teacher invitation link. | Không system email delivery trong MVP; Admin gửi ngoài hệ thống. |

## Quy Tắc Tham Khảo Hợp Lệ

- Có thể tham khảo flow: tạo Classroom, join bằng code/link, tổ chức Classwork, submission, grading/feedback, roster, progress.
- Phải chuyển flow tham khảo thành requirement/rule/acceptance riêng của dự án trước implementation.
- Không gọi giao diện là “Google Classroom clone”, không dùng logo/brand/name gây hiểu nhầm affiliation.
- Không suy diễn provider feature như Google account provisioning, email invite, Forms, Drive, Meet, SIS hoặc proprietary analytics là MVP scope.
- Khi workflow reference xung đột project security/privacy/business rule, project rule thắng.

## Liên Kết

- Product boundary: `../02-product-vision/google-classroom-reference.md`.
- Requirements reference: `../07-requirements/google-classroom-reference-requirements.md`.
- External source: `references.md` (`REF-EXT-001`).
