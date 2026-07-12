# Reporting And Analytics Overview

## Mục Đích

Mục 16 xác định cách hệ thống biến dữ liệu học tập và dữ liệu vận hành thành thông tin có thể hành động cho Student, Teacher, Admin, Product Owner và đội kỹ thuật. Mục tiêu không phải tạo thật nhiều biểu đồ, mà giúp mỗi vai trò trả lời đúng câu hỏi trong đúng phạm vi quyền của họ.

## Phân Biệt Reporting Và Analytics

| Khái niệm | Câu hỏi trả lời | Ví dụ trong hệ thống |
| --- | --- | --- |
| Reporting | “Hiện trạng hoặc kết quả đã được xác định là gì?” | Student nào chưa nộp Assignment? Tiến độ Course của từng Student là bao nhiêu? Có bao nhiêu Teacher Invitation pending? |
| Dashboard | “Thông tin quan trọng nào cần xem nhanh để hành động?” | Student To-do; Teacher Course Dashboard; Admin platform overview. |
| Analytics | “Xu hướng, hành vi hoặc điểm nghẽn nào cần cải thiện?” | Lesson nào có completion thấp? Funnel từ join Classroom đến complete Lesson ra sao? Active user biến động thế nào? |
| Audit/Operational log | “Ai đã làm gì, khi nào, với resource nào?” | Teacher reset deadline, Admin revoke invitation, deployment failure. Đây không phải product analytics. |

## Mục Tiêu Theo Vai Trò

| Role | Quyết định cần hỗ trợ | Reporting/analytics cần có |
| --- | --- | --- |
| Student | Việc nào cần làm, tiến độ của mình, điểm/feedback của mình | To-do, deadline, completion, quiz/assignment result, personal learning summary. |
| Teacher | Nội dung/lớp nào cần hỗ trợ, Student nào đang chậm, kết quả học tập ra sao | Roster, completion/late/missing, process score ranking, assessment performance, course engagement. |
| Admin | Hệ thống/user/classroom hoạt động ra sao, governance có vấn đề gì | Role-specific user counts/list, invitation/account/classroom status, aggregate adoption, audit/report export activity. |
| Product Owner | Sản phẩm có được sử dụng và tạo giá trị không | Activation, engagement, completion, feature adoption, trend; ưu tiên aggregate/de-identified. |
| Technical Lead/DevOps | Báo cáo/analytics có đáng tin và không làm hại hệ thống không | Data freshness/quality, query performance, job failure, export/audit/retention. |

## Nguyên Tắc Báo Cáo Và Analytics

| ID | Nguyên tắc | Áp dụng |
| --- | --- | --- |
| RA-01 | Purpose before metric | Mỗi report/metric phải có câu hỏi nghiệp vụ, owner, audience và action mong đợi. |
| RA-02 | One definition of truth | Công thức progress, process score, late/missing, active user được định nghĩa một lần ở backend/data layer. |
| RA-03 | Scope-aware access | Student chỉ xem dữ liệu mình; Teacher chỉ Classroom/Course có quyền; Admin theo governance permission. |
| RA-04 | Source data before summary | Dashboard read model/snapshot tăng tốc đọc nhưng có nguồn dữ liệu và khả năng rebuild rõ. |
| RA-05 | Freshness visible | Mọi aggregate/snapshot phải có `asOf` hoặc `recalculatedAt`; không ngầm tuyên bố real-time. |
| RA-06 | Privacy by design | Analytics event/report export tối thiểu dữ liệu, không có secret/raw token/password/PII không cần thiết. |
| RA-07 | Filter and export are authorization actions | Filter không được mở rộng scope; export phải kiểm tra quyền, giới hạn data và audit khi nhạy cảm. |
| RA-08 | Optimize measured queries | Pagination, index, projection, aggregate/read model; không quét toàn bộ MongoDB cho mỗi chart. |
| RA-09 | Explain limitations | Metric có denominator, timezone, data window, exclusion rule và limitation rõ. |

## Phạm Vi MVP Và Hướng Mở Rộng

| Area | MVP/Current direction | Future direction, cần phê duyệt riêng |
| --- | --- | --- |
| Student | Personal To-do, progress, grade/feedback, deadline status | Learning streak, recommendation, certificate/badge, advanced personal insights. |
| Teacher | Course Dashboard, roster, ranking, activity/assessment completion, student needing support | Cohort comparison, question difficulty/discrimination, automated intervention suggestion. |
| Admin | User/Classroom/Course status, invitation/account governance, basic aggregate adoption/audit | Organization/department multi-tenant BI, scheduled executive report, external warehouse. |
| Product analytics | Core event catalog, basic activation/engagement/completion trend | Third-party product analytics provider, experimentation/A-B testing, predictive analytics. |
| Export | Controlled on-demand CSV/format selected by scope, if feature approved | Scheduled email/export, BI connector, bulk data warehouse sync. |

`Certificate earned` không thuộc baseline feature hiện tại; không được xuất hiện trong metric/report MVP cho đến khi Certificate feature được Product Owner phê duyệt.

## Bản Đồ Tài Liệu Mục 16

| Tài liệu | Nội dung |
| --- | --- |
| `reporting-analytics-overview.md` | Phạm vi, nguyên tắc, role và roadmap. |
| `reporting-requirements.md` | Functional requirements có mã định danh cho report/dashboard/export. |
| `report-catalog.md` | Danh mục report/dashboard, owner, audience, filter, freshness và action. |
| `metric-definitions.md` | Định nghĩa/công thức/denominator/timezone cho metric. |
| `dashboard-metrics.md` | Bố cục metric theo Student/Teacher/Admin/Product/Operations dashboard. |
| `analytics-data-model.md` | Source data, read model, snapshot, refresh và query architecture. |
| `analytics-event-tracking.md` | Event taxonomy, schema, catalog, implementation/quality rules. |
| `reporting-access-export.md` | RBAC, row-level scope, export lifecycle và audit. |
| `analytics-privacy-data-quality.md` | Privacy, retention, consent direction, data quality/reconciliation. |
| `reporting-operations.md` | Monitoring job/report, incident handling, release/change governance. |

## Liên Kết Với Các Section Khác

| Section | Cách mục 16 sử dụng |
| --- | --- |
| `05-user-roles` | Role, permission và object-level access. |
| `07-requirements` / `09-use-cases` | Chức năng nghiệp vụ tạo source data/report action. |
| `10-data-requirements` | Collection, retention, index và privacy source data. |
| `11-api-requirements` | Endpoint/API contract cho dashboard/report/export. |
| `12-ui-ux-requirements` | Dashboard state, table/filter/pagination/export experience. |
| `13-non-functional-requirements` | Performance, privacy, security, logging/monitoring quality gate. |
| `14-solution-architecture` | Read model, data ownership, rebuild strategy. |
| `15-devops-deployment` | Observability/deployment record/backup cho reporting operations. |

## Điều Kiện Hoàn Thành

- Mỗi dashboard/report MVP có audience, business question, metric definition, data scope, freshness và owner rõ.
- Teacher/Admin/Student không thể dùng filter, URL hoặc export để đọc dữ liệu ngoài quyền.
- Metric quan trọng có test/reconciliation từ source data và `asOf`/freshness label.
- Event tracking không làm lộ PII/secret và không được dùng làm nguồn điểm/tiến độ chính thức.
- Query/report nặng có pagination/index/snapshot/read model hoặc giới hạn phù hợp trước khi đưa vào release.
