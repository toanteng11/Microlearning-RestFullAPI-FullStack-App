# Phase 07 Work Breakdown Structure

## 1. Delivery Model

Phase 07 được chia thành 9 PR nhỏ theo dependency. Mỗi PR phải độc lập review, có rollback và không làm mất
required checks hiện hữu.

## 2. PR Plan

| PR | Parts | Scope | Entry | Exit |
| --- | --- | --- | --- | --- |
| P07-PR00 | 00 | planning baseline + Gate A evidence | docs reviewed | Gate A approved, ready-to-code |
| P07-PR01 | 01-02 | same-origin runtime + Production image | PR00 merged | local container/cloud-contract smoke Pass |
| P07-PR02 | 03-06 | Terraform foundation, artifact, WIF, secrets | PR01 merged | validate/plan/identity/config gates Pass |
| P07-PR03 | 07-08 | Atlas Staging + first deploy | cloud/manual prerequisites | first revision ready + deployment record |
| P07-PR04 | 09-10 | build/publish and auto Staging CD | first deploy known-good | main-to-Staging chain Pass |
| P07-PR05 | 11 | cloud smoke/API/browser E2E | Staging CD stable | four roles + negatives Pass |
| P07-PR06 | 12-14 | monitoring, backup/restore, rollback | cloud E2E stable | operational rehearsals Pass |
| P07-PR07 | 15-16 | Production promotion guard, security/cost hardening | operations stable | P08 workflow ready, no High gap |
| P07-PR08 | 17 | evidence, clean clone, exit/handoff | all prior merged | `66/66`, main/CD green, P08 accepted |

## 2.1 Current Execution Status

| PR | Status | Note |
| --- | --- | --- |
| P07-PR00 | `DONE` | PR #21 và post-merge main CI Pass |
| P07-PR01 | `LOCAL_PASS_REMOTE_PENDING` | Part 01-02 implemented; clean-checkout PR CI/merge/main CI Pending |
| P07-PR02 | `LOCAL_PASS_REMOTE_PENDING` | Part 03-06 source/validation complete; Cloud apply, PR và identity evidence Pending |
| P07-PR03 | `LOCAL_PASS_REMOTE_PENDING` | Part 07-08 contracts, Terraform resources và first-deploy workflow ready; Atlas/Cloud execution Pending |
| P07-PR04 | `LOCAL_PASS_REMOTE_PENDING` | Part 09-10 source workflow và lineage/deployment contracts Pass local; main-to-Staging run Pending |
| P07-PR05 | `LOCAL_PASS_REMOTE_PENDING` | Part 11 Cloud verifier, four-role Playwright và stable-promotion gate Pass local; Cloud run Pending |
| P07-PR06..08 | `NOT_STARTED` | Chưa được kích hoạt theo dependency chain |

## 3. Estimated Work Units

| Workstream | Primary | Review | Relative size |
| --- | --- | --- | ---: |
| Runtime/container | Backend + Frontend | QA/DevOps | 5 |
| Terraform/bootstrap | DevOps | Backend/Security | 8 |
| IAM/WIF/secrets | DevOps/Security | Technical Lead | 8 |
| Atlas integration | Backend/DevOps | QA/Security | 5 |
| CD workflows | DevOps | QA/Security | 8 |
| Cloud E2E | QA + Dev | Product/Technical Lead | 8 |
| Observability/recovery | DevOps + Backend | QA | 8 |
| Exit/handoff | BA/QA/DevOps | Product Owner | 5 |

Relative size dùng để sắp ưu tiên, không phải giờ cam kết.

## 4. Critical Path

```text
Gate A
 -> Production image
 -> Terraform/WIF/secrets
 -> Atlas connectivity
 -> First Staging deploy
 -> CD automation
 -> Cloud E2E
 -> Observability/recovery/rollback
 -> Hardening
 -> Exit/P08 handoff
```

GCP billing/access, Atlas rotation/network và WIF bootstrap là external/manual blockers cần xử lý sớm.

## 5. Parallelizable Work

Sau PR01:

- Terraform modules và cloud test scaffolding có thể phát triển song song;
- observability dashboard design có thể soạn trước resource apply;
- backup/rollback scripts có thể test local/synthetic;
- Production workflow guard có thể code nhưng không apply.

Không parallel apply nhiều Terraform runs cùng state/environment.

## 6. Per-PR Definition Of Done

- scope đúng blueprint;
- code/docs/tests cập nhật cùng PR;
- lint/type/test/build và relevant gates Pass;
- security/secret scan Pass;
- no placeholder trong evidence đã thực hiện;
- rollback/backward compatibility mô tả;
- review comments resolved;
- protected merge và post-merge check Pass khi PR thuộc release chain.
