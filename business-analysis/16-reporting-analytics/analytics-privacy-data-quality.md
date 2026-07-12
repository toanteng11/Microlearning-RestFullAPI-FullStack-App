# Analytics Privacy And Data Quality

## Mục Đích

Report/analytics có rủi ro gộp dữ liệu Student/Teacher thành tập lớn, nên cần privacy và data quality ngay từ thiết kế. Một metric chính xác nhưng cho sai người xem vẫn là lỗi nghiêm trọng; một dashboard nhanh nhưng stale/sai công thức cũng không giúp ra quyết định đúng.

## Privacy Principles For Reporting

| Principle | Requirement |
| --- | --- |
| Data minimization | Thu thập/hiển thị/export field/event cần cho report question; không mirror toàn bộ User/Submission document. |
| Purpose limitation | Learning report phục vụ học/giảng dạy/governance; product analytics phục vụ aggregate adoption; không tái sử dụng ngầm cho mục đích khác. |
| Role/object scope | Authorization server-side áp dụng trước query, filter, snapshot/export/download. |
| Pseudonymization | Analytics audience không cần identity phải dùng internal/pseudonymous reference hoặc aggregate. |
| Small-group protection | Aggregate ở nhóm quá nhỏ có risk re-identification cần threshold/suppress/rounding policy được Product Owner/Technical Lead chốt. |
| No sensitive secrets | Không password/hash/token/link/code/raw file/feedback text trong event payload, report projection, screenshot/log. |
| Retention discipline | Raw event/export/snapshot giữ theo purpose/TTL; official learning record theo retention policy riêng. |
| Auditability | Sensitive report/export/definition change có audit record an toàn. |

## Data Elements Policy

| Data element | Dashboard/report | Analytics event | Export | Rule |
| --- | --- | --- | --- | --- |
| Internal User ID | Allowed when scope requires | Pseudonymized/controlled | Allowed only authorized scope | Không dùng email làm analytics identifier mặc định. |
| Full name/email | Only role-scope table when action requires | No | Only authorized report if necessary | Projection/minimize. |
| Progress/score/feedback | Student self/Teacher owned/Admin governance | Aggregate only, no raw feedback | High sensitivity, authorized only | Never cross-class by Teacher. |
| Submission/question/media content | Detail only when role needs learning action | No | Exclude by default | File/content not analytics payload. |
| Invitation token/link/code payload | No | No | No | Only invitation flow uses raw token once. |
| Password/hash/token/secret | No | No | No | Forbidden everywhere except protected server storage/hash policy. |
| Audit reason | Restricted audit view if needed | No | Restricted export if policy | Mask/minimize sensitive wording. |

## Retention And Deletion Direction

| Artifact | Retention direction | Cleanup/control |
| --- | --- | --- |
| Transactional learning record | Theo `../10-data-requirements/data-retention-privacy.md` | Archive/soft delete policy, not controlled by analytics cleanup. |
| Read model | Giữ khi hỗ trợ dashboard; rebuildable | Rebuild/delete according source/retention, no loss of official record. |
| ReportSnapshot | TTL based on report purpose and data sensitivity | Delete expired snapshot/output; retain safe metadata/audit if required. |
| Export file | Short TTL, private | Auto cleanup, access revoked/expired, audit retained. |
| Raw analytics event | Minimum period needed for trend/debug | Aggregate/anonymize/delete according approved retention. |
| Aggregate trend | Longer if no unnecessary identity and policy allows | Definition/version retained for interpretation. |
| Invalid/quarantined event | Short operational retention | Restrict access, clean after investigation policy. |

## Data Quality Dimensions

| Dimension | Question | Control/example |
| --- | --- | --- |
| Completeness | Có thiếu record/event/field cần thiết không? | Required schema validation; event ingestion count; expected vs actual submission/progress sample. |
| Validity | Value có đúng type/range/enum/timezone không? | API/event schema, date range/score/status allowlist, reject malformed data. |
| Accuracy | Metric có phản ánh source/business rule thật không? | Recompute sample/full course from source; compare summary/export. |
| Consistency | UI/API/CSV/snapshot có cùng definition không? | Central backend calculator, definition version, contract/regression test. |
| Timeliness | Dữ liệu có đủ mới cho decision không? | `asOf/recalculatedAt`, freshness lag alert, job SLA/threshold. |
| Uniqueness | Có double count enrollment/event/submission không? | Unique constraints, eventId dedupe, idempotent mutation. |
| Traceability | Có biết version/source/filter tạo metric không? | Report ID, definition version, filter hash/summary, requestId/deployment version. |

## Quality Controls

| Control | Requirement |
| --- | --- |
| Input validation | Reporting filter/event property validate type, enum, max size/range; reject unsafe Mongo operator. |
| Business event source | Use successful transactional mutation for join/complete/submit/grade; client view event is non-authoritative. |
| Idempotency/dedupe | Enrollment/business operation unique guard; analytics `eventId` dedupe; no double count retry. |
| Summary rebuild | Provide safe mechanism to recompute StudentTodoItem/CourseProgressSummary/report snapshot. |
| Reconciliation | Test high-value Course/Classroom after release/data change; record expected/actual/difference. |
| Freshness monitoring | Alert/flag when scheduled refresh/job fails or lag exceeds configured limit. |
| Metric versioning | Version/report change effective date; don’t mix incompatible old/new trend silently. |
| QA fixtures | Include edge cases: zero denominator, deadline reset, inactive enrollment, regrade, timezone boundary, duplicate retry. |

## Timezone And Date Boundary Risk

- Store source timestamps in UTC; choose display/report timezone per organization/product setting and return it with report.
- Daily/weekly trend, due soon, late/missing and date range must use the same documented timezone logic across UI/API/export.
- Test end-of-day, daylight saving if applicable for deployment region, and deadline reset across date boundary.
- Do not compare a UTC bucket chart with local-time deadline report without label; this creates apparent mismatch.

## Data Quality Incident Flow

```text
Metric anomaly or user report
  -> identify report/definition version/filter/asOf and affected scope
  -> compare summary/export with transactional source
  -> classify source data, calculation, stale refresh, timezone, duplicate event or authorization issue
  -> contain: mark partial/stale, pause export/feature if misleading or privacy-risky
  -> repair: fix rule, rebuild/reprocess, validate with QA
  -> communicate correction/version impact and record audit/change
```

## Acceptance Checklist

- Report/export/event payload has privacy classification and no forbidden field.
- High-value metrics reconcile from source across representative edge cases.
- Data freshness/timezone/definition version are visible where aggregate result may be stale or comparable over time.
- Event schema/dedupe/retention and export TTL/audit are implemented before external analytics/bulk export.
- Privacy/quality incident has a safe containment and correction path.

## Liên Kết

- Data retention: `../10-data-requirements/data-retention-privacy.md`.
- Privacy NFR: `../13-non-functional-requirements/privacy-compliance.md`.
- Event/data model: `analytics-event-tracking.md`, `analytics-data-model.md`.
