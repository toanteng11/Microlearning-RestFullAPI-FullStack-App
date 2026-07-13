# Phase 01 Evidence Register

## 1. Automated Evidence

| Evidence ID | Nội dung | Result | Source |
| --- | --- | --- | --- |
| P01-EV-001 | Clean locked install | 427 packages installed, audit clean | `npm ci` output |
| P01-EV-002 | Full local quality gate | Pass | `npm run check` output |
| P01-EV-003 | API tests | 7/7 pass | Vitest API report |
| P01-EV-004 | Web tests | 6/6 pass | Vitest Web report |
| P01-EV-005 | Production builds | API/Web pass | TypeScript/Vite output |
| P01-EV-006 | Dependency security | 0 vulnerabilities | npm audit output |
| P01-EV-007 | Negative lint gate | Intentional violation bị từ chối | `scripts/verify-negative-lint-gate.mjs` output |
| P01-EV-029 | Secret scan CI configuration | Pass | `.github/workflows/ci.yml`, Pull Request #1 |
| P01-EV-031 | CI coverage gate | Pass | `npm run check:ci`, mandatory `coverage-reports` artifact |
| P01-EV-032 | API coverage | 76.92% statements, 48.71% branches, 76% functions, 78.66% lines | Vitest V8 report |
| P01-EV-033 | Web coverage | 81.39% statements, 75% branches, 81.25% functions, 85% lines | Vitest V8 report |

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
| P01-EV-034 | Consolidated phase exit evidence | `phase-exit-evidence.md` |

## 4. External Và Independent Evidence

| Evidence ID | Nội dung | Result | Source |
| --- | --- | --- | --- |
| P01-EV-024 | GitHub CI successful run | Pass | [Actions run 29201412037](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29201412037) |
| P01-EV-025 | Automated negative gate assertion | Pass | `npm run verify:negative-gate`; chạy trong `npm run check:ci` |
| P01-EV-026 | Branch protection/settings record | Pass | Repository Owner xác nhận ngày `2026-07-13`; cấu hình chi tiết trong `phase-exit-evidence.md` |
| P01-EV-027 | Clean-clone onboarding | Pass | Fresh clone từ `origin/main` tại `d425e0b`, `npm ci`, `npm run check` |
| P01-EV-028 | Browser visual/console/network review | Pass | System Status desktop/mobile và Swagger desktop/mobile, không có console error |
| P01-EV-030 | Secret scan successful run | Pass | [Pull Request #1](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/1), job `Secret scan` |

## 5. Evidence Retention

GitHub Actions giữ coverage artifact trong 14 ngày. Evidence ổn định được ghi lại trong `phase-exit-evidence.md`; URL CI/PR được giữ để truy vết về nguồn. Không đưa token, `.env`, raw database URI hoặc sensitive log vào evidence.
