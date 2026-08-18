# Phase 07 Execution Parts

## 1. Cách sử dụng

Thực hiện theo thứ tự dependency, không tự đánh dấu part `DONE` chỉ từ local success. Mỗi part phải cập nhật
acceptance/evidence/risk tương ứng và được merge qua parent PR trong WBS.

## 2. Part Map

| Part | Parent PR | Outcome |
| --- | --- | --- |
| 00 | P07-PR00 | Gate A và manual prerequisites approved |
| 01 | P07-PR01 | same-origin application runtime |
| 02 | P07-PR01 | Production container validated |
| 03 | P07-PR02 | Terraform foundation/remote state |
| 04 | P07-PR02 | Artifact Registry/supply chain |
| 05 | P07-PR02 | IAM/WIF keyless deployment |
| 06 | P07-PR02 | secrets/runtime config |
| 07 | P07-PR03 | Atlas Staging secure integration |
| 08 | P07-PR03 | first Staging infrastructure/deploy |
| 09 | P07-PR04 | build/publish workflow |
| 10 | P07-PR04 | Staging deploy workflow |
| 11 | P07-PR05 | cloud smoke/four-role E2E |
| 12 | P07-PR06 | observability/alerts |
| 13 | P07-PR06 | backup/restore rehearsal |
| 14 | P07-PR06 | rollback/incident rehearsal |
| 15 | P07-PR07 | Production promotion readiness |
| 16 | P07-PR07 | security/cost/quality hardening |
| 17 | P07-PR08 | evidence, exit và Phase 08 handoff |

Current execution: Part 00 `DONE`; Part 01-17 `LOCAL_PASS_REMOTE_PENDING`.

Parts 09-11 có source workflow, lineage contracts, Cloud verifier và four-role E2E đã Pass local ngày
`2026-08-17`. Chúng chưa phải `DONE` cho tới khi merge qua protected `main` và có exact GitHub/GCP/Atlas
workflow evidence.

Parts 12-14 đã có source Terraform/app scripts/contracts/workflow và local contract validation Pass ngày
`2026-08-17`. Chúng chưa phải `DONE` cho tới khi có Cloud Monitoring notification/redaction evidence,
Atlas synthetic backup/isolated restore report và Cloud Run prior-digest rollback record.

Parts 15-17 đã có source workflow/contracts/local tests ngày `2026-08-17`. Promotion chỉ chạy `PLAN_ONLY`,
hardening chạy từ clean checkout và exit/handoff contract chặn placeholder hoặc thiếu evidence. Chúng vẫn
ở `LOCAL_PASS_REMOTE_PENDING` cho tới khi có remote workflow evidence, `66/66` Must Pass và handoff được
review/accepted.

## 3. Status Vocabulary

- `NOT_STARTED`: chưa thực hiện.
- `IN_PROGRESS`: đang code/config/test.
- `LOCAL_PASS_REMOTE_PENDING`: local Pass nhưng PR/Cloud evidence chưa có.
- `BLOCKED`: điều kiện dừng có owner.
- `DONE`: parent PR/main/Cloud gates và evidence liên quan đều Pass.

## 4. Global Stop Conditions

- real credential/PII xuất hiện trong source/log/evidence;
- Production bị deploy trước Phase 08 approval;
- Terraform plan có unexpected destroy/public IAM/cross-environment mutation;
- image không xác định digest;
- required CI bị bypass hoặc giảm coverage;
- Atlas Free/public environment chứa dữ liệu thật;
- Critical/High defect chưa được xử lý.
