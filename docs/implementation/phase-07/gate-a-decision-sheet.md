# Phase 07 Gate A Decision Sheet

## 1. Gate Purpose

Gate A xác nhận con người, account, cost, security và boundary trước khi code hoặc tạo Cloud
resource. Evidence phải là hành động thật; không đánh dấu Pass dựa trên giả định.

## 2. Decision Checklist

| ID | Decision / evidence | Current status | Exit evidence |
| --- | --- | --- | --- |
| P07-GA-A01 | Provider/region/project direction | Approved | ADR-010, project `microlearning-platform-502716`, region `asia-southeast1` |
| P07-GA-A02 | Phase 06 handoff/release input | Approved | PR `#18/#19`, release `d2abe52`, dependency patch `e3c52cf`, P06-P07 handoff |
| P07-GA-A03 | Same-origin/single image | Approved | Technical decision P07-TD-009/010 |
| P07-GA-A04 | Terraform adoption/state direction | Approved | Terraform `1.15.8`; GCS bucket direction `microlearning-tfstate-759791798260`, versioning, uniform access, public prevention, separated prefixes |
| P07-GA-A05 | Billing linked + budget alerts | Approved | Billing CLI returned `True`; `microlearning-free-usage-alert` and `microlearning-staging-budget` confirmed in Google Cloud UI |
| P07-GA-A06 | Local `gcloud` authenticated to correct project | Approved | Project `microlearning-platform-502716`, region `asia-southeast1`, project state `ACTIVE` |
| P07-GA-A07 | Terraform installed and verified | Approved | Terraform `1.15.8` on `windows_amd64`; `C:\Tools` persisted in User PATH |
| P07-GA-A08 | Atlas old credential rotated/revoked | Approved | Legacy privileged user removed; dedicated Staging user remains; no password/URI recorded |
| P07-GA-A09 | Atlas Staging DB/user/synthetic policy | Approved | Database `microlearning_staging`, scoped `readWrite`, synthetic-only data, Compass write/read check Pass |
| P07-GA-A10 | Free Atlas network waiver | Approved With Expiry | Synthetic Staging only; TLS, scoped user, monitoring, no Production use; expires `2026-09-13` or before Production, whichever is earlier |
| P07-GA-A11 | GitHub `staging` environment | Approved | `main` only, Admin bypass disabled, five non-secret variables configured |
| P07-GA-A12 | GitHub `production` solo protection | Approved | Protected `main`, Admin bypass disabled, five non-secret variables, no auto-deploy; reviewer `APPROVED_NA` |
| P07-GA-A13 | Production release deferred to P08 | Approved | Product Owner accepts no Production apply in Phase 07 |
| P07-GA-A14 | Custom domain default | Approved N/A for P07 | Managed Cloud Run HTTPS URL |
| P07-GA-A15 | Media/upload storage | Approved N/A | Flags remain false; no bucket required for media |
| P07-GA-A16 | Solo Project Governance | Approved | Owner confirmed no collaborator on `2026-08-13`; apply `solo-project-governance.md` |

## 2.1 Conditional Acceptance Disposition

| Acceptance | Gate A disposition | Runtime/execution rule |
| --- | --- | --- |
| `P07-AC-067` Custom domain | `APPROVED_NA_FOR_P07` | Use managed Cloud Run HTTPS URL; custom domain requires later DNS/cost decision |
| `P07-AC-068` Static egress/NAT | `APPROVED_NA_WITH_WAIVER` | Synthetic Staging public-network waiver expires `2026-09-13`; no Production use |
| `P07-AC-069` Paid Atlas/private connectivity/native backup | `APPROVED_NA_FOR_P07` | Must remain a Phase 08 Production blocker |
| `P07-AC-070` Native Cloud Run readiness probe | `APPROVED_IMPLEMENT` | Implement and test app `/ready` plus supported Cloud Run startup/liveness configuration |
| `P07-AC-071` Canary rollout | `APPROVED_NA_FOR_P07` | Direct revision rollout plus prior-digest rollback rehearsal |
| `P07-AC-072` Advanced signing/attestation | `APPROVED_NA_FOR_P07` | Digest pinning, image scan and SBOM remain mandatory baseline |

## 3. Mandatory Security Acknowledgement

- Không sử dụng lại Atlas credential đã từng được trao đổi ngoài Secret Manager.
- Không paste credential vào Chat, issue, PR, command history, screenshot hoặc Terraform variable.
- Secret version được tạo từ local protected input/Cloud console và chỉ reference bằng secret ID.
- WIF phải lock đúng repository và environment; `id-token: write` chỉ cấp cho deploy job.
- Free Atlas public-network waiver chỉ dùng synthetic Staging data và hết hiệu lực trước Production.

## 4. Approval Record

| Role | Reviewer | Decision | Date | Note |
| --- | --- | --- | --- | --- |
| Product Owner | Trần Đức Toàn | Approved | `2026-08-14` | Scope, budget guardrails, synthetic data and Production boundary |
| Technical Lead | Trần Đức Toàn | Approved | `2026-08-14` | Terraform state, same-origin runtime, digest promotion and rollback design |
| DevOps | Trần Đức Toàn | Approved | `2026-08-14` | GCP account, tools, GitHub environments and keyless WIF direction |
| Security | Trần Đức Toàn | Approved With Expiry | `2026-08-14` | Credential rotation and Atlas public-network waiver through `2026-09-13` |
| QA | Trần Đức Toàn | Approved | `2026-08-14` | Staging smoke, recovery and evidence plan |

Trong đồ án cá nhân, một người có thể giữ nhiều role nhưng phải ghi từng quyết định riêng; không dùng
việc “tự làm” để bỏ qua security/cost/recovery gate.

Governance áp dụng theo `solo-project-governance.md`. Independent reviewer và required approval được
đánh dấu `APPROVED_NA` khi chưa có collaborator; PR, CI, protected `main`, no-bypass, exact digest,
manual Production confirmation và evidence vẫn là Must.

## 5. Gate Result

```text
Decision: APPROVED
Blocking items: NONE_FOR_PLANNING_MERGE
Implementation permission: GRANTED_READY_TO_CODE
Production permission: NOT_GRANTED_UNTIL_PHASE_08_GO_NO_GO
Waiver expiry: 2026-09-13
```
