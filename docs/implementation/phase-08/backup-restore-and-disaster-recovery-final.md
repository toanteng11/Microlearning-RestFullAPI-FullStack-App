# Phase 08 — Backup, Restore and Disaster Recovery

## Objective

Chứng minh dữ liệu mục tiêu có thể phục hồi theo selected release profile và RPO/RTO decision. Không dùng Staging backup để tuyên bố Production readiness. RPO/RTO chưa có approved value là `PENDING`, không tự đặt target.

## Required design

| Control | Requirement | Status |
|---|---|---|
| Atlas tier | Tier/access policy phù hợp selected profile | `PENDING` |
| Backup/PITR | Logical/provider backup bắt buộc; PITR actual hoặc `APPROVED_NA` đúng profile | `PENDING` |
| Isolation | Restore to isolated database/project, never overwrite Production for rehearsal | `PENDING` |
| RPO/RTO | PO/DevOps approved target and measured result | `PENDING` |
| Integrity | counts/checksums/invariants for auth, enrollment, grade, progress, audit | `PENDING` |
| Access | least privilege, audit trail, secret rotation/restore procedure | `PENDING` |
| DR | failure scenarios, escalation, communications and re-entry | `PENDING` |

## Rehearsal procedure (planned)

1. Record source cluster/backup ID/time and synthetic/sanitized data mode.
2. Verify backup/PITR artifact without exposing URI or credentials.
3. Restore into isolated target; record start/end UTC and provider operation ID.
4. Run application connectivity, schema/index, read-only integrity and audit checks.
5. Measure RTO and data point-in-time/RPO; compare approved target.
6. Destroy/quarantine isolated target per policy; retain redacted evidence.

## DR decision rules

Data corruption, missing required backup, failed restore invariant, or unknown recovery owner is `NO_GO`. Với academic profile, managed PITR absence may be `APPROVED_NA` through P08 decision while logical backup and isolated restore remain Must. P07 `APPROVED_NA` never automatically carries forward.

## Evidence template

```text
Backup/PITR provider record: <PENDING>
Source/target identifiers (redacted): <PENDING>
Point-in-time and operation IDs: <PENDING>
Measured RPO/RTO: <PENDING>
Integrity checks: <PENDING>
Owner/approver/UTC: <PENDING>
Release profile / PITR disposition: <PENDING>
Result: PASS | FAIL | BLOCKED | APPROVED_NA | PENDING
```
