# Part 13 - Admin Reporting API

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
6. Aggregate dưới 5 thành viên trả `SUPPRESSED`.
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
