# Phase 01 Frontend Foundation

## 1. Mục tiêu

Tạo ReactJS application có cấu trúc đủ ổn định để Phase 02 bổ sung authentication và role workspace mà không thay đổi App Shell hoặc cách gọi API.

## 2. Technology Baseline

| Thành phần | Lựa chọn | Vai trò |
| --- | --- | --- |
| UI runtime | ReactJS + TypeScript strict | Component application |
| Build/dev | Vite | Development server và production bundle |
| Routing | React Router | Route composition, 404 và future protected routes |
| Testing | Vitest + Testing Library + JSDOM | Component behavior |
| Container delivery | Nginx Alpine | Static delivery và SPA fallback |

## 3. Source Boundary

| Path | Trách nhiệm |
| --- | --- |
| `src/app` | App composition, router, global error boundary |
| `src/features/system` | System Status feature của Phase 01 |
| `src/shared/api` | Typed HTTP functions và error mapping nền tảng |
| `src/shared/config` | Validate public `VITE_*` configuration |
| `src/shared/components` | Reusable non-domain UI |
| `src/test` | Test setup dùng chung |

## 4. Behavior Đã Hiện Thực

- `/` và `/system-status` hiển thị API health/version.
- Unknown route hiển thị trang 404 và nút quay lại.
- Global Error Boundary có trạng thái khôi phục bằng reload.
- System Status có loading, error, retry và success states.
- API URL lấy từ `VITE_API_BASE_URL`, không hard-code Production endpoint.
- Layout responsive cho desktop/mobile và không phụ thuộc component library.

## 5. Public Configuration

Vite đọc `.env` ở repository root thông qua `envDir`. Chỉ `VITE_API_BASE_URL` được đưa vào browser bundle. Không thêm password, JWT secret, MongoDB URI hoặc storage credential vào biến `VITE_*`.

## 6. Verification

| Check | Evidence |
| --- | --- |
| TypeScript strict | `npm run typecheck --workspace @microlearning/web` |
| Component tests | 2 tests pass |
| Production build | Vite build pass |
| Local runtime | HTTP 200 tại `http://localhost:5173` |
| Container runtime | HTTP 200 tại `http://localhost:3000` trong Compose run |
| SPA fallback | Direct `/system-status` trả HTTP 200 trong Nginx container |

## 7. Phase 02 Extension

- Thêm `features/auth`, authenticated App Shell và protected route composition.
- Route guard chỉ tối ưu UX; API vẫn bắt buộc authorize.
- Giữ loading/error/empty/success state cho mọi page gọi API.
- Không đưa token/session logic trực tiếp vào page component.
