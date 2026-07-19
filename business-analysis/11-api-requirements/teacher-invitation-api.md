# Teacher Invitation API

## Mục Đích

Tài liệu này mô tả API endpoints cho quy trình **Admin mời Teacher bằng manual invitation link**.

Trong MVP:

- Hệ thống tạo invitation link.
- Admin copy link.
- Admin tự gửi thủ công qua email, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp.
- Hệ thống không bắt buộc gửi email tự động.
- Admin không biết mật khẩu Teacher.

## Data Model Liên Quan

| Entity | Ghi chú |
| --- | --- |
| TeacherInvitation | Lưu email, tokenHash, status, deliveryMethod, expiry |
| User | Tạo/activate Teacher account sau khi accept |
| AuditLog | Ghi create/copy/revoke/accept invitation |

## Endpoints

| Method | Endpoint | Mô tả | Auth | Permission |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/admin/teacher-invitations` | Tạo invitation và trả manual copy link | Admin | `teacher_invitation.create` |
| GET | `/api/v1/admin/teacher-invitations` | Xem danh sách invitation | Admin | `teacher_invitation.view` |
| GET | `/api/v1/admin/teacher-invitations/{invitationId}` | Xem chi tiết invitation | Admin | `teacher_invitation.view` |
| POST | `/api/v1/admin/teacher-invitations/{invitationId}/copy-events` | Ghi nhận copy link nếu tracking | Admin | `teacher_invitation.copy_link` |
| POST | `/api/v1/admin/teacher-invitations/{invitationId}/revoke` | Revoke invitation | Admin | `teacher_invitation.revoke` |
| POST | `/api/v1/teacher/invitations/preview` | Teacher preview invitation; token nằm trong strict body | Public | Token valid + rate limit |
| POST | `/api/v1/teacher/invitations/accept` | Teacher accept và tạo password; token nằm trong strict body | Public | Token valid + rate limit |

## Create Teacher Invitation

### Request

```json
{
  "email": "teacher@example.com",
  "expiresInDays": 7
}
```

### Validation

| Field | Rule |
| --- | --- |
| email | Required, email format, lowercase |
| expiresInDays | Optional, nằm trong giới hạn policy |

### Response

```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "64f000000000000000000701",
      "email": "teacher@example.com",
      "status": "PENDING",
      "deliveryMethod": "MANUAL_COPY",
      "invitationLink": "https://microlearning.app/teacher/invite?token=<opaque-token>",
      "expiresAt": "2026-07-17T00:00:00.000Z",
      "copyCount": 0,
      "lastCopiedAt": null,
      "createdAt": "2026-07-10T00:00:00.000Z",
      "updatedAt": "2026-07-10T00:00:00.000Z"
    }
  }
}
```

`invitationLink` chỉ có trong response `201` này và response phải `Cache-Control: no-store`; list/detail không trả hoặc tái tạo field đó.

## List Teacher Invitations

### Query Parameters

| Query | Mô tả |
| --- | --- |
| status | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| email | Tìm theo email |
| page, limit | Pagination |
| sortBy, sortOrder | Sort |

### Response Item

```json
{
  "id": "64f000000000000000000701",
  "email": "teacher@example.com",
  "status": "PENDING",
  "deliveryMethod": "MANUAL_COPY",
  "expiresAt": "2026-07-17T00:00:00.000Z",
  "copyCount": 1,
  "lastCopiedAt": "2026-07-10T09:30:00.000Z",
  "createdAt": "2026-07-10T00:00:00.000Z"
}
```

## Record Copy Event

### Request

```json
{
  "eventId": "019c5cb4-0b51-7000-8000-000000000002",
  "channelHint": "ZALO"
}
```

`eventId` là UUID bắt buộc để retry idempotent. API này chỉ ghi nhận clipboard success, không nhận hoặc trả raw link.

### Response

```json
{
  "success": true,
  "data": {
    "copyEventId": "64f000000000000000000902",
    "recordedAt": "2026-07-10T09:30:00.000Z"
  }
}
```

## Preview Invitation

### Request

```json
{
  "token": "<opaque-teacher-invitation-token>"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "invitation": {
      "email": "teacher@example.com",
      "status": "PENDING",
      "deliveryMethod": "MANUAL_COPY",
      "expiresAt": "2026-07-17T00:00:00.000Z"
    }
  }
}
```

Không trả:

```text
tokenHash
raw token
invitedBy internal data
```

## Accept Invitation

### Request

```json
{
  "token": "<opaque-teacher-invitation-token>",
  "fullName": "Nguyen Van A",
  "email": "teacher@example.com",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f000000000000000000001",
      "email": "teacher@example.com",
      "fullName": "Nguyen Van A",
      "role": "TEACHER",
      "status": "ACTIVE"
    },
    "nextAction": "LOGIN"
  }
}
```

## Revoke Invitation

### Request

```json
{
  "reason": "Invited wrong email"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "invitation": {
      "id": "64f000000000000000000701",
      "status": "REVOKED",
      "revokedAt": "2026-07-10T10:00:00.000Z"
    },
    "auditId": "64f000000000000000000903"
  }
}
```

## Error Cases

| Error Code | HTTP | Khi nào xảy ra |
| --- | --- | --- |
| EMAIL_INVALID | 422 | Email sai format |
| TEACHER_ALREADY_ACTIVE | 409 | Email đã có Teacher active |
| INVITATION_NOT_FOUND | 404 | Invitation/token không tồn tại |
| INVITATION_EXPIRED | 409 | Token hết hạn |
| INVITATION_REVOKED | 409 | Invitation bị revoke |
| INVITATION_ALREADY_ACCEPTED | 409 | Invitation đã dùng |
| INVITATION_EMAIL_MISMATCH | 422 | Email nhập không khớp |
| PASSWORD_POLICY_FAILED | 422 | Password không đạt policy |
| ACCESS_DENIED | 403 | Admin không có permission |

## Audit Requirements

| Action | Audit |
| --- | --- |
| Create invitation | Must |
| Copy invitation link | Should/Must nếu tracking bật |
| Revoke invitation | Must |
| Accept invitation | Must |
| Expired invitation job | Should |

## Security Notes

- Database chỉ lưu `tokenHash`.
- Raw token chỉ được trả trong one-time create response, sau đó chỉ tồn tại tạm thời trong activation request memory; list/detail không tái tạo được link.
- Không log raw token.
- Accept invitation phải kiểm token, status, expiry và email matching.
- Admin không bao giờ nhập hoặc biết password Teacher.
