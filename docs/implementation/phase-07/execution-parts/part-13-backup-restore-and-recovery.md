# Part 13 - Backup Restore And Recovery

## Goal

Rehearse logical backup và isolated restore của synthetic Atlas Staging, đo thời gian và khóa Production
backup gap.

## Parent PR

`P07-PR06 - Operations Recovery And Rollback`

## Dependencies

- Part 07 Atlas data/index contract stable.
- Secure backup location/credential available.

## Work

1. select deterministic synthetic dataset;
2. capture source counts/invariants;
3. create short-lived read-only backup and isolated-restore users;
4. run logical backup through secure password input without printing credential URI;
5. create manifest/checksum;
6. upload artifact/manifest to private short-lived GCS backup bucket;
7. download and verify checksum as restore input;
8. restore to isolated allowlisted database;
9. verify checksum/counts/indexes/invariants/reports;
10. measure backup/restore duration;
11. verify bucket public prevention/access/lifecycle;
12. teardown isolated restore database and revoke temporary users after evidence;
13. document RPO/RTO direction and Free tier limitation;
14. add P08 NO_GO gate for native backup/PITR/tier;
15. document Terraform state recovery separately.

## Validation

- TC-062..063 Pass;
- restored business invariants match;
- active Staging untouched;
- no secret/real PII in backup/evidence;
- cleanup confirmed.

## Evidence

`P07-EV-029..030`, manifest/checksum/count comparison/timing.

## Stop Conditions

- restore targets active Staging;
- backup contains real data or is committed;
- checksum/invariant mismatch;
- Atlas Free rehearsal is claimed as Production backup readiness.

## Definition Of Done

- AC-057..058 Pass;
- Production backup gap explicit in P08 handoff.

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING`.

Đã triển khai `apps/api/src/scripts/atlas-recovery.ts` với hai lệnh:

- `npm run atlas:backup`: export EJSON JSONL theo collection, sort theo `_id`, lưu checksum SHA-256,
  index metadata và manifest không chứa URI/password;
- `npm run atlas:restore`: kiểm tra checksum trước khi insert, chỉ restore vào database có prefix
  `microlearning_restore_`, tạo lại index và sinh restore report có count/timing/invariant boundary.

Guard bắt buộc là `APP_ENV=staging`, `RECOVERY_DATA_SCOPE=synthetic`, SRV connection string và database
restore khác source. Công cụ không tự upload GCS và không tự revoke Atlas user; operator phải thực hiện
securely theo runbook sau khi local contract Pass. Chưa chạy backup/restore thật trên Atlas nên AC-057..058
chưa được đánh dấu Pass.
