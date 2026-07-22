# Phase 05 DevOps, Environment And Seeding

## 1. Environment Contract

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `QUESTION_IMAGE_URL_ENABLED` | Yes | `false` | Conditional image URL |
| `QUESTION_VIDEO_URL_ENABLED` | Yes | `false` | Conditional video URL |
| `QUESTION_MEDIA_ALLOWED_HOSTS` | Conditional | empty | Reviewed host allowlist |
| `ASSIGNMENT_LINK_SUBMISSION_ENABLED` | Yes | `false` | Conditional external link method |
| `ASSIGNMENT_MARK_DONE_ENABLED` | Yes | `false` | Conditional mark done |
| `BASIC_GRADEBOOK_ENABLED` | Yes | `false` | Conditional basic Gradebook read view; no weighting/export |
| `ASSESSMENT_FILE_UPLOAD_ENABLED` | Yes | `false` | Hard guard P05; true rejected at startup |
| `QUIZ_ATTEMPT_START_IP_LIMIT` | Yes | `300` | Start requests per IP/window; classroom NAT tolerant |
| `QUIZ_ATTEMPT_IDENTITY_LIMIT` | Yes | `20` | Start requests per user + Quiz/window |
| `QUIZ_ANSWER_SAVE_LIMIT` | Yes | `180` | Saves per user + Attempt/window |
| `ASSESSMENT_MUTATION_WINDOW_SECONDS` | Yes | `60` | Shared limiter window |
| `ASSESSMENT_MUTATION_IDENTITY_LIMIT` | Yes | `120` | Other assessment mutations per actor/window |

Config values phải parse/validate bằng Zod. P05 không thêm GCS credential.

## 2. Local Docker

- Reuse Web/API/Mongo replica-set stack.
- Mongo remains internal-only.
- API health không phụ thuộc external media host.
- Seed database name riêng, không dùng production Atlas URI.
- Compose config không chứa secret/real credential.

## 3. Deterministic Demo Seed

Seed P05 phải idempotent và dùng synthetic identity hiện có:

### Quiz Fixtures

- Objective published Quiz, 4 Question types, immediate-safe variant.
- Mixed Quiz with short answer, `TEACHER_RETURN`.
- Draft, unpublished, archived Quiz.
- Active attempt, expired attempt, submitted, needs-review, released attempts.
- Attempt-limit reached Student.

### Assignment Fixtures

- Published TEXT Assignment; optional LINK fixture only when its feature flag is explicitly enabled.
- Late-enabled due past Assignment.
- Closed Assignment.
- Students: assigned, draft, submitted, late, missing, graded, returned.
- Resubmission history.

### Deadline/Grade

- One Student-specific extension for each activity type.
- Grade draft and returned Grade.
- Regrade history.
- No private real names/email/content.

Seed output reports created/reused counts by collection; repeat run creates zero duplicate natural keys.

## 4. CI Pipeline Impact

Existing six required jobs remain:

1. Lint, test and build/coverage gate.
2. Production dependency audit.
3. Mongo replica-set transaction/integration.
4. OpenAPI contract/parity.
5. Browser E2E.
6. Secret scan.

P05 adds tests to existing jobs, không tạo optional green path bỏ qua assessment suites.

## 5. CI Quality Commands

- `npm run check:ci`.
- API unit/coverage.
- Mongo integration/coverage.
- OpenAPI parity.
- Playwright critical journeys.
- `npm audit --omit=dev --audit-level=high`.
- Gitleaks/secret scanner.
- Docker build and seed/smoke where workflow defines.

## 6. Feature Flag Matrix

| Environment | URL media | Link | Mark Done | Basic Gradebook | File Upload |
| --- | --- | --- | --- | --- | --- |
| Test | Explicit per test | Explicit | Explicit | Explicit | false |
| Local demo | false by default | false by default | false | false | false |
| CI E2E | allowlisted synthetic URL only if tested | explicit per Conditional test | optional test | explicit Conditional test | false |
| Staging/P07 | Security approval | approved | product decision | explicit approval | only after P07 gate |
| Production | Explicit approval | approved | explicit | explicit approval | only after P07 release |

## 7. Logging And Metrics

Structured logs:

- operation/result/statusCode/duration/requestId;
- actor role and safe IDs;
- revision/conflict category;
- scoring question count/duration, not answers;
- attempt/submission/grade state transitions;
- no feedback/submission body/correct key/full external token URL.

Metrics proposed:

- attempts started/finalized/expired/conflicted;
- scoring duration/error;
- submissions turned-in/late/unsubmitted;
- grades saved/returned/regraded;
- deadline exceptions set/revoked/denied;
- read endpoint p95/error rate.

## 8. Performance Baseline

Synthetic dataset defined in data doc. Initial local targets:

| Operation | Target p95 |
| --- | --- |
| Student Quiz intro/start read | < 750 ms |
| Save answer | < 500 ms |
| Submit 100-question objective Quiz | < 2,000 ms |
| Teacher Quiz results page | < 1,500 ms |
| Save/turn-in Submission | < 1,000 ms |
| Submission roster 100 Students | < 1,500 ms |
| Grade/return | < 1,000 ms |
| Multi-activity To-do | < 1,000 ms |

Targets đo trong controlled local/CI baseline, không tuyên bố production SLO.

## 9. Clean Clone Verification

1. Clone exact implementation source commit sang thư mục sạch.
2. Copy safe `.env.example` values, không copy secret.
3. `npm ci`.
4. `npm run check:ci`.
5. `docker compose config --quiet`.
6. Build/start isolated stack with distinct project/database/ports.
7. Seed first/repeat.
8. Smoke Web/API/Swagger and critical journeys.
9. Capture commit, commands, counts, CI/PR URLs.
10. Stop stack; no destructive cleanup outside isolated target.

## 10. Operational Boundaries

- No production deploy in P05.
- No GCS bucket/IAM in P05.
- No external email/Gmail integration.
- Cloud Run/Atlas deployment evidence belongs P07.
- P05 Docker image must remain production-buildable for future P07.

## 11. Failure Diagnostics

CI/seed/E2E failure artifacts:

- sanitized service logs;
- Playwright trace/screenshot/report;
- test report/coverage;
- Docker health/compose status;
- no `.env`, cookie, token, answer, submission body or feedback artifact.

## 12. Exit Evidence

- PR/main CI URLs and six required job results.
- Docker image build IDs/commit SHA.
- first/repeat seed counts.
- local and clean-clone commands/results.
- performance measurements and dataset.
- security scan/audit results.
- no manual claim without reproducible evidence.
