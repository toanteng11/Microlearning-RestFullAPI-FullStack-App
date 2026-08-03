# Part 16 - Quality Hardening

## Goal

Chứng minh toàn bộ Must scope hoạt động ổn định, an toàn và đạt NFR trên integrated stack.

## Parent PR

`P06-PR08 - Quality And Exit`

## Dependencies

- Part 07-14 `DONE`.
- Part 15 `DONE` hoặc các capability `APPROVED_NA`.

## Work

1. Thêm deterministic reporting seed.
2. Seed chạy lại không duplicate và giữ account P02-P05.
3. Tạo dataset benchmark tối thiểu 100 Students x 50 activities.
4. Chạy `P06-PERF-001..006`.
5. Lưu explain plans và xác nhận intended indexes.
6. Chạy 12 P06 browser E2E và full regression.
7. Chạy RBAC, IDOR, projection, threshold, injection và rate/abuse tests.
8. Chạy Docker integrated stack, API/Web/Swagger smoke.
9. Review desktop/mobile visual và accessibility.
10. Cập nhật CI chỉ khi reporting commands/tests thật đã tồn tại.

## Mandatory Commands

```text
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run test:coverage
npm run test:integration
npm run test:openapi
npm run build
npm run test:e2e
npm run check:ci
docker compose up -d --build
```

## Evidence

- test counts và coverage;
- performance results + dataset;
- explain plan;
- security/privacy result;
- Playwright report/screenshots;
- Docker health/smoke;
- defect list và disposition.

## Definition Of Done

- `P06-AC-051..067` Pass.
- P02-P05 regression Pass.
- Critical/High defects bằng `0`.
- Không bypass quality gate.
- Release candidate commit có thể clean-clone.

## Implementation Status

`LOCAL_PASS` tại ngày `2026-08-03`.

- `npm run check:ci`: Pass; API `230/230`, Web `126/126`.
- Mongo replica-set integration coverage: `97/97`.
- OpenAPI: `10/10`.
- Fresh Docker stack và deterministic seed: Pass.
- Full browser E2E: `34/34`.
- 100x50 Gradebook p95: `78.87 ms`; reporting calculator p95: `1069.79 ms`.
- Desktop/mobile visual, overflow và Axe serious/critical: Pass/`0`.
- Clean clone `npm ci` + `npm run check:ci`: Pass.
- Production dependency audit: Pass với time-bound React Router exceptions đã được policy quản lý.

Chi tiết tại `quality-hardening-evidence.md`.
