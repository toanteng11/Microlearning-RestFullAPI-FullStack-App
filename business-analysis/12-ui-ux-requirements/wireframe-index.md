# Wireframe Index

## Mục Đích

Tài liệu này theo dõi danh mục wireframe/prototype cần có cho hệ thống. Mỗi màn hình trong `frontend-pages.md` nên có wireframe tối thiểu trước khi implement UI chính thức.

## Quy Ước Trạng Thái

| Trạng thái | Ý nghĩa |
| --- | --- |
| Required | Cần có wireframe cho MVP hoặc luồng nghiệp vụ quan trọng. |
| Draft Requirement | Đã có mô tả requirement chi tiết, có thể chuyển sang wireframe. |
| Optional | Có thể wireframe sau MVP. |
| Shared Pattern | Dùng layout/pattern chung, không nhất thiết cần wireframe riêng. |

## Wireframe Catalog

| Screen ID | Tên màn hình | Role | Priority | Trạng thái | Tham chiếu |
| --- | --- | --- | --- | --- | --- |
| UI-001 | Login | Guest | P0 | Required | frontend-pages.md |
| UI-002 | Student Register | Guest | P0 | Required | frontend-pages.md |
| UI-003 | Forgot Password | Guest/User | P1 | Shared Pattern | frontend-pages.md |
| UI-004 | Reset Password | Guest/User | P1 | Shared Pattern | frontend-pages.md |
| UI-005 | Teacher Invitation Accept | Invited Teacher | P0 | Required | frontend-pages.md |
| UI-006 | Join Classroom By Code | Student | P0 | Required | frontend-pages.md |
| UI-007 | Invite Link Landing | Guest/Student | P0 | Required | frontend-pages.md |
| UI-008 | Profile | User | P1 | Shared Pattern | frontend-pages.md |
| UI-009 | Notifications | User | P1 | Optional | frontend-pages.md |
| UI-010 | Student Dashboard | Student | P0 | Draft Requirement | student-dashboard-to-do.md |
| UI-011 | Student To-do / Việc Cần Làm | Student | P0 | Draft Requirement | student-dashboard-to-do.md |
| UI-012 | Student Classroom List | Student | P0 | Required | google-classroom-reference-ui.md |
| UI-013 | Student Classroom Detail | Student | P0 | Required | google-classroom-reference-ui.md |
| UI-014 | Student Classwork | Student | P0 | Required | google-classroom-reference-ui.md |
| UI-015 | Lesson Player | Student | P0 | Required | navigation-controls.md |
| UI-016 | Flashcard Viewer | Student | P1 | Optional | frontend-pages.md |
| UI-017 | Quiz Attempt | Student | P0 | Required | quiz-question-media.md |
| UI-018 | Quiz Result | Student | P1 | Required | frontend-pages.md |
| UI-019 | Assignment Detail | Student | P0 | Required | google-classroom-reference-ui.md |
| UI-020 | Assignment Submission | Student | P0 | Required | google-classroom-reference-ui.md |
| UI-021 | Student Progress | Student | P1 | Required | frontend-pages.md |
| UI-022 | Student Grades | Student | P1 | Required | google-classroom-reference-ui.md |
| UI-023 | Student Calendar | Student | P1 | Optional | frontend-pages.md |
| UI-024 | Teacher Dashboard | Teacher | P0 | Required | frontend-pages.md |
| UI-025 | Create Classroom | Teacher | P0 | Required | user-flow-map.md |
| UI-026 | Teacher Classroom Detail | Teacher | P0 | Required | google-classroom-reference-ui.md |
| UI-027 | Classroom Settings | Teacher | P0 | Required | frontend-pages.md |
| UI-028 | Classroom Roster | Teacher | P0 | Required | google-classroom-reference-ui.md |
| UI-029 | Create Course | Teacher | P0 | Required | user-flow-map.md |
| UI-030 | Teacher Course Detail Dashboard | Teacher | P0 | Draft Requirement | teacher-course-dashboard.md |
| UI-031 | Course Content Management | Teacher | P0 | Required | teacher-course-dashboard.md |
| UI-032 | Module / Topic Management | Teacher | P1 | Optional | frontend-pages.md |
| UI-033 | Micro Lesson Editor | Teacher | P0 | Required | frontend-pages.md |
| UI-034 | Flashcard Editor | Teacher | P1 | Optional | frontend-pages.md |
| UI-035 | Quiz Builder | Teacher | P0 | Draft Requirement | quiz-question-media.md |
| UI-036 | Quiz Question Media Section | Teacher | P1 | Draft Requirement | quiz-question-media.md |
| UI-037 | Assignment Editor | Teacher | P0 | Required | frontend-pages.md |
| UI-038 | Submission Management | Teacher | P0 | Required | google-classroom-reference-ui.md |
| UI-039 | Grade And Feedback | Teacher | P0 | Required | google-classroom-reference-ui.md |
| UI-040 | Teacher Gradebook | Teacher | P1 | Required | teacher-course-dashboard.md |
| UI-041 | Teacher Progress Analytics | Teacher | P1 | Required | teacher-course-dashboard.md |
| UI-042 | Teacher Resource Management | Teacher | P1 | Optional | frontend-pages.md |
| UI-043 | Admin Dashboard | Admin | P0 | Required | frontend-pages.md |
| UI-044 | Admin User Management Entry | Admin | P0 | Required | frontend-pages.md |
| UI-045 | Admin Student List | Admin | P0 | Required | frontend-pages.md |
| UI-046 | Admin Teacher List | Admin | P0 | Required | frontend-pages.md |
| UI-047 | Admin Admin List | Admin/Super Admin | P1 | Required | frontend-pages.md |
| UI-048 | Admin Advanced User Search | Admin | P1 | Optional | frontend-pages.md |
| UI-049 | Admin Teacher Invitation Management | Admin | P0 | Required | frontend-pages.md |
| UI-050 | Admin Role And Permission Management | Admin/Super Admin | P1 | Required | frontend-pages.md |
| UI-051 | Admin Classroom Governance | Admin | P1 | Required | frontend-pages.md |
| UI-052 | Admin Enrollment Policy Settings | Admin | P1 | Optional | frontend-pages.md |
| UI-053 | Admin File Upload Policy Settings | Admin | P1 | Optional | frontend-pages.md |
| UI-054 | Admin Notification Settings | Admin | P2 | Optional | frontend-pages.md |
| UI-055 | Admin Audit Log | Admin | P1 | Required | frontend-pages.md |
| UI-056 | Admin Usage Reports | Admin | P1 | Required | frontend-pages.md |
| UI-057 | Admin System Configuration | Admin/Super Admin | P2 | Optional | frontend-pages.md |
| UI-058 | Teacher Offboarding | Admin | P2 | Optional | frontend-pages.md |
| UI-059 | Forbidden Page | User | P0 | Shared Pattern | frontend-component-state-requirements.md |
| UI-060 | Not Found Page | User/Guest | P0 | Shared Pattern | frontend-component-state-requirements.md |
| UI-061 | Deployment Info / Build Info | DevOps/Admin | P1 | Optional | frontend-devops-qa-handoff.md |

## Wireframe Layout Requirements Theo Nhóm

### Student Screens

- Student Dashboard phải đặt To-do ở vùng dễ thấy ngay sau login.
- To-do item phải có title, classroom, type, deadline, status và action.
- Lesson Player cần `Back`, `Previous`, `Next` và progress indicator nếu có sequence.
- Quiz Attempt cần hiển thị câu hỏi, đáp án, media optional, trạng thái đã chọn và confirm trước submit.
- Assignment Detail cần hiển thị instruction, deadline, attachment, submission status và feedback nếu đã được chấm.

### Teacher Screens

- Teacher Dashboard phải có quick actions: Create Classroom, Create Course, Create Lesson/Quiz/Assignment nếu context cho phép.
- Teacher Course Detail Dashboard phải có Course Summary, Activities list và Student Progress Ranking.
- Teacher Course Detail Dashboard phải có action `Set Deadline` hoặc `Reset Deadline` trên từng Lesson.
- Modal reset deadline cần có current deadline, new deadline và reason khi Lesson đã publish/assigned.
- Quiz Builder phải hỗ trợ question list, question editor, answer options, correct answer, optional image/video media.
- Grade/Feedback screen phải đặt bài nộp của Student và form chấm điểm trong cùng context dễ đối chiếu.

### Admin Screens

- Admin User Management không hiển thị tất cả user chung một bảng mặc định; phải tách Student List, Teacher List, Admin List.
- Teacher Invitation Management phải có form nhập email, button tạo link, khu vực copy link và bảng invitation history.
- Admin list screens cần filter, pagination, status badge và confirm cho action quan trọng.
- Audit Log và Reports cần filter theo thời gian, role/action và export nếu API hỗ trợ.

## Acceptance Criteria

- Tất cả màn hình P0 có wireframe hoặc mô tả layout đủ để Dev implement.
- Wireframe thể hiện rõ loading, empty và error state cho màn hình dữ liệu.
- Wireframe cho mobile phải thể hiện cách table/list chuyển thành layout dễ dùng.
- Wireframe không dùng text mô tả chức năng thay cho control thật; action chính phải là button/form/list rõ ràng.
- Wireframe cho Admin và Teacher không được làm rối bằng card trang trí; ưu tiên layout quản trị dễ scan.
