# Phase 06 To Phase 07 Handoff

## 1. Handoff Identity

| Field | Value |
| --- | --- |
| Handoff ID | `P06-P07-HANDOFF-V1` |
| Producer | `P06 - Reporting And Analytics` |
| Consumer | `P07 - DevOps And Deployment` |
| Status | `PLANNED` |
| Effective commit/date | Pending |

## 2. Runtime Contracts To Hand Off

- P06 metric/Gradebook/Admin report version constants.
- Reporting env variables/defaults/secrets classification.
- Mongo collections/indexes/migration/backfill/reconcile commands.
- Reporting health/log/metric names.
- Dashboard/report performance targets.
- Feature flags and safe default.
- P05 compatibility requirements.

## 3. Cloud Run Requirements

- API remains stateless; no local export/storage dependency.
- Migration/rebuild not automatically run on every instance startup.
- Concurrency/timeout/memory sizing tested against dashboard/rebuild command.
- Minimum instances/cold start decision documented.
- Service account least privilege.
- Runtime env/secrets from Google Cloud configuration, not image.

## 4. MongoDB Atlas Requirements

- Production indexes verified before traffic.
- Connection pool/max timeout configured.
- Network access/security reviewed.
- Backup/restore procedure.
- Rebuild/reconcile can connect with least required role.
- No analytics/reporting query against unindexed production range.

## 5. Conditional Export Handoff

Nếu P06 CSV sync enabled, P07 giữ sync bound hoặc triển khai async:

- private GCS bucket/object;
- `ReportExportJob`;
- Cloud Run Job/Scheduler/worker;
- signed URL + re-authorization;
- retention/TTL/cleanup;
- encryption/log/audit;
- XLSX only after tests.

Không chuyển sang public object URL.

## 6. Scheduler/Repair Handoff

P07 quyết định schedule:

- drain invalidations;
- daily/periodic reconciliation;
- snapshot generation Conditional;
- cleanup TTL/export;
- alert on backlog/failures.

P06 command phải idempotent và JSON-output để P07 automate.

## 7. Monitoring/Alerts

- report API p95/error;
- summary age/stale ratio;
- invalidation backlog/oldest;
- refresh/reconcile failure/difference;
- export event result;
- Mongo query/connection health.

## 8. Deployment Gates

- staging migration/backfill/reconcile Pass;
- smoke all actors;
- NFR baseline;
- rollback route/flag;
- no secret in image/log;
- post-deploy OpenAPI/E2E;
- production approval.

## 9. Not Handed

- Rewriting metric semantics.
- Fixing source Progress/Grade through report repair.
- Public file storage.
- Data warehouse/BI/AI.
- Bypassing privacy threshold in production.

## 10. Acceptance

P07 consumer ký nhận sau P06 Gate E với release commit, commands, env, index, dashboard, alert
and rollback evidence cụ thể.
