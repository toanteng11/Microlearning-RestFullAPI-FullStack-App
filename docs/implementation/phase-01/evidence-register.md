# Phase 01 Evidence Register

## 1. Automated Evidence

| Evidence ID | Nội dung | Result | Source |
| --- | --- | --- | --- |
| P01-EV-001 | Clean locked install | 427 packages installed, audit clean | `npm ci` output |
| P01-EV-002 | Full quality gate | Pass | `npm run check` output |
| P01-EV-003 | API tests | 7/7 pass | Vitest API report |
| P01-EV-004 | Web tests | 2/2 pass | Vitest Web report |
| P01-EV-005 | Production builds | API/Web pass | TypeScript/Vite output |
| P01-EV-006 | Dependency security | 0 vulnerabilities | npm audit output |
| P01-EV-007 | Negative lint gate | Exit 1 on intentional violation | ESLint output |

## 2. Runtime Evidence

| Evidence ID | Nội dung | Result |
| --- | --- | --- |
| P01-EV-008 | Docker image build | Web/API built |
| P01-EV-009 | Compose service status | MongoDB/API/Web healthy |
| P01-EV-010 | Basic health | HTTP 200, `UP` |
| P01-EV-011 | Readiness | HTTP 200, MongoDB `UP` |
| P01-EV-012 | Version | `0.1.0`, development artifact |
| P01-EV-013 | Swagger/OpenAPI | HTTP 200, OpenAPI 3.0.3 |
| P01-EV-014 | Web and SPA fallback | `/` và `/system-status` HTTP 200 |
| P01-EV-015 | CORS | Allowed header đúng; untrusted origin không được allow |
| P01-EV-016 | API container identity | `uid=1000(node)` |
| P01-EV-017 | Local dev runtime | Web `5173`, API `4000`, MongoDB `UP` |

## 3. Documentation Evidence

| Evidence ID | Nội dung | Location |
| --- | --- | --- |
| P01-EV-018 | Architecture | `architecture-overview.md` |
| P01-EV-019 | Technical decisions | `technical-decisions.md` |
| P01-EV-020 | Scope/tasks | `scope-and-deliverables.md`, `work-breakdown-structure.md` |
| P01-EV-021 | Acceptance | `acceptance-criteria.md` |
| P01-EV-022 | Risks/issues | `risk-and-issues.md` |
| P01-EV-023 | Exit conclusion | `exit-report.md` |

## 4. Pending External Evidence

| Evidence ID | Nội dung | Owner | Trigger |
| --- | --- | --- | --- |
| P01-EV-024 | GitHub CI successful run URL | DevOps | Sau khi cấu hình remote |
| P01-EV-025 | GitHub CI intentional failure URL | DevOps | Test branch/PR |
| P01-EV-026 | Branch protection screenshot/settings record | Repository Owner | Sau khi bật required checks |
| P01-EV-027 | Clean-clone onboarding record | QA/Developer khác | Trước full phase closure |
| P01-EV-028 | Browser screenshot/console/network review | Frontend/QA | Khi browser runtime sẵn sàng |

## 5. Evidence Retention

Khi có CI provider, output quan trọng phải được lưu bằng workflow URL/artifact thay vì chỉ ghi lại bằng văn bản. Không đưa token, `.env`, raw database URI hoặc sensitive log vào evidence.
