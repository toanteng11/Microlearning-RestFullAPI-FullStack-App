# Dashboard Metrics

## Mục Đích

Tài liệu này xác định metric được ưu tiên hiển thị trên từng dashboard. Đây là danh sách UX/operational priority, không thay thế công thức tại `metric-definitions.md` hoặc catalog tại `report-catalog.md`.

## Student Dashboard

Student Dashboard ưu tiên hành động học tập, không phải chart phức tạp.

| Priority | Metric/widget | Ý nghĩa | Interaction |
| --- | --- | --- | --- |
| Must | To-do summary | Pending, due soon, late/missing theo tất cả Classroom/Course active | Filter/status; mở activity. |
| Must | Upcoming deadlines | Deadline gần nhất với activity/classroom/course | Mở Calendar/To-do/activity. |
| Must | My progress by Course | Progress %, completed/required, `recalculatedAt` | Mở Course detail. |
| Must | Recent grade/feedback | Assessment đã grade/publish cho Student | Mở result/feedback. |
| Should | Recent learning activity | Lesson/Quiz/Assignment vừa complete/submit | Mở activity history. |
| Could | Personal completion trend | Xu hướng complete theo tuần nếu definition/data quality đủ | Chỉ self data, có date range. |

Không hiển thị certificate/badge cho đến khi chức năng certificate được đưa vào scope.

## Teacher Course Dashboard

Teacher Dashboard ưu tiên phát hiện Student cần hỗ trợ và kiểm soát nội dung/deadline.

| Priority | Metric/widget | Ý nghĩa | Default/filter/sort | Action |
| --- | --- | --- | --- | --- |
| Must | Course activity overview | Lesson/Quiz/Assignment published/draft, deadline/required status | Module/type/status/due | Publish/edit/reorder/reset deadline. |
| Must | Roster summary | Active enrollment, join/removed status | Classroom/Course/status | Open Student roster. |
| Must | Progress ranking | Process score, progress, completed/required, late/missing, last active | Process Score DESC default; pagination/filter | Open Student detail/support. |
| Must | Completion by activity | Completed/not-started/in-progress/late/missing count/rate | Activity/deadline/status | Identify blocked content/Student. |
| Must | Assessment status | Submit/graded/ungraded/late/missing count | Quiz/Assignment/date | Grade/feedback. |
| Should | Assessment performance | Average score, distribution, feedback coverage | Assessment/date | Review content/question/teaching. |
| Should | Students needing support | Rule-based list: missing/late/high inactivity/low progress according to visible criteria | Threshold/filter clearly displayed | Open Student detail; no automated judgment. |
| Could | Engagement trend | Start/complete event trend by Lesson/period | Course/date | Improve content pacing. |

`Students needing support` phải hiển thị lý do rule (ví dụ `2 missing items`, `no activity for N days`) và không gắn nhãn suy diễn như “học kém”. Threshold là policy cấu hình, không hard-code frontend.

## Admin Dashboard

Admin Dashboard phân biệt dữ liệu governance và aggregate adoption. Nó không mặc định là công cụ để Admin xem nội dung/điểm chi tiết của mọi Course nếu permission policy không cấp.

| Priority | Metric/widget | Ý nghĩa | Filter/action |
| --- | --- | --- | --- |
| Must | User status summary | Student/Teacher/Admin total, active/inactive/blocked | Role/status -> role-specific list. |
| Must | Teacher invitation summary | Pending/accepted/expired/revoked count | Date/status -> invitation management. |
| Must | Classroom/Course governance | Active/archive Classroom, published/archived Course | Owner/status/date -> governance view. |
| Must | Recent audit activity | Privileged action/event count/list per permission | Actor/action/date -> audit detail. |
| Should | Platform adoption | DAU/WAU, new enrollment, active Classroom/Course trend | Date/granularity -> aggregate trend. |
| Should | Aggregate learning outcomes | Overall completion/assessment/late-missing trend if governance scope approved | Course/Classroom/date -> support planning. |
| Should | Report export activity | Export count/status/failure/audit | Actor/report/date -> investigate. |
| Could | Storage/operational capacity | File storage usage/report job health | Environment/date -> DevOps handoff. |

## Product And Operations Dashboard

| Audience | Metric | Purpose |
| --- | --- | --- |
| Product Owner | Activation funnel, engagement trend, join method adoption, content completion trend | Prioritize product improvement using aggregate/de-identified view. |
| Technical Lead | Report API p95, summary freshness, reconciliation difference, invalid event rate | Protect report correctness/performance. |
| DevOps | Report job success/failure, export processing time, monitoring/backup/deployment correlation | Operate reporting infrastructure. |

## Visual And Interaction Rules

- Card metric luôn có label, value, scope/time range và `asOf` khi aggregate; không chỉ màu để biểu đạt trạng thái.
- Table cho roster/ranking/audit data cần server pagination, sortable column allowlist, filter reset và empty/loading/error state.
- Chart chỉ dùng khi có trend/comparison theo thời gian/dimension rõ; một con số hiện trạng dùng summary text/card nhỏ gọn hơn.
- Tooltip/label giải thích metric có thể mang nghĩa khác nhau như `Progress` và `Process Score`.
- Export/button chỉ xuất hiện khi role/scope feature cho phép; backend vẫn bắt buộc authorization.
- Không hiển thị cross-Classroom Student personal data trong chart aggregate có nguy cơ re-identification ở nhóm quá nhỏ; dùng threshold/aggregate policy.
