# Part 09 - Teacher Reporting API

## Goal

Cung cấp Teacher Course Dashboard, ranking, activity/assessment analytics và Student detail với
stable pagination và ownership bắt buộc.

## Parent PR

`P06-PR04 - Teacher Reporting`

## Dependencies

- Part 06 `DONE` và P06-PR02 merged.

## Files

```text
teacher-reporting.service.ts
learning-progress/teacher-course-dashboard.service.ts
apps/api/src/modules/phase-six.router.ts
apps/api/src/docs/phase-six-teacher-reporting.openapi.ts
apps/api/tests/integration/phase-six-reporting.integration.test.ts
apps/api/tests/integration/phase-six-security.integration.test.ts
```

## Work

1. Resolve owned Course trước mọi aggregate query.
2. Dashboard trả roster, required/published, average, missing, late và ungraded summary.
3. Ranking dùng server-side search/filter/sort/page và six-field stable order.
4. Activity analytics có numerator/denominator rõ.
5. Assessment analytics chỉ dùng finalized/returned policy.
6. Student detail yêu cầu Student thuộc active roster.
7. Batch query, không Student x Activity loop.
8. Cut over old Teacher reporting handlers atomically.
9. Đồng bộ OpenAPI, permission, examples và error mapping.

## Tests

- `P06-IT-029..038`, `P06-IT-042`.
- `P06-PERF-002`, `P06-PERF-003` focused baseline.
- `P06-AC-028..034`, `P06-AC-038`, `P06-AC-039`.

## Stop Conditions

- Repository query chạy trước ownership.
- Ranking không có unique tie-breaker.
- Pagination duplicate/skip khi cùng score.
- Query count tăng theo Student x Activity.

## Definition Of Done

- Owned Dashboard/ranking/detail đúng source.
- Cross-Teacher/Course/Student bị chặn.
- Unknown filter/sort/operator trả controlled 400.
- OpenAPI/runtime route uniqueness Pass.

## Implementation Result - 2026-07-30

- Status: `DONE`.
- Code commit: `9096d78`.
- Sáu operation Teacher reporting đã được triển khai và chỉ còn một runtime owner tại Phase 06.
- Ownership được resolve trước roster/aggregate; cross-Teacher và Student ngoài active roster trả lỗi có kiểm soát.
- Ranking mặc định dùng six-field stable order; search/filter/sort/page chạy phía server, giới hạn `limit <= 50`.
- Activity và assessment analytics dùng batch readers, denominator rõ ràng và chỉ đưa Grade `RETURNED` vào average.
- OpenAPI parser/runtime parity Pass; query không hợp lệ trả `400`.
- API unit `210/210`, Mongo integration `87/87`, focused Teacher integration `2/2`.
- Benchmark `100 Students x 50 Lessons`: Dashboard p95 `562.55 ms`, ranking p95 `278.44 ms`.
- Chưa chuyển `DONE` cho tới khi Parent PR có remote CI Pass, review hoàn tất và merge.
