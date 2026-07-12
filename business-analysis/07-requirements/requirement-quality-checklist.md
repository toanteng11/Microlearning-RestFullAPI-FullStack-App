# Requirement Quality Checklist

## Mục Đích

Checklist này dùng để kiểm tra requirement trong mục `07-requirements` có đủ rõ, đủ sâu, có thể triển khai và có thể kiểm thử hay không.

## Checklist Tổng Quát

| Nhóm kiểm tra | Câu hỏi kiểm tra | Kết quả mong muốn |
| --- | --- | --- |
| Clear | Requirement có dễ hiểu, không mơ hồ không? | Có |
| Complete | Có đủ actor, trigger, behavior, output không? | Có |
| Testable | QA có thể viết test scenario không? | Có |
| Traceable | Có thể trace sang BRQ/US/UC/TS không? | Có |
| Feasible | Có thể triển khai bằng ReactJS, Node.js, MongoDB không? | Có |
| Prioritized | Có Must/Should/Could/Won't rõ không? | Có |
| Consistent | Không mâu thuẫn với scope, role, business rules không? | Có |
| Secure | Có kiểm soát role, permission, data access không? | Có |
| UI-aware | Có nêu màn hình hoặc hành vi UI nếu cần không? | Có |
| API-aware | Có API/data impact nếu cần không? | Có |

## Checklist Cho Functional Requirement

| Tiêu chí | Câu hỏi |
| --- | --- |
| ID | Requirement có ID duy nhất không? |
| Actor | Actor chính là ai? |
| Action | Actor/System phải làm gì? |
| Condition | Điều kiện trước/sau là gì? |
| Data | Dữ liệu nào được tạo/cập nhật/xóa? |
| Permission | Ai được phép thực hiện? |
| Priority | Requirement là Must/Should/Could/Won't? |
| Acceptance | Khi nào xem là pass? |
| Error Handling | Có lỗi/exception đáng chú ý không? |
| Traceability | Có thể map sang user story/use case/test không? |

## Checklist Theo Role

### Student

| Feature | Cần kiểm tra |
| --- | --- |
| Join Classroom | Code/Link, duplicate join, invalid/expired token |
| Dashboard | Classroom list, To-do, deadline, progress summary |
| To-do | Item chưa làm, missing, late, action mở chi tiết |
| Classwork | Lesson, Quiz, Assignment, Resource hiển thị đúng quyền |
| Lesson | Started, completed, deadline, progress |
| Quiz | Attempt, submit, score, feedback |
| Assignment | Turn in, file/link/text, late, unsubmit/resubmit nếu policy cho phép |
| Progress | % hoàn thành, status từng activity |
| Grade/Feedback | Chỉ xem của chính mình |
| Navigation | Back, Previous, Next, breadcrumb |

### Teacher

| Feature | Cần kiểm tra |
| --- | --- |
| Classroom | Create/update/archive, join settings |
| Course | Create/edit/publish/archive |
| Course Dashboard | Lesson list, Student list, progress ranking, deadline |
| Module/Topic | Create/edit/reorder |
| Lesson | Draft/publish/unpublish, deadline, reset deadline with reason |
| Flashcard | Question/answer, display context |
| Quiz | Question types, attempt settings, media optional |
| Assignment | Instruction, due date, max score, attachment |
| Grading | Score, feedback, return work |
| Progress | Course/Classroom progress, processScore sorting |
| Roster | View/search/remove Student |
| Announcement | Publish/edit/delete |

### Admin

| Feature | Cần kiểm tra |
| --- | --- |
| User Management | Student List, Teacher List, Admin List, search/filter/status update |
| Student List | Chỉ hiển thị `STUDENT`, có pagination và action phù hợp |
| Teacher List | Chỉ hiển thị `TEACHER`, có invitation status, classroom count và offboarding cảnh báo |
| Admin List | Chỉ hiển thị `ADMIN`/`SUPER_ADMIN`, thao tác permission nhạy cảm phải kiểm quyền và audit |
| Teacher Invitation | Create/copy/manual send/accept/revoke/expire |
| Role/Permission | RBAC, sensitive role protection |
| Enrollment Policy | Toggle Code/Link |
| Classroom Governance | View all, ownership transfer, archive |
| Offboarding | Teacher active classroom warning |
| Reports | Usage, completion, activity |
| Audit Log | Actor/action/resource/date filters |
| System Settings | Feature/policy/provider/security config |

## Checklist Cho UI/UX Requirement

| Tiêu chí | Câu hỏi |
| --- | --- |
| Entry Point | User vào màn hình từ đâu? |
| Main Content | Màn hình hiển thị thông tin gì? |
| Primary Action | Hành động chính là gì? |
| Secondary Actions | Có edit, delete, preview, filter, export không? |
| Empty State | Không có data thì hiển thị gì? |
| Loading State | Khi đang tải thì hiển thị gì? |
| Error State | Khi lỗi API thì user làm gì? |
| Responsive | Mobile/tablet/desktop có dùng được không? |
| Accessibility | Có label, alt text, keyboard navigation không? |
| Navigation | Có Back/Next/breadcrumb không? |

## Checklist Cho API Requirement

| Tiêu chí | Câu hỏi |
| --- | --- |
| Endpoint | Path và method rõ chưa? |
| Auth | Endpoint cần auth không? |
| Authorization | Role nào được gọi? |
| Request | Body/query/path params rõ chưa? |
| Response | Response schema rõ chưa? |
| Error | Error codes rõ chưa? |
| Pagination | List endpoint có page/limit không? |
| Filter/Sort | Có filter/sort nếu danh sách lớn không? |
| Audit | Action quan trọng có audit không? |
| Swagger | Có cần document trong OpenAPI không? |

## Checklist Cho Data Requirement

| Tiêu chí | Câu hỏi |
| --- | --- |
| Entity | Entity nào bị ảnh hưởng? |
| Field | Field mới/cũ là gì? |
| Type | Data type rõ chưa? |
| Required | Field bắt buộc hay optional? |
| Validation | Có rule validate không? |
| Relationship | Reference đến entity nào? |
| Index | Có cần index để query nhanh không? |
| Retention | Có cần giữ lịch sử không? |
| Privacy | Có dữ liệu nhạy cảm không? |
| Migration | Có ảnh hưởng migration không? |

## Quality Gate Cho MVP Requirements

Trước khi chốt MVP backlog, các requirement Must phải đạt:

- Có mô tả rõ ràng.
- Có acceptance criteria.
- Có actor và priority.
- Có liên kết với business process.
- Có API/data/UI impact nếu cần.
- Có test scenario hoặc UAT coverage.
- Được Product Owner review.
- Được Technical Lead và QA Lead kiểm tra tính khả thi.
