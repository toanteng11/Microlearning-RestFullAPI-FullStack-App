# Rollback And Incident Response

## 1. Mục tiêu

Phục hồi dịch vụ về revision ổn định trước đó bằng exact digest và quản lý sự cố theo evidence thay vì sửa
nóng không kiểm soát.

## 2. Rollback prerequisites

- Prior stable revision/digest còn trong Cloud Run/Artifact Registry.
- Database changes backward compatible trong rollback window.
- Prior secret versions còn enabled nếu revision cũ cần.
- Operator có quyền và runbook access.
- Monitoring xác định trigger và thời điểm.

## 3. Automatic vs manual rollback

| Trigger | Hướng xử lý |
| --- | --- |
| post-deploy Must smoke fail | workflow tự gọi rollback hoặc dừng traffic trước stable mark |
| readiness/version mismatch | rollback ngay |
| error/latency tăng sau observation | operator xác nhận và rollback |
| data corruption/security incident | dừng traffic/contain trước, Incident Commander quyết định |
| monitoring mù | không tiếp tục rollout; rollback nếu không chứng minh an toàn |

## 4. Cloud Run rollback procedure

1. declare incident/deployment failure;
2. ghi current và prior revision/digest;
3. chuyển traffic về prior stable revision theo Terraform/approved command;
4. poll `/health` và `/ready`;
5. chạy critical smoke;
6. xác minh version endpoint là prior digest;
7. theo dõi error/latency trong observation window;
8. ghi rollback record;
9. mở defect/root-cause task;
10. reconcile Terraform state/config nếu emergency command được dùng.

Không rebuild image cũ và không chỉ đổi mutable tag.

## 5. Data compatibility rule

- Migration phải expand/contract và backward compatible.
- Không drop/rename field/index critical cùng release nếu làm N-1 không chạy được.
- Destructive migration tách khỏi deployment, cần backup và explicit approval.
- Nếu rollback app không đủ do data change, incident được nâng severity và dùng recovery plan riêng.

## 6. Incident severity

| Severity | Ví dụ | Response |
| --- | --- | --- |
| Critical | data/secret exposure, rollback fail, auth bypass | contain ngay, revoke/disable, owner escalation |
| High | service unavailable, core flow/RBAC fail | rollback nhanh, active investigation |
| Medium | degraded report/performance có workaround | triage, fix scheduled |
| Low | cosmetic/non-blocking | backlog |

## 7. Incident record

```text
incident_id:
severity:
detected_at_utc:
detected_by:
environment:
affected_revision_digest:
symptoms:
customer/data impact:
containment:
rollback_started/completed:
restored_revision_digest:
evidence_urls:
root_cause:
corrective_actions:
owner/deadline:
closed_at_utc:
```

## 8. Rehearsal scenarios

Phase 07 phải rehearsal tối thiểu:

1. deploy một known-bad readiness configuration an toàn hoặc synthetic failed smoke;
2. xác nhận deployment không được mark stable;
3. chuyển về prior revision;
4. critical smoke Pass;
5. Terraform/drift state clean;
6. ghi measured recovery time.

Không gây mất dữ liệu hoặc expose secret để tạo rehearsal.

## 9. Post-incident actions

- root-cause không dừng ở “human error”;
- thêm regression test/policy check;
- cập nhật runbook/alert threshold;
- kiểm tra credential/log/data exposure;
- ghi owner/deadline;
- chỉ đóng khi corrective action trọng yếu hoàn tất hoặc accepted debt.
