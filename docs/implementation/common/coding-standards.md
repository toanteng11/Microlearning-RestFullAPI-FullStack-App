# Coding Standards

## 1. Mục tiêu

Tiêu chuẩn này giúp source code của Web, API và infrastructure nhất quán, dễ review và giảm lỗi khi nhiều người cùng phát triển.

## 2. Ngôn ngữ và cách đặt tên

- Source code, folder, file, variable, function, class, interface, commit message và API field dùng tiếng Anh.
- `PascalCase`: React component, class, type và interface.
- `camelCase`: variable, function, object field và hook.
- `kebab-case`: route segment và tên file tài liệu.
- `UPPER_SNAKE_CASE`: environment variable và constant toàn cục phù hợp.
- Boolean bắt đầu bằng `is`, `has`, `can`, `should` hoặc động từ thể hiện rõ trạng thái.
- Không dùng tên mơ hồ như `data1`, `temp`, `obj`, `handleThing` khi có thể mô tả domain chính xác.

## 3. TypeScript

- Bật strict type checking.
- Không dùng `any` trừ trường hợp có lý do được ghi rõ và có phạm vi nhỏ.
- Dữ liệu từ HTTP, environment và database phải được validate ở runtime; type compile-time không thay thế validation.
- DTO API không trả trực tiếp Mongoose document và không chứa password hash, token hash hoặc field nội bộ nhạy cảm.
- Shared type chỉ đưa vào `packages/` khi thực sự được nhiều application sử dụng và không kéo domain logic frontend vào backend.

## 4. Frontend

- Tổ chức theo `app`, `features` và `shared`; business feature không đặt tùy tiện trong shared.
- Component nhỏ, có một trách nhiệm chính; page orchestration tách khỏi reusable UI khi hợp lý.
- Mọi màn hình tải dữ liệu phải có loading, empty, error và success state.
- Route cần auth hoặc role phải có route guard; frontend guard chỉ phục vụ UX, API vẫn phải authorize độc lập.
- Button có hành động bất đồng bộ phải ngăn gửi lặp, hiển thị trạng thái và xử lý lỗi rõ ràng.
- Các điều khiển Back, Previous và Next phải giữ ngữ cảnh hợp lý, không làm mất dữ liệu form chưa lưu mà không cảnh báo.

## 5. Backend

- Dependency direction: `Route -> Middleware -> Controller -> Service/Use Case -> Repository`.
- Controller không chứa MongoDB query hoặc nhiều nhánh business rule.
- Repository không tự quyết định authorization.
- Validation áp dụng cho params, query và body trước khi vào use case.
- Error response tuân một schema chung, có stable error code và `requestId` khi phù hợp.
- Mutation quan trọng phải idempotent hoặc có cơ chế chống duplicate phù hợp.
- Log dạng structured JSON; không log password, token, secret, full connection string hoặc dữ liệu cá nhân không cần thiết.

## 6. RESTful API và OpenAPI

- Endpoint versioned dưới `/api/v1` trừ health endpoint.
- Dùng đúng HTTP method và status code; không trả `200` cho mọi trường hợp.
- List endpoint có pagination, filter và sort được kiểm soát.
- Swagger/OpenAPI phải mô tả auth, request, response, error và example tối thiểu.
- API contract và implementation phải thay đổi trong cùng pull request.

## 7. Database

- Schema có timestamp, validation và index theo truy vấn thực tế.
- Không lưu file binary lớn trực tiếp trong MongoDB; chỉ lưu metadata/object key khi dùng object storage.
- Mọi query từ input phải dùng allowlist; không chuyển thẳng request object vào MongoDB query.
- Thay đổi schema phải có compatibility/migration note và rollback consideration.
- Unique constraint quan trọng phải được đảm bảo bằng database index, không chỉ kiểm tra ở application.

## 8. Test

- Unit test cho business rule và utility có nhánh logic.
- Integration test cho repository, middleware, authentication và API contract quan trọng.
- E2E tập trung vào critical user flow; không dùng E2E để thay toàn bộ unit/integration test.
- Test độc lập, có thể chạy lại, không phụ thuộc thứ tự và không dùng Production data.
- Bug fix phải có regression test khi có thể tái tạo tự động.

## 9. Format và quality gate

- Dùng formatter và linter thống nhất tại root repository.
- Không merge khi lint, type check, test hoặc build bắt buộc thất bại.
- Không commit generated build output, local log, editor cache hoặc `.env` thật.
- Dependency mới phải có mục đích rõ, license phù hợp và không trùng trách nhiệm với package đang dùng.
