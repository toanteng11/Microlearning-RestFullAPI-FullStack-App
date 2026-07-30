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
- [ ] Admin governance/audit reports Pass.
- [x] RBAC/ownership/enrollment/IDOR Pass for Student/Teacher reporting scope.
- [x] Privacy/projection Pass for Student/Teacher/Gradebook scope; Admin threshold pending.
- [x] Query bounds Pass for Student/Teacher/Gradebook scope; final rate hardening pending.
- [x] OpenAPI parity Pass for Student/Teacher/Gradebook reporting operations.
- [x] Unique Express/OpenAPI operation per moved Student/Teacher/Gradebook path Pass.

## Gate D - Web And Integration

- [x] Student Dashboard/Progress Pass locally.
- [x] Teacher Dashboard/Analytics/Detail Pass locally.
- [x] Gradebook Web, URL state, mutation invalidation và browser E2E Pass locally.
- [ ] Admin Dashboard/Reports Pass.
- [x] Loading/empty/no-data/stale/error states for Student/Teacher/Gradebook; remaining actors pending.
- [x] Teacher/Gradebook Back/Forward/Back buttons/filter URL Pass.
- [x] Student/Teacher/Gradebook responsive/visual/accessibility Pass.
- [ ] 12 P06 E2E Pass.

## Conditional

- [ ] CSV enabled and safety/evidence Pass, hoặc approved N/A.
- [ ] Analytics event enabled and privacy/evidence Pass, hoặc approved N/A.
- [ ] Trend enabled and snapshot/evidence Pass, hoặc approved N/A.
- [ ] Weighted V2 remains disabled unless separate approval.

## Gate E - Exit

- [ ] `68/68` Must AC Pass.
- [ ] Conditional result recorded.
- [ ] P02-P05 regressions Pass.
- [ ] NFR/explain Pass.
- [ ] Docker/seed/reconcile Pass.
- [ ] Clean clone Pass.
- [ ] PR CI Pass.
- [ ] Post-merge main CI Pass.
- [ ] Critical/High defects `0`.
- [ ] Evidence register complete.
- [ ] Exit report approved.
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
