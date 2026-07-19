# Teacher Invitation And Classroom Join Rules

## Mục Đích

Tài liệu này đặc tả hai workflow dễ có lỗi bảo mật và dữ liệu: Admin mời Teacher bằng manual invitation link, và Student tham gia Classroom bằng Class Code hoặc Invite Link. Cả hai workflow đều dựa trên token/code có hạn, nhưng mục đích, role và data state khác nhau.

## Teacher Invitation Rules

### Business Decision Cốt Lõi

Admin không tạo hoặc biết password Teacher. Hệ thống tạo invitation URL an toàn, Admin **copy link** và tự gửi thủ công qua email, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp. MVP không gửi email tự động và không yêu cầu Gmail/SMTP integration.

| Rule ID | Detail |
| --- | --- |
| BR-010 | Admin không tạo/xem password Teacher. Teacher tự tạo password trong acceptance flow. |
| BR-011, BR-014A, BR-014C | Delivery method là `MANUAL_COPY`; hệ thống không xác nhận external message delivery/read. |
| BR-012, BR-014B | Token one-time, expires, bind email invited. |
| BR-013, BR-014 | Valid acceptance activates `TEACHER`, password hash only, no email password. |
| BR-042 đến BR-049 | Normalize email, pending uniqueness, token hash, atomic accept, revoke/expiry, safe errors. |

### Invitation State Machine

```text
Admin creates invitation
  -> PENDING
      -> ACCEPTED  (valid token + matching email + valid password, one-time)
      -> REVOKED   (authorized Admin revoke before acceptance)
      -> EXPIRED   (expiresAt passed when evaluated)

ACCEPTED, REVOKED and EXPIRED are terminal states in MVP.
```

| State | Allowed actions | Denied actions |
| --- | --- | --- |
| `PENDING` and unexpired | Admin view/copy/revoke; invited Teacher validate/accept | Reuse after successful accept; accept with mismatched email. |
| `PENDING` but expired | Admin may inspect history/create replacement after old status is expired/revoked | Accept/copy as active invitation. |
| `ACCEPTED` | Audit/view history | Accept again, revoke as pending, issue new Teacher account from same token. |
| `REVOKED` | Audit/view history | Accept/re-activate/reuse link. |
| `EXPIRED` | Audit/view history/create new invitation | Accept/re-activate old link. |

### Create And Copy Rules

1. Authorized Admin enters normalized Teacher email and optional safe metadata allowed by policy.
2. Backend checks email format, Actor permission, existing `ACTIVE` Teacher, and existing unexpired `PENDING` invitation.
3. Backend generates cryptographically strong raw token once, stores only `tokenHash`, `expiresAt`, state `PENDING`, intended email and actor/time.
4. Backend returns invitation URL only in the authorized Admin create response. Clipboard copy uses that one-time client state; copy-event/list/detail APIs never reconstruct or return the raw link.
5. Admin selects external channel and sends link manually. System stores no claim that a message was delivered.
6. Create/copy/revoke/accept actions produce required AuditLog without raw URL/token/password.

### Accept Rules

| Check order | Condition | Failure behavior |
| --- | --- | --- |
| 1 | Token parses and token hash matches a record. | Generic invalid invitation response; do not expose raw token/state details. |
| 2 | Invitation state is `PENDING` and current time <= `expiresAt`. | Reject as invalid/expired/revoked/used safely. |
| 3 | Submitted email normalized exactly matches invited email. | `INVITATION_EMAIL_MISMATCH`; do not activate account. |
| 4 | Password/confirmation meets policy. | Validation error; invitation remains `PENDING`. |
| 5 | No conflicting active account/identity policy violation. | Conflict error; invitation remains consistent for authorized resolution. |
| 6 | Atomic commit creates/activates User `TEACHER`, hashes password, marks invitation `ACCEPTED`. | On any failure, no half-active Teacher/no consumed token. |

`expiresAt` equality uses documented server time. Client time, link text or external message timestamp never controls invitation validity.

## Classroom Join Rules

### Join Preconditions

| Rule | Required condition |
| --- | --- |
| Actor | Authenticated `STUDENT` account with status `ACTIVE` (BR-001, BR-050). |
| Classroom | Exists, `ACTIVE`, not `ARCHIVED`/`LOCKED`, and Student can be enrolled by policy. |
| System policy | Corresponding method globally enabled (BR-017 to BR-019). |
| Classroom policy | Method enabled for that specific Classroom. |
| Credential | Class Code hoặc Invite Link token phải map đúng Classroom, đang active, chưa hết hạn nếu có expiry và đúng method. |
| Enrollment | No existing active Enrollment for same Student/Classroom. |

### Join Policy Precedence

```text
Global join policy enabled?
  -> Classroom join setting enabled?
      -> Classroom ACTIVE/unlocked?
          -> Code/link token valid and method match?
              -> Student ACTIVE and not already enrolled?
                  -> Create Enrollment ACTIVE
```

Global disable always wins. A Teacher cannot turn on Class Code/Invite Link locally when Admin has disabled that method at system policy level.

### Join Method Rules

| Method | Credential rule | Additional rule | Success record |
| --- | --- | --- | --- |
| Class Code | Code matches active code policy for a Classroom; input normalized per code format. | Code reset/disable invalidates old value. | `joinedBy=CLASS_CODE`. |
| Invite Link | Token hash maps to active Classroom invite link; expiry/revoke respected. | Link may be reusable only if Classroom link policy permits; it is not Teacher invitation token. | `joinedBy=INVITE_LINK`. |

Teacher Invitation token is never accepted as a Student Classroom join token, and Classroom link token never activates a Teacher account.

### Enrollment Result Rules

- Create one `Enrollment` with `status=ACTIVE`, `studentId`, `classroomId`, `joinedAt`, `joinedBy` and safe source reference if needed for audit.
- Enforce unique active enrollment at service and database/index level; a double request/retry must not create two records.
- Only after Enrollment commit succeeds may system provision Classroom visibility, To-do/read model context or notification.
- Failed join leaves no partial Enrollment, To-do, CourseProgressSummary or analytics state.
- Successful join records AuditLog/business event with join method but never raw Class Code/token payload.

### Removed/Rejoin Rule

Default MVP policy: Student có Enrollment lịch sử `REMOVED` hoặc `LEFT` không thể tự khôi phục quyền chỉ bằng việc dùng lại code/link. Teacher/Admin có thể mở lại quyền rejoin theo policy được audit; sau đó chính Student vẫn phải join bằng Class Code hoặc Invite Link hợp lệ. Không có phương thức Admin import/direct enrollment trong workflow join thường ngày.

## Join/Invitation Error Handling

| Scenario | Expected result |
| --- | --- |
| Guest opens Classroom link | May view safe join entry; must authenticate as valid Student before enrollment. |
| Method globally disabled | `JOIN_METHOD_DISABLED`; no credential validity detail beyond safe message. |
| Classroom archive/lock | `CLASSROOM_NOT_JOINABLE`; no enrollment. |
| Duplicate active enrollment | `DUPLICATE_ENROLLMENT` or idempotent response according API contract; never create duplicate. |
| Invalid/expired/revoked token | Safe generic error; no token content/state enumeration. |
| Invitation email mismatch | Acceptance denied; no account activation. |
| Invitation already accepted | Reuse denied; Teacher logs in with activated account/uses account recovery flow. |

## QA Evidence

- Test each valid and invalid invitation state, exact email matching, one-time use, duplicate pending invitation, raw-token non-persistence and atomic failure.
- Test cả Class Code và Invite Link dưới các tổ hợp global/Classroom policy, Classroom active/archive/lock, expired token/code reset và duplicate Enrollment.
- Test Student A cannot use another Student history/link state to access Classroom; Teacher/Admin cannot use Student join route as role bypass.
- Verify AuditLog records safe metadata and no raw link/token/password payload.

## Liên Kết

- Process: `../06-business-processes/teacher-invitation-process.md`, `../06-business-processes/classroom-join-process.md`.
- Token data: `../10-data-requirements/invitation-token-data-model.md`.
- API: `../11-api-requirements/teacher-invitation-api.md`.
- Security: `../14-solution-architecture/security-architecture.md`.
