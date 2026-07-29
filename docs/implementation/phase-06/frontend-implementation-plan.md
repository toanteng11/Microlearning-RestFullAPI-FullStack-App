# Phase 06 Frontend Implementation Plan

## 1. UX Direction

Reporting UI phải quiet, work-focused và dễ scan. Ưu tiên table/list/metric summary/action; chỉ
dùng chart khi thể hiện trend thực sự. Không tạo marketing hero, nested cards hoặc chart trang
trí.

## 2. Feature Structure

```text
apps/web/src/features/reporting/
|-- reporting.types.ts
|-- reporting.schemas.ts
|-- reporting-format.ts
|-- reporting-query-keys.ts
|-- reporting-api.ts
|-- components/
|   |-- MetricValue.tsx
|   |-- FreshnessNotice.tsx
|   |-- ReportFilters.tsx
|   |-- ReportingTableState.tsx
|   |-- ProgressRankingTable.tsx
|   |-- ActivityAnalyticsTable.tsx
|   |-- GradebookTable.tsx
|   |-- SupportFlagList.tsx
|   `-- ExportButton.tsx
|-- pages/
|   |-- StudentProgressPage.tsx
|   |-- TeacherCourseAnalyticsPage.tsx
|   |-- TeacherGradebookPage.tsx
|   |-- TeacherStudentProgressPage.tsx
|   |-- AdminReportingDashboardPage.tsx
|   `-- AdminReportsPage.tsx
`-- tests/
```

Existing Student/Teacher pages được refactor/reuse; không duplicate route/page nếu component
hiện tại phù hợp.

## 3. Shared Components

| Component | Responsibility |
| --- | --- |
| `MetricValue` | Value/null/N/A, label, definition tooltip |
| `FreshnessNotice` | asOf/recalculated/stale/partial |
| `ReportFilters` | Schema-driven controlled filter + URL params |
| `ReportingTableState` | loading/empty/no-data/error/partial |
| `ProgressRankingTable` | Server order/page, responsive columns |
| `GradebookTable` | Stable row/column dimensions, horizontal access |
| `SupportFlagList` | Text/icon labels, no judgmental copy |
| `ExportButton` | Conditional allowed action, blob lifecycle |

## 4. Route Integration Order

1. Add types/API/query keys without route.
2. Enhance Teacher Course Dashboard using existing route.
3. Add Student Progress.
4. Add Teacher Analytics/Student Detail.
5. Add Gradebook.
6. Replace `/admin/dashboard` route element bằng P06 Admin Dashboard, giữ toàn bộ management
   links hiện có; add Reports/Audit routes.
7. Add Conditional export/trend.
8. Navigation/Back/Forward/accessibility/E2E.

Student Dashboard dùng composition: join/Classroom list hiện có và P06 summary là các request band
độc lập. Lỗi report không được vô hiệu form join-by-code hoặc làm biến mất Classroom list.

## 5. Data Fetching

- React Query đã có trong repo, reuse configured client.
- `staleTime` không được che server freshness; hai khái niệm khác nhau.
- Query retry bounded; không retry 403/404/validation.
- Keep previous page data khi đổi pagination nếu không lộ actor scope.
- Abort/cancel request khi route/filter đổi.
- Mutation invalidation dùng matrix, không clear toàn cache vô cớ.

## 6. Filter And Navigation

- URL params là source của report filter state.
- Search debounce ngắn và max length.
- Reset filter command rõ.
- Back button dùng icon `ArrowLeft`, có text khi cần context.
- Browser Back/Forward giữ tab/filter/page.
- Course navigation không mất `returnTo` an toàn.

## 7. Table Design

- Fixed/stable column widths với min/max.
- Server pagination; không render hàng ngàn rows.
- Sort button dùng icon/accessible label.
- Long names wrap hoặc ellipsis có title/accessible full text.
- Gradebook horizontal scroll có sticky identity column nếu không overlap.
- Mobile dùng reduced priority columns/detail drill-down, không bóp tất cả text.

## 8. Request States

Mỗi page/component test:

- initial loading;
- empty/no roster/no content;
- no denominator;
- fresh ready;
- stale;
- partial;
- rebuilding;
- API error/retry;
- forbidden/not found;
- feature disabled;
- responsive long content.

## 9. Copy Rules

- `processScore`: “Điểm quá trình” kèm tooltip công thức/version.
- `progressPercentage`: “Tiến độ”.
- `returnedGradeAverage`: “Điểm đã trả”.
- `MISSING`: “Chưa hoàn thành, đã quá hạn”.
- `STALE`: “Dữ liệu cập nhật lần cuối lúc...”.
- `PARTIAL`: “Một phần dữ liệu chưa được tổng hợp”.
- Không dùng “học sinh yếu”; dùng “Cần hỗ trợ” và nêu rule.

## 10. Export Browser Handling

```text
click
  -> disable
  -> authenticated fetch
  -> validate content type
  -> create object URL
  -> trigger safe filename download
  -> revoke object URL
  -> announce success/failure
```

Không cache blob trong React Query/localStorage.

## 11. Accessibility

- WCAG keyboard/focus/name/role.
- Progress/chart có text alternative.
- Sort state dùng `aria-sort`.
- Freshness/partial alert dùng appropriate live region, không spam.
- Color contrast và status không chỉ màu.
- Skeleton có fixed dimensions.
- Dialog/export/error focus management.

## 12. Frontend Tests

- formatter/null/timezone;
- URL parser/query key;
- metric/freshness components;
- table sort/page/filter request;
- Gradebook long/empty state;
- route permission;
- logout cache clearing;
- export blob cleanup;
- accessibility with Testing Library/axe E2E;
- responsive Playwright screenshots.

## 13. UI Exit

- Feature complete actor routes.
- No official calculation/sort in Web.
- All request states.
- Back/Forward and Back buttons.
- Desktop/mobile visual review.
- No overlap/overflow/layout shift.
- Conditional controls absent when disabled.
