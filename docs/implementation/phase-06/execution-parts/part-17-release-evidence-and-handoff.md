# Part 17 - Release Evidence And Handoff

## Goal

Đóng Phase 06 bằng evidence có thể tái lập, main CI xanh và handoff Phase 07 được chấp nhận.

## Parent PR

`P06-PR08 - Quality And Exit`

## Dependencies

- Part 16 `DONE`.

## Work

1. Hoàn thành `test-case-execution-matrix.md`.
2. Cập nhật 68 Must AC với evidence cụ thể.
3. Ghi Pass hoặc `APPROVED_NA` cho 6 Conditional.
4. Hoàn thành `evidence-register.md` và `phase-exit-evidence.md`.
5. Cập nhật WBS/checklist/risk/debt.
6. Chạy clean-clone verification tại release candidate commit.
7. Mở P06-PR08, resolve review và required checks.
8. Merge qua protected main.
9. Xác nhận post-merge main CI.
10. Ghi release merge commit và CI URLs.
11. Hoàn thành `exit-report.md`.
12. Review và accept `phase-07-handoff.md`.
13. Chỉ sau đó đổi Phase 06 thành `COMPLETED`.

## Release Summary

```text
Must: <passed>/68
Conditional: <passed>/<enabled>, <approved-na>/<disabled>
Critical: 0
High: 0
PR CI: <url>
Main CI: <url>
Release commit: <sha>
Decision: PASS | FAIL | CONDITIONAL_PASS
```

## Stop Conditions

- Evidence dùng placeholder hoặc không có commit/URL.
- Clean clone hoặc main CI chưa Pass.
- Critical/High defect còn mở.
- P07 chưa nhận migration/env/observability/rollback contracts.

## Definition Of Done

- `P06-AC-068` Pass.
- Gate E `APPROVED`.
- P06-PR08 và post-merge main CI Pass.
- Phase 07 handoff accepted.
- README/roadmap/traceability phản ánh release thật.
- Phase 06 được đánh dấu `COMPLETED`, không dùng tỷ lệ cảm tính.

## Current Execution Status

`LOCAL_COMPLETE_REMOTE_PENDING`.

Đã hoàn thành tại local: test matrix, acceptance result, evidence register, risk review, clean clone,
exit report draft và P07 handoff package. Chưa được phép đánh dấu `COMPLETED` vì các bước sau cần
thực hiện trên GitHub/protected branch:

1. push branch `quality/phase-06-release-hardening`;
2. mở release PR và để toàn bộ required checks Pass;
3. resolve review rồi merge qua protected `main`;
4. xác nhận post-merge main CI;
5. ghi PR/Actions/merge URLs và P07 acceptance.
