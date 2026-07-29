# Phase 06 API UI Integration Matrix

## 1. Rules

- Web gọi API qua shared request/client và React Query pattern hiện có.
- Query key chứa actor scope, route resource và normalized filters.
- Backend `allowedActions`/permission quyết định command visibility.
- Loading/empty/no-data/stale/partial/error/forbidden đều có UI state riêng.
- Web không aggregate official metric hoặc sort ranking current page.

## 2. Student Matrix

| Screen/action | API | Data/state |
| --- | --- | --- |
| Dashboard load | `GET /students/me/dashboard` | summary, To-do preview, Course preview, Grade preview |
| View all To-do | `GET /students/me/todo` | reuse P05 filters/pagination |
| Progress list | `GET /students/me/progress/courses` | paginated Course summaries |
| Progress detail | `GET /students/me/progress?courseId=` | one Course + freshness |
| Trend | `GET /students/me/progress/trend` | Conditional chart/table or `NO_DATA` |
| Recent Grade action | existing Grade/result endpoints | own returned projection |

## 3. Teacher Matrix

| Screen/action | API | Data/state |
| --- | --- | --- |
| Course Dashboard | `GET /teacher/courses/:courseId/dashboard` | summary + top activities/ranking |
| Progress tab | `GET /teacher/courses/:courseId/progress` | ranking/filter/page |
| Students tab | `GET /teacher/courses/:courseId/students` | roster alphabetical |
| Activities tab | `GET /teacher/courses/:courseId/activities` | completion/missing/late |
| Assessments tab | `GET /teacher/courses/:courseId/assessments/analytics` | Quiz/Assignment aggregate |
| Student detail | `GET /teacher/courses/:courseId/students/:studentId/progress` | detail/timeline |
| Gradebook | `GET /teacher/courses/:courseId/gradebook` | columns/rows/cells |
| Export Gradebook | `GET .../gradebook/export` | Conditional file download |
| Open grading | existing result/submission route | backend `allowedActions` |

## 4. Admin Matrix

| Screen/action | API | Data/state |
| --- | --- | --- |
| Dashboard | `GET /admin/dashboard` | governance summary/recent activity |
| Governance report | `GET /admin/reports/governance` | filters/aggregate/table |
| Adoption trend | `GET /admin/reports/adoption` | Conditional |
| Learning outcome | `GET /admin/reports/learning-outcomes` | Conditional/suppressed |
| Audit list | `GET /admin/audit-logs` | paginated redacted events |
| Export | report-specific export endpoint | Conditional/allowed action |
| Drill to source list | existing role/Classroom/Course list | safe internal navigation |

## 5. Route And Permission Matrix

| React route | RoleRoute permission |
| --- | --- |
| `/student/dashboard` | `learning.view_enrolled` |
| `/student/progress` | `learning.view_enrolled` |
| `/teacher/courses/:courseId` | `course.progress_view_owned` |
| `/teacher/courses/:courseId/analytics` | `course.progress_view_owned` |
| `/teacher/courses/:courseId/gradebook` | `grade.manage_owned` |
| `/teacher/courses/:courseId/students/:studentId/progress` | `course.progress_view_owned` |
| `/admin/dashboard` | `report.view_governance` |
| `/admin/reports` | `report.view_governance` |
| `/admin/audit-logs` | `report.audit_view` |

Existing Student/Teacher permissions được giữ nguyên qua cutover; không yêu cầu auth refresh chỉ
để nhận permission P06 mới. New Admin/export permissions vẫn theo session capability contract.

## 6. Shared Request State

```ts
type ReportViewState =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'empty' }
  | { kind: 'no-data' }
  | { kind: 'stale'; recalculatedAt: string }
  | { kind: 'partial'; failedItemsCount: number }
  | { kind: 'forbidden' }
  | { kind: 'error'; requestId?: string };
```

Page không dùng một boolean `loading` để che mọi trạng thái.

## 7. Query Key And Invalidation

Examples:

```text
['student-reporting-dashboard', actorId]
['student-progress', actorId, courseId]
['teacher-course-report', actorId, courseId, normalizedFilters]
['teacher-gradebook', actorId, courseId, normalizedFilters]
['admin-governance-report', actorId, normalizedFilters]
```

After mutation:

- learning completion -> Student dashboard/progress + Teacher Course report;
- submission/grade/deadline exception -> relevant Student/Teacher queries;
- enrollment/activity lifecycle -> Teacher dashboard/Gradebook + Student enrolled list;
- account/Classroom/Course governance -> Admin dashboard.

## 8. URL Search Params

Progress/Gradebook/Admin report filters phải serialize vào URL:

- page/limit;
- search;
- tab/type/status/support;
- sort/order;
- date range/timezone.

Parser dùng schema; invalid param fallback có kiểm soát hoặc error, không truyền raw vào API.

## 9. Error Mapping

| API code | UI |
| --- | --- |
| `VALIDATION_ERROR` | Inline filter error/reset invalid URL state |
| `ACCESS_DENIED` | Forbidden page, clear private data |
| `RESOURCE_NOT_FOUND` | Course/Student not found |
| `METRIC_VERSION_MISMATCH` | Refresh/rebuild notice |
| `REPORT_REBUILD_IN_PROGRESS` | Rebuilding state + refetch |
| `REPORT_LIMIT_EXCEEDED` | Explain filter/row limit |
| `REPORT_NOT_READY` | Retry/error state with request ID |
| `FEATURE_DISABLED` | Stable unavailable state; hide P06-only actions, keep Back navigation |
| `RATE_LIMITED` | Cooldown message |

## 10. Export UX

- Button render chỉ khi feature flag reflected in `allowedActions`.
- Click disables button, shows progress, prevents duplicate request.
- Success downloads browser blob and announces filename.
- Failure releases URL object, shows error, does not retain private blob.
- Back/Forward/filter remains unchanged.

## 11. Integration Exit

- Mỗi route có API, permission, types, loading/empty/error và test.
- No page fetches all rows then client filters.
- No official metric calculation in Web.
- Query cache clears at logout.
- Browser E2E covers cross-role/IDOR and navigation.
