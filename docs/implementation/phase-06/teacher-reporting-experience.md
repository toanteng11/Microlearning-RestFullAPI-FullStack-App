# Phase 06 Teacher Reporting Experience

## 1. Outcome

Teacher có một Course workspace để xem nội dung, roster, tiến độ, Gradebook và nhu cầu hỗ trợ,
không phải tải toàn bộ data về Web hoặc mở từng Student thủ công.

## 2. Route Map

| Route | Purpose |
| --- | --- |
| `/teacher/courses/:courseId` | Course Dashboard summary/top activity/top Student |
| `/teacher/courses/:courseId/analytics` | Progress/activity/assessment analysis |
| `/teacher/courses/:courseId/gradebook` | Gradebook table |
| `/teacher/courses/:courseId/students/:studentId/progress` | Student Learning Detail |
| `/teacher/courses/:courseId/content` | Existing content management |
| `/teacher/courses/:courseId/assessments` | Existing assessment management |

## 3. Course Dashboard

First viewport phải ưu tiên:

- Course title/status và Back navigation;
- required/published activity;
- active Student;
- average progress;
- missing/late/ungraded counts;
- top ranking preview;
- freshness.

Dashboard dùng existing route/visual pattern, không tạo landing page.

## 4. Analytics Tabs

Segmented/tab control:

- `Progress`;
- `Activities`;
- `Assessments`;
- `Students requiring support`.

Tab/filter/sort/page phải phản ánh trong URL search params để Back/Forward và share internal link
hoạt động.

## 5. Progress Ranking

Columns tối thiểu:

- rank;
- Student name/code;
- completed/required;
- process score;
- returned Grade average;
- missing/late;
- last active;
- support flags;
- detail action icon/link.

Default `processScore DESC`; server là nguồn thứ tự. Teacher có thể sort allowlist nhưng UI phải
ghi cột đang sort.

## 6. Activity Analysis

Mỗi row:

- Activity type/title/required;
- effective default deadline;
- eligible active Students;
- completed/submitted/missing/late/ungraded;
- completion/submission rate;
- returned average nếu gradable;
- action sang existing results/submissions page.

Không hiển thị answer key/raw answer trong aggregate table.

## 7. Assessment Analysis

- Quiz: attempts started/submitted/review needed/returned, average/median/distribution theo
  returned or finalized policy ghi rõ.
- Assignment: submitted/on-time/late/missing/ungraded/returned.
- Distribution bucket do backend định nghĩa/version; denominator hiện rõ.
- Không so sánh Quiz/Assignment khác maxScore bằng raw score; dùng normalized percentage.

## 8. Student Learning Detail

Teacher click một Student:

- summary/process score/progress/Grade average;
- activity timeline/status/deadline;
- Quiz/Assignment result metadata và navigation vào authorized grading page;
- missing/late list;
- freshness/version;
- không chứa raw answer/private data ngoài existing grading route.

Student phải thuộc active/historical roster policy của Course; out-of-scope normalized error.

## 9. Exception Workflows

| Event | Expected report effect |
| --- | --- |
| Activity publish/required change | Invalidate whole Course |
| Student joins/leaves | Invalidate Course roster/ranking |
| Lesson completion | Invalidate Student/Course |
| Quiz submit/finalize | Invalidate Student/Course + assessment aggregate |
| Assignment submit/unsubmit | Invalidate Student/Course + activity aggregate |
| Grade return/regrade | Gradebook/average refresh |
| Deadline exception create/revoke | Missing/late/support refresh for Student |

UI không cần manual “tính lại” cho normal path. Retry/rebuild action chỉ Super Admin/operations,
không đặt vào Teacher UI.

## 10. Empty/Partial/Freshness

- No roster: hướng Teacher về invite/join code/link workflow.
- No content: hướng về Content.
- No Grade: `N/A`, không tính `0`.
- Partial: giữ rows hợp lệ, nêu thời điểm và retry.
- Stale: không ẩn; banner nhỏ, không chặn toàn page nếu snapshot còn dùng được.
- Failed/no snapshot: full error state với correlation ID.

## 11. Accessibility And Efficiency

- Sticky table header chỉ khi không che content.
- Pagination/filter không làm table đổi kích thước bất ngờ.
- Icon button có tooltip/accessible name.
- Không dùng màu duy nhất để biểu thị missing/late.
- Gradebook có keyboard focus và horizontal scroll có label.
- Long Student/Course names wrap/truncate có accessible full label.

## 12. Teacher Acceptance Journeys

1. Teacher xem owned Course summary và ranking deterministic.
2. Search/filter/page không mở rộng Course scope.
3. Click Student detail đúng data và quay lại giữ filter/page.
4. Cross-owned Course IDOR bị chặn.
5. Regrade/deadline reset phản ánh đúng metric.
6. Gradebook không lộ draft Grade cho Student/Admin.
7. Dataset 100 Student x 50 activity đạt NFR dashboard.
