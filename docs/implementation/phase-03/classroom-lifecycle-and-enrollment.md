# Phase 03 Classroom Lifecycle And Enrollment

## 1. Mục Đích

Tài liệu này là domain contract cho Classroom, join credential và Enrollment. Service, UI, OpenAPI và test phải dùng cùng state/transition; không tự diễn giải khác nhau theo từng layer.

## 2. Classroom State

### 2.1 Classroom Status

| Status     | Ý nghĩa                        | Teacher                             | Student đã enroll                  | Join mới                      |
| ---------- | ------------------------------ | ----------------------------------- | ---------------------------------- | ----------------------------- |
| `ACTIVE`   | Classroom vận hành bình thường | Quản lý theo quyền                  | Xem overview; Phase 04 cấp content | Theo enrollment status/policy |
| `LOCKED`   | Governance/security lock       | Chỉ action được phép; không mở join | Metadata/history theo policy       | Không                         |
| `ARCHIVED` | Đã lưu trữ, read-only          | Xem history; không mutation thường  | Metadata/history theo policy       | Không                         |

### 2.2 Enrollment Status Của Classroom

| Status   | Ý nghĩa                                                            |
| -------- | ------------------------------------------------------------------ |
| `OPEN`   | Join có thể thực hiện nếu global/local method và credential hợp lệ |
| `CLOSED` | Teacher chủ động đóng enrollment; Student cũ giữ membership        |
| `LOCKED` | Admin/security khóa; Teacher không tự mở nếu không có permission   |

### 2.3 Transition Matrix

| From          | To            | Actor             | Điều kiện                                      | Scope              |
| ------------- | ------------- | ----------------- | ---------------------------------------------- | ------------------ |
| `ACTIVE`      | `ARCHIVED`    | Owner Teacher     | Reason, CAS, audit, không hard delete          | Must               |
| `ACTIVE`      | `LOCKED`      | Admin/Super Admin | Permission + reason + audit                    | Conditional Should |
| `LOCKED`      | `ACTIVE`      | Admin/Super Admin | Permission + reason + audit                    | Conditional Should |
| `LOCKED`      | `ARCHIVED`    | Admin/Super Admin | Explicit governance permission + reason/audit | Conditional Should |
| `ARCHIVED`    | `ACTIVE`      | Deferred          | Change Control                                 | Ngoài Must         |
| `OPEN`        | `CLOSED`      | Owner Teacher     | Classroom ACTIVE + CAS + audit                 | Must               |
| `CLOSED`      | `OPEN`        | Owner Teacher     | Classroom ACTIVE + CAS + audit                 | Must               |
| `OPEN/CLOSED` | `LOCKED`      | Admin             | Permission + reason + audit                    | Conditional Should |
| `LOCKED`      | `OPEN/CLOSED` | Admin             | Permission + reason + audit                    | Conditional Should |

Must vẫn phải hiểu `LOCKED` là terminal gate cho join để tương thích dữ liệu/governance, nhưng không triển khai mutation lock/unlock cho đến khi Conditional Should được phê duyệt.

## 3. Classroom Creation

### Preconditions

- Actor role `TEACHER`, status `ACTIVE`, permission `classroom.create`.
- `name` 2-120 ký tự; payload strict allowlist.
- Enrollment Policy singleton đọc được; missing policy phải fail-fast hoặc bootstrap default an toàn.

### Atomic Result

1. Classroom `ACTIVE`, `enrollmentStatus=OPEN`, owner là actor.
2. Join settings mặc định không thể vượt global policy.
3. Nếu Class Code globally enabled, tạo một code ACTIVE và trả raw code một lần.
4. Append `CLASSROOM_CREATED` AuditLog.
5. Nếu bất kỳ bước nào fail, không còn Classroom/code/audit partial.

Invite Link không tự tạo; Teacher tạo khi cần để tránh raw link bị bỏ qua trong response create.

## 4. Join Policy Precedence

```text
Authenticated STUDENT ACTIVE?
  -> Global method enabled?
    -> Classroom ACTIVE?
      -> enrollmentStatus OPEN?
        -> Classroom method enabled?
          -> Credential active, unexpired, correct Classroom/method?
            -> Enrollment state allows join?
              -> create/return ACTIVE Enrollment
```

| Failure point                  | Error                         | Side effect |
| ------------------------------ | ----------------------------- | ----------- |
| Guest/missing session          | `AUTHENTICATION_REQUIRED`     | None        |
| Wrong role                     | `ACCESS_DENIED`               | None        |
| Student non-ACTIVE             | `ACCOUNT_NOT_ACTIVE`          | None        |
| Global method off              | `JOIN_METHOD_DISABLED`        | None        |
| Classroom LOCKED/ARCHIVED      | `CLASSROOM_NOT_JOINABLE`      | None        |
| Enrollment CLOSED/LOCKED       | `ENROLLMENT_CLOSED`           | None        |
| Local method off               | `JOIN_METHOD_DISABLED`        | None        |
| Invalid/old/expired credential | Generic method-specific error | None        |
| Removed/blocked membership     | `REJOIN_NOT_ALLOWED`          | None        |

Frontend message có thể thân thiện hơn nhưng không được đổi decision hoặc tiết lộ raw/internal state không cần thiết.

## 5. Class Code Lifecycle

### Generate

- CSPRNG chọn 8 ký tự từ `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Display `ABCD-EFGH`; normalize thành `ABCDEFGH`.
- Compute `HMAC-SHA256(CLASSROOM_CODE_PEPPER, normalizedCode)`.
- Retry bounded khi unique collision; quá ngưỡng trả controlled internal error.
- Store `codeDigest`, `maskedCode=****-EFGH`, không store raw.

### Regenerate

Trong một transaction:

1. Verify owner, policy, Classroom state và `expectedUpdatedAt` nếu dùng.
2. Conditional update code ACTIVE cũ thành `REGENERATED`.
3. Insert code ACTIVE mới.
4. Append `CLASS_CODE_REGENERATED` với old/new record IDs, không digest/raw.
5. Return raw code mới một lần.

Sau commit, code cũ phải fail. Concurrent regenerate chỉ một request thắng; request stale trả `409 CONCURRENT_MODIFICATION`.

### Disable

Transition ACTIVE -> DISABLED, reason optional/required theo UI policy; idempotent disable có thể trả current metadata mà không audit trùng.

## 6. Invite Link Lifecycle

### Create/Regenerate

- Generate 32 random bytes, encode base64url.
- Hash SHA-256; store hash unique, never raw.
- Default `expiresAt=now+30d`; request allowlist `expiresInDays=1..90`.
- User-facing URL `${PUBLIC_WEB_URL}/join/invite#token=${rawToken}` trả một lần; URL fragment không được gửi tới web server/proxy.
- Regenerate terminalizes active record và tạo record mới trong transaction.

### Preview

- Public, rate-limited POST body `{ token }`.
- Hash lookup, validate status/expiry/Classroom/global+local policy.
- Return only `classroomName`, `subject`, safe Teacher summary, `joinable`, `expiresAt`.
- `Cache-Control: no-store`; no member count, roster, content, internal IDs beyond opaque Classroom ID nếu cần cho navigation.
- Invalid/disabled/expired dùng safe error, không trả token/hash.

### Browser Handling

1. Route `/join/invite` đọc `token` từ `location.hash` một lần.
2. Immediately `history.replaceState` bỏ fragment khỏi address bar.
3. Token giữ trong memory join context; sessionStorage chỉ dùng nếu decision được Security chấp thuận và phải xóa sau success/cancel/expiry.
4. Sau Login/Register, preview và join được validate lại.

## 7. Enrollment State

| Current   | Action                        | Result                                  |
| --------- | ----------------------------- | --------------------------------------- |
| None      | Valid join                    | Create `ACTIVE`                         |
| `ACTIVE`  | Retry same/other valid method | Return existing, `alreadyEnrolled=true` |
| `REMOVED` | Join                          | `REJOIN_NOT_ALLOWED` trong Must         |
| `LEFT`    | Join                          | `REJOIN_NOT_ALLOWED` trong Must         |
| `BLOCKED` | Join                          | `REJOIN_NOT_ALLOWED`                    |

Enrollment natural identity là cặp Classroom/Student. Không tạo bản ghi thứ hai cho rejoin; future approved flow cập nhật same record và audit status history.

## 8. Join Transaction

Transaction phải:

1. Re-read Student/Policy/Classroom/Credential trong transaction hoặc dùng validated conditional reads.
2. Kiểm state theo đúng precedence.
3. Kiểm existing Enrollment.
4. Insert Enrollment ACTIVE nếu chưa có.
5. Append safe `CLASSROOM_JOINED` AuditLog/event.
6. Commit trước khi trả success.

Concurrent requests:

- Unique pair đảm bảo tối đa một record.
- Duplicate-key loser đọc Enrollment đã commit và trả idempotent success nếu ACTIVE.
- Không retry vô hạn; transaction retry chỉ cho transient labels, bounded count.
- Không tạo To-do/Progress ở P03.

## 9. Roster And Removal

### Roster Query

- Resolve owner Classroom trước.
- Filter status allowlist; default `ACTIVE`.
- Prefix search trên normalized Student name/email/studentCode theo safe strategy.
- Pagination default 20, max 100, stable sort + `_id`.
- Projection: Student id/fullName/email/studentCode/status account + Enrollment status/joinedBy/joinedAt.

### Remove

Preconditions: owner Teacher ACTIVE, Classroom not archived, Enrollment ACTIVE, reason 3-500 chars.

Transaction:

1. Conditional update Enrollment ACTIVE -> REMOVED.
2. Set `removedAt`, `removedBy`, `removalReason`.
3. Append `CLASSROOM_STUDENT_REMOVED` AuditLog.
4. Commit; subsequent Classroom access denied.

Retry stale/non-ACTIVE trả state-specific conflict, không audit lại.

## 10. Archive And Historical Access

- Archive không xóa credential/enrollment; active credentials không join được do Classroom state gate.
- Phase 03 Student có thể thấy archived Classroom summary nếu Enrollment ACTIVE, với read-only badge; không có learning content để claim.
- Phase 04 quy định content/history access chi tiết.
- Owner Teacher xem history theo permission; Admin Must chỉ xem governance metadata/audit projection. Admin archive/lock mutation chỉ tồn tại khi Conditional Should được phê duyệt.

## 11. Offboarding Integration

`ClassroomOwnershipReader.countActiveOwnedClassrooms(teacherId)` được Phase 02 Admin User status service gọi trước block/deactivate Teacher.

- Count > 0: trả `409 TEACHER_HAS_ACTIVE_CLASSROOM` và safe count; không mutate User/session.
- Count = 0: P02 status flow tiếp tục.
- Nếu ownership transfer Should được implement, target phải TEACHER/ACTIVE và transaction cập nhật owner + audit.
- Emergency override không thuộc Must nếu chưa có permission/reason/audit policy được chấp thuận.
