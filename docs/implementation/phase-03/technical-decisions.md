# Phase 03 Technical Decisions

## 1. Quy Ước

- Status: `Proposed`, `Accepted`, `Superseded`, `Rejected`.
- Decision thay đổi BA behavior/API/data cần BA/Product Owner và Technical Lead review.
- `Accepted` là baseline code; thay đổi sau đó phải có ADR/change impact.

## 2. Decision Register

| ID          | Decision                                                                                                        | Baseline                                             | Status   |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| P03-ADR-001 | Classroom là aggregate root; Enrollment/credential là module riêng tham chiếu Classroom                         | Modular Monolith, service boundary rõ                | Accepted |
| P03-ADR-002 | Classroom status `ACTIVE/LOCKED/ARCHIVED`; enrollment status `OPEN/CLOSED/LOCKED`                               | Tách lifecycle lớp và quyền join                     | Accepted |
| P03-ADR-003 | Update nhạy cảm nhận `expectedUpdatedAt`; stale update trả `409 CONCURRENT_MODIFICATION`                        | Không silent overwrite                               | Accepted |
| P03-ADR-004 | Class Code 8 ký tự alphabet không mơ hồ; normalize bỏ `-`/space, uppercase                                      | UX dễ nhập, entropy khoảng 40 bit                    | Accepted |
| P03-ADR-005 | Class Code lưu HMAC-SHA256 digest bằng pepper riêng; raw trả một lần                                            | Không lưu raw short credential                       | Accepted |
| P03-ADR-006 | Invite token random 32 bytes, SHA-256 hash, mặc định hết hạn 30 ngày                                            | Hash-only, configurable 1-90 ngày                    | Accepted |
| P03-ADR-007 | API preview dùng POST body; user-facing link dùng `/join/invite#token=...`, React đọc fragment một lần rồi xóa  | Fragment không được gửi vào web/API/proxy access log | Accepted |
| P03-ADR-008 | Mỗi Classroom chỉ một Class Code ACTIVE và một Invite Link ACTIVE trong Must baseline                           | Lifecycle đơn giản, regenerate thay thế              | Accepted |
| P03-ADR-009 | Enrollment unique toàn cặp `classroomId + studentId`; lifecycle cập nhật cùng record                            | Chống duplicate và giữ membership identity           | Accepted |
| P03-ADR-010 | Duplicate ACTIVE join trả `200`, `alreadyEnrolled=true`, không tạo side effect mới                              | Idempotent retry/double click                        | Accepted |
| P03-ADR-011 | Join validation precedence cố định global -> Classroom -> credential -> actor/enrollment                        | Áp dụng BR-051                                       | Accepted |
| P03-ADR-012 | Join/remove/policy/credential rotation dùng Mongo transaction khi chạm nhiều collection + AuditLog              | Không partial state                                  | Accepted |
| P03-ADR-013 | Roster remove là soft transition `ACTIVE -> REMOVED`, reason bắt buộc                                           | Bảo toàn history                                     | Accepted |
| P03-ADR-014 | Rejoin/leave không thuộc Must; historical removed record không tự active lại                                    | BR-054 là Conditional Should                         | Accepted |
| P03-ADR-015 | `/classrooms` trả role-scoped list; Admin governance dùng namespace `/admin/classrooms`                         | Không có all-Classroom data leak                     | Accepted |
| P03-ADR-016 | Prefix search normalized + allowlisted sort + cursor-stable `_id` tie-breaker; page/limit contract giữ P02      | List ổn định/an toàn                                 | Accepted |
| P03-ADR-017 | Policy singleton lưu trong `system_settings` với key `ENROLLMENT_POLICY` và revision                            | Không hard-code policy trong env                     | Accepted |
| P03-ADR-018 | Phase 02 Teacher status mutation gọi `ClassroomOwnershipReader`; owner active Classroom bị block nếu chưa xử lý | Đáp ứng BR-100                                       | Accepted |

## 3. Classroom Lifecycle

```text
ACTIVE
  -> ARCHIVED  (terminal trong Must baseline; read-only history)
  -> LOCKED    (Conditional Should; no new join)

LOCKED  (recognized by Must, mutations are Conditional Should)
  -> ACTIVE
  -> ARCHIVED
```

- `ARCHIVED -> ACTIVE` không thuộc Must để tránh phục hồi không kiểm soát.
- `enrollmentStatus=CLOSED` do Teacher chủ động dừng join; `LOCKED` dùng governance/security action.
- Classroom archive không bulk-update/xóa Enrollment. Access service luôn kết hợp Classroom + Enrollment state.

## 4. Credential Lifecycle

### Class Code

```text
ACTIVE -> DISABLED
ACTIVE -> REGENERATED -> new ACTIVE record
```

### Invite Link

```text
ACTIVE -> DISABLED
ACTIVE -> REGENERATED -> new ACTIVE record
ACTIVE -> EXPIRED (derived/materialized khi expiresAt < now)
```

Terminal record không được reactivate. Regenerate tạo credential mới; raw value cũ không thể reconstruct.

## 5. Enrollment Lifecycle

```text
none -> ACTIVE
ACTIVE -> REMOVED
ACTIVE -> BLOCKED  (Conditional governance)
ACTIVE -> LEFT     (Deferred)
REMOVED/LEFT -> ACTIVE only through approved rejoin flow (Deferred)
```

Must baseline chỉ implement `none -> ACTIVE` và `ACTIVE -> REMOVED`. Schema giữ enum còn lại để BA compatibility nhưng service phải từ chối transition chưa được scope.

## 6. Join Idempotency

- Existing `ACTIVE` Enrollment được trả như success và không tạo AuditLog join thành công lần hai.
- Concurrent first join dựa vào unique index; loser đọc record đã commit và trả same semantic result.
- Existing `REMOVED/LEFT/BLOCKED` trả `409 REJOIN_NOT_ALLOWED`, không tạo record mới.
- Idempotency-Key không bắt buộc cho join vì pair uniqueness là natural key; có thể thêm sau nếu side effect mở rộng.

## 7. Security Decisions

- Class Code có entropy thấp hơn token nên phải kết hợp HMAC pepper, rate limit và generic failure.
- Invite preview public không trả member count, Student list, private section hoặc content.
- Logger phải redact body fields `code`, `token`, `inviteToken`; Invite fragment không bao giờ được đưa vào analytics/console/error.
- Audit chỉ lưu credential record ID, method và masked suffix nếu thật sự cần; không raw/digest.
- Teacher owner check luôn load Classroom hiện tại; owner ID trong request/JWT không đủ.

## 8. Decision Approval Result

Toàn bộ `P03-ADR-001..018` được Project Owner chấp thuận ngày `2026-07-19` và được ghi nhận trong BA baseline revision `1.42`, cùng `DEC-016/017`, API, data, security, frontend, QA và DevOps plan. Các quyết định đã trở thành code baseline khi PR #5 merge vào `main` tại `1e8ad41`.

Mọi thay đổi tiếp theo phải cập nhật BA, API, UI, OpenAPI, test, risk và change record trong cùng Pull Request; không tự ý thay đổi behavior trong code.
