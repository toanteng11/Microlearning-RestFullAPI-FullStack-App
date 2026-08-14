# Part 01 - Single-Origin Application Runtime

## Goal

Cho Node.js Production runtime phục vụ React, REST API, Swagger và operational endpoints cùng origin, giữ
đúng auth/RBAC behavior hiện hữu.

## Parent PR

`P07-PR01 - Production Runtime And Container`

## Dependencies

- Part 00 `DONE`.
- Phase 06 regression suite xanh.

## Work

1. assert route/middleware order hiện tại;
2. build React trước API package/runtime assembly;
3. mount fingerprinted static assets với immutable cache;
4. mount `index.html` no-cache;
5. thêm GET-only SPA fallback sau API/docs/health/static routes;
6. chuyển Web Production API base sang relative same-origin;
7. khóa proxy/cookie/CORS/security header behavior;
8. hoàn thiện health/readiness/version metadata;
9. hoàn thiện Production env fail-fast;
10. giữ graceful SIGTERM và MongoDB close contract;
11. thêm unit/integration tests cho routing/config/shutdown;
12. cập nhật OpenAPI/README nếu public paths đổi.

## Validation

- TC-005..014 Pass;
- existing API/OpenAPI/browser tests Pass;
- browser refresh trực tiếp trên protected deep link hoạt động;
- API unknown route không bị trả HTML;
- build không chứa `localhost`/server secrets.

## Evidence

Test report, route matrix, version response sample đã redaction.

## Stop Conditions

- auth cookie/CORS regression;
- static fallback che API error;
- Web và API cần hai Cloud origins;
- breaking route/OpenAPI change không có migration.

## Definition Of Done

- AC-009..013 local/CI Pass;
- routing/runtime contracts implemented;
- no Phase 01-06 regression.
