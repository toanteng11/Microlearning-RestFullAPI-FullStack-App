# Part 10 - Teacher Reporting Web

## Goal

Tích hợp Dashboard, ranking, analytics và Student detail vào Teacher Course experience hiện có.

## Parent PR

`P06-PR04 - Teacher Reporting`

## Dependencies

- Part 09 API contract stable.

## Files

```text
apps/web/src/features/reporting/pages/TeacherReportingDashboardPage.tsx
apps/web/src/features/reporting/pages/TeacherRankingPage.tsx
apps/web/src/features/reporting/pages/TeacherStudentDetailPage.tsx
apps/web/src/features/reporting/components/*
TeacherCourseDashboardPage.tsx
apps/web/src/app/router.tsx
apps/web/src/shared/components/AppShell.tsx
```

## Work

1. Giữ content management actions trên Course Dashboard.
2. Thêm summary, top ranking và freshness.
3. Ranking filter/sort/page dùng URL search params và server response.
4. Activity/assessment tabs có loading/empty/no-data/error riêng.
5. Student detail có Back button giữ nguyên filter/page.
6. Forbidden/error phải clear prior Student data.
7. Table/list responsive, keyboard accessible và long-text safe.

## Tests

- `P06-WEB-004..007`, `P06-WEB-010`, `P06-WEB-014..015`.
- `P06-E2E-05`, `P06-E2E-06`, `P06-E2E-08`.
- `P06-AC-028..034`, `P06-AC-038..039`, `P06-AC-042`.

## Definition Of Done

- Teacher có thể từ Course Dashboard đi đến ranking và Student detail rồi quay lại đúng state.
- Cross-Course URL không hiển thị cached data.
- Desktop/mobile visual review Pass.
- P06-PR04 CI Pass trước merge.

## Implementation Result - 2026-07-30

- Status: `DONE`.
- Code commit: `9096d78`.
- Course Dashboard giữ nguyên content-management actions và bổ sung reporting summary/top Student.
- Analytics có các tab Progress, Activities, Assessments và Support; filter/sort/page được lưu trong URL.
- Student detail kiểm tra `returnTo` an toàn và Back giữ nguyên filter/page.
- Query key chứa actor/course/filter, response private dùng `no-store`; route đổi scope không hiển thị cache cũ.
- Web suite `109/109`, function coverage `80.15%`, production build Pass.
- Browser E2E toàn hệ thống `29/29`; Teacher journey `2/2`, responsive `390x844` và Axe serious/critical `0`.
- Đã sửa overflow do nhãn screen-reader trong table và compatibility của Student Course với DTO Phase 06.
- Chưa chuyển `DONE` cho tới khi Parent PR có remote CI Pass, review hoàn tất và merge.
