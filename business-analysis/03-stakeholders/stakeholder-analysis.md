# Stakeholder Analysis

## Mục Đích

Tài liệu này phân tích mức độ ảnh hưởng, mức độ quan tâm, nhu cầu, kỳ vọng, rủi ro và chiến lược tương tác với từng stakeholder trong dự án **Microlearning Classroom LMS Platform**.

Stakeholder Analysis giúp Business Analyst và Product Owner:

- Biết stakeholder nào cần quản lý sát.
- Biết stakeholder nào cần tham vấn định kỳ.
- Dự đoán xung đột về scope, UX, kỹ thuật và vận hành.
- Thiết kế kế hoạch giao tiếp phù hợp.
- Bảo đảm requirement phản ánh đúng nhu cầu Student, Teacher, Admin và đội kỹ thuật.

## Tiêu Chí Phân Tích

| Tiêu chí | Mô tả |
| --- | --- |
| Influence | Mức stakeholder có thể tác động đến scope, priority, design, release hoặc acceptance |
| Interest | Mức stakeholder quan tâm đến kết quả dự án |
| Impact | Mức stakeholder bị ảnh hưởng bởi sản phẩm sau khi triển khai |
| Engagement Need | Mức độ cần giao tiếp hoặc tham vấn |
| Decision Power | Quyền ra quyết định trong domain liên quan |
| Risk If Ignored | Rủi ro nếu stakeholder không được tham gia đúng lúc |

## Power / Interest Matrix

| Nhóm | Đặc điểm | Stakeholder | Chiến lược quản lý |
| --- | --- | --- | --- |
| Manage Closely | Influence cao, Interest cao | Product Owner, BA, Technical Lead, Teacher Representative, Admin Representative, QA Lead, DevOps Engineer | Review thường xuyên, tham gia quyết định, cập nhật liên tục |
| Keep Satisfied | Influence cao, Interest trung bình | Project Sponsor, Security/Privacy Reviewer, Super Admin Representative | Cập nhật theo milestone, xin phê duyệt khi có quyết định lớn |
| Keep Informed | Influence trung bình/thấp, Interest cao | Student Representative, Developers, QA Engineer, UI/UX Designer | Cập nhật theo sprint, mời feedback theo workflow liên quan |
| Monitor | Influence thấp, Interest thấp | Cloud Provider, Notification/Email Provider, Storage Provider | Theo dõi dependency, cập nhật khi có thay đổi tích hợp |

## Stakeholder Impact Matrix

| Stakeholder | Influence | Interest | Impact | Engagement Need | Nhận định |
| --- | --- | --- | --- | --- | --- |
| Product Owner | High | High | High | Very High | Cần tham gia hầu hết quyết định scope, priority, acceptance |
| Business Analyst | High | High | High | Very High | Điều phối requirement và bảo đảm traceability |
| Teacher Representative | High | High | High | Very High | Workflow Teacher quyết định giá trị chính của sản phẩm |
| Student Representative | Medium | High | High | High | Trải nghiệm Student quyết định adoption và completion |
| Admin Representative | High | High | High | Very High | Quyết định khả năng vận hành, governance và audit |
| Technical Lead | High | High | High | Very High | Quyết định feasibility, API, architecture và technical risk |
| QA Lead | High | High | Medium | High | Bảo đảm requirement testable và release đạt quality gate |
| DevOps Engineer | High | High | Medium | High | Bảo đảm Docker, CI/CD, Cloud deployment và rollback |
| UI/UX Designer | Medium | High | Medium | High | Tác động trực tiếp đến Student/Teacher/Admin workflow |
| Developers | Medium | High | Medium | High | Cần requirement rõ để implement đúng |
| Security Reviewer | High | Medium | Medium | Medium | Cần tham gia các phần auth, RBAC, audit, privacy |
| Support / Operations | Medium | Medium | Medium | Medium | Cung cấp input về support workflow và incident handling |
| External Providers | Medium | Low | Medium | Low | Ảnh hưởng đến delivery nếu provider bị giới hạn |

## Phân Tích Chi Tiết Stakeholder Chính

### Product Owner

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Sản phẩm có giá trị rõ, MVP khả thi, scope đúng trọng tâm |
| Nhu cầu | Product vision, roadmap, priority, acceptance criteria và release readiness rõ |
| Quan ngại | Scope creep, feature quá rộng, thiếu giá trị demo, requirement mơ hồ |
| Success Criteria | MVP hoàn thành workflow Student-Teacher-Admin và có thể trình bày chuyên nghiệp |
| Rủi ro nếu thiếu input | Requirement sai ưu tiên, MVP thiếu trọng tâm |
| Chiến lược tương tác | Review requirement theo tuần, xác nhận scope change, tham gia UAT approval |

### Business Analyst

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Tạo BA documentation nhất quán, traceable và đủ dùng cho development/QA |
| Nhu cầu | Input từ PO, Student, Teacher, Admin, Tech Lead, QA, DevOps |
| Quan ngại | Stakeholder feedback trễ, thay đổi scope không ghi nhận, requirement thiếu testability |
| Success Criteria | Requirement rõ, có acceptance criteria, trace được sang user story/use case/test |
| Rủi ro nếu thiếu vai trò BA | Tài liệu rời rạc, dev hiểu sai, QA khó test |
| Chiến lược tương tác | Điều phối workshop, maintain BA docs, quản lý decision log và open questions |

### Teacher Representative

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Có công cụ tạo Classroom, tạo Classwork, chấm điểm và theo dõi Student hiệu quả |
| Nhu cầu | Teacher Dashboard, Classroom Management, Module, Lesson, Flashcard, Quiz, Assignment, Grading, Progress |
| Quan ngại | Tạo nội dung quá nhiều bước, dashboard không chỉ ra Student cần hỗ trợ, chấm bài khó thao tác |
| Success Criteria | Teacher tạo lớp và giao nội dung nhanh, xem được progress từng Student |
| Rủi ro nếu thiếu input | Sản phẩm đúng kỹ thuật nhưng không phù hợp giảng dạy thực tế |
| Chiến lược tương tác | Demo teacher workflow thường xuyên, dùng UAT scenario cho tạo lớp, giao bài, chấm bài |

### Student Representative

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Join Classroom nhanh, học bài dễ, biết việc cần làm và xem kết quả rõ |
| Nhu cầu | Join by Code/Link, Student Dashboard, Classwork, Quiz, Submission, Progress, Grade/Feedback |
| Quan ngại | Không biết bài nào cần làm trước, deadline khó thấy, feedback khó tìm |
| Success Criteria | Student hoàn thành join flow và learning flow không cần hỗ trợ nhiều |
| Rủi ro nếu thiếu input | UX rối, adoption thấp, Student bỏ sót bài học hoặc assignment |
| Chiến lược tương tác | UAT task-based, khảo sát UX, quan sát thời gian join và nộp bài |

### Admin Representative

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Vận hành hệ thống an toàn, kiểm soát users, roles, policies, reports và audit log |
| Nhu cầu | User Management, Teacher Invitation, Role/Permission, Enrollment Policy, Reports, AuditLog, System Settings |
| Quan ngại | Không kiểm soát được role, thiếu audit, khóa user làm mất dữ liệu, không chuyển được Classroom ownership |
| Success Criteria | Admin quản lý account, policy, report và audit log rõ ràng |
| Rủi ro nếu thiếu input | Hệ thống dùng được cho lớp nhỏ nhưng khó vận hành khi mở rộng |
| Chiến lược tương tác | Review admin workflows riêng, xác nhận business rules cho RBAC và audit |

### Technical Lead

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Architecture khả thi, API rõ, data model đúng và hệ thống có khả năng mở rộng |
| Nhu cầu | Requirement stable, NFR rõ, data relationship rõ, API contract rõ |
| Quan ngại | Scope thay đổi liên tục, data model thiếu entity, API thiếu versioning/error standard |
| Success Criteria | RESTful API, MongoDB model, auth/RBAC và deployment architecture phù hợp |
| Rủi ro nếu thiếu input | Thiết kế kỹ thuật không đáp ứng requirement hoặc khó mở rộng |
| Chiến lược tương tác | Architecture review, API review, data model review trước implementation |

### QA Lead

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Đảm bảo requirement testable và release đạt chất lượng |
| Nhu cầu | Acceptance criteria, test scenarios, role matrix, UAT plan, defect workflow |
| Quan ngại | Requirement không đo được, thiếu expected result, thiếu dữ liệu test |
| Success Criteria | Must-have flows có test coverage và UAT evidence |
| Rủi ro nếu thiếu input | Lỗi nghiệp vụ lọt qua release, UAT không rõ pass/fail |
| Chiến lược tương tác | Review acceptance criteria, trace requirements sang test cases |

### DevOps Engineer

| Nội dung | Phân tích |
| --- | --- |
| Mục tiêu | Hệ thống build, deploy và rollback được ổn định |
| Nhu cầu | Environment matrix, Docker strategy, CI/CD flow, secrets handling, cloud deployment plan |
| Quan ngại | Config rải rác, thiếu health check, thiếu rollback, dependency không rõ |
| Success Criteria | Docker Compose chạy local, CI/CD deploy staging, có rollback và logging cơ bản |
| Rủi ro nếu thiếu input | Sản phẩm chạy local nhưng khó demo hoặc deploy lên Cloud |
| Chiến lược tương tác | Review DevOps requirements theo milestone, smoke test deployment |

## Stakeholder Requirement Interests

| Requirement Area | Stakeholder quan tâm chính | Lý do |
| --- | --- | --- |
| Authentication / RBAC | Admin, Super Admin, Security, Tech Lead | Liên quan quyền truy cập và bảo mật |
| Teacher Invitation | Admin, Teacher, Security, Backend | Onboarding Teacher không lộ password |
| Classroom Join | Student, Teacher, Admin, QA | Workflow đầu vào của sản phẩm |
| Classwork | Teacher, Student, BA, UX | Trung tâm hoạt động học tập |
| Submission / Grading | Teacher, Student, QA | Hoàn thiện quy trình giao bài và đánh giá |
| Progress Tracking | Teacher, Student, Product Owner | Giá trị khác biệt của microlearning |
| Admin Reports | Admin, Product Owner, QA | Vận hành và đo lường hệ thống |
| AuditLog | Admin, Security, Tech Lead | Truy vết hành động nhạy cảm |
| API / Swagger | Tech Lead, Developers, QA | Tích hợp và kiểm thử |
| Docker / CI/CD / Cloud | DevOps, Tech Lead, Product Owner | Demo và production readiness |

## Conflict Analysis

| Xung đột tiềm ẩn | Stakeholder liên quan | Nguyên nhân | Hướng xử lý |
| --- | --- | --- | --- |
| Teacher muốn nhiều tính năng tạo nội dung, MVP lại giới hạn | Teacher, PO, BA, Tech Lead | Scope rộng | Dùng MoSCoW, đưa advanced features vào Post-MVP |
| Student muốn flow rất đơn giản, Admin muốn kiểm soát chặt | Student, Admin, Security | Convenience vs governance | Thiết kế default đơn giản nhưng có policy rõ |
| Admin muốn nhiều report, Dev team bị tăng effort | Admin, PO, Tech Lead, Developers | Analytics cần data model và query phức tạp | MVP chọn report cơ bản, analytics nâng cao để release sau |
| QA muốn acceptance chi tiết, team muốn phát triển nhanh | QA, BA, Developers | Áp lực timeline | Definition of Ready và acceptance criteria tối thiểu cho Must-have |
| DevOps cần cấu hình chuẩn, feature team chỉ tập trung code | DevOps, Developers, Tech Lead | Deployment bị xem là cuối dự án | Đưa Docker/CI/CD vào scope từ đầu |
| Security muốn hạn chế quyền, Product muốn demo nhanh | Security, PO, Admin, Tech Lead | Bảo mật vs tốc độ | Ưu tiên auth/RBAC, invitation token và audit log ở MVP |

## Engagement Strategy

| Stakeholder | Cách tương tác | Tần suất | Artifact cần review |
| --- | --- | --- | --- |
| Product Owner | Requirement review, scope review, backlog prioritization | Hằng tuần / theo milestone | Vision, Scope, Requirements, UAT, Release |
| Teacher Representative | Workflow demo, UAT, feedback interview | Theo sprint / trước UAT | Teacher user stories, use cases, UI flows |
| Student Representative | UAT task, usability feedback | Theo sprint demo / UAT | Student flows, dashboard, join, submission |
| Admin Representative | Admin workflow review, governance review | Theo milestone | Admin requirements, RBAC, reports, audit log |
| Technical Lead | Architecture/API/data review | Hằng tuần | API catalog, data model, NFR, ADR |
| QA Lead | Acceptance criteria and test review | Hằng tuần / trước release | UAT plan, test scenarios, traceability |
| DevOps Engineer | Deployment/environment review | Theo milestone | Docker, CI/CD, cloud, rollback |
| Security Reviewer | Security/privacy checkpoint | Trước implementation nhạy cảm và trước release | Auth, RBAC, token, audit, privacy |

## Stakeholder Risks

| Risk ID | Rủi ro | Stakeholder liên quan | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| SR-001 | Thiếu đại diện Teacher review workflow | Teacher, PO, BA | High | Tổ chức teacher workflow review và UAT scenario |
| SR-002 | Student feedback đến quá muộn | Student, UX, QA | Medium | Test join/classwork/submission flow sớm |
| SR-003 | Admin requirements bị xem nhẹ | Admin, Security, Tech Lead | High | Đưa Admin core vào MVP: user, role, report, audit |
| SR-004 | Product Owner thay đổi priority liên tục | PO, BA, PM | High | Dùng change control và decision log |
| SR-005 | Technical Lead không review API sớm | Tech Lead, Dev, QA | High | API review trước implementation từng module |
| SR-006 | DevOps tham gia muộn | DevOps, Tech Lead | Medium | Docker/CI-CD checkpoint ngay từ MVP planning |
| SR-007 | Security/privacy thiếu input | Admin, Security, Student | High | Review token, password, RBAC và audit log trước release |

## Kết Luận

Stakeholder có ảnh hưởng lớn nhất đến thành công của dự án là **Product Owner**, **Teacher Representative**, **Student Representative**, **Admin Representative**, **Technical Lead**, **QA Lead** và **DevOps Engineer**.

Chiến lược stakeholder cần tập trung vào việc giữ các bên này tham gia đều đặn trong suốt vòng đời BA và delivery. Đặc biệt, mọi quyết định quan trọng về scope, role, API, data model, UAT và release phải được ghi nhận rõ trong tài liệu BA hoặc decision log.
