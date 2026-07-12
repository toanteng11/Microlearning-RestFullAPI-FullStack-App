# Stakeholder Register

## Mục Đích

Tài liệu này ghi nhận đầy đủ các stakeholder của dự án **Microlearning Classroom LMS Platform**, bao gồm stakeholder nghiệp vụ, stakeholder người dùng cuối, stakeholder kỹ thuật, stakeholder vận hành và stakeholder bên ngoài.

Stakeholder Register giúp đội dự án:

- Xác định ai có ảnh hưởng đến scope, priority, requirement và release.
- Xác định ai cần được tham vấn, ai cần phê duyệt và ai cần được thông báo.
- Làm rõ kỳ vọng, trách nhiệm và quyền ra quyết định của từng stakeholder.
- Giảm rủi ro thiếu input từ Student, Teacher, Admin hoặc đội kỹ thuật.
- Làm cơ sở cho Stakeholder Analysis, RACI Matrix và Communication Plan.

## Phạm Vi Stakeholder

Stakeholder trong dự án được chia thành 5 nhóm chính:

| Nhóm | Mô tả |
| --- | --- |
| Governance Stakeholders | Người định hướng, ưu tiên và phê duyệt sản phẩm |
| Business And End-user Stakeholders | Người sử dụng hoặc bị ảnh hưởng trực tiếp bởi sản phẩm |
| Delivery Stakeholders | Người phân tích, thiết kế, phát triển, kiểm thử và triển khai |
| Operations Stakeholders | Người vận hành, hỗ trợ, giám sát và quản trị hệ thống |
| External Stakeholders | Provider hoặc hệ thống bên ngoài có thể ảnh hưởng đến cloud, storage, notification, deployment |

## Stakeholder Register

| ID | Stakeholder | Nhóm | Vai trò trong dự án | Trách nhiệm chính | Influence | Interest | Decision Rights |
| --- | --- | --- | --- | --- | --- | --- | --- |
| STK-001 | Project Sponsor | Governance | Người bảo trợ dự án | Cung cấp định hướng cấp cao, ngân sách/thời gian giả định, phê duyệt định hướng lớn | High | Medium | Phê duyệt định hướng chiến lược và quyết định lớn |
| STK-002 | Product Owner | Governance | Chủ sở hữu sản phẩm | Xác định business value, ưu tiên backlog, phê duyệt scope và acceptance ở cấp sản phẩm | High | High | Phê duyệt scope, priority, MVP và release readiness |
| STK-003 | Business Analyst | Delivery | Chủ sở hữu BA documentation | Elicit requirements, phân tích stakeholder, viết BA docs, quản lý traceability và change impact | High | High | Đề xuất requirement baseline, không phê duyệt cuối cùng |
| STK-004 | Project Manager / Scrum Master | Governance | Điều phối tiến độ | Theo dõi timeline, dependency, meeting cadence, issue escalation và delivery coordination | Medium | High | Quyết định về lịch trình và cách điều phối |
| STK-005 | Academic / Training Manager | Business | Đại diện mục tiêu đào tạo | Đảm bảo sản phẩm phù hợp quy trình đào tạo nội bộ, chất lượng học tập và báo cáo | High | High | Tham vấn/phê duyệt nghiệp vụ đào tạo nếu có |
| STK-006 | Teacher Representative | End User | Đại diện giảng viên | Review workflow Teacher, Classwork, Quiz, Assignment, Grading, Feedback và Progress Dashboard | High | High | Phê duyệt nghiệp vụ giảng dạy ở UAT theo đại diện |
| STK-007 | Student Representative | End User | Đại diện người học | Review join flow, Student Dashboard, Classwork, Quiz, Submission, Progress và Feedback | Medium | High | Cung cấp feedback UAT, không phê duyệt scope |
| STK-008 | Admin Representative | Operations | Đại diện quản trị hệ thống | Review user management, role, invitation, enrollment policy, reports, audit log và offboarding | High | High | Phê duyệt nghiệp vụ vận hành ở UAT theo đại diện |
| STK-009 | Super Admin Representative | Operations | Đại diện quyền quản trị cao nhất | Review system configuration, admin permissions, security-sensitive settings | High | Medium | Phê duyệt quyền/cấu hình nhạy cảm nếu role được áp dụng |
| STK-010 | Technical Lead | Delivery | Chủ sở hữu kỹ thuật | Quyết định architecture, API design, data model, integration pattern và technical standards | High | High | Phê duyệt architecture và technical approach |
| STK-011 | UI/UX Designer | Delivery | Thiết kế trải nghiệm | Thiết kế user flows, wireframes, interaction patterns và responsive UX cho Student/Teacher/Admin | Medium | High | Đề xuất UX, cần PO/BA review |
| STK-012 | Frontend Developer | Delivery | Xây dựng ReactJS application | Implement UI, routing, state management, API integration và frontend validation | Medium | High | Quyết định implementation chi tiết trong phạm vi kỹ thuật |
| STK-013 | Backend Developer | Delivery | Xây dựng Node.js RESTful API | Implement API, auth, business logic, MongoDB integration, Swagger/OpenAPI | Medium | High | Quyết định implementation chi tiết trong phạm vi kỹ thuật |
| STK-014 | Database Designer / Backend Owner | Delivery | Thiết kế data model | Thiết kế MongoDB collections, indexes, validation rules, retention và query patterns | Medium | High | Đề xuất data model, Tech Lead phê duyệt |
| STK-015 | QA Lead | Delivery | Chủ sở hữu chất lượng | Xác định test strategy, UAT plan, acceptance coverage và defect severity | High | High | Phê duyệt test readiness và quality gate |
| STK-016 | QA Engineer | Delivery | Kiểm thử chức năng | Viết/runs test cases, kiểm thử regression, API testing, UI testing và UAT support | Medium | High | Ghi nhận defect và test evidence |
| STK-017 | DevOps Engineer | Delivery/Operations | Chủ sở hữu deployment | Docker, CI/CD, environment, Cloud deployment, rollback, monitoring foundation | High | High | Phê duyệt deployment readiness |
| STK-018 | Security / Privacy Reviewer | Operations | Review bảo mật và privacy | Review authentication, authorization, RBAC, password, invitation token, audit log, data privacy | High | Medium | Phê duyệt security/privacy readiness nếu được chỉ định |
| STK-019 | Support / Operations Staff | Operations | Hỗ trợ vận hành | Xử lý user support, account issue, classroom issue, incident và operational monitoring | Medium | Medium | Đề xuất cải tiến vận hành |
| STK-020 | Cloud Provider | External | Hạ tầng triển khai | Cung cấp compute, storage, network, domain, SSL hoặc managed services | Medium | Low | Không quyết định sản phẩm, ảnh hưởng kỹ thuật |
| STK-021 | Notification / Email Provider | External | Gửi thông báo hệ thống nếu được tích hợp | Hỗ trợ reset password hoặc notification tự động; không bắt buộc cho Teacher invitation trong MVP | Medium | Low | Không quyết định sản phẩm, ảnh hưởng delivery |
| STK-022 | Storage Provider | External | Lưu file upload | Lưu attachment, image, video, resource hoặc submission file | Medium | Low | Không quyết định sản phẩm, ảnh hưởng NFR |

## Stakeholder Theo Role Sản Phẩm

| Product Role | Stakeholder đại diện | Mối quan tâm chính |
| --- | --- | --- |
| Guest | Student/Teacher chưa login | Login, register, mở invitation link hoặc join link |
| Student | Student Representative | Join Classroom, học bài, làm quiz, nộp bài, xem Progress/Grade/Feedback |
| Teacher | Teacher Representative | Tạo Classroom, tạo nội dung, mời Student, chấm điểm, xem Progress |
| Admin | Admin Representative | User management, role, policy, reports, audit log, offboarding |
| Super Admin | Super Admin Representative | System settings, admin permissions, security configuration |

## Stakeholder Theo Domain Quyết Định

| Domain | Accountable | Consulted | Informed |
| --- | --- | --- | --- |
| Product Vision | Product Owner | Sponsor, BA, Teacher, Admin, Tech Lead | Project Team |
| MVP Scope | Product Owner | BA, Tech Lead, QA Lead, Teacher, Admin | Developers, DevOps |
| Student Workflow | Product Owner | BA, Student Representative, UX, QA | Tech Lead, Developers |
| Teacher Workflow | Product Owner | BA, Teacher Representative, UX, QA | Tech Lead, Developers |
| Admin Workflow | Product Owner | BA, Admin Representative, Security, QA | Tech Lead, Developers |
| Architecture | Technical Lead | Backend, Frontend, DevOps, Security, BA | Product Owner, QA |
| API Contract | Technical Lead | BA, Backend, Frontend, QA | Product Owner |
| Data Model | Technical Lead | Backend, BA, QA, Security | Product Owner |
| Security / Privacy | Security Reviewer | Tech Lead, BA, DevOps, QA | Product Owner |
| UAT Acceptance | Product Owner | BA, QA Lead, Teacher, Student, Admin | Project Team |
| Release Approval | Product Owner | Tech Lead, QA Lead, DevOps, BA | Stakeholders |

## Kỳ Vọng Chính Của Stakeholder

| Stakeholder | Kỳ vọng |
| --- | --- |
| Product Owner | Scope rõ, MVP có giá trị, ưu tiên hợp lý, release có thể demo |
| Teacher | Workflow tạo lớp và quản lý học tập không quá phức tạp |
| Student | Join lớp nhanh, biết bài cần làm, dễ xem kết quả |
| Admin | Có công cụ quản lý user, role, report và audit rõ ràng |
| Technical Lead | Requirement đủ rõ để thiết kế API, data model và architecture |
| QA Lead | Acceptance criteria có thể kiểm thử và có traceability |
| DevOps Engineer | Environment, Docker, CI/CD và deployment requirements rõ |
| Security Reviewer | RBAC, token, password, audit log và privacy được xử lý đúng |

## Stakeholder Ưu Tiên Cao

Các stakeholder cần được quản lý sát nhất trong MVP:

| Priority | Stakeholder | Lý do |
| --- | --- | --- |
| 1 | Product Owner | Quyết định scope, priority và release |
| 2 | Teacher Representative | Teacher là actor tạo giá trị học tập chính |
| 3 | Student Representative | Student là actor tiêu thụ nội dung và tạo dữ liệu progress |
| 4 | Admin Representative | Admin bảo đảm hệ thống vận hành được |
| 5 | Technical Lead | Quyết định khả năng triển khai thực tế |
| 6 | QA Lead | Bảo đảm requirement có thể kiểm thử |
| 7 | DevOps Engineer | Bảo đảm hệ thống deploy được bằng Docker/CI/CD/Cloud |

## Assumptions

- Product Owner có quyền quyết định cuối cùng về MVP scope.
- Teacher, Student và Admin Representative có thể không phải là toàn bộ người dùng thật, nhưng cần đại diện đủ cho UAT.
- Super Admin có thể được gộp với Admin trong MVP nếu hệ thống nhỏ, nhưng vẫn cần mô tả quyền trong BA.
- External providers như Cloud, Notification/Email và Storage chưa được chọn cụ thể ở giai đoạn BA, nhưng Teacher invitation trong MVP không phụ thuộc email provider vì dùng manual copy link.
- Security/Privacy Reviewer có thể là Technical Lead kiêm nhiệm nếu dự án nhỏ.

## Kết Luận

Stakeholder của dự án không chỉ là người dùng cuối. Với một hệ thống Microlearning Classroom LMS có RESTful API, MongoDB, Docker, CI/CD và Cloud deployment, stakeholder cần bao gồm cả người quyết định sản phẩm, người dùng nghiệp vụ, đội kỹ thuật, QA, DevOps và vận hành.

Stakeholder quan trọng nhất trong MVP là **Product Owner**, **Teacher**, **Student**, **Admin**, **Technical Lead**, **QA Lead** và **DevOps Engineer**. Mọi requirement quan trọng cần trace được đến ít nhất một stakeholder có nhu cầu hoặc trách nhiệm rõ ràng.
