# Data Architecture

## Mục Đích

Tài liệu này mô tả cách dữ liệu nghiệp vụ, read model, file/media, audit và backup được tổ chức ở cấp kiến trúc. Chi tiết collection, schema, validation và index được quản lý tại `../10-data-requirements/`; tài liệu này tập trung vào ownership, luồng dữ liệu và quyết định vận hành.

## Nguồn Dữ Liệu Và Quyền Sở Hữu

| Loại dữ liệu | System of Record | Ví dụ | Owner module | Ghi chú |
| --- | --- | --- | --- | --- |
| Identity/access | MongoDB | User, Role, Permission, session/token hash | Identity & Access | Không lưu password/raw token. |
| Classroom membership | MongoDB | Classroom, Enrollment, ClassCode, InviteLink, Invite Link token | Classroom & Enrollment | Enrollment là bằng chứng Student thuộc Classroom. |
| Learning content | MongoDB | Course, Module, Lesson, Quiz, Question, Assignment | Course & Content / Assessment | Draft/published/archive phải có lifecycle. |
| Learning record | MongoDB | Progress, Attempt, Submission, Grade, Feedback | Learning Progress / Grade & Feedback | Không hard delete khi còn giá trị học tập/audit. |
| Dashboard read model | MongoDB, có thể rebuild | StudentTodoItem, CourseProgressSummary | Learning Progress | Không phải nguồn dữ liệu duy nhất. |
| File/media binary | Object storage | Attachment, image/video QuestionMedia, resource file | File & Media | Lưu bằng private object/bucket; metadata nằm ở MongoDB. |
| Audit/operation | MongoDB hoặc log platform theo chính sách | AuditLog, DeploymentRecord, BackupRecord | Reporting & Audit / Operations | Audit event append-only với user thường. |
| Telemetry | Monitoring/log platform | request log, error, metrics | Operations | Không đẩy secrets/raw token/password vào telemetry. |

## Phân Loại Dữ Liệu

| Classification | Ví dụ | Kiểm soát tối thiểu |
| --- | --- | --- |
| Highly sensitive | password hash, refresh/reset/invitation token hash, credential/secret | Không trả API, không log, secret manager, access tối thiểu. |
| Sensitive personal/learning | email, full name, student progress, score, feedback, submission | RBAC + ownership, encrypted transport, retention, audit access nhạy cảm. |
| Internal operational | Classroom settings, deployment version, health status | Chỉ role/service cần thiết; tránh public full details. |
| Public-safe | public landing asset, basic health `UP/DOWN` không dependency detail | Không đưa dữ liệu cá nhân/nội bộ. |

## MongoDB Boundary Và Access Pattern

```text
API Controller
  -> Application Service (authorization + business rule)
      -> Repository (approved query, pagination, projection)
          -> MongoDB Collection / Index

Không có đường Browser/ReactJS -> MongoDB trực tiếp.
Không dùng request body/query chưa validate làm MongoDB filter/update trực tiếp.
```

| Quy tắc | Cách thực hiện |
| --- | --- |
| Query theo màn hình thật | Tối ưu Student To-do, Teacher Course Dashboard/Ranking, Admin role-specific User Lists trước. |
| Projection mặc định | Chỉ select trường cần thiết; tuyệt đối loại `passwordHash`, `tokenHash`, token raw. |
| Pagination | List lớn dùng `page/limit` hoặc cursor theo chuẩn mục 11; có max limit. |
| Index review | Index dựa trên filter/sort thật; kiểm tra query plan với dataset thực tế trước khi thêm index rộng. |
| Unique invariant | Unique email, unique enrollment `classroomId + studentId`, token hash/code rule được enforcement bằng index + service validation. |
| Soft delete/archive | Archive/status trước; không xóa dữ liệu học tập làm mất traceability. |
| Migration | Version schema/enum/index có migration plan, backup và rollback/forward-fix note. |

Chi tiết collection/index bắt buộc xem tại `../10-data-requirements/mongodb-data-model.md` và `../10-data-requirements/data-indexing-query-strategy.md`.

## Read Model Và Tính Nhất Quán

### Mục Đích

`CourseProgressSummary` và `StudentTodoItem` phục vụ đọc nhanh các màn hình thường xuyên. Chúng có thể được tạo khi content/publish/deadline/progress/submission/grade thay đổi, hoặc được rebuild theo batch có kiểm soát.

| Read model | Được dùng cho | Source data | Trigger cập nhật | Có thể rebuild? |
| --- | --- | --- | --- | --- |
| StudentTodoItem | Student Dashboard To-do, Calendar | Enrollment, activity, deadline, completion/submission | publish, deadline reset, completion, submission, enrollment status change | Có |
| CourseProgressSummary | Teacher ranking, Student course summary | Progress, quiz attempt, submission, grade, required activity | completion, grading, regrade, activity publish, enrollment change | Có |
| ReportSnapshot | Admin report theo kỳ | Operational/learning collections | scheduled/manual authorized report job | Có, theo definition/version |

### Quy Tắc Nhất Quán

- Mutation nguồn dữ liệu phải thành công trước khi cập nhật read model.
- Nếu cập nhật summary thất bại sau mutation, hệ thống phải log/alert và có cơ chế retry hoặc rebuild, không âm thầm bỏ qua.
- UI có thể hiển thị `recalculatedAt` khi dữ liệu tổng hợp không real-time tuyệt đối.
- Công thức `processScore`, late/missing và thứ tự ranking phải có một implementation backend duy nhất, không nhân bản thành công thức độc lập ở ReactJS.
- Deadline reset bắt buộc lưu `oldDeadline`, `newDeadline`, `changedBy`, `changedAt`, `reason`; sau đó refresh To-do/Calendar và trạng thái liên quan.

## File Và Media Architecture

```text
Teacher/Student selects file
  -> API validates identity, permission, ownership, type, size, allowed purpose
  -> API issues controlled upload flow OR receives bounded upload
  -> Object storage stores private object
  -> API stores metadata: owner, resource type/id, object key, mime type, size, scan/status
  -> Authorized client requests download/view URL
  -> API checks access and returns controlled/signed URL or proxied response
```

| Điều kiện | Requirement kiến trúc |
| --- | --- |
| Object key | Do server sinh; không dùng nguyên file name từ client làm path tin cậy. |
| Access | Object bucket private by default; public URL chỉ khi nội dung được Product Owner/Technical Lead cho phép. |
| Validation | Allowlist MIME/type, size limit, purpose/resource ownership; file name chỉ là metadata. |
| Question media | Image/video là optional; chỉ Teacher có quyền quản lý Question của Course mình sở hữu. |
| Lifecycle | File orphan phải có cleanup policy có kiểm soát; không xóa object còn được tham chiếu. |
| Future hardening | Virus scan, direct signed upload, video transcoding/CDN là hướng mở rộng khi có nhu cầu và hạ tầng. |

## Backup, Restore Và Retention

| Thành phần | Backup/retention direction | Khôi phục |
| --- | --- | --- |
| MongoDB transactional data | Managed snapshot/backup theo strategy mục 13 và mục 15 | Restore vào isolated environment trước, xác minh data/integrity, sau đó thực hiện runbook. |
| Object storage | Versioning/lifecycle/replication theo provider policy nếu cần | Restore object theo key/version; kiểm tra metadata reference. |
| Audit data | Retention theo privacy/compliance và nhu cầu điều tra | Không sửa audit record để “khớp” dữ liệu hiện tại. |
| Read model | Có backup cùng database nhưng có thể rebuild | Rebuild từ source data khi corruption/stale. |
| Logs | Retention trên monitoring/log platform | Dùng để trace, không thay thế backup dữ liệu nghiệp vụ. |

Không thực hiện destructive restore trực tiếp trên Production chỉ vì kiểm tra. DevOps phải tuân `../15-devops-deployment/rollback-strategy.md` và restore runbook đã được test.

## Data Lifecycle Ví Dụ

| Data | Create | Active use | Archive/delete direction |
| --- | --- | --- | --- |
| TeacherInvitation | Admin create | Pending -> Accepted/Revoked/Expired | Giữ record/audit theo retention; raw token không lưu. |
| Enrollment | Student join/Admin action | Active/Inactive/Removed | Preserve history nếu quy tắc nghiệp vụ yêu cầu. |
| Lesson deadline | Teacher publish/reset | Student To-do/progress use | Giữ deadline history, không overwrite mất dấu vết. |
| Submission/Grade | Student submit/Teacher grade | Student/Teacher view, ranking | Không hard delete nếu ảnh hưởng kết quả học tập. |
| Media object | Authorized upload | Viewed/downloaded by authorized users | Cleanup orphan/expired file theo policy và audit. |

## Kiểm Tra Thiết Kế Dữ Liệu Trước Khi Code

- Mỗi collection mới có owner module, purpose, schema/validation, index, retention và API exposure được ghi nhận.
- Query của Student To-do, Teacher ranking, Admin Student/Teacher/Admin lists có pagination/filter/sort và index phù hợp.
- Mọi update liên quan score/progress/deadline có idempotency/retry/rebuild consideration.
- Backup scope chứa dữ liệu học tập, account, invitation, audit, settings và media policy liên quan.
- Test authorization xác nhận Student/Teacher/Admin không đọc chéo dữ liệu ngoài quyền.
