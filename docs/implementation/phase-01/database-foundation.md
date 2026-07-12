# Phase 01 Database Foundation

## 1. Mục tiêu

Thiết lập MongoDB dependency lifecycle an toàn, chưa tạo schema nghiệp vụ trước khi Phase 02 chốt User/Auth data contract.

## 2. Hiện thực

| Hạng mục | Behavior |
| --- | --- |
| Driver/ODM | Mongoose |
| Startup | API connect MongoDB trước khi listen |
| Timeout | Server selection/connect timeout có giới hạn |
| Shutdown | Mongoose disconnect trong graceful shutdown |
| Readiness | Map ready state thành `UP`, `CONNECTING`, `DOWN` |
| Secret | `MONGODB_URI` chỉ lấy từ environment, không log full value |

## 3. Local Runtime

- Development process dùng MongoDB local tại URI trong `.env`.
- Docker Compose dùng service name `mongodb`, không dùng `localhost` trong API container.
- MongoDB Compose chỉ nằm trong internal network, không publish port host sau khi phát hiện xung đột `27017`.
- Named volume giữ dữ liệu local giữa các lần `compose down` thông thường.

## 4. Không Thuộc Phase 01

- User/Classroom/Course collections.
- Production authentication/replica set/backup.
- Migration/seed nghiệp vụ.
- Managed MongoDB/Atlas selection.

## 5. Quy tắc Cho Phase Sau

- Collection/index xuất phát từ query/access pattern thực tế.
- Unique business invariant phải có database constraint phù hợp.
- Controller không gọi Mongoose trực tiếp.
- Test không dùng Production data hoặc Production URI.
- Schema change có compatibility/migration/rollback note.

## 6. Evidence

`GET /ready` và `GET /api/v1/system/health` đã trả `mongodb=UP` trong local và Compose verification. Configuration tests xác nhận URI sai làm startup fail fast mà không in connection string.
