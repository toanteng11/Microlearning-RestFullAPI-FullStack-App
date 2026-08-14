# Part 14 - Admin Reporting Web

## Goal

Tích hợp Admin Dashboard/Reports nhưng vẫn giữ các lối đi User, Teacher Invitation, Classroom và
Course management hiện có.

## Parent PR

`P06-PR06 - Admin Reporting`

## Dependencies

- Part 13 API contract stable.

## Files

```text
apps/web/src/features/reporting/pages/AdminReportingDashboardPage.tsx
apps/web/src/features/reporting/pages/AdminGovernanceReportPage.tsx
apps/web/src/features/reporting/components/AdminSummary.tsx
apps/web/src/features/reporting/components/SuppressedMetric.tsx
apps/web/src/features/role-home/RoleHomePage.tsx
apps/web/src/app/router.tsx
apps/web/src/shared/components/AppShell.tsx
```

## Work

1. Chuyển `/admin/dashboard` sang reporting page.
2. Giữ management links hiện hữu.
3. Hiển thị governance lifecycle metrics và bounded filters.
4. `SUPPRESSED` hiển thị N/A/ghi chú phù hợp, không suy đoán số.
5. Forbidden/error clear prior data.
6. Conditional actions ẩn khi feature flag/allowedActions false.
7. Responsive, keyboard, ARIA và long-label states.
8. Remove dead `AdminHomePage` export/test sau cutover nếu không còn dùng.

## Tests

- `P06-WEB-009..011`, `P06-WEB-013..015`.
- `P06-E2E-10`, `P06-E2E-11`.
- `P06-AC-043..050`.

## Definition Of Done

- Admin quản trị cũ vẫn truy cập được.
- Không hiển thị raw/private learning data.
- Suppression và role-specific lists đúng.
- P06-PR06 CI Pass trước merge.

## Implementation Status

| Field | Result |
| --- | --- |
| Final status | `DONE` |
| Implementation commit | `c1f5fa9` |
| Admin Dashboard/Reports | Pass |
| Management workflow regression | Pass |
| Privacy projection | Pass |
| Browser evidence | Fresh-stack suite `34/34`; Admin reporting `2/2` |
| Evidence | `admin-reporting-web-evidence.md` |

Remote required CI/review/merge vẫn phải được ghi tại P06-PR06 hoặc release PR trước khi đổi thành
`DONE`.
