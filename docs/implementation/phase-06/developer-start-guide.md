# Phase 06 Developer Start Guide

## 1. Không Bắt Đầu Code Khi

- Gate A chưa `APPROVED`.
- Planning branch chưa merge `main`.
- Local branch không cập nhật từ `main`.
- P05 regression/CI đang đỏ.
- Formula/privacy/Conditional decision của slice chưa rõ.

## 2. Required Reading

Đường ngắn:

1. `README.md`;
2. `gate-a-decision-sheet.md`;
3. `compatibility-and-cutover-plan.md`;
4. `execution-parts/README.md`;
5. file `execution-parts/part-XX-*.md` đang thực hiện;
6. `source-file-blueprint.md`;
7. `runtime-contract-catalog.md`;
8. `report-dto-and-query-contracts.md`;
9. `source-event-invalidation-matrix.md`;
10. `api-ui-integration-matrix.md`;
11. `test-case-catalog.md`;
12. `pull-request-execution-guide.md`;
13. domain document của slice.

## 3. Prepare Local

```text
git switch main
git pull origin main
npm ci
docker compose up -d --build
npm run check:ci
npm run test:integration
npm run test:openapi
```

Không commit `.env`; dùng `.env.example` làm contract và local secret riêng.

## 4. Create Branch

Không dùng `codex/` theo quy ước dự án:

```text
git switch -c feature/phase-06-reporting-foundation
```

Branch khác xem `phase-plan.md`.

## 5. First Slice Checklist

PR02 foundation thực hiện tuần tự theo:

1. Part 01 - Contract Permissions And Environment;
2. Part 02 - Metric And Grade Policies;
3. Part 03 - Reader Ports And Safe Adapters;
4. Part 04 - Summary Data Layer;
5. Part 05 - Transactional Invalidation;
6. Part 06 - Refresh Reconciliation And Migration.

Không bắt đầu UI trước stable API contract.

## 6. Daily Workflow

```text
git status --short
npm run lint
npm run typecheck
npm run test --workspace @microlearning/api
npm run test --workspace @microlearning/web
npm run build
```

Trước push chạy test của slice; trước PR chạy `npm run check:ci` và integration/OpenAPI/E2E
phù hợp.

## 7. Implementation Guardrails

- Reuse repo pattern.
- `now()` injectable.
- Scope trước query.
- Batch, không N+1.
- Calculator pure.
- No PII in read model/event/log.
- No official metric in Web.
- No local export file.
- Conditional flag default false.
- OpenAPI cùng PR với route.

## 8. Evidence As You Work

Cập nhật:

- WBS task status;
- acceptance/test execution;
- evidence register;
- risk/issues;
- migration/query benchmark;
- PR URL/commit.

Không dồn evidence đến cuối phase.

## 9. Stop Conditions

Dừng merge và báo TL khi:

- data leak/permission ambiguity;
- formula khác baseline;
- source model phải đổi breaking;
- migration destructive;
- NFR không đạt dù đã dùng intended index;
- Conditional cần cloud/storage ngoài P06.

## 10. Ready For PR

- Scope chỉ thuộc một planned PR.
- Tests Pass.
- OpenAPI/docs updated.
- No unrelated file churn.
- No secret/local artifact.
- Evidence links ready.
- Risk/rollback in PR description.
