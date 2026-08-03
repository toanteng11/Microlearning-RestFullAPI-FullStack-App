# MongoDB Atlas Integration

## 1. Mục tiêu

Kết nối Cloud Run Staging với MongoDB Atlas theo hướng an toàn, có giới hạn tài nguyên và đủ evidence cho
demo/system test. Atlas Free hiện tại không được xem là Production data platform.

## 2. Baseline hiện hữu

| Thuộc tính | Giá trị |
| --- | --- |
| Atlas project | `Microlearning Platform` |
| Cluster | `Cluster0` |
| Tier | Free |
| Provider/region | AWS Hong Kong hiện hữu |
| Phase 07 use | Synthetic Staging/demo only |
| Production use | `BLOCKED_PENDING_PAID_TIER_AND_NETWORK_DECISION` |

Không ghi username/password/connection string thật vào tài liệu này.

## 3. Database separation

- Database Staging riêng: `microlearning_staging`.
- Restore rehearsal database riêng: `microlearning_restore_test_<date>`.
- Test/local database không dùng chung với Staging.
- Production tương lai dùng cluster/database/user riêng.
- Seed script chỉ tạo synthetic accounts/content và phải có environment guard.
- Cloud Run seed Job chạy on-demand, task count `1`, cùng application digest và không public.

## 4. Database user policy

- Dedicated application user cho Staging.
- Chỉ có quyền cần thiết trên Staging database.
- Không dùng Atlas project owner/admin credential trong app.
- Username không chứa email/tên cá nhân nếu tránh được.
- Password sinh ngẫu nhiên, lưu Secret Manager, rotate trước first deploy.
- Credential cũ đã từng chia sẻ phải revoke và negative-connect test.

## 5. Network policy

Ưu tiên narrow allowlist/static egress. Nếu dùng Atlas Free cùng Cloud Run dynamic egress và chưa có NAT:

- cần waiver có owner/expiry;
- chỉ synthetic data;
- TLS/SRV connection;
- least-privilege database user;
- alert/audit Atlas access;
- không tuyên bố Production-ready;
- phải đóng hoặc nâng cấp trước Production Go.

## 6. Connection contract

- Dùng official MongoDB driver/Mongoose version đã pin trong repository.
- URI chỉ từ Secret Manager.
- TLS không được tắt.
- `serverSelectionTimeoutMS`, connect timeout và socket timeout hữu hạn.
- `maxPoolSize=10` baseline mỗi instance.
- `minPoolSize=0` để phù hợp scale-to-zero.
- Không tạo connection mới trên mỗi request.
- Retry behavior phải tránh duplicate side effects; dựa vào idempotency/transaction contract hiện hữu.

## 7. Startup/readiness behavior

- App khởi động chỉ ready sau kết nối MongoDB thành công.
- Mất MongoDB sau startup làm `/ready=503` nhưng `/health=200`.
- Driver reconnect theo bounded strategy; không log URI.
- Dependency outage trả error envelope đúng contract, không treo đến Cloud Run timeout.

## 8. Schema/index/transaction verification

First Staging deploy phải xác minh:

1. expected collections tồn tại sau seed/use;
2. unique/compound indexes từ Phase 03-06 tồn tại đúng spec;
3. duplicate enrollment/submission protections còn hiệu lực;
4. transaction integration suite chạy trên replica-set capable Atlas;
5. query explain cho critical reporting/gradebook paths không full-scan ngoài accepted threshold;
6. schema compatibility với current và prior rollback image.

Không bật auto-index Production mặc định nếu chưa có migration/index runbook.

## 9. Data policy

- Chỉ synthetic identities, email và learning content.
- Không import dữ liệu sinh viên/giảng viên thật.
- Seed password không dùng lại credential cá nhân.
- GitHub runner không nhận `MONGODB_URI`; Job lấy URI/password bằng Secret Manager reference qua runtime
  identity.
- Evidence/screenshot phải che ID/email nếu không cần.
- Có teardown/reset command được bảo vệ theo environment.

## 10. Backup/restore limitation

Atlas Free không đáp ứng native backup contract Production. Phase 07 chỉ rehearsal logical export/restore trên
synthetic data và ghi rõ giới hạn. Production Go cần tier có backup/PITR phù hợp hoặc quyết định thay thế đã
được duyệt.

## 11. Monitoring

- Theo dõi connection count, storage, slow queries và cluster availability trong phạm vi tier hỗ trợ.
- Cloud app metrics theo dõi Mongo error/readiness failure.
- Alert threshold phải xét max instances x pool size.
- Không gửi Mongo URI vào alert payload.

## 12. Acceptance checks

- New credential works; old credential fails.
- Cloud Run connects over TLS và reaches ready.
- Connection pool không vượt budget khi scale 2 instances.
- Critical indexes/transactions Pass.
- Synthetic seed idempotent hoặc resettable.
- Restore rehearsal vào database tách biệt Pass.
- Network waiver có owner/expiry hoặc narrow allowlist được chứng minh.
- Production block được ghi trong P08 handoff.
