# Teacher Invitation And Admin Users Implementation

## 1. Mục tiêu

Tài liệu này đặc tả hai capability dễ sai nghiệp vụ nhất của P02: Admin quản lý User theo danh sách role riêng và Admin mời Teacher bằng link thủ công.

## 2. Admin User Management Entry

`/admin/users` chỉ là trang điều hướng/summary nhẹ:

- Student List.
- Teacher List.
- Admin List.
- Advanced Search nếu Should được kéo vào.

Không gọi API tải mọi User rồi lọc ở client. Mỗi list dùng endpoint/permission/projection riêng.

## 3. Role-Specific List Contract

| List | Server fixed scope | Field chính P02 | Action P02 |
| --- | --- | --- | --- |
| Student | `role=STUDENT` | name, email, studentCode, status, lastActive, createdAt | view, block/unblock, deactivate/restore |
| Teacher | `role=TEACHER` | name, email, department, status, lastActive, activation source | view, block/unblock, invitation entry |
| Admin | `role in ADMIN/SUPER_ADMIN` | name, email, role, status, lastActive | view; sensitive role/status only Super Admin |

`classroomCount` và `courseCount` chưa có source trước P03/P04. API không được tạo số giả; field có thể omitted/null kèm capability version, sau đó bổ sung non-breaking khi domain tồn tại.

## 4. List Query Behavior

- `page` default 1, `limit` default 20, max 100.
- Stable sort thêm `_id` tie-break.
- Keyword trim, bounded length, escape regex/operator.
- Filter status chỉ enum hợp lệ.
- Role query do route/service quyết định, không nhận tùy ý từ client ở role-specific endpoint.
- Projection loại passwordHash, token/session, internal security metadata.

## 5. Status Transition

| From | Allowed To | Reason | Session effect |
| --- | --- | --- | --- |
| ACTIVE | BLOCKED | Required | Revoke all active families |
| BLOCKED | ACTIVE | Required | Không restore permission khác |
| ACTIVE | INACTIVE | Required | Revoke all active families |
| INACTIVE | ACTIVE | Required | User login lại |
| Any non-DELETED | DELETED | Out of normal P02 UI; restricted | Revoke; preserve history |

P02 chưa có Classroom nên ownership guard là extension point. P03 phải nối check trước khi Teacher block/offboarding được coi là hoàn chỉnh toàn nghiệp vụ.

## 6. Role Transition

- Public registration luôn Student; Teacher activation luôn qua invitation.
- Admin thường không được đổi primary role trong baseline an toàn; chỉ Super Admin có `role.assign_limited`.
- Allowed transitions P02: `STUDENT -> ADMIN`, `TEACHER -> ADMIN`, `ADMIN -> STUDENT|TEACHER|SUPER_ADMIN`, `SUPER_ADMIN -> ADMIN`.
- Không cho direct `STUDENT <-> TEACHER`; Teacher phải đi qua invitation và Student là self-registration identity.
- Mọi transition yêu cầu reason, optimistic `expectedUpdatedAt`, audit và target không `DELETED`.
- Không cho actor đổi role chính mình để nâng quyền.
- Không cho demote/delete/block active Super Admin cuối cùng.
- Mutation liên quan Super Admin serialize qua `system_guards/super-admin-governance` trong transaction.
- Không chuyển Teacher có domain ownership sau khi P03 tồn tại nếu ownership guard chưa pass.

## 7. Invitation Create Flow

```text
Admin opens management
  -> enters Teacher email + expiry
  -> API validates permission/email/conflicts
  -> generates raw token and persists hash/PENDING/MANUAL_COPY
  -> returns one-time invitationLink
  -> UI displays warning + Copy action
  -> Admin sends manually through external channel
```

Hệ thống không biết hoặc tuyên bố email/Zalo/Facebook message đã gửi/đọc.

## 8. Invitation Create Rules

- Email normalize trước conflict query.
- Existing active Teacher: `TEACHER_ALREADY_ACTIVE`.
- Existing unexpired PENDING invitation: `INVITATION_ALREADY_PENDING`; UI cho phép mở metadata/revoke.
- Stale pending được mark EXPIRED trước khi tạo replacement.
- Unique partial index trên normalized email khi `status=PENDING` là lớp bảo vệ cuối; concurrent create chỉ một request thành công.
- `expiresInDays` default 7, allowlist 1-30 (có thể config).
- Raw token ít nhất 256-bit random; hash unique.
- Audit create ghi actor, invitationId, target email an toàn, expiry; no link/token/hash.

## 9. Copy And Lost-Link Behavior

Raw link chỉ tồn tại trong response/component state. Sau copy:

- UI toast `Đã copy link mời`.
- Sau Clipboard API success, UI bắt buộc gọi idempotent `copy-events` với UUID `eventId`; transaction ghi safe copy metadata + một AuditLog và không gửi external message.
- Nếu clipboard đã thành công nhưng audit call lỗi, UI nói rõ link đã copy và cho retry audit bằng cùng `eventId`; không tạo token/link mới.
- Refresh page chỉ còn invitation metadata; không có link.
- Nếu Admin chưa lưu/gửi link, action hợp lệ là revoke invitation và tạo invitation mới.

Đây là khác biệt có chủ ý so với UI giả định có thể “copy lại” link từ database.

## 10. Preview And Accept Flow

1. Teacher mở `/teacher/invite?token=...`.
2. Web xóa token khỏi address bar rồi POST token trong body tới preview; API hash token và trả metadata tối thiểu.
3. Teacher nhập fullName, email, password, confirm.
4. API kiểm token state/expiry rồi normalized email match.
5. Transaction tạo User `TEACHER/ACTIVE/TEACHER_INVITATION`, consume invitation, append audit.
6. Success chuyển Login; Teacher tự login.

Server time là nguồn expiry. Client không được tự quyết định token hợp lệ từ countdown.

## 11. Invitation State Matrix

| Current | Action | Result |
| --- | --- | --- |
| PENDING/unexpired | Preview | Safe metadata |
| PENDING/unexpired | Accept valid | ACCEPTED + Teacher ACTIVE |
| PENDING/unexpired | Revoke | REVOKED + audit |
| PENDING/expired | Any accept | EXPIRED, no User |
| ACCEPTED | Accept again | Conflict, no duplicate |
| REVOKED | Preview/accept | Safe invalid/revoked result |
| EXPIRED | Create replacement | New invitation/token; old history retained |

## 12. Audit Events

| Event | Mandatory safe fields |
| --- | --- |
| `TEACHER_INVITATION_CREATED` | actorId, invitationId, expiresAt, requestId |
| `TEACHER_INVITATION_COPIED` | actorId, invitationId, channelHint optional |
| `TEACHER_INVITATION_REVOKED` | actorId, invitationId, reason |
| `TEACHER_INVITATION_ACCEPTED` | teacherId, invitationId, acceptedAt |
| `USER_STATUS_CHANGED` | actorId, targetId, old/new status, reason |
| `USER_ROLE_CHANGED` | actorId, targetId, old/new role, reason |

## 13. End-To-End Demo Script

1. Login bằng synthetic Admin.
2. Mở Student List và xác nhận chỉ Student.
3. Mở Teacher List và xác nhận chưa có Teacher mục tiêu.
4. Tạo invitation, copy one-time link.
5. Mở link ở anonymous browser, kích hoạt Teacher.
6. Login Teacher, vào Teacher role home; Admin thấy Teacher trong Teacher List.
7. Thử lại token cũ và xác nhận bị từ chối.
8. Admin block Teacher; phiên Teacher bị revoke và protected API bị từ chối.
9. Kiểm tra AuditLog safe events và không có raw token/password.
