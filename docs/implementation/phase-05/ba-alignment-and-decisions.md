# Phase 05 BA Alignment And Decisions

## 1. Mục Đích

Tài liệu này chuyển BA baseline thành quyết định triển khai có thể kiểm thử. Mọi refinement đều giữ traceability về requirement gốc; trường hợp defer phải nêu target phase và không được tính là đã hoàn thành.

## 2. Requirement Mapping

| BA source | Phase 05 disposition |
| --- | --- |
| `FR-036` | Must: Quiz settings, lifecycle, availability, attempt/time/due policy |
| `FR-037` | Must: bốn Question type và validation/scoring phù hợp |
| `FR-038` | Conditional Should: URL media; upload deferred P07 |
| `FR-039` | Must: start/save/resume/submit/timeout-safe attempt |
| `FR-040` | Must auto-grade objective; Must manual review path cho short answer để workflow kết thúc được |
| `FR-041` | Must result list/detail và basic performance; analytics sâu P06 |
| `FR-042` | Must Assignment metadata/policy/lifecycle; attachment upload P07 |
| `FR-043` | Must TEXT; Conditional LINK/MARK_DONE; FILE deferred P07 có traceability gap rõ |
| `FR-044` | BA Priority Should; P05 nâng unsubmit/resubmit trước Grade/Return thành Must để workflow nhất quán; sau `RETURNED` deferred |
| `FR-045` | Must roster-derived Submission status table |
| `FR-046` | Must grade/feedback/return/regrade |
| `FR-047` | Conditional Should private comments; Grade feedback là Must |
| `FR-048` | Must Grade relation/projection/history |
| `FR-049/050/054/056/059` | Must mở rộng P04 read models cho Quiz/Assignment |
| `FR-055` | Must Student own released Grade/Feedback |
| `FR-057` | Must Back/breadcrumb/return context và unsaved warning |
| `FR-060..063` | P05 cung cấp source/basic summary; weighted analytics/export thuộc P06 |

## 3. BA Refinement Register

| ID | Điểm chưa thống nhất | Quyết định P05 | Lý do/impact |
| --- | --- | --- | --- |
| P05-BA-001 | BA ghi `POST /quizzes/{id}/attempts` như submit | Tách start, save answers và submit endpoints | Cần resume, time limit, idempotency và audit rõ |
| P05-BA-002 | Attempt state BA dùng cả `PENDING_REVIEW` và `NEEDS_REVIEW` | Canonical `NEEDS_REVIEW` | Một enum xuyên API/data/UI |
| P05-BA-003 | Question point BA cho phép non-negative | P05 yêu cầu integer `1..100` ngay từ create/update; published total `1..1000` | Một contract xuyên API/data/UI và không có denominator 0 |
| P05-BA-004 | Multiple choice partial score chưa định nghĩa | MVP exact-set, all-or-nothing | Deterministic, dễ giải thích; partial scoring Post-MVP |
| P05-BA-005 | Short answer có expected answer/rubric | Không auto-grade; rubric private hỗ trợ Teacher | Tránh sai chấm do text matching mơ hồ |
| P05-BA-006 | Result có thể hiển thị ngay | `IMMEDIATE`, `AFTER_REVIEW`, `TEACHER_RETURN`; short answer không cho `IMMEDIATE` | Bảo vệ answer/rubric và manual score |
| P05-BA-007 | Nhiều attempt dùng score nào | Baseline `HIGHEST`; mọi attempt vẫn giữ | Quy tắc đơn giản và phù hợp luyện tập |
| P05-BA-008 | Timeout cần scheduler | Lazy reconciliation bằng server clock trên read/write + batch hook tương lai | Không tạo scheduler dependency trong P05 |
| P05-BA-009 | Assignment file là Must nhưng GCS ở P07 | FILE deferred P07; TEXT Must, LINK/MARK_DONE Conditional | Không lưu file trên container/local disk |
| P05-BA-010 | Missing có phải Submission status lưu sẵn | `MISSING` derived từ roster + effective deadline + no valid turn-in | Không tạo placeholder document cho mọi Student |
| P05-BA-011 | Submission edit/unsubmit/resubmit history | Một current Submission + append-only revision/event | Query đơn giản nhưng không mất evidence |
| P05-BA-012 | Grade và feedback embedded hay collection riêng | Grade current riêng + append-only history; feedback current trong Grade; private comment riêng nếu bật | Transaction/regrade/privacy rõ |
| P05-BA-013 | Grade visible sau save hay return | Save = internal `DRAFT`; Student chỉ thấy `RETURNED` | Khớp Google Classroom-inspired workflow và BA |
| P05-BA-014 | Admin có thể grade vì BA ghi governance | Daily Admin read-only; override cần capability + reason/audit, không thuộc Must UI | Least privilege |
| P05-BA-015 | Deadline reset global hay per Student | P04 giữ global Lesson deadline; P05 thêm per-Student exception cho Lesson/Quiz/Assignment | Đáp ứng trường hợp ngoại lệ không ảnh hưởng cả lớp |
| P05-BA-016 | Teacher có thể rút ngắn deadline exception | Must chỉ extend; shorten/past cần exceptional capability | Tránh bất lợi im lặng cho Student |
| P05-BA-017 | Quiz/Assignment completion dùng Grade hay submit | Quiz complete khi final submit/timeout; Assignment complete khi valid turn-in | To-do phản ánh hành động Student, Grade là kết quả sau đó |
| P05-BA-018 | processScore có tính điểm Quiz/Assignment ngay | P05 metric chỉ completion đa activity; weighted score P06 | Không thay công thức reporting ngoài phase |
| P05-BA-019 | Gradebook nằm P05 hay P06 | P05 per-assessment result + optional basic course grid; export/weighting P06 | Giữ Must path gọn |
| P05-BA-020 | Media URL có thể chấp nhận mọi host | Chỉ HTTPS allowlist; video sandbox provider; không server-side fetch tùy ý | Giảm SSRF/tracking/XSS |
| P05-BA-021 | Course activity order giữa nhiều type | P05 adapter trả canonical descriptor; sort `moduleOrder, displayOrder, typeOrder, id` | Stable mà không rewrite Lesson schema |
| P05-BA-022 | Sửa Question sau khi đã có Attempt | Unpublish + new assessment revision; Attempt giữ immutable snapshot | Không làm sai lịch sử score |

## 4. Question Decision Table

| Type | Options | Correct answer | Scoring | Student projection |
| --- | --- | --- | --- | --- |
| `SINGLE_CHOICE` | 2-10 | Chính xác 1 option ID | Full points nếu exact | Options không có `isCorrect` |
| `MULTIPLE_CHOICE` | 2-10 | 1..N option IDs | Full points khi exact set | Options không có `isCorrect` |
| `TRUE_FALSE` | Canonical True/False | Một boolean/option ID | Full points nếu exact | Không lộ correct value |
| `SHORT_ANSWER` | Không | Private rubric/reference text optional | Manual review | Không lộ rubric/reference |

## 5. Completion And Visibility Decisions

| Activity | Active To-do completion | Grade/result visibility |
| --- | --- | --- |
| Lesson | P04 `COMPLETED` | N/A |
| Quiz | Attempt `SUBMITTED/TIMED_OUT/NEEDS_REVIEW/GRADED` hợp lệ | Theo result release policy |
| Assignment | Current Submission `SUBMITTED/LATE/GRADED/RETURNED` | Chỉ Grade `RETURNED` |

`NEEDS_REVIEW` được coi đã thực hiện để không giữ Quiz trong active To-do, nhưng Course result có thể ghi `resultPending=true`.

## 6. Priority Clarification

| Capability | Priority P05 | Ghi chú |
| --- | --- | --- |
| Objective Quiz | Must | End-to-end |
| Short-answer manual review | Must | Không để state treo |
| Assignment text submission | Must | End-to-end |
| Grade/return/own result | Must | End-to-end |
| LINK/MARK_DONE | Conditional Should | Bật theo policy |
| URL Question media | Conditional Should | Host allowlist |
| FILE/upload media | Deferred | P07 |
| Private comments | Conditional Should | Grade feedback đã đủ Must |
| Basic Gradebook | Conditional Should | Export P06 |

## 7. Open Questions

Không còn alternative kỹ thuật chưa có baseline đề xuất. Sáu refinement/boundary sau vẫn cần Product Owner xác nhận tại Gate A trước khi được phép code:

1. Chấp thuận Multiple Choice dùng exact-set, không partial credit trong MVP.
2. Chấp thuận `HIGHEST` làm score policy duy nhất trong MVP.
3. Chấp thuận FILE/upload defer P07 dù BA gốc đánh dấu file submission Must.
4. Chấp thuận Gradebook grid là Conditional và export thuộc P06.
5. Chấp thuận Teacher chỉ được extend deadline exception trong daily flow.
6. Chấp thuận progress P05 chỉ dùng required activity completion, chưa weighted grade.

Nếu bất kỳ mục nào bị từ chối, phải cập nhật scope, technical decision, API/data, AC, WBS và risk trước khi `READY_TO_CODE`.

## 8. Integrity Rule

- Không đổi BA source để che giấu defer; ghi disposition tại phase traceability.
- Không đánh dấu FR-038/FILE part của FR-043 hoàn thành khi chỉ có URL metadata.
- Không dùng planned endpoint/model làm implementation evidence.
- Không đổi `READY_FOR_REVIEW` thành `READY_TO_CODE` trước Gate A merge.
