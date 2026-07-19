# Phase 04 DevOps, Environment And Seeding

## 1. Objective

Mở rộng runtime/CI hiện có cho Learning Content mà không làm local, Docker và GitHub Actions lệch nhau. Phase 04 không deploy Production, nhưng mọi contract phải sẵn sàng cho Google Cloud Run + MongoDB Atlas ở Phase 07.

## 2. Runtime Baseline

| Thành phần | Baseline |
| --- | --- |
| Node.js | `>=24.14.0 <25` theo root engines |
| npm | `>=11.9.0 <12` |
| API/Web | Existing workspaces và production same-origin image |
| Database local/CI | MongoDB replica set để transaction hoạt động |
| Database managed | MongoDB Atlas ở Phase 07 |
| Compute | Google Cloud Run ở Phase 07 |
| CI/CD | GitHub Actions |
| Object storage | Google Cloud Storage conditional; không Firebase |

## 3. Environment Contract

### Must Configuration

| Variable | Local default | Production rule | Validation |
| --- | --- | --- | --- |
| `CONTENT_MARKDOWN_MAX_CHARS` | `100000` | Explicit | Integer 1,000-500,000 |
| `COURSE_MAX_PER_CLASSROOM` | `100` | Explicit | Integer 1-1,000 |
| `MODULE_MAX_PER_COURSE` | `100` | Explicit | Integer 1-500 |
| `LESSON_MAX_PER_COURSE` | `500` | Explicit | Integer 1-5,000 |
| `FLASHCARD_MAX_PER_LESSON` | `100` | Explicit | Integer 1-500 |
| `CONTENT_WRITE_WINDOW_SECONDS` | `60` | Explicit | Integer > 0 |
| `CONTENT_WRITE_IDENTITY_LIMIT` | `120` | Tune | Integer > 0 |
| `LEARNING_ACTION_WINDOW_SECONDS` | `60` | Explicit | Integer > 0 |
| `LEARNING_ACTION_IDENTITY_LIMIT` | `180` | Tune | Integer > 0 |
| `DASHBOARD_PAGE_MAX` | `100` | `100` | Integer 20-100 |
| `LEARNING_RESOURCES_ENABLED` | `false` | Feature decision | Boolean strict |
| `GCS_UPLOADS_ENABLED` | `false` | Must remain false until gate | Boolean strict |

Config parser phải dùng same coercion/validation pattern hiện tại và fail-fast với message liệt kê field; không để `Number(undefined)` thành `NaN` như lỗi CI đã gặp trước đây.

### Conditional GCS Configuration

| Variable | Rule |
| --- | --- |
| `GCP_PROJECT_ID` | `microlearning-platform-502716` cho target project đã chọn |
| `GCS_BUCKET_NAME` | Không hard-code trong source |
| `GCS_SIGNED_URL_TTL_SECONDS` | 60-900, default đề xuất 300 |
| `GCS_MAX_UPLOAD_BYTES` | Explicit hard limit |
| `GCS_ALLOWED_MIME_TYPES` | Parsed allowlist |
| `GCS_CORS_ORIGINS` | Exact origins, không wildcard Production |

Local credentials không commit. Cloud Run dùng service account/Application Default Credentials; GitHub dùng Workload Identity Federation ở Phase 07, không service-account key dài hạn.

## 4. Feature Gate Rules

```text
LEARNING_RESOURCES_ENABLED=false
  -> resource routes/UI hidden; core P04 fully functional

LEARNING_RESOURCES_ENABLED=true, GCS_UPLOADS_ENABLED=false
  -> external LINK/VIDEO_URL only

GCS_UPLOADS_ENABLED=true
  -> requires resource feature + full GCS security checklist
```

Invalid combination fail startup. Swagger chỉ document enabled production capability theo release baseline hoặc đánh dấu rõ conditional; không expose dead upload path.

## 5. Demo Seed Dataset

Seed phải deterministic, idempotent và không hard-code real credential.

| Fixture key | Data |
| --- | --- |
| `demo.teacher` | Existing active Teacher owner |
| `demo.student.high` | Active Student, complete nhiều Lesson |
| `demo.student.mid` | Active Student, progress một phần |
| `demo.student.none` | Active Student, chưa bắt đầu |
| `demo.classroom` | Active Classroom, enrollment open |
| `demo.course.published` | 2 Module, published, mixed deadlines |
| `demo.course.draft` | Draft Course không visible Student |
| `demo.lessons` | At least 5: completed/upcoming/missing/unpublished/scheduled |
| `demo.flashcards` | At least 3 cards in one Lesson |
| `demo.announcement` | One published, one draft |
| `demo.progress` | Deterministic ranking/todo scenarios |

### Seed Rules

- Nhận password qua secure stdin/env của CI giống Phase 03; không echo.
- Upsert theo stable semantic key, không duplicate khi chạy lần hai.
- Dùng service/domain invariant nếu khả thi; nếu direct repository seed, tests phải verify resulting validity.
- Không dùng timestamp ngẫu nhiên làm deadline. Tính relative với injected seed base time hoặc fixed fixture clock.
- Output chỉ summary count và semantic usernames; không token/password/raw content nhạy cảm.

## 6. Docker Integration

- Existing `docker compose up --build` phải build API/Web và replica-set Mongo.
- API startup đợi Mongo/index readiness theo current lifecycle.
- Seed chạy sau health readiness, không race với index creation.
- Integrated smoke:
  1. Health/version.
  2. Login Teacher/Student.
  3. Teacher read Course.
  4. Student read Lesson/To-do.
  5. Swagger JSON/UI HTTP 200.
- Container restart không mất Mongo volume trong normal local workflow.
- Không mount source secret vào production image layer.

## 7. CI Pipeline

Existing required jobs được giữ:

| Job | P04 additions |
| --- | --- |
| `Lint, test and build` | Unit/component/coverage for new modules |
| `Production dependency audit` | New renderer/storage dependency audit |
| `MongoDB replica-set transaction` | Index, reorder, deadline, completion concurrency tests |
| `OpenAPI contract` | P04 path/schema/route parity |
| `Phase 03 browser E2E` | Rename/generalize to integrated browser E2E; add P04 journey |
| `Secret scan` | Scan all commits/diff as current gate |

Nếu đổi tên required check, cập nhật GitHub Ruleset cẩn thận để không tạo khoảng trống bảo vệ `main`.

### Recommended Job Order

1. Static quality/type/unit in parallel with audit/secret scan.
2. Mongo transaction integration.
3. OpenAPI contract.
4. Build integrated images.
5. Seed synthetic identities/content.
6. Browser E2E.
7. Upload HTML/test artifacts only on success/failure as appropriate, không chứa secret.

## 8. CI Determinism

- Mọi numeric env P04 được khai báo rõ trong CI, không dựa shell-empty conversion.
- Test clock/seed base time fixed hoặc controlled.
- Port/container name unique per job.
- Browser test chờ health endpoint, không sleep cố định đơn thuần.
- Retry chỉ cho infrastructure startup có bounded attempts; test assertion không auto-retry che defect.
- Artifacts có retention hợp lý và redact cookies/tokens.

## 9. Observability

### Metrics/Logs

- Request duration/status theo route template, không raw ID trong metric label.
- Dashboard query duration, Student/Lesson counts.
- Reorder/deadline/completion outcome và conflict count.
- Scheduled content effective-read count nếu cần chẩn đoán.
- Optional GCS operation latency/failure khi enabled.

### Health

- Liveness: process phục vụ được.
- Readiness: Mongo connection/index foundation sẵn sàng.
- Optional GCS không làm core readiness fail khi feature disabled.
- Khi upload enabled nhưng GCS invalid, startup fail-fast hoặc readiness fail theo accepted operating model.

## 10. Cloud Run Readiness

- Không dùng local filesystem cho persistent state.
- Không dùng in-process cron để publish scheduled content.
- Bind `PORT` do Cloud Run cấp.
- Stateless request handling; sessions/data ở Mongo.
- Graceful shutdown đóng HTTP/Mongo trong timeout.
- Same-origin web/API tránh credentialed CORS phức tạp.
- Connection pool và timeout configurable cho Atlas.

## 11. Clean Clone Verification

Trên thư mục mới không có untracked config:

```powershell
npm ci
Copy-Item .env.example .env
docker compose up --build -d
npm run seed:demo --workspace @microlearning/api
npm run check:ci
npm run test:e2e:ci
```

Command thực tế phải được cập nhật theo scripts sau implementation. Evidence ghi OS, Node/npm version, commit SHA, start/end time và result.

## 12. Secret And Artifact Hygiene

- `.env`, Atlas URI/password, JWT secrets, peppers, GCP credentials không commit.
- `.env.example` chỉ placeholder.
- Seed/test logs không in password/token/cookie/signed URL.
- Playwright trace/screenshot review trước upload vì có thể chứa user data.
- Gitleaks config exception phải specific, có reason và reviewer.
- Production cloud credential đã từng chia sẻ công khai phải rotate, không chỉ xóa khỏi file.

## 13. DevOps Exit Criteria

- Env validation unit tests gồm missing/NaN/out-of-range/invalid feature combination.
- Docker clean build/start/seed/smoke pass.
- CI Pull Request và post-merge `main` pass tất cả required checks.
- OpenAPI/route parity và index manifest pass.
- No secret finding hoặc exception không được duyệt.
- Optional GCS disabled an toàn nếu chưa triển khai; không ảnh hưởng Must flow.
- Evidence có URL/run ID/commit, không ghi “pass” thiếu nguồn.
