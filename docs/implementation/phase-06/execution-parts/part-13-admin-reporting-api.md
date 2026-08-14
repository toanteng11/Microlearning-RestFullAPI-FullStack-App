# Part 13 - Admin Reporting API

## Status

`DONE` - implementation, OpenAPI, unit, integration, privacy và performance evidence đã Pass tại
commit `2bbbc2d` và được kiểm chứng lại trong release PR `#18`.

## Goal

Cung cấp governance/audit aggregates cho Admin và Super Admin mà không mở quyền đọc dữ liệu học
tập riêng tư.

## Parent PR

`P06-PR06 - Admin Reporting`

## Dependencies

- Part 06 `DONE`.
- Gate A privacy threshold `5` Accepted.

## Files

```text
admin-reporting.service.ts
reporting-governance.reader.ts
reporting-audit.reader.ts
adapters/mongo-reporting-governance.reader.ts
adapters/mongo-reporting-audit.reader.ts
apps/api/src/docs/phase-six-admin-reporting.openapi.ts
apps/api/src/modules/phase-six.router.ts
```

## Work

1. User counts tách role/status/source.
2. Invitation/Classroom/Course/enrollment lifecycle counts.
3. Bounded date/status/timezone filters.
4. Role-specific User list workflows giữ nguyên, không tạo all-user unbounded view.
5. Metadata allowlist loại raw answer, Submission, Grade draft và feedback.
6. Sensitive learning aggregate dưới 5 thành viên trả `SUPPRESSED`; governance lifecycle count của
   Part 13 được miễn theo documented definition và không chứa Grade/progress outcome.
7. Super Admin vẫn áp dụng redaction/threshold.
8. Sensitive report view ghi safe AuditLog.

## Tests

- `P06-IT-043..050`.
- `P06-PERF-006`.
- `P06-AC-043..050`, security/privacy criteria liên quan.

## Stop Conditions

- Admin route trả individual Grade/answer/body.
- Super Admin bypass threshold.
- Count và item dùng filter khác nhau.
- Date range hoặc page không bounded.

## Definition Of Done

- Governance counts đúng source.
- Non-Admin bị chặn.
- Small-group và redaction tests Pass.
- Audit metadata không chứa filter value nhạy cảm.
- OpenAPI/runtime parity Pass.

## Local Result

- Runtime routes: `GET /admin/dashboard`, `GET /admin/reports/governance`,
  `GET /admin/audit-logs`.
- User count luôn đủ role/status key và có registration source counts.
- Invitation hết hạn được tính theo effective status tại `asOf`, kể cả record còn lưu `PENDING`.
- Date-only được resolve theo IANA timezone; default range `30` ngày; vượt `365` ngày trả
  `422 REPORT_LIMIT_EXCEEDED`.
- Audit list dùng projection allowlist; report-view AuditLog chỉ lưu tên filter, range size,
  pagination và row count, không lưu raw filter value.
- `npm run check:ci`: Pass; API `220/220`, Web `115/115`.
- Part 13 Mongo integration `4/4`: Pass; `P06-PERF-006` p95 `28.07 ms`/target `1200 ms`.
- Evidence: `../admin-reporting-api-evidence.md`.
