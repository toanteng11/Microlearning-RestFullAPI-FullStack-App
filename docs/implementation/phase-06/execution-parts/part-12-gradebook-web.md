# Part 12 - Gradebook Web

## Goal

Xây dựng Gradebook table có thể quét, lọc và drill down trên desktop/mobile mà không tự tính
business metric.

## Parent PR

`P06-PR05 - Gradebook`

## Dependencies

- Part 11 API contract stable.

## Files

```text
apps/web/src/features/reporting/pages/TeacherGradebookPage.tsx
apps/web/src/features/reporting/components/GradebookTable.tsx
apps/web/src/features/reporting/components/GradebookCell.tsx
apps/web/src/features/reporting/components/GradebookFilters.tsx
apps/web/src/features/reporting/reporting-api.ts
apps/web/src/features/reporting/reporting-query-keys.ts
apps/web/src/styles.css
```

## Work

1. Render server-provided rows, columns, statuses và score.
2. Dùng sticky identifiers chỉ khi không gây overlap.
3. Filter/page nằm trong URL; Back/Forward hoạt động.
4. Loading/empty/stale/partial/error/forbidden states đầy đủ.
5. Long Student/activity names không phá layout.
6. Keyboard/ARIA labels cho sort/filter/drill-down.
7. Regrade/deadline change invalidates đúng query keys.

## Tests

- `P06-WEB-008`, `P06-WEB-010`, `P06-WEB-014..015`.
- `P06-E2E-07`, `P06-E2E-09`.
- `P06-AC-035..042`.

## Definition Of Done

- Gradebook không tự tính average/status ở Web.
- Desktop/mobile không overlap và không mất tên hàng/cột.
- Regrade/deadline refresh đúng cell/summary.
- P06-PR05 CI Pass trước merge.

## Implementation Result

| Field | Result |
| --- | --- |
| Status | `LOCAL_PASS_REMOTE_PENDING` |
| Branch | `feature/phase-06-gradebook` |
| Code commit | `fe36dda` |
| Web component | Full Web `115/115`; Gradebook focused `6/6` |
| Integrated browser | Full `32/32`; Gradebook `3/3` |
| Responsive | `390x844`, document overflow `0` |
| Accessibility | Axe serious/critical `0` |
| Evidence | `gradebook-evidence.md` |

Local Definition of Done đã đạt. Remote P06-PR05 CI/review/merge và post-merge `main` CI vẫn là
exit condition bắt buộc.
