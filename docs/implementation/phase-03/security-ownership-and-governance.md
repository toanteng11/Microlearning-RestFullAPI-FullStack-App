# Phase 03 Security, Ownership And Governance

## 1. Security Objectives

- Student chỉ join/xem Classroom trong own Enrollment scope.
- Teacher role không đồng nghĩa quyền trên mọi Classroom; owner check bắt buộc.
- Admin governance có permission riêng và projection tối thiểu.
- Code/token không lưu raw, không log, không đi vào AuditLog/analytics/evidence.
- Join credential guessing, retry và concurrent mutation bị kiểm soát.
- Archive/remove/policy/ownership không làm mất history hoặc tạo partial state.

## 2. Permission Catalog Bổ Sung

| Permission                     | Role mặc định              | Scope                               |
| ------------------------------ | -------------------------- | ----------------------------------- |
| `classroom.join`               | Student                    | Current Student only                |
| `classroom.view_enrolled`      | Student                    | ACTIVE own Enrollment               |
| `classroom.create`             | Teacher                    | New owned Classroom                 |
| `classroom.view_owned`         | Teacher                    | Owned Classroom                     |
| `classroom.update_owned`       | Teacher                    | Owned, non-archived                 |
| `classroom.archive_owned`      | Teacher                    | Owned ACTIVE Classroom              |
| `classroom.manage_join`        | Teacher                    | Owned credential/settings           |
| `classroom.view_roster`        | Teacher                    | Owned Classroom                     |
| `classroom.remove_student`     | Teacher                    | Owned Classroom + ACTIVE Enrollment |
| `enrollment_policy.view`       | Admin/Super Admin          | System singleton                    |
| `enrollment_policy.update`     | Admin/Super Admin          | CAS + audit                         |
| `classroom.governance.view`    | Admin/Super Admin          | All Classroom safe projection       |
| `classroom.governance.lock`    | Super Admin/approved Admin | Conditional Should                  |
| `classroom.ownership.transfer` | Super Admin/approved Admin | Conditional Should                  |

Permission catalog vẫn server-owned và sort ổn định trong `/users/me`; client không gửi capability.

## 3. Authorization Matrix

| Action                | Guest          | Student   | Teacher | Admin                              | Super Admin            |
| --------------------- | -------------- | --------- | ------- | ---------------------------------- | ---------------------- |
| Invite preview        | Limited public | Limited   | Limited | Limited                            | Limited                |
| Join by Code/Link     | No             | Own actor | No      | No                                 | No                     |
| List Classroom        | No             | Enrolled  | Owned   | Governance route                   | Governance route       |
| Classroom detail      | No             | Enrolled  | Owned   | Governance permission              | Governance permission  |
| Create/update/archive | No             | No        | Owned   | No default; separate Should only    | Separate Should only   |
| Credential/settings   | No             | No        | Owned   | No default                         | Governance if explicit |
| Roster list/remove    | No             | No        | Owned   | Governance read/action if explicit | Yes if permission      |
| Enrollment Policy     | No             | No        | No      | Permission                         | Yes                    |

## 4. Object-Level Checks

### Teacher

```text
authenticated.role == TEACHER
AND authenticated.status == ACTIVE
AND classroom.ownerTeacherId == authenticated.userId
AND classroom state allows requested action
```

Không dùng `teacherId` query/body. Unknown và non-owned resource có thể cùng trả `404 RESOURCE_NOT_FOUND` để giảm enumeration; audit/security log nội bộ vẫn phân biệt.

### Student

```text
authenticated.role == STUDENT
AND authenticated.status == ACTIVE
AND enrollment.studentId == authenticated.userId
AND enrollment.classroomId == targetClassroomId
AND enrollment.status == ACTIVE
```

Join là ngoại lệ trước khi Enrollment tồn tại nhưng vẫn buộc actor Student/ACTIVE và credential/policy hợp lệ.

### Admin

Admin route bắt buộc namespace `/admin`, permission cụ thể và safe projection. Must chỉ cung cấp governance list/detail; ownership transfer, lock hoặc archive action không được suy ra từ quyền read. Không cho Admin gọi Teacher route rồi bypass owner bằng role check tùy tiện.

## 5. Threat And Control Matrix

| Threat                               | Control                                                             | Verification                       |
| ------------------------------------ | ------------------------------------------------------------------- | ---------------------------------- |
| Guess Class Code                     | 40-bit alphabet, HMAC pepper, IP+identity rate limit, generic error | Burst/rate/security tests          |
| DB leak lộ Code/Link                 | HMAC/SHA hash-only, no raw field                                    | Repository/integration assertions  |
| Token trong access log               | Fragment link + POST preview body + immediate URL cleanup           | Runtime log scan/E2E URL assertion |
| Teacher sửa lớp khác                 | owner repository predicate + negative API test                      | Direct API matrix                  |
| Student xem roster/lớp khác          | permission + Enrollment lookup                                      | 403/404 projection tests           |
| Duplicate join                       | unique pair, transaction, idempotent conflict resolution            | 20 concurrent joins                |
| Join sau policy disable/archive race | transaction revalidation/conditional state checks                   | Concurrency test                   |
| Remove làm mất learning history      | soft Enrollment state, no cascade delete                            | Data integrity test                |
| Stale settings overwrite             | expectedUpdatedAt/revision CAS                                      | Concurrent update test             |
| NoSQL injection/search abuse         | strict Zod schema, escaped prefix, sort/filter allowlist            | Negative validation tests          |
| Public preview enumeration           | rate limit, minimal projection, generic invalid response            | Security API test                  |
| Audit chứa credential/PII rộng       | event allowlist and redaction                                       | Audit assertion                    |

## 6. Rate And Abuse Controls

Baseline đề xuất, cấu hình qua environment:

| Endpoint group        | IP limit | Identity/credential limit | Window  |
| --------------------- | -------- | ------------------------- | ------- |
| Invite preview        | 30       | token digest 10           | 15 phút |
| Join by Code          | 20       | Student 10                | 15 phút |
| Join by Token         | 20       | Student 10                | 15 phút |
| Credential regenerate | 20       | Teacher 10/Classroom      | 15 phút |

- Không log raw credential trong limiter key; dùng digest.
- Process-local limiter được chấp nhận khi API một replica; P07 phải chuyển shared store trước horizontal scale.
- 429 response chung, không nói Code/Token/Classroom nào tồn tại.

## 7. Credential Handling

- `CLASSROOM_CODE_PEPPER` riêng JWT/invitation secrets, minimum 32 bytes, fail-fast Production.
- Constant-time digest compare khi phù hợp; lookup unique digest không tự đủ chống timing enumeration nên vẫn rate limit/generic response.
- Raw value chỉ sống trong request memory/one-time response; không đưa vào exception details.
- OpenAPI examples dùng placeholder, không dùng fixture credential đang hoạt động.
- Clipboard success không gửi raw link về API. Nếu track copy, chỉ gửi credential record ID + idempotency event ID.

## 8. Audit Event Catalog

| Action                                     | Resource      | Required fields                       | Forbidden fields                         |
| ------------------------------------------ | ------------- | ------------------------------------- | ---------------------------------------- |
| `CLASSROOM_CREATED`                        | Classroom     | actor, resourceId, safe initial state | code/token                               |
| `CLASSROOM_UPDATED`                        | Classroom     | allowlisted old/new, requestId        | description nếu policy coi nhạy cảm rộng |
| `CLASSROOM_ARCHIVED`                       | Classroom     | reason, old/new status                | roster                                   |
| `CLASS_CODE_REGENERATED/DISABLED`          | ClassCode     | Classroom ID, old/new record ID       | raw/digest                               |
| `INVITE_LINK_CREATED/REGENERATED/DISABLED` | InviteLink    | Classroom ID, record ID, expiry       | raw/hash/full URL                        |
| `CLASSROOM_JOINED`                         | Enrollment    | Student ID, Classroom ID, joinedBy    | code/token                               |
| `CLASSROOM_STUDENT_REMOVED`                | Enrollment    | reason, Student/Classroom ID          | unrelated Student data                   |
| `ENROLLMENT_POLICY_UPDATED`                | SystemSetting | old/new booleans/revision, reason     | secret/env                               |
| `CLASSROOM_OWNERSHIP_TRANSFERRED`          | Classroom     | old/new owner, reason                 | credentials                              |

Audit append phải nằm trong transaction của mutation quan trọng.

## 9. Logging And Error Safety

Logger redaction bổ sung:

- Request body keys: `code`, `classCode`, `token`, `inviteToken`, `invitationToken`.
- Header/query/path URL đã normalize; Invite token chỉ đến client trong fragment và phải bị xóa trước API.
- Mongoose duplicate error map sang domain code, không trả index/raw value.
- Production response không stack/collection/filter dump.
- Request ID xuất hiện trong response error và structured log để trace.

## 10. Privacy Projection

| Context                | Allowed                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| Public invite preview  | Classroom name, subject, Teacher fullName, joinable/expiry                |
| Student Classroom list | Classroom summary, owner safe summary, own Enrollment metadata            |
| Teacher roster         | Student id/fullName/email/studentCode/account status, membership metadata |
| Admin governance       | Classroom/owner/status, required ACTIVE `memberCount`, timestamps; no credential/roster/content count |
| Credential metadata    | id/status/expiry/masked suffix/timestamps; no digest/raw                  |

## 11. Security Exit Gate

- Wrong role/owner/enrollment direct API tests Pass.
- Hash-only/raw-log assertions Pass.
- Join concurrency and policy/archive race tests Pass.
- Rate-limit negative tests Pass.
- No Critical/High security issue open.
- Secret scan và dependency audit xanh trên remote CI.
