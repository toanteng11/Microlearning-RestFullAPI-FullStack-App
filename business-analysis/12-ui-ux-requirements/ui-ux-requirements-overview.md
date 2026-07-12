# UI/UX Requirements Overview

## Mục Đích

Tài liệu này mô tả tổng quan yêu cầu UI/UX cho **Microlearning Classroom LMS Platform**. Mục tiêu của phần 12 là giúp các nhóm **Frontend Developer**, **Backend Developer**, **QA Engineer** và **DevOps Engineer** hiểu rõ:

- Hệ thống cần có những màn hình nào.
- Mỗi màn hình phục vụ role nào.
- Màn hình đó cần gọi API nào.
- Màn hình phải xử lý những trạng thái UI nào.
- Luồng điều hướng giữa các màn hình ra sao.
- Khi deploy lên Cloud, DevOps cần kiểm tra những điểm nào để xác nhận frontend hoạt động đúng.

Phần UI/UX này không chỉ là danh sách giao diện. Đây là tài liệu bridge giữa nghiệp vụ BA, API Requirements, Data Requirements và quá trình implement ReactJS.

## Phạm Vi UI/UX

Phạm vi UI/UX bao gồm các nhóm màn hình sau:

| Nhóm màn hình | Role sử dụng | Mục đích |
| --- | --- | --- |
| Public/Auth screens | Guest, Student, Teacher, Admin | Login, Register, Forgot Password, Reset Password, Teacher Invite Accept |
| Student workspace | Student | Dashboard, To-do, Classroom, Lesson, Quiz, Assignment, Progress, Grade, Calendar |
| Teacher workspace | Teacher | Dashboard, Classroom/Course management, Content editor, Quiz builder, Roster, Gradebook, Progress analytics |
| Admin workspace | Admin, Super Admin | User management, Teacher invitation, Role/Permission, Classroom governance, Audit log, Reports, System settings |
| Shared screens | Authenticated users | Profile, Notification, Error pages, Forbidden page, Not Found page |
| DevOps verification screens/checkpoints | DevOps, QA, Technical Lead | Health check, version display, environment verification, deployment smoke test |

## Định Hướng Sản Phẩm

Sản phẩm là một hệ thống **microlearning hỗ trợ giảng dạy theo mô hình LMS nội bộ**, tham khảo nghiệp vụ quen thuộc của Google Classroom nhưng không sao chép giao diện hoặc thương hiệu Google Classroom.

Định hướng UI/UX:

- Giao diện phải ưu tiên thao tác học và giảng dạy, không làm landing page marketing làm màn hình đầu tiên.
- Student sau khi login phải thấy ngay việc cần làm, deadline và khóa/lớp đang tham gia.
- Teacher sau khi login phải thấy ngay Classroom/Course đang quản lý, tiến độ học sinh và nội dung cần xử lý.
- Admin sau khi login phải thấy ngay các tác vụ vận hành: invitation, user management, audit, reports và system status.
- Các màn hình quản trị phải rõ ràng, có filter, pagination, empty state, error state và action confirmation.
- Các màn hình học tập phải có điều hướng dễ hiểu: Back, Previous, Next, breadcrumb và trạng thái hoàn thành.

## Nguyên Tắc UI/UX Chính

| Mã | Nguyên tắc | Mô tả |
| --- | --- | --- |
| UX-PR-001 | Role-first design | UI phải được tách theo role Student, Teacher, Admin để tránh hiển thị chức năng không phù hợp. |
| UX-PR-002 | Task-first dashboard | Dashboard phải trả lời câu hỏi quan trọng nhất của từng role ngay sau login. |
| UX-PR-003 | Clear navigation | Mọi màn hình con phải có đường quay lại rõ ràng về màn hình cha hoặc dashboard. |
| UX-PR-004 | No dead-end screen | User không được rơi vào màn hình không có action tiếp theo hoặc không biết quay về đâu. |
| UX-PR-005 | API-aware UI | Frontend phải thiết kế theo dữ liệu thật từ API, không hard-code dữ liệu mẫu vào logic sản phẩm. |
| UX-PR-006 | State completeness | Mỗi màn hình phải có loading, empty, error, success và forbidden state nếu phù hợp. |
| UX-PR-007 | Mobile usable | Student có thể học, xem To-do và làm quiz trên mobile ở mức sử dụng được. |
| UX-PR-008 | Teacher efficiency | Teacher phải quản lý course, lesson, quiz, assignment, roster và gradebook với thao tác ít vòng lặp nhất có thể. |
| UX-PR-009 | Admin auditability | Admin action quan trọng phải có confirm, log và feedback rõ ràng. |
| UX-PR-010 | Deployment transparency | UI phải hỗ trợ DevOps xác nhận đúng environment, API base URL và version khi deploy. |

## Role Dashboard Summary

| Role | Màn hình đầu tiên sau login | Thông tin bắt buộc hiển thị |
| --- | --- | --- |
| Student | Student Dashboard | To-do, deadline sắp tới, Classroom đã tham gia, progress tổng quan, notification quan trọng |
| Teacher | Teacher Dashboard | Classroom/Course đang dạy, quick actions tạo Classroom/Course, nội dung mới, progress cảnh báo, pending submissions |
| Admin | Admin Dashboard | Tổng quan users, teacher invitations, system status, audit events gần đây, báo cáo vận hành |
| Super Admin | Admin Dashboard | Tất cả quyền Admin cộng thêm system configuration, role/permission sâu và ownership transfer nếu có |

## UI State Bắt Buộc

Mỗi màn hình hoặc component dữ liệu phải xử lý các trạng thái sau:

| State | Khi nào xảy ra | Yêu cầu UI |
| --- | --- | --- |
| Initial | Màn hình vừa mount | Không hiển thị dữ liệu cũ sai context. |
| Loading | Đang gọi API | Hiển thị skeleton hoặc loading indicator ổn định. |
| Loaded | API trả dữ liệu hợp lệ | Hiển thị dữ liệu đúng layout, đúng quyền. |
| Empty | API trả danh sách rỗng | Hiển thị message thân thiện và action tiếp theo nếu có. |
| Error | API lỗi 4xx/5xx/network | Hiển thị lỗi dễ hiểu, có Retry nếu phù hợp. |
| Forbidden | User không có quyền | Hiển thị trang 403 và điều hướng về dashboard role hiện tại. |
| Not Found | Entity không tồn tại hoặc route sai | Hiển thị trang 404 và action quay về. |
| Success | Action thành công | Toast/message rõ ràng, cập nhật UI sau mutation. |
| Validation Error | Form nhập sai | Hiển thị lỗi tại field và lỗi tổng nếu có. |
| Unsaved Changes | Form/editor có thay đổi chưa lưu | Cảnh báo trước khi rời trang. |

## Liên Kết Với Các Phần BA Khác

| Tài liệu liên quan | Cách dùng trong UI/UX |
| --- | --- |
| `07-requirements/` | Xác định chức năng Must Have, Should Have, Could Have. |
| `08-user-stories/` | Xác định nhu cầu của từng role khi viết screen behavior. |
| `09-use-cases/` | Xác định flow chính, alternative flow và exception flow. |
| `10-data-requirements/` | Xác định field hiển thị, data model, status enum và relationship. |
| `11-api-requirements/` | Xác định endpoint, request/response, error response, pagination và Swagger contract. |
| `13-non-functional-requirements/` | Xác định security, performance, accessibility, logging và reliability. |
| `16-devops-deployment/` | Xác định environment, Docker, CI/CD, Cloud deployment và smoke test. |

## Definition Of Done Cho UI/UX Requirement

Một màn hình được xem là đủ rõ để Dev implement khi có tối thiểu:

- Screen name và role sử dụng.
- Route đề xuất.
- Entry point và exit point.
- API chính cần gọi.
- Data fields cần hiển thị.
- Primary actions và secondary actions.
- Loading, empty, error và forbidden state.
- Responsive behavior.
- Accessibility note nếu có form, table, media hoặc interactive component.
- Acceptance criteria có thể test được.

## Ghi Chú Cho Dev Và DevOps

- Frontend nên dùng route-based code splitting cho các workspace lớn như Admin và Teacher.
- API base URL phải lấy từ environment variable, không hard-code trong source code.
- UI phải có cơ chế hiển thị version/build information ở khu vực phù hợp để DevOps xác nhận deployment.
- Khi deploy SPA lên Cloud, cần cấu hình fallback route về `index.html` để refresh route như `/student/dashboard` không bị 404 từ web server.
- Swagger/OpenAPI là contract chính để Frontend và Backend đồng bộ request/response.
