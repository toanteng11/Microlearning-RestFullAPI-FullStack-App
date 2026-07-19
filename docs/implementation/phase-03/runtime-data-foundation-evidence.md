# Phase 03 Runtime And Data Foundation Evidence

## 1. Thông Tin Lát Cắt

| Thuộc tính | Giá trị |
| --- | --- |
| Slice | `PR-03A - Runtime And Data Foundation` |
| Branch | `feature/phase-03-data-foundation` |
| Ngày kiểm chứng local | `2026-07-19` |
| Trạng thái | `LOCAL_COMPLETE_AWAITING_PR` |
| MongoDB | MongoDB 8, replica set `rs0`, database test tách biệt |

Trạng thái này chỉ xác nhận lát cắt đã đạt Gate B ở môi trường local. PR review, remote CI và merge evidence vẫn bắt buộc trước khi coi lát cắt đã đóng trên repository.

## 2. Phạm Vi Đã Triển Khai

- Environment schema fail-fast cho Code pepper, Code length, Invite Token bytes/TTL và join/preview rate limits.
- Permission catalog cho Student, Teacher, Admin và Super Admin theo object scope đã duyệt.
- Class Code CSPRNG 40-bit, normalize/format/mask, HMAC-SHA256 và random source injectable.
- Invite Token 32 byte, SHA-256 hash và user-facing URL dùng fragment.
- Logger URL/body redaction và Phase 03 AuditWriter allowlist không ghi raw/digest/hash.
- Models `Classroom`, `Enrollment`, `ClassCode`, `ClassroomInviteLink`, `SystemSetting`.
- Exact named indexes, unique membership và unique partial ACTIVE credential.
- Repository nền tảng cho Classroom, Enrollment, credential và Enrollment Policy.
- Enrollment Policy bootstrap bằng `$setOnInsert`, idempotent và không overwrite giá trị đã cấu hình.
- Strict Zod schemas và shared bounded pagination/allowlisted sort/stable `_id` tie-breaker.

Không có P03 route mới được publish trong lát cắt này. Classroom CRUD, credential lifecycle, join, roster, Admin policy API và React UI thuộc các lát cắt tiếp theo.

## 3. Test Evidence

| Command/Suite | Kết quả | Phạm vi xác nhận |
| --- | --- | --- |
| `npm run check` | Pass | Lint, negative lint gate, format, typecheck, unit/component tests, build |
| API unit tests | `84/84` Pass | Config, permission, crypto, schemas, redaction, audit allowlist và regression Phase 2 |
| Web component tests | `48/48` Pass | Không regression frontend hiện có |
| `npm run test:integration` | `25/25` Pass | Mongo replica-set, transaction baseline, exact indexes, uniqueness, projection, bootstrap |
| PR-03A Mongo suite | `4/4` Pass | Exact index options, membership/credential uniqueness, hash-only reads, policy idempotency |
| `npm run test:openapi` | `6/6` Pass | OpenAPI hiện có parse và route contract không regression |
| `npm run test:coverage` | Pass | API statements `79.08%`; Web statements `89.83%`; threshold đạt |
| `docker compose up -d --build api` | Pass | API image build, MongoDB dependency, startup bootstrap và health |
| `GET /ready` | Pass | API `UP`, MongoDB `UP` |
| Container identity | `uid=1000(node)` | API runtime non-root |
| Startup policy query | Pass | Một `ENROLLMENT_POLICY`, revision `1`, default value đúng baseline |

## 4. Security Assertions

- `.env` và credential thật không được commit hoặc ghi vào evidence.
- `ClassCode` schema không có `code/rawCode`; `codeDigest` mặc định `select:false`.
- `ClassroomInviteLink` schema không có `token/inviteLink`; `tokenHash` mặc định `select:false`.
- Invite fragment bị loại khỏi structured log; Code/Token/digest/hash fields bị redact.
- Audit allowlist chỉ giữ metadata được phê duyệt; raw credential bị loại.
- MongoDB Atlas trong local `.env` không được dùng cho integration test; test chạy trên database Docker tách biệt.

## 5. Deferred Và Exit Còn Lại

- Hoàn thành P03 business transaction tests khi Classroom/credential/join services được implement.
- Bổ sung 20-request concurrent join test; PR-03A mới chứng minh unique invariant ở tầng data.
- Publish P03 routes và OpenAPI trong cùng các lát cắt API tương ứng.
- Mở Pull Request, chờ required checks/review, lưu Actions URL và merge commit.
- Không claim Phase 03 `Completed` từ evidence này.
