# Rollback Strategy

## Mục Đích

Rollback là đưa application/static artifact về bản ổn định trước khi release mới gây lỗi. Rollback phải có trigger, artifact identity, owner, verification và record rõ ràng. Rollback **không** mặc định có nghĩa là restore hoặc rollback MongoDB; data change cần xử lý theo compatibility/forward-fix/restore plan riêng.

## Nguyên Tắc Rollback

| ID | Nguyên tắc | Quy tắc áp dụng |
| --- | --- | --- |
| RBK-01 | Roll back immutable artifact | Chọn prior stable frontend/backend image digest/version đã được verify, không chọn tag mutable `latest`. |
| RBK-02 | Stop harmful rollout first | Pause/cancel deployment concurrency trước khi rollback để tránh version bị ghi đè. |
| RBK-03 | Measure impact | Xác định environment, affected role/flow/data, start time, recent deploy/migration trước action. |
| RBK-04 | Database safety first | Không chạy destructive down-migration/restore chỉ vì API rollback; review schema/data compatibility. |
| RBK-05 | Verify recovery | Health, version, role smoke, error/latency/monitoring phải chứng minh prior state hoạt động. |
| RBK-06 | Record and learn | Ghi version from/to, reason, decision, duration, impact, follow-up/root cause. |

## Rollback Trigger

| Trigger | Ví dụ | Action direction |
| --- | --- | --- |
| Health/readiness fail | API not healthy, crash loop, dependency config wrong | Stop rollout, inspect config/log; rollback if prior release healthy. |
| Critical smoke failure | Login, Student To-do, Teacher dashboard, Admin list cannot work | Do not release/promote; rollback Staging/Production based on impact. |
| Security regression | Authorization bypass, secret exposure, public storage/CORS unsafe | Disable/rollback immediately, rotate secret/contain incident. |
| High 5xx/latency after release | Significant error/latency degradation vs baseline | Compare release/log/dependency; rollback or forward fix based on risk/time. |
| Data integrity risk | Duplicate submit, wrong grade/progress/deadline behavior | Stop mutation path; investigate; forward fix/restore plan, application rollback may be insufficient. |
| Non-critical defect | Cosmetic/limited workaround | Prefer controlled forward fix if rollback would cause larger impact. |

## Artifact Compatibility Matrix

| Change type | Frontend rollback | Backend rollback | Database action | Preferred recovery |
| --- | --- | --- | --- | --- |
| Static UI bug, API contract unchanged | Usually safe | Not required | None | Re-publish prior frontend artifact. |
| Backend bug, backward-compatible data/API | Check UI compatibility | Usually safe | None | Roll API image to prior stable digest. |
| API breaking change | Check old frontend contract | May be unsafe alone | None/compat layer | Prefer compatibility/forward fix; roll both components if tested. |
| Additive DB field/index | Usually safe | Usually safe if old code tolerates field | Keep new field/index | Roll app only; do not remove data. |
| Destructive schema/data migration | Unknown | Unsafe without analysis | High risk | Prefer forward fix or restore approved backup; do not automatic rollback. |
| Progress/grade formula change | UI likely safe | May change output | Recalculate/read model risk | Disable/forward fix/rebuild summary, preserve source data/audit. |
| Secret/config change | UI irrelevant | May restore config not image | Rotate/revert config safely | Restore last valid config via secret system, verify health. |

## Standard Rollback Runbook

```text
1. Detect alert/user report/smoke failure and declare incident owner.
2. Confirm environment, severity, release version/digest, deployment time and any migration/config change.
3. Pause rollout and preserve logs/metrics/evidence.
4. Decide: rollback frontend, backend, both, configuration reversal, forward fix, or data recovery escalation.
5. Select last known-good artifact identity and verify compatibility matrix.
6. Execute protected rollback through CI/CD/platform, not an untracked manual replacement where possible.
7. Verify health/version, API/UI/role smoke, error/latency and monitoring recovery.
8. Communicate status, record from/to/reason/impact/duration.
9. Create root-cause/follow-up; re-enable rollout only after approval.
```

## Frontend Rollback

| Step | Check |
| --- | --- |
| Select artifact | Use prior verified static bundle/release version; retain version/digest record. |
| Deploy | Publish/invalidate CDN/cache according to provider; do not leave half old/half new asset mismatches. |
| Verify | Load app in clean browser, refresh protected route, login and representative Student/Teacher/Admin pages. |
| Compatibility | Confirm API still supports prior frontend contract; otherwise coordinated backend rollback/compatibility fix. |

## Backend Rollback

| Step | Check |
| --- | --- |
| Select image | Prior stable image digest/tag and configuration compatibility. |
| Deploy | Use protected platform/CI pipeline; avoid direct unrecorded console edit except emergency with record. |
| Verify | `/health`, version, DB connection, critical API smoke, log/5xx/latency. |
| State | Confirm pending job/read model/migration behavior is safe; inspect error data without deleting evidence. |

## Database And Migration Safety

- Classify every data change as backward-compatible, forward-only or destructive before release.
- Prefer expand-migrate-contract: add optional field/index, deploy compatible code, backfill/rebuild, then later enforce/remove after safe period.
- Never auto-run destructive down migration in Production without backup, approved runbook and explicit impact review.
- Restore database is a DR operation, not the default backend rollback. It can cause loss of valid post-release submissions/progress/grades.
- For bad read model/formula, preserve source data, disable affected output if needed, deploy fix and rebuild summary; audit/reconciliation may be required.

## Rollback Evidence Record

| Field | Nội dung |
| --- | --- |
| Incident/release ID | Link/ticket/reference |
| Environment | Staging/Production |
| Trigger/severity | What failed and impact |
| From version/digest | Failed artifact/config/version |
| To version/digest | Prior stable artifact/config/version |
| Database/migration status | No change / compatible / forward fix / restore escalation |
| Operator/approver | Who executed/approved |
| Start/end/verification | Timing, health/smoke/monitoring results |
| User communication | Who was informed and status |
| Follow-up | Root cause, regression test, prevention action |

## Acceptance Criteria

- Last known-good frontend/backend artifact identity remains available under registry/static release retention policy.
- Deployment record includes migration/config compatibility and clear rollback/forward-fix choice.
- Rollback does not blindly restore/delete learning data, progress, submission, grade or audit records.
- Health/version/role smoke and monitoring verification occur after rollback.
- At least one Staging rollback rehearsal is performed before high-risk/demo/Production release.

## Liên Kết

- Data recovery: `backup-restore-disaster-recovery.md`.
- Release decision: `release-management.md`.
- Operational signals: `observability-operations.md`.
