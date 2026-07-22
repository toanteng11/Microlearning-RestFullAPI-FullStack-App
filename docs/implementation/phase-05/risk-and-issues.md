# Phase 05 Risk And Issues

## 1. Mục Đích

Tài liệu quản lý rủi ro nghiệp vụ, kỹ thuật, bảo mật và vận hành của Assessments And Grading. Risk owner phải kiểm tra trigger ở mỗi Gate; khi trigger xảy ra, risk chuyển thành issue và được theo dõi đến khi có disposition.

## 2. Thang Đánh Giá

| Mức | Probability / Impact | Xử lý |
| --- | --- | --- |
| Critical | Có thể làm lộ đáp án/điểm, mất bài hoặc sai điểm diện rộng | Dừng merge/release, xử lý ngay |
| High | Chặn workflow chính hoặc gây sai dữ liệu có phạm vi đáng kể | Phải đóng trước Gate E |
| Medium | Có workaround, ảnh hưởng cục bộ | Có owner và kế hoạch xử lý rõ |
| Low | Ảnh hưởng nhỏ, không chặn outcome | Theo dõi trong backlog |

## 3. Risk Register

| ID | Risk | P | I | Trigger | Preventive control | Contingency | Owner | Gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P05-R01 | Student nhận correct answer trước khi result được release | M | Critical | Browser payload/log chứa answer key | DTO allowlist theo actor; separate Teacher/Student projection; leak tests | Tắt result endpoint, revoke cache, audit phạm vi, hotfix | BE/Security | C |
| P05-R02 | Double start tạo nhiều active Attempt | M | High | Hai request đồng thời đều 201 | Partial unique index + transaction + retry mapping | Reconcile duplicate theo event/createdAt, giữ một canonical attempt | BE/Data | C |
| P05-R03 | Retry submit làm chấm điểm hoặc tăng attempt count hai lần | M | Critical | Score/history trùng sau retry | Atomic state transition, idempotent terminal response, unique event | Khóa Quiz, chạy reconciliation, regrade từ snapshot | BE/QA | C |
| P05-R04 | Client clock làm sai timeout/late/missing | H | High | Kết quả khác nhau theo timezone/browser | Chỉ server time + fixed clock tests + trả `asOf` | Recompute derived state bằng canonical timestamps | BE | C/D |
| P05-R05 | Sửa Question sau khi Student bắt đầu làm thay đổi đề hoặc điểm | M | Critical | Attempt cũ render/scoring theo bản mới | Immutable snapshot trong Attempt | Regrade từ snapshot; không dùng live Question | BE/Data | C |
| P05-R06 | Snapshot lớn vượt document limit hoặc tăng chi phí query | L | High | Quiz nhiều câu/media metadata bất thường | Giới hạn số câu/kích thước text/options; không embed binary | Chặn publish, split snapshot version ở phase sau | BE/Data | B/C |
| P05-R07 | Công thức Multiple Choice mơ hồ hoặc sai | M | High | PO/QA cho kết quả khác golden fixture | Exact-set scoring đã khóa; golden fixture review Gate A | Version scoring policy; regrade có audit | PO/BE/QA | A/C |
| P05-R08 | Lazy timeout khiến Attempt hiển thị ACTIVE sau deadline khi không có request | M | Medium | Không có scheduler nhưng dashboard đòi real-time terminal state | Effective state được reconcile trên read/list/write | Thêm bounded reconciliation worker ở phase sau nếu số liệu vận hành yêu cầu | BE | C/E |
| P05-R09 | Save answer cuối cùng đua với submit gây mất dữ liệu | M | High | Save và submit cùng revision | Optimistic revision; submit transaction chụp state canonical | Trả `409 ATTEMPT_REVISION_CONFLICT`, cho Student review/retry trước expiry | BE/FE | C |
| P05-R10 | Assignment turn-in/unsubmit đồng thời làm hỏng revision history | M | High | Current revision/state không nhất quán | Transaction + monotonic revision + state precondition | Rebuild current pointer từ append-only revision/event | BE/Data | D |
| P05-R11 | Grade/feedback draft bị Student nhìn thấy | M | Critical | Own-grade trả field trước RETURNED | Visibility policy tại service + DTO projection + IDOR/leak tests | Tắt endpoint/cache, audit, hotfix projection | BE/Security | D |
| P05-R12 | Regrade ghi đè thay đổi của Teacher khác | M | High | Hai grader cùng update một revision | Optimistic revision, `409`, append-only history | So sánh diff, nhập lại trên revision mới | BE/FE | D |
| P05-R13 | Teacher thao tác assessment ngoài Classroom sở hữu | M | Critical | Đoán ObjectId truy cập được object | Resource-first lookup + owner/scope check + generic not-found | Security incident workflow, audit, patch policy | BE/Security | B-E |
| P05-R14 | Deadline exception làm ngắn hạn hoặc đặt quá khứ ngoài ý muốn | M | High | effective due date nhỏ hơn default/current time | Normal Teacher chỉ được gia hạn; reason + revision + preview | Admin/authorized correction flow có audit; rollback bằng event mới | PO/BE | D |
| P05-R15 | To-do/progress regression với Lesson của Phase 04 | M | High | Lesson biến mất/sort khác sau union v2 | Contract adapter + P04 regression suite | Feature flag activity v2/read fallback có kiểm soát | Full-stack/QA | E |
| P05-R16 | Progress denominator đổi âm thầm làm số liệu Phase 06 sai | M | High | Metric cùng tên nhưng công thức khác | Metric version `P05_REQUIRED_ACTIVITY_COMPLETION_V1` | Giữ version cũ; migration/report adapter | TL/Data | E |
| P05-R17 | Query Teacher result/submission bị chậm khi dữ liệu lớn | M | Medium | p95 vượt budget/explain COLLSCAN | Compound indexes theo scope/status/dueAt; bounded pagination | Giảm page limit, thêm index theo evidence | BE/Data | B/E |
| P05-R18 | Autosave UX làm Student tưởng đã lưu nhưng request thất bại | M | High | Rời trang khi trạng thái `Saving/Failed` | Hiển thị trạng thái rõ, retry, navigation warning | Draft local chỉ làm buffer không là source of truth; hướng dẫn retry | FE/QA | C |
| P05-R19 | External media/link chứa nội dung độc hại hoặc tracking | M | High | URL không HTTPS/domain lạ/redirect | Allowlist, URL parser, no server fetch, safe link attributes | Tắt Conditional feature bằng config; remove offending data | Security/FE | C/D |
| P05-R20 | File upload bị triển khai tạm bằng local container disk | M | High | Code nhận multipart hoặc ghi filesystem | Explicit defer, no-upload test/review checklist | Loại endpoint trước merge; chuyển P07 private GCS design | TL/DevOps | A-E |
| P05-R21 | Scope creep sang weighted grade/report/export Phase 06 | H | Medium | PR thêm ranking/export/category weight | Scope/PR template/WBS boundary | Tách PR/backlog P06 | PO/TL | A-E |
| P05-R22 | Seed chứa credential/PII hoặc answer thật | L | Critical | Secret scan/fixture review cảnh báo | Synthetic identities, env password, deterministic fake data | Rotate/revoke credential, purge history theo incident process | DevOps/Security | E |
| P05-R23 | Migration/index rollout làm service không khởi động | M | High | Duplicate key/index mismatch | Preflight, named index manifest, replica-set integration | Rollback application/index theo `migration-and-rollback.md` | BE/DevOps | B |
| P05-R24 | Một người vừa author vừa approve làm giảm chất lượng Gate A | H | Medium | Không có reviewer độc lập | PR review/branch rule; checklist decision owner | Nhờ giảng viên/peer review; ghi rõ approved exception nếu bất khả thi | Repository owner | A |
| P05-R25 | BA yêu cầu upload nhưng Cloud storage chưa sẵn sàng | H | Medium | UAT kỳ vọng attachment | URL/MARK_DONE Conditional được mô tả rõ; P07 handoff | Ghi limitation trong demo/UAT, ưu tiên P07 storage | PO/BA | A/E |

## 4. Current Issues

| ID | Vấn đề | Severity | Trạng thái | Hành động đóng |
| --- | --- | --- | --- | --- |
| P05-I01 | Planning baseline chưa được repository owner review/merge | Medium | Open | Mở planning PR, CI xanh, review decision/AC và merge |
| P05-I02 | Các quyết định trong `technical-decisions.md` còn trạng thái `Proposed` | Medium | Open | Gate A reviewer Accept hoặc ghi disposition từng quyết định chặn Must |
| P05-I03 | Conditional media/link/comment/basic Gradebook chưa có quyết định bật/defer cuối cùng | Low | Open | PO chọn Enabled hoặc N/A trước khi chốt Gate A |
| P05-I04 | Chưa có runtime code/test/evidence của Phase 05 | Expected | Not started | Chỉ bắt đầu sau Gate A; thực hiện theo WBS và PR strategy |

Không issue nào ở trên chứng minh implementation bị lỗi vì implementation chưa bắt đầu. `P05-I01..I03` là điều kiện review planning cần giải quyết trước trạng thái `READY_TO_CODE`.

## 5. Escalation Rules

1. Security/privacy/scoring/data-loss issue mặc định ít nhất High và chặn merge.
2. Không giảm severity chỉ vì test khó tái hiện; phải có root cause hoặc bằng chứng loại trừ.
3. Workaround bằng sửa dữ liệu trực tiếp trong MongoDB không được xem là fix.
4. Accepted risk phải có owner, expiry/review date và lý do; không dùng `accepted` vô thời hạn.
5. Risk thay đổi scope phải cập nhật AC, WBS, traceability và exit report trong cùng PR.

## 6. Review Cadence

- Gate A: review toàn bộ `R01..R25` và chấp thuận owner/control.
- Mỗi implementation PR: nêu risk bị tác động và test bổ sung.
- Trước Gate C/D: chạy threat/concurrency review cho workflow tương ứng.
- Trước Gate E: không còn Critical/High issue mở; Medium/Low phải có disposition.
- Sau incident hoặc test failure quan trọng: cập nhật register ngay, không chờ phase review.
