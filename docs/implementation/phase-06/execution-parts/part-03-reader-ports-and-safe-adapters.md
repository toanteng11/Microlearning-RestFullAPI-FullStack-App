# Part 03 - Reader Ports And Safe Adapters

## Goal

Tạo các reader ports và Mongo adapters chỉ trả safe projection, có batch query và scope rõ ràng.

## Parent PR

`P06-PR02 - Foundation`

## Dependencies

- Part 01 `DONE`.
- Public repositories của Phase 03-05 đã được review.

## Files

Ports:

```text
reporting-scope.reader.ts
reporting-roster.reader.ts
reporting-activity.reader.ts
reporting-progress.reader.ts
reporting-grade.reader.ts
reporting-governance.reader.ts
reporting-audit.reader.ts
```

Adapters:

```text
apps/api/src/modules/reporting/adapters/mongo-reporting-*.reader.ts
```

Modify existing repositories chỉ khi cần batch/source watermark methods.

## Work

1. Scope reader xác minh actor, ownership và enrollment trước data query.
2. Roster reader chỉ trả Student ID/status cần cho aggregate.
3. Activity reader chỉ trả published/required/deadline metadata.
4. Progress reader trả completion/source revision theo batch.
5. Grade reader chỉ trả current Grade fields được phép.
6. Governance/audit reader trả metadata allowlist.
7. Mọi list method nhận bounded IDs/filter; không nhận raw client pipeline.
8. Thêm source watermark phục vụ freshness/rebuild.

## Tests

- Ownership/enrollment positive và negative.
- Batch query shape.
- No PII/answer/submission body/draft feedback projection.
- `P06-IT-010`, security cases liên quan `P06-AC-051..057`.

## Stop Conditions

- Cần import Question answer hoặc Submission body model vào reporting.
- Không thể scope trước query.
- Adapter phát sinh query theo từng Student x Activity.

## Definition Of Done

- Ports không phụ thuộc Express/Mongoose.
- Adapters trả plain typed projections.
- Query bounded, explicit projection và không N+1.
- Negative leakage tests Pass.

## Implementation Result

`DONE` tại commit `1afe813`.

- Bảy reader ports và Mongo adapters đã được triển khai bằng explicit allowlist projection.
- Scope, roster, activity, progress, grade, governance và audit reads đều tách khỏi Express.
- Bounded Student ID input và source watermark được enforce; không nhận raw aggregation pipeline.
- Summary/model tests và migration denylist xác nhận không lưu email, tên hiển thị, answer,
  feedback hoặc raw Submission.
