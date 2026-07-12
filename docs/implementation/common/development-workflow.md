# Development Workflow

## 1. Mục tiêu

Quy trình này kiểm soát đường đi từ requirement tới code đã review và tích hợp, đồng thời tạo thói quen DevOps ngay từ đầu dự án.

## 2. Branch strategy

- `main`: nhánh ổn định, được bảo vệ và luôn phải build được.
- Feature branch: tạo từ `main`, tên theo mẫu `feature/<task-id>-<short-name>`.
- Bug branch: `fix/<task-id>-<short-name>`.
- Documentation branch: `docs/<task-id>-<short-name>` khi thay đổi độc lập.
- Không commit trực tiếp vào `main` sau khi branch protection được thiết lập.

Ví dụ: `feature/p01-api-bootstrap`, `fix/p02-login-rate-limit`.

## 3. Luồng thực hiện một task

1. Xác nhận task ở trạng thái `Ready`, có acceptance criteria và dependency đã hoàn thành.
2. Tạo branch từ `main` mới nhất.
3. Thực hiện thay đổi nhỏ, có commit dễ review.
4. Chạy lint, type check, test và build liên quan ở local.
5. Cập nhật Swagger, test, migration note hoặc tài liệu nếu contract thay đổi.
6. Tạo Pull Request và liên kết `Task ID`/requirement.
7. CI chạy quality gates; reviewer kiểm tra behavior, security, data và maintainability.
8. Sửa comment, chạy lại kiểm thử và nhận approval.
9. Merge theo chiến lược repository đã chọn; xóa feature branch sau merge.
10. Xác minh `main` pipeline và cập nhật task/bằng chứng.

## 4. Commit convention

Khuyến nghị dùng Conventional Commits:

```text
feat(api): add health endpoint
fix(web): preserve redirect after login
test(api): cover invalid environment configuration
docs(implementation): detail phase 01 exit criteria
chore(ci): add pull request quality checks
```

Mỗi commit chỉ nên có một mục đích chính. Không đưa secret, credential hoặc dữ liệu cá nhân vào message và diff.

## 5. Pull Request checklist

- Có mô tả vấn đề, giải pháp và phạm vi không làm.
- Có liên kết Task ID và BA requirement liên quan.
- Có hướng dẫn kiểm chứng hoặc test evidence.
- Có test cho behavior mới hoặc giải thích hợp lý nếu không thể tự động hóa.
- API change đã cập nhật Swagger/OpenAPI.
- Data change có index/migration/compatibility note.
- UI change có kiểm tra responsive, accessibility và trạng thái loading/empty/error.
- Không có secret, debug log hoặc file generated không cần thiết.
- CI bắt buộc đã pass.

## 6. Review policy

- Ít nhất một reviewer phù hợp phải approve trước merge; thay đổi auth, authorization, data migration, CI/CD hoặc Production config cần Technical Lead/DevOps review tương ứng.
- Tác giả không tự approve thay đổi của mình.
- Comment `blocking` phải được xử lý hoặc có quyết định chấp nhận rõ ràng.
- Reviewer kiểm tra cả trường hợp lỗi, quyền truy cập và ảnh hưởng dữ liệu, không chỉ happy path.

## 7. CI workflow tối thiểu

Pull Request pipeline chạy: dependency install từ lock file, lint, type check, unit/integration test phù hợp, Web/API build và secret/dependency scan theo mức sẵn có. Merge vào `main` tạo artifact có version; deploy Staging/Production được bổ sung và kiểm soát ở Phase 07.

## 8. Xử lý hotfix

Hotfix Production vẫn phải có branch, review, test hồi quy và deployment record. Chỉ rút gọn bước không thiết yếu trong tình huống khẩn cấp; không bỏ qua authorization/data safety review. Sau incident phải bổ sung root cause, corrective action và test ngăn tái diễn.
