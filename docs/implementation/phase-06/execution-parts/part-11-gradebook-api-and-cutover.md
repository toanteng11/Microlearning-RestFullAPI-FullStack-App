# Part 11 - Gradebook API And Cutover

## Goal

Thay thế P05 Basic Gradebook bằng một P06 Gradebook contract duy nhất, bounded và đúng privacy.

## Parent PR

`P06-PR05 - Gradebook`

## Dependencies

- Part 06 `DONE`.
- Part 09 Teacher scope/service stable.
- Gate A decision `P06-GA-005`, `P06-GA-008` Accepted.

## Files

```text
gradebook-reporting.service.ts
gradebook-cell.policy.ts
grade-average.policy.ts
apps/api/src/docs/phase-six-gradebook.openapi.ts
apps/api/src/modules/phase-five.router.ts
apps/api/src/modules/phase-six.router.ts
grades/grade.repository.ts
grades/grade.service.ts
```

## Work

1. Query bounded rows/columns với stable activity/Student order.
2. Cell trả độc lập completion, grading, late/missing và returned score.
3. Average weighted by returned points, không dùng draft Grade.
4. Regrade/deadline mutation invalidation cập nhật đúng scope.
5. Remove P05 Gradebook route registration/flag/operation cùng commit cutover.
6. Add P06 route/OpenAPI contract cùng lúc.
7. Count/items dùng cùng scoped filter.
8. Verify no N+1 và intended indexes.

## Tests

- `P06-UT-009..014`.
- `P06-IT-039..042`.
- `P06-PERF-004`.
- `P06-AC-035..041`, `P06-AC-054..058`.

## Stop Conditions

- Old/new route cùng method/path tồn tại.
- Web phải suy ra status từ score.
- Draft Grade xuất hiện trong Student projection/average.
- Rows/columns không có hard limit.

## Definition Of Done

- P05 Gradebook contract được retire atomically.
- Runtime/OpenAPI chỉ còn một Gradebook operation.
- Privacy, status precedence, average và performance tests Pass.

## Implementation Result

| Field | Result |
| --- | --- |
| Status | `IN_REVIEW_STACKED` |
| Branch | `feature/phase-06-gradebook` |
| Code commit | `fe36dda` |
| Atomic cutover | Pass; P05 route/service/schema/OpenAPI/flag đã retire |
| API/OpenAPI | Pass; một operation `getTeacherCourseGradebook` |
| Unit/integration | API `215/215`; Mongo replica-set `90/90` |
| Performance | `100x50`, p95 `160.69 ms`, target `<=1500 ms` |
| Evidence | `gradebook-evidence.md` |

Local Definition of Done đã đạt. Trạng thái chỉ đổi thành `DONE` sau P06-PR05 required CI,
review, merge và post-merge `main` CI Pass.
