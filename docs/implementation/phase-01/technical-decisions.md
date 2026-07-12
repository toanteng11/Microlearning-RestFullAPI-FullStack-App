# Architecture Decision Records

## Trạng thái

Các quyết định dưới đây được `Accepted` cho Phase 01. Thay đổi phải tạo ADR mới thay thế, không sửa lịch sử quyết định như chưa từng tồn tại.

## ADR-001 - Modular Monolith

- Context: MVP có nhiều domain nhưng team và nhu cầu vận hành chưa chứng minh cần distributed system.
- Decision: Một React Web và một Express API; API tách module theo domain trong cùng process.
- Consequence: Dễ phát triển, test và deploy; module boundary vẫn phải được bảo vệ để tránh code nguyên khối.

## ADR-002 - npm Workspaces

- Context: Web và API cùng repository, cần lock file và command thống nhất.
- Decision: Dùng npm workspaces ở root với `apps/*`.
- Consequence: Một `package-lock.json`, root quality scripts và deterministic install bằng `npm ci`.

## ADR-003 - TypeScript Strict

- Context: API contract và dữ liệu đi qua nhiều role/feature, JavaScript thuần dễ phát sinh lỗi shape khi refactor.
- Decision: Dùng TypeScript strict cho Web và API.
- Consequence: Có thêm typecheck/build step; dữ liệu ngoài hệ thống vẫn phải validate runtime bằng Zod.

## ADR-004 - ReactJS with Vite

- Context: Cần SPA cho Student, Teacher và Admin với development/build nhanh.
- Decision: ReactJS, React Router và Vite.
- Consequence: `VITE_*` được nhúng lúc build và phải được coi là public; Nginx/static host cần SPA fallback.

## ADR-005 - ExpressJS and Mongoose

- Context: BA baseline yêu cầu Node.js/ExpressJS và MongoDB; cần data access abstraction nhất quán.
- Decision: ExpressJS cho RESTful API và Mongoose cho MongoDB lifecycle/schema/repository.
- Consequence: Controller không truy cập Mongoose trực tiếp; schema/index nghiệp vụ được thêm theo query pattern ở phase tương ứng.

## ADR-006 - OpenAPI 3.x and Swagger UI

- Context: Dev, QA và DevOps cần contract có thể đọc và kiểm thử.
- Decision: OpenAPI `3.0.3`, JSON endpoint và Swagger UI được version cùng API source.
- Consequence: API change phải cập nhật spec và pass contract validation trong cùng Pull Request.

## ADR-007 - Docker Compose for Local Integration

- Context: Web, API và MongoDB cần môi trường local lặp lại được.
- Decision: Dockerfile độc lập cho Web/API; Docker Compose chạy local/integration với MongoDB named volume.
- Consequence: Compose không phải Production architecture; Phase 07 dùng managed Cloud services và immutable artifacts.

## ADR-008 - GitHub Actions CI Direction

- Context: Cần Pull Request quality gate và project hướng tới GitHub workflow.
- Decision: Cung cấp GitHub Actions workflow cho locked install, lint, format, typecheck, test, build, production dependency audit và secret scan bằng Gitleaks.
- Consequence: Branch protection phải được bật trên remote GitHub; nếu chọn provider khác, giữ nguyên quality gates và chuyển syntax workflow.
