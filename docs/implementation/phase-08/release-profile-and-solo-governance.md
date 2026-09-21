# Phase 08 - Release Profile and Solo Governance

> **Scope update 2026-09-21:** The two profiles below describe the earlier Cloud release plan. The
> current deliverable is `LOCAL_ACADEMIC_ACCEPTANCE`, defined in `local-acceptance-runbook.md`. It does
> not claim public deployment or reuse the old Cloud candidate's G3-G8 decisions.

## 1. Release profile

Phase 08 hỗ trợ hai mức phát hành. Mỗi release candidate phải chọn đúng một profile tại G0 và giữ nguyên đến G8, trừ khi có Change Request.

| Profile | Mục tiêu | Dữ liệu | Hạ tầng tối thiểu | Cách tuyên bố kết quả |
| --- | --- | --- | --- | --- |
| `ACADEMIC_DEMO_RELEASE` | Bản demo công khai phục vụ đồ án/CV | Chỉ dữ liệu tổng hợp (synthetic) | Cloud Run thực tế; Production service/identity/secrets/state/database user tách Staging; backup logic và restore cô lập | “Production-like academic demo”, không tuyên bố SLA hoặc compliance cấp tổ chức |
| `ORGANIZATION_PRODUCTION` | Hệ thống dùng cho tổ chức/người dùng thật | Dữ liệu thật theo policy đã duyệt | Môi trường, Atlas project/cluster, managed backup/PITR, monitoring/on-call, retention và pháp lý đầy đủ | Có thể tuyên bố Production sau khi toàn bộ điều kiện tổ chức Pass |

**Profile dùng để lập kế hoạch:** `ACADEMIC_DEMO_RELEASE`.

Lựa chọn trên dựa vào phạm vi đồ án cá nhân và phải được xác nhận trong record G0. Nếu đưa dữ liệu thật vào hệ thống hoặc cam kết SLA, profile tự động nâng thành `ORGANIZATION_PRODUCTION` và release trở thành `NO_GO` cho đến khi các điều kiện bổ sung được đáp ứng.

## 2. Quy tắc Atlas cho academic demo

- Có thể dùng cùng Atlas cluster để kiểm soát chi phí, nhưng database name và database user phải riêng cho Production demo.
- User ứng dụng chỉ có `readWrite` trên đúng database Production demo; không dùng `atlasAdmin`.
- Network access phải được ghi nhận; cấu hình `0.0.0.0/0` chỉ được chấp nhận tạm thời cho Cloud Run khi TLS, credential riêng, rotation, synthetic-only và expiry/review được ghi rõ.
- DOP-AC-017 được đáp ứng bằng backup logic trước release và restore rehearsal trong database cô lập. Managed PITR có thể là `APPROVED_NA` cho profile academic nếu có decision record; nó không được ghi là `PASS`.
- Mọi collection kiểm tra tạm phải được dọn theo evidence retention policy sau khi evidence đã lưu.

## 3. Một người, nhiều vai trò

Chủ dự án: **Trần Đức Toàn - MSSV 2351010210**. Một người có thể thực hiện các vai trò PO, BA, Technical Lead, QA, DevOps và Support, nhưng phải ghi recommendation theo từng vai trò để giữ rõ trách nhiệm.

| Vai trò | Trách nhiệm trong Phase 08 | Evidence bắt buộc |
| --- | --- | --- |
| PO/BA | Chốt profile, scope, UAT expected result và Go/No-Go | decision/sign-off có actor và UTC |
| Technical Lead | Xác nhận identity, architecture, compatibility và technical risk | review record + linked evidence |
| QA | Chạy System Test/UAT, defect/retest và quality recommendation | raw report + summary |
| DevOps/Support | Hạ tầng, promotion, smoke, monitoring, rollback và handover | workflow/provider record |

Không dùng từ “independent approval” khi cùng một người thực hiện nhiều vai trò. Record phải ghi `soloProject: true` và `independentReview: false`. Nhận xét của giảng viên hoặc người dùng thử là evidence bổ sung, không phải điều kiện giả định.

## 4. UAT cho đồ án cá nhân

- Dùng bốn tài khoản synthetic: Student, Teacher, Admin và Super Admin nếu capability có trong scope.
- Chủ dự án thực thi từng persona trong session/browser context tách biệt.
- Mỗi scenario vẫn phải có expected/actual, status, timestamp, release identity và bằng chứng.
- Không tự Pass chỉ vì người phát triển đồng thời là người UAT; lỗi phải vào defect register và được retest.
- UAT external participant là `OPTIONAL`. Nếu có, ghi riêng người tham gia và phạm vi họ đã kiểm tra.

## 5. Stop conditions

- Có dữ liệu thật/PII nhưng chưa nâng profile và duyệt privacy/retention.
- Dùng lại Staging database user, secret hoặc Terraform state cho Production demo.
- Ghi nhận approval độc lập không có thật.
- Managed backup/PITR được đánh dấu `PASS` dù provider/tier không cung cấp.
- Production URL/revision được ghi `ACTUAL` khi không có workflow/provider evidence.
