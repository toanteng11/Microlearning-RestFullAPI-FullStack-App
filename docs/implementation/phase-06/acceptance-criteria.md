# Phase 06 Acceptance Criteria

## 1. Rules

- `P06-AC-001..068` là Must.
- `P06-AC-069..074` là Conditional.
- Conditional chỉ `APPROVED_NA` khi flag không được Gate A bật và có approval.
- `Pass` cần automated/manual evidence theo criterion.

## 2. Planning And Contract `001..008`

| ID | Criterion |
| --- | --- |
| P06-AC-001 | P05 handoff/version/boundary được assert và không có breaking change âm thầm. |
| P06-AC-002 | Scope Must/Conditional/Deferred được Product/Technical/QA review. |
| P06-AC-003 | Process score V1 formula/null/rounding/version được duyệt. |
| P06-AC-004 | Ranking tie-breaker deterministic được khóa. |
| P06-AC-005 | Grade average/visibility được khóa. |
| P06-AC-006 | Freshness/no-data/partial vocabulary được khóa. |
| P06-AC-007 | API/data/UI/test/traceability không còn TBD chặn Must. |
| P06-AC-008 | Planning PR CI xanh, merge main, Gate A record đầy đủ. |

### 2.1 Planning Execution Result

| ID | Result | Evidence |
| --- | --- | --- |
| P06-AC-001 | Pass | `gate-a-review-evidence.md` sections 1, 2 và 5 |
| P06-AC-002 | Pass | `gate-a-decision-sheet.md`; `development-readiness-review.md` |
| P06-AC-003 | Pass | `gate-a-decision-sheet.md` P06-GA-001/002 |
| P06-AC-004 | Pass | `gate-a-decision-sheet.md` P06-GA-003 |
| P06-AC-005 | Pass | `gate-a-decision-sheet.md` P06-GA-004/005 |
| P06-AC-006 | Pass | `technical-decisions.md`; freshness canonical contracts |
| P06-AC-007 | Pass | `gate-a-review-evidence.md`; planning validation Pass |
| P06-AC-008 | Pass | PR `#16`, PR CI `6/6`, merge `e7437bc`, main CI `30448420376` Pass |

Planning result hiện tại: `8/8 Pass`. Không cộng local baseline vào implementation acceptance
của Data/API/Web.

## 3. Data And Read Model `009..018`

| ID | Criterion |
| --- | --- |
| P06-AC-009 | Summary schema/index unique và invariants Pass. |
| P06-AC-010 | Summary không chứa PII/content/answer/feedback bị cấm. |
| P06-AC-011 | Metric calculator deterministic với fixed source/asOf. |
| P06-AC-012 | Invalidation idempotent/coalesced; multi-reason không mất và stale worker không xóa intent mới. |
| P06-AC-013 | Source + durable intent atomic qua required writer/`ClientSession`; production không silent noop; source mutation không rollback khi refresh sau commit lỗi. |
| P06-AC-014 | Stale/partial/failed được nhận diện đúng. |
| P06-AC-015 | Rebuild bounded/idempotent. |
| P06-AC-016 | Reconcile phát hiện difference và repair chỉ read model. |
| P06-AC-017 | Migration/index/backfill chạy lại an toàn. |
| P06-AC-018 | Explain plan chính dùng index, không unbounded scan/N+1. |

## 4. Student `019..027`

| ID | Criterion |
| --- | --- |
| P06-AC-019 | Dashboard hiển thị đúng actionable To-do scoped. |
| P06-AC-020 | Dashboard có Course progress và recent returned Grade. |
| P06-AC-021 | To-do mixed Lesson/Quiz/Assignment giữ P05 V2 semantics. |
| P06-AC-022 | Student chỉ xem report/Grade của chính mình. |
| P06-AC-023 | Progress/process score/definition/freshness đúng Course. |
| P06-AC-024 | Denominator 0 trả `null`, UI `N/A`. |
| P06-AC-025 | Completed activity rời pending và summary refresh. |
| P06-AC-026 | Draft Grade/private feedback không lộ. |
| P06-AC-027 | Loading/empty/stale/partial/error/forbidden responsive và accessible. |

## 5. Teacher `028..042`

| ID | Criterion |
| --- | --- |
| P06-AC-028 | Owned Course Dashboard có required/published/roster/average/missing/late/ungraded. |
| P06-AC-029 | Dashboard top activity/top ranking đúng source. |
| P06-AC-030 | Ranking mặc định `processScore DESC` stable. |
| P06-AC-031 | Ranking search/filter/sort/page chạy server-side. |
| P06-AC-032 | Pagination không duplicate/skip do tie. |
| P06-AC-033 | Activity analysis counts/rates/denominator đúng. |
| P06-AC-034 | Assessment analysis dùng finalized/returned policy rõ. |
| P06-AC-035 | Gradebook rows/columns bounded và order stable. |
| P06-AC-036 | Gradebook completion/grading dimensions và display precedence đúng. |
| P06-AC-037 | Grade average weighted by points, draft không vào Student/Admin average. |
| P06-AC-038 | Teacher Student Detail đúng roster/scope. |
| P06-AC-039 | Cross-Course/cross-Teacher IDOR bị chặn. |
| P06-AC-040 | Deadline exception cập nhật missing/late đúng Student. |
| P06-AC-041 | Grade return/regrade cập nhật Gradebook/average đúng. |
| P06-AC-042 | Teacher UI states/navigation/Back/Forward/accessibility Pass. |

## 6. Admin `043..050`

| ID | Criterion |
| --- | --- |
| P06-AC-043 | Dashboard counts user theo role/status đúng nguồn. |
| P06-AC-044 | Invitation/Classroom/Course/enrollment lifecycle counts đúng. |
| P06-AC-045 | Admin report filter/date/timezone bounded và scoped. |
| P06-AC-046 | Admin không xem raw answer/Submission/draft Grade/private feedback. |
| P06-AC-047 | Role-specific User lists không bị thay bằng all-user unbounded list. |
| P06-AC-048 | Small-group aggregate bị suppress đúng threshold. |
| P06-AC-049 | Super Admin giữ redaction/audit. |
| P06-AC-050 | Sensitive report view có safe AuditLog. |

## 7. Security/API/Privacy `051..060`

| ID | Criterion |
| --- | --- |
| P06-AC-051 | Auth/account/permission áp dụng cho mọi reporting route. |
| P06-AC-052 | Scope resolve trước data query. |
| P06-AC-053 | Unknown filter/sort/operator bị reject. |
| P06-AC-054 | Page/row/column/date/body bounds enforced. |
| P06-AC-055 | Count/items/export dùng cùng scoped filter. |
| P06-AC-056 | Private cache xóa khi logout/role/session đổi. |
| P06-AC-057 | Response/log/event không chứa secret/denylist data. |
| P06-AC-058 | OpenAPI khớp runtime route/schema/error/nullability và moved path chỉ có một handler/operation. |
| P06-AC-059 | Structured errors có request ID, không stack/secret. |
| P06-AC-060 | Rate/abuse controls không chặn normal dataset nhưng chặn vượt ngưỡng. |

## 8. Quality And Exit `061..068`

| ID | Criterion |
| --- | --- |
| P06-AC-061 | Unit/integration/OpenAPI/Web/E2E required tests Pass. |
| P06-AC-062 | P02-P05 regression Pass. |
| P06-AC-063 | Student/Teacher dashboard/list đạt NFR baseline. |
| P06-AC-064 | Docker integrated stack và deterministic seed Pass. |
| P06-AC-065 | Clean-clone onboarding verification Pass. |
| P06-AC-066 | PR CI và post-merge main required checks Pass. |
| P06-AC-067 | Critical/High defects = 0, risks/debt có disposition. |
| P06-AC-068 | Evidence/exit report/P07 handoff được review và accepted. |

## 9. Conditional `069..074`

| ID | Criterion |
| --- | --- |
| P06-AC-069 | CSV feature flag/permission/allowedAction đồng nhất. |
| P06-AC-070 | CSV projection/filter/bounds/formula injection/audit Pass. |
| P06-AC-071 | Analytics event schema/dedupe/PII/retention/failure isolation Pass. |
| P06-AC-072 | Student trend chỉ dùng compatible snapshots và có NO_DATA. |
| P06-AC-073 | Admin outcome aggregate threshold/differencing review Pass. |
| P06-AC-074 | Weighted score V2 chỉ bật khi formula/migration/history riêng được approve. |

## 10. Exit Summary Template

```text
Must: <passed>/68
Conditional: <passed>/<enabled>, <approved-na>/<disabled>
Critical: 0
High: 0
PR CI: <url>
Main CI: <url>
Release commit: <sha>
Decision: PASS | FAIL | CONDITIONAL_PASS
```
