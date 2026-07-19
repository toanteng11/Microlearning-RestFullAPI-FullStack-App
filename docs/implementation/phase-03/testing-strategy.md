# Phase 03 Testing Strategy

## 1. Test Objective

Chứng minh Classroom/Enrollment đúng happy path, error path, object authorization, credential secrecy, state transition, transaction, retry và concurrent behavior. UI ẩn button không thay thế direct API negative test.

## 2. Test Levels

| Level                  | Tool                                  | Scope                                                              |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Unit                   | Vitest                                | normalization, HMAC/hash, lifecycle, precedence, DTO, query parser |
| Service                | Vitest + fakes                        | owner/access/state/audit/idempotency outcomes                      |
| Repository integration | Vitest + real Mongo rs0               | indexes, CAS, pagination, projection                               |
| API integration        | Supertest + real Mongo rs0            | HTTP/auth/rate/transaction/errors                                  |
| React component        | Testing Library/MSW contract fixtures | forms, route state, tables, dialogs                                |
| Browser E2E            | Playwright Chromium                   | full Teacher/Student/Admin journeys                                |
| Contract               | Swagger Parser + route catalog        | OpenAPI completeness/safety                                        |
| DevSecOps              | audit/secret/log scan                 | raw exposure/dependencies/secrets                                  |

## 3. Classroom Scenario Matrix

| Scenario                                 | Expected                                                |
| ---------------------------------------- | ------------------------------------------------------- |
| ACTIVE Teacher creates valid Classroom   | Owner actor, ACTIVE/OPEN, optional initial code, audit  |
| Client injects owner/status/memberCount  | 422, no Classroom                                       |
| Non-ACTIVE Teacher creates               | Denied, no data                                         |
| Teacher lists Classroom                  | Only owned, paginated/stable                            |
| Student lists Classroom                  | Only own ACTIVE Enrollment scope                        |
| Teacher accesses another owner Classroom | 404/403 safe, no projection                             |
| Update stale expectedUpdatedAt           | 409, no overwrite/audit                                 |
| Archive                                  | Soft ARCHIVED + audit, Enrollment retained, join denied |
| Open/close enrollment                    | State/policy effective behavior correct                 |

## 4. Credential Scenarios

| Scenario                       | Expected                                               |
| ------------------------------ | ------------------------------------------------------ |
| Initial/regenerate Class Code  | Format valid, DB digest only, raw once                 |
| Concurrent regenerate          | One ACTIVE code, stale request conflict                |
| Old/disabled code              | Join denied, no Enrollment                             |
| Create/regenerate Invite Link  | One ACTIVE, hash-only, raw once, expiry correct        |
| Public preview valid           | Minimal projection + no-store                          |
| Invalid/expired/disabled token | Safe error, no private data                            |
| URL cleanup                    | Browser URL contains no token before preview completes |
| List/detail credential         | No raw/digest/reconstructable link                     |

## 5. Join Scenarios

| Scenario                          | Expected                                         |
| --------------------------------- | ------------------------------------------------ |
| Guest direct join                 | 401, no Enrollment/Audit success                 |
| Teacher/Admin direct join         | 403, no Enrollment                               |
| Student BLOCKED/INACTIVE          | denied                                           |
| Global Code/Link policy off       | denied regardless local setting                  |
| Classroom method off              | denied                                           |
| Classroom CLOSED/LOCKED/ARCHIVED  | denied                                           |
| Valid Code                        | one ACTIVE Enrollment, joinedBy CLASS_CODE       |
| Valid Link                        | one ACTIVE Enrollment, joinedBy INVITE_LINK      |
| Retry ACTIVE                      | 200 alreadyEnrolled true, no second record/audit |
| Historical REMOVED                | 409 REJOIN_NOT_ALLOWED                           |
| Credential wrong method/Classroom | denied                                           |
| Failure during audit/transaction  | rollback Enrollment                              |

## 6. Roster And Governance

- Owner roster safe projection/pagination/filter/sort.
- Wrong owner/Student/Teacher non-owner denied.
- Remove ACTIVE -> REMOVED with reason/audit.
- Remove retry/stale update conflict, no duplicate audit.
- Removed Student cannot open Classroom.
- Policy update revision/audit and global precedence.
- Admin governance list/detail permission/projection với required ACTIVE `memberCount`, không credential/roster/content count.
- Teacher block with active owned Classroom denied atomically; archived owner no longer blocks.
- Optional transfer/lock tests only when Should implemented.

## 7. Concurrency Matrix

Run on real Mongo replica set:

| Test                              | Parallel operations      | Invariant                                                       |
| --------------------------------- | ------------------------ | --------------------------------------------------------------- |
| Same Student same Code            | 20 join requests         | One Enrollment, all responses valid semantic                    |
| Same Student Code/Link            | 10 + 10                  | One Enrollment; joinedBy winner only                            |
| Different Students same Classroom | 20                       | One per Student, no cross-link                                  |
| Regenerate same code              | 10                       | One new ACTIVE credential                                       |
| Regenerate link vs join old link  | 2                        | Outcome ordered/consistent; no join after terminal state commit |
| Archive vs join                   | 2                        | No partial; final state obeys transaction/order contract        |
| Policy disable vs join            | 2                        | No partial; post-disable request denied                         |
| Remove vs Student access          | 2                        | After removal commit access denied                              |
| Concurrent settings update        | 2 same expectedUpdatedAt | One winner, one 409                                             |

## 8. Index And Data Integrity

- Verify exact index name/key/unique/partial options.
- Duplicate Enrollment insert fails at DB.
- Two ACTIVE code/link per Classroom fail.
- Duplicate digest/hash fail.
- Safe DTO excludes digest/hash/internal metadata.
- Archive/remove does not cascade delete Enrollment/Audit.
- Policy singleton bootstrap idempotent.

## 9. Negative Authorization Matrix

| Actor                      | Attempt                                  | Expected           |
| -------------------------- | ---------------------------------------- | ------------------ |
| Guest                      | protected Classroom/roster/join mutation | 401                |
| Student A                  | Classroom of Student B/non-enrolled      | 403/404            |
| Student                    | roster/settings/create                   | 403                |
| Teacher A                  | Teacher B detail/settings/roster         | 403/404            |
| Teacher                    | Admin policy/governance                  | 403                |
| Admin without permission   | policy update/transfer                   | 403                |
| Blocked actor with old JWT | any protected P03 route                  | ACCOUNT_NOT_ACTIVE |

## 10. Rate/Redaction/Security Tests

- Burst preview/join reaches configured 429 without partial Enrollment.
- Invalid and valid credential response timing/message do not expose unnecessary detail.
- Logger/runtime output absent raw code/token/full invite URL.
- Audit metadata absent raw/digest.
- Access/local/session storage absent access token and persisted join credential after completion.
- NoSQL operator/object input rejected by strict schema.
- Production error has no stack/query/index value.

## 11. OpenAPI Tests

- Parser pass.
- Exact P03 route-method catalog coverage.
- Security declaration public/protected correct.
- Strict request schemas and enums/bounds.
- Representative 401/403/404/409/422/429.
- Components do not expose `codeDigest`, `tokenHash`, raw secret fields.
- Swagger UI loads with `persistAuthorization=false`.

## 12. Component Tests

- Teacher list/create/settings/roster states.
- Effective global-vs-local settings rendering.
- One-time copy and confirm dialogs.
- Student Code join normalization/errors/idempotent success.
- Invite URL cleanup, auth context restore/revalidate/clear.
- Admin policy revision conflict/governance list.
- Back/Forward/breadcrumb query preservation.

## 13. E2E Journeys

### E2E-P03-01 Teacher Create And Share Code

Teacher Login -> Create Classroom -> copy initial/regenerated Code -> close/open enrollment -> verify settings/detail.

### E2E-P03-02 Student Join By Code

Student Login -> Join Code -> Classroom detail -> retry Code -> no duplicate -> Teacher roster sees Student.

### E2E-P03-03 Invite Link With Authentication Context

Guest opens link -> URL token removed -> Register/Login or existing Student Login -> preview revalidated -> Join -> Classroom detail -> token cleared.

### E2E-P03-04 Roster Removal

Teacher removes Student with reason -> roster updates -> Student old session denied Classroom -> data record REMOVED.

### E2E-P03-05 Admin Policy

Admin disables Code -> Student join denied -> existing Student retained -> Admin enables -> valid new join succeeds; audit verified through repository/API test.

### E2E-P03-06 Direct URL RBAC

Student opens Teacher/Admin route; Teacher opens another Teacher resource; UI/API deny with no data.

## 14. Responsive/Accessibility Review

- Desktop/mobile Teacher list/settings/roster, Student join/list/detail, Admin policy/governance.
- No overflow/overlap at 320, 375, 768, 1440 widths.
- Labels, focus order, dialogs, status and keyboard navigation.
- Browser console no error; URL/storage scan no credential.

## 15. CI Gate

| Gate                    | Pass condition                                               |
| ----------------------- | ------------------------------------------------------------ |
| Quality                 | lint, negative lint, format, typecheck, unit coverage, build |
| Mongo                   | all P03 real transaction/index/concurrency tests             |
| OpenAPI                 | parse + exact route coverage + no secret fields              |
| Browser                 | all Must P03 E2E journeys                                    |
| Security                | role/owner/rate/redaction tests                              |
| Audit/dependency/secret | no high prod vulnerability or secret detection               |

Không giảm P02 coverage threshold để làm xanh P03. Must test không skip/quarantine im lặng.

## 16. Evidence

Test report phải ghi commit, environment, suite counts và sanitized result. Screenshot/log/artifact không chứa working Code/Token, User thật hoặc cookie value.
