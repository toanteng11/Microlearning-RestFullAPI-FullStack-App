# Part 00 - Gate A And Manual Prerequisites

## Goal

Biến planning baseline thành `READY_TO_CODE` bằng evidence về access, tools, credential, network, data và
release boundary.

## Parent PR

`P07-PR00 - Planning Baseline And Gate A`

## Dependencies

- Phase 06 release/handoff có commit thật.
- Product Owner/DevOps/Security có thể review.

## Work

1. review toàn bộ Phase 07 docs và resolve blocking TBD;
2. cài/xác minh `gcloud` và Terraform version đã pin;
3. đăng nhập GCP project đúng account, kiểm tra billing/APIs/quota;
4. tạo budget/notification owner;
5. rotate Atlas application credential và revoke old credential;
6. tạo database/user Staging, chốt network option/waiver expiry;
7. chấp thuận synthetic-only data;
8. chốt GitHub `staging`/`production` environment protections;
9. xác nhận no service-account JSON key và Production apply thuộc P08;
10. điền/sign `gate-a-decision-sheet.md`;
11. cập nhật README/readiness/risk/evidence;
12. merge planning PR, xác nhận main CI.

## Validation

- command/version checks Pass;
- new Atlas credential works, old one fails;
- secret scan không thấy credential;
- GCP project/billing/budget evidence có nhưng không lộ billing instrument;
- all Gate A Must rows Approved.

## Evidence

`P07-EV-001..006`, planning PR, post-merge main CI.

## Stop Conditions

- bất kỳ Gate A Must row Pending/Fail;
- credential cũ còn hoạt động;
- không có billing/project owner;
- Atlas waiver vô thời hạn hoặc định dùng dữ liệu thật.

## Definition Of Done

- AC-001..008 Pass;
- documentation status `READY_TO_CODE`;
- P07-PR00 merged và main CI Pass.

## Current Status

`COMPLETED` - Gate A approved `2026-08-14`;
[PR #21](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/21) merged as `f5c58c3`;
six required checks and
[post-merge main CI](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/31818169576)
Pass. Local `main` was synchronized and Terraform `1.15.8` was reverified. Part 01 is authorized.
