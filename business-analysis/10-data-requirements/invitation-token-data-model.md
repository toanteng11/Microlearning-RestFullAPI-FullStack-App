# Invitation Token Data Model

## Mục Đích

Tài liệu này mô tả data model cho quy trình **Admin tạo Teacher invitation link và copy link thủ công**. Trong MVP, hệ thống không bắt buộc gửi email tự động. Admin tạo link, copy link và tự gửi qua email cá nhân, Zalo, Facebook, Messenger, Teams hoặc kênh phù hợp.

## Business Context

Quy trình:

```text
Admin nhập email Teacher
        ↓
System tạo invitation token
        ↓
System lưu tokenHash, không lưu raw token
        ↓
System trả invitation link cho Admin copy
        ↓
Admin tự gửi thủ công bên ngoài hệ thống
        ↓
Teacher mở link và tự tạo mật khẩu
        ↓
System active account role TEACHER
```

## Collection: teacher_invitations

| Field | Type | Required | Mô tả | Ghi chú |
| --- | --- | --- | --- | --- |
| `_id` | ObjectId | Có | ID invitation |  |
| email | String | Có | Email Teacher được mời | Lowercase, dùng để matching khi accept |
| tokenHash | String | Có | Hash của invitation token | Unique, không lưu raw token |
| role | Enum | Có | Role sẽ được gán | Mặc định `TEACHER` |
| status | Enum | Có | Trạng thái | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| deliveryMethod | Enum | Có | Cách gửi | `MANUAL_COPY` |
| invitedBy | ObjectId | Có | Admin tạo invitation | Reference User |
| acceptedBy | ObjectId | Không | Teacher account sau khi accept | Reference User |
| expiresAt | Date | Có | Hết hạn | Ví dụ 7 ngày |
| acceptedAt | Date | Không | Thời điểm accept |  |
| revokedAt | Date | Không | Thời điểm revoke |  |
| revokedBy | ObjectId | Không | Admin revoke | Reference User |
| revokeReason | String | Không | Lý do revoke | Optional |
| lastCopiedAt | Date | Không | Lần copy gần nhất | Optional |
| copyCount | Number | Có | Số lần copy | Default 0 |
| lastCopyChannelHint | Enum | Không | Kênh gửi thủ công gợi ý | `EMAIL_MANUAL`, `ZALO`, `FACEBOOK`, `MESSENGER`, `TEAMS`, `OTHER` |
| createdAt | Date | Có | Thời điểm tạo |  |
| updatedAt | Date | Có | Thời điểm cập nhật |  |

## Token Handling

| Nội dung | Quy tắc |
| --- | --- |
| Raw token | Chỉ xuất hiện trong URL trả về sau khi tạo invitation |
| tokenHash | Lưu trong database để validate |
| Expiry | Invitation hết hạn sau `expiresAt` |
| One-time use | Sau khi accept, status chuyển `ACCEPTED`, token không dùng lại |
| Revoke | Admin có thể revoke nếu status còn `PENDING` |
| Copy link | Copy không tạo token mới, chỉ tăng `copyCount` nếu tracking |

## Invitation Link Format

Ví dụ:

```text
https://microlearning.app/teacher/invite?token=abc123xyz
```

Frontend route:

```text
/teacher/invite?token={rawToken}
```

Backend validation:

```text
hash(rawToken) == teacher_invitations.tokenHash
status == PENDING
expiresAt > now
```

## Activation Data

Teacher nhập:

| Field | Required | Validation |
| --- | --- | --- |
| fullName | Có | 2-100 ký tự |
| email | Có | Phải khớp `TeacherInvitation.email` |
| password | Có | Đạt password policy |
| confirmPassword | Có | Khớp password |

Sau khi accept:

```text
User.role = TEACHER
User.status = ACTIVE
TeacherInvitation.status = ACCEPTED
TeacherInvitation.acceptedBy = user._id
TeacherInvitation.acceptedAt = now
```

## Index Đề Xuất

| Index | Mục đích |
| --- | --- |
| `{ tokenHash: 1 } unique` | Validate token nhanh |
| `{ email: 1, status: 1 }` | Tìm invitation theo email/status |
| `{ invitedBy: 1, createdAt: -1 }` | Admin xem invitation mình tạo |
| `{ status: 1, expiresAt: 1 }` | Job xử lý expired invitations |

## Audit Events

| Event | Khi nào ghi |
| --- | --- |
| `TEACHER_INVITATION_CREATED` | Admin tạo invitation |
| `TEACHER_INVITATION_LINK_COPIED` | Admin copy link nếu tracking |
| `TEACHER_INVITATION_ACCEPTED` | Teacher kích hoạt account |
| `TEACHER_INVITATION_REVOKED` | Admin revoke invitation |
| `TEACHER_INVITATION_EXPIRED` | System job hoặc validate thấy hết hạn |

## Validation Rules

| Rule ID | Rule |
| --- | --- |
| INV-001 | Email invitation phải đúng format. |
| INV-002 | Không tạo invitation mới cho Teacher đã `ACTIVE` nếu không có policy đặc biệt. |
| INV-003 | Teacher accept phải nhập email khớp invitation. |
| INV-004 | Invitation `REVOKED`, `EXPIRED`, `ACCEPTED` không thể accept lại. |
| INV-005 | Admin không bao giờ nhập hoặc biết password Teacher. |
| INV-006 | Hệ thống không bắt buộc gửi email tự động trong MVP. |

## Security Notes

- Không log raw token.
- Không gửi token qua response list API sau lần tạo nếu không cần.
- Nếu Admin cần copy lại link, có thể generate display link từ secure flow hoặc cho copy khi policy cho phép.
- Token phải đủ dài và random.
- Password phải hash bằng thuật toán an toàn.
