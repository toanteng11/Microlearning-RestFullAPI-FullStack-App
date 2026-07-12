# Data Retention And Privacy

## Mục Đích

Tài liệu này xác định cách hệ thống lưu giữ, bảo vệ và xử lý dữ liệu cá nhân/dữ liệu học tập trong **Microlearning Classroom LMS Platform**. Vì đối tượng chính là Student và Teacher, dữ liệu học tập như Progress, Submission, Grade và Feedback cần được bảo toàn, nhưng vẫn phải hạn chế truy cập theo quyền.

## Privacy Principles

| Nguyên tắc | Mô tả |
| --- | --- |
| Data minimization | Chỉ thu thập dữ liệu cần cho học tập, quản trị và bảo mật |
| Purpose limitation | Dữ liệu học tập dùng cho LMS, progress, reports, audit, không dùng ngoài phạm vi |
| Access control | Student chỉ xem dữ liệu của mình; Teacher xem lớp mình; Admin xem theo governance |
| Sensitive data protection | Không expose passwordHash, tokenHash, secrets, raw tokens |
| Auditability | Hành động quản trị quan trọng phải có AuditLog |
| Retention by value | Dữ liệu học tập quan trọng không hard delete tùy tiện |
| Recoverability | Dữ liệu quan trọng nằm trong backup scope |

## Data Sensitivity Classification

| Loại dữ liệu | Mức nhạy cảm | Ví dụ | Bảo vệ |
| --- | --- | --- | --- |
| Authentication secret | Critical | passwordHash, tokenHash, reset token | Không expose, hash, hạn dùng |
| Personal data | High | email, fullName, studentCode, phone | RBAC, hạn chế API fields |
| Learning record | High | Progress, Grade, Feedback, Submission | Object-level access |
| Admin audit data | High | AuditLog, IP, userAgent | Admin-only, append-only |
| Classroom content | Medium | Lesson, Quiz, Assignment | Teacher ownership, enrollment access |
| Public-like metadata | Low | Course title published cho enrolled users | Vẫn cần access control |

## Retention Rules

| Data | Retention Rule | Hard Delete? | Owner |
| --- | --- | --- | --- |
| User profile | Lưu khi account tồn tại; soft delete khi nghỉ học/nghỉ dạy | Không khuyến nghị | Admin |
| passwordHash | Lưu khi account active/inactive; xóa/rotate theo security policy | Có thể xóa khi hard delete | Backend |
| PasswordResetToken | Xóa/hết hiệu lực sau khi dùng hoặc hết hạn | Có | Backend |
| TeacherInvitation | Lưu lịch sử PENDING/ACCEPTED/EXPIRED/REVOKED để audit | Không trong MVP | Admin |
| Classroom | Archive thay vì xóa nếu đã có Student/progress | Không khuyến nghị | Teacher/Admin |
| Enrollment | Giữ để bảo toàn roster history và reports | Không khuyến nghị | Teacher/Admin |
| Course/Lesson/Quiz/Assignment | Archive/unpublish thay vì xóa nếu đã có activity | Không khuyến nghị | Teacher |
| Submission | Lưu để chấm điểm, feedback, learning record | Không khuyến nghị | Student/Teacher |
| Grade/Feedback | Lưu như learning record | Không khuyến nghị | Teacher |
| LearningProgress | Lưu để Student/Teacher xem lịch sử học tập | Không khuyến nghị | System |
| AuditLog | Lưu lâu hơn dữ liệu vận hành thông thường | Không bởi user thường | System/Admin |
| Notification | Có thể xóa/ẩn sau thời gian cấu hình | Có thể | System |
| ReportSnapshot | Lưu theo nhu cầu reporting | Có thể | Admin |
| BackupRecord | Lưu theo chính sách DevOps | Có thể | DevOps |

## Soft Delete And Archive Rules

| Resource | Recommended Action | Lý do |
| --- | --- | --- |
| User | Set status `DELETED` hoặc `INACTIVE` | Giữ Submission, Grade, AuditLog |
| Classroom | Set status `ARCHIVED` | Giữ dữ liệu lớp và progress |
| Course | Set status `ARCHIVED` | Giữ nội dung và progress cũ |
| Lesson/Quiz/Assignment | `UNPUBLISHED` hoặc `ARCHIVED` | Không làm mất dữ liệu Student đã làm |
| Enrollment | Set status `REMOVED` hoặc `LEFT` | Giữ lịch sử tham gia |
| TeacherInvitation | Set status `REVOKED` hoặc `EXPIRED` | Trace onboarding |

## Access Control Privacy Rules

| Actor | Được xem | Không được xem |
| --- | --- | --- |
| Student | Profile của mình, Classroom đã enroll, Progress/Grade/Feedback của mình | Grade/Submission/Feedback của Student khác |
| Teacher | Classroom owned, Student roster, Submission/Progress/Grade trong lớp owned | Classroom của Teacher khác nếu không có quyền |
| Admin | User lists, reports, audit, classroom governance theo permission | Password/token raw, nội dung riêng nếu không có governance reason |
| Super Admin | System settings nhạy cảm theo quyền | Password raw/token raw vẫn không được xem |
| Developer/QA | Test data hoặc masked data | Production secrets và dữ liệu cá nhân thật nếu không được phép |

## API Privacy Requirements

API không được trả các field sau trong response thông thường:

```text
passwordHash
tokenHash
raw invitation token
raw reset token
refresh token
secret keys
provider credentials
internal security metadata
```

List APIs phải dùng projection để chỉ trả field cần hiển thị.

## Audit And Privacy

AuditLog cần ghi đủ để trace, nhưng không được ghi secret.

Nên ghi:

- actorId
- action
- resourceType
- resourceId
- oldValue/newValue nếu không nhạy cảm
- reason
- timestamp
- IP/userAgent nếu cần

Không nên ghi:

- password plain text
- raw token
- full file content
- secrets/env variables

## Backup Privacy

| Quy tắc | Mô tả |
| --- | --- |
| Backup scope rõ | Backup các collection nghiệp vụ quan trọng |
| Không public backup | Backup không được lưu ở public URL |
| Access limited | Chỉ DevOps/authorized admin có quyền truy cập backup |
| Restore test | Có quy trình restore cơ bản để kiểm tra backup dùng được |
| Pre-release backup | Nên backup trước migration/deploy có rủi ro |

## Data Export Privacy

| Export | Quy tắc |
| --- | --- |
| User report | Chỉ Admin có quyền export |
| Audit log | Chỉ Admin/Super Admin có quyền phù hợp |
| Grade/progress | Teacher chỉ export dữ liệu lớp mình; Admin theo governance |
| Student data | Student chỉ export/xem dữ liệu của chính mình nếu feature có |

## Retention Open Questions

| Câu hỏi | Gợi ý quyết định |
| --- | --- |
| AuditLog lưu bao lâu? | MVP: giữ trong suốt vòng đời đồ án; production: theo policy tổ chức |
| User deleted có anonymize không? | MVP: soft delete; Post-MVP có anonymization nếu cần |
| Submission/Grade có được xóa theo yêu cầu không? | Cần policy học vụ rõ |
| Backup giữ bao lâu? | MVP: giữ bản gần nhất và pre-release backup; production: theo lịch |
