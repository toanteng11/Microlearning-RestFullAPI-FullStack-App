# Phase 06 Gate A Decision Sheet

## 1. Purpose

Gate A dùng một decision sheet duy nhất để Product Owner và reviewers phê duyệt baseline. Các
giá trị dưới đây là recommendation đã được BA/source review; không còn option `TBD`.

## 2. Core Decisions

| ID | Recommended decision | Impact if accepted | Approval |
| --- | --- | --- | --- |
| P06-GA-001 | `processScore=P06_PROCESS_SCORE_V1=progressPercentage` | Không có weights, explainable | Approved |
| P06-GA-002 | Denominator 0 -> `null/N/A` | Coordinated Teacher API/Web type correction | Approved |
| P06-GA-003 | Ranking tie-breaker theo documented six-field order | Stable pagination | Approved |
| P06-GA-004 | Grade average chỉ current Grade `RETURNED`, weighted by points | Draft không lộ/không tính | Approved |
| P06-GA-005 | Gradebook dùng orthogonal completion/grading states | Giữ được late + returned cùng lúc | Approved |
| P06-GA-006 | Reuse P04/P05 Student/Teacher permissions | Ít RBAC churn, same access | Approved |
| P06-GA-007 | P06 router tiếp quản reporting routes; no duplicate handlers | Atomic cutover | Approved |
| P06-GA-008 | Replace `P05_BASIC_GRADEBOOK_V1`, retire old flag | Một Gradebook contract | Approved |
| P06-GA-009 | Versioned Course summary + transactional hierarchical invalidation + CAS recovery | Freshness/recovery/performance, no lost intent | Approved |
| P06-GA-010 | Privacy minimum group size `5` | Suppress small-group aggregate | Approved |

## 3. Conditional Decisions

| ID | Recommended disposition | Runtime default | Approval |
| --- | --- | --- | --- |
| P06-GA-C01 | Implement bounded Teacher/Admin CSV in P06 | `REPORT_EXPORT_ENABLED=false` until tests/security Pass | Approved - Implement |
| P06-GA-C02 | Implement safe event foundation after Must slices | `ANALYTICS_EVENTS_ENABLED=false` | Approved - Implement |
| P06-GA-C03 | Implement Student snapshot/trend after summary foundation | `STUDENT_PROGRESS_TREND_ENABLED=false` | Approved - Implement |
| P06-GA-C04 | Implement Admin learning outcome with threshold | Hidden until privacy tests Pass | Approved - Implement |
| P06-GA-C05 | Defer weighted process score V2 | `WEIGHTED_PROCESS_SCORE_ENABLED=false` and must remain false | Approved - Defer |
| P06-GA-C06 | Defer XLSX/async/private export to P07 | No local file/job | Approved - Defer |

“Implement nhưng default false” nghĩa source/test/contract có trong P06; production enablement
chờ Gate E/P07. Nó không có nghĩa capability bị bỏ qua khỏi test.

## 4. Technical Acceptance

- [x] `compatibility-and-cutover-plan.md` accepted.
- [x] `report-dto-and-query-contracts.md` accepted.
- [x] `source-event-invalidation-matrix.md` accepted.
- [x] API/data/migration/rollback accepted.
- [x] 68 Must + 6 Conditional acceptance model accepted.
- [x] WBS/PR strategy accepted.

## 5. Approval Record

| Role | Name | Decision | Date | Note |
| --- | --- | --- | --- | --- |
| Product Owner | Trần Đức Toàn | Approved | `2026-07-29` | Core scope, metric semantics và Conditional disposition |
| Technical Lead | Trần Đức Toàn | Approved | `2026-07-29` | Architecture, contract, cutover và recovery |
| QA | Trần Đức Toàn | Approved | `2026-07-29` | Acceptance, test catalog, baseline và NFR |
| Security | Trần Đức Toàn | Approved | `2026-07-29` | Privacy threshold, CSV, event và IDOR controls |
| DevOps | Trần Đức Toàn | Approved | `2026-07-29` | Migration, Docker/CI baseline và P07 boundary |

Đây là đồ án cá nhân. Các approval trên là `role-based self-review` của Project Owner, có
automated test evidence hỗ trợ; không được hiểu là review độc lập bởi năm thành viên khác nhau.
Khi có giảng viên hoặc reviewer bên ngoài góp ý làm thay đổi business semantic, thay đổi phải đi
qua change control và cập nhật lại decision/evidence tương ứng.

## 6. Transition Rule

Tất cả core decisions và Conditional dispositions đã được `Approved`. Trạng thái chuyển tiếp:

1. Technical Decision statuses chuyển từ `Proposed` sang `Accepted`;
2. README/Gate A chuyển `APPROVED`;
3. planning PR phải CI Pass và merge vào protected `main`;
4. merge commit kích hoạt `READY_TO_CODE`;
5. local `main` phải pull merge commit trước khi tạo branch `P06-PR02`.

Không cần mở lại BA trừ khi reviewer từ chối một business semantic hoặc mở rộng actor scope.
