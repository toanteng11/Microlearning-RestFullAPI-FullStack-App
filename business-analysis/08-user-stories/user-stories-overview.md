# User Stories Overview

## Mục Đích

Tài liệu này là trang tổng quan cho mục **08 - User Stories** của dự án **Microlearning Classroom LMS Platform**. Mục tiêu là chuyển các requirement ở mục `07-requirements` thành các user stories rõ ràng, có thể đưa vào backlog, thiết kế UI, thiết kế API, viết test case và triển khai theo sprint.

User stories trong dự án này không chỉ mô tả các chức năng lớn như `Create Classroom` hoặc `Submit Assignment`, mà còn tách cả các chức năng nhỏ như search, filter, pagination, copy link, preview, deadline, status, empty state, error state, Back/Previous/Next và audit log.

## Phạm Vi Mục 08

| File | Nội dung |
| --- | --- |
| user-stories-overview.md | Tổng quan cách tổ chức user stories |
| guest-auth-user-stories.md | Story cho Guest/User/Auth flow |
| student-user-stories.md | Story chi tiết cho Student |
| teacher-user-stories.md | Story chi tiết cho Teacher |
| admin-user-stories.md | Story chi tiết cho Admin/Super Admin |
| technical-devops-user-stories.md | Technical enabler stories cho API, Swagger, Docker, CI/CD, Cloud |
| google-classroom-reference-user-stories.md | Story tham khảo từ workflow Google Classroom, không định vị là clone |

## Quy Ước Viết User Story

Format chính:

```text
Là [actor], tôi muốn [goal/action] để [business value].
```

Mỗi story cần có:

| Thành phần | Ý nghĩa |
| --- | --- |
| ID | Mã story duy nhất, ví dụ `US-STU-009` |
| Epic / Nhóm | Nhóm chức năng hoặc domain |
| User Story | Nhu cầu dưới góc nhìn actor |
| Priority | Must, Should, Could, Won't |
| Related FR | Functional Requirement liên quan |
| Acceptance Criteria | Điều kiện để story được xem là hoàn thành |

## Prefix ID

| Prefix | Actor / Nhóm |
| --- | --- |
| US-AUTH | Guest/User/Auth flow |
| US-STU | Student |
| US-TCH | Teacher |
| US-TCH-INV | Teacher invitation acceptance |
| US-ADM | Admin/Super Admin |
| US-TECH | Developer/QA technical enabler |
| US-DEVOPS | DevOps technical enabler |

## Actor Coverage

| Actor | Coverage |
| --- | --- |
| Guest | Login, Student self-registration, open invitation/join link, forgot password |
| User | Logout, session, profile, reset password, role-based redirect |
| Student | Join Classroom, Dashboard, To-do, Classwork, Lesson, Flashcard, Quiz, Assignment, Submission, Progress, Grade, Feedback, Calendar, Notification, Navigation |
| Teacher | Invitation activation, Classroom, Join mechanisms, Roster, Course, Module, Lesson, Deadline, Flashcard, Quiz, Question Media, Assignment, Grading, Feedback, Progress, Ranking, Gradebook, Navigation |
| Admin | Dashboard, Student List, Teacher List, Admin List, Invitation, Role/Permission, Account Status, Enrollment Policy, Classroom Governance, Reports, Audit, Settings, Offboarding |
| Developer/QA | RESTful API, Swagger/OpenAPI, error response, pagination, authorization, testability |
| DevOps Engineer | Docker, CI/CD, Cloud deployment, environment variables, health check, monitoring, backup, rollback |

## Priority Rule

| Priority | Ý nghĩa trong backlog |
| --- | --- |
| Must | Bắt buộc cho MVP hoặc để workflow chính chạy đúng |
| Should | Nên có trong MVP Lite hoặc sprint sau nếu đủ thời gian |
| Could | Có giá trị nhưng có thể để Post-MVP |
| Won't | Không triển khai trong phạm vi đồ án hiện tại |

## Epic Map

| Epic | Actor chính | Related FR |
| --- | --- | --- |
| Authentication & Account | Guest/User | FR-001 đến FR-005 |
| Teacher Invitation | Admin/Teacher | FR-006 đến FR-008 |
| Admin User Management | Admin | FR-009, FR-009A, FR-009B, FR-009C |
| Classroom & Enrollment | Student/Teacher/Admin | FR-011, FR-020 đến FR-025 |
| Course & Microlearning Content | Teacher/Student | FR-026 đến FR-035, FR-051 đến FR-053 |
| Quiz & Assessment | Teacher/Student | FR-036 đến FR-041 |
| Assignment & Submission | Teacher/Student | FR-042 đến FR-048 |
| Student Dashboard & To-do | Student | FR-049, FR-050, FR-056, FR-058 |
| Progress & Gradebook | Student/Teacher | FR-054, FR-055, FR-059 đến FR-063 |
| Navigation & UX | Student/Teacher/Admin | FR-057, FR-064 |
| API & Documentation | Developer/QA | FR-065 đến FR-068 |
| Audit & Governance | Admin/System | FR-069 |
| DevOps & Deployment | DevOps Engineer | FR-070 đến FR-075 |

## Definition Of Ready Cho User Story

Một user story sẵn sàng đưa vào sprint khi:

- Có actor rõ ràng.
- Có goal và business value rõ.
- Có priority.
- Có acceptance criteria test được.
- Có related FR.
- Không mâu thuẫn với scope và business rules.
- Có UI/API/data impact nếu story yêu cầu.
- Có dependency được ghi nhận nếu cần.

## Definition Of Done Cho User Story

Một user story hoàn thành khi:

- Frontend behavior đúng acceptance criteria.
- Backend API/data đúng contract nếu có.
- Authorization được kiểm tra đúng role và object-level access.
- Empty/loading/error state được xử lý.
- Swagger/OpenAPI được cập nhật nếu có endpoint mới.
- QA pass test scenario.
- Không làm hỏng workflow của actor khác.

## INVEST Checklist

| Tiêu chí | Câu hỏi kiểm tra |
| --- | --- |
| Independent | Story có thể làm tương đối độc lập không? |
| Negotiable | Story còn có thể tinh chỉnh theo sprint không? |
| Valuable | Story tạo giá trị rõ cho actor hoặc delivery team không? |
| Estimable | Team có thể ước lượng effort không? |
| Small | Story có đủ nhỏ để làm trong sprint không? |
| Testable | QA có thể kiểm thử pass/fail không? |

## Ghi Chú BA

- Một feature lớn có thể có nhiều user stories nhỏ.
- Một story có thể liên quan nhiều FR, nhưng nên có một goal chính.
- Các story kỹ thuật như Docker, CI/CD, Swagger vẫn cần được ghi vì dự án có mục tiêu học DevOps và triển khai Cloud.
- Google Classroom chỉ dùng để tham khảo workflow quen thuộc; user stories phải phản ánh sản phẩm Microlearning Classroom LMS của dự án.
