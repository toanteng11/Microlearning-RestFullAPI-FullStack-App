# Phase 01 Scope And Deliverables

## 1. In Scope

- Git repository và branch `main`.
- npm workspaces cho `apps/web` và `apps/api`.
- Node.js/npm version contract, TypeScript strict, ESLint và Prettier.
- ReactJS/Vite App Shell, routing, 404, global error boundary và System Status page.
- Node.js/Express app composition, middleware, error envelope, request ID và structured logging.
- MongoDB/Mongoose connection, shutdown và readiness status.
- Health, readiness, version, OpenAPI JSON và Swagger UI endpoints.
- Web/API Dockerfiles và Docker Compose Local/Integration.
- Pull Request CI workflow, dependency audit, secret scan và PR template.
- Automated tests, root README, ADR, architecture và exit evidence.

## 2. Out Of Scope

- Student registration/login, JWT, refresh token, RBAC và account lifecycle.
- Teacher Invitation Link và Admin user management.
- Classroom, enrollment, course, lesson, deadline, quiz, assignment và grade.
- Object storage/media upload.
- Production Cloud deployment, Production domain/TLS và secret manager.
- Kubernetes, microservices, queue, distributed cache và multi-region recovery.

## 3. Deliverables

| ID | Deliverable | Location | Acceptance basis |
| --- | --- | --- | --- |
| P01-D01 | Root workspace/toolchain | Repository root | `npm ci`, lint, format, typecheck |
| P01-D02 | React Web foundation | `apps/web` | Web tests/build/HTTP smoke |
| P01-D03 | Express API foundation | `apps/api` | API tests/build/health smoke |
| P01-D04 | MongoDB integration | API database module/Compose | readiness `mongodb=UP` |
| P01-D05 | OpenAPI/Swagger | API docs module | validation test, HTTP 200 |
| P01-D06 | Docker local runtime | Dockerfiles/Compose | images build, services healthy |
| P01-D07 | CI baseline | `.github/` | workflow syntax and local equivalent gates |
| P01-D08 | Implementation documentation | `docs/implementation/phase-01` | document checklist and traceability |

## 4. Scope Control

Yêu cầu nghiệp vụ mới phát hiện trong Phase 01 được ghi vào backlog phase sở hữu, không chen vào foundation trừ khi thiếu nó làm nền tảng không thể vận hành an toàn. Mọi scope change phải ghi owner, effort, dependency, risk và acceptance impact.
