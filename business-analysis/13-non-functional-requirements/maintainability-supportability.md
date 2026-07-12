# Maintainability And Supportability Requirements

## Mục Đích

Tài liệu này xác định yêu cầu giúp hệ thống dễ bảo trì, dễ mở rộng, dễ debug và dễ hỗ trợ sau khi triển khai. Với stack ReactJS, Node.js/ExpressJS, MongoDB, Docker, CI/CD và Cloud deployment, maintainability không chỉ là code đẹp mà còn là API contract, environment config, logs, documentation và quy trình hỗ trợ.

## Maintainability Principles

| Nguyên tắc | Ý nghĩa |
| --- | --- |
| Consistent structure | Code tổ chức theo module/domain rõ để dễ tìm và sửa. |
| API contract discipline | API behavior phải phản ánh trong Swagger/OpenAPI. |
| Config outside code | Environment config không hard-code trong source. |
| Small safe changes | Thay đổi nhỏ, có kiểm tra, không sửa lan man. |
| Traceability | Requirement có thể trace đến API/data/UI/test. |
| Operational clarity | Khi lỗi xảy ra, Dev/DevOps có log, requestId, health/version để xử lý. |

## Code Maintainability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-MNT-CODE-001 | Backend nên tổ chức theo module/domain như auth, users, classrooms, courses, lessons, quizzes, assignments, admin. | Should | Code review thấy cấu trúc rõ, không gom toàn bộ vào một file lớn. |
| NFR-MNT-CODE-002 | Frontend nên tổ chức theo workspace/feature như student, teacher, admin, auth, shared. | Should | Route/component dễ tìm theo role. |
| NFR-MNT-CODE-003 | Business logic quan trọng không nên nằm trực tiếp trong controller/UI component quá lớn. | Should | Có service/helper phù hợp. |
| NFR-MNT-CODE-004 | Constants/enums như role, status, activity type phải dùng thống nhất. | Must | Không hard-code string rải rác gây lệch status. |
| NFR-MNT-CODE-005 | Code phải tránh duplicate logic authorization quan trọng. | Must | Authorization dùng middleware/policy/service nhất quán. |
| NFR-MNT-CODE-006 | Comments chỉ dùng khi logic khó hiểu, không lạm dụng comment mô tả hiển nhiên. | Should | Code review. |

## API Maintainability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-MNT-API-001 | API path phải theo version `/api/v1`. | Must | Endpoint mới nằm đúng prefix. |
| NFR-MNT-API-002 | API response success/error phải nhất quán. | Must | Tuân theo mục 11 error/response standard. |
| NFR-MNT-API-003 | Swagger/OpenAPI phải cập nhật khi thêm/sửa endpoint. | Must | Endpoint không có Swagger không được xem là done. |
| NFR-MNT-API-004 | Breaking change API phải có review impact với Frontend/QA. | Must | Change log hoặc review note. |
| NFR-MNT-API-005 | Endpoint list phải dùng pagination/filtering convention thống nhất. | Must | Query params nhất quán giữa user list, audit log, submissions. |
| NFR-MNT-API-006 | API versioning strategy phải rõ khi thay đổi lớn. | Should | Không sửa silent behavior làm frontend hỏng. |

## Configuration Maintainability

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-MNT-CFG-001 | API base URL frontend phải lấy từ env variable. | Must | Không hard-code production URL trong source. |
| NFR-MNT-CFG-002 | Backend database URL, JWT secrets, token expiry, CORS origins phải lấy từ env/config. | Must | Không commit secrets thật. |
| NFR-MNT-CFG-003 | `.env.example` nên mô tả biến cần thiết nhưng không chứa secret thật. | Should | Dev mới biết cần cấu hình gì. |
| NFR-MNT-CFG-004 | Environment naming phải thống nhất: development, staging, production. | Should | Health/version hiển thị đúng environment. |
| NFR-MNT-CFG-005 | Docker image phải dùng env runtime/build-time phù hợp. | Must | Cùng image có thể chạy ở nhiều environment nếu cấu hình đúng. |

## Documentation Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-MNT-DOC-001 | BA docs phải cập nhật khi requirement thay đổi. | Must | Revision history cập nhật version. |
| NFR-MNT-DOC-002 | Swagger phải mô tả request/response/error chính. | Must | Frontend/QA dùng Swagger được. |
| NFR-MNT-DOC-003 | DevOps docs phải có Docker, CI/CD, cloud deploy và rollback. | Must | DevOps có thể triển khai theo docs. |
| NFR-MNT-DOC-004 | README project nên có setup local. | Should | Dev mới chạy được project. |
| NFR-MNT-DOC-005 | Chức năng đặc biệt như Teacher Invitation và Lesson Deadline Reset phải có docs rõ. | Must | Dev/QA không hiểu sai flow. |

## Supportability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SUP-001 | API response error phải có `requestId` hoặc correlation id nếu có thể. | Should | User/QA báo lỗi kèm requestId để Dev trace. |
| NFR-SUP-002 | Logs phải đủ context để debug nhưng không chứa secrets. | Must | Log sample review. |
| NFR-SUP-003 | Health endpoint và version endpoint phải hỗ trợ DevOps kiểm tra deployment. | Must | `/health` và `/api/v1/system/version` hoạt động. |
| NFR-SUP-004 | Admin critical actions phải trace được trong AuditLog. | Must | AuditLog có actor/action/resource/timestamp. |
| NFR-SUP-005 | Error UI phải hướng dẫn user bước tiếp theo. | Should | Không chỉ hiển thị `Something went wrong`. |
| NFR-SUP-006 | Release/deployment note nên ghi version, commit, thay đổi chính, rollback note. | Should | DevOps/QA có thể xác định đang chạy bản nào. |

## CI/CD Maintainability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-MNT-CI-001 | CI nên chạy lint/build/test tối thiểu. | Should | Pipeline fail nếu build fail. |
| NFR-MNT-CI-002 | CI/CD không được in secrets ra log. | Must | Pipeline logs không có secret values. |
| NFR-MNT-CI-003 | Build artifact phải trace được với commit SHA. | Should | Version endpoint hoặc deployment metadata có commit. |
| NFR-MNT-CI-004 | Deployment staging phải có smoke test. | Must | Login/health/dashboard smoke test đạt. |
| NFR-MNT-CI-005 | Failed deployment phải không ghi đè trạng thái production ổn định nếu có rollback. | Should | Rollback plan/pipeline. |

## Support Runbook Minimum

Runbook tối thiểu nên có các tình huống:

| Tình huống | Runbook cần hướng dẫn |
| --- | --- |
| API down | Kiểm tra `/health`, logs, MongoDB connectivity, deployment status. |
| Login lỗi hàng loạt | Kiểm tra auth logs, env secrets, token expiry, database user status. |
| Student không thấy To-do | Kiểm tra enrollment, published activity, deadline, StudentTodoItem/read model. |
| Teacher không reset được deadline | Kiểm tra permission, Lesson status, required reason, API error code. |
| Admin không xem được user list | Kiểm tra role/permission, endpoint đúng `/admin/users/students|teachers|admins`. |
| Upload lỗi | Kiểm tra file policy, size/type, storage health. |
| Deploy frontend bị 404 route | Kiểm tra SPA fallback route về `index.html`. |

## Acceptance Criteria

- API, data, UI và docs không mâu thuẫn ở các flow chính.
- Swagger cập nhật khi API thay đổi.
- Env/config không hard-code secrets.
- Có health/version/log để hỗ trợ debug sau deployment.
- CI/build/deploy có quality gate cơ bản.
- Dev mới có thể hiểu cấu trúc project và chạy local theo tài liệu.
