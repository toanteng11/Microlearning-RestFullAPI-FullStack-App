# Phase 06 Conditional Reporting Evidence

## 1. Identity

| Field | Value |
| --- | --- |
| Scope | Part 15 - Conditional Capabilities |
| Implementation commit | `f1baf06` |
| Final decision | `PASS` |
| Captured date | `2026-08-03` |

## 2. Capability Result

| Capability | Result | Principal evidence |
| --- | --- | --- |
| Bounded CSV | Local Pass | same scoped filters, fixed columns, row/date bounds, streaming, audit, formula neutralization, no local file |
| Analytics event | Local Pass | versioned allowlist, auth-derived actor, UUID dedupe, TTL, rate limit, PII rejection, failure isolation |
| Student trend | Local Pass | compatible versioned snapshots; incompatible/insufficient history trả `NO_DATA` |
| Admin learning outcomes | Local Pass | aggregate only, minimum group `5`, suppression và no individual Grade |
| Weighted process score V2 | `APPROVED_NA` | `WEIGHTED_PROCESS_SCORE_ENABLED=false`; V1 remains canonical |
| XLSX/async/private export | `APPROVED_NA` | deferred P07; không local export directory, scheduler hoặc public object |

## 3. Contracts And Controls

- Conditional flags default `false` trong `.env.example` và fail-fast environment schema.
- API route yêu cầu authentication, role permission, scope và strict Zod query/body.
- Web dùng backend `allowedActions`; không suy diễn khả năng từ role hoặc flag phía client.
- Analytics identity limit là `120`; body limit `16384` bytes; retention mặc định `90` ngày.
- CSV không dùng local disk và thêm audit request/result metadata.

## 4. Automated Evidence

| Suite | Result |
| --- | --- |
| Conditional API unit/service | Pass |
| Conditional Mongo integration | Pass |
| Conditional Web/component | Pass |
| API total | `230/230` |
| Web total | `126/126` |
| Replica-set integration total | `97/97` |
| OpenAPI | `10/10` |

Release PR `#18` và post-merge main CI đã Pass.
