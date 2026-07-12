# Business Rules Overview

## Mục Đích

Business Rule là quy tắc quyết định hành vi nghiệp vụ của hệ thống, độc lập tương đối với giao diện hoặc cách code. Rule trả lời các câu hỏi như: ai được làm gì, trong điều kiện nào, dữ liệu nào được thay đổi, trạng thái nào được tạo ra và khi vi phạm thì hệ thống xử lý ra sao.

Mục 17 là baseline rule cho **Microlearning Classroom LMS Platform**. Dev dùng rule để hiện thực backend/service/API; QA dùng để thiết kế positive/negative test; BA/Product Owner dùng để review tính nhất quán của workflow Student, Teacher và Admin.

## Phân Biệt Business Rule Với Khái Niệm Gần Giống

| Khái niệm | Trả lời câu hỏi | Ví dụ |
| --- | --- | --- |
| Functional Requirement | Hệ thống cần có chức năng gì? | Teacher có thể reset deadline Lesson. |
| Business Rule | Chức năng đó được phép/hoạt động theo điều kiện nào? | Chỉ Teacher owner/authorized mới reset; Lesson published cần reason; history/audit được giữ. |
| Validation Rule | Input có đúng định dạng/range không? | Deadline là ISO date hợp lệ; score từ 0 đến maxScore. |
| UI/UX Rule | Người dùng nhìn/thao tác thế nào? | Hiện confirm và bắt buộc nhập reason trước Reset Deadline. |
| NFR | Chất lượng/bảo mật/hiệu năng cần đạt? | API phải không lộ token; dashboard p95 theo target. |
| Technical Decision | Dùng công nghệ/cách triển khai nào? | Backend kiểm tra ownership; MongoDB lưu deadline history. |

Một business rule thường kéo theo validation, API, data, UI và test, nhưng không được để frontend là nơi duy nhất thực thi rule.

## Nguyên Tắc Rule

| ID | Nguyên tắc | Áp dụng |
| --- | --- | --- |
| BPR-01 | Backend là nơi thực thi cuối | Frontend có thể ẩn action/hỗ trợ validation, nhưng API/service phải kiểm tra rule trước mutation/read nhạy cảm. |
| BPR-02 | Rule có phạm vi rõ | Mỗi rule ghi actor, resource, điều kiện, hành động, kết quả/error và audit/data impact khi cần. |
| BPR-03 | Security trước convenience | Account status, RBAC, object ownership/membership và system policy được kiểm tra trước business action. |
| BPR-04 | Không phá dữ liệu học tập | Archive/soft delete/history/recalculation ưu tiên hơn hard delete hoặc overwrite mất dấu vết. |
| BPR-05 | Một định nghĩa chuẩn | Progress, process score, late/missing, Course completion chỉ có một implementation authoritative ở backend. |
| BPR-06 | Ngoại lệ có kiểm soát | Deadline reset, admin override, export và ownership transfer cần permission, reason/audit hoặc approval phù hợp. |
| BPR-07 | Traceable and testable | Rule có ID, source document, priority, test expectation và change governance. |

## Thứ Tự Đánh Giá Rule

```text
1. Request/session có hợp lệ không?
2. Account status có ACTIVE không?
3. Role/permission có cho phép action không?
4. Caller có ownership/membership/governance scope trên resource không?
5. System policy có cho phép không?
6. Resource/content/status/time window có cho phép không?
7. Input/business condition có hợp lệ không?
8. Thực hiện mutation/read, update derived data và AuditLog nếu required.
```

Rule ở bước trước fail thì hệ thống từ chối an toàn và không chạy side effect ở bước sau. Ví dụ, Teacher không sở hữu Course không được biết Quiz có bao nhiêu attempt hoặc deadline hiện tại chỉ vì request body hợp lệ.

## Nhóm Rule

| Nhóm | BR ID | Tài liệu chi tiết |
| --- | --- | --- |
| Access, Account and Authorization | BR-001, BR-003, BR-004, BR-009, BR-015, BR-016, BR-020 đến BR-024, BR-036 đến BR-041, BR-097 đến BR-104 | `access-account-rules.md`, `admin-data-audit-rules.md` |
| Teacher Invitation and Classroom Join | BR-002, BR-010 đến BR-014C, BR-017 đến BR-019, BR-042 đến BR-057 | `teacher-invitation-classroom-join-rules.md` |
| Classroom, Course and Content | BR-008, BR-025, BR-031 đến BR-033, BR-058 đến BR-068 | `classroom-content-rules.md` |
| Learning Progress, To-do and Deadline | BR-005, BR-006, BR-029, BR-034, BR-035, BR-069 đến BR-082 | `learning-progress-deadline-rules.md` |
| Quiz, Assignment, Grading and Feedback | BR-007, BR-083 đến BR-096 | `assessment-grading-rules.md` |
| Reporting, Export and Analytics | BR-105 đến BR-110 | `reporting-export-rules.md` |
| Rule priority, decision tables and lifecycle | Toàn bộ | `business-rule-decision-tables.md`, `business-rule-governance.md` |

## Rule Priority

| Priority | Ý nghĩa | Cách xử lý release |
| --- | --- | --- |
| Must | Rule bắt buộc cho security, privacy, data integrity, workflow MVP hoặc compliance direction | Không release feature liên quan nếu chưa có implementation/test evidence hoặc waiver được phê duyệt. |
| Should | Rule quan trọng cho quality/governance nhưng có thể được release sau nếu scope quyết định | Ghi rõ risk, owner và target release khi chưa thực hiện. |
| Could | Rule tăng trải nghiệm/insight, không làm sai core workflow nếu thiếu | Đưa backlog/Post-MVP. |

## Source Of Truth Và Derived Data

| Domain | Source of truth | Derived data không được là nguồn duy nhất |
| --- | --- | --- |
| Account/access | User status, role/permission, authenticated session | Frontend route visibility. |
| Enrollment | Enrollment + Classroom/policy/token state | Local browser “đã join”. |
| Content | Course/Module/Lesson/Quiz/Assignment lifecycle | Cached UI list. |
| Learning result | Progress, QuizAttempt, Submission, Grade, Feedback | Chart/display badge. |
| To-do/ranking | Source activity/progress/grade/deadline | StudentTodoItem/CourseProgressSummary có thể rebuild. |
| Audit | Append-only AuditLog + safe operation records | Client-side history. |

## Rule Violation Response

| Violation type | API/result direction | Data/Audit behavior |
| --- | --- | --- |
| Authentication/account status | `401` hoặc `403`/standard error theo API policy | Không trả private data; log security event phù hợp. |
| Permission/ownership/scope | `403` hoặc safe `404` theo anti-enumeration policy | Không mutation; audit denied privileged action nếu policy yêu cầu. |
| State/policy conflict | `409` hoặc domain error, ví dụ `JOIN_METHOD_DISABLED` | Không partial write; return clear safe action. |
| Validation/business input | `400`/validation error chuẩn | Không write invalid data. |
| Duplicate/idempotent action | `409` hoặc idempotent response theo endpoint policy | Không tạo duplicate enrollment/attempt/submission. |
| Dependency/system failure | Standard `5xx/503`, requestId | Không claim success; log/monitor and retry/rebuild controlled when relevant. |

## Điều Kiện Hoàn Thành Mục 17

- Mọi BR Must có owner domain, implementation point, test expectation và nguồn/đích data rõ.
- Rule không mâu thuẫn với Role/Permission, Requirements, API/Data/UI/NFR; conflict được ghi trong governance/change control.
- Critical flows có decision table: authorization, Teacher invitation, Classroom join, deadline status/reset, assessment/submission, offboarding/export.
- System không dựa vào frontend để bảo vệ account, ownership, score/progress, export hoặc data integrity.
