# Phase 03 Architecture And Module Design

## 1. Kiến Trúc Mục Tiêu

P03 tiếp tục Modular Monolith: React SPA, Express API và MongoDB replica set. Classroom, Enrollments, Join Credentials và Enrollment Policy là domain boundary riêng nhưng dùng chung Auth, Users, Audit và Unit of Work từ P02.

```text
React Web
  -> Authenticated API Client
      -> Express P03 Router
          -> Authenticate / Permission / Validation / Rate Limit
              -> Application Service
                  -> Ownership/Policy/Join Domain Services
                      -> Repositories + Mongo Unit Of Work
                          -> MongoDB Replica Set
```

## 2. Backend Module Map

```text
apps/api/src/modules/
|-- classrooms/
|   |-- classroom.model.ts
|   |-- classroom.repository.ts
|   |-- classroom.schemas.ts
|   |-- classroom.service.ts
|   |-- classroom.routes.ts
|   `-- classroom.types.ts
|-- enrollments/
|   |-- enrollment.model.ts
|   |-- enrollment.repository.ts
|   |-- enrollment.schemas.ts
|   |-- enrollment.service.ts
|   `-- roster.routes.ts
|-- classroom-credentials/
|   |-- class-code.model.ts
|   |-- classroom-invite-link.model.ts
|   |-- classroom-credential.repository.ts
|   |-- classroom-credential.service.ts
|   |-- classroom-credential.schemas.ts
|   `-- classroom-credential.routes.ts
|-- enrollment-policy/
|   |-- enrollment-policy.repository.ts
|   |-- enrollment-policy.service.ts
|   |-- enrollment-policy.schemas.ts
|   `-- enrollment-policy.routes.ts
|-- classroom-governance/
|   |-- classroom-governance.service.ts
|   `-- classroom-governance.routes.ts
`-- phase-three.router.ts
```

Tên file có thể điều chỉnh theo codebase thực tế; dependency direction và aggregate ownership chỉ đổi qua review.

## 3. Frontend Module Map

```text
apps/web/src/features/
|-- classrooms/
|   |-- api/
|   |-- components/
|   |-- hooks/
|   |-- pages/teacher/
|   |-- pages/student/
|   `-- classroom.types.ts
|-- classroom-join/
|   |-- pages/JoinByCodePage.tsx
|   |-- pages/InviteJoinPage.tsx
|   |-- join-context.ts
|   `-- classroom-join.types.ts
|-- classroom-roster/
|-- enrollment-policy/
`-- classroom-governance/
```

Shared components hiện có (`AppShell`, API client, auth guards) được tái sử dụng. Chỉ tạo `DataTable`, `Pagination`, `ConfirmDialog`, `CopyButton` dùng chung khi có ít nhất hai consumer thật.

## 4. Dependency Rules

| From                 | Được phụ thuộc                                                            | Không được phụ thuộc trực tiếp |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| Classroom routes     | schemas, service, auth middleware                                         | Mongoose model/query           |
| Classroom service    | repository, UserReader, AuditWriter, UoW                                  | Express Request/Response       |
| Enrollment service   | ClassroomReader, PolicyReader, credential verifier, Enrollment repository | Raw JWT/cookie/UI state        |
| Credential service   | crypto adapter, repository, clock, audit                                  | Logger raw token/code          |
| Governance           | classroom read port, UserReader, audit                                    | Frontend role checks           |
| Phase 02 Admin Users | `ClassroomOwnershipReader` port                                           | Classroom model trực tiếp      |
| React features       | typed API adapter/query state                                             | Mongo/domain model             |

## 5. Core Request Flows

### Create Classroom

```text
Teacher POST /classrooms
  -> auth ACTIVE + classroom.create
  -> strict body validation
  -> owner=current user
  -> load global Enrollment Policy
  -> transaction:
       insert Classroom ACTIVE/OPEN
       optionally create ACTIVE Class Code if policy permits
       append AuditLog
  -> return Classroom detail + raw initial code once if generated
```

### Join By Code

```text
Student POST /classrooms/join-by-code
  -> auth STUDENT/ACTIVE + rate limit
  -> normalize code -> HMAC digest lookup
  -> transaction/service validates policy precedence
  -> create unique Enrollment ACTIVE + AuditLog
  -> duplicate race resolves to idempotent existing result
  -> return Classroom summary + enrollment
```

### Join By Invite Link

```text
Browser /join/invite#token=...
  -> capture fragment token in memory -> history.replaceState('/join/invite')
  -> POST preview body token, no-store
  -> if anonymous: store bounded in-memory/session join context -> Login/Register
  -> after Login: revalidate preview and POST join-by-token
  -> transaction creates Enrollment or returns alreadyEnrolled
```

Join context hỗ trợ navigation, không phải authorization. Token luôn được backend validate lại.

### Remove Student

```text
Teacher owner POST /classrooms/:id/students/:studentId/remove
  -> expectedUpdatedAt + reason
  -> transaction conditional ACTIVE Enrollment update to REMOVED
  -> append AuditLog
  -> commit -> roster/query cache invalidation
```

### Update Enrollment Policy

```text
Admin PATCH /admin/settings/enrollment-policy
  -> permission + strict schema + expectedRevision + reason
  -> transaction CAS update singleton + AuditLog
  -> new policy applies to subsequent join requests
```

## 6. Authorization Layers

1. Authenticate token/session and current User ACTIVE.
2. Check coarse permission (`classroom.create`, `classroom.join`, etc.).
3. Resolve resource by ID/digest with safe not-found behavior.
4. Check object ownership or ACTIVE Enrollment.
5. Check Classroom, policy, credential và Enrollment state.
6. Execute atomic mutation.

Không gộp bước 2 và 4 thành một frontend condition.

## 7. Transaction Boundaries

Transaction bắt buộc khi:

- Create Classroom đồng thời tạo code/audit.
- Regenerate/disable credential và ghi audit.
- Join tạo Enrollment và audit/event.
- Remove Student và audit.
- Enrollment Policy update và audit.
- Ownership transfer và audit nếu Should được kéo vào.

Read-only list/detail và single-document safe update không cần transaction nếu CAS/index đã đủ.

## 8. Query Boundary

- Teacher list query cố định `ownerTeacherId=currentUser.id` ở repository.
- Student list query bắt đầu từ Enrollment ACTIVE rồi join safe Classroom projection.
- Admin governance query dùng permission riêng, không tái sử dụng Student/Teacher route bằng query role tùy ý.
- Roster bắt đầu từ Enrollment theo Classroom, sau đó lookup safe User fields.
- Stable order luôn thêm `_id` tie-breaker.

## 9. Extension Ports Cho Phase 04+

| Port P03 cung cấp                | Consumer                                      |
| -------------------------------- | --------------------------------------------- |
| `ClassroomReader`                | Course/content validate Classroom state/owner |
| `ClassroomAccessReader`          | Student content access theo Enrollment        |
| `EnrollmentReader`               | Progress, To-do, Quiz/Assignment scope        |
| `ClassroomOwnershipReader`       | Admin offboarding/transfer                    |
| `ClassroomEventWriter`           | Notification/analytics sau này                |
| Stable Classroom routes/UI shell | Stream/Classwork/People/Grades expansion      |

## 10. Boundary Không Được Phá

- Không embed Student roster array trong Classroom document.
- Không dùng raw Class Code/Invite Token làm Mongo key/log metadata.
- Không query all Classroom rồi filter ở React.
- Không cho client gửi `ownerTeacherId`, `memberCount`, `status` ngoài allowlist.
- Không xóa Enrollment khi remove Student hoặc archive Classroom.
- Không import Phase 04 Course model giả để hoàn thiện P03 UI.
