# Phase 06 Risk And Issues

## 1. Risk Register

| ID | Risk | P/I | Trigger | Prevention | Contingency | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| P06-R01 | Formula bị hiểu khác BA | M/H | Score mismatch review | Versioned definition/tests | Disable P06 metric, change control | PO/TL |
| P06-R02 | Weighted score tự phát minh | M/H | Unapproved weights in code | V1 frozen, flag false | Revert to V1/rebuild | TL |
| P06-R03 | Cross-Course/Student leak | M/C | IDOR test fail | Scope-before-query | Disable route, incident review | SEC/BE |
| P06-R04 | Draft Grade lộ | M/C | Projection test fail | Reader visibility contract | Disable report/export | SEC/BE |
| P06-R05 | Admin aggregate suy ngược Student | M/H | Small filter groups | Threshold/suppression | Disable outcome report | SEC |
| P06-R06 | Read model stale âm thầm | H/H | watermark/invalidation lag | Freshness envelope/reconcile | Return stale/partial, rebuild | BE/DEVOPS |
| P06-R07 | Report calculation chạy nhầm trong source transaction | M/H | fault/latency test | Durable intent only in transaction; recovery outside | Remove coupling, retain intent/rebuild | BE |
| P06-R08 | N+1/dashboard chậm | H/H | p95/explain fail | Batch/read model/index | Reduce scope/optimize query | BE/QA |
| P06-R09 | Ranking không stable | M/M | page duplicate/skip | Unique tie-breaker | Freeze snapshot/page strategy | BE |
| P06-R10 | Null bị hiển thị 0 | M/M | no-content Course | Nullable contract/UI tests | Hotfix formatter/DTO | BE/FE |
| P06-R11 | CSV formula injection | M/C | malicious Student name | Neutralizer/tests | Disable export | SEC/BE |
| P06-R12 | CSV memory/timeout | M/H | large export | row/date/column bounds | Disable export/defer P07 | BE/DEVOPS |
| P06-R13 | Local disk workaround | L/H | export temp file | Architectural guard/review | Delete workaround, disable | TL |
| P06-R14 | Event chứa PII | M/H | schema/log scan fail | Allowlist/denylist | Disable ingestion/purge TTL | SEC |
| P06-R15 | Event mất làm sai report | M/H | report uses event truth | Source rule/tests | Remove event metric | TL/BE |
| P06-R16 | Migration/backfill quá lâu | M/H | staging duration high | batches/checkpoints | Pause/resume, routes disabled | DEVOPS |
| P06-R17 | Definition đổi trộn history | M/H | mixed version trend | version partition | Hide trend/rebuild | BE/QA |
| P06-R18 | P05 API regression ngoài planned cutover | M/H | regression fail | coordinated API/Web/OpenAPI tests | Roll back P06 image/routes | BE |
| P06-R19 | Browser cache leak | L/C | logout test fail | actor query keys/clear cache | Force reload/disable cache | FE/SEC |
| P06-R20 | Scope creep chart/BI/AI | H/M | new unplanned requests | strict phase boundary | Defer/change request | PO/TL |
| P06-R21 | Old/new Express route đăng ký trùng | M/H | wrong handler wins/parity fail | Atomic route cutover + uniqueness test | Revert cutover PR | BE/TL |
| P06-R22 | Gradebook nén late/Grade vào một status | M/H | returned late work mất nghĩa | Orthogonal completion/grading states | Disable affected filter/revise DTO | BE/QA |
| P06-R23 | Mất parent/new invalidation khi concurrent recovery | M/H | stale worker resolve/race test fail | Same-transaction intent + hierarchical scope + revision/claim CAS | Reconcile/rebuild and incident review | BE/DEVOPS |
| P06-R24 | Export permission bị hiểu nhầm là feature đang bật | M/H | button/route hoạt động khi flag off | Static permission + flag + scope + allowedAction conjunction | Disable flag/route, clear private blob | BE/FE/SEC |

P: Probability, I: Impact; `C` = Critical, `H` = High, `M` = Medium, `L` = Low.

## 2. Current Issues/Decisions

| ID | Item | Status | Resolution needed |
| --- | --- | --- | --- |
| P06-I01 | Planning baseline chưa merge protected `main` | Resolved | PR `#16`, CI `6/6`, merge `e7437bc` |
| P06-I02 | CSV Conditional bật hay tắt | Resolved at Gate A | Implement bounded CSV; runtime default false |
| P06-I03 | Analytics event Conditional | Resolved at Gate A | Implement safe foundation; runtime default false |
| P06-I04 | Trend snapshot Conditional | Resolved at Gate A | Implement foundation; runtime default false/no-data |
| P06-I05 | Existing basic Gradebook flag migration | Resolved in planning | Same route/permission; replace V1 contract; retire old flag |
| P06-I06 | P05 Teacher progress `0` khi denominator 0 | Resolved in planning | Coordinated nullable contract correction |

Không item nào được im lặng mặc định thành scope implementation.

## 3. Risk Review Cadence

- Gate A: core/Conditional decisions và planning merge đã hoàn thành.
- Mỗi PR: update trigger/status.
- Before enabling Conditional: dedicated security/ops review.
- Gate E: Critical/High residual risk cần explicit waiver; mặc định không close phase.

## 4. Incident Priorities

1. Data leak/secret/export: disable route/flag ngay.
2. Wrong metric/Grade visibility: disable affected report, preserve source.
3. Migration/read-model corruption: stop backfill, rebuild from source.
4. Performance: reduce bounded scope/disable Conditional; source workflows remain.

## 5. Technical Debt Rule

Debt được chấp nhận phải có ID, impact, owner, target phase và không ảnh hưởng security/
correctness. “Sẽ sửa sau” không có owner/date không hợp lệ.
