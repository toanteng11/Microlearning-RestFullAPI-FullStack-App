# Phase 04 Conditional Resource Decision

## 1. Decision

| Field | Value |
| --- | --- |
| Decision ID | `P04-RESOURCE-EXECUTION-001` |
| Decision date | `2026-07-20` |
| Phase 04 disposition | `DEFERRED` |
| Target review | `P07 - Cloud Deployment` |
| Must scope impact | None |

Phase 04 không triển khai External URL Resource hoặc private GCS upload. Hai capability này là `Conditional Should`, không thuộc critical path của Course, Lesson, Flashcard, Deadline, Announcement và Learning Progress.

## 2. Runtime Enforcement

- `LEARNING_RESOURCES_ENABLED=false`.
- `GCS_UPLOADS_ENABLED=false`.
- Runtime validation không cho bật `GCS_UPLOADS_ENABLED` khi Resource capability đang tắt.
- Phase 04 không đăng ký Resource route, schema, MongoDB collection hoặc React screen.
- Không sử dụng Firebase trong kiến trúc đã chọn.

## 3. Rationale

- Ưu tiên hoàn thiện luồng LMS nội bộ và evidence của Must scope.
- Cloud baseline của dự án là Google Cloud Run, MongoDB Atlas và GitHub Actions; private GCS chỉ được thêm khi có IAM, CORS, MIME/size validation, malware strategy, signed URL và orphan cleanup đầy đủ.
- Triển khai upload nửa vời sẽ tạo rủi ro public object, credential leak và chi phí vận hành không cần thiết cho Phase 04.

## 4. Acceptance Disposition

| Acceptance | Disposition | Evidence |
| --- | --- | --- |
| `P04-AC-045` | `Not Applicable` | Resource capability disabled; không có URL Resource route/UI |
| `P04-AC-046` | `Not Applicable` | GCS upload disabled; không có bucket/provider adapter trong P04 |

`Not Applicable` không có nghĩa yêu cầu bị xóa. `FR-032`, `FR-068` và security controls vẫn được giữ trong traceability để review tại P07.

## 5. Conditions Before Enablement

1. Phê duyệt threat model và data classification.
2. Tạo private GCS bucket bằng least-privilege service account.
3. Hoàn thiện HTTPS URL allowlist, MIME/size validation và reauthorization.
4. Có cleanup/retry/rollback, audit redaction và security tests.
5. Bật capability theo môi trường, chạy OpenAPI, integration, browser và deployment evidence trước release.
