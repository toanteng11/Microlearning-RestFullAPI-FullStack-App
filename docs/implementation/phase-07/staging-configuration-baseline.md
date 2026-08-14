# Staging Configuration Baseline

## 1. Mục đích

Đây là input cụ thể cho Terraform Staging và runtime schema. Giá trị có thể được tune bằng evidence nhưng
không được đổi âm thầm. Secret table chỉ ghi resource name, không ghi value.

## 2. System And Release

| Variable | Staging value/source | Owner |
| --- | --- | --- |
| `NODE_ENV` | `production` | Terraform |
| `APP_ENV` | `staging` | Terraform |
| `APP_VERSION` | release manifest | CD |
| `COMMIT_SHA` | full trusted main SHA | CD |
| `IMAGE_DIGEST` | `sha256:<digest>` | CD/Terraform |
| `BUILD_TIME` | ISO-8601 UTC | CD |
| `PORT` | Cloud Run supplied, expected `8080` | Cloud Run |
| `PUBLIC_WEB_URL` | deterministic Cloud Run HTTPS origin | Terraform |
| `ALLOWED_ORIGINS` | same exact HTTPS origin | Terraform |
| `LOG_LEVEL` | `info` | Terraform |
| `TRUST_PROXY_HOPS` | `1`, measure/verify | Terraform |

Frontend Production build không bắt buộc `VITE_API_BASE_URL`; absence means same-origin. Local development
giữ `VITE_API_BASE_URL=http://localhost:4000`.

## 3. MongoDB

| Variable | Staging value/source | Classification |
| --- | --- | --- |
| `MONGODB_URI` | `ml-stg-mongodb-uri` exact version | Secret |
| `MONGODB_MAX_POOL_SIZE` | `10` | Non-secret |
| `MONGODB_MIN_POOL_SIZE` | `0` | Non-secret |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | `10000` | Non-secret |
| `MONGODB_CONNECT_TIMEOUT_MS` | `10000` | Non-secret |
| `MONGODB_SOCKET_TIMEOUT_MS` | `30000` baseline | Non-secret |

## 4. Authentication And Invitation

| Variable | Staging value/source |
| --- | --- |
| `ACCESS_TOKEN_SECRET` | `ml-stg-access-token-secret` exact version |
| `ACCESS_TOKEN_ISSUER` | `microlearning-api` |
| `ACCESS_TOKEN_AUDIENCE` | `microlearning-web` |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` |
| `REFRESH_TOKEN_TTL_SECONDS` | `604800` |
| `REFRESH_REUSE_GRACE_SECONDS` | `5` |
| `REFRESH_COOKIE_NAME` | `ml_refresh` |
| `REFRESH_COOKIE_SECURE` | `true` |
| `AUTH_IDENTITY_PEPPER` | `ml-stg-auth-identity-pepper` exact version |
| `TEACHER_INVITATION_TTL_DAYS` | `7` |

## 5. Classroom And Enrollment

| Variable | Staging value/source |
| --- | --- |
| `CLASSROOM_CODE_PEPPER` | `ml-stg-classroom-code-pepper` exact version |
| `CLASSROOM_CODE_LENGTH` | `8` |
| `CLASSROOM_INVITE_TOKEN_BYTES` | `32` |
| `CLASSROOM_INVITE_DEFAULT_TTL_DAYS` | `30` |
| `CLASSROOM_JOIN_IP_LIMIT` | `20` |
| `CLASSROOM_JOIN_IDENTITY_LIMIT` | `10` |
| `CLASSROOM_JOIN_WINDOW_SECONDS` | `900` |
| `CLASSROOM_PREVIEW_IP_LIMIT` | `30` |

## 6. Content And Learning

| Variable | Staging value |
| --- | --- |
| `CONTENT_MARKDOWN_MAX_CHARS` | `100000` |
| `COURSE_MAX_PER_CLASSROOM` | `100` |
| `MODULE_MAX_PER_COURSE` | `100` |
| `LESSON_MAX_PER_COURSE` | `500` |
| `FLASHCARD_MAX_PER_LESSON` | `100` |
| `CONTENT_WRITE_WINDOW_SECONDS` | `60` |
| `CONTENT_WRITE_IDENTITY_LIMIT` | `120` |
| `LEARNING_ACTION_WINDOW_SECONDS` | `60` |
| `LEARNING_ACTION_IDENTITY_LIMIT` | `180` |
| `DASHBOARD_PAGE_MAX` | `100` |
| `LEARNING_RESOURCES_ENABLED` | `false` |
| `GCS_UPLOADS_ENABLED` | `false` |

## 7. Assessments

| Variable | Staging value |
| --- | --- |
| `QUESTION_IMAGE_URL_ENABLED` | `false` |
| `QUESTION_VIDEO_URL_ENABLED` | `false` |
| `QUESTION_MEDIA_ALLOWED_HOSTS` | empty |
| `ASSIGNMENT_LINK_SUBMISSION_ENABLED` | `false` |
| `ASSIGNMENT_MARK_DONE_ENABLED` | `false` |
| `ASSESSMENT_FILE_UPLOAD_ENABLED` | `false` |
| `QUIZ_ATTEMPT_START_IP_LIMIT` | `300` |
| `QUIZ_ATTEMPT_IDENTITY_LIMIT` | `20` |
| `QUIZ_ANSWER_SAVE_LIMIT` | `180` |
| `ASSESSMENT_MUTATION_WINDOW_SECONDS` | `60` |
| `ASSESSMENT_MUTATION_IDENTITY_LIMIT` | `120` |

## 8. Reporting And Analytics

| Variable | Staging value |
| --- | --- |
| `REPORTING_ENABLED` | `true` |
| `REPORTING_TIMEZONE` | `Asia/Ho_Chi_Minh` |
| `REPORTING_DUE_SOON_WINDOW_HOURS` | `72` |
| `REPORTING_PAGE_MAX` | `50` |
| `REPORTING_DASHBOARD_PREVIEW_LIMIT` | `5` |
| `REPORTING_GRADEBOOK_ACTIVITY_MAX` | `50` |
| `REPORTING_STALE_AFTER_SECONDS` | `300` |
| `REPORTING_INLINE_REFRESH_MAX_STUDENTS` | `5` |
| `REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS` | `100` |
| `REPORTING_REFRESH_REQUEST_BUDGET_MS` | `900` |
| `REPORTING_REBUILD_BATCH_SIZE` | `50` |
| `REPORTING_REBUILD_MAX_ATTEMPTS` | `3` |
| `REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE` | `50` |
| `REPORTING_INVALIDATION_LOCK_SECONDS` | `120` |
| `REPORTING_INVALIDATION_MAX_ATTEMPTS` | `3` |
| `REPORTING_INVALIDATION_RETRY_BASE_SECONDS` | `30` |
| `REPORTING_INVALIDATION_RETRY_MAX_SECONDS` | `300` |
| `REPORTING_PRIVACY_MIN_GROUP_SIZE` | `5` |
| `REPORTING_MAX_DATE_RANGE_DAYS` | `365` |
| `REPORT_EXPORT_ENABLED` | `false` |
| `REPORT_EXPORT_MAX_ROWS` | `5000` |
| `REPORT_EXPORT_MAX_DATE_RANGE_DAYS` | `365` |
| `ANALYTICS_EVENTS_ENABLED` | `false` |
| `ANALYTICS_EVENT_RETENTION_DAYS` | `90` |
| `ANALYTICS_EVENT_BODY_MAX_BYTES` | `16384` |
| `ANALYTICS_EVENT_IDENTITY_LIMIT` | `120` |
| `STUDENT_PROGRESS_TREND_ENABLED` | `false` |
| `ADMIN_LEARNING_OUTCOMES_ENABLED` | `false` |
| `WEIGHTED_PROCESS_SCORE_ENABLED` | `false` |

Conditional Phase 06 flags giữ `false` cho đến khi có acceptance/evidence riêng; Phase 07 không tự bật chỉ để
demo Cloud.

## 9. Auth Rate Limits

| Variable | Staging value |
| --- | --- |
| `RATE_LIMIT_WINDOW_SECONDS` | `900` |
| `REGISTER_RATE_LIMIT_MAX` | `10` |
| `LOGIN_RATE_LIMIT_MAX` | `30` |
| `REFRESH_RATE_LIMIT_MAX` | `60` |
| `PUBLIC_INVITATION_RATE_LIMIT_MAX` | `20` |
| `ADMIN_INVITATION_RATE_LIMIT_WINDOW_SECONDS` | `3600` |
| `ADMIN_INVITATION_RATE_LIMIT_MAX` | `20` |
| `LOGIN_FAILURE_WINDOW_SECONDS` | `900` |
| `LOGIN_FAILURE_MAX_ATTEMPTS` | `5` |
| `LOGIN_COOLDOWN_SECONDS` | `900` |

## 10. Bootstrap And Test

| Variable | Service | Seed Job | Cloud E2E |
| --- | --- | --- | --- |
| `BOOTSTRAP_ADMIN_ENABLED` | `false` | `false` | N/A |
| `SEED_DEMO_PASSWORD` | not mounted | Secret Manager exact version | fetched by E2E identity, masked |
| `E2E_WEB_URL` | N/A | N/A | Cloud Run service URL |
| `E2E_API_URL` | N/A | N/A | same Cloud Run service URL |

Seed Job nhận toàn bộ runtime variables mà compiled seed command cần nhưng không mở HTTP port. Production
không provision/run seed Job theo baseline.

## 11. Change Control

- Terraform `variables.tf` validates type/range and `terraform.tfvars.example` mirrors this file.
- Runtime schema remains authoritative; CI compares expected explicit Production-like fields with Terraform
  mapping to prevent drift.
- Any value change requires reason, affected test, cost/security impact and owner.
- Secret version change follows rotation runbook, không edit plaintext tfvars.
- Final applied values are captured as redacted deployment evidence.
