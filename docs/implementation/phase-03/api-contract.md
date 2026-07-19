# Phase 03 API Contract

## 1. Contract Rules

- Base path `/api/v1`; JSON envelope/error giữ Phase 01/02.
- Bearer auth cho protected operations; role/permission và object scope đều kiểm backend.
- Mutation body `additionalProperties:false`.
- UTC ISO-8601; ID là 24-char ObjectId string ở transport.
- List default `page=1`, `limit=20`, max `100`; invalid input trả `422`, không clamp âm thầm.
- Stable sort thêm `_id` tie-breaker.
- Raw Class Code/Invite Token chỉ có trong one-time response/request cần thiết, không trong list/detail/audit.
- OpenAPI là executable contract và phải cùng PR với route.

## 2. Classroom Endpoints

| Method | Endpoint                                                | Auth/permission                                   | Success                                                |
| ------ | ------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| GET    | `/classrooms`                                           | Student `view_enrolled` hoặc Teacher `view_owned` | `200` role-scoped paginated list                       |
| POST   | `/classrooms`                                           | Teacher `classroom.create`                        | `201` Classroom detail; optional initial raw code once |
| GET    | `/classrooms/{classroomId}`                             | Enrolled Student hoặc owner Teacher               | `200` actor-safe detail                                |
| PATCH  | `/classrooms/{classroomId}`                             | Owner `classroom.update_owned`                    | `200` updated detail + auditId                         |
| DELETE | `/classrooms/{classroomId}`                             | Owner `classroom.archive_owned`                   | `204`; soft archive with reason/CAS                     |
| PATCH  | `/classrooms/{classroomId}/settings`                    | Owner `classroom.update_owned`                    | `200` effective settings/policy                        |
| GET    | `/classrooms/{classroomId}/students`                    | Owner `classroom.view_roster`                     | `200` paginated roster                                 |
| POST   | `/classrooms/{classroomId}/students/{studentId}/remove` | Owner `classroom.remove_student`                  | `200` removed membership + auditId                     |

`GET /classrooms` không nhận `ownerTeacherId`/`studentId` từ client để đổi scope. Admin dùng endpoint riêng.

## 3. Credential Endpoints

| Method | Endpoint                                            | Auth/permission               | Notes                           |
| ------ | --------------------------------------------------- | ----------------------------- | ------------------------------- |
| GET    | `/classrooms/{id}/class-code`                       | Owner `classroom.manage_join` | Metadata/masked suffix only     |
| POST   | `/classrooms/{id}/class-code/regenerate`            | Owner `classroom.manage_join` | Raw code returned once          |
| POST   | `/classrooms/{id}/class-code/disable`               | Owner `classroom.manage_join` | ACTIVE only/idempotent metadata |
| GET    | `/classrooms/{id}/invite-links`                     | Owner `classroom.manage_join` | Metadata history, no token/link |
| POST   | `/classrooms/{id}/invite-links`                     | Owner `classroom.manage_join` | Create; raw link once           |
| POST   | `/classrooms/{id}/invite-links/{linkId}/regenerate` | Owner `classroom.manage_join` | New raw link once               |
| POST   | `/classrooms/{id}/invite-links/{linkId}/disable`    | Owner `classroom.manage_join` | Terminalize + audit             |

## 4. Join Endpoints

| Method | Endpoint                           | Auth                        | Notes                                        |
| ------ | ---------------------------------- | --------------------------- | -------------------------------------------- |
| POST   | `/classrooms/invite-links/preview` | Public + rate limit         | Strict body token; no-store; safe projection |
| POST   | `/classrooms/join-by-code`         | Student ACTIVE + rate limit | Idempotent natural key                       |
| POST   | `/classrooms/join-by-token`        | Student ACTIVE + rate limit | Revalidate token/policy in transaction       |

User-facing link là `/join/invite#token=...`; URL fragment không được gửi tới web server/proxy và API chỉ nhận token trong POST body. BA API/UI/use-case catalog đã được đồng bộ tại revision `1.40`; decision vẫn cần Gate A phê duyệt trước implementation.

## 5. Admin Endpoints

| Method | Endpoint                                          | Permission                     | Success                         |
| ------ | ------------------------------------------------- | ------------------------------ | ------------------------------- |
| GET    | `/admin/settings/enrollment-policy`               | `enrollment_policy.view`       | `200` policy + revision         |
| PATCH  | `/admin/settings/enrollment-policy`               | `enrollment_policy.update`     | `200` policy + auditId          |
| GET    | `/admin/classrooms`                               | `classroom.governance.view`    | `200` paginated governance list |
| GET    | `/admin/classrooms/{classroomId}`                 | `classroom.governance.view`    | `200` governance detail         |
| PATCH  | `/admin/classrooms/{classroomId}/ownership`       | `classroom.ownership.transfer` | Conditional Should              |
| PATCH  | `/admin/classrooms/{classroomId}/enrollment-lock` | `classroom.governance.lock`    | Conditional Should              |

Hai Conditional Should route phải **absent hoặc deny mặc định** cho đến khi có Change Control, permission, audit và test được phê duyệt. Admin Must chỉ dùng namespace `/admin/classrooms` để đọc governance projection; không gọi Teacher route để bypass ownership.

## 6. Core Request Schemas

### Create Classroom

```json
{
  "name": "Node.js Microlearning",
  "description": "Lớp học Node.js nội bộ",
  "subject": "Backend Development",
  "section": "SE-01"
}
```

Không nhận `ownerTeacherId`, `status`, `memberCount`, join credential hoặc audit fields.

### Update Classroom

```json
{
  "name": "Node.js Microlearning - Updated",
  "description": "Mô tả mới",
  "subject": "Backend Development",
  "section": "SE-01",
  "expectedUpdatedAt": "2026-07-18T08:00:00.000Z"
}
```

Ít nhất một mutable field; `expectedUpdatedAt` required.

### Archive Classroom

```json
{
  "reason": "Kết thúc học kỳ 1",
  "expectedUpdatedAt": "2026-07-19T08:00:00.000Z"
}
```

Body strict và bắt buộc cho `DELETE /classrooms/{classroomId}`. Chỉ owner Teacher được archive trong Must; backend chuyển trạng thái mềm, giữ Enrollment/credential history và ghi `CLASSROOM_ARCHIVED` trong cùng transaction.

### Update Settings

```json
{
  "enrollmentStatus": "OPEN",
  "allowClassCodeJoin": true,
  "allowInviteLinkJoin": true,
  "expectedUpdatedAt": "2026-07-18T08:00:00.000Z"
}
```

Response phải trả cả `configuredSettings` và `effectiveSettings`; global policy disable làm effective false dù configured true.

`studentInteractionMode` không thuộc Must request schema. Field này chỉ được bổ sung khi Conditional Should được phê duyệt; nếu chưa phê duyệt, strict validator phải từ chối thay vì âm thầm lưu một setting chưa có Phase 03 consumer.

### Regenerate Credential

```json
{
  "expectedCredentialUpdatedAt": "2026-07-18T08:00:00.000Z",
  "reason": "Mã cũ đã được chia sẻ nhầm kênh"
}
```

Invite create/regenerate thêm `expiresInDays` optional 1-90.

### Preview Invite Link

```json
{
  "token": "<opaque-classroom-invite-token>"
}
```

### Join By Code

```json
{
  "code": "ABCD-EFGH"
}
```

### Join By Token

```json
{
  "token": "<opaque-classroom-invite-token>"
}
```

### Remove Student

```json
{
  "reason": "Student chuyển sang lớp khác",
  "expectedEnrollmentUpdatedAt": "2026-07-18T08:00:00.000Z"
}
```

### Update Enrollment Policy

```json
{
  "allowClassCodeJoin": true,
  "allowInviteLinkJoin": true,
  "defaultInviteLinkLifetimeDays": 30,
  "expectedRevision": 1,
  "reason": "Duy trì hai phương thức tham gia cho học kỳ mới"
}
```

## 7. Canonical Response Schemas

### ClassroomSummary

| Field                 | Type            | Rule                             |
| --------------------- | --------------- | -------------------------------- |
| `id`                  | string          | Required                         |
| `name`                | string          | Required                         |
| `description`         | string/null     | Safe by actor                    |
| `subject/section`     | string/null     | Safe by actor                    |
| `owner`               | `{id,fullName}` | No owner email in public preview |
| `status`              | enum            | ACTIVE/LOCKED/ARCHIVED           |
| `enrollmentStatus`    | enum            | OPEN/CLOSED/LOCKED               |
| `membership`          | object/null     | Student own Enrollment only      |
| `createdAt/updatedAt` | ISO string      | Required                         |

### ClassroomDetail

`ClassroomSummary` cộng `configuredSettings`, `effectiveSettings` và `allowedActions`. Teacher/Student detail không bắt buộc trả counts. Credential raw/digest không bao giờ nằm trong detail.

### AdminClassroomGovernanceSummary

Admin governance list/detail trả `ClassroomSummary` projection phù hợp cộng `memberCount` required, là số Enrollment `ACTIVE` tại thời điểm query. `contentCount` bị loại khỏi Phase 03 contract vì Course/Lesson/Classwork thuộc Phase 04. Không trả credential metadata, raw value, digest/hash hoặc roster.

### EnrollmentSummary

```json
{
  "id": "64f000000000000000000010",
  "classroomId": "64f000000000000000000020",
  "studentId": "64f000000000000000000030",
  "status": "ACTIVE",
  "joinedBy": "CLASS_CODE",
  "joinedAt": "2026-07-18T08:00:00.000Z"
}
```

### Join Result

```json
{
  "success": true,
  "data": {
    "classroom": {},
    "enrollment": {},
    "alreadyEnrolled": false,
    "nextAction": "OPEN_CLASSROOM"
  }
}
```

Duplicate ACTIVE trả same shape với `alreadyEnrolled=true` và status `200`; first create trả `201`.

### Credential One-Time Response

```json
{
  "success": true,
  "data": {
    "credential": {
      "id": "64f000000000000000000040",
      "status": "ACTIVE",
      "expiresAt": null,
      "createdAt": "2026-07-18T08:00:00.000Z"
    },
    "classCode": "ABCD-EFGH"
  }
}
```

Invite response dùng `inviteLink` thay `classCode`. List/detail response tuyệt đối không có hai field này.

### Public Invite Preview

```json
{
  "success": true,
  "data": {
    "classroomName": "Node.js Microlearning",
    "subject": "Backend Development",
    "teacher": { "fullName": "Nguyen Van A" },
    "joinable": true,
    "expiresAt": "2026-08-17T08:00:00.000Z"
  }
}
```

## 8. List Contract

Common query: `page`, `limit`, `keyword`, `status`, `sortBy`, `sortOrder`.

| List              | Additional filters                   | Sort allowlist                             |
| ----------------- | ------------------------------------ | ------------------------------------------ |
| Teacher Classroom | `enrollmentStatus`                   | `name`, `status`, `createdAt`, `updatedAt` |
| Student Classroom | `status`                             | `name`, `joinedAt`, `updatedAt`            |
| Roster            | `enrollmentStatus`, `accountStatus`  | `fullName`, `email`, `joinedAt`, `status`  |
| Admin Classroom   | `ownerTeacherId`, `enrollmentStatus` | `name`, `status`, `createdAt`, `updatedAt` |

Keyword max 100, prefix normalized/escaped. Response envelope gồm `data`, `pagination`, `filters` như P02.

Admin list/detail phải tính `memberCount` nhất quán từ Enrollment source of truth. Count không được dùng làm filter/sort trong Phase 03 và không được client cung cấp trong request.

## 9. Error Contract

| HTTP | Code                           | Case                                         |
| ---- | ------------------------------ | -------------------------------------------- |
| 401  | `AUTHENTICATION_REQUIRED`      | Guest join/protected route                   |
| 403  | `ACCOUNT_NOT_ACTIVE`           | Current User not ACTIVE                      |
| 403  | `ACCESS_DENIED`                | Wrong role/permission                        |
| 404  | `RESOURCE_NOT_FOUND`           | Not found hoặc hidden non-owned resource     |
| 409  | `CONCURRENT_MODIFICATION`      | CAS/revision stale                           |
| 409  | `CLASSROOM_NOT_JOINABLE`       | LOCKED/ARCHIVED                              |
| 409  | `ENROLLMENT_CLOSED`            | CLOSED/LOCKED                                |
| 409  | `REJOIN_NOT_ALLOWED`           | Historical non-ACTIVE membership             |
| 409  | `TEACHER_HAS_ACTIVE_CLASSROOM` | Offboarding guard                            |
| 409  | `INVALID_STATE_TRANSITION`     | Lifecycle invalid                            |
| 422  | `INVALID_CLASS_CODE`           | Invalid/old code, generic message            |
| 422  | `INVITE_LINK_INVALID`          | Invalid/disabled/expired token, safe message |
| 422  | `JOIN_METHOD_DISABLED`         | Global/local method off                      |
| 422  | `VALIDATION_ERROR`             | Strict body/query/path invalid               |
| 429  | `RATE_LIMITED`                 | Join/preview abuse control                   |

DB/index/token/internal IDs không xuất hiện trong details.

## 10. Cache And Headers

- Join/preview/credential one-time responses: `Cache-Control: no-store`.
- Protected list/detail có thể dùng no-store trong P03; ETag caching chỉ thêm sau ADR.
- Preview CORS theo allowed frontend origins; mutation authenticated follows existing bearer/origin policy.
- Swagger UI `persistAuthorization:false`.

## 11. OpenAPI Requirements

- Tags: `Classrooms`, `Classroom Join`, `Classroom Credentials`, `Classroom Roster`, `Enrollment Policy`, `Classroom Governance`.
- Reuse bearer security; public preview declares no security plus rate/error responses.
- Schema enums/max/min/additionalProperties đầy đủ.
- Document 200/201/204 và representative 401/403/404/409/422/429/500.
- Examples synthetic; no working token/code.
- CI contract test compares exact P03 route-method catalog với OpenAPI operations.
