# Phase 01 Work Breakdown Structure

## 1. Quy ước

Mỗi task phải có owner, dependency, output và evidence. Estimate dưới đây là ngày công tham khảo, không thay thế đo lường thực tế.

## 2. P01-E01 - Decisions And Repository

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T001 | Review BA Architecture/API/DevOps/NFR | Review baseline | 0.5 | Done |
| P01-T002 | Chốt ADR toolchain/architecture | ADR-001..008 | 0.5 | Done |
| P01-T003 | Tạo Git/root folder/conventions | Repository skeleton | 0.5 | Done |
| P01-T004 | Tạo npm workspaces/root commands | Workspace/lock file | 0.5 | Done |
| P01-T005 | Pin Node/npm và prerequisites | Version contract | 0.25 | Done |

## 3. P01-E02 - Web Foundation

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T006 | Khởi tạo ReactJS/TypeScript/Vite | Web build | 0.5 | Done |
| P01-T007 | App Shell/router/404/Error Boundary | Navigation foundation | 0.75 | Done |
| P01-T008 | Tạo `app/features/shared` boundary | Source structure | 0.25 | Done |
| P01-T009 | API client/public config/error mapping | HTTP foundation | 0.5 | Done |
| P01-T010 | System Status page | Web/API smoke UI | 0.5 | Done |
| P01-T011 | Frontend component tests | Test evidence | 0.5 | Done |

## 4. P01-E03 - API Foundation

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T012 | Khởi tạo Node/Express/TypeScript | API build | 0.5 | Done |
| P01-T013 | Tách app/server và graceful shutdown | Runtime composition | 0.5 | Done |
| P01-T014 | Request ID/logging/Helmet/CORS/body limit | Middleware baseline | 0.75 | Done |
| P01-T015 | Health/readiness/version | Operational endpoints | 0.5 | Done |
| P01-T016 | Not Found/global error handler | Error envelope | 0.5 | Done |
| P01-T017 | API integration tests | Test evidence | 0.75 | Done |

## 5. P01-E04 - Configuration And MongoDB

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T018 | Environment schema/fail fast | Typed config | 0.5 | Done |
| P01-T019 | `.env.example` và local loading | Config contract | 0.25 | Done |
| P01-T020 | Mongoose connect/disconnect | Database lifecycle | 0.5 | Done |
| P01-T021 | MongoDB readiness status | Runtime evidence | 0.25 | Done |
| P01-T022 | Config/readiness tests | Test evidence | 0.5 | Done |

## 6. P01-E05 - OpenAPI And Swagger

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T023 | OpenAPI base/components | Contract document | 0.5 | Done |
| P01-T024 | Mô tả operational endpoints/examples | Documented APIs | 0.25 | Done |
| P01-T025 | Swagger UI và raw JSON routes | Interactive docs | 0.25 | Done |
| P01-T026 | OpenAPI validation test | Contract evidence | 0.5 | Done |

## 7. P01-E06 - Docker Local Environment

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T027 | API multi-stage/non-root image | API Dockerfile | 0.75 | Done |
| P01-T028 | Web/Nginx multi-stage/SPA image | Web Dockerfile | 0.75 | Done |
| P01-T029 | Compose Web/API/MongoDB | Integrated runtime | 0.75 | Done |
| P01-T030 | Docker ignore/health/config mapping | Safe context/runtime | 0.25 | Done |
| P01-T031 | Build/up/smoke evidence | Docker evidence | 0.5 | Done |

## 8. P01-E07 - CI Baseline

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T032 | Pull Request quality workflow | CI YAML | 0.75 | Done |
| P01-T033 | npm cache/artifact handling | CI optimization | 0.25 | Done |
| P01-T034 | Dependency audit/security gate | Security job | 0.5 | Done |
| P01-T035 | Branch protection requirements | Governance document | 0.25 | Done |
| P01-T036 | Pull Request run evidence | Remote evidence | 0.5 | Done |
| P01-T037 | Secret scan CI job | DevSecOps workflow | 0.25 | Done |

## 9. P01-E08 - Documentation And Exit

| Task | Nội dung | Output | Estimate | Trạng thái |
| --- | --- | --- | --- | --- |
| P01-T038 | Root setup/troubleshooting README | Onboarding guide | 0.5 | Done |
| P01-T039 | Architecture/module ownership | Architecture docs | 0.25 | Done |
| P01-T040 | Clean install/full quality gate | Test record | 0.5 | Done |
| P01-T041 | Traceability/risk/exit review | Exit report | 0.5 | Done |

## 10. Closure Result

`P01-T036` có evidence từ Pull Request #1 và GitHub Actions run. `P01-T037` đã pass remote và được đưa vào required checks. Toàn bộ task `P01-T001..P01-T041` đạt trạng thái `Done`.
