# Phase 06 BA Alignment And Decisions

## 1. Mục Đích

Tài liệu này chuyển BA Reporting And Analytics thành baseline có thể code, đồng thời giải quyết
những điểm BA cho phép nhiều lựa chọn. BA vẫn là nguồn business intent; tài liệu P06 là
implementation refinement và không được tự ý mở rộng quyền actor.

## 2. Requirement Disposition

| BA source | Disposition P06 | Ghi chú |
| --- | --- | --- |
| `FR-049/050` Student Dashboard/To-do | Must, reuse/extend | Reuse `P05_MIXED_ACTIVITY_TODO_V2`; không tạo duplicate status engine |
| `FR-055` own Grade | Must, reuse/aggregate | Chỉ current Grade status `RETURNED` |
| `FR-059` Learning Progress | Must, preserve | Transactional Progress vẫn authoritative |
| `FR-060` Teacher Progress Dashboard | Must, extend | Bổ sung Quiz/Assignment/Grade/support metrics |
| `FR-061` ranking `processScore DESC` | Must | Stable tie-breaker do backend thực hiện |
| `FR-062` Basic Gradebook | Must trong P06 | Tiếp quản P05 conditional Gradebook và hoàn thiện UI/API |
| `FR-063` process score | Must | Chọn phương án BA cho phép: V1 bằng progress percentage |
| `FR-016` Admin Dashboard | Must | Governance metadata và aggregate an toàn |
| `FR-018` export | Conditional Should | CSV sync bounded; XLSX/async deferred P07 |
| `REP-001..015` | Must | Actor reports, filters, freshness, backend metric |
| `REP-016..020` | Conditional/Should | Export, async, event, monitoring tùy item |
| `BR-105..110` | Must rule | Áp dụng cho route/report/export/event |

## 3. Alignment Decisions

### D06-BA-001 - Process Score V1

BA nói MVP có thể dùng `processScore = progressPercentage` nhưng P05 handoff cho phép weighted
score. Hai phát biểu không mâu thuẫn: P06 chọn công thức đơn giản, giải thích được làm Must;
weighted score là V2 Conditional.

```text
requiredActivityCount = số required activity visible theo Course policy
completedRequiredCount = số required activity có canonical completed state
processScore = round(completedRequiredCount / requiredActivityCount * 100, 1)
```

Nếu denominator bằng `0`, API trả `null`, UI hiển thị `N/A`, Student không bị xếp hạng như
`0 điểm`.

### D06-BA-002 - Grade Không Đồng Nghĩa Process Score

Grade average là metric riêng. Không trộn score Quiz/Assignment vào process score V1. Điều này
tránh phát minh weight, tránh phạt Student vì Grade chưa được trả và giữ compatibility với
`P05_REQUIRED_ACTIVITY_COMPLETION_V1`.

### D06-BA-003 - Export Boundary

BA mô tả CSV/XLSX và export lifecycle. P05 handoff cấm local disk, còn private storage/worker
thuộc P07. P06 chỉ cho phép synchronous CSV stream với query bounded. XLSX, file job, private
download URL, TTL cleanup và scheduled export chuyển P07.

### D06-BA-004 - Read Model

BA cho phép on-demand query hoặc read model. P06 dùng hybrid:

- transactional source để xác thực/rebuild;
- `CourseProgressSummary` để ranking/dashboard ổn định;
- Student To-do tiếp tục query domain service hiện có;
- stale summary được công bố rõ và có repair path, không che lỗi bằng giá trị `0`.

### D06-BA-005 - Analytics Event

Analytics event là best effort. Event mất không làm mất Enrollment/Progress/Grade/AuditLog.
Chỉ backend-generated transaction events có thể dùng làm count tham khảo; báo cáo học tập
chính vẫn derive từ nguồn giao dịch.

### D06-BA-006 - Admin Learning Data

Admin Dashboard mặc định chỉ có governance metadata. Learning outcome aggregate cần threshold
và privacy review; Admin không được drill down tới Student answer/submission/feedback.

### D06-BA-007 - Trend

Trend chỉ dùng snapshots có cùng compatible metric definition. Nếu chưa đủ hai điểm dữ liệu,
trả `NO_DATA`; không nội suy hoặc dựng số giả.

### D06-BA-008 - Timezone

DB và event dùng UTC. API nhận timezone IANA có allowlist/config; mặc định
`Asia/Ho_Chi_Minh`. Date range được chuẩn hóa ở server và response luôn trả timezone đã dùng.

### D06-BA-009 - Runtime Permission Reuse

Existing Student/Teacher report routes giữ permission hiện có:

- Student Dashboard/Progress dùng `learning.view_enrolled`; own Grade vẫn dùng
  `grade.view_own`.
- Teacher Dashboard/Activities/Students/Progress dùng `course.progress_view_owned`.
- Teacher Gradebook giữ `grade.manage_owned`.

P06 chỉ thêm permission mới cho Admin reporting và export. Không tạo
`report.view_own/report.view_owned` trùng nghĩa rồi buộc toàn bộ route/UI đổi capability.

### D06-BA-010 - Grade Runtime Status

Runtime P05 chỉ có Grade `DRAFT` và `RETURNED`. P06 không dùng thuật ngữ `RELEASED` cho Grade.
`RESULT_RELEASED` là Quiz Attempt status riêng; khi dùng Grade aggregate, source vẫn là current
Grade `RETURNED`.

## 4. BA Gaps Được Bổ Sung

| Gap | Refinement |
| --- | --- |
| Tie-breaker ranking chưa đủ | Score DESC, completed DESC, missing ASC, late ASC, lastActive DESC, Student ID ASC |
| Denominator 0 chưa thống nhất runtime | Public reporting trả `null/N/A`, không trả `0%` |
| Grade average chưa định nghĩa | Weighted by possible points trên current returned Grade |
| Freshness chưa có vocabulary runtime | `FRESH/STALE/PARTIAL/REBUILDING/FAILED` |
| Export limit chưa có số | Baseline `5,000` rows, date range `365` days, cấu hình qua env |
| Small group chưa có số | Baseline `5`, cấu hình qua env; dưới ngưỡng không trả aggregate |
| Report sort/filter chưa allowlist | Mỗi endpoint có enum field/order; field lạ bị `400` |
| Refresh failure behavior chưa rõ | Source mutation không rollback; enqueue invalidation/log, report công bố stale/partial |
| Trend history chưa có retention | Conditional snapshot retention `365` days, review lại ở P07 |

## 5. Không Được Suy Diễn

- Không xem `lastActiveAt` là bằng chứng Student đã hiểu bài.
- Không gán nhãn “yếu/kém” chỉ từ process score; UI dùng “Cần hỗ trợ” theo rule minh bạch.
- Không tính draft Grade vào Student/Admin aggregate.
- Không coi analytics page view là course completion.
- Không coi absence of event là inactivity nếu source data vẫn có giao dịch.
- Không dùng frontend aggregate làm số chính thức.

## 6. Change Control

Thay đổi formula, denominator, status mapping, Grade visibility, Admin projection, threshold,
export format hoặc event PII phải:

1. tạo decision/change record;
2. nêu BA/NFR/privacy impact;
3. tăng version contract khi semantics đổi;
4. có migration/recalculation plan;
5. cập nhật OpenAPI, tests và traceability;
6. được Product Owner và Technical Lead phê duyệt trước merge.

## 7. Review Checklist

- [ ] Product Owner chấp nhận `P06_PROCESS_SCORE_V1`.
- [ ] BA xác nhận Grade average không thay process score.
- [ ] Security reviewer chấp nhận Admin projection và threshold.
- [ ] DevOps xác nhận CSV sync không dùng local disk.
- [ ] QA xác nhận tie-breaker, null denominator và freshness có test được.
- [ ] Technical Lead xác nhận read-model/port boundary.
