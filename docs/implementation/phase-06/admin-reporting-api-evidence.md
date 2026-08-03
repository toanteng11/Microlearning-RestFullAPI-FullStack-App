# Phase 06 Admin Reporting API Evidence

## 1. Identity

| Field | Value |
| --- | --- |
| Execution Part | Part 13 - Admin Reporting API |
| Parent PR | `P06-PR06 - Admin Reporting` |
| Branch | `feature/phase-06-admin-reporting` |
| Code commit | `2bbbc2d` |
| Captured date | 2026-08-02 |
| Local decision | `PASS_REMOTE_PENDING` |

## 2. Delivered Contract

| Method/Path | Permission | Result |
| --- | --- | --- |
| `GET /api/v1/admin/dashboard` | `report.view_governance` | Pass |
| `GET /api/v1/admin/reports/governance` | `report.view_governance` | Pass |
| `GET /api/v1/admin/audit-logs` | `report.audit_view` | Pass |

Dashboard và governance response luôn có đủ role/status/source/lifecycle key, kể cả key có giá trị
`0`. Không có endpoint all-users mới; các danh sách Student/Teacher/Admin theo role của Phase 02 vẫn
là workflow quản trị user duy nhất.

## 3. Business And Privacy Evidence

| Requirement | Evidence | Result |
| --- | --- | --- |
| `P06-AC-043` | User count theo role, status và registration source từ `UserModel` | Pass |
| `P06-AC-044` | Invitation effective expiry; Classroom/Course/enrollment lifecycle count | Pass |
| `P06-AC-045` | Strict query; default 30 ngày; max 365 ngày; IANA timezone/date-only | Pass |
| `P06-AC-046` | Admin DTO/OpenAPI deny Grade, answer, Submission, feedback và raw audit state | Pass |
| `P06-AC-047` | Không thêm all-user endpoint hoặc arbitrary organization scope | Pass |
| `P06-AC-048` | Policy group `<5` trả `SUPPRESSED`; governance count exempt theo definition | Pass |
| `P06-AC-049` | Super Admin dùng cùng redaction và threshold policy | Pass |
| `P06-AC-050` | Governance/Audit report view ghi safe AuditLog | Pass |

Safe report-view AuditLog chỉ chứa report ID, definition version, tên filter, độ dài date range,
pagination, row count, result và request ID. Không lưu giá trị filter, exported row, `oldValue`,
`newValue`, token/hash hay dữ liệu học tập.

## 4. Test Evidence

### CI-equivalent local gate

```text
npm run check:ci
Result: Pass
API: 34 files, 220/220 tests Pass
API coverage: statements 77.90%, branches 62.68%, functions 73.92%, lines 79.93%
Web: 20 files, 115/115 tests Pass
Web coverage: statements 84.02%, branches 72.69%, functions 80.11%, lines 87.22%
Typecheck, lint, negative lint gate, format check and production build: Pass
```

### Focused Mongo integration

```text
MONGODB_INTEGRATION_URI=mongodb://127.0.0.1:27017/microlearning-ci-admin-report
npm run test:integration --workspace @microlearning/api -- \
  --run tests/integration/phase-six-admin-reporting.integration.test.ts --reporter=verbose

Result: 1 file, 4/4 tests Pass
```

Local focused execution dùng database riêng trên MongoDB standalone vì Docker Desktop chưa chạy.
Suite này không dùng transaction; required GitHub Actions sẽ chạy lại trên MongoDB replica set trước
khi merge P06-PR06.

## 5. Performance And Index Evidence

```json
{"event":"phase06.admin_reporting.performance","sampleSize":10,"p95Ms":28.0702}
```

- Dataset: `200` AuditLog synthetic rows.
- Query: `actorRole=ADMIN`, page `1`, limit `50`, default 30-day range.
- Gate: `P06-PERF-006 <=1200 ms`.
- Actual: p95 `28.07 ms`.
- Index hint executed successfully: `ix_audit_logs_actor_role_created`.
- Additional named indexes: `ix_audit_logs_action_created`,
  `ix_audit_logs_resource_created_stable`.

## 6. OpenAPI Evidence

- Three unique operation IDs are registered in `PHASE_SIX_OPENAPI_OPERATIONS`.
- Every operation declares bearer security and `200/400/401/403/422/503` responses as applicable.
- Runtime/OpenAPI route map parity test Pass.
- `AdminAuditSummary` schema has `additionalProperties=false` and excludes raw metadata/state.
- Adoption, learning-outcomes and export routes remain absent because they belong to Part 15.

## 7. Remaining Remote Evidence

- Push branch and open/update P06-PR06.
- Required GitHub Actions `6/6` Pass, including replica-set integration and Secret Scan.
- Record PR URL/run URL and review result.
- Part 14 implements Admin Web and browser E2E before P06-PR06 can merge.

Part 13 is complete for local implementation and review. It is not marked `DONE` until Parent PR
required CI, review and merge conditions are satisfied.
