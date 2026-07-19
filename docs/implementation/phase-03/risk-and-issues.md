# Phase 03 Risks And Issues

## 1. Risk Scale

- Probability/Impact: Low, Medium, High.
- Risk credential/privilege/data integrity có Impact High mặc định.
- High risk chưa có mitigation/evidence chặn phase exit.

## 2. Risk Register

| ID      | Risk                                                | P/I       | Trigger                                 | Mitigation                                    | Contingency/Owner                              |
| ------- | --------------------------------------------------- | --------- | --------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| P03-R01 | Teacher role truy cập Classroom Teacher khác        | M/H       | Route chỉ check role                    | Owner predicate + negative direct API         | Disable route/fix/review / Backend+Security    |
| P03-R02 | Student xem Classroom/roster ngoài Enrollment       | M/H       | IDOR response trả data                  | Enrollment/object resolver + projection tests | Revoke affected access / Backend               |
| P03-R03 | Raw Class Code lưu/log                              | M/H       | DB/log/evidence chứa code               | HMAC pepper, redaction, raw-once assertion    | Rotate code/pepper incident / Security         |
| P03-R04 | Raw Invite Token lộ URL/proxy/log                   | M/H       | Token còn trong API URL/log             | POST body preview, immediate URL cleanup      | Disable/regenerate link / FE+BE+DevOps         |
| P03-R05 | Short Code bị brute force                           | H/M       | Nhiều invalid attempts                  | Entropy, rate limit, generic error, metrics   | Disable Code globally / Admin                  |
| P03-R06 | Concurrent join tạo duplicate                       | M/H       | >1 Enrollment pair                      | Unique pair + real transaction/race tests     | Data repair + block release / Backend          |
| P03-R07 | Join vs policy/archive race tạo invalid member      | M/H       | Join commit sau disable                 | Transaction revalidation/ordering contract    | Remove invalid membership with audit / Backend |
| P03-R08 | Regenerate credential còn hai ACTIVE                | M/H       | Parallel rotate                         | Partial unique index + transaction + CAS      | Disable all/recreate / Backend                 |
| P03-R09 | Global policy precedence bị UI/Teacher override     | M/H       | Local true khi global false joins       | Effective setting computed backend            | Global emergency disable / Admin               |
| P03-R10 | Remove Student xóa history                          | M/H       | Cascade delete/cleanup                  | Soft state, no cascade, data tests            | Restore backup/repair / Backend                |
| P03-R11 | Rejoin behavior mơ hồ tạo record mới                | M/M       | REMOVED user joins                      | Unique natural pair; rejoin deferred          | Return controlled conflict / BA+Backend        |
| P03-R12 | Stale settings overwrite                            | M/M       | Concurrent update loses change          | expectedUpdatedAt/revision CAS                | Reload/reapply / FE+BE                         |
| P03-R13 | Roster/Admin list N+1/chậm                          | M/M       | Many rows/lookup calls                  | Aggregation/index/pagination                  | Reduce limit/add read model / Backend          |
| P03-R14 | Member count lệch nếu denormalize sớm               | M/M       | Counter != Enrollment                   | Aggregate initially; ADR before counter       | Rebuild counter / Backend                      |
| P03-R15 | Teacher block làm Classroom orphan                  | M/H       | P02 status mutation ignores ownership   | OwnershipReader guard BR-100                  | Archive/transfer then retry / Admin            |
| P03-R16 | Public preview lộ private metadata                  | M/H       | Member/section/content returned         | Minimal DTO + contract/security tests         | Disable preview/hotfix / Security              |
| P03-R17 | Join context token persist browser                  | M/H       | localStorage/session leak               | Memory/TTL/clear + storage E2E                | Disable link/clear storage / FE                |
| P03-R18 | Process-local limiter không nhất quán multi-replica | H/M later | Scale API >1                            | Keep one replica; shared store P07            | Set replicas=1 / DevOps                        |
| P03-R19 | Invite expiry/default UX không được BA duyệt        | M/M       | Teacher mất link bất ngờ                | ADR/BA approval, clear expiry UI              | Adjust default/regenerate / PO                 |
| P03-R20 | API/BA transport bị sửa lệch sau khi đã đồng bộ     | M/M       | Frontend/backend dùng route khác nhau    | Revision 1.42 + exact OpenAPI route test       | Block implementation until re-aligned / BA+TL  |
| P03-R21 | Comment/post setting claim nhưng chưa consumer      | M/M       | UI promises behavior P04 chưa có        | Persist only, wording/scope explicit          | Hide until Phase 04 / BA+FE                    |
| P03-R22 | Index migration fail do duplicate pre-existing data | L/H       | Unique index creation error             | Preflight scan; empty/new P03 collections     | Repair plan/rollback / DevOps+Backend          |
| P03-R23 | E2E fixture logs active credential                  | M/H       | CI trace/output contains token          | Runtime memory fixture, redacted artifact     | Revoke fixtures/delete artifact / QA+DevOps    |
| P03-R24 | Admin governance biến thành unrestricted mutation   | M/H       | Reuse Teacher route/bypass owner        | Separate permissions/routes/actions           | Disable action / Security                      |

## 3. Residual Risks Accepted For P03

- Rate limiter process-local vì runtime một API replica; scale chuyển P07.
- Invite expiry materialize lazy; scheduled cleanup không bắt buộc.
- Ownership transfer/capacity/rejoin là Should nếu chưa approve.
- Archived Classroom content history chi tiết do Phase 04 định nghĩa.
- Member count có thể aggregate chậm ở scale lớn; MVP 50-100 Classroom theo BA baseline.

Không chấp nhận residual raw credential exposure, IDOR, duplicate active membership, partial transaction hoặc history deletion.

## 4. Decision Closure

| Decision group              | Required approver         | Status                         |
| --------------------------- | ------------------------- | ------------------------------ |
| Scope/Should/out-of-scope   | Product Owner/BA          | Accepted `2026-07-19`          |
| Code/token/raw-once/expiry  | Security + Technical Lead | Accepted `2026-07-19`          |
| API preview POST refinement | BA + Backend + Frontend   | Accepted `2026-07-19`          |
| Data/index/transaction      | Backend + QA + DevOps     | Accepted `2026-07-19`          |
| UI join context/one-time UX | BA + Frontend + Security  | Accepted `2026-07-19`          |

## 5. Issue Register

| Issue                                                                | Severity      | Owner                               | Status | Next action                                              |
| -------------------------------------------------------------------- | ------------- | ----------------------------------- | ------ | -------------------------------------------------------- |
| P03-I01 - Phase 03 decisions từng chưa được reviewer phê duyệt       | Planning gate | Product Owner/TL/QA/Security/DevOps | Closed | ADR Accepted; P03-GA-07 đóng bởi PR #5/run #11/merge `1e8ad41` |
| P03-I02 - BA/API transport từng chưa thống nhất | Contract | BA + TL | Closed | Revision 1.42/DEC-016 và P03-ADR-007 đã Accepted ngày `2026-07-19` |
| P03-I03 - Login giữ `returnUrl` khác role có thể điều hướng sai scope | High | Frontend | Closed | Thêm role-aware sanitizer và ma trận `13` return URL security cases |
| P03-I04 - Roster/governance table từng ẩn dữ liệu ở mobile | Medium | Frontend | Closed | Chuyển responsive table thành labeled row-card; browser review pass |
| P03-I05 - E2E database từng lệch fixture credential | Environment | QA/DevOps | Closed | Dùng database tách biệt, seed lại hai lần và chạy `9/9` journeys pass |
| P03-I06 - Browser E2E seed thiếu Phase 03 numeric environment | CI | DevOps | Closed | Bổ sung bảy biến `CLASSROOM_*` vào browser E2E env; PR run #14 và main run #15 đều `6/6` |

Không còn issue Critical/High hoặc release blocker mở khi đóng Phase 03. Regression phát hiện sau merge phải được ghi thành issue mới và xử lý theo severity.

## 6. Issue Handling

- Credential/IDOR/duplicate/partial state: stop merge, preserve sanitized evidence, revoke credential và mở issue High.
- Không tắt assertion/unique index/rate limit để làm test xanh.
- Data repair phải có backup, reviewed script và post-check.
- Blocked dependency ghi owner/date/impact; không mock Production path rồi claim complete.
