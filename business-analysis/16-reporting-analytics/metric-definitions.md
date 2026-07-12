# Metric Definitions

## Mục Đích

Tài liệu này là data dictionary cho metric. Mỗi metric có owner, công thức, numerator/denominator, scope, source, freshness và caveat. Nếu UI, API, CSV và report dùng cùng tên metric thì phải dùng cùng định nghĩa này.

## Quy Ước Chung

| Quy ước | Rule |
| --- | --- |
| Thời gian | Store timestamp UTC; hiển thị/filter theo timezone được Product Owner cấu hình. MVP cần chốt timezone tổ chức (ví dụ `Asia/Ho_Chi_Minh`) trước khi dùng daily/weekly metric. |
| Khoảng thời gian | Date range xác định `[from, to]`, bao gồm/exclusive phải nhất quán API/UI. |
| Population | Ghi rõ chỉ account `ACTIVE`, enrollment `ACTIVE`, published activity hay tất cả record. |
| Missing value | `N/A` khi denominator bằng 0 hoặc chưa có dữ liệu; không tự hiển thị `0%` gây hiểu sai. |
| Rounding | Backend trả raw/precise value theo policy; UI làm tròn để hiển thị nhưng không đổi source metric. |
| Recalculation | Summary metric hiển thị `recalculatedAt`/`asOf`; deadline/grade/progress change có thể làm kết quả lịch sử thay đổi theo business rule. |
| Authoritative calculation | Backend/service/report job tính; frontend không tự tổng hợp khác công thức chính thức. |

## Student And Learning Metrics

| Metric ID | Metric | Definition / formula | Scope/source | Caveat |
| --- | --- | --- | --- | --- |
| MET-LRN-001 | Required Activity Count | Số Lesson/Quiz/Assignment có `isRequired=true` và published/assigned trong scope Course. | Course, activity data | Archive/unpublish rule phải được xác định để lịch sử không bị thay đổi sai. |
| MET-LRN-002 | Completed Required Activities | Số required activity có completion/submission/attempt thỏa completion policy. | LearningProgress, Submission, QuizAttempt | Từng activity type có completion policy riêng; không suy ra chỉ từ mở màn hình. |
| MET-LRN-003 | Progress Percentage | `(Completed Required Activities / Required Activity Count) * 100`. Trả `N/A` khi denominator = 0. | CourseProgressSummary hoặc rebuilt source | Không đồng nghĩa điểm số; show `asOf`. |
| MET-LRN-004 | Pending To-do | Activity assigned/published cho Student nhưng chưa completion/submission theo policy và chưa bị archived/removed. | StudentTodoItem/source data | Deadline thay đổi phải update/rebuild. |
| MET-LRN-005 | Due Soon | Pending To-do có deadline trong cửa sổ `dueSoonWindow` cấu hình. | StudentTodoItem | Window (ví dụ 24/48 giờ) phải được config/document, không hard-code UI. |
| MET-LRN-006 | Late Item | Required activity đã completed/submitted sau deadline theo timezone/policy. | Progress/Submission/Attempt + deadline | Nếu Teacher reset deadline, late status được recalculated và history giữ lại. |
| MET-LRN-007 | Missing Item | Required activity quá deadline nhưng chưa complete/submit theo policy. | StudentTodoItem/source data | Không áp dụng nếu activity không deadline hoặc policy allow late khác. |
| MET-LRN-008 | Last Active At | Thời điểm activity authenticated gần nhất được hệ thống chọn làm “active”. | User/analytics activity | Không dùng để suy luận chính xác thời gian học; definition event phải nhất quán. |
| MET-LRN-009 | Course Completed | `true` khi tất cả điều kiện completion Course được policy định nghĩa thỏa. | Progress/grade policy | Không tự tạo certificate vì certificate chưa thuộc MVP. |

## Assessment And Grade Metrics

| Metric ID | Metric | Definition / formula | Scope/source | Caveat |
| --- | --- | --- | --- | --- |
| MET-ASM-001 | Quiz Submit Rate | `(Student có quiz attempt/submission hợp lệ / Student active enrollment được giao quiz) * 100`. | QuizAttempt, Enrollment | Cần xác định counted attempt và quiz availability. |
| MET-ASM-002 | Assignment Submit Rate | `(Student có submission hợp lệ / Student active enrollment được giao assignment) * 100`. | Submission, Enrollment | Returned/resubmitted status theo business rule. |
| MET-ASM-003 | Average Score | `sum(score of included graded records) / count(included graded records)`. | Grade/QuizAttempt | Loại record ungraded/invalid; scale/maximum phải kèm context. |
| MET-ASM-004 | Median Score | Middle value sau sort score included; nếu count chẵn dùng average two middle values. | Grade/QuizAttempt | Should/future nếu dataset/UX thực sự cần; không thay Average Score mặc định. |
| MET-ASM-005 | Score Distribution | Số/percent record theo band score do policy cấu hình. | Grade/QuizAttempt | Band phải hiện rõ scale, không so sánh assessment có max score khác nhau sai cách. |
| MET-ASM-006 | Process Score | Điểm quá trình do backend tính theo công thức/chính sách Course được phê duyệt. | CourseProgressSummary/Grade | Công thức chưa chốt không được hard-code vào UI; ranking default sort DESC. |
| MET-ASM-007 | Feedback Coverage | `(Graded/returned submission có feedback theo policy / included graded/returned submission) * 100`. | Feedback, Submission | Optional metric; feedback blank vs no feedback cần definition. |

## Classroom, User And Platform Metrics

| Metric ID | Metric | Definition / formula | Scope/source | Caveat |
| --- | --- | --- | --- | --- |
| MET-CLS-001 | Active Enrollment | Enrollment có status `ACTIVE` tại thời điểm `asOf`. | Enrollment | Không cộng removed/left; historical roster report cần date-as-of logic. |
| MET-CLS-002 | Active Classroom | Classroom status `ACTIVE` theo scope/time. | Classroom | “Có hoạt động gần đây” là metric khác, không đồng nghĩa active status. |
| MET-CLS-003 | Published Course | Course status `PUBLISHED` tại `asOf`. | Course | Không đồng nghĩa có Student activity. |
| MET-USR-001 | Active Account | User status `ACTIVE` tại `asOf`. | User | Không đồng nghĩa active user usage. |
| MET-USR-002 | Daily Active User (DAU) | Distinct authorized user có ít nhất một event/activity “active” hợp lệ trong ngày timezone đã chọn. | Auth/activity event | Phải công bố event inclusion; không dùng login fail. |
| MET-USR-003 | Weekly Active User (WAU) | Distinct authorized user active trong rolling/calendar 7-day window đã định nghĩa. | Auth/activity event | Rolling vs calendar tuần phải chọn một cách nhất quán. |
| MET-PLT-001 | New Classroom Count | Count Classroom created trong date range. | Classroom `createdAt` | Không đo Classroom active/published. |
| MET-PLT-002 | New Enrollment Count | Count successful unique enrollment created trong date range. | Enrollment `joinedAt` | Rejoin/transfer policy cần thể hiện nếu có. |
| MET-PLT-003 | Overall Completion Rate | `sum completed required activities / sum required activity assignments` trong scope. | Progress/read model | Weighted by activity assignment, không phải average đơn giản Course %. |
| MET-PLT-004 | Invitation Acceptance Rate | `(accepted invitation / invitation created and eligible in period) * 100`. | TeacherInvitation | Exclude pending unexpired or state filter clearly. |

## Data Quality And Freshness Metrics

| Metric ID | Metric | Definition | Owner |
| --- | --- | --- | --- |
| MET-DQ-001 | Summary Freshness Lag | `now - recalculatedAt` của summary/snapshot. | Backend/DevOps |
| MET-DQ-002 | Report Refresh Success Rate | `(successful report jobs / total report jobs) * 100` trong period. | DevOps |
| MET-DQ-003 | Event Validation Failure Rate | `(rejected/invalid analytics events / received events) * 100`. | Technical Lead |
| MET-DQ-004 | Reconciliation Difference | Difference giữa summary metric và source-data recomputation theo sample/full check. | Backend + QA |

## Metric Change Governance

- Mọi metric mới/sửa phải cập nhật file này, API response/Swagger, UI label/tooltip, test scenario và report catalog.
- Nếu đổi Process Score, completion policy, date/timezone rule hoặc late/missing rule, phải đánh giá historical recalculation, ranking/report impact và audit/change communication.
- Không đổi definition chỉ để “làm đẹp” trend. Nếu cần, version metric/snapshot và phân biệt trend trước/sau thay đổi.
