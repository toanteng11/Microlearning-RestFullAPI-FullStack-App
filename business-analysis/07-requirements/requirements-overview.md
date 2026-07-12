# Requirements Overview

## Mục Đích

Tài liệu này là trang tổng quan cho mục **07 - Requirements** của dự án **Microlearning Classroom LMS Platform**. Mục tiêu là giúp Product Owner, Business Analyst, Technical Lead, Developer, QA và DevOps Engineer hiểu toàn bộ requirement của sản phẩm được chia nhóm như thế nào, priority ra sao, actor nào liên quan và requirement nào là bắt buộc cho MVP.

Phần Requirements phải trả lời rõ:

- Hệ thống cần giải quyết nhu cầu nghiệp vụ nào?
- Student, Teacher, Admin cần những chức năng gì?
- Feature nào bắt buộc, feature nào có thể để sau MVP?
- Requirement nào ảnh hưởng đến UI, API, data, test và deployment?
- Các quyết định nghiệp vụ quan trọng đã được phản ánh đầy đủ chưa?

## Phạm Vi Mục 07

Mục `07-requirements` bao gồm:

| Tài liệu | Vai trò |
| --- | --- |
| business-requirements.md | Nhu cầu nghiệp vụ cấp cao và giá trị sản phẩm |
| functional-requirements.md | Catalog chức năng chi tiết theo domain và actor |
| student-learner-functions-reference.md | Chức năng chi tiết của Student/Learner |
| teacher-functions-reference.md | Chức năng chi tiết của Teacher |
| admin-functions-reference.md | Chức năng chi tiết của Admin/Super Admin |
| teacher-account-invitation-requirements.md | Requirement riêng cho Teacher invitation manual copy link |
| google-classroom-reference-requirements.md | Requirement tham khảo từ workflow Google Classroom |
| feature-priority.md | MoSCoW priority và release recommendation |
| requirement-management-plan.md | Cách quản lý vòng đời requirement |
| requirement-quality-checklist.md | Checklist kiểm tra chất lượng requirement |

## Actor Coverage

| Actor | Requirement coverage |
| --- | --- |
| Guest | Login, Student self-registration, mở invitation/join link ở mức public entry/preview |
| Student | Join Classroom, Dashboard To-do, Classwork, Lesson, Flashcard, Quiz, Assignment, Progress, Grade, Feedback, Deadline, Resource, Navigation |
| Teacher | Classroom, Course, Course Dashboard, Student list, Progress Ranking, Module, Lesson, Flashcard, Quiz, Question Media, Assignment, Resource, Announcement, Grading, Feedback, Gradebook, Deadline |
| Admin | User account, Teacher invitation, role/permission, account status, enrollment policy, classroom governance, ownership transfer, reports, audit log, system settings |
| Super Admin | Role nhạy cảm, system configuration, provider settings, feature flags |
| Developer/QA | RESTful API, Swagger/OpenAPI, testability, traceability |
| DevOps Engineer | Docker, CI/CD, Cloud deployment, health check, monitoring, backup, rollback |

## Quyết Định Nghiệp Vụ Đã Được Chốt

| Quyết định | Requirement liên quan |
| --- | --- |
| Google Classroom chỉ là nguồn tham khảo workflow, không clone | BRQ-020, Google Classroom Reference Requirements |
| Teacher account do Admin mời bằng manual invitation link | FR-006, FR-007, FR-008 |
| Admin copy link và tự gửi thủ công, system không bắt buộc gửi email tự động trong MVP | FR-006, Teacher Invitation Requirements |
| Student join Classroom bằng Class Code hoặc Invite Link | FR-021, FR-022, FR-023 |
| Student Dashboard phải có To-do / Việc cần làm | FR-049, FR-050 |
| Màn hình học tập phải có Back/Previous/Next/breadcrumb | FR-057 |
| Teacher mở Course phải thấy Course Detail Dashboard | FR-027 |
| Teacher xem Student Progress Ranking sort cao xuống thấp | FR-061 |
| Teacher đặt và reset deadline cho từng Lesson/Activity | FR-030 |
| Quiz Question có thể thêm image/video tùy chọn | FR-038 |
| Admin User Management tách Student List, Teacher List và Admin List | FR-009, FR-009A, FR-009B, FR-009C |
| Teacher là actor chính tạo nội dung; Admin chỉ can thiệp governance | BRQ-003, FR-012 đến FR-048 |

## MVP Requirement Coverage

MVP phải bao phủ tối thiểu vòng đời sau:

```text
Admin tạo Teacher invitation link
        ↓
Admin copy link và gửi thủ công
        ↓
Teacher kích hoạt account
        ↓
Teacher tạo Classroom
        ↓
Teacher tạo Course, Module, Lesson, Quiz, Assignment
        ↓
Teacher đặt deadline riêng cho từng Lesson/Activity và reset deadline khi có ngoại lệ
        ↓
Student join Classroom bằng Code/Link
        ↓
Student thấy To-do và học/nộp bài/làm quiz
        ↓
System ghi progress, score, submission
        ↓
Teacher xem Course Dashboard và Progress Ranking
        ↓
Teacher chấm điểm, feedback, return work
        ↓
Admin xem reports, audit log và governance
```

## Requirement Naming Convention

| Prefix | Ý nghĩa |
| --- | --- |
| BRQ | Business Requirement |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| US | User Story |
| UC | Use Case |
| AC | Acceptance Criteria |
| TS | Test Scenario |

## Priority Convention

| Priority | Ý nghĩa |
| --- | --- |
| Must | Bắt buộc cho MVP hoặc bắt buộc để workflow chính hoạt động |
| Should | Quan trọng, nên làm nếu đủ thời gian hoặc nằm trong MVP Lite |
| Could | Có giá trị nhưng để Post-MVP hoặc optional |
| Won't | Không làm trong phạm vi đồ án/MVP hiện tại |

## Definition Of Ready Cho Requirement

Một requirement được xem là sẵn sàng đưa vào backlog khi:

- Có ID rõ ràng.
- Có actor hoặc owner rõ ràng.
- Có business value.
- Có priority.
- Có acceptance criteria.
- Có dữ liệu/API/UI liên quan nếu cần.
- Có thể kiểm thử bằng test scenario hoặc UAT.
- Không mâu thuẫn với scope, business rules và access control.

## Definition Of Done Cho Requirement

Một requirement được xem là hoàn tất khi:

- Được implement đúng hành vi.
- Có API/UI/data tương ứng nếu requirement yêu cầu.
- QA kiểm thử pass theo acceptance criteria.
- Không phá vỡ role permission hoặc object-level access control.
- Swagger/OpenAPI được cập nhật nếu có endpoint mới.
- Test scenarios/UAT được cập nhật.
- Nếu ảnh hưởng deployment, DevOps checklist được cập nhật.

## Coverage Checklist

| Nhóm | Đã bao phủ trong mục 07 |
| --- | --- |
| Authentication & Authorization | Có |
| Teacher Invitation Manual Copy Link | Có |
| Student Join Code/Link | Có |
| Student Dashboard To-do | Có |
| Student Learning Flow | Có |
| Teacher Classroom/Course Management | Có |
| Teacher Course Detail Dashboard | Có |
| Lesson Deadline | Có |
| Quiz Question Media | Có |
| Assignment Submission | Có |
| Grading & Feedback | Có |
| Progress Ranking | Có |
| Admin Governance | Có |
| Admin Role-specific User Lists | Có |
| Reports & Audit Log | Có |
| RESTful API & Swagger | Có |
| DevOps Delivery Foundation | Có |
