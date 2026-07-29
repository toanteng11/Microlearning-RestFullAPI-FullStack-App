# Part 01 - Contract Permissions And Environment

## Goal

Tạo nền contract compile-safe cho module reporting mà chưa expose route hoặc truy vấn dữ liệu.

## Parent PR

`P06-PR02 - Foundation`

## Dependencies

- Part 00 `DONE`.
- `runtime-contract-catalog.md` và `report-dto-and-query-contracts.md` đã Accepted.

## Files

Create:

```text
apps/api/src/modules/reporting/reporting.constants.ts
apps/api/src/modules/reporting/reporting.types.ts
apps/api/src/modules/reporting/reporting.schemas.ts
apps/api/src/modules/reporting/reporting.dto.ts
apps/api/src/modules/reporting/reporting.errors.ts
```

Modify:

```text
apps/api/src/config/*
apps/api/src/modules/authorization/*
.env.example
```

Chỉ dùng đường dẫn thực tế tương ứng nếu repository đặt config/authorization ở vị trí khác.

## Work

1. Thêm permissions P06 mới chỉ cho Admin/report/export theo approved baseline.
2. Reuse Student/Teacher permissions P04/P05; không tạo quyền trùng nghĩa.
3. Thêm env schema, default và validation cho read-model/Conditional flags.
4. Khai báo enums, freshness, data state, scope, sort, pagination và nullable metric.
5. Khai báo canonical DTO/query schemas, reject unknown fields.
6. Thêm error codes P06 vào `AppError` catalog.
7. Thêm OpenAPI component schemas cơ bản nhưng chưa thêm runtime paths.

## Tests

- Permission grant/deny tests.
- Env default/invalid value tests.
- DTO/query strict parsing tests.
- Typecheck và OpenAPI schema compile.

## Guardrails

- Không tính metric trong schema.
- Không định nghĩa permission map riêng ở Web.
- Không thêm route hoặc Mongo model.
- Conditional flag mặc định `false`.

## Definition Of Done

- Contract không còn `any` hoặc `TBD`.
- Env thiếu/sai trả configuration error rõ ràng.
- `npm run lint`, `npm run typecheck`, API unit tests và build Pass.
- Không thay đổi behavior P02-P05.
