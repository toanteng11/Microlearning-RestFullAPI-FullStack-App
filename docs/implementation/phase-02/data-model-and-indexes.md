# Phase 02 Data Model And Indexes

## 1. Collection Catalog

| Collection | Vai trò | Priority |
| --- | --- | --- |
| `users` | Identity, credential hash, primary role, account status và profile | Must |
| `auth_sessions` | Refresh token hash, rotation và revoke metadata | Must |
| `auth_login_states` | Identity failure window/cooldown không làm lộ email | Must |
| `teacher_invitations` | Manual invitation lifecycle | Must |
| `audit_logs` | Append-only privileged action history | Must |
| `system_guards` | Serialize invariant nhạy cảm như final Super Admin | Must |
| `password_reset_tokens` | Secure reset lifecycle | Conditional Should |

Role/Permission dùng typed source catalog trong P02; chưa cần collections riêng nếu không có custom role editor.

## 2. User Model

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `_id` | ObjectId | Yes | Mongo generated |
| `email` | String | Yes | normalized lowercase, unique |
| `fullName` | String | Yes | trim, 2-100 ký tự |
| `fullNameNormalized` | String | Yes | NFD, remove combining marks, map đ->d, lowercase, collapse whitespace |
| `passwordHash` | String | Yes | Argon2id, `select:false` |
| `role` | Enum | Yes | STUDENT/TEACHER/ADMIN/SUPER_ADMIN |
| `status` | Enum | Yes | PENDING/ACTIVE/INACTIVE/BLOCKED/DELETED |
| `registrationSource` | Enum | Yes | SELF_REGISTRATION/TEACHER_INVITATION/ADMIN_BOOTSTRAP |
| `studentCode` | String | No | Student only; unique sparse nếu dùng |
| `department` | String | No | Teacher/Admin safe profile |
| `avatarUrl` | String | No | URL allowlist/validation nếu dùng |
| `invitedBy` | ObjectId | No | Teacher invitation actor |
| `activatedAt` | Date | No | Teacher activation |
| `lastLoginAt` | Date | No | set sau login thành công |
| `lastActiveAt` | Date | No | update có throttle, không mỗi request |
| `createdAt/updatedAt` | Date | Yes | Mongoose timestamps |
| `deletedAt` | Date | No | soft delete only |

Không dùng virtual JSON nào có thể vô tình expose `passwordHash`. Response luôn map qua explicit projection/DTO.

Normalization baseline:

- Email: trim khoảng trắng ngoài, Unicode `NFKC`, lowercase, reject whitespace bên trong, giới hạn 254 ký tự; không áp dụng Gmail-specific dot/plus rewriting.
- `fullName`: trim và collapse Unicode whitespace bên trong, giữ dấu để hiển thị, validate 2-100 Unicode code points.
- `fullNameNormalized`: Unicode `NFD`, loại combining marks, map `đ/Đ -> d`, lowercase và collapse whitespace.
- Keyword name dùng cùng full-name normalization; keyword email dùng cùng email normalization. Search là prefix-only, không dùng raw regex từ client.

## 3. AuthSession Model

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `userId` | ObjectId | Yes | reference users |
| `familyId` | String/UUID | Yes | một login session family |
| `tokenHash` | String | Yes | SHA-256 unique |
| `status` | Enum | Yes | ACTIVE/ROTATED/REVOKED |
| `expiresAt` | Date | Yes | refresh TTL |
| `rotatedAt` | Date | No | old token rotation time |
| `replacedBySessionId` | ObjectId | No | safe lineage, không token |
| `revokedAt` | Date | No | revoke time |
| `revokeReason` | Enum | No | LOGOUT/REUSE/PASSWORD_RESET/ACCOUNT_STATUS/ADMIN/EXPIRED |
| `createdAt/lastUsedAt` | Date | Yes/No | session operation time |
| `userAgentHash` | String | No | optional diagnostic, không full fingerprint |
| `ipPrefixHash` | String | No | optional privacy-preserving signal |

TTL cleanup xóa session hết hạn sau retention ngắn; AuditLog giữ sự kiện cần truy vết.

`rotatedAt` là nguồn tính refresh race grace. Không lưu raw replacement token. Replay trong `REFRESH_REUSE_GRACE_SECONDS` chỉ trả `REFRESH_RACE_RETRY`; replay ngoài grace revoke family.

## 4. AuthLoginState Model

| Field | Type | Rule |
| --- | --- | --- |
| `identityKey` | String | HMAC-SHA256(normalized email, server pepper), unique |
| `failureCount` | Number | atomic increment trong window |
| `windowStartedAt` | Date | reset sau 15 phút |
| `lockedUntil` | Date | set 15 phút khi đủ 5 failures |
| `expiresAt` | Date | TTL cleanup |
| `updatedAt` | Date | diagnostic |

Login success xóa/reset record. HMAC pepper là secret riêng, không dùng JWT secret.

## 5. TeacherInvitation Model

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `email` | String | Yes | normalized Teacher email |
| `tokenHash` | String | Yes | SHA-256 unique, never select by default in list |
| `role` | Enum | Yes | fixed TEACHER |
| `status` | Enum | Yes | PENDING/ACCEPTED/EXPIRED/REVOKED |
| `deliveryMethod` | Enum | Yes | fixed MANUAL_COPY |
| `invitedBy` | ObjectId | Yes | authorized Admin |
| `expiresAt` | Date | Yes | default 7 days, policy min/max |
| `acceptedBy` | ObjectId | No | created Teacher |
| `acceptedAt` | Date | No | only ACCEPTED |
| `revokedAt/revokedBy/revokeReason` | mixed | No | only REVOKED |
| `copyCount/lastCopiedAt/channelHint` | mixed | No | optional safe event summary |
| `createdAt/updatedAt` | Date | Yes | timestamps |

Invitation không dùng TTL delete vì cần history. Expiry được derive tại read/mutation và stale `PENDING` được chuyển `EXPIRED` bằng conditional update.

## 6. AuditLog Model

| Field | Type | Rule |
| --- | --- | --- |
| `actorId` | ObjectId/null | null cho system/bootstrap trước actor nếu cần |
| `actorRole` | Enum/string | snapshot role tại action |
| `action` | String enum/catalog | Ví dụ TEACHER_INVITATION_CREATED |
| `resourceType` | String | USER/TEACHER_INVITATION/AUTH_SESSION |
| `resourceId` | ObjectId/string | target safe identifier |
| `oldValue/newValue` | Object | allowlisted safe enum/IDs only |
| `reason` | String | trim, bounded length, required cho destructive action |
| `requestId` | String | correlation |
| `metadata` | Object | channel hint/IP risk category nếu approved; no secrets |
| `idempotencyKey` | String | optional UUID cho client-confirmed event như invitation copy |
| `createdAt` | Date | immutable |

Model không expose update/delete repository method. Retention policy thuộc BA/privacy baseline.

## 7. SystemGuard Model

| Field | Type | Rule |
| --- | --- | --- |
| `_id` | String | Fixed key, ví dụ `super-admin-governance` |
| `revision` | Number | Atomic increment trong mỗi privileged role/status transaction |
| `updatedAt` | Date | Operation time |

Mọi mutation có thể block/deactivate/delete/demote Super Admin phải update cùng guard document trong transaction trước khi đếm active Super Admin. Hai transaction đồng thời sẽ conflict trên cùng document và một transaction phải retry/re-evaluate invariant; không chỉ dựa vào hai lần count độc lập.

## 8. Index Plan

| Collection | Index | Mục đích |
| --- | --- | --- |
| users | `{ email: 1 } unique` | register/login/invitation conflict |
| users | `{ role: 1, status: 1, createdAt: -1, _id: 1 }` | role list stable pagination |
| users | `{ role: 1, fullNameNormalized: 1, _id: 1 }` | prefix name search |
| users | `{ role: 1, email: 1, _id: 1 }` | email search/sort |
| users | `{ studentCode: 1 } unique sparse` | Student lookup nếu có |
| auth_sessions | `{ tokenHash: 1 } unique` | refresh lookup |
| auth_sessions | `{ familyId: 1, status: 1 }` | family revoke/reuse |
| auth_sessions | `{ userId: 1, status: 1, expiresAt: 1 }` | account-wide revoke |
| auth_sessions | `{ expiresAt: 1 } expireAfterSeconds: 0` | cleanup |
| auth_login_states | `{ identityKey: 1 } unique` | atomic cooldown |
| auth_login_states | `{ expiresAt: 1 } TTL` | cleanup |
| teacher_invitations | `{ tokenHash: 1 } unique` | preview/accept |
| teacher_invitations | `{ email: 1 } unique partial(status=PENDING)` | tối đa một pending invitation/email |
| teacher_invitations | `{ email: 1, status: 1, expiresAt: -1 }` | history/conflict lookup |
| teacher_invitations | `{ status: 1, createdAt: -1, _id: 1 }` | Admin list |
| audit_logs | `{ createdAt: -1 }` | newest audit |
| audit_logs | `{ actorId: 1, createdAt: -1 }` | actor review |
| audit_logs | `{ resourceType: 1, resourceId: 1, createdAt: -1 }` | resource history |
| audit_logs | `{ actorId: 1, action: 1, idempotencyKey: 1 } unique partial(idempotencyKey exists)` | copy event idempotency |
| system_guards | `{ _id: 1 } unique` | fixed invariant guard |

MongoDB index name phải explicit để migration/index review dễ theo dõi. Pending invitation index có tên `uq_teacher_invitation_pending_email` và `partialFilterExpression: { status: "PENDING" }`.

## 9. State And Uniqueness Rules

- Email unique ở database và service; duplicate key map `409 DUPLICATE_RESOURCE`.
- Một email không có hơn một `PENDING` invitation nhờ unique partial index. Create transaction phải chuyển stale PENDING sang EXPIRED trước khi insert replacement; duplicate-key race map về `INVITATION_ALREADY_PENDING` sau khi đọc trạng thái hiện tại.
- Active Teacher hiện hữu chặn invitation mới.
- Invitation accept dùng filter `_id + status=PENDING + expiresAt>=now`; update count phải đúng 1.
- Token hash collision/duplicate phải fail trước response; raw token không được reuse.
- Final active Super Admin check và target update phải chạy trong transaction có `system_guards/super-admin-governance` để chống write skew.

## 10. Transaction Plan

| Use case | Collections | Atomic outcome |
| --- | --- | --- |
| Accept invitation | users, teacher_invitations, audit_logs | Teacher ACTIVE + invitation ACCEPTED + audit hoặc không gì thay đổi |
| Change status | users, auth_sessions, audit_logs | status + session revoke + audit nhất quán |
| Change role | system_guards, users, audit_logs | serialized valid transition + audit; no self/final-admin conflict |
| Super Admin status | system_guards, users, auth_sessions, audit_logs | serialized invariant + revoke + audit |
| Revoke invitation | teacher_invitations, audit_logs | PENDING -> REVOKED + audit |
| Create replacement invitation | teacher_invitations, audit_logs | stale expiry + unique pending insert + audit |
| Record invitation copy | teacher_invitations, audit_logs | idempotent copy metadata + one audit event |

Mongo transient transaction error có bounded retry trong data layer; không retry vô hạn và không phát raw token mới trong retry response.

## 11. Migration And Compatibility

P02 là lần đầu tạo business collections, nhưng vẫn cần versioned script:

1. Validate Mongo replica set/connectivity.
2. Create collections/indexes idempotently.
3. Seed permission catalog chỉ nếu persistence được chọn; baseline hiện dùng source constants.
4. Upsert fixed `system_guards/super-admin-governance` idempotently.
5. Bootstrap synthetic/local accounts bằng command riêng, không chạy tự động khi API start.
6. Verify index name/options/partial filter trong Local/CI.

Rollback code không được tự drop collections. Data rollback cần script/review riêng, ưu tiên forward fix.

## 12. Data Test Matrix

- Duplicate normalized email với khác case/space.
- Password hash excluded from every list/detail/me response.
- Session rotate/reuse/family revoke và TTL metadata.
- Concurrent register cùng email.
- Concurrent invitation accept cùng token.
- Concurrent invitation create cùng email chỉ tạo một PENDING record.
- Concurrent demote/block trên nhiều Super Admin không thể làm active count về 0.
- Refresh race trong grace không revoke; replay ngoài grace revoke family.
- Expired/revoked/accepted/email mismatch invitation không tạo User.
- Role-specific pagination không lẫn role ở page boundary.
- Status transaction revoke session và tạo AuditLog.
- Audit model từ chối update/delete repository path.
- Gửi lại cùng copy `eventId` không tạo AuditLog/copyCount trùng.
