# Phase 01 Repository Structure

## 1. Cấu trúc hiện thực

```text
Microlearning-RESFULL-API-devOps/
|-- apps/
|   |-- web/
|   `-- api/
|-- business-analysis/
|-- docs/
|   `-- implementation/
|       |-- common/
|       |-- phase-01/
|       |-- phase-02/
|       `-- ... phase-08/
|-- infrastructure/
|   |-- docker/
|   |-- ci/
|   `-- cloud/
|-- packages/
|-- .github/
|-- docker-compose.yml
|-- package.json
`-- package-lock.json
```

## 2. Ownership

| Path | Owner | Quy tắc |
| --- | --- | --- |
| `apps/web` | Frontend | Không truy cập MongoDB/secret; business source of truth là API |
| `apps/api` | Backend | Authorize/validate/orchestrate và kiểm soát data access |
| `packages` | Technical Lead | Chỉ tạo package khi có chia sẻ thật; không tạo abstraction rỗng |
| `infrastructure` | DevOps | Runtime/config/runbook; không lưu credential |
| `business-analysis` | BA/Product | Business baseline/change control |
| `docs/implementation` | Technical Lead/QA/DevOps | Execution plan, evidence và technical governance |

## 3. Root Commands

| Command | Mục tiêu |
| --- | --- |
| `npm run dev` | Chạy Web/API development |
| `npm run lint` | Static code quality |
| `npm run format:check` | Kiểm tra format |
| `npm run typecheck` | TypeScript strict check |
| `npm run test` | Toàn bộ automated tests |
| `npm run build` | Production build Web/API |
| `npm run check` | Quality gate tổng hợp |

## 4. Dependency Direction

- Web: `app -> features -> shared`.
- API: `route -> middleware/controller -> service/use case -> repository -> MongoDB`.
- Domain module không import trực tiếp UI code.
- Controller không truy vấn Mongoose trực tiếp.
- Shared module không trở thành nơi chứa business logic không rõ owner.

## 5. Version Và Dependency

- Node `24.14.0` được pin trong `.nvmrc`, `.node-version`, engines và Dockerfiles.
- Một `package-lock.json` ở root là nguồn deterministic install.
- Dependency production mới phải qua audit/license/purpose review.
- Generated `dist`, coverage, `.env` và `node_modules` không được commit.
