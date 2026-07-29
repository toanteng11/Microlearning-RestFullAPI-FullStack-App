# Part 02 - Metric And Grade Policies

## Goal

Khóa toàn bộ công thức reporting trong pure policies có thể kiểm thử độc lập.

## Parent PR

`P06-PR02 - Foundation`

## Dependencies

- Part 01 `DONE`.
- Gate A decisions `P06-GA-001..005` Accepted.

## Files

```text
apps/api/src/modules/reporting/metric-definition.policy.ts
apps/api/src/modules/reporting/process-score.policy.ts
apps/api/src/modules/reporting/grade-average.policy.ts
apps/api/src/modules/reporting/ranking.policy.ts
apps/api/src/modules/reporting/gradebook-cell.policy.ts
apps/api/tests/phase-six-metric-policy.test.ts
apps/api/tests/phase-six-gradebook-policy.test.ts
```

## Work

1. Cài đặt required/completed/progress calculation.
2. Denominator `0` trả `null`, không trả `0`.
3. `P06_PROCESS_SCORE_V1 = progressPercentage`.
4. Rounding one-decimal half-up theo contract.
5. Tính late/missing bằng effective deadline, kể cả Student exception.
6. Grade average chỉ current `RETURNED`, weighted by points.
7. Ranking theo six-field order và Student ID tie-breaker.
8. Gradebook giữ độc lập `completionStatus` và `gradingStatus`.
9. Freshness/partial policies dùng fixed `asOf` và injectable `now()`.

## Tests

`P06-UT-001..017` và `P06-UT-020`.

## Guardrails

- Pure function không gọi MongoDB, Express hoặc system clock trực tiếp.
- Không duplicate công thức ở Web.
- Không đưa draft Grade vào average.
- Null score luôn xếp cuối.

## Definition Of Done

- Các policy deterministic với cùng input/asOf.
- Unit tests boundary, tie, null, timezone và deadline exception Pass.
- `P06-AC-003..006`, `P06-AC-011` có automated evidence.
