# Phase 03 DevOps, Environment And Seeding

## 1. Objective

Mở rộng Local/CI runtime cho Classroom domain mà không đưa credential thật vào repository/log/artifact. P03 vẫn chạy một API replica và Mongo replica set; Cloud deployment giữ Phase 07.

## 2. Environment Variables

| Variable                            | Required          | Example safe            | Rule                                     |
| ----------------------------------- | ----------------- | ----------------------- | ---------------------------------------- |
| `CLASSROOM_CODE_PEPPER`             | Yes               | Không ghi giá trị thật  | >=32 bytes; khác JWT/invite secrets      |
| `CLASSROOM_CODE_LENGTH`             | Yes               | `8`                     | P03 chỉ chấp nhận 8 nếu không có ADR mới |
| `CLASSROOM_INVITE_TOKEN_BYTES`      | Yes               | `32`                    | Min 32                                   |
| `CLASSROOM_INVITE_DEFAULT_TTL_DAYS` | Yes               | `30`                    | 1-90                                     |
| `CLASSROOM_JOIN_IP_LIMIT`           | Yes               | `20`                    | Positive bounded                         |
| `CLASSROOM_JOIN_IDENTITY_LIMIT`     | Yes               | `10`                    | Positive bounded                         |
| `CLASSROOM_JOIN_WINDOW_SECONDS`     | Yes               | `900`                   | 60-3600                                  |
| `CLASSROOM_PREVIEW_IP_LIMIT`        | Yes               | `30`                    | Positive bounded                         |
| `PUBLIC_WEB_URL`                    | Existing/required | `http://localhost:5173` | Absolute approved origin, no Host trust  |

`.env.example` dùng placeholder, không dùng working secret. Production fail-fast nếu pepper trùng secret khác hoặc quá ngắn khi có thể kiểm.

## 3. Local Compose

- MongoDB replica set `rs0` và health giữ P02.
- API health chỉ healthy sau Mongo ready và policy bootstrap/index compatibility check cần thiết.
- Web/API image không hard-code credential/runtime URL.
- API non-root giữ nguyên.
- Không expose Mongo ngoài loopback local.

## 4. Index And Policy Initialization

### Local/Test

- Test harness tạo database run-scoped.
- Ensure exact P03 indexes trước integration suite.
- Upsert Enrollment Policy bằng `$setOnInsert`, không overwrite mutation test.

### Staging/Production Direction

- Index creation là reviewed migration/operation, không blind `syncIndexes` khi startup.
- Pre-deploy kiểm duplicate pair/active credential trước unique index.
- Rollback không drop collection/index có data nếu chưa review compatibility.

## 5. Synthetic Seed

Seed P03 idempotent tạo:

- 2 ACTIVE Teacher, 1 BLOCKED Teacher.
- 4 ACTIVE Student, 1 BLOCKED Student.
- 1 Admin/Super Admin từ P02 fixtures.
- Classroom A ACTIVE/OPEN owned Teacher A.
- Classroom B ACTIVE/CLOSED owned Teacher A.
- Classroom C ARCHIVED owned Teacher B.
- Enrollment ACTIVE, REMOVED và non-member cases.
- Global Enrollment Policy enabled.
- Safe credential records cho test.

Raw seed Code/Token:

- Không hard-code trong committed source/docs.
- E2E setup tạo runtime credential qua service/test fixture và giữ trong process memory.
- Nếu cần file handoff, ghi vào ignored `test-results/runtime-fixtures.json`, permission local và xóa cuối run.
- CI logs/artifacts không upload raw value.

Seed output chỉ báo count/IDs safe; chạy lần hai phải `created=0`, `reused=N`.

## 6. CI Jobs

| Job                             | P03 additions                                                      |
| ------------------------------- | ------------------------------------------------------------------ |
| Lint, test and build            | Unit/component/coverage/build P03                                  |
| MongoDB replica-set transaction | Index, Classroom, join, roster, policy/offboarding integration     |
| OpenAPI contract                | P03 route-method coverage + schema safety                          |
| Phase 03 browser E2E            | Teacher create/share, Student Code/Link join, roster, Admin policy |
| Production dependency audit     | Existing gate                                                      |
| Secret scan                     | Existing gate + new env/fixture paths                              |

Không skip/continue-on-error. Failed Playwright uploads trace/screenshot/video đã redacted; successful run không cần raw credential artifact.

## 7. Observability

Structured metrics/log fields safe:

| Signal            | Fields                                                    |
| ----------------- | --------------------------------------------------------- |
| Join request      | method, outcome, duration, requestId; no code/token/email |
| Credential action | action, Classroom ID, status, actor ID, requestId         |
| Policy update     | revision, booleans, actor ID, requestId                   |
| Roster removal    | Classroom/Enrollment ID, outcome, requestId               |
| Error rate        | route template, status, domain code, duration             |

Suggested counters:

- `classroom_created_total`
- `classroom_join_attempt_total{method,outcome}`
- `classroom_join_rate_limited_total{method}`
- `classroom_credential_rotated_total{type}`
- `classroom_roster_removed_total`

Không dùng raw credential hoặc Student email làm metric label.

## 8. Performance Baseline

- List endpoints luôn pagination.
- Local/CI concurrency test tối thiểu 20 simultaneous join same Student/Classroom.
- Optional smoke load: 50 concurrent valid/invalid public join requests với synthetic data.
- Không cam kết Production p95 trước staging load test; ghi observed local/CI duration làm baseline.

## 9. Clean-Clone Rehearsal

1. Clone/checkout target commit sạch.
2. `npm ci`.
3. Copy `.env.example` sang local env và điền synthetic secrets.
4. `docker compose config`.
5. Build/start Mongo/API/Web; init replica set.
6. Bootstrap/seed hai lần để chứng minh idempotency.
7. Run check, P03 integration, OpenAPI và E2E.
8. Verify containers healthy/API non-root.
9. Scan logs/storage for raw code/token.
10. Record sanitized evidence.

## 10. Security And Secret Gate

- Gitleaks scan source/history diff theo CI baseline.
- `.env`, runtime fixture, database dump và test videos có credential phải ignored/not uploaded.
- Pepper rotation chưa tự động ở P03; đổi pepper làm code cũ invalid và cần planned regenerate runbook.
- Invite hash không cần decryption/rotation; link lifecycle xử lý regenerate.

## 11. Rollback

- Frontend rollback tương thích API P03 routes đã additive.
- Backend rollback không drop P03 collections/indexes.
- Nếu index migration fail, stop deployment và restore previous app; không bypass unique invariant.
- Policy bootstrap không chạy destructive update.
- Ghi release/rollback evidence ở Phase 07/08 khi deploy Cloud.
