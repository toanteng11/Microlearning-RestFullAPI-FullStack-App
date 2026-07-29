# Part 06 - Refresh Reconciliation And Migration

## Goal

Hoàn thành Gate B bằng calculator, refresh, rebuild, reconciliation và migration có thể chạy lại.

## Parent PR

`P06-PR02 - Foundation`

## Dependencies

- Part 03-05 `DONE`.

## Files

```text
course-progress.calculator.ts
reporting-refresh.service.ts
reporting-reconciliation.service.ts
apps/api/src/scripts/reporting-rebuild.ts
apps/api/src/scripts/reporting-reconcile.ts
apps/api/src/shared/database/phase-six-migration.ts
apps/api/src/scripts/reporting-benchmark.ts
```

## Work

1. Calculator compose safe readers và pure policies.
2. Refresh claim intent, calculate ngoài source transaction, replace bằng CAS.
3. Detect source watermark thay đổi và bounded retry.
4. Ghi `FRESH`, `STALE`, `PARTIAL`, `REBUILDING`, `FAILED` đúng contract.
5. Rebuild một Student và toàn Course theo bounded batch.
6. Reconcile compare source với summary, repair chỉ read model.
7. Migration tạo indexes/backfill/version activation idempotent.
8. Rollback tắt reader/route và giữ transactional source nguyên vẹn.
9. CLI trả structured JSON summary, exit code rõ ràng.

## Tests

`P06-IT-011..020`, `P06-PERF-005`.

## Gate B Commands

```text
npm run test --workspace @microlearning/api
npm run test:integration
npm run test:openapi
npm run typecheck
npm run build
```

Reporting CLI commands chỉ thêm vào `package.json` khi script thật đã tồn tại.

## Definition Of Done

- `P06-AC-014..018` Pass.
- Rebuild/reconcile/migration chạy hai lần an toàn.
- Fault/concurrency tests Pass.
- P06-PR02 đủ review và CI trước merge.
- Part 07, 09, 11 và 13 chuyển `READY` sau khi P06-PR02 merge main.
