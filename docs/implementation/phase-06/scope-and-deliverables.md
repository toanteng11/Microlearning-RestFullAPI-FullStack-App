# Phase 06 Scope And Deliverables

## 1. Scope Statement

Phase 06 cung cấp reporting/analytics phục vụ quyết định hằng ngày trong LMS nội bộ. Phạm vi
được giới hạn ở dữ liệu Phase 02-05, kiến trúc Modular Monolith và dataset MVP. Hệ thống phải
ưu tiên tính đúng, quyền truy cập và khả năng giải thích metric trước số lượng biểu đồ.

## 2. Actor Scope

| Actor | Được phép | Không được phép |
| --- | --- | --- |
| Student | Xem To-do, progress, process score, returned Grade và trend của chính mình trong active enrollment | Truyền Student ID khác để xem; xem ranking toàn lớp; xem draft Grade |
| Teacher | Xem dashboard/Gradebook/ranking/student detail của owned Course | Xem Course không sở hữu; đọc answer key/raw answer ngoài grading workflow |
| Admin | Xem user/classroom/course/invitation/audit metadata và aggregate được phép | Xem Submission body, raw answer, draft Grade/private feedback |
| Super Admin | Có capability quản trị/reporting theo permission catalog | Không được bỏ audit/privacy/projection chỉ vì có role cao |
| System/DevOps | Rebuild/reconcile read model bằng command có kiểm soát | Sửa transactional source bằng reporting repair script |

## 3. Must Functional Scope

### 3.1 Student Reporting

- Dashboard trả Classroom summary, tối đa số To-do item cấu hình, due soon/missing count,
  Course progress và recent returned Grade.
- To-do tiếp tục dùng `P05_MIXED_ACTIVITY_TODO_V2`, không tạo logic status riêng.
- Progress trả required/completed, progress percentage, process score, status, last active,
  definition version và freshness theo Course.
- Grade projection chỉ dùng current Grade có status `RETURNED` của Student hiện tại; runtime
  P05 không có Grade status `RELEASED`.
- Mọi endpoint tự lấy `actor.id`; không nhận `studentId` từ client.

### 3.2 Teacher Course Reporting

- Dashboard summary gồm active roster, required activity, average progress, completion,
  missing/late/ungraded count và top Student.
- Activity table gồm type, title, deadline, required, completed/active, completion rate,
  missing/late count và assessment average nếu áp dụng.
- Ranking phân trang phía server, search theo safe Student projection, filter theo progress
  status/support flag và sort allowlist.
- Student detail gồm summary, activity status, current returned Grade và timeline metadata đủ
  để Teacher hỗ trợ; không chứa answer body.
- Dashboard và detail đều bắt buộc owned Course check trước khi query dữ liệu Student.

### 3.3 Gradebook

- Cột được tạo từ published/closed required hoặc gradable activity trong owned Course.
- Hàng được tạo từ active Student roster; không tạo placeholder Grade/Submissions.
- Mỗi ô derive hai chiều độc lập:
  - `completionStatus`: `NOT_APPLICABLE`, `NOT_STARTED`, `IN_PROGRESS`, `MISSING`,
    `COMPLETED`, `LATE`;
  - `gradingStatus`: `NOT_GRADABLE`, `NOT_READY`, `AWAITING_GRADE`, `DRAFT`, `RETURNED`.
- `displayStatus` chỉ là projection cho UI compact theo precedence đã khóa trong
  `course-gradebook-and-ranking.md`; filter/query không dựa vào `displayStatus`.
- Score hiển thị chỉ là current Grade phù hợp projection; Grade revision history chỉ có ở
  authorized detail.
- Table hỗ trợ server pagination theo Student và bounded activity columns.

### 3.4 Admin Reporting

- Dashboard: user counts theo đủ actual `UserStatus` cho từng role; Classroom/Course count theo
  đủ actual lifecycle status; invitation count theo đủ lifecycle status và recent governance
  activity.
- Governance report có filter date/role/status nhưng server luôn ép organization/system scope.
- Learning aggregate chỉ được bật khi đạt small-group threshold, không chứa Student identity.
- Audit report tái sử dụng AuditLog, projection an toàn và pagination.

### 3.5 Metric And Freshness

- Metric registry đóng băng ID, version, source, numerator, denominator, rounding và empty rule.
- `P06_PROCESS_SCORE_V1` dùng progress percentage; frontend chỉ render giá trị/definition.
- Read model có `asOf`, `recalculatedAt`, `metricVersion`, `sourceVersion` và freshness status.
- Rebuild/reconcile không sửa nguồn giao dịch và có audit/structured log.

### 3.6 Quality And Operations

- OpenAPI có schema/example/error cho toàn bộ route P06.
- Test cover RBAC/IDOR/projection/formula/stale/partial/rebuild/export safety.
- Seed tạo deterministic dataset gồm top/middle/at-risk/no-data Student.
- Dashboard aggregate p95 đạt `<= 1500ms` với dataset NFR tối thiểu liên quan.
- CI giữ lint, typecheck, unit/integration, OpenAPI, browser E2E, audit và secret scan.

## 4. Conditional Scope

| Capability | Điều kiện bật | Fallback khi không bật |
| --- | --- | --- |
| Teacher/Admin CSV export | Gate A approve, feature flag, bounded rows/date, audit và injection tests Pass | UI không render nút export |
| Analytics event | Privacy schema review, dedupe và retention approved | Không ảnh hưởng transactional reporting |
| Student trend | Có tối thiểu hai valid snapshots và definition version tương thích | `NO_DATA`, không dựng chart giả |
| Admin outcome aggregate | Group size đạt threshold, privacy tests Pass | Chỉ governance metadata |
| Weighted score V2 | Product Owner duyệt formula/weights/history/migration | Giữ `P06_PROCESS_SCORE_V1` |

## 5. Deferred Scope

- XLSX, scheduled report, email report, public download link.
- Persistent export file/job trước private GCS và Phase 07 worker/scheduler.
- Cross-organization tenancy, data warehouse, external BI connector.
- Predictive analytics, AI recommendation, at-risk model không giải thích.
- Notification delivery, chat, video, transcript và grade category engine.

## 6. Deliverables

### 6.1 Backend

- `reporting` module composition, metric policies, scope resolver và DTO projections.
- Student, Teacher và Admin reporting endpoints.
- `CourseProgressSummary` read model, invalidation/rebuild/reconcile command.
- Conditional CSV exporter và analytics event writer.
- Permission, rate/bound, logging, audit và error contracts.

### 6.2 Frontend

- Student Dashboard/Progress/Grade integration.
- Teacher Course Analytics, Gradebook, Ranking và Student Detail.
- Admin Dashboard/Reports/Audit navigation.
- Shared metric/freshness/filter/table/export components.
- Loading, empty, no-data, stale, partial, error, forbidden và responsive states.

### 6.3 Data And Contract

- Metric definition registry và runtime version constants.
- MongoDB collections/indexes, migration, rollback và reconciliation.
- OpenAPI schemas/examples, API/UI matrix và compatibility tests.
- Seed fixture và benchmark dataset.

### 6.4 Quality And Evidence

- Unit/integration/component/OpenAPI/E2E/security/performance tests.
- Explain plans cho query/index chính.
- Docker, clean clone, CI URL, screenshots và phase exit report.
- Phase 07 handoff cho Cloud Run/Atlas/GCS/observability.

## 7. Dependency Contract

| Dependency | Contract tiêu thụ | Rule |
| --- | --- | --- |
| P02 Identity | Active actor, role, capabilities, safe User projection | Không bypass auth/status |
| P03 Classroom | Ownership, roster, active enrollment, governance scope | Scope trước query |
| P04 Content | Course/Activity visibility, required flag, deadline | Không tính draft/archived sai policy |
| P05 Assessment | `P05_ACTIVITY_DESCRIPTOR_V2`, lifecycle/result sources | Không đọc raw answer/answer key cho reports |
| P05 Progress | `P05_REQUIRED_ACTIVITY_COMPLETION_V1`, To-do V2 | Không đổi completion semantics |
| P05 Grade | Current Grade + immutable revision | Student/Admin projection theo privacy |
| P07 | GCS, scheduler, deployment/monitoring | Không dựng local-disk workaround |

## 8. Phase Boundary Rules

- P06 được thêm read adapter/port, không được import model xuyên domain vào reporting service.
- P06 không làm thay đổi thành công/thất bại của learning mutation chỉ vì summary refresh lỗi.
- P06 không mở rộng actor visibility của P05.
- Mọi Conditional item mặc định disabled và không làm hỏng Must path.
- Breaking change tới P05 contract cần ADR/change record, migration, OpenAPI và regression test.

## 9. Definition Of Done

- Từng Must capability có runtime route, React path, Mongo query/read model, test và evidence.
- `processScore` không hard-code ở Web và có definition/version.
- Stale/partial/no-data không bị trình bày như dữ liệu fresh.
- Teacher/Admin không thể mở rộng scope qua query/filter/export.
- Performance target được đo bằng fixture có quy mô ghi rõ.
- Conditional N/A phải có lý do/approval; không tính N/A là Pass tự động.
- Handoff P07 có env, index, migration, storage và observability dependency.
