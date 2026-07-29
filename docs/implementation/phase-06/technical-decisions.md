# Phase 06 Technical Decisions

## 1. Decision Status

| Field | Value |
| --- | --- |
| Baseline version | `P06-PLAN-V1` |
| Status | `ACCEPTED_AT_GATE_A` |
| Effective after | Planning PR CI Pass và merge vào protected `main` |
| Change rule | Semantics change phải tăng runtime version và cập nhật migration/tests |

## 2. Decision Register

| ID | Decision | Lý do | Trạng thái |
| --- | --- | --- | --- |
| P06-TD-001 | Giữ Modular Monolith, tạo module `reporting` | Phù hợp repo, tránh operational overhead | Accepted |
| P06-TD-002 | Transactional collections là source of truth | Không tạo hai nguồn dữ liệu học tập | Accepted |
| P06-TD-003 | Dùng `CourseProgressSummary` rebuildable | Giảm aggregate lặp và hỗ trợ stable ranking | Accepted |
| P06-TD-004 | Process score V1 bằng progress percentage | Đúng FR-063, giải thích được, không phát minh weights | Accepted |
| P06-TD-005 | Grade average tách khỏi process score | Tránh ảnh hưởng bởi ungraded/draft work | Accepted |
| P06-TD-006 | Scope resolve trước filter/query | Chặn IDOR và filter-based leakage | Accepted |
| P06-TD-007 | Reuse existing P04/P05 endpoints khi contract phù hợp | Hạn chế duplicate/breaking routes | Accepted |
| P06-TD-008 | Public report trả freshness envelope | Người dùng phân biệt fresh/stale/partial | Accepted |
| P06-TD-009 | Report calculation chỉ chạy sau commit qua bounded read recovery/command | Reporting failure không làm mất learning mutation | Accepted |
| P06-TD-010 | Durable invalidation + repair command | Có recovery path khi refresh lỗi | Accepted |
| P06-TD-011 | CSV sync bounded, không ghi local disk | Tôn trọng P07 storage boundary | Accepted |
| P06-TD-012 | Analytics event best effort, schema versioned | Không ảnh hưởng business transaction | Accepted |
| P06-TD-013 | UTC storage, IANA display timezone | Tránh sai deadline/date range | Accepted |
| P06-TD-014 | Null denominator -> `null/N/A` | Không trình bày sai `0%` | Accepted |
| P06-TD-015 | Server-side pagination/filter/sort allowlist | Hiệu năng và security | Accepted |
| P06-TD-016 | Không thêm charting library nếu bảng/metric đủ dùng | Giữ bundle nhỏ và UX tập trung hành động | Accepted |
| P06-TD-017 | Không thêm queue/cache/broker trong P06 | Chưa có nhu cầu/ops baseline | Accepted |
| P06-TD-018 | Feature flag cho mọi Conditional capability | Kill switch và rollback đơn giản | Accepted |
| P06-TD-019 | Reuse Student/Teacher domain permissions hiện có | Tránh capability trùng nghĩa và route migration không cần thiết | Accepted |
| P06-TD-020 | Grade aggregate chỉ dùng current Grade `RETURNED` | Khớp chính xác P05 runtime `DRAFT/RETURNED` | Accepted |
| P06-TD-021 | Nullable denominator là coordinated contract correction | Một official metric, không duy trì field legacy sai nghĩa | Accepted |
| P06-TD-022 | P06 thay thế P05 conditional Gradebook contract tại cùng route | P05 Gradebook chưa bật/release; tránh dual response shape | Accepted |
| P06-TD-023 | Ghi durable invalidation intent cùng source transaction | Đóng crash gap; refresh calculation vẫn post-commit | Accepted |
| P06-TD-024 | P06 router tiếp quản report paths, old registrations bị remove atomically | Tránh Express handler/OpenAPI trùng | Accepted |
| P06-TD-025 | Export permission grant static; feature flag/scope/allowedAction là runtime gate | Khớp current RBAC, toggle flag không cần auth redesign | Accepted |
| P06-TD-026 | Invalidation có hierarchical scope, reasons set và revision/claim CAS | Không mất parent/new intent trong concurrent recovery | Accepted |
| P06-TD-027 | P06 recovery Must là bounded read-time + idempotent CLI; scheduler thuộc P07 | Không dựng daemon/service mới trong modular monolith | Accepted |

## 3. Query And Read-Model Decisions

### 3.1 Query Path

```text
Authenticate
  -> Active account check
  -> Permission check
  -> Object scope resolution
  -> Query schema validation
  -> Freshness/read-model decision
  -> Bounded repository query
  -> Privacy DTO projection
  -> Audit/metrics where required
  -> Response
```

### 3.2 Freshness Resolution

| Condition | Action |
| --- | --- |
| Summary exists, version current, no pending invalidation | Return `FRESH` |
| Summary exists nhưng pending invalidation | Bounded inline refresh hoặc return `STALE` |
| Một phần Student refresh lỗi | Return valid rows + `PARTIAL`, nêu failed count không lộ identity |
| Không có summary | Rebuild bounded scope; nếu thất bại trả controlled error |
| Definition version đổi | Mark stale, rebuild; không trộn rank giữa version |

### 3.3 Mutation Hook

Source mutation và durable invalidation theo `{courseId, studentId?}` được ghi trong cùng Mongo
transaction/`ClientSession`. Sau commit, report read hoặc rebuild/reconcile command mới tính
bounded summary. Lỗi recovery được log/metric và giữ pending invalidation; không rollback source
mutation đã commit. P07 có thể schedule cùng command, không đổi consistency contract.

## 4. Data Decisions

- Read model không denormalize `email/fullName`; response join safe User summary theo scope.
- Numeric score lưu integer/tenths theo policy hiện có; API không dùng floating equality.
- `definitionVersion`, `sourceMetricVersion`, `descriptorVersion` là required.
- Invalidation dùng idempotent upsert; cùng scope set-union/dedupe `reasons[]` và giữ
  `sourceChangedAt` mới nhất.
- Analytics event có unique `eventId`, TTL retention nếu Conditional được bật.
- Không có `ReportExportJob` ở P06 baseline sync.

## 5. API Compatibility Decisions

- Existing paths được giữ; Student/Teacher permissions hiện có được reuse.
- Nullable denominator là thay đổi type có chủ đích cho Teacher report fields. API/Web/OpenAPI/
  tests phải cutover atomically; không duy trì field legacy `0` và field mới `null` song song.
- `GET /teacher/courses/:courseId/gradebook` giữ path/permission nhưng thay
  `P05_BASIC_GRADEBOOK_V1` bằng `P06_GRADEBOOK_V1`; old feature flag được retire theo cutover.
- New P06 response fields nằm trong versioned metric/freshness envelope.
- Query field lạ hoặc sort field không allowlist trả `400 VALIDATION_ERROR`.
- Authorization failure dùng `403`; resource ngoài scope có thể normalize thành `404` theo
  policy chống enumeration hiện có.
- CSV response có cùng scope/filter semantics như JSON report.

## 6. Rejected Alternatives

| Alternative | Lý do từ chối |
| --- | --- |
| Frontend gọi nhiều API rồi tự tính ranking | Dễ lệch metric, lộ scope, N+1 và không audit được |
| Weighted score ngay V1 | Chưa có weight/ungraded/history decision |
| Mongo aggregation trực tiếp trên raw answer | Vi phạm module/privacy boundary |
| Local file export trong container | Cloud Run ephemeral, vi phạm P05/P07 handoff |
| Mỗi dashboard thành microservice | Tăng deployment/consistency cost không cần thiết |
| Redis cache | Chưa có invalidation/ops dependency, read model đủ cho MVP |
| Background loop trong Cloud Run request container | Không có guarantee chạy liên tục |
| `0%` khi denominator 0 | Gây hiểu sai “không có dữ liệu” thành “không hoàn thành” |
| Admin xem toàn bộ Student Grade để aggregate ở Web | Vi phạm least privilege và data minimization |

## 7. Gate A Checklist

- [x] Tất cả `Proposed` chuyển thành `Accepted` hoặc có decision thay thế.
- [x] Không còn decision ảnh hưởng Must ở trạng thái `TBD`.
- [x] Conditional flags và default value được duyệt.
- [x] Migration/rollback/reconciliation có owner.
- [x] Performance target và benchmark fixture được QA/DevOps xác nhận.

Approval/evidence: `gate-a-decision-sheet.md` và `gate-a-review-evidence.md`. Các quyết định có
hiệu lực implementation khi planning PR được merge vào protected `main`.
