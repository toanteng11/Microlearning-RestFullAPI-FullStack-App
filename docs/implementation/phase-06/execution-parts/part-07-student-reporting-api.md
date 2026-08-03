# Part 07 - Student Reporting API

## Goal

Cung cấp Student Dashboard và Course progress APIs đúng own scope, privacy và freshness contract.

## Parent PR

`P06-PR03 - Student Reporting`

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING`

- API, RBAC, route cutover, OpenAPI và unit tests đã triển khai.
- Source commit: `f560233`.
- MongoDB integration test đã viết nhưng chưa chạy vì local Docker daemon chưa hoạt động.
- Bằng chứng: `../student-reporting-evidence.md`.

## Dependencies

- Part 06 `DONE` và P06-PR02 merged.

## Files

```text
student-reporting.service.ts
apps/api/src/modules/phase-six.router.ts
apps/api/src/docs/phase-six-student-reporting.openapi.ts
apps/api/src/docs/openapi.ts
apps/api/tests/phase-six-student-reporting.test.ts
apps/api/tests/integration/phase-six-student-reporting.integration.test.ts
```

## Work

1. Dashboard compose To-do V2, Course progress và recent returned Grade.
2. All-Course progress list có bounded pagination/stable order.
3. Course progress detail trả metric definition/freshness.
4. Denominator 0 trả `null`; trend thiếu dữ liệu trả `NO_DATA`.
5. Chỉ dùng authenticated Student ID, không nhận Student ID tùy ý từ client.
6. Reuse P05 To-do/Grade semantics.
7. Cut over moved Student reporting route atomically.
8. Đồng bộ OpenAPI response, error, nullability và examples.

## Tests

- `P06-IT-021..028`.
- OpenAPI route/parity cases.
- `P06-AC-019..026`, `P06-AC-051..060` liên quan Student.

## Definition Of Done

- Own Course trả đúng summary.
- Cross-Student/Course bị chặn không enumeration.
- Draft Grade/private feedback không xuất hiện.
- Runtime và OpenAPI chỉ có một operation trên moved path.
- Focused API, integration, OpenAPI và build Pass.
