# Performance And Scalability Requirements

## Mục Đích

Tài liệu này xác định yêu cầu hiệu năng và khả năng mở rộng cho **Microlearning Classroom LMS Platform**. Hệ thống cần đủ nhanh để Student học bài, Teacher quản lý tiến độ và Admin vận hành mà không bị chậm ở các luồng chính.

Các target dưới đây là **MVP/Staging baseline** cho đồ án và demo cloud. Khi có production traffic thật, cần đo lại bằng monitoring/load test và điều chỉnh SLA.

## Performance Scope

| Khu vực | Mục tiêu |
| --- | --- |
| Frontend | Load nhanh, route chuyển mượt, không block UI lâu. |
| Backend API | Response time ổn định cho auth, dashboard, list, mutation. |
| MongoDB | Query có index, không scan dữ liệu lớn không cần thiết. |
| File/media | Upload/download có giới hạn size và không làm sập backend. |
| Dashboard aggregate | Student/Teacher/Admin dashboard phản hồi trong thời gian chấp nhận được. |
| CI/CD deployment | Build/deploy không quá chậm, smoke test có thể chạy nhanh. |

## Performance Targets

| ID | Target | MVP/Staging Baseline | Production-Ready Direction |
| --- | --- | --- | --- |
| NFR-PERF-001 | Simple API read p95 | <= 800ms | <= 500ms |
| NFR-PERF-002 | Dashboard aggregate API p95 | <= 1500ms | <= 1000ms |
| NFR-PERF-003 | Mutation API p95 | <= 1200ms, không tính upload file lớn | <= 800ms |
| NFR-PERF-004 | List API with pagination p95 | <= 1000ms với page size <= 50 | <= 700ms |
| NFR-PERF-005 | Frontend initial load | <= 3s trên desktop/network tốt | <= 2s |
| NFR-PERF-006 | Student Dashboard usable | <= 2.5s sau login ở staging | <= 1.5s |
| NFR-PERF-007 | Teacher Course Dashboard usable | <= 3s với dataset MVP | <= 2s |
| NFR-PERF-008 | Search/filter list response | <= 1200ms với index phù hợp | <= 800ms |
| NFR-PERF-009 | Health endpoint response | <= 300ms nếu dependency ổn | <= 200ms |
| NFR-PERF-010 | Build frontend/backend in CI | <= 10 phút cho MVP project | <= 5 phút nếu tối ưu |

## Dataset Baseline Cho Test

Performance test nên dùng dataset tối thiểu:

| Data | Baseline |
| --- | --- |
| Students | 500 - 1,000 |
| Teachers | 20 - 50 |
| Admins | 3 - 10 |
| Classrooms | 50 - 100 |
| Courses | 100 - 300 |
| Lessons | 1,000 - 3,000 |
| Quiz questions | 5,000 - 10,000 |
| Assignments/Submissions | 5,000 - 20,000 |
| Audit logs | 10,000 - 50,000 |

Đối với đồ án, có thể tạo dataset nhỏ hơn nhưng vẫn cần test ít nhất các list có pagination và dashboard aggregate.

## Concurrent User Target

| Scenario | MVP/Staging Target | Ghi chú |
| --- | --- | --- |
| Student browsing dashboard/to-do | 100 concurrent users | Đủ cho demo/lớp học nội bộ nhỏ. |
| Student doing quiz | 50 concurrent users | Submit quiz không được double submit. |
| Teacher managing course/progress | 10 concurrent teachers | Dashboard/progress phải có pagination/aggregate hợp lý. |
| Admin user list/report | 3 concurrent admins | Admin action không cần high traffic nhưng cần ổn định. |
| Public invite/join flow | 50 concurrent users | Join link/code không tạo duplicate enrollment. |

Production direction có thể nâng lên theo nhu cầu tổ chức, nhưng cần load test thật trước khi cam kết.

## API Performance Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-PERF-API-001 | API list phải có pagination mặc định. | Must | List users/classrooms/audit/submissions không trả toàn bộ dữ liệu. |
| NFR-PERF-API-002 | API list phải có `limit` tối đa. | Must | Request limit quá lớn bị clamp/reject. |
| NFR-PERF-API-003 | Dashboard aggregate phải tính toán ở backend hoặc read model phù hợp, không để frontend ghép quá nhiều API nếu không cần. | Should | Student/Teacher Dashboard không gọi quá nhiều request phụ thuộc chuỗi. |
| NFR-PERF-API-004 | API phải tránh N+1 query khi lấy dashboard/course progress. | Should | Query review hoặc performance test. |
| NFR-PERF-API-005 | Endpoint Student To-do phải sort/filter ở backend. | Must | Frontend không tải toàn bộ activity rồi tự lọc trên dataset lớn. |
| NFR-PERF-API-006 | Admin User Management phải dùng role-specific endpoints. | Must | Không dùng một API tải tất cả Student/Teacher/Admin mặc định. |
| NFR-PERF-API-007 | API phải có timeout/error handling khi dependency chậm. | Should | Service không treo vô hạn. |

## Frontend Performance Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-PERF-FE-001 | React app nên code-split theo workspace Student/Teacher/Admin nếu bundle lớn. | Should | Admin code không cần tải cho Student nếu tối ưu. |
| NFR-PERF-FE-002 | Dashboard phải dùng skeleton/loading ổn định, tránh layout shift mạnh. | Must | UI không nhảy layout khó chịu khi data load. |
| NFR-PERF-FE-003 | Long table/list phải có pagination hoặc virtual scroll nếu dữ liệu lớn. | Must | Admin lists không render hàng ngàn row một lần. |
| NFR-PERF-FE-004 | Media image/video trong lesson/quiz phải lazy-load khi phù hợp. | Should | Trang quiz/lesson không tải media không cần thiết quá sớm. |
| NFR-PERF-FE-005 | Form submit phải chống double submit. | Must | Button loading/disabled khi đang submit. |
| NFR-PERF-FE-006 | API cache/refetch strategy phải tránh gọi lại dư thừa. | Should | Mutation invalidate đúng data liên quan. |

## MongoDB Performance Requirements

| Query Pattern | Index gợi ý |
| --- | --- |
| Login by email | `users.email` unique/index |
| Student To-do | `studentTodoItems.studentId`, `status`, `dueDate`, `classroomId` |
| Classroom enrollment | `enrollments.classroomId`, `enrollments.studentId`, unique pair nếu cần |
| Teacher course dashboard | `courses.teacherId`, `lessons.courseId`, `quizzes.courseId`, `assignments.courseId` |
| Progress ranking | `learningProgress.courseId`, `studentId`, `processScore` hoặc read model |
| Submission list | `submissions.assignmentId`, `status`, `submittedAt` |
| Admin user lists | `users.role`, `status`, `createdAt`, `email` |
| Audit log | `auditLogs.actorId`, `action`, `resourceType`, `createdAt` |
| Invitation | `teacherInvitations.email`, `status`, `expiresAt`, `tokenHash` |

## Scalability Requirements

| ID | Requirement | Priority | Acceptance Criteria |
| --- | --- | --- | --- |
| NFR-SCL-001 | Backend nên stateless để có thể chạy nhiều instance. | Should | Session chính không phụ thuộc local memory. |
| NFR-SCL-002 | Refresh token/session nếu cần lưu phải nằm ở DB/cache dùng chung. | Should | Scale nhiều instance vẫn login/refresh ổn. |
| NFR-SCL-003 | File upload nên tách storage khỏi container runtime khi lên cloud. | Should | Container restart không mất file quan trọng. |
| NFR-SCL-004 | MongoDB connection pooling phải cấu hình theo environment. | Must | Không tạo connection mới cho mỗi request. |
| NFR-SCL-005 | Background job có thể dùng sau MVP cho notification, report export, email nếu có. | Could | Không chặn MVP nếu chưa có queue. |
| NFR-SCL-006 | Docker image phải chạy được với env variables để scale theo environment. | Must | Không hard-code localhost/secret trong image. |

## Performance Test Scenarios

| Test ID | Scenario | Expected |
| --- | --- | --- |
| PERF-001 | 100 Student mở Dashboard trong 5 phút | Error rate < 1%, p95 dashboard <= baseline. |
| PERF-002 | 50 Student submit Quiz gần đồng thời | Không duplicate attempt ngoài policy; p95 mutation <= baseline. |
| PERF-003 | Teacher mở Course Dashboard có 100 Student và 50 activity | Render data trong target, không timeout. |
| PERF-004 | Admin mở Student List 1,000 records với pagination | API trả đúng page, không tải toàn bộ. |
| PERF-005 | Audit Log có 50,000 records, filter theo date/action | API dùng filter/pagination, không timeout. |
| PERF-006 | Upload file vượt size/type | Bị chặn nhanh, không làm backend crash. |

## Acceptance Criteria

- Không còn placeholder cho performance target chính.
- Các list lớn có pagination và max limit.
- Student Dashboard, Student To-do và Teacher Course Dashboard có endpoint/strategy rõ.
- MongoDB có index strategy cho query chính.
- Backend có thể chạy bằng Docker với env config, không phụ thuộc hard-code local state.
- Performance baseline được QA/DevOps dùng làm tiêu chí test cho staging/demo.
