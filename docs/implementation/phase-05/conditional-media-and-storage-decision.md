# Phase 05 Conditional Media And Storage Decision

## 1. Decision

Phase 05 **không triển khai private file upload**. Question media và Assignment submission chỉ dùng capability không cần object upload khi được bật:

- Question image URL: Conditional Should.
- Question approved video URL: Conditional Should.
- Assignment external HTTPS link: Conditional Should.
- Assignment text: Must.
- Assignment file submission: Deferred Phase 07.
- Question image/video upload: Deferred Phase 07.

## 2. Rationale

Google Cloud Storage là provider đã chọn, nhưng P07 mới chịu trách nhiệm provisioning bucket, IAM, signed delivery, retention, cleanup, monitoring và production evidence. Dùng local/container filesystem ở P05 sẽ tạo implementation không dùng được trên Cloud Run và phá security/rollback baseline.

## 3. Feature Flags And Configuration

| Config | Default | Ý nghĩa |
| --- | --- | --- |
| `QUESTION_IMAGE_URL_ENABLED` | `false` | Cho phép image URL metadata |
| `QUESTION_VIDEO_URL_ENABLED` | `false` | Cho phép approved video provider |
| `QUESTION_MEDIA_ALLOWED_HOSTS` | empty | Comma-separated exact/suffix allowlist đã review |
| `ASSIGNMENT_LINK_SUBMISSION_ENABLED` | `false` | Cho phép HTTPS link sau explicit review |
| `ASSIGNMENT_MARK_DONE_ENABLED` | `false` | Cho phép Teacher bật mark done |
| `ASSESSMENT_FILE_UPLOAD_ENABLED` | `false` hard guard | Luôn false trong P05 |

Config validation fail closed: enabled media nhưng allowlist rỗng làm startup fail hoặc feature disabled rõ ràng, không allow all.

## 4. URL Validation

- Parse bằng WHATWG `URL`.
- Scheme chỉ `https:`.
- Reject username/password, fragment khi không cần, excessive length.
- Normalize hostname lower-case/punycode và đối chiếu allowlist boundary-safe.
- Không follow redirect hoặc server-side fetch trong P05.
- Video URL normalize thành provider ID/canonical embed URL.
- UI sandbox/alt/fallback theo security document.

## 5. Data Model Boundary

Media metadata P05:

```ts
type QuestionMedia = {
  kind: 'IMAGE_URL' | 'VIDEO_URL';
  url: string;
  provider: string | null;
  caption: string | null;
  altText: string | null;
};
```

Không có `objectKey`, `bucket`, signed URL hoặc upload status giả. P07 sẽ version schema/contract khi thêm upload.

## 6. API Behavior

- Nếu feature disabled: `409 FEATURE_NOT_ENABLED` với message an toàn.
- Question không media vẫn create/update/publish bình thường.
- FILE submission method bị reject ở Assignment authoring và Student request.
- OpenAPI ghi rõ P05 supported enum; không document upload route như đang hoạt động.

## 7. P07 Entry Criteria

Muốn bật upload phải có:

1. Private GCS bucket và least-privilege service account.
2. Upload initiation/finalization contract.
3. MIME magic-byte/size/quota validation.
4. Malware/quarantine decision.
5. Authorized download/signed URL re-check.
6. Orphan/failed upload cleanup.
7. Retention/delete/history policy.
8. Log redaction, monitoring, cost alert và rollback.
9. Integration/E2E evidence trên staging.

## 8. Traceability Integrity

- `FR-038` chỉ complete phần optional URL media nếu Conditional được bật và test Pass.
- `FR-043` FILE aspect giữ `Deferred P07`, không tính vào P05 Must score.
- BA gap được ghi trong phase/common traceability và Phase Exit.
- P05 không được ghi “hỗ trợ file submission” chỉ vì UI có disabled option.

## 9. Gate A Approval

Repository owner đã chấp thuận defer này ngày `2026-07-22`. Nếu FILE trở thành Must P05, planning phải mở lại để bổ sung GCS architecture, API, security, DevOps, test và manual prerequisites trước implementation.

## 10. Conditional Defaults

Mọi URL/media/link capability giữ `false` sau Gate A nếu không có riêng một quyết định `Enabled` kèm host/provider policy và test owner. “Conditional” không có nghĩa tự động bật ở local/demo.

Gate A disposition hiện tại:

| Capability | Disposition P05 | Runtime default |
| --- | --- | --- |
| Question media URL | `N/A - Disabled` | `QUESTION_MEDIA_URL_ENABLED=false` |
| Assignment LINK/MARK_DONE | `N/A - Disabled` | `ASSIGNMENT_LINK_ENABLED=false` |
| Private Comments | `N/A - Deferred` | Không tạo route/model/permission |
| Basic Gradebook | `N/A - Deferred` | `BASIC_GRADEBOOK_ENABLED=false` |
| FILE/upload | `Deferred P07` | Không có upload endpoint hoặc local storage |

Private Comments không thuộc contract media/storage và hiện không có operation trong 52 P05 endpoints. Nếu không có change-control trước P05-PR06 để bổ sung API, model, permission, UI và privacy tests, `P05-T074`, `P05-T089` và `P05-AC-059` phải được disposition `N/A - Deferred`; Developer không tự đặt route/comment schema.
