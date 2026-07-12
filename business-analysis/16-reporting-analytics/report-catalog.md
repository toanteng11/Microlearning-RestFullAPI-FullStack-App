# Report Catalog

## Mục Đích

Danh mục này mô tả report/dashboard chính, người được xem, câu hỏi nghiệp vụ, filter, độ mới dữ liệu và hành động tiếp theo. Một report chỉ được xem là hoàn chỉnh khi các cột trong catalog có câu trả lời; không tạo chart chỉ vì dữ liệu tồn tại.

## Student Reports And Dashboards

| ID | Report/Dashboard | Business question | Audience/scope | Key metrics | Filter | Freshness | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RPT-STU-001 | Student To-do Dashboard | Tôi còn việc gì, deadline nào gần/quá hạn? | Student tự xem | pending, due soon, late/missing count | Classroom, Course, due range, status | Current/read model `asOf` | Mở Lesson/Quiz/Assignment để làm/nộp. |
| RPT-STU-002 | My Classroom/Course Progress | Tôi đã hoàn thành bao nhiêu và còn gì? | Student enrolled | progress %, completed/required, last activity | Classroom/Course | `recalculatedAt` | Tiếp tục Lesson/Activity. |
| RPT-STU-003 | My Assessment Result | Tôi đạt điểm nào và có feedback gì? | Student self only | quiz score, assignment score/status, feedback presence | Course, activity, date | Current after grade publish | Xem feedback/resubmit nếu policy cho phép. |
| RPT-STU-004 | My Learning Timeline | Những hoạt động/deadline gần đây là gì? | Student self only | completed/submitted/due event | Date, Classroom/Course | Current | Điều hướng tới activity liên quan. |

## Teacher Reports And Dashboards

| ID | Report/Dashboard | Business question | Audience/scope | Key metrics | Filter/sort | Freshness | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RPT-TEA-001 | Teacher Course Dashboard | Course có những Lesson/Activity nào, deadline ra sao? | Owner/authorized Teacher, one Course | published/draft activity, deadline, required status | Module, activity type, status, due range | Current | Publish/edit/reorder/reset deadline. |
| RPT-TEA-002 | Course Progress Ranking | Student nào có process score/progress cao/thấp? | Teacher Course scope | process score, progress %, completed, late/missing, last active | Sort process score DESC default; filter status | Summary `recalculatedAt` | Identify/support Student; inspect detail. |
| RPT-TEA-003 | Roster Completion Report | Ai chưa hoàn thành Lesson/Activity bắt buộc? | Teacher Classroom/Course scope | completed/not started/in progress/late/missing | Activity, status, due date, Student | Current/read model | Reminder/support/reset deadline when exception. |
| RPT-TEA-004 | Assessment Performance | Quiz/Assignment có kết quả thế nào? | Teacher Course/assessment scope | attempts, submit rate, avg/median score if enabled, score distribution, late/missing | Assessment, date, Student group if approved | Current after grading | Review question/content, grade/feedback. |
| RPT-TEA-005 | Student Learning Detail | Một Student cần hỗ trợ ở đâu? | Teacher only within owned scope | activity history, progress, score, feedback, deadline status | Student, Course, date | Current/summary as-of | Provide feedback or adjust instruction. |
| RPT-TEA-006 | Content Engagement Summary | Lesson nào ít được bắt đầu/hoàn thành? | Teacher owned Course only | start/complete count/rate, median completion time if collected | Course, module, period | Event/aggregate `asOf` | Improve content/deadline/support. |

## Admin Reports And Dashboards

| ID | Report/Dashboard | Business question | Audience/scope | Key metrics | Filter | Freshness | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RPT-ADM-001 | User Administration Summary | Account theo Student/Teacher/Admin status ra sao? | Admin permission scope | total/active/inactive/blocked by role | Role, status, keyword, created range | Current/list query | Manage status/role per policy. |
| RPT-ADM-002 | Teacher Invitation Report | Invitation pending/accepted/expired/revoked ra sao? | Admin | count/status/expiry/accept rate | Date, status, Teacher email search | Current | Copy/revoke/create invitation. |
| RPT-ADM-003 | Classroom/Course Governance | Lớp/Course active/archive/publish ra sao? | Admin governance | classroom/course count by status, owner, enrollment summary | Teacher, status, date | Current/aggregate | Review governance/archiving. |
| RPT-ADM-004 | Platform Adoption Trend | Platform được dùng theo thời gian ra sao? | Admin/PO authorized aggregate | active users, new enrollment, active Classroom, publish/completion trend | Date/granularity/role | Aggregate `asOf` | Review adoption/release impact. |
| RPT-ADM-005 | Learning Outcome Aggregate | Tổng quan progress/assessment theo Classroom/Course? | Admin only if governance policy grants | aggregate completion, score, late/missing trend | Course/Classroom/date | Aggregate `asOf` | Identify organization-level support; no cross-class exposure to Teacher. |
| RPT-ADM-006 | Audit And Export Activity | Có hành động quản trị/report export nhạy cảm nào? | Admin/Super Admin permission | audit count/action/status/export event | actor, action, date, resource | Current/audit log | Investigate governance/security. |

## Product And Operational Analytics

| ID | Analytics view | Business question | Audience | Metrics | Data source | Use limitation |
| --- | --- | --- | --- | --- | --- | --- |
| ANA-PRD-001 | Activation Funnel | User có đi từ account active đến join/learning không? | Product Owner/authorized team | activated -> joined -> started -> completed | Authoritative records + event | Aggregate/de-identified; not used to grade Student. |
| ANA-PRD-002 | Engagement Trend | Người dùng hoạt động có tăng/giảm? | Product Owner/Admin authorized | DAU/WAU, active Classroom/Course, event volume | Auth/activity event + operational data | Definition/timezone must be shown. |
| ANA-PRD-003 | Feature Adoption | Class Code/Link, question media, deadline reset có được dùng? | Product Owner/Technical Lead | count/rate by feature/event | Analytics events/audit safe aggregate | No raw token/link/PII. |
| ANA-OPS-001 | Report Freshness/Job Health | Summary/report có stale/fail không? | Technical Lead/DevOps | last successful refresh, duration, error count, stale count | Job/monitoring logs | Operational only. |
| ANA-OPS-002 | Report/API Performance | Dashboard/export làm hệ thống chậm không? | Technical Lead/DevOps | p95 report API, timeout, export failure, query cost direction | API/monitoring logs | Does not replace business report. |

## Report Status And Empty State

| State | Meaning | UI/API behavior |
| --- | --- | --- |
| Ready | Query/snapshot successful | Show data + as-of/freshness where aggregate. |
| No data | Scope/filter hợp lệ nhưng không có record | Empty state, do not show zero as failure. |
| Partial | Một source/summary thiếu/stale nhưng safe partial output được cho phép | Explicit warning/as-of; do not silently mix incorrect totals. |
| Processing | Authorized export/snapshot đang tạo | Show request status; no repeated duplicate export clicks. |
| Failed | Query/job/export error | Safe error/requestId; retry/help path; do not expose internal error. |
| Access denied | Role/scope không hợp lệ | Return standard `403`/safe UI; do not reveal existence of restricted data. |

## Catalog Governance

- Thêm report mới phải có ID, owner, audience/scope, metric definition, data source/index impact, privacy/export decision và acceptance test.
- Xóa/đổi công thức report phải đi qua change control nếu làm thay đổi interpretation của score/progress/outcome.
- Report trong MVP ưu tiên các hành động có giá trị ngay: Student To-do, Teacher progress/ranking/roster, Admin governance.
- Dashboard cross-class/cross-Teacher comparison là Admin/PO scope; Teacher không tự xem dữ liệu lớp khác.
