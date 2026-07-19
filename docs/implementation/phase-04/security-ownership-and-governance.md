# Phase 04 Security, Ownership And Governance

## 1. Security Objectives

1. Không actor nào đọc/sửa content ngoài Classroom scope của mình.
2. Student không thấy draft, unpublished, archived hoặc ancestor-hidden content.
3. Nội dung do Teacher nhập không tạo stored XSS.
4. URL/file resource không trở thành đường dẫn thực thi, SSRF hoặc public data leak.
5. Critical mutation có audit và concurrency control.
6. API không tiết lộ resource tồn tại qua guessed ObjectId.

## 2. Permission Catalog Additions

| Permission | Teacher | Student | Admin | Super Admin |
| --- | --- | --- | --- | --- |
| `course.create` | Có | Không | Không | Có |
| `course.view_owned` | Có | Không | Không | Có |
| `course.update_owned` | Có | Không | Không | Có |
| `course.publish_owned` | Có | Không | Không | Có |
| `course.archive_owned` | Có | Không | Không | Có |
| `content.reorder_owned` | Có | Không | Không | Có |
| `lesson.manage_owned` | Có | Không | Không | Có |
| `lesson.deadline_manage_owned` | Có | Không | Không | Có |
| `announcement.manage_owned` | Có | Không | Không | Có |
| `learning.view_enrolled` | Không | Có | Không | Có |
| `learning.complete_own` | Không | Có | Không | Có |
| `course.progress_view_owned` | Có | Không | Không | Có |
| `content.governance_view` | Không | Không | Có | Có |

Permission chỉ là coarse gate. Mọi service vẫn phải kiểm tra current object ownership/enrollment.
Super Admin hiện nhận toàn permission theo Phase 02, nhưng dấu `Có` ở bảng không phải quyền bypass object invariant: authoring mutation vẫn cần ownership hoặc một governance use case riêng được thiết kế và audit.

## 3. Object Authorization Matrix

| Operation | Coarse permission | Object rule |
| --- | --- | --- |
| Create Course | `course.create` | Actor sở hữu Classroom `ACTIVE` |
| Edit/publish Course | `course.update/publish_owned` | Actor là current Classroom owner |
| Manage Module/Lesson/Flashcard | Content permission | Resource chain thuộc Course trong owned Classroom |
| Change deadline | Deadline permission | Owned Lesson, state hợp lệ |
| Publish Announcement | Announcement permission | Owned Classroom `ACTIVE` |
| Student read Course/Lesson | `learning.view_enrolled` | Active Enrollment + visible ancestor chain |
| Student complete Lesson | `learning.complete_own` | Actor chính là Student và Lesson visible |
| Teacher view progress | `course.progress_view_owned` | Owned Course |
| Admin governance | `content.governance_view` | Read-only projection, không content body mặc định |

## 4. Authorization Order

```text
authenticate
  -> account/session active
  -> coarse permission
  -> parse identifier
  -> resolve resource chain
  -> object ownership/enrollment
  -> lifecycle/visibility
  -> validate body and concurrency
  -> mutate/query
```

Body validation tốn kém hoặc message chi tiết không chạy trước object authorization nếu có thể làm lộ schema/resource.

## 5. Content Security

### Markdown

- Lưu source Markdown; cấm raw HTML trong renderer.
- Render bằng thư viện chuẩn và sanitizer allowlist.
- Không dùng `dangerouslySetInnerHTML` với source chưa sanitize.
- Link chỉ `http/https/mailto` theo policy; image remote mặc định không cho trong Must.
- Giới hạn content size ở request và database validation.
- Test payload gồm script tag, event handler, SVG payload, encoded URL và malformed Markdown.

### Plain Text Fields

- Title/front/back/reason được xử lý như text, không HTML.
- React interpolation mặc định; không render như markup.
- Normalize line ending; không silently strip làm thay đổi meaning ngoài trim boundary.

## 6. URL Resource Controls

- Chỉ `https:` cho `LINK/VIDEO_URL` trong P04.
- Parse bằng WHATWG `URL`, không regex thủ công.
- Reject embedded credentials, localhost/private-network target nếu backend có fetch metadata.
- P04 server không fetch arbitrary URL; chỉ lưu normalized URL, do đó giảm SSRF.
- Client external link dùng `target=_blank` cùng `rel=noopener noreferrer`.
- URL tối đa 2,048 ký tự; title tối đa 150.

## 7. GCS Controls For Conditional Upload

| Control | Requirement |
| --- | --- |
| Bucket | Private, uniform bucket-level access |
| Identity | Dedicated Cloud Run service account, least privilege |
| Upload | Short-lived signed URL hoặc authenticated proxy |
| Download | Reauthorize current ownership/enrollment mỗi lần cấp URL |
| Object key | UUID/server key; không path từ filename người dùng |
| MIME | Allowlist và server-side verification |
| Size | Configurable hard limit, reject before/after upload |
| Malware | Required decision trước Production; quarantine flow nếu file upload enabled |
| CORS | Chỉ production/staging origins |
| Logging | Không log signed URL/query signature |
| Cleanup | Orphan object reconciliation có dry-run và audit |

Nếu không hoàn tất malware/authorization/cleanup control, P04 không bật upload file cho user.

## 8. Threat Matrix

| Threat | Control | Test |
| --- | --- | --- |
| IDOR Course/Lesson | Resolve owner/enrollment server-side | Foreign ID matrix |
| Stored XSS | Markdown raw HTML off + sanitizer | XSS corpus component/E2E |
| Mass assignment | Zod allowlist DTO | Unknown/sensitive field test |
| Stale overwrite | CAS revisions | Concurrent update test |
| Duplicate completion | Unique key + idempotent upsert | Parallel request test |
| Reorder corruption | Exact-set + transaction | Duplicate/missing/foreign ID test |
| Deadline tampering | Owner, revision, server clock, reason | Boundary/foreign actor tests |
| URL scheme attack | WHATWG parse + protocol allowlist | `javascript/data/file` cases |
| Data enumeration | Generic not found/object-first policy | Error equivalence test |
| Oversized content | HTTP/body/schema limits | Limit boundary test |
| Audit leakage | Event allowlist/redaction | Log capture assertion |
| Draft cache leak | `private, no-store`; Student projection | Header/projection tests |

## 9. Audit Events

| Event | Actor/resource metadata | Sensitive data excluded |
| --- | --- | --- |
| `COURSE_CREATED` | actor, course, classroom | Full description |
| `CONTENT_STATUS_CHANGED` | resource type/id, from/to | Content body |
| `CONTENT_REORDERED` | parent, revision, item count | Full item titles |
| `LESSON_DEADLINE_CHANGED` | lesson, old/new, reason category/hash if needed | Full free-text reason in general logs |
| `LESSON_COMPLETED` operational event | student, lesson, first completion | Lesson content; không bắt buộc ghi governance AuditLog |
| `ANNOUNCEMENT_STATUS_CHANGED` | announcement/classroom | Announcement body |
| `RESOURCE_CREATED/ARCHIVED` | metadata IDs/type | Signed URL/credential |

Deadline change collection giữ full reason theo business requirement; general application log không cần lặp lại full reason.

## 10. Rate And Abuse Controls

| Endpoint group | Key | Baseline |
| --- | --- | --- |
| Teacher write | Auth identity | Moderate burst, common write limiter |
| Reorder/status/deadline | Auth identity + resource | Tighter mutation limiter |
| Student start/complete | Student identity | Cho retry hợp lệ, chặn spam |
| Dashboard/To-do | Auth identity | Read limiter + max page/range |
| Optional signed URL | Identity + resource | Short TTL + low rate |

Con số cụ thể nằm trong env contract và test config; CI dùng deterministic values. `429 RATE_LIMITED` giữ common error envelope.

## 11. Privacy And Data Minimization

- Course Dashboard Student row chỉ trả field cần cho giảng dạy: ID, display name, completion metrics, last activity.
- Không trả email nếu UI không cần; nếu BA yêu cầu, phải có explicit projection/permission.
- Student chỉ thấy progress của chính mình.
- Admin governance không nhận Lesson body/Flashcard text theo mặc định.
- Audit retention theo BA; P04 không có bulk export.
- Không đưa title/content vào metric label để tránh cardinality và data leak.

## 12. Security Response Rules

- `401 AUTHENTICATION_REQUIRED`: thiếu/invalid session.
- `403 ACCESS_DENIED`: role có identity nhưng thiếu coarse permission.
- `403 ENROLLMENT_REQUIRED`: route đang trong Classroom context đã xác nhận và Student không active.
- `404 RESOURCE_NOT_FOUND`: resource không tồn tại hoặc nằm ngoài object scope.
- `409 CONTENT_STATE_CONFLICT`: state không cho operation.
- `422 VALIDATION_ERROR`: payload hợp lệ về quyền nhưng sai dữ liệu.
- Không trả stack, query, Mongo key hoặc sanitizer internals.

## 13. Admin Governance

- Admin list/detail Classroom nhận `contentCount` từ P04 reader.
- Optional `/admin/courses` chỉ trả metadata/status/owner/classroom/count; không body.
- Admin không được grant authoring permission chỉ để xử lý support.
- Super Admin permission không bỏ qua invariant lifecycle; bypass khẩn cấp nếu có phải là use case riêng ngoài P04.

## 14. Security Exit Criteria

- Permission catalog và capability tests pass cho bốn role.
- IDOR matrix pass ở Course/Module/Lesson/Flashcard/Announcement/Progress.
- XSS/unsafe URL corpus pass.
- No raw content/signed URL/secrets trong captured logs.
- Audit critical mutation đủ và rollback test pass.
- `npm audit`, secret scan và CI required checks xanh.
- Conditional upload chỉ bật khi GCS checklist đạt toàn bộ.
