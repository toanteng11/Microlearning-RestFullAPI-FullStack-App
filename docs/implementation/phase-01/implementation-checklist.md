# Phase 01 Implementation Checklist

## 1. Repository And Toolchain

- [x] Git repository và branch `main`.
- [x] npm workspaces Web/API.
- [x] Node/npm pin và engines.
- [x] Lock file, `.gitignore`, `.editorconfig`.
- [x] ESLint, Prettier và TypeScript strict.
- [x] Root dev/check commands.

## 2. Web

- [x] ReactJS/Vite bootstrap.
- [x] App Shell/router/404/Error Boundary.
- [x] Public config validation.
- [x] API client.
- [x] System Status loading/error/retry/success.
- [x] Responsive styles.
- [x] Component tests và production build.

## 3. API

- [x] Express app/server separation.
- [x] Environment fail-fast validation.
- [x] Request ID, Pino logging/redaction.
- [x] Helmet, CORS và body limit.
- [x] Error envelope và 404 handler.
- [x] Health/readiness/version endpoints.
- [x] Graceful shutdown.
- [x] Integration tests và production build.

## 4. MongoDB And Contract

- [x] Mongoose connect/disconnect/status.
- [x] MongoDB readiness behavior.
- [x] OpenAPI 3.0.3 document.
- [x] Swagger UI và raw JSON routes.
- [x] Contract validation test.

## 5. Docker And CI

- [x] Multi-stage Web/API Dockerfiles.
- [x] API non-root runtime.
- [x] Docker Compose Web/API/MongoDB.
- [x] Health/dependency ordering và internal DB network.
- [x] Pull Request CI workflow.
- [x] Dependency audit job.
- [x] Pull Request template.
- [ ] GitHub remote configured.
- [ ] Branch protection enabled.
- [ ] Remote CI pass/fail evidence captured.

## 6. Documentation And Evidence

- [x] Root README/setup/troubleshooting.
- [x] Common coding/workflow/DoD standards.
- [x] Architecture overview và ADRs.
- [x] Phase documents tách theo area.
- [x] Local acceptance/evidence/exit report.
- [ ] Independent clean-clone onboarding.
- [ ] Browser visual/console verification evidence.

## 7. Completion Rule

Checkbox pending phải có owner trong `exit-report.md`; không xóa hoặc đánh dấu hoàn thành chỉ để đóng phase. Khi external evidence có sẵn, cập nhật checklist, acceptance, evidence register và exit report trong cùng Pull Request.
