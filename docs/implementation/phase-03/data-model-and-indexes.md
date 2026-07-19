# Phase 03 Data Model And Indexes

## 1. Modeling Principles

- Classroom giữ metadata/settings nhỏ; không embed roster.
- Enrollment là source of truth membership.
- Credential tách collection để giữ lifecycle/history và không làm lộ raw value.
- Policy singleton có revision/CAS.
- MongoDB replica set bắt buộc cho multi-collection transaction.
- Mọi response map sang DTO; không trả Mongoose document.

## 2. Collection `classrooms`

| Field                    | Type          | Required | Rule                                                                                |
| ------------------------ | ------------- | -------- | ----------------------------------------------------------------------------------- |
| `_id`                    | ObjectId      | Yes      | Generated                                                                           |
| `name`                   | string        | Yes      | Trim/collapse whitespace, 2-120                                                     |
| `nameNormalized`         | string        | Yes      | Search only, server generated                                                       |
| `description`            | string/null   | No       | Max 1000                                                                            |
| `subject`                | string/null   | No       | Max 120                                                                             |
| `section`                | string/null   | No       | Max 120                                                                             |
| `ownerTeacherId`         | ObjectId      | Yes      | User TEACHER/ACTIVE at create/transfer                                              |
| `status`                 | enum          | Yes      | ACTIVE/LOCKED/ARCHIVED                                                              |
| `enrollmentStatus`       | enum          | Yes      | OPEN/CLOSED/LOCKED                                                                  |
| `allowClassCodeJoin`     | boolean       | Yes      | Classroom setting; default true                                                     |
| `allowInviteLinkJoin`    | boolean       | Yes      | Classroom setting; default true                                                     |
| `studentInteractionMode` | enum          | No       | Conditional Should; không persist/accept ở Must contract khi chưa được phê duyệt    |
| `archivedAt/archivedBy`  | Date/ObjectId | No       | Set on archive                                                                      |
| `lockReason`             | string/null   | No       | Governance lock only                                                                |
| `createdAt/updatedAt`    | Date          | Yes      | UTC timestamps                                                                      |

### Indexes

| Name                                 | Key                                                    | Purpose                  |
| ------------------------------------ | ------------------------------------------------------ | ------------------------ |
| `ix_classrooms_owner_status_updated` | `{ ownerTeacherId:1, status:1, updatedAt:-1, _id:-1 }` | Teacher list             |
| `ix_classrooms_status_created`       | `{ status:1, createdAt:-1, _id:-1 }`                   | Admin governance         |
| `ix_classrooms_owner_name`           | `{ ownerTeacherId:1, nameNormalized:1, _id:1 }`        | Owned prefix search      |
| `ix_classrooms_name_status`          | `{ nameNormalized:1, status:1, _id:1 }`                | Governance prefix search |

## 3. Collection `enrollments`

| Field                             | Type          | Required | Rule                                       |
| --------------------------------- | ------------- | -------- | ------------------------------------------ |
| `_id`                             | ObjectId      | Yes      | Stable membership identity                 |
| `classroomId`                     | ObjectId      | Yes      | Classroom reference                        |
| `studentId`                       | ObjectId      | Yes      | User STUDENT                               |
| `status`                          | enum          | Yes      | ACTIVE/REMOVED/LEFT/BLOCKED                |
| `joinedBy`                        | enum          | Yes      | CLASS_CODE/INVITE_LINK                     |
| `joinedAt`                        | Date          | Yes      | Server time                                |
| `sourceCredentialId`              | ObjectId/null | No       | Safe ClassCode/InviteLink record reference |
| `removedAt/removedBy`             | Date/ObjectId | No       | Removal metadata                           |
| `removalReason`                   | string/null   | No       | 3-500 when removed                         |
| `rejoinAllowedAt/rejoinAllowedBy` | Date/ObjectId | No       | Reserved Should; service ignores in Must   |
| `createdAt/updatedAt`             | Date          | Yes      | UTC timestamps                             |

### Indexes

| Name                                      | Key                                                | Options/Purpose           |
| ----------------------------------------- | -------------------------------------------------- | ------------------------- |
| `uq_enrollments_classroom_student`        | `{ classroomId:1, studentId:1 }`                   | Unique natural membership |
| `ix_enrollments_classroom_status_joined`  | `{ classroomId:1, status:1, joinedAt:-1, _id:-1 }` | Roster                    |
| `ix_enrollments_student_status_updated`   | `{ studentId:1, status:1, updatedAt:-1, _id:-1 }`  | Student Classroom list    |
| `ix_enrollments_student_classroom_status` | `{ studentId:1, classroomId:1, status:1 }`         | Access check              |

## 4. Collection `class_codes`

| Field                   | Type          | Required | Rule                                      |
| ----------------------- | ------------- | -------- | ----------------------------------------- |
| `classroomId`           | ObjectId      | Yes      | Reference                                 |
| `codeDigest`            | string        | Yes      | HMAC-SHA256 hex/base64url; never response |
| `maskedCode`            | string        | Yes      | Example `****-EFGH`                       |
| `status`                | enum          | Yes      | ACTIVE/DISABLED/REGENERATED/EXPIRED       |
| `generatedBy`           | ObjectId      | Yes      | Owner Teacher/System actor                |
| `generatedAt`           | Date          | Yes      | Server time                               |
| `disabledAt/disabledBy` | Date/ObjectId | No       | Terminal metadata                         |
| `replacedById`          | ObjectId/null | No       | Link history, no raw                      |
| `expiresAt`             | Date/null     | No       | Null in Must unless policy changes        |
| `createdAt/updatedAt`   | Date          | Yes      | UTC                                       |

### Indexes

| Name                               | Key                               | Options                            |
| ---------------------------------- | --------------------------------- | ---------------------------------- |
| `uq_class_codes_digest`            | `{ codeDigest:1 }`                | unique                             |
| `uq_class_codes_active_classroom`  | `{ classroomId:1, status:1 }`     | unique partial `{status:'ACTIVE'}` |
| `ix_class_codes_classroom_created` | `{ classroomId:1, createdAt:-1 }` | history                            |

## 5. Collection `classroom_invite_links`

| Field                   | Type          | Required | Rule                                |
| ----------------------- | ------------- | -------- | ----------------------------------- |
| `classroomId`           | ObjectId      | Yes      | Reference                           |
| `tokenHash`             | string        | Yes      | SHA-256; never response/log         |
| `status`                | enum          | Yes      | ACTIVE/DISABLED/REGENERATED/EXPIRED |
| `createdBy`             | ObjectId      | Yes      | Owner Teacher                       |
| `expiresAt`             | Date          | Yes      | Default 30 days, request 1-90       |
| `disabledAt/disabledBy` | Date/ObjectId | No       | Terminal metadata                   |
| `replacedById`          | ObjectId/null | No       | History                             |
| `createdAt/updatedAt`   | Date          | Yes      | UTC                                 |

### Indexes

| Name                                          | Key                               | Options                                  |
| --------------------------------------------- | --------------------------------- | ---------------------------------------- |
| `uq_classroom_invite_links_hash`              | `{ tokenHash:1 }`                 | unique                                   |
| `uq_classroom_invite_links_active_classroom`  | `{ classroomId:1, status:1 }`     | unique partial ACTIVE                    |
| `ix_classroom_invite_links_expiry`            | `{ status:1, expiresAt:1 }`       | expiry evaluation; không TTL hard-delete |
| `ix_classroom_invite_links_classroom_created` | `{ classroomId:1, createdAt:-1 }` | history                                  |

Không dùng TTL index vì expired record cần giữ audit/history. Service materialize `EXPIRED` khi đọc/mutation hoặc scheduled cleanup tương lai.

## 6. `system_settings` Enrollment Policy

```json
{
  "key": "ENROLLMENT_POLICY",
  "value": {
    "allowClassCodeJoin": true,
    "allowInviteLinkJoin": true,
    "defaultInviteLinkLifetimeDays": 30
  },
  "revision": 1,
  "updatedBy": "ObjectId",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes: unique `{key:1}` named `uq_system_settings_key`. Existing collection/model có thể được tạo mới trong P03; migration/bootstrap phải idempotent và không overwrite configured value.

## 7. Transaction Matrix

| Use case           | Documents                                                     | Invariant                  |
| ------------------ | ------------------------------------------------------------- | -------------------------- |
| Create Classroom   | Classroom + optional ClassCode + AuditLog                     | All-or-nothing             |
| Rotate credential  | old + new credential + AuditLog                               | One ACTIVE per Classroom   |
| Disable credential | credential + AuditLog                                         | State/audit consistent     |
| Join               | Enrollment + AuditLog; reads Policy/Classroom/Credential/User | One membership, no partial |
| Remove Student     | Enrollment + AuditLog                                         | Access revoke/audit atomic |
| Policy update      | SystemSetting + AuditLog                                      | CAS revision/audit atomic  |
| Archive            | Classroom + AuditLog                                          | State/audit atomic         |
| Governance lock    | Classroom + AuditLog                                          | Conditional Should only    |
| Ownership transfer | Classroom + AuditLog                                          | Valid owner and history    |

## 8. Query Patterns

| Query                  | Strategy                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Teacher Classroom list | owner/status index, prefix normalized keyword, projection                                      |
| Student Classroom list | Enrollment student/status index -> Classroom lookup                                            |
| Classroom access check | unique enrollment pair + Classroom state                                                       |
| Roster                 | Enrollment classroom/status index -> safe User lookup; pagination before lookup where possible |
| Admin governance       | Classroom status/name/owner indexes + required ACTIVE Enrollment `memberCount` aggregation     |
| Code join              | HMAC digest unique lookup                                                                      |
| Link preview/join      | token hash unique lookup                                                                       |

`memberCount` là số Enrollment `ACTIVE`, required trong Admin governance projection và được aggregate theo Classroom. Count không được sort/filter trong Phase 03. Với list nhiều Classroom dùng grouped aggregation; chỉ denormalize counter sau ADR và reconciliation strategy. `contentCount` không được trả ở Phase 03.

## 9. Validation And Error Mapping

| Constraint                   | Domain error                                         |
| ---------------------------- | ---------------------------------------------------- |
| Invalid name/status/settings | `VALIDATION_ERROR`                                   |
| Invalid Teacher owner        | `INVALID_TEACHER_OWNER`                              |
| Duplicate active credential  | `CREDENTIAL_STATE_CONFLICT`                          |
| Duplicate Enrollment         | Resolve idempotent ACTIVE hoặc `REJOIN_NOT_ALLOWED`  |
| Stale updatedAt/revision     | `CONCURRENT_MODIFICATION`                            |
| Invalid credential           | `INVALID_CLASS_CODE` / generic `INVITE_LINK_INVALID` |
| Policy/method off            | `JOIN_METHOD_DISABLED`                               |

Mongo duplicate-key raw message/index value không đi ra response.

## 10. Migration And Startup

1. Add models/index definitions without dropping existing collections.
2. `syncIndexes` chỉ dùng test/development controlled; Production dùng reviewed migration/index command.
3. Bootstrap Enrollment Policy bằng upsert `$setOnInsert`.
4. Verify exact named indexes trong integration test.
5. Seed synthetic P03 data idempotently.
6. Rollback code phải tương thích collections mới; không tự drop dữ liệu.

## 11. Retention And Deletion

- Classroom, Enrollment và credential history dùng archive/terminal state.
- Hard delete không thuộc MVP.
- Raw credential không được retention vì không lưu.
- AuditLog retention theo BA/operations policy; user deletion không cascade learning/audit history.
