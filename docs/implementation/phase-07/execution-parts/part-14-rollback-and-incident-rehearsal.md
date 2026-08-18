# Part 14 - Rollback And Incident Rehearsal

## Goal

Chứng minh Staging có thể trở về prior stable digest và phục hồi critical journeys trong thời gian đo được.

## Parent PR

`P07-PR06 - Operations Recovery And Rollback`

## Dependencies

- Ít nhất hai valid Cloud Run revisions/digests.
- Parts 10-12 ready.

## Work

1. record current/prior revision and digest;
2. inject safe failed-smoke/readiness scenario hoặc trigger controlled rollback;
3. ensure bad revision not marked stable;
4. execute traffic/config rollback to prior exact revision;
5. verify health/ready/version;
6. run critical multi-role smoke subset;
7. observe errors/latency;
8. reconcile Terraform and run drift plan;
9. measure detection/decision/recovery time;
10. complete incident record/root cause/corrective action;
11. verify prior secret/image remain usable during window;
12. restore intended current revision only through normal pipeline after fix.

## Validation

- TC-064..065 Pass;
- prior digest restored exactly;
- critical smoke Pass;
- no data loss/corruption;
- drift clean or documented reconciliation complete.

## Evidence

`P07-EV-031`, rollback/incident/monitoring records.

## Stop Conditions

- rollback requires rebuilding old image;
- prior image/secret was deleted;
- schema/data incompatible with N-1;
- rollback fails or monitoring cannot confirm recovery.

## Definition Of Done

- AC-059 Pass;
- P07-PR06 merged/main CI/Staging operational checks Pass.

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING`.

Đã triển khai:

- `scripts/lib/recovery-contract.mjs` và `operations:contract:test` để reject Production record,
  mutable tag, cùng revision hoặc cùng digest;
- `scripts/verify-rollback-recovery.mjs` để kiểm tra HTTPS, `/health`, `/ready` và exact image digest;
- `scripts/create-rollback-record.mjs`/`validate-rollback-record.mjs` cho incident record có measured
  detection/decision/recovery time;
- `.github/workflows/rollback-staging.yml` là manual-only workflow, yêu cầu confirmation,
  `failed_revision`, `restored_revision`, hai immutable digest, WIF và traffic 100% về prior revision.

Workflow có chủ ý ghi rõ `REQUIRED_AFTER_TRAFFIC_ROLLBACK` cho Terraform drift: traffic rollback là
emergency operation, sau rehearsal phải chạy plan/apply qua pipeline bình thường để reconcile. Chưa chạy
workflow trên Cloud Run và chưa có prior revision thật nên AC-059 vẫn Pending.
