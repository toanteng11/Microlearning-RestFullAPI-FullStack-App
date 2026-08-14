# Phase 06 Gate B Foundation Evidence

## 1. Status

| Thuộc tính | Giá trị |
| --- | --- |
| Scope | Execution Part 01-06 |
| Branch | `feature/phase-06-reporting-foundation` |
| Implementation commit | `1afe813` |
| Local decision | `PASS` |
| Remote decision | `PASS`; included and revalidated in PR `#18`/main CI |
| Captured at | `2026-07-29`, local development environment |

Gate B chưa được công bố là hoàn thành trên `main` cho đến khi P06-PR02 vượt required checks,
review được xử lý và merge thành công.

## 2. Implemented Scope

| Part | Kết quả |
| --- | --- |
| 01 | Runtime contracts, permissions, strict query schemas, env và OpenAPI components |
| 02 | Deterministic metric, grade, ranking, Gradebook cell và freshness policies |
| 03 | Scoped reader ports và Mongo safe-projection adapters |
| 04 | Versioned summaries, durable invalidations, named indexes và CAS repositories |
| 05 | Required transactional invalidation writer trong Phase Three/Four/Five source mutations |
| 06 | Refresh, bounded rebuild, reconciliation, migration preflight và operations CLI |

Reporting runtime API paths và Web UI không thuộc P06-PR02. Chúng chỉ bắt đầu từ Part 07 sau khi
foundation merge vào `main`.

## 3. Automated Verification

| Gate | Kết quả |
| --- | --- |
| `npm run check:ci` | Pass |
| API unit tests | `202/202` Pass |
| API unit coverage | Statements `78.19%`, branches `61.75%`, functions `71.12%`, lines `80.12%` |
| Web regression tests | `99/99` Pass |
| Mongo replica-set integration | `82/82` Pass |
| Integration coverage | Statements `78.65%`, branches `59.04%`, functions `84.28%`, lines `81.29%` |
| Focused P06 Mongo foundation | `11/11` Pass |
| API/Web production build | Pass |
| Formatting/lint/typecheck | Pass |

Coverage thresholds không bị hạ. Mongo adapters, repositories và transactional orchestration được
đo bằng replica-set integration coverage; pure policies, schemas và validation vẫn nằm trong unit
coverage.

## 4. Data And Concurrency Evidence

- Summary unique scope/version, invariants và optimistic revision conflict: Pass.
- Default ranking stable, score `null` nằm cuối và explain dùng
  `report_summary_course_default_ranking`: Pass.
- Invalidation reason union, newest source watermark và broad-scope precedence: Pass.
- New source event trong lúc worker xử lý làm stale claim resolve no-op: Pass.
- Source marker và invalidation cùng commit hoặc cùng rollback trong Mongo transaction: Pass.
- Refresh fault sau source commit giữ source nguyên vẹn và chuyển invalidation sang retry state:
  Pass.
- Student rebuild, full roster rebuild theo bounded batch, roster removal và activity required
  change: Pass.
- Source watermark thay đổi trong lúc calculate kích hoạt bounded retry: Pass.
- Migration preflight chạy lặp, chặn PII projection và invalid scope: Pass.

## 5. Operations Evidence

Các lệnh sau chạy trên isolated MongoDB replica set:

```text
npm run reporting:rebuild -- --all
npm run reporting:reconcile -- --all
npm run reporting:reconcile -- --all --repair
npm run reporting:benchmark -- --students=100 --activities=50 --iterations=3
```

Kết quả:

| Command | Actual |
| --- | --- |
| Rebuild all | Success; Course `0`, failed `0` |
| Reconcile dry-run | Success; differences `0` |
| Reconcile repair | Success; differences `0` |
| Benchmark | `100x50`, 3 iterations, p95 `278.75 ms`, heap `35 MB` |

Dataset migration hiện không có legacy P06 summary, do đó backfill candidate count là `0`.
Preflight/version activation và rebuild path đã được kiểm thử; không tạo dữ liệu giả để tuyên bố
backfill production.

## 6. Privacy And Security Review

- Summary schema không chứa full name, email, student code, answer, feedback hoặc raw Submission.
- Migration chặn document có prohibited fields.
- Grade reader tách visibility contract; Student/Admin aggregate không mặc định nhận draft Grade.
- Query schemas strict, date/page bounds và IANA timezone được validate.
- Conditional flags vẫn mặc định `false`; chưa expose CSV/event/trend runtime capability.
- CLI chỉ xuất structured operational counts, không in credential hoặc PII.

## 7. Remaining Remote Evidence

- Push branch và mở `P06-PR02 - Foundation`.
- Required CI, dependency audit và Secret Scan phải Pass.
- Review conversations phải được resolve.
- Merge vào `main`, pull local `main` và xác nhận post-merge CI.
- Sau các bước trên mới đổi Part 06 thành `DONE` và Part 07/09/11/13 thành `READY`.
