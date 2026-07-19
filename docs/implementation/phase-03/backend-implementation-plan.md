# Phase 03 Backend Implementation Plan

## 1. Objective

Triển khai P03 theo vertical slices nhưng giữ domain boundary: permission/config -> data/index -> Classroom -> policy/governance -> credential -> join/roster -> offboarding integration -> OpenAPI/hardening.

## 2. Composition Root

`createApp`/P03 composition tạo và inject:

- `ClassroomRepository`
- `EnrollmentRepository`
- `ClassCodeRepository`
- `ClassroomInviteLinkRepository`
- `EnrollmentPolicyRepository`
- `UserReader`
- `AuditLogRepository/AuditWriter`
- `MongoUnitOfWork`
- `Clock`
- `ClassCodeGenerator/Digester`
- `InviteTokenGenerator/Hasher`
- `RateLimiter`

Service không đọc `process.env`, không dùng global model trực tiếp và không phụ thuộc Express.

## 3. Slice A - Permissions, Config And Crypto

### Source Changes

- Mở rộng `PERMISSIONS` và role defaults theo `security-ownership-and-governance.md`.
- Bổ sung env schema:
  - `CLASSROOM_CODE_PEPPER`
  - `CLASSROOM_CODE_LENGTH`
  - `CLASSROOM_INVITE_TOKEN_BYTES`
  - `CLASSROOM_INVITE_DEFAULT_TTL_DAYS`
  - join/preview rate limits.
- Implement normalization/code format, HMAC digest, token generation/hash.
- Logger redaction cho code/token fields.

### Tests

- Permission snapshot theo role và negative permission.
- Env fail-fast boundaries/unsafe Production default.
- Code alphabet/length/normalization/digest determinism.
- Token length/hash và raw redaction.

## 4. Slice B - Models, Indexes And Repositories

### Models

- `ClassroomModel`
- `EnrollmentModel`
- `ClassCodeModel`
- `ClassroomInviteLinkModel`
- `SystemSettingModel` hoặc Enrollment Policy adapter.

### Repository Contracts

```ts
interface ClassroomRepository {
  create(input: NewClassroom, session: ClientSession): Promise<ClassroomRecord>;
  findVisibleById(actor: ActorScope, id: ObjectId): Promise<ClassroomRecord | null>;
  listOwned(ownerId: ObjectId, query: ClassroomListQuery): Promise<Page<ClassroomRecord>>;
  listEnrolled(studentId: ObjectId, query: ClassroomListQuery): Promise<Page<StudentClassroomRow>>;
  updateOwnedCas(
    input: ClassroomUpdateCommand,
    session?: ClientSession,
  ): Promise<ClassroomRecord | null>;
  countActiveOwnedByTeacher(teacherId: ObjectId): Promise<number>;
}
```

Repository phải nhận normalized/allowlisted query, không nhận raw Express query object.

### Tests

- Exact index names/options.
- Duplicate Enrollment and active credential constraints.
- Prefix search/pagination/tie-breaker.
- Safe projection không có digest/raw/internal fields.

## 5. Slice C - Classroom CRUD And Settings

### Services

- `createClassroom`
- `listClassroomsForActor`
- `getClassroomForActor`
- `updateOwnedClassroom`
- `updateClassroomSettings`
- `archiveClassroom`

### Rules

- Owner lấy từ authenticated actor.
- Strict schemas; no owner/status injection.
- Actor-specific DTO/allowedActions.
- CAS update; archive soft state + AuditLog.
- Create transaction có optional initial Class Code.

### Route Order

Register static join/admin-independent routes trước `/:classroomId` để tránh Express path capture. Path ID validation trước service.

## 6. Slice D - Enrollment Policy And Governance

- Idempotent policy bootstrap `$setOnInsert`.
- `GET/PATCH /admin/settings/enrollment-policy` với permission, revision, reason, audit.
- Admin list/detail Classroom safe projection.
- Count aggregation có pagination; không N+1 query từng Classroom.
- Optional transfer/lock chỉ bật khi permission/AC/test đã đủ.

## 7. Slice E - Class Code

### Service Flow

1. Resolve owner Classroom.
2. Validate global/local policy and state.
3. Generate bounded unique code.
4. Transaction terminalize old ACTIVE, insert new, append audit.
5. Return raw once + metadata.

Lookup join dùng normalized code -> HMAC digest -> unique find. Không query regex raw code.

## 8. Slice F - Invite Link

- Create/regenerate/disable/list metadata.
- Lazy expiry evaluation updates ACTIVE expired record safely when needed.
- Public preview strict body, rate limit, `no-store`, minimal projection.
- Hash lookup only; no raw token in path/query/error/log.
- Link builder dùng validated `PUBLIC_WEB_URL`, không tin Host header.

## 9. Slice G - Join And Roster

### Join Domain Service

```ts
joinClassroom(command: {
  actor: AuthenticatedStudent;
  method: 'CLASS_CODE' | 'INVITE_LINK';
  credential: string;
  requestId: string;
}): Promise<JoinResult>
```

- Shared policy precedence function cho Code/Link.
- Real transaction, bounded transient retry.
- Existing ACTIVE trả idempotent result.
- Duplicate-key race map sang existing result.
- REMOVED/LEFT/BLOCKED trả rejoin error.
- Audit metadata không credential.

### Roster

- Owner-scoped paginated query.
- Remove CAS status + reason + audit transaction.
- Invalidate/refresh relevant list cache ở frontend response layer, không event giả.

## 10. Slice H - Phase 02 Integration

Expose port:

```ts
interface ClassroomOwnershipReader {
  countActiveOwnedClassrooms(teacherId: string): Promise<number>;
}
```

Admin User status mutation gọi port trước transaction block/deactivate Teacher. Test cả:

- Teacher không có active Classroom -> mutation như P02.
- Có active Classroom -> `TEACHER_HAS_ACTIVE_CLASSROOM`, User/session/audit không đổi.
- Classroom archived -> không chặn.

Không import Classroom Mongoose model vào `admin-users.service.ts`.

## 11. Schema And HTTP Mapping

- Zod strict body/query/path.
- ObjectId parser dùng shared helper.
- Domain errors map central error handler.
- `201` first join/create, `200` duplicate join/update, `204` archive.
- No request body echo for code/token.
- `Cache-Control:no-store` cho credential/join/preview.

## 12. OpenAPI

- Add P03 schemas/tags/security/errors.
- Route catalog test exact method/path.
- Parse OpenAPI 3.0.3.
- Validate no hash/raw model fields in component schemas.
- Swagger examples synthetic and non-working.

## 13. Backend Test Pyramid

| Layer                 | Required focus                                                  |
| --------------------- | --------------------------------------------------------------- |
| Unit                  | normalization, lifecycle, policy precedence, DTO, error mapping |
| Service fake          | ownership, transitions, idempotency, audit commands             |
| Repository real Mongo | indexes, pagination, projection, CAS                            |
| API real Mongo        | HTTP/auth/cookie/rate/error/transaction                         |
| Concurrency           | join, regenerate, policy/update, remove/archive races           |

## 14. Backend Definition Of Done

- Route + service + repository + schema + OpenAPI cùng slice.
- Positive/negative/object-scope tests.
- Real Mongo test cho invariant/index/transaction.
- No raw credential in DB/log/audit/test output.
- No unsafe `any`, direct model in controller hoặc client-controlled owner/scope.
- Lint/typecheck/coverage/build pass.
