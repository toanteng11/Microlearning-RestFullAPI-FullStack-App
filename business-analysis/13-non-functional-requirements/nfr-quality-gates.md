# NFR Quality Gates

## Mục Đích

Tài liệu này xác định các quality gate cần kiểm tra trước khi xem một build là đủ điều kiện demo/release. Quality gate là điểm chặn chất lượng cho Dev, QA và DevOps.

## Gate Levels

| Gate | Khi nào dùng |
| --- | --- |
| Local Dev Gate | Trước khi merge hoặc bàn giao chức năng. |
| API Contract Gate | Khi backend thay đổi endpoint/schema. |
| Security Gate | Trước demo/release có dữ liệu thật. |
| UI/UX Gate | Trước khi user review flow chính. |
| DevOps Deployment Gate | Sau khi deploy staging/cloud. |
| Release Gate | Trước khi chốt bản demo/release. |

## Local Dev Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Build backend | Should | Backend build/start không lỗi. |
| Build frontend | Should | Frontend build không lỗi. |
| Lint/type check nếu có | Should | Không có lỗi nghiêm trọng. |
| Unit tests nếu có | Should | Test pass. |
| No secrets in code | Must | Không commit `.env` thật, token, password. |
| Docker local setup | Should | Docker/Docker Compose chạy được service chính. |

## API Contract Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Endpoint có trong Swagger | Must | Endpoint mới/sửa được document. |
| Request/response schema rõ | Must | Frontend/QA hiểu cách gọi. |
| Error response chuẩn | Must | Tuân theo `../11-api-requirements/error-response-standard.md`. |
| Auth/authorization rõ | Must | Swagger hoặc API docs ghi role/permission. |
| Pagination cho list lớn | Must | Có page/limit/filter phù hợp. |
| Breaking change reviewed | Must nếu có | Frontend/QA được thông báo. |

## Security Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Password hash | Must | Không có plain text password. |
| Token raw không lưu/log | Must | Token nhạy cảm được hash hoặc không lưu. |
| RBAC API test | Must | Student/Teacher/Admin bị chặn đúng quyền. |
| Teacher invitation security | Must | Expired/revoked/accepted token không dùng lại. |
| Object-level access | Must | ID guessing bị chặn. |
| No stack trace in production response | Must | Error response an toàn. |
| Rate limit auth/invitation | Should | 429 khi vượt ngưỡng nếu đã bật. |
| File upload validation | Must nếu upload có trong release | Sai type/size bị chặn. |

## UI/UX Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Student Dashboard To-do | Must | Hiển thị To-do hoặc empty state đúng. |
| Join by Code/Link | Must | Flow thành công và lỗi rõ. |
| Teacher Course Dashboard | Must | Lesson/Activity, deadline, progress ranking hiển thị. |
| Reset Lesson Deadline | Must nếu feature included | Có reason, success/error state, cập nhật UI. |
| Admin role-specific lists | Must | Student/Teacher/Admin list tách riêng. |
| Loading/empty/error states | Must | P0 screens có state cơ bản. |
| Back/breadcrumb navigation | Must | Không có dead-end screen trong flow chính. |
| Mobile Student flow | Should | Dashboard/To-do/Lesson/Quiz usable. |

## Performance Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Simple API p95 | Should | <= 800ms ở staging baseline. |
| Dashboard API p95 | Should | <= 1500ms với dataset MVP. |
| List pagination | Must | Không tải toàn bộ list lớn. |
| Admin user list | Must | Dùng endpoint role-specific. |
| MongoDB indexes | Must | Query chính có index strategy. |
| Frontend initial load | Should | <= 3s trên network tốt. |

## DevOps Deployment Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Environment variables configured | Must | API URL, DB URL, JWT secret, CORS origin đúng. |
| Health endpoint | Must | `/health` trả UP/DEGRADED/DOWN đúng. |
| Version endpoint/build info | Should | Version/commit/environment xác định được. |
| SPA fallback | Must cho frontend | Refresh `/student/dashboard` không 404. |
| CORS | Must | Frontend gọi backend không bị CORS lỗi. |
| HTTPS | Must cho cloud/staging/prod | Không mixed content. |
| Smoke test roles | Must | Student/Teacher/Admin dashboard mở được. |
| Rollback plan | Must | Biết quay lại bản trước nếu deploy lỗi. |

## Release Gate

| Check | Required | Pass Criteria |
| --- | --- | --- |
| Must functional flows pass | Must | Auth, Student, Teacher, Admin core flows đạt. |
| Must NFR pass | Must | Security/privacy/health/pagination/audit core đạt. |
| Critical bugs | Must | Không còn bug critical/blocker. |
| Backup before release | Should | Có backup trước release/demo quan trọng. |
| Release notes | Should | Version, changes, known issues, rollback note. |
| Product Owner review | Must | PO chấp nhận scope/demo. |

## Evidence Checklist

QA/DevOps nên lưu bằng chứng:

- Screenshot hoặc log test.
- API response sample.
- Swagger link.
- Health/version response.
- CI/CD run link hoặc terminal output.
- Known issues.
- Release note.

## Acceptance Criteria

- Quality gates được dùng như checklist trước demo/release.
- Must gates không bị bỏ qua nếu liên quan security/privacy/data loss.
- Nếu gate không đạt, phải ghi known issue hoặc change request.
- Dev, QA và DevOps có cùng tiêu chí để đánh giá build.
