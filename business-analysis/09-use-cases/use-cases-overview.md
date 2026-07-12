# Use Cases Overview

## Mục Đích

Tài liệu này là trang tổng quan cho mục **09 - Use Cases** của dự án **Microlearning Classroom LMS Platform**. Mục tiêu là mô tả cách người dùng tương tác với web application theo từng tình huống nghiệp vụ cụ thể, từ lúc mở màn hình, nhập dữ liệu, gọi API, xử lý lỗi, đến khi hệ thống tạo/cập nhật dữ liệu.

Use case khác với user story ở chỗ:

- **User story** mô tả nhu cầu và giá trị: "Là Student, tôi muốn xem To-do để biết việc cần làm".
- **Use case** mô tả cách hệ thống vận hành: actor vào màn hình nào, bấm gì, API nào được gọi, dữ liệu nào được validate, lỗi nào có thể xảy ra và trạng thái sau cùng là gì.

## Phạm Vi Mục 09

| File | Nội dung |
| --- | --- |
| use-cases-overview.md | Tổng quan cấu trúc và chuẩn mô tả use case |
| use-case-catalog.md | Danh mục use case đầy đủ theo actor/domain |
| use-case-diagram.md | Sơ đồ use case cấp cao bằng Mermaid |
| use-case-specification-template.md | Template chuẩn để viết đặc tả use case |
| auth-access-use-cases.md | Use case cho login, register, session, reset password, access control |
| student-use-cases.md | Use case chi tiết cho Student |
| teacher-use-cases.md | Use case chi tiết cho Teacher |
| admin-use-cases.md | Use case chi tiết cho Admin/Super Admin |
| technical-devops-use-cases.md | Use case kỹ thuật cho API, Swagger, Docker, CI/CD, Cloud, monitoring |

## Actor Coverage

| Actor | Nhóm use case |
| --- | --- |
| Guest | Register, login, mở invitation/join link |
| User | Login, logout, session, reset password, profile, route authorization |
| Student | Join Classroom, xem Dashboard/To-do, học Lesson, làm Quiz, nộp Assignment, xem Progress/Grade/Feedback |
| Teacher | Tạo Classroom, cấu hình join methods, quản lý roster, Course, Lesson, Quiz, Assignment, deadline, progress, grading |
| Admin | User Management theo Student/Teacher/Admin List, invitation, role, policy, governance, reports, audit, offboarding |
| Super Admin | Admin permissions và system settings nhạy cảm |
| Developer/QA | API docs, Swagger, response standard, permission test |
| DevOps Engineer | Docker, CI/CD, Cloud deployment, health check, monitoring, backup, rollback |

## Chuẩn Mô Tả Use Case Cho Web Application

Mỗi use case nên thể hiện rõ:

| Thành phần | Ý nghĩa |
| --- | --- |
| Use Case ID | Mã định danh, ví dụ `UC-041` |
| Use Case Name | Tên ngắn gọn, có động từ |
| Primary Actor | Actor thực hiện chính |
| Supporting Actors | Actor/hệ thống liên quan |
| Goal | Mục tiêu nghiệp vụ của actor |
| Trigger | Sự kiện bắt đầu use case |
| Preconditions | Điều kiện trước khi bắt đầu |
| Main Flow | Luồng chuẩn khi mọi thứ hợp lệ |
| Alternative Flows | Luồng hợp lệ khác |
| Exception Flows | Luồng lỗi/ngoại lệ |
| Postconditions | Trạng thái sau khi hoàn tất |
| Business Rules | Quy tắc nghiệp vụ cần áp dụng |
| UI Touchpoints | Trang/component ReactJS liên quan |
| API Touchpoints | RESTful API liên quan |
| Data Outputs | Entity/field được tạo/cập nhật |
| Acceptance Criteria | Điều kiện pass/fail |

## Web UX Rules Bắt Buộc Trong Use Case

Các use case của web application phải tính đến các trạng thái sau:

| Trạng thái | Yêu cầu |
| --- | --- |
| Loading state | Khi gọi API, UI phải có loading indicator hoặc skeleton phù hợp |
| Empty state | Khi danh sách rỗng, UI phải giải thích rõ ràng |
| Error state | Khi API lỗi, UI phải có message và action retry/back nếu phù hợp |
| Form validation | Validate required fields, format, min/max, file type, file size |
| Authorization state | Nếu user không đủ quyền, hệ thống trả 403 hoặc redirect đúng |
| Pagination | Danh sách lớn phải dùng page/limit hoặc load more |
| Search/filter/sort | Danh sách quản trị, roster, progress, submission phải hỗ trợ tìm kiếm/lọc/sắp xếp |
| Navigation | Các flow chính phải có Back, Previous, Next, breadcrumb hoặc return link |
| Unsaved changes | Form soạn nội dung/bài nộp nên cảnh báo khi rời trang nếu chưa lưu |

## Use Case Priority

| Priority | Ý nghĩa |
| --- | --- |
| Must | Bắt buộc cho MVP |
| Should | Nên có trong MVP Lite hoặc sprint sau |
| Could | Có giá trị nhưng để Post-MVP |
| Won't | Không triển khai trong phạm vi hiện tại |

## Quan Hệ Với Các Tài Liệu Khác

| Tài liệu | Cách liên kết |
| --- | --- |
| 06-business-processes | Use case là phần chi tiết hóa từng bước của business process |
| 07-requirements | Use case phải trace được về Functional Requirements |
| 08-user-stories | Use case hiện thực hóa user stories |
| 10-data-requirements | Use case xác định dữ liệu tạo/cập nhật |
| 11-api-requirements | Use case xác định endpoint cần có |
| 12-ui-ux-requirements | Use case xác định màn hình và trạng thái UI |
| 18-acceptance-criteria | Use case là input quan trọng cho UAT/test scenarios |

## Definition Of Done Cho Use Case

Một use case được xem là đủ tốt để làm baseline khi:

- Có actor, trigger, precondition và postcondition rõ.
- Có main flow theo từng bước.
- Có alternative/exception flows cho tình huống phổ biến.
- Có UI/API/data touchpoints.
- Có business rules và acceptance criteria.
- Không mâu thuẫn với RBAC, object-level access control và scope.
- Có thể chuyển thành test scenario hoặc UAT case.
