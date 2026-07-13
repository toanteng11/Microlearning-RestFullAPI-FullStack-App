# Phase 01 Exit Evidence

## 1. Mục Đích

Tài liệu này lưu bằng chứng hợp nhất để đóng `P01 - Project Foundation`. Evidence chỉ xác nhận phạm vi Phase 01; Authentication, RBAC và nghiệp vụ LMS thuộc các phase sau.

## 2. Verification Context

| Thuộc tính | Giá trị |
| --- | --- |
| Verification date | `2026-07-13` |
| Repository | `toanteng11/Microlearning-RestFullAPI-FullStack-App` |
| Verified main commit | `d425e0b1ef8ffa8415365b46b39bb7530af94f9e` |
| Merge evidence | [Pull Request #1](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/pull/1) |
| CI evidence | [Actions run 29201412037](https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App/actions/runs/29201412037) |
| Verification environments | Windows local, fresh clone, Docker Compose, GitHub Actions, browser desktop/mobile |

## 3. Remote CI Và Governance

Pull Request #1 đã chạy thành công ba job:

- `Lint, test and build`.
- `Production dependency audit`.
- `Secret scan`.

Repository Owner đã xác nhận branch protection/ruleset cho `main` ngày `2026-07-13` với các kiểm soát:

- Không push trực tiếp vào `main`; thay đổi đi qua Pull Request.
- Yêu cầu ít nhất một approval từ reviewer có quyền phù hợp.
- Yêu cầu branch cập nhật với `main` trước merge.
- Yêu cầu ba status checks nêu trên pass.
- Không cho force push hoặc xóa protected branch.
- Pull Request #1 từng bị chặn khi thiếu approval và chỉ được merge sau khi điều kiện bảo vệ đạt.

Commit merge `d425e0b` trên `origin/main` xác nhận quy trình Pull Request đã hoàn tất.

## 4. Clean-Clone Onboarding

Một fresh clone được tạo ngoài working tree hiện tại từ `origin/main` tại commit `d425e0b`.

| Bước | Kết quả |
| --- | --- |
| `git clone --depth 1 ...` | Pass |
| `npm ci` | Pass, 427 packages, 0 vulnerabilities |
| `npm run check` | Pass |
| API tests | 7/7 pass |
| Web tests tại verified main | 2/2 pass |
| API/Web production build | Pass |
| `docker compose config --quiet` | Pass |

Kết luận: repository có thể cài đặt và chạy quality gate từ clean clone bằng hướng dẫn đã commit, không phụ thuộc file generated hoặc dependency ngoài lock file.

## 5. Hardened Quality Gate

Phase closure bổ sung các kiểm soát để ngăn quality evidence bị thiếu nhưng CI vẫn xanh:

- `npm run check:ci` chạy lint, negative lint assertion, format, typecheck, coverage test và production build.
- `verify-negative-lint-gate.mjs` đưa một unused variable có chủ đích vào ESLint API và chỉ pass khi rule trả error.
- Coverage artifact là bắt buộc; CI fail nếu không tìm thấy `apps/*/coverage`.
- GitHub Actions dependencies được pin bằng immutable commit SHA.
- API coverage threshold: 75% statements, 45% branches, 70% functions, 75% lines.
- Web coverage threshold: 80% statements, 70% branches, 80% functions, 80% lines.
- Dependency audit chặn cả `High` và `Critical` production vulnerabilities.

Kết quả local của hardened gate:

| Area | Statements | Branches | Functions | Lines | Kết quả |
| --- | ---: | ---: | ---: | ---: | --- |
| API | 76.92% | 48.71% | 76% | 78.66% | Pass threshold |
| Web | 81.39% | 75% | 81.25% | 85% | Pass threshold |

API có 7 tests và Web có 6 tests; tổng cộng 13 tests pass.

## 6. Docker Và HTTP Runtime

Docker Engine `29.3.1` đã build và chạy integrated environment.

| Check | Kết quả |
| --- | --- |
| MongoDB container | Healthy, internal network only |
| API container | Healthy, `127.0.0.1:4000`, user `uid=1000(node)` |
| Web container | Healthy, `127.0.0.1:3000` |
| `GET /health` | HTTP 200 |
| `GET /ready` | HTTP 200, MongoDB `UP` |
| `GET /api/v1/system/version` | HTTP 200 |
| `GET /api-docs/` | HTTP 200 |
| `GET /api/v1/openapi.json` | HTTP 200, OpenAPI 3.0.3 |
| Web `/` và `/system-status` | HTTP 200 |

## 7. Browser Verification

System Status và Swagger được kiểm tra bằng browser runtime thực:

- System Status desktop hiển thị API `UP`, service, version, environment, commit và last check.
- System Status tại viewport `390x844` không có horizontal overflow hoặc lỗi console.
- Swagger desktop load đúng title, OpenAPI 3.0 và 4 operational endpoints.
- Swagger tại viewport `390x844` giữ body trong viewport, các operation vẫn đọc và thao tác được.
- Không ghi nhận browser console error/warning trong các trang được kiểm tra.

## 8. Phase Exit Decision

| Điều kiện | Kết quả |
| --- | --- |
| Must deliverables | Pass |
| Acceptance criteria | 20/20 Pass |
| Local and clean-clone quality | Pass |
| Docker/runtime/browser | Pass |
| Remote CI/security checks | Pass |
| Branch governance | Pass |
| Open Critical/High issue | Không có |
| Phase status | `Completed` |

Phase 01 đạt Definition of Done. Mọi thay đổi sau thời điểm này phải đi qua Pull Request và có thể mở lại phase evidence nếu làm mất một gate hoặc vi phạm foundation contract.
