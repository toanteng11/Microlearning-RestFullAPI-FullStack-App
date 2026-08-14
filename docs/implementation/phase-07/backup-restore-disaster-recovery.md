# Backup Restore And Disaster Recovery

## 1. Phạm vi

Phase 07 rehearsal khả năng export/restore dữ liệu synthetic của Staging và xác định Production gate. Atlas
Free không được coi là đáp ứng native backup/PITR Production.

## 2. Recovery objectives direction

| Environment | RPO direction | RTO direction | Ghi chú |
| --- | --- | --- | --- |
| Staging/demo | tối đa 24 giờ hoặc chấp nhận reset synthetic | 4 giờ | không SLA Production |
| Production target | phải được Product Owner duyệt trong Phase 08 | phải được duyệt | cần paid backup/PITR capability |

Các số Production không được tự suy diễn từ Staging rehearsal.

## 3. Backup method Phase 07

- Logical backup bằng `mongodump` hoặc phương án official tương đương.
- Chỉ backup database Staging synthetic.
- Output được upload vào dedicated private GCS Staging backup bucket; không dùng Terraform state bucket và
  không commit repository.
- Filename/manifest có timestamp UTC, database, tool version và checksum.
- Backup job không in URI/password.
- Bucket bật uniform access, public access prevention và lifecycle xóa object sau `14` ngày baseline.

Rehearsal chạy từ workstation đã duyệt với MongoDB Database Tools. Human operator lấy secret qua kênh bảo
mật, không paste vào command/evidence; không tạo service-account key. Automation thành separate hardened
ops image/job chỉ được bổ sung qua Change Request.

Tạo credential tạm thời riêng cho rehearsal: source user chỉ đọc Staging database, restore user chỉ ghi vào
isolated restore database. Dùng password prompt/secure input thay vì full URI có credential trong command
history; revoke cả hai users sau verification. Không dùng application user hoặc Atlas project owner.

## 4. Backup manifest

```text
backup_id:
source_environment:
source_database:
created_at_utc:
tool_version:
artifact_location:
checksum:
collection_counts_before:
operator:
retention_until:
```

## 5. Restore rehearsal

1. chụp collection counts và business invariants nguồn;
2. tạo backup;
3. tạo checksum và upload artifact/manifest vào private GCS bucket;
4. download rehearsal artifact và verify checksum;
5. tạo isolated restore database `microlearning_restore_test_<date>`;
6. restore bằng credential riêng;
7. chạy schema/index verification;
8. chạy read-only API/report queries trên restored data;
9. so sánh counts và invariants;
10. ghi elapsed time và defects;
11. teardown isolated restore database sau evidence approval.

Không restore đè Staging active trong rehearsal.

## 6. Business invariants

Tối thiểu xác minh:

- user/course/enrollment/submission counts;
- unique constraints và required indexes;
- enrollment không duplicate;
- gradebook totals/ranking không đổi ngoài tie policy;
- report summaries đối chiếu source;
- audit-critical records còn tham chiếu hợp lệ.

## 7. Disaster scenarios

| Scenario | Phase 07 action |
| --- | --- |
| Bad app revision | Cloud Run rollback, không restore data nếu schema compatible |
| Accidental synthetic delete | logical restore vào isolated DB, sau approval mới recovery plan |
| Atlas outage | readiness fail, observe/retry; không restart storm |
| Credential compromise | rotate/revoke; restore chỉ khi integrity affected |
| Terraform state corruption | GCS object version restore runbook |
| Artifact deletion | retention prevents deleting active/prior digest |

## 8. Production gate

Trước Production Go, Phase 08 phải xác nhận:

- Atlas tier hỗ trợ backup/PITR theo RPO/RTO;
- backup schedule/retention/region;
- restore permission separation;
- restore rehearsal trên Production-like isolated target;
- data encryption/access/audit;
- owner và escalation.

Nếu chưa đạt, Production release là `NO_GO`.

## 9. Acceptance evidence

- redacted backup manifest/checksum;
- restore command/run ID không chứa secret;
- before/after counts/invariants;
- measured backup/restore duration;
- cleanup proof;
- Production gap/owner/deadline.
