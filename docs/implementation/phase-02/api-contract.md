# Phase 02 API Contract

## 1. Contract Rules

- Base path: `/api/v1`.
- JSON response dùng success/error envelope từ Phase 01/BA.
- Protected API dùng bearer access JWT; refresh/logout dùng refresh cookie theo endpoint rule.
- Mutation thành công trả safe projection, không trả Mongoose document/passwordHash/tokenHash.
- List API dùng `page`, `limit`, `keyword`, `status`, `sortBy`, `sortOrder`; max `limit=100`.
- OpenAPI là contract thực thi và phải cập nhật cùng code.

## 2. Endpoint Catalog - Auth And Profile

| Method | Endpoint | Auth | Permission | Success |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | Public + rate limit | Guest | `201` Student summary, no session |
| POST | `/auth/login` | Public + rate/cooldown | User credential | `200` accessToken + user; set refresh cookie |
| POST | `/auth/refresh-token` | Refresh cookie + Origin | Session | `200` rotated accessToken + user; set new cookie |
| POST | `/auth/logout` | Refresh cookie; bearer optional | Session | `204`; revoke family, clear cookie |
| GET | `/users/me` | Bearer | `profile.view_own` | `200` own profile/capabilities |
| PATCH | `/users/me` | Bearer | `profile.update_own` | `200` updated safe profile |

Conditional Should: `POST /auth/forgot-password`, `POST /auth/reset-password` chỉ thêm khi delivery decision được phê duyệt.

## 3. Endpoint Catalog - Admin Users

| Method | Endpoint | Permission | Notes |
| --- | --- | --- | --- |
| GET | `/admin/users/students` | `user.view_students` | Fixed server filter role STUDENT |
| GET | `/admin/users/teachers` | `user.view_teachers` | Fixed role TEACHER; optional invitation summary |
| GET | `/admin/users/admins` | `user.view_admins` | Fixed role in ADMIN/SUPER_ADMIN |
| GET | `/admin/users/search` | `user.search` | Should; keyword required, cross-role safe projection |
| GET | `/admin/users/{userId}` | permission theo target role | Student=`user.view_students`; Teacher=`user.view_teachers`; Admin/Super Admin=`user.view_admins` |
| PATCH | `/admin/users/{userId}/status` | `user.update_status` | Transition + reason + revoke + audit |
| PATCH | `/admin/users/{userId}/role` | `role.assign_limited` | Super Admin only; single primary role |

Không có endpoint “all users” làm default cho UI.

## 4. Endpoint Catalog - Teacher Invitations

| Method | Endpoint | Auth/Permission | Notes |
| --- | --- | --- | --- |
| POST | `/admin/teacher-invitations` | `teacher_invitation.create` | Raw link returned once |
| GET | `/admin/teacher-invitations` | `teacher_invitation.view` | Paginated list, never token/hash |
| GET | `/admin/teacher-invitations/{invitationId}` | `teacher_invitation.view` | Safe detail |
| POST | `/admin/teacher-invitations/{invitationId}/copy-events` | `teacher_invitation.copy_link` | Must after clipboard success; idempotent `eventId`; no link reconstruction |
| POST | `/admin/teacher-invitations/{invitationId}/revoke` | `teacher_invitation.revoke` | PENDING only, reason required |
| POST | `/teacher/invitations/preview` | Public + rate limit | Token trong strict body; response `no-store` |
| POST | `/teacher/invitations/accept` | Public + rate limit | Token + activation form trong strict body; transactional |

User-facing link vẫn là `/teacher/invite?token=...`. React phải đọc token một lần, xóa query khỏi address bar rồi gửi token trong HTTPS request body. API/proxy không dùng token trong path/query nên access log không cần chứa secret URL.

## 5. Core Schemas

### Register Request

```json
{
  "fullName": "Tran Thi B",
  "email": "student@example.com",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!"
}
```

`additionalProperties: false`. `role`, `status`, `permissions`, `registrationSource` không được chấp nhận.

### Register Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64f000000000000000000001",
      "fullName": "Tran Thi B",
      "email": "student@example.com",
      "role": "STUDENT",
      "status": "ACTIVE"
    },
    "nextAction": "LOGIN"
  }
}
```

Không có access token, refresh cookie, Enrollment hoặc role tùy chọn.

### Login Response

```json
{
  "success": true,
  "data": {
    "accessToken": "<short-lived-jwt>",
    "expiresInSeconds": 900,
    "user": {
      "id": "64f000000000000000000001",
      "fullName": "Tran Thi B",
      "email": "student@example.com",
      "role": "STUDENT",
      "status": "ACTIVE",
      "capabilities": ["profile.view_own", "profile.update_own"]
    }
  }
}
```

Refresh token chỉ nằm trong `Set-Cookie`, không nằm trong JSON.

### Login Request

```json
{
  "email": "student@example.com",
  "password": "StrongPassword123!"
}
```

`additionalProperties:false`; password không trim. Login response luôn dùng `UserContext` canonical ở mục 6.

### Refresh And Logout

- `POST /auth/refresh-token` không nhận JSON body; cookie + approved `Origin` bắt buộc trên browser request.
- Refresh success dùng cùng payload với Login Response, rotate cookie và trả `Cache-Control: no-store`.
- Refresh race trong grace window trả `409 REFRESH_RACE_RETRY`, không clear cookie và không revoke family.
- Replay ngoài grace trả `409 REFRESH_TOKEN_REUSE_DETECTED`, revoke family và clear cookie.
- `POST /auth/logout` idempotent, không nhận body, trả `204` không có response envelope/body và luôn clear cookie.

### Update Own Profile Request

```json
{
  "fullName": "Tran Thi B Updated",
  "avatarUrl": "https://assets.example.com/avatar.png"
}
```

MVP allowlist tối thiểu chỉ `fullName`; `email`, `role`, `status` bị từ chối.

### Status Update Request

```json
{
  "status": "BLOCKED",
  "reason": "Suspicious account activity",
  "expectedUpdatedAt": "2026-07-13T08:00:00.000Z"
}
```

Allowed transitions nằm trong service; `reason` bắt buộc cho block/deactivate/delete/role-sensitive action.

### Role Update Request

```json
{
  "role": "ADMIN",
  "reason": "Assigned to platform operations",
  "expectedUpdatedAt": "2026-07-13T08:00:00.000Z"
}
```

Chỉ Super Admin và không được tự nâng quyền/final-admin violation.

### Teacher Invitation Requests

```json
{
  "email": "teacher@example.com",
  "expiresInDays": 7
}
```

```json
{
  "eventId": "9a95a87a-4bb9-40e1-9815-b70db3c24dc7",
  "channelHint": "ZALO"
}
```

`channelHint` optional enum `EMAIL/ZALO/FACEBOOK/MESSENGER/TEAMS/OTHER`; nó chỉ mô tả kênh Admin dự định dùng, không xác nhận đã gửi hoặc đã đọc.

Preview request:

```json
{
  "token": "<opaque-invitation-token>"
}
```

Accept request:

```json
{
  "token": "<opaque-invitation-token>",
  "fullName": "Tran Thi B",
  "email": "teacher@example.com",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!"
}
```

Mọi request trên dùng `additionalProperties:false`; token/password không xuất hiện trong validation details, log hoặc snapshot.

## 6. Canonical Response Schemas

### UserSummary

| Field | Type | Rule |
| --- | --- | --- |
| `id` | ObjectId string | Required |
| `fullName` | string | Required |
| `email` | string | Required, normalized |
| `role` | enum | STUDENT/TEACHER/ADMIN/SUPER_ADMIN |
| `status` | enum | PENDING/ACTIVE/INACTIVE/BLOCKED/DELETED |

### UserContext

`UserSummary` cộng `capabilities:string[]`. Mảng capability được resolve từ server catalog hiện tại, sort ổn định và không nhận từ JWT/client.

### CurrentUserProfile

`UserContext` cộng các field safe optional `avatarUrl`, `studentCode`, `department`, `registrationSource`, `activatedAt`, `lastLoginAt`, `createdAt`, `updatedAt`. Không có password/session/token/internal security metadata.

### Role-Specific List Item

| List | Fields ngoài `id/fullName/email/status` |
| --- | --- |
| Student | `studentCode`, `lastActiveAt`, `createdAt` |
| Teacher | `department`, `registrationSource`, `activatedAt`, `lastActiveAt`, `createdAt` |
| Admin | `role`, `department`, `lastActiveAt`, `createdAt` |

### Admin User Detail

`CurrentUserProfile` nhưng không trả `capabilities` của target. Response thêm `allowedActions:string[]` được tính theo actor/target hiện tại để hỗ trợ UI; API vẫn authorize lại mutation.

### TeacherInvitationSummary

| Field | Type |
| --- | --- |
| `id` | ObjectId string |
| `email` | normalized string |
| `status` | PENDING/ACCEPTED/EXPIRED/REVOKED |
| `deliveryMethod` | MANUAL_COPY |
| `invitedBy` | safe actor summary/id |
| `expiresAt` | UTC ISO string |
| `acceptedAt/revokedAt` | nullable UTC ISO string |
| `createdAt/updatedAt` | UTC ISO string |

Create response cộng `invitationLink` đúng một lần. Detail/List không bao giờ có `invitationLink`, raw token hoặc `tokenHash`. Preview chỉ trả `email`, `expiresAt`, `status`, `deliveryMethod`; Accept trả `UserSummary` và `nextAction=LOGIN`.

### Mutation Response

Status/role mutation trả `{ success:true, data:{ user:AdminUserDetail, auditId:string } }`. Invitation revoke trả updated `TeacherInvitationSummary` và `auditId`. Copy event trả `201` với `{ copyEventId, recordedAt }`; gửi lại cùng `eventId` trả cùng result và không tạo audit trùng.

## 7. List Contract

Example:

```text
GET /api/v1/admin/users/students?keyword=an&status=ACTIVE&page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

```json
{
  "success": true,
  "data": [
    {
      "id": "64f000000000000000000001",
      "fullName": "Tran Thi B",
      "email": "student@example.com",
      "studentCode": null,
      "status": "ACTIVE",
      "lastActiveAt": null,
      "createdAt": "2026-07-13T08:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "filters": {
    "keyword": "an",
    "status": "ACTIVE"
  }
}
```

Sort allowlist:

- Students: `fullName`, `email`, `status`, `lastActiveAt`, `createdAt`.
- Teachers: thêm `department`; count sort chỉ bật khi source P03/P04 có thật.
- Admins: `fullName`, `email`, `role`, `status`, `lastActiveAt`, `createdAt`.

Defaults và validation:

- `page=1`, `limit=20`, `sortBy=createdAt`, `sortOrder=desc`.
- `page/limit` ngoài range, sort/filter không thuộc allowlist hoặc keyword dài hơn 100 ký tự trả `422 VALIDATION_ERROR`; không clamp âm thầm.
- Keyword được normalize như email/full name search, prefix-only và escaped; không truyền regex/operator từ client.
- Stable ordering luôn thêm `_id` cùng direction làm tie-breaker.
- Invitation list dùng `page`, `limit`, `email`, `status`, `sortBy=createdAt|expiresAt|status`, `sortOrder` với cùng pagination envelope.

## 8. Invitation Contract Notes

Create request:

```json
{
  "email": "teacher@example.com",
  "expiresInDays": 7
}
```

Create response có `invitationLink` một lần. List/detail response tuyệt đối không có `tokenHash` hoặc link cũ. UI phải nói rõ: “Hãy copy link ngay; hệ thống không lưu link để hiển thị lại.”

Accept response trả Teacher summary và `nextAction=LOGIN`; không tự login sau activation để giữ flow đơn giản/an toàn.

## 9. Error Mapping

| HTTP | Code | Case |
| --- | --- | --- |
| 401 | `AUTHENTICATION_REQUIRED` | Missing/invalid bearer hoặc refresh cookie |
| 401 | `INVALID_CREDENTIALS` | Login thất bại chung |
| 403 | `ACCOUNT_NOT_ACTIVE` | Valid identity nhưng status không ACTIVE |
| 403 | `ACCESS_DENIED` | Missing permission/wrong role |
| 409 | `DUPLICATE_RESOURCE` | Email đã tồn tại |
| 409 | `REFRESH_RACE_RETRY` | Old token lặp trong grace; family không revoke, client retry một lần |
| 409 | `REFRESH_TOKEN_REUSE_DETECTED` | Rotated refresh token replay ngoài grace; family revoked |
| 409 | `INVITATION_ALREADY_PENDING` | Email có pending unexpired invite |
| 409 | `TEACHER_ALREADY_ACTIVE` | Active Teacher exists |
| 409 | `INVITATION_EXPIRED` | Invitation hết hạn |
| 409 | `INVITATION_REVOKED` | Invitation đã revoke |
| 409 | `INVITATION_ALREADY_ACCEPTED` | Invitation đã được dùng |
| 409 | `CONCURRENT_MODIFICATION` | expectedUpdatedAt mismatch |
| 409 | `FINAL_SUPER_ADMIN_REQUIRED` | Mutation có thể làm mất Super Admin cuối cùng |
| 409 | `INVALID_STATE_TRANSITION` | Account/invitation transition không hợp lệ |
| 403 | `ORIGIN_NOT_ALLOWED` | Refresh/logout browser origin không hợp lệ |
| 404 | `RESOURCE_NOT_FOUND` | ID hợp lệ nhưng resource không tồn tại/không visible |
| 422 | `VALIDATION_ERROR` | Body/query/path invalid |
| 422 | `PASSWORD_POLICY_FAILED` | Password boundary/space rule |
| 422 | `INVITATION_EMAIL_MISMATCH` | Accept email mismatch |
| 429 | `RATE_LIMITED` | Endpoint/IP/identity control |

Login sai email và sai password phải có status/body tương đương. Public invitation error không trả token hash, internal ID hoặc target account detail.

Error envelope canonical:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "details": [{ "field": "email", "code": "INVALID_EMAIL" }]
  },
  "requestId": "01J2EXAMPLE"
}
```

`details` chỉ chứa field/code/message an toàn; không echo password/token/cookie/raw database value.

## 10. OpenAPI Requirements

- Tags: `Authentication`, `Users`, `Admin Users`, `Teacher Invitations`.
- Security schemes: `bearerAuth`; refresh cookie được mô tả bằng `apiKey` cookie hoặc operation prose/schema phù hợp OpenAPI 3.0.
- Mỗi operation có response 2xx và representative 400/401/403/409/422/429/500.
- Schemas dùng enum, max length, examples synthetic và `additionalProperties:false` cho mutation body.
- Swagger UI `persistAuthorization:false`; raw invitation token không prefill/example thật.
- Contract test so sánh route catalog P02 với documented operations.
