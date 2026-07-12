# Privacy And Compliance Requirements

## Mục Đích

Tài liệu này xác định yêu cầu privacy và compliance ở mức phù hợp cho **Microlearning Classroom LMS Platform**. Hệ thống xử lý dữ liệu Student, Teacher, Classroom, Course, Progress, Grade, Feedback, Submission và AuditLog, nên cần bảo vệ dữ liệu cá nhân và dữ liệu học tập.

Tài liệu này không thay thế tư vấn pháp lý. Với đồ án/MVP, mục tiêu là áp dụng nguyên tắc bảo vệ dữ liệu đúng đắn và tránh các lỗi privacy nghiêm trọng.

## Privacy Principles

| Nguyên tắc | Cách áp dụng |
| --- | --- |
| Data minimization | Chỉ thu thập dữ liệu cần cho học tập, giảng dạy, quản trị và bảo mật. |
| Purpose limitation | Dữ liệu học tập chỉ dùng cho LMS, progress, grade, feedback, reporting và audit. |
| Role-based visibility | Student, Teacher, Admin chỉ thấy dữ liệu phù hợp quyền. |
| Sensitive data protection | Không expose passwordHash, tokenHash, raw token, secrets. |
| Auditability | Admin/Teacher action quan trọng có audit trail. |
| Retention discipline | Không hard delete dữ liệu học tập quan trọng nếu ảnh hưởng lịch sử. |
| Secure backup | Backup không public và không commit vào repository. |

## Data Classification

| Data type | Sensitivity | Ví dụ | Protection |
| --- | --- | --- | --- |
| Authentication secret | Critical | passwordHash, refresh token hash, reset token hash | Hash, không expose, access rất hạn chế. |
| Invitation secret | Critical | teacher invitation token hash | Hash, expiry, revoke, one-time use. |
| Personal data | High | email, fullName, studentCode, teacher profile | RBAC, projection, audit nếu admin thay đổi. |
| Learning record | High | progress, grade, feedback, submission | Object-level access, backup, không hard delete tùy tiện. |
| Admin audit data | High | audit log, IP, userAgent, action reason | Admin-only, immutable direction. |
| Classroom content | Medium | lesson, quiz, assignment, resource | Teacher ownership, enrollment visibility. |
| Public-like metadata | Low | course title trong classroom đã enroll | Vẫn cần access control. |

## Privacy Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-PRV-001 | API không trả passwordHash, tokenHash, raw token, secrets. | Must | API response review. |
| NFR-PRV-002 | Student chỉ xem dữ liệu học tập của chính mình và Classroom đã enroll. | Must | Access test Student A/B. |
| NFR-PRV-003 | Teacher chỉ xem dữ liệu Student trong Classroom/Course mình có quyền. | Must | Teacher A không xem data lớp Teacher B. |
| NFR-PRV-004 | Admin list phải trả field cần thiết, không trả thông tin nhạy cảm dư thừa. | Must | User list response projection. |
| NFR-PRV-005 | AuditLog không ghi plain password, raw token, secrets hoặc full file content. | Must | Audit log sample review. |
| NFR-PRV-006 | Backup không được public hoặc commit vào source repository. | Must | Backup location review. |
| NFR-PRV-007 | Test/staging data nên dùng dữ liệu giả hoặc masked data nếu có dữ liệu thật. | Should | QA dataset review. |
| NFR-PRV-008 | User deactivation/offboarding không được làm mất learning record cần giữ. | Must | User inactive vẫn giữ submission/grade/audit. |
| NFR-PRV-009 | Report/export phải kiểm tra role/permission. | Must | Student/Teacher/Admin export access test. |
| NFR-PRV-010 | Manual Teacher Invitation Link không được public rộng rãi trong hệ thống. | Must | Chỉ Admin thấy link khi tạo/quản lý invitation. |

## Data Retention Requirements

| Data | Retention Direction | Hard Delete |
| --- | --- | --- |
| User profile | Soft delete/deactivate nếu không còn sử dụng. | Không khuyến nghị MVP. |
| TeacherInvitation | Giữ lịch sử PENDING/ACCEPTED/EXPIRED/REVOKED để audit. | Không trong MVP. |
| Classroom/Course | Archive thay vì xóa nếu đã có Student/progress. | Không khuyến nghị. |
| Lesson/Quiz/Assignment | Archive/unpublish thay vì xóa nếu đã có activity. | Không khuyến nghị. |
| Submission/Grade/Feedback | Giữ như learning record. | Không khuyến nghị. |
| LearningProgress | Giữ để Student/Teacher xem lịch sử. | Không khuyến nghị. |
| AuditLog | Giữ dài hơn log vận hành thông thường. | User thường không được xóa. |
| Notification | Có thể xóa/ẩn sau thời gian cấu hình. | Có thể. |
| Backup | Theo policy DevOps. | Có thể sau expiry policy. |

## API Privacy Rules

API response phải loại bỏ:

```text
passwordHash
tokenHash
raw reset token
raw invitation token
refresh token
secret keys
provider credentials
internal security metadata không cần thiết
```

List APIs phải dùng projection để chỉ trả field UI cần:

- Student List: id, fullName, email, status, classroom/enrollment summary nếu cần.
- Teacher List: id, fullName, email, status, invitationStatus nếu cần.
- Admin List: id, fullName, email, role, status.
- Grade/Progress: chỉ trả data đúng subject và đúng quyền.

## Compliance-Oriented Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-CMP-001 | Hệ thống phải có audit trail cho admin/security-sensitive actions. | Must | AuditLog tồn tại cho action test. |
| NFR-CMP-002 | Dữ liệu cá nhân phải có owner và access rule rõ. | Must | Data dictionary/authorization matrix rõ. |
| NFR-CMP-003 | Khi export report, hệ thống phải kiểm tra quyền và ghi audit nếu dữ liệu nhạy cảm. | Should | Export audit log. |
| NFR-CMP-004 | Nếu triển khai thật cho tổ chức, cần policy retention chính thức. | Could | PO/Admin duyệt retention. |
| NFR-CMP-005 | Nếu có học sinh dưới độ tuổi cần bảo vệ đặc biệt, cần review policy pháp lý trước production. | Could | Legal/organization review. |

## Privacy Test Checklist

| Test | Expected |
| --- | --- |
| Student A gọi API grade của Student B | Bị từ chối hoặc 404 an toàn. |
| Teacher A xem roster của Teacher B | Bị từ chối. |
| Admin Student List response | Không có passwordHash/tokenHash. |
| AuditLog của reset deadline | Có reason nhưng không có secrets. |
| Forgot password | Không tiết lộ email tồn tại hay không nếu security policy yêu cầu. |
| Backup file | Không nằm trong public web path hoặc source repo. |

## Acceptance Criteria

- API không expose secrets hoặc sensitive internal fields.
- Role/object-level access bảo vệ dữ liệu Student/Teacher.
- Dữ liệu học tập quan trọng được giữ bằng archive/soft delete thay vì hard delete tùy tiện.
- AuditLog đủ để trace action quan trọng mà không làm lộ secrets.
- Privacy checklist đạt trước release/demo có dữ liệu thật.
