# Architecture Quality Attributes

## Mục Đích

Tài liệu này chuyển Non-Functional Requirements thành các quality attribute scenario và biện pháp kiến trúc. Đây là cầu nối giữa mục 13 (cái gì cần đạt) và mục 14/15 (thiết kế/vận hành để đạt nó).

## Quality Attribute Scenario Catalog

| QA ID | Attribute | Tình huống | Response kiến trúc mong đợi | Bằng chứng |
| --- | --- | --- | --- | --- |
| QA-SEC-01 | Security | Student cố gọi API lấy roster/grade của Classroom không enroll | Middleware + service kiểm tra token, role, membership/ownership và trả `403` không lộ dữ liệu | API authorization test/log review |
| QA-SEC-02 | Security | Invitation URL bị dùng lại, hết hạn, bị revoke hoặc email không khớp | Token hash lookup, status/expiry/one-time/email validation; reject và audit phù hợp | Invitation test suite |
| QA-SEC-03 | Security | Client upload file sai type/size hoặc gắn vào Course không sở hữu | API validate identity, purpose, ownership, type/size; storage private; reject controlled error | Upload security tests |
| QA-PERF-01 | Performance | Student mở Dashboard có nhiều To-do | API query index/read model/pagination, response theo NFR baseline | p95 test với dataset MVP |
| QA-PERF-02 | Performance | Teacher mở Course Dashboard/ranking | `CourseProgressSummary` sorted/indexed, tránh aggregate nặng mỗi request nếu cần | Query plan/API performance result |
| QA-SCL-01 | Scalability | Số request tăng khi nhiều lớp truy cập | API stateless, config ngoài code, có thể chạy nhiều replicas | Deploy >= 2 replica/scale test khi environment hỗ trợ |
| QA-AVL-01 | Availability | Một API instance restart/fail | Platform health probe thay instance/traffic chỉ route instance ready | Health/probe/release evidence |
| QA-AVL-02 | Availability | Release mới lỗi smoke test | Pipeline dừng promotion và có rollback/forward-fix runbook | CI/CD/rollback rehearsal |
| QA-REL-01 | Reliability | Deadline reset sau khi Student đã có To-do | Persist history + audit, recalculate To-do/status; failure được log/retry/rebuild | Regression/UAT scenario |
| QA-REL-02 | Reliability | Summary progress stale/corrupt | Source learning record vẫn giữ; worker/job có thể rebuild summary | Rebuild test/result |
| QA-MNT-01 | Maintainability | Thêm endpoint/activity type mới | Module boundary, API contract, schema validation, Swagger, test và traceability được cập nhật | PR/review checklist |
| QA-OPS-01 | Observability | User báo lỗi khi nộp bài | requestId liên kết response/log/error/audit, operator tìm được flow mà không lộ secret | Incident drill/log sample |
| QA-USE-01 | Usability | Student chưa làm bài có deadline | To-do cho biết action, due status, route tới activity; loading/empty/error rõ | UAT/UI test |
| QA-ACC-01 | Accessibility | User dùng keyboard/screen reader ở form/quiz | Label, focus order, error text, status text không chỉ màu | Accessibility checklist |

## Architecture Tactics Theo Attribute

| Attribute | Tactics áp dụng | Trade-off cần biết |
| --- | --- | --- |
| Security | TLS, password hash, token policy, RBAC + ownership, validation, private storage, secret isolation, audit | Thêm middleware/query check; cần test role matrix kỹ. |
| Performance | Index, field projection, pagination, bounded limit, read model, static CDN | Read model có thể stale tạm thời; cần rebuild mechanism. |
| Scalability | Stateless API, managed services, artifact/config separation | Cần tránh local file/session/in-memory job là source of truth. |
| Reliability | Unique constraints, idempotency/duplicate guard, audit, retry bounded, rebuild summary, backup | Có thêm complexity xử lý failure/retry. |
| Availability | Health/readiness, multiple replica direction, smoke test, rollback plan, monitored dependency | Tốn chi phí cloud/ops khi tăng replica/managed plan. |
| Maintainability | Modular monolith, API-first, DTO/error standard, OpenAPI, lockfile, test/CI | Cần kỷ luật review và documentation update. |
| Observability | requestId, structured logs, metrics, error tracking, deployment version | Log quá nhiều/PII có risk; phải mask và retention. |
| Usability/accessibility | Shared components, consistent page states, navigational control, semantic UI | Cần test trên viewport/keyboard, không chỉ happy path. |

## Capacity Baseline Và Giả Định

MVP chưa có dự báo người dùng/traffic chính thức, do đó không được tuyên bố sizing Production cố định. Baseline đo kiểm dùng các target tại mục 13:

- Simple read API p95 <= 800ms ở dataset MVP/Staging baseline.
- Dashboard aggregate API p95 <= 1500ms ở dataset MVP/Staging baseline.
- Frontend initial app load hướng tới <= 3 giây trên network tốt ở Staging.
- Tất cả list lớn có pagination/default limit và query index phù hợp.

Trước Production, Product Owner và Technical Lead phải chốt: số User tổng/concurrent, Classroom/Course/Student trung bình, file/video volume/size, retention, region, availability target và ngân sách. Các con số này là input cho compute, database plan, storage, CDN và alert threshold.

## Quyết Định Mở Rộng Có Điều Kiện

| Dấu hiệu đo được | Cân nhắc | Không được dùng làm lý do duy nhất |
| --- | --- | --- |
| Dashboard p95 vượt target sau index/read model review | Cache hoặc asynchronous summary worker | “Ứng dụng lớn thì phải có Redis” |
| Upload/video làm API chậm hoặc timeout | Direct signed upload, CDN, transcoding/queue | Thêm message broker chỉ để có kiến trúc phức tạp |
| API instance bão hòa/availability cần cao hơn | Horizontal scale, load balancer, managed runtime | Tách microservice mà không có ownership/operational benefit |
| MongoDB query/full-text search hạn chế | Search strategy/service riêng | Duplicating all data không có lifecycle/consistency plan |
| Nhiều external notification/job retry | Queue/worker + idempotency/dead-letter strategy | Background job chạy bằng untracked in-memory timer |

## Trace Với NFR

| NFR nhóm | Tài liệu kiến trúc áp dụng |
| --- | --- |
| Security, Privacy | `security-architecture.md`, `data-architecture.md` |
| Performance, Scalability | `system-architecture.md`, `data-architecture.md`, runtime design |
| Availability, Reliability | `deployment-runtime-architecture.md`, backup/rollback mục 15 |
| Maintainability | `architecture-components.md`, `technology-stack.md`, ADR/checklist |
| Logging, Monitoring | `deployment-runtime-architecture.md`, `security-architecture.md` |
| Usability, Accessibility | `architecture-components.md`, `../12-ui-ux-requirements/` |
