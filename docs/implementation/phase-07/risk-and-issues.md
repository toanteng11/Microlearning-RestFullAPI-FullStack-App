# Phase 07 Risk And Issues

## 1. Risk Scale

Probability/impact: `Low`, `Medium`, `High`. Critical/High unresolved security/data/release risk blocks exit.

## 2. Active Risks

| ID | Risk | P | I | Mitigation | Owner | Exit condition |
| --- | --- | --- | --- | --- | --- | --- |
| P07-RSK-001 | GCP billing/access có thể thay đổi hoặc bị thu hồi | M | H | kiểm tra trước apply và lưu sanitized evidence | PO/DevOps | project/billing/budget Pass |
| P07-RSK-002 | Atlas credential cũ có thể bị tái sử dụng hoặc lộ lại | H | H | rotate, revoke, negative test, scan | Backend/Security | old credential fail |
| P07-RSK-003 | Atlas Free/public network không Production-grade | H | H | synthetic-only waiver; P08 paid/network gate | PO/TL | waiver + Production block |
| P07-RSK-004 | Cross-cloud GCP Singapore to Atlas Hong Kong latency/egress | M | M | measure p95, bounded pool, reconsider region/tier | DevOps | measured acceptable baseline |
| P07-RSK-005 | Phiên bản `gcloud`/Terraform local có thể drift | M | M | pin và verify trước plan/apply | DevOps | tool checks Pass |
| P07-RSK-006 | Same-origin static fallback che API 404 | M | H | strict route ordering/tests | Backend | route tests Pass |
| P07-RSK-007 | Cloud secure cookie/proxy regression | M | H | trust proxy/cookie/CORS cloud E2E | Backend/QA | auth E2E Pass |
| P07-RSK-008 | Cloud Run autoscaling vượt Atlas connection budget | M | H | max=2, pool=10, monitor/tune | Backend/DevOps | pool test Pass |
| P07-RSK-009 | Terraform state chứa secret hoặc bị mất | L | H | no secret values, private versioned GCS | DevOps/Security | canary/state test Pass |
| P07-RSK-010 | WIF trust quá rộng | M | H | repo/ref/environment conditions + negative test | DevOps/Security | unauthorized denied |
| P07-RSK-011 | Mutable tag gây drift | M | H | digest-only validation | DevOps | tag rejected/digest match |
| P07-RSK-012 | CI name change phá branch protection | M | H | preserve names/settings evidence | DevOps | required checks verified |
| P07-RSK-013 | Alert tồn tại nhưng không đến owner | M | M | notification test/runbook | DevOps | test received |
| P07-RSK-014 | Free Atlas không backup/PITR | H | H | synthetic logical rehearsal; P08 NO_GO gate | PO/DevOps | gap documented/accepted |
| P07-RSK-015 | Rollback image không tương thích data | M | H | expand/contract/no destructive startup migration | Backend | N/N-1 compatibility Pass |
| P07-RSK-016 | Cost bất ngờ từ logs/NAT/instances/artifacts | M | M | min=0/max=2, budgets, retention, review | PO/DevOps | alerts + cost evidence |
| P07-RSK-017 | Cloud E2E artifacts lộ credentials/PII | M | H | synthetic data, redaction, artifact review | QA/Security | canary scan Pass |
| P07-RSK-018 | Production bị deploy sớm trước UAT | L | H | manual protected workflow; P08 gate | PO/DevOps | apply blocked in P07 |
| P07-RSK-019 | Không có independent reviewer trong dự án cá nhân | H | M | PR + 6 CI gates + no-bypass + self-review record + manual Production confirmation | Owner | solo governance evidence Pass |

## 3. Known Issues At Planning

| ID | Issue | Status | Blocking |
| --- | --- | --- | --- |
| P07-ISS-001 | `gcloud` chưa được cài | Closed `2026-08-14` | `gcloud 579.0.0`, project/region verified |
| P07-ISS-002 | Terraform chưa được cài | Closed `2026-08-14` | Terraform `1.15.8` verified after main sync |
| P07-ISS-003 | Atlas credential rotation chưa có repository evidence | Closed `2026-08-14` | Sanitized Gate A evidence; scoped Staging identity |
| P07-ISS-004 | Billing/budget/project IAM chưa có evidence | Closed `2026-08-14` | Gate A GCP/budget evidence Pass |
| P07-ISS-005 | GitHub environment solo protection/no-bypass chưa có evidence | Closed `2026-08-14` | Gate A environment/protection evidence Pass |
| P07-ISS-006 | Atlas Production tier/network/RPO/RTO chưa chốt | Deferred P08 | Production Go only |

## 4. Risk Review Cadence

- review ở đầu/cuối mỗi PR;
- update khi provider feature/pricing/quota thay đổi;
- Critical/High risk không thể tự đóng bằng comment;
- waiver có owner và expiry;
- exit report liệt kê residual risks chuyển Phase 08.
