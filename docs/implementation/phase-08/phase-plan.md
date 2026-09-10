# Phase 08 — Phase Plan

## Purpose and control rules

Đây là kế hoạch release cuối. Không có ngày `ACTUAL` trước khi thực thi; dùng `PLANNED` cho lịch dự kiến và ghi `ACTUAL` bằng UTC trong release record. Exact candidate được khóa tại G0/G1; mọi thay đổi sau scope freeze phải có `CR-P08-###`.

## Milestones

| ID | Milestone | Owner accountable | Dependency | Exit evidence | Initial status |
|---|---|---|---|---|---|
| M0 | P07 handoff review and identity lock | Technical Lead | P07 exit/handoff | `P08-EV-001..002` | `PENDING` |
| M1 | System Test/UAT readiness freeze | QA + BA | M0, Staging/personas/data | `P08-EV-003` | `PENDING` |
| M2 | System Test and regression | QA | M1, stable Staging | `P08-EV-005/010/015/016` | `PENDING` |
| M3 | UAT execution and retest | BA + QA + PO | M2, participants/data | `P08-EV-020..025` | `PENDING` |
| M4 | Defect closure and Production readiness | QA + TL + DevOps | M3; Production work may run in parallel after M0 | `P08-EV-004/006/007/008/026` | `PENDING` |
| M5 | Pre-release acceptance and Go/No-Go | Product Owner | M4, AC-001..010 Pass | `P08-EV-030` | `PENDING` |
| M6 | Production promotion and smoke | DevOps/Release Owner | M5, approved workflow | `P08-EV-031..037` | `PENDING` |
| M7 | Observation, hypercare and handover | DevOps + Support | M6 | `P08-EV-038..044` | `PENDING` |
| M8 | Final acceptance and project exit | PO + Technical Lead | M7, AC-001..014 Pass | `P08-EV-050/055` | `PENDING` |

## Sequence

```text
G0 handoff -> G1 readiness -> G2 System Test -> G3 UAT -> G4 closure
-> G5 Go/No-Go -> G6 deployment -> G7 observation/handover -> G8 exit
```

Production Terraform, Atlas separation và recovery có thể chuẩn bị song song sau G0, nhưng phải Pass tại G4. Chúng không được dùng để chặn việc bắt đầu System Test/UAT trên Staging.

## Entry/exit control

- `NO_GO` records decision ID, reason, owner, remediation, re-entry gate và next review; không tiếp tục gate kế tiếp.
- `CONDITIONAL_GO` chỉ cho phép release khi waiver có impact, mitigation, expiry, owner, approver và communication.
- `ACTUAL` chỉ ghi từ workflow artifact, test report, ticket, signed record hoặc provider output; chat không phải evidence.

## Change after freeze

1. Tạo `CR-P08-###`, nêu requirement/defect, reason, affected API/data/security/ops và rollback impact.
2. Technical Lead đánh giá; QA lập regression scope; DevOps đánh giá artifact/config/state; PO quyết định scope.
3. Tạo candidate mới và rerun required CI, System Test/UAT nếu identity hoặc behavior đổi.
4. Schema, IAM, secret, grade/progress/deadline, privacy hoặc recovery change mặc định quay lại G1/G2.

## Cadence

- Readiness review trước mỗi milestone.
- UAT/hypercare status hằng ngày: Pass/Fail/Blocked/Not Run, defect delta và decision cần PO.
- Gate pack phải được chuẩn bị trước gate; không backfill sau khi đã deploy.
- Post-release review tại T+24h và T+72h; G8 chỉ mở khi exit evidence complete.

## Delivery increments

Thực hiện Part 00-13 trong `execution-parts/README.md` qua P08-PR00..P08-PR06. Mỗi PR giữ scope nhỏ, có test/evidence riêng và không bật Production apply trước P08-PR05 cùng G5 GO.
