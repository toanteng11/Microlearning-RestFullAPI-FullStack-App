# Phase 08 — Performance, Capacity and Cost

## Baseline

Staging Terraform config currently uses Cloud Run `max_instances = 2`, `container_concurrency = 20`, bounded MongoDB pool (`max=10`, `min=0`) and `asia-southeast1`; these are `BASELINE` configuration values, not measured Production capacity.

## BA thresholds and required checks

| Area | Target/evidence | Status |
|---|---|---|
| Simple read API | p95 <= 800 ms | `AUTOMATED / REMOTE_PENDING` |
| List/report API | p95 <= 1000 ms | `AUTOMATED / REMOTE_PENDING` |
| Mutation API | p95 <= 1200 ms | `AUTOMATED / REMOTE_PENDING` |
| Dashboard API | p95 <= 1500 ms | `AUTOMATED / REMOTE_PENDING` |
| Frontend initial load | <= 3 seconds on documented good Staging network | `AUTOMATED / REMOTE_PENDING` |
| Cloud Run | instances, concurrency, startup/cold-start and errors | `PENDING` |
| Atlas | pool, selection/connect/socket timeout and capacity | `PENDING` |
| Data/reporting | pagination, refresh/reconciliation and integrity under expected load | `PENDING` |
| Quota/budget | project quota, budget alert, Atlas plan and owner | `PENDING` |
| Cost | observed estimate, assumptions, expiry/review date | `PENDING` |

## Decision rules

The BA values above are Staging acceptance targets, not universal SLA. Each report records dataset size, warm-up, sample count, bounded concurrency, tool/version, region/network and UTC window. Capacity or cost risk that could affect availability, data integrity or budget is a G4/G5 blocker until mitigated or formally accepted.

## Cost controls

Keep scale/concurrency/pool bounded; use synthetic load only with approval; never use Production data for benchmarking; tag resources with existing Terraform labels; review unused revisions/artifacts and retention without deleting rollback target.
