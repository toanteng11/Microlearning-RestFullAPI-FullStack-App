# Phase 07 Test Case Execution Matrix

## 1. Rules

- Planning baseline để mọi test ở `Not Run`.
- Khi thực thi, result chỉ dùng `Pass`, `Fail`, `Blocked`, `Approved N/A` hoặc `Not Run`.
- Mỗi `Pass` phải có evidence gắn commit/digest/revision/run phù hợp.
- Must case `Blocked`, `Not Run` hoặc thiếu evidence không được tính Pass.

## 2. Planning And Tools

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-001 | Pass | `gate-a-decision-sheet.md`, `gate-a-readiness-evidence.md`, PR #21 |
| P07-TC-002 | Pass | `gate-a-readiness-evidence.md`; Terraform `1.15.8` reverified after main sync |
| P07-TC-003 | Not Run | Clean-clone report pending |
| P07-TC-004 | Pass | PR #21 and post-merge main Secret scan Pass |

## 3. Runtime And Routing

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-005 | Not Run | Pending |
| P07-TC-006 | Not Run | Pending |
| P07-TC-007 | Not Run | Pending |
| P07-TC-008 | Not Run | Pending |
| P07-TC-009 | Not Run | Pending |
| P07-TC-010 | Not Run | Pending |
| P07-TC-011 | Not Run | Pending |
| P07-TC-012 | Not Run | Pending |
| P07-TC-013 | Not Run | Pending |
| P07-TC-014 | Not Run | Pending |

## 4. Container And Supply Chain

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-015 | Not Run | Pending |
| P07-TC-016 | Not Run | Pending |
| P07-TC-017 | Not Run | Pending |
| P07-TC-018 | Not Run | Pending |
| P07-TC-019 | Not Run | Pending |
| P07-TC-020 | Not Run | Pending |
| P07-TC-021 | Not Run | Pending |
| P07-TC-022 | Not Run | Pending |

### Local Pre-PR Validation

`P07-TC-005..021` đã vượt local implementation checks được tổng hợp tại
`runtime-container-evidence.md`. Result chính thức vẫn là `Not Run` cho đến khi P07-PR01 build từ clean
checkout và tạo evidence gắn exact commit/image. `P07-TC-022` thuộc immutable publish/deploy guard ở
Part 04/09 nên chưa thực thi.

Part 04 đã bổ sung local negative tests cho `P07-TC-022`: exact digest Pass, `latest` và tag-only input bị
reject. Result chính thức vẫn `Not Run` cho đến khi gate chạy từ clean checkout/registry workflow.

## 5. Terraform IAM And Secrets

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-023 | Not Run | Pending |
| P07-TC-024 | Not Run | Pending |
| P07-TC-025 | Not Run | Pending |
| P07-TC-026 | Not Run | Pending |
| P07-TC-027 | Not Run | Pending |
| P07-TC-028 | Not Run | Pending |
| P07-TC-029 | Not Run | Pending |
| P07-TC-030 | Not Run | Pending |
| P07-TC-031 | Not Run | Pending |
| P07-TC-032 | Not Run | Pending |
| P07-TC-033 | Not Run | Pending |

### Local Pre-PR Validation

- `P07-TC-023`: Terraform fmt/init/validate Pass cho bootstrap, staging và production.
- `P07-TC-024`: policy unit tests và pinned Trivy IaC scan Pass với `0` Critical/High finding.
- `P07-TC-025`: private/versioned/environment-prefix contract Pass; actual bucket Pending.
- `P07-TC-026`: synthetic canary policy test Pass; actual remote state canary Pending.
- `P07-TC-027..031`: source/workflows/verifier đã sẵn sàng; Cloud apply và workflow evidence Pending.

Các kết quả này không thay đổi official matrix khỏi `Not Run` trước P07-PR02/Cloud execution.

Part 06 bổ sung local checks cho exact numeric secret versions, runtime-schema/Terraform coverage,
secret-level accessor isolation, placeholder/TLS/pool failure và không có payload resource trong Terraform.
Chi tiết tại `phase-07-part-06-08-evidence.md`; official result vẫn `Not Run` trước Cloud/PR evidence.

## 6. Atlas

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-034 | Not Run | Pending |
| P07-TC-035 | Not Run | Pending |
| P07-TC-036 | Not Run | Pending |
| P07-TC-037 | Not Run | Pending |
| P07-TC-038 | Not Run | Pending |
| P07-TC-039 | Not Run | Pending |
| P07-TC-040 | Not Run | Pending |
| P07-TC-041 | Not Run | Pending |

### Local Pre-Cloud Validation

`atlas-staging-contract.test.ts`, compiled diagnostic và guarded seed/index command đã Pass type/unit checks.
Diagnostic mặc định read-only; transaction synthetic chỉ chạy với `--transaction` và luôn cleanup. TC-034..041
vẫn `Not Run` cho đến khi chạy với exact Secret Manager version trên Atlas Staging.

## 7. Cloud Deployment

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-042 | Not Run | Pending |
| P07-TC-043 | Not Run | Pending |
| P07-TC-044 | Not Run | Pending |
| P07-TC-045 | Not Run | Pending |
| P07-TC-046 | Not Run | Pending |
| P07-TC-047 | Not Run | Pending |
| P07-TC-048 | Not Run | Pending |
| P07-TC-049 | Not Run | Pending |

### Local Pre-Cloud Validation

Cloud Run service/private seed Job Terraform, probes, bounded scale, intentional public invoker policy,
two-step first deploy, trusted Build/Deploy lineage, HTTPS smoke, candidate record và rollback source đã Pass
static/local validation. TC-042..049 vẫn `Not Run` cho đến khi exact workflow chain tạo
URL/revision/digest/deployment record thật.

## 8. Actor E2E And Security

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-050 | Not Run | Pending |
| P07-TC-051 | Not Run | Pending |
| P07-TC-052 | Not Run | Pending |
| P07-TC-053 | Not Run | Pending |
| P07-TC-054 | Not Run | Pending |
| P07-TC-055 | Not Run | Pending |
| P07-TC-056 | Not Run | Pending |
| P07-TC-057 | Not Run | Pending |

### Local Pre-Cloud Validation

`npm run test:e2e:cloud -- --list` nhận đủ bốn role tests. HTTPS/security verifier, stable-promotion contract
và artifact-redaction gate đã Pass lint/type/contract checks. TC-050..057 vẫn `Not Run` cho tới khi chạy trên
exact Staging candidate với dedicated E2E WIF và synthetic credential.

## 9. Operations And Recovery

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-058 | Not Run | Pending |
| P07-TC-059 | Not Run | Pending |
| P07-TC-060 | Not Run | Pending |
| P07-TC-061 | Not Run | Pending |
| P07-TC-062 | Not Run | Pending |
| P07-TC-063 | Not Run | Pending |
| P07-TC-064 | Not Run | Pending |
| P07-TC-065 | Not Run | Pending |
| P07-TC-066 | Not Run | Pending |

### Local Pre-Cloud Validation

- `P07-TC-058`: structured logging/redaction source and observability Terraform contract Pass locally.
- `P07-TC-059`: `observability:contract:test` Pass; Cloud canary/alert payload inspection Pending.
- `P07-TC-060..061`: dashboard/uptime/alert source and runbook are ready; Cloud notification execution Pending.
- `P07-TC-062..063`: backup/restore tooling and recovery guards typecheck; real Atlas manifest/restore report Pending.
- `P07-TC-064..065`: rollback contract, exact digest verifier and manual workflow source Pass; Cloud revision
  rehearsal and drift reconciliation Pending.
- `P07-TC-066`: budget/quota evidence remains Pending.

Official results remain `Not Run` until the corresponding Cloud Monitoring, Atlas and Cloud Run evidence is
attached.

## 10. Exit

| Test ID | Result | Evidence |
| --- | --- | --- |
| P07-TC-067 | Not Run | Pending |
| P07-TC-068 | Not Run | Pending |
| P07-TC-069 | Not Run | Pending |
| P07-TC-070 | Not Run | Pending |

### Local Contract Validation

- `P07-TC-067`: exit contract test Pass cho schema, `66/66`, zero Critical/High, exact digest và NO_GO.
- `P07-TC-068`: handoff contract test Pass cho Phase 08 required inputs và accepted gate.
- `P07-TC-069`: hardening contract test Pass cho non-root image, pinned workflow, no key resource và no-apply boundary.
- `P07-TC-070`: promotion contract test Pass cho confirmation/UAT/Go/digest validation.

Official results vẫn `Not Run` cho đến khi các remote workflow/Cloud evidence tương ứng được đính kèm.

## 11. Summary

```text
Total: 70
Pass: 3
Fail: 0
Blocked: 0
Approved N/A: 0
Not Run: 67
Current phase status: IN_PROGRESS; Part 01-17 LOCAL_PASS_REMOTE_PENDING
```
