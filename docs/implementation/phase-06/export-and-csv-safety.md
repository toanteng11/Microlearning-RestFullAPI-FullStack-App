# Phase 06 Export And CSV Safety

## 1. Status

CSV export là `Conditional Should`, mặc định `REPORT_EXPORT_ENABLED=false`. Gate A phải xác
nhận bật/tắt từng actor report. XLSX, async job và persistent file thuộc Phase 07.

## 2. Supported P06 Exports

| Export | Permission | Projection |
| --- | --- | --- |
| Teacher Gradebook | `report.export_owned` | Owned Course Gradebook safe fields |
| Teacher Progress | `report.export_owned` | Ranking/progress fields |
| Admin Governance | `report.export_governance` | Metadata/aggregate |
| Admin Audit | `report.export_governance` | Redacted AuditLog fields |

Student export không thuộc P06 Must.

## 3. Request Pipeline

```text
Auth/status
  -> permission
  -> object scope
  -> strict filter
  -> date/row/column estimate
  -> bounded query
  -> projection
  -> CSV neutralization/serialization
  -> response stream
  -> audit success/failure
```

Export không dùng query/service riêng làm scope rộng hơn JSON report.

## 4. Bounds

- Max `5,000` rows.
- Max `365` days.
- Gradebook max `50` activity columns.
- Timeout theo API request budget.
- Vượt limit trả `422 REPORT_LIMIT_EXCEEDED` trước khi stream nếu có thể.
- Không tự chia nhiều file hoặc zip.

## 5. CSV Format

- UTF-8; BOM chỉ bật nếu compatibility test Excel yêu cầu và được chốt.
- RFC 4180-compatible serializer/library.
- Safe filename:
  `microlearning-<report-id>-<course-or-scope>-<yyyyMMdd-HHmmss>.csv`.
- Không đưa user-controlled raw text vào filename.
- Header order cố định/versioned.
- Metadata columns lặp trong row hoặc sidecar HTTP headers:
  `reportId`, `definitionVersion`, `generatedAt`, `timezone`, `asOf`.

## 6. Formula Injection Protection

Mọi string sau trim-left bắt đầu bằng một trong:

```text
=
+
-
@
\t
\r
```

phải được neutralize bằng prefix apostrophe theo serializer policy. Việc quote CSV không đủ để
chặn spreadsheet formula execution.

Kiểm thử:

- `=HYPERLINK(...)`;
- `+1+1`;
- `-2+3`;
- `@SUM(...)`;
- tab/carriage-return prefix;
- Unicode/leading spaces trước formula;
- commas, quotes, CRLF và long text.

## 7. Privacy Projection

- Teacher export có safe Student identity cần cho lớp, không có raw answer/private token.
- Admin governance export ưu tiên aggregate; không export email mặc định.
- Draft Grade/private feedback không vào Student/Admin export.
- Audit export redacts payload keys denylist.
- Small-group suppression áp dụng trước export.

## 8. Audit

Request/success/failure ghi:

- actor ID/role;
- report ID/definition version;
- scoped resource ID;
- safe filter summary;
- estimated/actual row count;
- generatedAt/duration/result;
- request/correlation ID.

Không ghi CSV body hoặc toàn bộ Student list.

## 9. Failure Semantics

- Nếu lỗi trước headers: standard JSON error.
- Nếu lỗi sau stream bắt đầu: close stream, structured log/audit failed; UI báo tải thất bại.
- Client không tự retry export nhiều lần.
- Feature flag tắt trả `404/409 FEATURE_NOT_ENABLED` theo repo convention.

## 10. P07 Handoff

Phase 07 có thể thêm:

- `ReportExportJob`;
- private GCS object;
- signed download URL/re-authorization;
- retention/expiry/cleanup;
- Cloud Run Job/Scheduler;
- XLSX;
- large report async notification.

P06 contract phải giữ report ID, definition version, scope/filter/projection để P07 tái sử dụng.

## 11. Exit Check

- [ ] Gate A bật Conditional.
- [ ] Permission/ownership/filters parity.
- [ ] Formula injection test Pass.
- [ ] Bounds/memory/timeout test Pass.
- [ ] Audit Pass.
- [ ] Không local file/temp artifact còn lại.
- [ ] UI không render export khi flag/allowedAction false.
