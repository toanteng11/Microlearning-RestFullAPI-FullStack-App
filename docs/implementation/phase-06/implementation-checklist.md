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
- [ ] Planning PR CI Pass and merged.
- [ ] Status changed to `READY_TO_CODE`.

Gate A/local baseline evidence: `gate-a-review-evidence.md`. Hai item cuối chỉ được check sau
protected merge; trạng thái trước merge là `READY_TO_CODE_AFTER_PLANNING_MERGE`.

## Gate B - Foundation

- [ ] Permissions and env validated.
- [ ] Existing reporting route ownership cutover planned atomically.
- [ ] Pure metric policies Pass.
- [ ] Reader ports/adapters safe and batched.
- [ ] Summary/invalidation schemas/indexes Pass.
- [ ] Source transaction invalidation matrix Pass.
- [ ] Migration/backfill idempotent.
- [ ] Refresh/rebuild/reconcile Pass.
- [ ] Fault isolation/concurrency Pass.

## Gate C - API And Security

- [ ] Student APIs Pass.
- [ ] Teacher dashboard/ranking/detail Pass.
- [ ] Gradebook Pass.
- [ ] Admin governance/audit reports Pass.
- [ ] RBAC/ownership/enrollment/IDOR Pass.
- [ ] Privacy/projection/threshold Pass.
- [ ] Query bounds/rate limits Pass.
- [ ] OpenAPI parity Pass.
- [ ] Unique Express/OpenAPI operation per moved path Pass.

## Gate D - Web And Integration

- [ ] Student Dashboard/Progress Pass.
- [ ] Teacher Dashboard/Analytics/Detail Pass.
- [ ] Gradebook Pass.
- [ ] Admin Dashboard/Reports Pass.
- [ ] Loading/empty/no-data/stale/partial/error states.
- [ ] Back/Forward/Back buttons/filter URL.
- [ ] Responsive/visual/accessibility Pass.
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

Commands reporting-specific được thêm sau implementation scripts.
