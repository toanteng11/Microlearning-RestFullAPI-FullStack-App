# Part 04 - Summary Data Layer

## Goal

Tạo schema, indexes và repositories cho read model/invalidation mà chưa gắn source mutation.

## Parent PR

`P06-PR02 - Foundation`

## Dependencies

- Part 02 và Part 03 `DONE`.
- `data-model-and-indexes.md` Accepted.

## Files

```text
course-progress-summary.model.ts
course-progress-summary.repository.ts
reporting-invalidation.model.ts
reporting-invalidation.repository.ts
apps/api/src/shared/database/phase-six-indexes.ts
```

## Work

1. Tạo versioned `CourseProgressSummary`.
2. Enforce unique Student/Course/definition scope.
3. Không lưu display name, email, answer, feedback hoặc raw Submission.
4. Tạo indexes cho rank/list/freshness/invalidation claim.
5. Repository hỗ trợ bounded list, stable rank và optimistic replace.
6. Invalidation repository hỗ trợ upsert/coalesce `reasons[]`.
7. Claim/fail/resolve dùng revision + claim token compare-and-swap.
8. Course invalidation supersede Student scopes theo contract.

## Tests

`P06-IT-001..010`, trừ source transaction behavior được hoàn thành ở Part 05.

## Guardrails

- Không tạo TTL cho Conditional collection khi capability tắt.
- Không dùng collection scan cho list/rank chính.
- Không coi read model là source of truth.

## Definition Of Done

- Schema/index creation idempotent.
- Duplicate/invariant/revision/claim tests Pass.
- Explain plan dùng intended named indexes.
- `P06-AC-009`, `P06-AC-010`, phần repository của `P06-AC-012` Pass.

## Implementation Result

`DONE` tại commit `1afe813`.

- Versioned summary/invalidation models, named indexes và environment-aware index initialization
  đã được thêm.
- Summary replace dùng optimistic revision; invalidation dùng reason set-union, newest watermark,
  claim token và revision CAS.
- Default ranking dùng compound index, stable six-field order và đặt score `null` cuối.
- Focused Mongo suite chứng minh unique scope, invariant, CAS, index explain và broad-scope
  precedence.
