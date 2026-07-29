# Part 08 - Student Reporting Web

## Goal

Tích hợp Student reporting vào React mà không làm mất join-by-code, Classroom list hoặc To-do.

## Parent PR

`P06-PR03 - Student Reporting`

## Dependencies

- Part 07 API contract stable.

## Files

```text
apps/web/src/features/reporting/reporting.types.ts
apps/web/src/features/reporting/reporting.schemas.ts
apps/web/src/features/reporting/reporting-format.ts
apps/web/src/features/reporting/reporting-query-keys.ts
apps/web/src/features/reporting/reporting-api.ts
apps/web/src/features/reporting/pages/StudentReportingDashboardPage.tsx
apps/web/src/features/reporting/pages/StudentProgressPage.tsx
apps/web/src/features/classrooms/pages/StudentClassroomsPage.tsx
apps/web/src/app/router.tsx
```

## Work

1. Validate API response bằng shared Web schemas.
2. Dashboard giữ join/Classroom band độc lập với reporting band.
3. Hiển thị pending, due soon, missing, Course progress và returned Grade.
4. Hiển thị `N/A`, stale, partial, rebuilding và failed đúng UX contract.
5. URL giữ filter/page cần thiết; Back/Forward hoạt động.
6. Xóa private report cache khi logout/session/role thay đổi.
7. Responsive, keyboard, ARIA và long-text states.

## Tests

- `P06-WEB-001..003`, `P06-WEB-010`, `P06-WEB-013..015`.
- `P06-E2E-01..04`.
- `P06-AC-019..027`.

## Definition Of Done

- Student critical journey chạy bằng API/MongoDB thật.
- Reporting error không làm mất join workflow.
- Không có stale data sau logout hoặc account switch.
- Desktop/mobile visual evidence không overlap.
- P06-PR03 CI Pass trước merge.
