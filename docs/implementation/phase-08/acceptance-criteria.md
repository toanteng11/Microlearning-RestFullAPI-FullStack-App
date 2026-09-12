# Phase 08 — Acceptance Criteria

## Status convention

Tất cả criteria ban đầu là `PENDING`. `PASS` chỉ được ghi trong execution/evidence record có exact release identity. `NOT RUN`, `BLOCKED`, `FAIL` không phải Pass. Waiver không được áp dụng cho security, privacy, access-control, data-loss/corruption hoặc grade/deadline integrity.

## Criteria catalogue

| ID | Must acceptance condition | Evidence required | Owner | Initial status |
|---|---|---|---|---|
| P08-AC-001 | P07 handoff accepted và production decision còn `NO_GO` trước khi đủ gate | handoff + G0 decision | TL | `PENDING` |
| P08-AC-002 | Exact commit/digest/revision/URL nhất quán từ Staging test đến promotion | manifest, deployment/stable record | DevOps | `PASS - Staging/G2 identity locked; promotion pending G5` |
| P08-AC-003 | System Test chạy toàn bộ Must technical/integration/API/data/security scope | test report + raw artifact | QA | `PASS - G2 run 34702722300` |
| P08-AC-004 | UAT Must scenarios cho Student/Teacher/Admin (và Super Admin nếu in scope) đạt expected business outcome | UAT matrix + evidence | QA/BA | `PENDING` |
| P08-AC-005 | Critical/High defect bằng 0; Medium/Low có disposition hợp lệ | defect/retest/waiver | QA/TL | `PENDING` |
| P08-AC-006 | Production service/IAM/WIF, Secret Manager, Terraform state và database user/name tách khỏi Staging | plan, IAM/secret/data evidence | DevOps/Security | `PENDING` |
| P08-AC-007 | Backup/restore đáp ứng profile và RPO/RTO decision; managed PITR chỉ Pass khi provider thực sự cung cấp | decision + backup + isolated restore | DevOps | `PENDING` |
| P08-AC-008 | Rollback target, owner, command và data compatibility được rehearsal | rollback/incident record | DevOps/TL | `PENDING` |
| P08-AC-009 | Monitoring/log redaction/uptime/alert route có evidence và owner | dashboard/alert/observation | DevOps | `PENDING` |
| P08-AC-010 | Production promotion chỉ dùng immutable digest đã stable Staging và protected approval | workflow run + plan/apply record | Release Owner | `PENDING` |
| P08-AC-011 | Production smoke và observation không có untriaged regression | smoke + T+0..T+72h | QA/DevOps | `PENDING` |
| P08-AC-012 | Support, training, communication và escalation được bàn giao | handover/comms/training | PO/BA | `PENDING` |
| P08-AC-013 | Traceability, evidence register và risks/decisions hoàn chỉnh | RTM/evidence/risks | BA/TL | `PENDING` |
| P08-AC-014 | Final acceptance xác nhận outcome và đóng project hoặc nêu rõ residual follow-up | G8 decision + exit report | PO | `PENDING` |

## Gate thresholds

- **G5 GO:** `PRE_RELEASE` gồm P08-AC-001..010 đều `PASS`, System Test/UAT Pass, Critical/High = 0 và production/recovery/observability readiness complete. P08-AC-011..014 được phép còn `PENDING` vì chỉ có thể tạo sau deployment.
- **G8 PASS:** `FINAL` gồm toàn bộ P08-AC-001..014 `PASS`, Production status `ACTUAL`, observation/handover và evidence register complete.
- **CONDITIONAL GO:** chỉ Medium/Low có workaround an toàn, owner/expiry/mitigation/communication; không có integrity/security/privacy blocker.
- **NO-GO:** bất kỳ Must thuộc gate hiện tại chưa xác minh, Critical/High, environment/identity/backup/rollback gap, hoặc authority/evidence thiếu.

`APPROVED_NA` không được cộng vào Pass. Với `ACADEMIC_DEMO_RELEASE`, managed PITR và external participant có thể `APPROVED_NA`; logical backup/isolated restore và role-based UAT vẫn là Must.

## Sign-off record

```text
Release ID: <PENDING>
Candidate commit/digest/revision: <PENDING>
System Test result: <PENDING>
UAT result/sign-off ID: <PENDING>
Open defects/waivers: <PENDING>
G5 decision/ID/UTC: <PENDING>
PO / TL / QA / DevOps: <PENDING>
```
