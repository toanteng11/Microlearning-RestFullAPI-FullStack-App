# Phase 07 Gate A Decision Sheet

## 1. Gate Purpose

Gate A xác nhận con người, account, cost, security và boundary trước khi code hoặc tạo Cloud
resource. Evidence phải là hành động thật; không đánh dấu Pass dựa trên giả định.

## 2. Decision Checklist

| ID | Decision / evidence | Current status | Exit evidence |
| --- | --- | --- | --- |
| P07-GA-A01 | Provider/region/project direction | Approved | ADR-010, project `microlearning-platform-502716`, region `asia-southeast1` |
| P07-GA-A02 | Phase 06 handoff/release input | Approved | PR `#18`, release `d2abe52`, P06-P07 handoff |
| P07-GA-A03 | Same-origin/single image | Approved | Technical decision P07-TD-009/010 |
| P07-GA-A04 | Terraform adoption/state direction | Pending | Tool/version/state bucket/security owner approved |
| P07-GA-A05 | Billing linked + budget alerts | Pending | Screenshot/CLI output without billing identifiers or sensitive data |
| P07-GA-A06 | Local `gcloud` authenticated to correct project | Pending | `gcloud config list` sanitized evidence |
| P07-GA-A07 | Terraform installed and verified | Pending | `terraform version` |
| P07-GA-A08 | Atlas old credential rotated/revoked | Pending | Database user list/status evidence, no password/URI |
| P07-GA-A09 | Atlas Staging DB/user/synthetic policy | Pending | Approved names/roles/data policy |
| P07-GA-A10 | Free Atlas network waiver | Pending | Owner, controls, expiry, Production prohibition |
| P07-GA-A11 | GitHub `staging` environment | Pending | Branch policy/environment variable/reviewer evidence |
| P07-GA-A12 | GitHub `production` protection | Pending | Required reviewer, main/tag policy, no self-bypass direction |
| P07-GA-A13 | Production release deferred to P08 | Pending | Product Owner acceptance |
| P07-GA-A14 | Custom domain default | Approved N/A for P07 | Managed Cloud Run HTTPS URL |
| P07-GA-A15 | Media/upload storage | Approved N/A | Flags remain false; no bucket required for media |

## 3. Mandatory Security Acknowledgement

- Không sử dụng lại Atlas credential đã từng được trao đổi ngoài Secret Manager.
- Không paste credential vào Chat, issue, PR, command history, screenshot hoặc Terraform variable.
- Secret version được tạo từ local protected input/Cloud console và chỉ reference bằng secret ID.
- WIF phải lock đúng repository và environment; `id-token: write` chỉ cấp cho deploy job.
- Free Atlas public-network waiver chỉ dùng synthetic Staging data và hết hiệu lực trước Production.

## 4. Approval Record

| Role | Reviewer | Decision | Date | Note |
| --- | --- | --- | --- | --- |
| Product Owner | Trần Đức Toàn | Pending | - | Scope, cost, Production boundary |
| Technical Lead | Trần Đức Toàn | Pending | - | Terraform/runtime/rollback design |
| DevOps | Trần Đức Toàn | Pending | - | Account, WIF, CI/CD, monitoring |
| Security | Trần Đức Toàn | Pending | - | Credential rotation, IAM, network waiver |
| QA | Trần Đức Toàn | Pending | - | Cloud smoke/recovery evidence plan |

Trong đồ án cá nhân, một người có thể giữ nhiều role nhưng phải ghi từng quyết định riêng; không dùng
việc “tự làm” để bỏ qua security/cost/recovery gate.

## 5. Gate Result

```text
Decision: PENDING
Blocking items: P07-GA-A04..A13 (trừ approved items)
Implementation permission: NOT_GRANTED
```
