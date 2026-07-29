# Phase 06 Compatibility And Cutover Plan

## 1. Mục Đích

Tài liệu này khóa cách P06 tiếp quản các route/report contract đã xuất hiện từ P04/P05. Mục
tiêu là không đăng ký trùng route, không có hai response shape theo feature flag và không buộc
Developer tự quyết định file nào còn ownership.

## 2. Current Runtime Baseline

| Capability | Current owner | Current permission | Current contract |
| --- | --- | --- | --- |
| Student Course Progress | `phase-four.router.ts` | `learning.view_enrolled` | P05 activity/progress, percentage nullable |
| Teacher Course Dashboard | `phase-four.router.ts` | `course.progress_view_owned` | On-demand P05 descriptor/progress |
| Teacher Activities/Students/Progress | `phase-four.router.ts` | `course.progress_view_owned` | Percentage fields non-null, denominator 0 thành `0` |
| Teacher Gradebook | `phase-five.router.ts`/`GradeService` | `grade.manage_owned` | `P05_BASIC_GRADEBOOK_V1`, disabled mặc định |
| Student Grade | `phase-five.router.ts`/`GradeService` | `grade.view_own` | Current Grade `RETURNED` only |

Web hiện dùng `CourseDashboard` fields `number` cho Teacher percentages và existing Teacher
Course route.

## 3. Target Route Ownership

`phase-six.router.ts` tiếp quản:

- `GET /students/me/progress`;
- `GET /students/me/dashboard`;
- `GET /students/me/progress/courses`;
- Conditional `GET /students/me/progress/trend`;
- `GET /teacher/courses/:courseId/dashboard`;
- `GET /teacher/courses/:courseId/activities`;
- `GET /teacher/courses/:courseId/students`;
- `GET /teacher/courses/:courseId/progress`;
- `GET /teacher/courses/:courseId/students/:studentId/progress`;
- `GET /teacher/courses/:courseId/assessments/analytics`;
- `GET /teacher/courses/:courseId/gradebook`;
- Admin/report/export/event routes P06.

P04 vẫn sở hữu Student To-do/Deadline/Classwork và learning mutations. P05 vẫn sở hữu
assessment/submission/Grade mutation/detail routes.

## 4. Required Route Removal

Trong cùng Pull Request thêm `phase-six.router.ts`:

1. xóa registration của `/students/me/progress` và bốn Teacher report routes khỏi
   `phase-four.router.ts`;
2. xóa registration Gradebook khỏi `phase-five.router.ts`;
3. giữ domain services/repositories P04/P05 làm source adapters;
4. tạo một `phaseSixFoundation` trong `app.ts`, truyền cùng
   `reportingInvalidationWriter` bắt buộc vào Phase Four/Five router;
5. mount `phase-six.router.ts` đúng một lần bằng cùng foundation;
6. route parity test assert mỗi method/path chỉ đăng ký một operation.

Không để Express route cũ đứng trước route P06 vì handler đầu tiên sẽ che implementation mới.
Không dùng optional/noop writer trong application composition; thiếu dependency phải bị phát hiện
bởi typecheck/startup, còn noop chỉ dành cho focused unit tests.

## 5. Permission Cutover

Paths giữ permission hiện có:

| Path group | Permission |
| --- | --- |
| Student Dashboard/Progress | `learning.view_enrolled` |
| Student Grade routes | `grade.view_own` |
| Teacher Dashboard/Analytics/Student Detail | `course.progress_view_owned` |
| Teacher Gradebook | `grade.manage_owned` |
| Admin Dashboard/Reports | `report.view_governance` |
| Admin Audit | `report.audit_view` |
| Teacher/Admin export | `report.export_owned` / `report.export_governance` |

Không tạo `report.view_own/report.view_owned`. Existing access-token/session behavior không cần
migration capability cho Student/Teacher.
Export permissions được thêm tĩnh vào role map; `REPORT_EXPORT_ENABLED` và `allowedActions` mới
là runtime gate, do đó bật/tắt flag không cần refresh access token.

## 6. Nullable Metric Cutover

P06 official contract:

```ts
progressPercentage: number | null;
processScore: number | null;
averageProgressPercentage: number | null;
completionPercentage: number | null;
returnedGradeAverage: number | null;
```

Rules:

- denominator 0 -> `null`;
- Teacher P05 `0` behavior được sửa trong P06;
- API, OpenAPI, Web types, formatter, component tests và E2E đổi cùng PR;
- regression với denominator >0 phải giữ nguyên giá trị;
- no-data UI hiển thị `N/A`, không truyền `null` vào progress bar.

Dự án chưa có external production API consumer nên không duy trì legacy field sai nghĩa. Nếu
có external consumer trước merge, cutover phải đổi sang `/api/v2` hoặc additive route version.

## 7. Gradebook Cutover

- Giữ path và permission.
- Xóa `GradeService.gradebook()` sau khi P06 Gradebook service/parity tests sẵn sàng.
- Retire `BASIC_GRADEBOOK_ENABLED` khỏi:
  - `.env.example`;
  - environment schema/config type;
  - Phase Five router wiring;
  - tests.
- P06 Gradebook trả `featureVersion=P06_GRADEBOOK_V1`.
- `REPORTING_ENABLED` là Must kill switch duy nhất; không delegate về P05 Gradebook.
- Rollback dùng previous application release, không đổi flag để trả response shape cũ.

## 8. Feature Flag Behavior

| Flag | False behavior | True behavior |
| --- | --- | --- |
| `REPORTING_ENABLED` | P06 report routes trả controlled `FEATURE_NOT_ENABLED`; không legacy delegation | P06 report contracts |
| `REPORT_EXPORT_ENABLED` | Export action/route disabled | Bounded CSV |
| `ANALYTICS_EVENTS_ENABLED` | Event route disabled/no client emit | Safe event contract |
| `STUDENT_PROGRESS_TREND_ENABLED` | Trend route/action disabled | Snapshot trend |
| `WEIGHTED_PROCESS_SCORE_ENABLED` | Luôn false trong P06 V1 | Không được bật nếu chưa có separate change approval |

Response shape của cùng enabled route không thay đổi theo flag khác.

## 9. OpenAPI Cutover

- Remove moved operations khỏi P04/P05 OpenAPI operation lists.
- Add same path/method dưới P06 tags/schemas.
- Operation ID unique.
- Runtime/OpenAPI route set exact match.
- Examples dùng nullable denominator và Grade `DRAFT/RETURNED`.
- Swagger không hiển thị route Conditional khi build config chưa hỗ trợ dynamic docs; nếu luôn
  hiển thị, description phải nêu feature flag và runtime error rõ.

## 10. Web Cutover

1. Update shared permission usage only for new Admin/export routes.
2. Change Teacher report types to nullable.
3. Move/report-specific types vào `features/reporting`.
4. Migrate existing Teacher Course Dashboard to P06 DTO.
5. Add guards so ProgressBar only receives number.
6. Remove any client ranking/percentage calculation.
7. Ensure old cached query is cleared by versioned query key.

## 11. Cutover Test Matrix

| Case | Expected |
| --- | --- |
| Unique method/path registration | Exactly one handler/operation |
| P04 To-do/Deadline/Classwork | Unchanged |
| P05 assessment/Grade mutations | Unchanged |
| Student progress denominator >0 | Same value |
| Student/Teacher denominator 0 | `null`, UI `N/A` |
| Teacher permission | Existing role still authorized |
| Other Teacher | Still denied |
| Old Gradebook flag absent | Startup config valid |
| P06 reporting flag false | `503 FEATURE_DISABLED`, Web error state; no old DTO |
| Rollback image | P05 routes/contracts restored as one release |

## 12. Merge Rule

Route removal, route addition, OpenAPI update, Web DTO update và regression tests là một atomic
PR slice. Không merge trạng thái giữa chừng khiến route biến mất, đăng ký trùng hoặc Web/API lệch.
