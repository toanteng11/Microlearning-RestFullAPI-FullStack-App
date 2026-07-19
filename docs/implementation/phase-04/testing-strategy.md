# Phase 04 Testing Strategy

## 1. Test Objectives

Xác minh đúng nghiệp vụ, authorization theo object, consistency khi concurrent mutation, an toàn content và trải nghiệm Teacher-to-Student. Test coverage không chỉ đếm dòng; các invariant/risk cao phải có negative và race tests.

## 2. Test Layers

| Layer | Công cụ hiện tại | Mục tiêu P04 |
| --- | --- | --- |
| Static | ESLint, TypeScript, Prettier | Boundary/type/format |
| Unit | Vitest | Pure lifecycle/deadline/visibility/order/metric |
| Repository integration | Vitest + Mongo replica set | Index/query/upsert/transaction |
| API integration | Supertest/Vitest pattern hiện có | Auth, schema, response/error, side effect |
| OpenAPI contract | Existing OpenAPI test | Path/method/schema/examples parity |
| React component | Vitest + Testing Library | Form/state/accessibility/render safety |
| Browser E2E | Playwright | Critical real-stack journeys |
| Security | Targeted automated tests | IDOR/XSS/URL/log redaction |
| Performance | Script/integration benchmark | Dashboard/To-do baseline |

## 3. Test Data Personas

| Persona | State | Use |
| --- | --- | --- |
| Teacher Owner A | ACTIVE, owns Classroom A | Positive authoring/dashboard |
| Teacher B | ACTIVE, owns Classroom B | Foreign-owner negative |
| Teacher Disabled | SUSPENDED/INACTIVE | Session/account guard |
| Student High | ACTIVE enrollment A, high completion | Ranking |
| Student Mid | ACTIVE enrollment A, partial | To-do/in-progress |
| Student None | ACTIVE enrollment A, no progress | Not started/missing |
| Student Removed | Removed enrollment A | Access/history negative |
| Admin | ACTIVE | Governance read/no authoring |
| Super Admin | ACTIVE | Permission coverage, invariant still applies |

## 4. Unit Test Catalog

| ID range | Subject | Cases |
| --- | --- | --- |
| `P04-UT-001..012` | Lifecycle | Every allowed/forbidden transition, archived terminal |
| `P04-UT-013..018` | Effective schedule | Before/equal/after, missing timestamp |
| `P04-UT-019..028` | Publish prerequisite | Content/deadline/ancestor/flashcard boundaries |
| `P04-UT-029..038` | Deadline | Set/clear/extend/shorten/reason/revision |
| `P04-UT-039..047` | Derived status | Not started/in progress/missing/completed/late boundaries |
| `P04-UT-048..055` | Ordering | Exact set, duplicate, missing, foreign, canonical order |
| `P04-UT-056..063` | Visibility | Role, enrollment and ancestor matrix |
| `P04-UT-064..070` | Metrics | Denominator zero, ranking ties, metric version |
| `P04-UT-071..076` | Markdown/URL | Unsafe HTML/scheme/size/normalization |

Pure tests dùng injected clock; không phụ thuộc thời gian máy chạy.

## 5. Repository And Transaction Tests

| ID | Scenario | Assertion |
| --- | --- | --- |
| `P04-DB-001` | Index manifest | Name/key/options đúng |
| `P04-DB-002` | Course list | Index-backed stable pagination |
| `P04-DB-003` | Structure query | Canonical Module/Lesson order |
| `P04-DB-004` | Reorder transaction success | All order + revision commit |
| `P04-DB-005` | Reorder injected failure | No partial child update |
| `P04-DB-006` | Deadline transaction success | Lesson/history/audit consistent |
| `P04-DB-007` | Deadline injected failure | Full rollback |
| `P04-DB-008` | Concurrent deadline | One success, one revision conflict |
| `P04-DB-009` | First completion | One progress record |
| `P04-DB-010` | 20 concurrent completes | One completedAt/side effect |
| `P04-DB-011` | Archive preservation | Progress/history remain |
| `P04-DB-012` | To-do aggregation | Correct include/exclude/sort |
| `P04-DB-013` | Dashboard aggregation | Correct metrics/ranking |
| `P04-DB-014` | Cross-Course reference | Rejected/no partial write |

## 6. API Test Matrix

Mỗi endpoint Must ít nhất có:

1. Positive owner/enrolled case.
2. Missing auth `401`.
3. Wrong coarse role `403`.
4. Foreign object/guessed ID behavior.
5. Validation boundary `422`.
6. Lifecycle/concurrency conflict nếu là mutation.
7. Response envelope/schema/header assertion.
8. Database side-effect/no-side-effect assertion.

Special assertions:

- Student DTO không chứa `ownerTeacherId`, audit fields, draft content hoặc deadline reason.
- GET Lesson không tạo progress.
- Start/complete first and retry status code semantics.
- `204` archive response không body.
- `Cache-Control: private, no-store` ở sensitive routes.
- Request ID hiện diện và error envelope đồng nhất.

## 7. Authorization Matrix Tests

Resources: Course, Module, Lesson, Flashcard, Deadline history, Announcement, Progress.

Actors:

- Owner Teacher.
- Foreign Teacher.
- Enrolled Student.
- Non-enrolled Student.
- Removed Student.
- Admin.
- Super Admin.

Test cả read và mutation. Không chỉ kiểm tra permission middleware; dùng real object chain để bắt IDOR.

## 8. Frontend Component Tests

| ID range | Area | Required behavior |
| --- | --- | --- |
| `P04-WEB-001..008` | Course list/form | states, validation, create redirect, conflict |
| `P04-WEB-009..018` | Course Dashboard | tabs, rank, pagination, metric label |
| `P04-WEB-019..030` | Lesson editor | dirty guard, publish lock, preview, deadline |
| `P04-WEB-031..038` | Flashcards | add/edit/archive/reorder/keyboard |
| `P04-WEB-039..045` | Announcement | Teacher lifecycle, Student projection |
| `P04-WEB-046..055` | To-do/deadlines | filters, sort, completion removal, empty/error |
| `P04-WEB-056..066` | Lesson Player | safe render, start/complete, navigation, retry |
| `P04-WEB-067..072` | Access/routes | RoleRoute, forbidden/not found/deep link |

Use accessible queries (`role`, `label`, `name`) thay vì test implementation class khi có thể.

## 9. XSS And URL Corpus

Test ít nhất:

- `<script>alert(1)</script>`.
- `<img src=x onerror=...>`.
- SVG/event-handler variants.
- Encoded `javascript:` và mixed-case scheme.
- `data:text/html`, `file:`, credentialed URL.
- Markdown link/image malformed.
- Very long unbroken text/URL.
- Benign headings, lists, code, links vẫn render đúng.

Assertion gồm DOM không có executable node/handler và no unexpected network request trong browser test.

## 10. E2E Journeys

### `P04-E2E-001` Teacher To Student Golden Path

1. Login Teacher.
2. Open owned Classroom, create Course/Module/Lesson.
3. Add Flashcards, set deadline, preview, publish Lesson và Course.
4. Login enrolled Student.
5. Verify To-do item; open Lesson; use Flashcard; Previous/Next; complete.
6. Verify To-do item disappears/updates.
7. Login Teacher; verify Course Dashboard progress/ranking.

### `P04-E2E-002` Visibility And Lifecycle

1. Draft Lesson absent for Student.
2. Published Lesson visible.
3. Unpublish hides new access, progress retained.
4. Republish restores access.
5. Archive removes access and blocks mutation.

### `P04-E2E-003` Deadline Reset

1. Published Lesson current deadline.
2. Teacher extends with reason.
3. Student sees new deadline/derived state.
4. Teacher sees history.

### `P04-E2E-004` Foreign Access

- Foreign Teacher/Student deep links cannot read or mutate resource.
- Error UI does not display resource title.

### `P04-E2E-005` Announcement Stream

- Draft hidden, published visible, archived hidden; pagination retains order.

## 11. Accessibility And Visual Tests

- Keyboard-only golden path for create Lesson and complete Lesson.
- Focus trap/return for deadline/archive dialogs.
- Reorder keyboard alternative.
- Axe or equivalent automated scan on critical pages where available.
- Playwright screenshots at 1440x900 and 390x844.
- Check no horizontal overflow, overlap, clipped buttons, unreadable long title.
- Screenshot evidence includes representative loading/empty/error/content states.

## 12. Performance Tests

Dataset theo data plan. Measure server-side duration after warm connection:

| Query | Target |
| --- | --- |
| Student To-do | p95 < 1,000 ms |
| Course Dashboard summary | p95 < 2,000 ms |
| Student ranking page 100 | p95 < 2,000 ms |
| Course structure 500 Lesson | p95 < 1,500 ms |

Record hardware/runtime/dataset/iterations. Một lần chạy nhanh không đủ chứng minh p95; dùng tối thiểu 30 measured requests sau warm-up ở local performance check.

## 13. Test Execution Commands

Expected scripts sau implementation:

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:openapi
npm run test:coverage
npm run build
npm run test:e2e:ci
npm run check:ci
```

Nếu thêm script P04 riêng, root CI phải gọi nó hoặc test phải được discover bởi existing workspace command.

## 14. Evidence Rules

- Automated result: command, timestamp, commit, pass count/report path.
- GitHub: direct run URL và job names.
- Browser: screenshot/trace path, viewport, journey.
- Performance: dataset + method + percentile.
- Negative security: expected code/result, không lưu attack credential thật.
- `Not Run` giữ nguyên cho tới khi evidence tồn tại; không pre-fill Pass trong planning.

## 15. Test Exit Criteria

- 100% Must acceptance criteria có test/evidence.
- Unit/integration/component/E2E/security/concurrency suites pass.
- OpenAPI parity pass.
- Performance baseline đạt hoặc có approved exception không phải Critical/High.
- Không flaky test unresolved; retry không được dùng để che deterministic defect.
- CI PR và post-merge `main` xanh.
