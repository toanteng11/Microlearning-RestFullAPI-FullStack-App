# Part 00 - Gate A And Baseline

## 1. Status

| Field | Value |
| --- | --- |
| Part | `P06-PART-00` |
| Parent PR | `P06-PR01` |
| Owner | Trần Đức Toàn |
| Status | `DONE` |
| Gate A | `APPROVED` |
| Implementation activation | `READY_TO_CODE` |
| Business code | Không được phép trong Part 00 |
| Last reviewed | `2026-07-29` |

Part 00 chỉ chuyển `DONE` sau khi planning PR merge vào protected `main`, local `main` đã pull
merge commit và evidence có URL/commit thật.

## 2. Goal

Chuyển Phase 06 từ `TECHNICALLY_READY` sang `READY_TO_CODE` bằng approval và baseline có thể tái
lập. Part này không viết business code.

## 3. Dependencies

- Phase 05 release `88404f3`.
- Handoff `P05-P06-HANDOFF-V1` accepted.
- Planning documents đã review.
- Base `main` tại thời điểm review: `f3d6a89`.
- Docker Desktop và MongoDB replica set có thể chạy local.

## 4. Decision Work

### 4.1 Core Decisions

- [x] Review và approve `P06-GA-001..010`.
- [x] Khóa process score V1, null denominator, ranking và Grade semantics.
- [x] Khóa permission reuse, route cutover và P05 Gradebook retirement.
- [x] Khóa durable invalidation/CAS recovery và privacy threshold `5`.

### 4.2 Conditional Disposition

- [x] `P06-GA-C01`: implement bounded CSV, runtime false đến security/Gate E.
- [x] `P06-GA-C02`: implement event foundation, runtime false mặc định.
- [x] `P06-GA-C03`: implement Student trend foundation, runtime false mặc định.
- [x] `P06-GA-C04`: implement Admin learning outcome, hidden đến privacy tests.
- [x] `P06-GA-C05`: defer weighted process score V2.
- [x] `P06-GA-C06`: defer XLSX/async/private export sang P07.

### 4.3 Technical Acceptance

- [x] Cutover, DTO/query và source-event invalidation contracts accepted.
- [x] API/data/migration/rollback accepted.
- [x] `68` Must + `6` Conditional acceptance model accepted.
- [x] WBS, Parent PR và Execution Parts mapping accepted.
- [x] Technical decisions chuyển `Accepted`.
- [x] Role-based approval record và review limitation được ghi minh bạch.

## 5. Baseline Commands

```text
npm ci
npm run check:ci
npm run test:integration
npm run test:openapi
npm run audit:production
docker compose up -d --build
docker compose ps
```

Integration phải dùng MongoDB replica set:

```text
MONGODB_INTEGRATION_URI=mongodb://127.0.0.1:27018/microlearning-ci?replicaSet=rs0&directConnection=true
```

HTTP smoke:

```text
GET http://127.0.0.1:4000/health
GET http://127.0.0.1:4000/ready
GET http://127.0.0.1:4000/api-docs/
GET http://127.0.0.1:3000/
```

## 6. Baseline Result

| Check | Expected | Actual | Result |
| --- | --- | --- | --- |
| Dependency install | Lockfile install thành công | 471 packages | Pass |
| Repository CI | Lint/type/test/coverage/build Pass | API `180/180`, Web `99/99` | Pass |
| Integration | Mongo transaction suites Pass | `16` files, `72/72` | Pass |
| OpenAPI | Contract tests Pass | `9/9` | Pass |
| Production audit | Managed production gate Pass | Pass với time-bound router exceptions | Pass |
| Docker build/start | Mongo/API/Web start | Cả ba service healthy | Pass |
| HTTP smoke | API/Web/Swagger trả `200` | `4/4` endpoints | Pass |
| Planning structure/encoding | Đủ Part/ID, UTF-8 hợp lệ | `63` files, `18` parts, `311` unique P06 IDs | Pass |

Chi tiết command, performance observation và environment precondition nằm tại
`../gate-a-review-evidence.md`.

## 7. Required Evidence

| Evidence | Status | Location |
| --- | --- | --- |
| Gate A approval record | Pass | `../gate-a-decision-sheet.md` |
| Decision rationale/local baseline | Pass | `../gate-a-review-evidence.md` |
| Planning document validation | Pass | `../gate-a-review-evidence.md` |
| Planning PR URL | Pass | `https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/16` |
| Planning PR CI URL | Pass | Actions run `30448148966`; `6/6` checks Pass |
| Planning merge commit | Pass | Squash merge `e7437bc` |
| Post-merge main CI | Pass | Actions run `30448420376` |
| Post-merge local sync/clean status | Pass | Local `main` at `e7437bc`, clean before closure branch |

## 8. Stop Conditions

- Một core decision bị từ chối.
- Conditional chưa có owner/disposition.
- P05 regression hoặc main CI đỏ.
- Planning branch chưa up-to-date.
- Có secret/private data trong diff.
- Planning PR không qua required checks hoặc required review.
- Có business code lẫn trong planning PR.

## 9. Merge Procedure

1. Review `git diff --check` và chỉ stage planning/common roadmap files.
2. Commit trên `docs/phase-06-planning-baseline`.
3. Push branch và tạo planning PR vào `main`.
4. Chờ toàn bộ required checks Pass.
5. Nhận approval theo branch protection; không bypass rule.
6. Merge PR, ghi PR URL, CI URL và merge commit.
7. Chạy:

```text
git switch main
git pull origin main
git status --short
```

8. Cập nhật Part 00 `DONE`, Implementation `READY_TO_CODE` và Part 01 `READY` bằng change đã
   merge/được trace đến activation commit.

## 10. Definition Of Done

- `P06-AC-001..008` Pass.
- Gate A `APPROVED`.
- Planning PR merged.
- Phase 06 `READY_TO_CODE`.
- Part 01 chuyển `READY`.

Current result: `P06-AC-001..008` Pass, Gate A approved, planning PR merged và local activation
verified. Part 00 là `DONE`; Part 01 chuyển `READY`.
