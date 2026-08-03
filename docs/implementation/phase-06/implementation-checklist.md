# Phase 06 Implementation Checklist

## Gate A - Planning

- [x] P05 handoff reviewed.
- [x] BA alignment reviewed.
- [x] Must/Conditional/Deferred approved.
- [x] Metric/process score/Grade/ranking approved.
- [x] Gate A decision sheet signed.
- [x] DTO/query/cutover/invalidation contracts approved.
- [x] Privacy/threshold/export/event decisions approved.
- [x] API/data/UI/test/WBS reviewed.
- [x] Execution Parts 00-17 mapped to Parent PR, owner and dependency.
- [x] Planning PR CI Pass and merged.
- [x] Status changed to `READY_TO_CODE`.

Gate A/local/remote evidence: `gate-a-review-evidence.md`; PR `#16`, Actions run
`30448148966`, merge `e7437bc`.

## Gate B - Foundation

- [x] Permissions and env validated.
- [x] Existing reporting route ownership cutover planned atomically.
- [x] Pure metric policies Pass.
- [x] Reader ports/adapters safe and batched.
- [x] Summary/invalidation schemas/indexes Pass.
- [x] Source transaction invalidation matrix Pass.
- [x] Migration/backfill idempotent với legacy candidate count `0`.
- [x] Refresh/rebuild/reconcile Pass.
- [x] Fault isolation/concurrency Pass.

Gate B local evidence: commit `1afe813`, `gate-b-foundation-evidence.md`. Trạng thái Gate B là
`LOCAL_PASS_REMOTE_PENDING`; chỉ đổi thành `PASS` sau P06-PR02 CI/review/merge.

## Gate C - API And Security

- [x] Student APIs Pass locally; remote PR evidence pending.
- [x] Teacher dashboard/ranking/detail Pass locally; remote PR evidence pending.
- [x] Gradebook API/atomic cutover Pass locally; remote P06-PR05 evidence pending.
- [x] Admin governance/audit reports Pass locally; remote release gate pending.
- [x] RBAC/ownership/enrollment/IDOR Pass for Student/Teacher reporting scope.
- [x] Privacy/projection/threshold Pass for Student/Teacher/Gradebook/Admin scope.
- [x] Query bounds and final analytics rate hardening Pass.
- [x] OpenAPI parity Pass for Student/Teacher/Gradebook/Admin/Conditional reporting operations.
- [x] Unique Express/OpenAPI operation per moved Student/Teacher/Gradebook path Pass.

## Gate D - Web And Integration

- [x] Student Dashboard/Progress Pass locally.
- [x] Teacher Dashboard/Analytics/Detail Pass locally.
- [x] Gradebook Web, URL state, mutation invalidation và browser E2E Pass locally.
- [x] Admin Dashboard/Reports Pass locally.
- [x] Loading/empty/no-data/stale/error states for all reporting actors Pass.
- [x] Teacher/Gradebook Back/Forward/Back buttons/filter URL Pass.
- [x] Student/Teacher/Gradebook/Admin responsive/visual/accessibility Pass.
- [x] P06 E2E and full fresh-stack browser regression Pass (`34/34`).

## Conditional

- [x] CSV implemented; safety/evidence Pass; runtime default false.
- [x] Analytics event implemented; privacy/evidence Pass; runtime default false.
- [x] Trend and Admin learning outcomes implemented; snapshot/threshold evidence Pass; runtime default false.
- [x] Weighted V2 remains disabled with `APPROVED_NA`.
- [x] XLSX/async/private export recorded `APPROVED_NA` for P07.

## Gate E - Exit

- [ ] `68/68` Must AC Pass (`66/68` local Pass; AC-066/068 require remote evidence).
- [x] Conditional result recorded.
- [x] P02-P05 regressions Pass.
- [x] NFR/explain Pass.
- [x] Docker/seed/reconcile Pass.
- [x] Clean clone Pass.
- [ ] PR CI Pass.
- [ ] Post-merge main CI Pass.
- [x] Critical/High defects `0` locally.
- [x] Evidence register complete for local execution; remote URL fields explicitly Pending.
- [ ] Exit report local draft complete; approval pending.
- [ ] P07 handoff accepted.

## Mandatory Commands

```text
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run test:coverage
npm run test:integration
npm run test:openapi
npm run build
npm run test:e2e
npm run check:ci
docker compose up -d --build
```

Reporting-specific commands đã có:

```text
npm run reporting:rebuild -- --courseId=<id>
npm run reporting:rebuild -- --all
npm run reporting:reconcile -- --courseId=<id>
npm run reporting:reconcile -- --all
npm run reporting:reconcile -- --all --repair
npm run reporting:benchmark -- --students=100 --activities=50 --iterations=3
```
