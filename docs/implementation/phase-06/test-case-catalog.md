# Phase 06 Test Case Catalog

## 1. Unit Policy Cases `P06-UT-001..020`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-UT-001 | Required count no activity | `0` |
| P06-UT-002 | Progress denominator 0 | `null` |
| P06-UT-003 | Process score formula | Equals progress V1 |
| P06-UT-004 | Rounding boundary | One-decimal half-up |
| P06-UT-005 | Draft activity | Excluded |
| P06-UT-006 | Late completion | Completed + late count |
| P06-UT-007 | Missing after effective deadline | Missing count |
| P06-UT-008 | Deadline exception | Per-Student status |
| P06-UT-009 | Draft Grade | Excluded from Student average |
| P06-UT-010 | Weighted-by-points average | Correct result |
| P06-UT-011 | No returned Grade | `null` |
| P06-UT-012 | Rank default | Stable required order |
| P06-UT-013 | Null score | Sorted last |
| P06-UT-014 | Gradebook state dimensions/display precedence | Completion và grading không ghi đè nhau |
| P06-UT-015 | Fresh/stale | Correct watermark logic |
| P06-UT-016 | Partial state | Failed count preserved |
| P06-UT-017 | Date/timezone range | Correct boundaries |
| P06-UT-018 | CSV formula values | Neutralized |
| P06-UT-019 | Event unknown property/PII | Rejected |
| P06-UT-020 | Definition mismatch | Rebuild/error path |

## 2. Mongo/API Integration Cases `P06-IT-001..060`

### 2.1 Foundation `001..010`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-IT-001 | Summary unique scope/version | Duplicate blocked |
| P06-IT-002 | Ranking index/query | Stable indexed page |
| P06-IT-003 | Summary invariant invalid | Validation failure |
| P06-IT-004 | Optimistic revision conflict | Controlled conflict/retry |
| P06-IT-005 | Invalidation same scope/multiple reasons repeated | Dedupe reasons, newest watermark, revision increment |
| P06-IT-006 | Course invalidation | Supersedes Student scopes |
| P06-IT-007 | Claim timeout/new source upsert during processing | Recoverable; stale worker CAS cannot resolve new intent |
| P06-IT-008 | Migration twice | Idempotent |
| P06-IT-009 | Conditional TTL off | Collection/index absent or inactive |
| P06-IT-010 | No PII in summary | Projection/schema Pass |

### 2.2 Refresh/Reconcile `011..020`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-IT-011 | Rebuild one Student | Exact source summary |
| P06-IT-012 | Rebuild Course batch | All active roster |
| P06-IT-013 | Student removed | Orphan handled |
| P06-IT-014 | Activity required changed | Course summaries stale/rebuilt |
| P06-IT-015 | Source changes during refresh | Watermark retry |
| P06-IT-016 | Production composition + source transaction/invalidation + refresh failure | One real writer is injected; source and intent commit atomically; later refresh failure does not rollback source |
| P06-IT-017 | Missing summary | Rebuild/not-ready contract |
| P06-IT-018 | Tampered summary | Reconcile detects |
| P06-IT-019 | Repair mode | Summary fixed, source unchanged |
| P06-IT-020 | Version activation | Old/new not mixed |

### 2.3 Student `021..028`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-IT-021 | Student Dashboard | Scoped actionable summary |
| P06-IT-022 | To-do mixed types | P05 V2 preserved |
| P06-IT-023 | Own Course progress | Correct metric/freshness |
| P06-IT-024 | All-Course pagination | Bounded/stable |
| P06-IT-025 | Returned vs draft Grade | Only returned visible |
| P06-IT-026 | Student A Course B | No data leak |
| P06-IT-027 | Denominator 0 | `null/N/A` contract |
| P06-IT-028 | Trend insufficient/incompatible | `NO_DATA` |

### 2.4 Teacher `029..042`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-IT-029 | Owned Dashboard | Correct summary |
| P06-IT-030 | Other Teacher Course | Denied/not found |
| P06-IT-031 | Ranking default | processScore DESC stable |
| P06-IT-032 | Ranking pagination | No duplicate/skip |
| P06-IT-033 | Search/filter | Scoped, normalized |
| P06-IT-034 | Unknown sort | 400 |
| P06-IT-035 | Student detail roster | Correct |
| P06-IT-036 | Student not roster | Denied/no enumeration |
| P06-IT-037 | Activity analysis | Counts/rates correct |
| P06-IT-038 | Assessment analysis | Returned/finalized policy |
| P06-IT-039 | Gradebook columns/rows | Bounded/order correct |
| P06-IT-040 | Gradebook cell dimensions | Late/returned và other combinations đúng |
| P06-IT-041 | Deadline exception/regrade | Refresh correct fields |
| P06-IT-042 | No N+1 query shape | Bounded batch |

### 2.5 Admin `043..050`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-IT-043 | Governance counts | Correct role/status/source |
| P06-IT-044 | Invitation/Classroom/Course | Correct lifecycle counts |
| P06-IT-045 | Date/status filter | Bounded/scoped |
| P06-IT-046 | Non-Admin access | Denied |
| P06-IT-047 | Raw Grade/Submission attempt | Denied/no fields |
| P06-IT-048 | Small group | Suppressed |
| P06-IT-049 | Super Admin | Same redaction |
| P06-IT-050 | Sensitive view audit | Safe AuditLog |

### 2.6 Conditional/Security `051..060`

| ID | Scenario | Expected |
| --- | --- | --- |
| P06-IT-051 | Export flag off | Static role permission unchanged; action absent and route feature disabled |
| P06-IT-052 | Teacher CSV owned | Correct projection |
| P06-IT-053 | Cross-Course export | Denied |
| P06-IT-054 | CSV row/date/column limit | 422 |
| P06-IT-055 | CSV injection payload | Neutralized |
| P06-IT-056 | Export audit | Request/result metadata |
| P06-IT-057 | Event duplicate | Idempotent |
| P06-IT-058 | Event actor spoof/PII | Override/reject |
| P06-IT-059 | Event storage failure | Business flow unaffected |
| P06-IT-060 | Query operator injection | 400/no query execution |

## 3. OpenAPI Cases

- Every P06 runtime route documented.
- Security/permission descriptions.
- Pagination/filter/sort enums.
- Nullable score/progress.
- Freshness/no-data/partial examples.
- Error catalog examples.
- CSV response/content type.
- Conditional feature behavior.
- Runtime route/OpenAPI parity.
- P04/P05 moved paths có đúng một runtime handler/OpenAPI operation.
- P05 Gradebook flag/operation không còn sau P06 cutover.

## 4. React Cases

| ID | Scenario |
| --- | --- |
| P06-WEB-001 | Student Dashboard loading/ready/empty |
| P06-WEB-002 | Student null/stale/partial |
| P06-WEB-003 | Student progress URL/filter |
| P06-WEB-004 | Teacher Dashboard summary |
| P06-WEB-005 | Ranking server sort/page |
| P06-WEB-006 | Student detail Back retains filters |
| P06-WEB-007 | Activity/assessment tabs |
| P06-WEB-008 | Gradebook empty/long/responsive |
| P06-WEB-009 | Admin governance/suppressed |
| P06-WEB-010 | Error/forbidden clears data |
| P06-WEB-011 | Conditional actions hidden |
| P06-WEB-012 | Export blob lifecycle |
| P06-WEB-013 | Logout cache clear |
| P06-WEB-014 | Keyboard/ARIA/sort |
| P06-WEB-015 | Long text/no overlap |

## 5. Browser E2E `P06-E2E-01..12`

| ID | Journey |
| --- | --- |
| P06-E2E-01 | Student login -> Dashboard -> pending activity |
| P06-E2E-02 | Complete activity -> To-do/progress refresh |
| P06-E2E-03 | Student returned Grade privacy |
| P06-E2E-04 | Student cross-account blocked |
| P06-E2E-05 | Teacher Course Dashboard/ranking |
| P06-E2E-06 | Teacher filter/page/detail/Back |
| P06-E2E-07 | Teacher Gradebook statuses |
| P06-E2E-08 | Teacher cross-Course blocked |
| P06-E2E-09 | Deadline exception/regrade recalculation |
| P06-E2E-10 | Admin governance metadata |
| P06-E2E-11 | Small-group/raw-data privacy |
| P06-E2E-12 | Conditional CSV safe hoặc disabled path |

## 6. Performance Cases

| ID | Dataset/target |
| --- | --- |
| P06-PERF-001 | Student Dashboard p95 <=1500ms API, usable <=2.5s |
| P06-PERF-002 | Teacher Dashboard 100x50 p95 <=1500ms |
| P06-PERF-003 | Ranking page <=1000ms |
| P06-PERF-004 | Gradebook page bounded <=1500ms target |
| P06-PERF-005 | Course rebuild batch memory/time evidence |
| P06-PERF-006 | Admin/Audit indexed filter <=1200ms |

## 7. Command Matrix

```text
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run test:coverage
npm run test:integration
npm run test:openapi
npm run build
npm run test:e2e
npm run check:ci
docker compose up -d --build
```

## 8. Evidence Per Group

Lưu commit, command, environment, fixture size, pass/fail count, duration và report URL/path.
