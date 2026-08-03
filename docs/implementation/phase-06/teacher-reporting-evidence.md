# Phase 06 Teacher Reporting Evidence

## 1. Record

| Field | Value |
| --- | --- |
| Scope | Part 09-10 - Teacher Reporting API And Web |
| Branch | `feature/phase-06-teacher-reporting` |
| Code commit | `9096d78` |
| Date | `2026-07-30` |
| Status | `LOCAL_PASS_REMOTE_PENDING` |
| Parent PR | `P06-PR04 - Teacher Reporting` |

`LOCAL_PASS_REMOTE_PENDING` có nghĩa local implementation và final quality evidence đã Pass nhưng
Student reporting và Parent PR chưa hoàn tất remote CI/review/merge theo thứ tự dependency.

## 2. Delivered API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/teacher/courses/:courseId/dashboard` | Course summary, top activities, top Students |
| GET | `/teacher/courses/:courseId/progress` | Stable ranking, search/filter/sort/page |
| GET | `/teacher/courses/:courseId/students` | Compatibility alias cùng contract ranking |
| GET | `/teacher/courses/:courseId/activities` | Activity denominator, completion, missing, late, ungraded |
| GET | `/teacher/courses/:courseId/assessments` | Assessment state, submission, review và returned Grade analytics |
| GET | `/teacher/courses/:courseId/students/:studentId/progress` | Active-roster Student detail |

Kết quả contract:

- route cũ tại Phase 04 đã được cut over; mỗi path chỉ còn một runtime handler và một OpenAPI
  operation;
- permission `course.progress_view_owned`, authentication và `Cache-Control: private, no-store`
  áp dụng cho toàn bộ route;
- ownership được resolve trước roster và aggregate queries;
- query dùng strict allowlist, `limit <= 50`, unknown sort/filter trả controlled `400`;
- Grade average chỉ dùng current Grade `RETURNED` và weighted theo tổng points;
- response không trả raw answer, Submission body hoặc private feedback.

## 3. Delivered Web

- Teacher Course Dashboard giữ nguyên content-management actions và bổ sung reporting summary.
- Route `/teacher/courses/:courseId/analytics` có Progress, Activities, Assessments và Support.
- Search, status, sort, order và page nằm trong URL search params.
- Route `/teacher/courses/:courseId/students/:studentId/progress` chỉ nhận safe `returnTo` trong
  cùng Course.
- Query keys chứa actor ID, Course ID và normalized filters.
- Loading, no-data, error, retry, stale và pagination states có component tests.
- Table dùng horizontal container có kiểm soát; viewport `390x844` không làm document overflow.

## 4. Automated Evidence

| Gate | Command/Scope | Result |
| --- | --- | --- |
| Local quality | `npm run check` | Pass |
| CI-equivalent quality | `npm run check:ci` | Pass |
| API unit | API Vitest | `210/210` Pass |
| Web component | Web Vitest | `109/109` Pass |
| Teacher focused component | `teacher-reporting.test.tsx` | `7/7` Pass |
| API coverage | Global thresholds | Pass; statements `76.88%`, lines `78.96%` |
| Web coverage | Global thresholds | Pass; functions `80.15%`, lines `86.91%` |
| Mongo integration | Full replica-set suite | `87/87` Pass |
| Teacher integration | Focused route suite | `2/2` Pass |
| OpenAPI | Parser/runtime operation coverage | Pass |
| Production build | API TypeScript + Web Vite | Pass |
| Browser regression | Full Playwright suite | `29/29` Pass |
| Teacher browser | Teacher reporting spec | `2/2` Pass |
| Accessibility | Axe WCAG 2A/2AA/2.1A/2.1AA | Serious/critical `0` |

Integrated browser environment:

```text
MongoDB 8 replica set -> healthy
API container -> /ready 200
Web container -> /health 200
Seed -> deterministic Phase 03-05 dataset
Browser -> Chromium, one worker, clean test database
```

## 5. Security And Scope Evidence

| Scenario | Expected | Actual |
| --- | --- | --- |
| Owned Course | Teacher nhận reporting data | Pass |
| Other Teacher Course | Không enumerate data | `404`, Pass |
| Student ngoài active roster | Không mở detail | `404`, Pass |
| Invalid sort | Controlled validation error | `400`, Pass |
| Duplicate score | Stable Student ID tie-breaker | Pass |
| Removed Student | Không xuất hiện trong roster/ranking | Pass |
| Private assessment content | Không có trong reporting DTO | Pass |

## 6. Performance Evidence

Dataset `100 Students x 50 Lessons`, 30 measured requests:

| Endpoint | p95 | Target | Result |
| --- | ---: | ---: | --- |
| Teacher Dashboard | `562.55 ms` | `<= 1000 ms` | Pass |
| Teacher ranking | `278.44 ms` | `<= 1000 ms` | Pass |

Implementation batch-loads roster, profiles, activities, progress, grades, deadline exceptions và
assessment states; không query theo Student x Activity.

## 7. Regression Findings Resolved

1. Phase 04/05 integration assertions vẫn dùng DTO cũ sau atomic cutover.
   - Đã cập nhật assertions sang activity-based Phase 06 contract và giữ ownership/performance checks.
2. Teacher table bị document overflow sau luồng Detail -> Back ở mobile.
   - Nguyên nhân là absolute `.sr-only` trong cột cuối; chuyển accessible name sang `aria-label`.
3. `StudentCoursePage` còn đọc `progress.summary` của DTO cũ.
   - Đã chuyển sang `requiredActivityCount`, `completedRequiredCount`, `progressPercentage`.
4. Web function coverage giảm dưới 80% sau khi thêm UI.
   - Bổ sung tests cho search, filter, sort, pagination, retry và stale refresh; gate đạt `80.15%`.

Sau các sửa đổi, full integration và full browser regression đều Pass.

## 8. Remaining Remote Evidence

Part 09-10 chỉ được đổi sang `DONE` khi:

1. dependency commits/PR trước đó đã merge đúng thứ tự;
2. branch được rebase hoặc merge latest `main`;
3. P06-PR04 required checks, dependency audit và secret scan Pass;
4. review conversations được xử lý;
5. PR merge và post-merge `main` CI Pass;
6. PR URL, CI URL và merge SHA được cập nhật vào evidence register.
