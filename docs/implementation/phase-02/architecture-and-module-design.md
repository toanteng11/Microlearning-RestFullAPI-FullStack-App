# Phase 02 Architecture And Module Design

## 1. Kiến trúc mục tiêu

P02 tiếp tục Modular Monolith từ Phase 01: một React SPA, một Express API và một MongoDB. Identity, Users, Invitations và Audit là các module tách boundary nhưng cùng process/runtime.

```text
React Web
  -> API Client / Auth Coordinator
      -> Express Router
          -> Authentication + Validation Middleware
              -> Controller
                  -> Application Service
                      -> Repository / Unit Of Work
                          -> MongoDB Replica Set
```

## 2. Backend Module Map

```text
apps/api/src/
|-- modules/
|   |-- auth/
|   |   |-- auth.routes.ts
|   |   |-- auth.controller.ts
|   |   |-- auth.service.ts
|   |   |-- auth.schemas.ts
|   |   |-- auth.types.ts
|   |   `-- auth.errors.ts
|   |-- users/
|   |   |-- user.model.ts
|   |   |-- user.repository.ts
|   |   |-- user.service.ts
|   |   |-- user.routes.ts
|   |   `-- user.schemas.ts
|   |-- sessions/
|   |   |-- session.model.ts
|   |   |-- session.repository.ts
|   |   `-- session.service.ts
|   |-- teacher-invitations/
|   |   |-- teacher-invitation.model.ts
|   |   |-- teacher-invitation.repository.ts
|   |   |-- teacher-invitation.service.ts
|   |   |-- admin-teacher-invitation.routes.ts
|   |   `-- public-teacher-invitation.routes.ts
|   |-- admin-users/
|   |   |-- admin-user.routes.ts
|   |   |-- admin-user.controller.ts
|   |   `-- admin-user.service.ts
|   |-- audit/
|   |   |-- audit-log.model.ts
|   |   |-- audit-log.repository.ts
|   |   `-- audit.service.ts
|   `-- system-guards/
|       |-- system-guard.model.ts
|       `-- system-guard.repository.ts
|-- shared/
|   |-- auth/
|   |   |-- authenticate.ts
|   |   |-- authorize.ts
|   |   |-- password.ts
|   |   |-- access-token.ts
|   |   |-- opaque-token.ts
|   |   |-- cookie-policy.ts
|   |   `-- permissions.ts
|   |-- database/
|   |   `-- unit-of-work.ts
|   |-- middleware/
|   |   |-- rate-limit.ts
|   |   `-- validate-origin.ts
|   `-- validation/
|       |-- pagination.ts
|       `-- object-id.ts
`-- scripts/
    `-- bootstrap-admin.ts
```

Tên cụ thể có thể điều chỉnh khi code, nhưng dependency direction và ownership không thay đổi nếu chưa review.

## 3. Dependency Rules

| From | Được phụ thuộc | Không được phụ thuộc trực tiếp |
| --- | --- | --- |
| Route/Controller | Schema, service, HTTP mapping | Mongoose model/query |
| Service | Repository interface, security utility, audit port, unit of work | Express Request/Response |
| Repository | Model, Mongo/Mongoose API | React/HTTP controller |
| Invitations | User service/port, audit, transaction | User model trực tiếp |
| Admin Users | User service/port, session revoke, audit | Session model trực tiếp |
| Shared auth | Config/crypto/types | Domain-specific controller |

## 4. Frontend Module Map

```text
apps/web/src/
|-- app/
|   |-- router.tsx
|   |-- providers.tsx
|   `-- route-paths.ts
|-- features/
|   |-- auth/
|   |   |-- api/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   `-- schemas/
|   |-- profile/
|   |-- admin-users/
|   |   |-- api/
|   |   |-- components/
|   |   `-- pages/
|   |-- teacher-invitations/
|   `-- role-home/
`-- shared/
    |-- api/
    |   |-- api-client.ts
    |   |-- api-error.ts
    |   `-- query-client.ts
    |-- auth/
    |   |-- AuthProvider.tsx
    |   |-- ProtectedRoute.tsx
    |   `-- RoleRoute.tsx
    |-- components/
    |   |-- AppShell.tsx
    |   |-- DataTable.tsx
    |   |-- ConfirmDialog.tsx
    |   |-- FormField.tsx
    |   `-- StatusBadge.tsx
    `-- navigation/
        `-- role-navigation.ts
```

## 5. Request Flows

### Register

```text
RegisterPage
  -> POST /auth/register
  -> validate allowlist/password/email
  -> unique user insert STUDENT/ACTIVE
  -> 201 without token/cookie
  -> redirect /login with safe success state
```

### Login And Bootstrap

```text
Login -> credential + cooldown checks -> issue access JWT + refresh cookie
      -> AuthProvider stores access token/user in memory -> role home

Browser reload -> AuthProvider POST /auth/refresh-token with cookie
               -> rotate token -> new access token/user -> render protected tree
               -> failure -> anonymous state -> /login
```

### Protected API

```text
Bearer JWT verify
  -> load User by sub
  -> require ACTIVE
  -> require active session family by familyId
  -> resolve role permissions
  -> require endpoint permission
  -> service verifies target/object state
  -> execute and return safe projection
```

### Teacher Invitation Accept

```text
POST body token -> hash lookup -> PENDING + unexpired -> email match + password valid
          -> Mongo transaction:
               create TEACHER/ACTIVE
               conditional update invitation to ACCEPTED
               append AuditLog
          -> commit -> response without auth session -> Teacher goes to Login
```

## 6. API Composition Changes

`createApp` tiếp tục nhận dependency qua options. P02 nên bổ sung một composition root tạo repository/service/router; test có thể inject clock, token generator, hasher và repository fake. Không đọc environment trực tiếp trong service.

Thứ tự middleware đề xuất:

1. Request ID và structured logging với redaction.
2. Helmet/CORS/body limit.
3. Cookie parser.
4. Endpoint-specific IP rate limit và Origin/Referer validation.
5. JSON/path/query validation.
6. Authentication/authorization.
7. Controller/service.
8. Not found/error handler.

## 7. Transaction Boundary

Transaction nằm ở application service cho use case nhiều collection. Repository nhận `ClientSession` optional/required từ Unit of Work. Không tạo transaction cho read-only hoặc single atomic document update nếu unique/compare-and-swap đã đủ.

Use case cần transaction trong P02:

- Accept Teacher Invitation.
- Role/status update kèm AuditLog và session revoke nếu cần consistency cao.
- Super Admin role/status mutation chạm fixed governance guard để serialize final-admin invariant.
- Bootstrap Super Admin kèm operation audit nếu audit collection đã sẵn sàng.

## 8. Extension Points Cho Phase 03+

| Port P02 cung cấp | Consumer tương lai |
| --- | --- |
| `AuthenticatedUser`/permission middleware | Classroom, content, assessment APIs |
| `UserReader` kiểm role/status | Classroom owner và Enrollment validation |
| `SessionRevoker` | Offboarding/ownership governance |
| `AuditWriter` | Classroom/content/deadline/grade actions |
| Role-specific seed identities | P03 E2E join flow |
| Stable `/users/me` và role redirect | Student/Teacher/Admin dashboards |

## 9. Không được phá boundary

- Không trả Mongoose document nguyên bản ra response.
- Không dùng `req.body.role/status` để tạo public User.
- Không dùng frontend menu visibility như authorization.
- Không query all users rồi filter role ở React.
- Không import invitation token/raw cookie vào logger hoặc analytics.
- Không tạo Classroom placeholder trong P02 để “test role”.
