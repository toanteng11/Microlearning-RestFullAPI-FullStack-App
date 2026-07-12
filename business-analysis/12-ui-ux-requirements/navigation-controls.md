# Navigation Controls UI Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu UI/UX cho các nút điều hướng cơ bản trong hệ thống, đặc biệt là `Back`, `Previous`, `Next`, breadcrumb và các nút quay về màn hình cha.

Đây là nhóm chức năng nhỏ nhưng rất quan trọng. Một hệ thống học tập có nhiều màn hình như Dashboard, Classroom, Lesson, Quiz, Assignment, Grade và Admin pages nếu thiếu điều hướng rõ ràng sẽ khiến user dễ bị mất phương hướng.

## Nguyên Tắc Chung

- Màn hình có ngữ cảnh cha phải có cách quay lại ngữ cảnh cha.
- Màn hình dạng chuỗi học tập nên có `Previous` và `Next`.
- Màn hình nhiều bước nên có `Back` và `Next`.
- Màn hình dữ liệu dài nên có pagination hoặc next page nếu cần.
- Nút điều hướng phải có label rõ ràng, không chỉ dùng icon nếu icon dễ gây hiểu nhầm.

## Các Loại Điều Hướng

| Control | Dùng khi nào | Hành vi mong đợi |
| --- | --- | --- |
| Back | Quay lại màn hình trước hoặc màn hình cha | Nếu không có browser history, fallback về trang cha |
| Previous | Quay lại item trước trong cùng module/list | Không dùng để quay lại trang bất kỳ |
| Next | Chuyển sang item tiếp theo hoặc bước tiếp theo | Disabled nếu không có item tiếp theo |
| Breadcrumb | Hiển thị vị trí hiện tại trong cấu trúc | Cho phép quay về Dashboard/Classroom/Classwork |
| Return to Dashboard | Quay về dashboard của role hiện tại | Dùng cho Student/Teacher/Admin |
| Cancel | Thoát khỏi form khi chưa lưu | Cần cảnh báo nếu có dữ liệu chưa lưu |

## Yêu Cầu Theo Màn Hình Student

| Màn hình | Điều hướng bắt buộc |
| --- | --- |
| Student Dashboard | Link vào Classroom, To-do item và Progress |
| To-do Detail Context | `Back to To-do` |
| Classroom Detail | `Back to Dashboard`, breadcrumb |
| Classwork | `Back to Classroom`, filter/sort nếu có |
| Lesson Player | `Back to Classwork`, `Previous Lesson`, `Next Lesson` |
| Quiz | `Back to Classwork` trước khi bắt đầu, confirm trước khi submit |
| Assignment Detail | `Back to To-do` hoặc `Back to Classwork`, tùy nơi mở |
| Grade/Feedback | `Back to Classroom` hoặc `Back to Dashboard` |

## Yêu Cầu Theo Màn Hình Teacher

| Màn hình | Điều hướng bắt buộc |
| --- | --- |
| Teacher Dashboard | Link vào Classroom, Content Management, Progress |
| Classroom Management | `Back to Teacher Dashboard` |
| Lesson/Quiz/Assignment Editor | `Cancel`, `Save Draft`, `Preview`, `Publish` |
| Gradebook | `Back to Classroom`, link đến Submission detail |
| Progress Dashboard | `Back to Classroom`, filter theo Student/Activity |

## Yêu Cầu Theo Màn Hình Admin

| Màn hình | Điều hướng bắt buộc |
| --- | --- |
| Admin Dashboard | Link đến User Management, Invitation, Reports, Audit |
| User Detail | `Back to User Management` |
| Teacher Invitation Detail | `Back to Invitation Management` |
| Audit Log Detail | `Back to Audit Log` |
| Reports | Filter, pagination và `Back to Dashboard` |

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| NAV-BR-001 | Back button phải có fallback route nếu browser history không hợp lệ |
| NAV-BR-002 | Next/Previous trong lesson flow phải theo thứ tự module do Teacher cấu hình |
| NAV-BR-003 | Không được mất dữ liệu form chưa lưu khi user bấm Back/Cancel mà không cảnh báo |
| NAV-BR-004 | Khi Student mở activity từ To-do, hệ thống phải biết quay lại To-do |
| NAV-BR-005 | Navigation controls phải hoạt động trên desktop, tablet và mobile |

## Acceptance Criteria

- Màn hình Student học tập chính có nút quay lại phù hợp.
- Lesson Player có thể chuyển sang bài trước/bài tiếp theo nếu module có thứ tự.
- Assignment mở từ To-do có thể quay lại To-do.
- Breadcrumb hoặc route label giúp user biết đang ở Dashboard, Classroom, Classwork hay Activity.
- Nút `Next` bị disabled hoặc ẩn khi không có item tiếp theo.
- User không mất dữ liệu nhập form khi điều hướng ra khỏi màn hình mà chưa lưu.
