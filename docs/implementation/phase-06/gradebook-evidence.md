# Phase 06 Gradebook Evidence

## 1. Record

| Field | Value |
| --- | --- |
| Scope | Part 11-12 - Gradebook API, atomic cutover và Web |
| Branch | `feature/phase-06-gradebook` |
| Code commit | `fe36dda` |
| Date | `2026-07-30` |
| Status | `LOCAL_PASS_REMOTE_PENDING` |
| Parent PR | `P06-PR05 - Gradebook` |

`LOCAL_PASS_REMOTE_PENDING` nghĩa là implementation, local quality gates và integrated evidence đã Pass,
nhưng các Parent PR dependency và P06-PR05 vẫn cần hoàn tất remote CI, review và merge đúng thứ
tự trước khi Part 11-12 được đổi thành `DONE`.

## 2. Delivered API And Atomic Cutover

| Method | Path | Permission | Result |
| --- | --- | --- | --- |
| GET | `/teacher/courses/:courseId/gradebook` | `grade.manage_owned` | P06 Gradebook bounded rows/columns |

Kết quả cutover:

- chỉ còn một Express handler và một OpenAPI operation `getTeacherCourseGradebook`;
- P05 route, `GradeService.gradebook()`, P05 schema/operation và
  `BASIC_GRADEBOOK_ENABLED` đã được retire trong cùng commit;
- response version là `P06_GRADEBOOK_V1`, không chạy song song contract cũ;
- Teacher ownership được resolve trước khi đọc roster, activity, progress, Grade hoặc submission
  state;
- Student rows giới hạn `<= 50`, activity columns giới hạn `<= 50`, activity pagination dùng opaque
  cursor và stable order;
- completion status và grading status độc lập; `displayStatus` dùng server precedence;
- average weighted theo returned points; draft Grade không đi vào average;
- response không chứa raw answer, Submission body hoặc private feedback;
- reader batch-load Course scope, roster, activity, profile, progress, Grade, deadline exception và
  assessment state; không query theo từng Student x Activity.

## 3. Delivered Web

- Route `/teacher/courses/:courseId/gradebook` được bảo vệ bằng `grade.manage_owned`.
- Bảng render trực tiếp columns, cells, completion/grading/display status và score từ server.
- Student identity sticky trong horizontal table container; document không bị horizontal overflow.
- Search, activity type, completion/grading status, Module, sort, Student page và activity cursor nằm
  trong URL.
- Có loading, empty activity, empty result, forbidden, error, retry, stale/freshness và pagination
  states.
- Drill-down tới Student progress giữ `returnTo` an toàn trong cùng Course.
- Grade return/regrade và deadline exception mutation invalidate đúng reporting scope của Course,
  không xóa cache Course khác.

## 4. Automated Evidence

| Gate | Command/Scope | Result |
| --- | --- | --- |
| CI-equivalent quality | `npm run check:ci` | Pass |
| API unit/coverage | Full API Vitest | `215/215` Pass |
| Web component/coverage | Full Web Vitest | `115/115` Pass |
| Gradebook service | `phase-six-gradebook.test.ts` | `5/5` Pass |
| Gradebook Web | `gradebook.test.tsx` | `6/6` Pass |
| Mongo integration | Full replica-set suite | `90/90` Pass |
| Gradebook integration | Gradebook Mongo suite | `3/3` Pass |
| OpenAPI | Runtime/parser operation parity | Pass |
| Production build | API TypeScript + Web Vite | Pass |
| Browser regression | Full Playwright on clean test database | `32/32` Pass |
| Gradebook browser | Gradebook Playwright spec | `3/3` Pass |
| Accessibility | Axe WCAG 2A/2AA/2.1A/2.1AA | Serious/critical `0` |
| Responsive | Chromium viewport `390x844` | No document horizontal overflow |

Coverage:

| Workspace | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| API | `77.45%` | `62.24%` | `73.23%` | `79.54%` |
| Web | `84.02%` | `72.69%` | `80.11%` | `87.22%` |

## 5. Performance Evidence

`P06-PERF-004` chạy trên MongoDB 8 replica set:

| Dataset | Warm-up | Measured requests | Observed p95 | Target | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| 100 Students x 50 Assignments | 1 | 10 | `160.69 ms` | `<= 1500 ms` | Pass |

Endpoint được gọi với `limit=50&activityLimit=50`; response được assert đúng 50 rows, 50 columns
và `totalItems=100`. Giá trị p95 được ghi dạng structured JSON vào test log.

## 6. Security, Privacy And Consistency Evidence

| Scenario | Expected | Actual |
| --- | --- | --- |
| Owned Course | Teacher nhận Gradebook | `200`, Pass |
| Other Teacher Course | Không enumerate data | `404`, Pass |
| Student gọi Teacher Gradebook | Bị chặn | `403`, Pass |
| Cross-Course Module | Reject trước roster query | `400`, Pass |
| Malformed/mismatched activity cursor | Controlled validation error | `400`, Pass |
| `activityLimit=51` hoặc unknown query | Reject bound/operator | `400`, Pass |
| Returned Grade | Teacher thấy score/status | Pass |
| Draft Grade | Không vào returned average | Pass |
| Private answer/feedback | Không có trong payload | Pass |
| Deadline/regrade mutation | Invalidate đúng Course reporting key | Pass |

## 7. Regression Finding Resolved

Playwright ban đầu chọn nhầm `<option>` ẩn có cùng text với cell status `Đã trả điểm`. Locator đã
được scope vào Gradebook region; Gradebook focused E2E sau sửa `3/3` và full clean-database
regression `32/32` Pass. Đây là test-selector defect, không phải product defect.

## 8. Remaining Remote Evidence

Part 11-12 chỉ đổi thành `DONE` khi:

1. P06-PR02, P06-PR03 và P06-PR04 đã merge đúng dependency order;
2. branch được đồng bộ với latest `main` và giải quyết conflict nếu có;
3. P06-PR05 required CI, dependency audit và secret scan Pass;
4. review conversations được xử lý;
5. PR được merge và post-merge `main` CI Pass;
6. PR URL, CI URL và merge SHA được bổ sung vào evidence register.
