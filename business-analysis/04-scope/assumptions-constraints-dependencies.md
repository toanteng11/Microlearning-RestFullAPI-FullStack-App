# Assumptions, Constraints And Dependencies

## Mục Đích

Tài liệu này xác định các **giả định**, **ràng buộc** và **phụ thuộc** của dự án **Microlearning Classroom LMS Platform**.

Các yếu tố này ảnh hưởng trực tiếp đến scope, planning, architecture, API, data model, UAT, DevOps và Cloud deployment. Việc ghi nhận rõ giúp dự án tránh hiểu nhầm và quản lý rủi ro tốt hơn.

## Định Nghĩa

| Khái niệm | Ý nghĩa |
| --- | --- |
| Assumption | Điều được giả định là đúng tại thời điểm lập kế hoạch, nhưng có thể cần xác minh |
| Constraint | Ràng buộc bắt buộc phải tuân theo, giới hạn lựa chọn sản phẩm/kỹ thuật |
| Dependency | Yếu tố hoặc bên liên quan mà dự án phụ thuộc để hoàn thành scope |

## Assumptions

| ID | Assumption | Tác động nếu sai | Owner | Trạng thái |
| --- | --- | --- | --- | --- |
| ASM-001 | Người dùng truy cập hệ thống chủ yếu qua web browser hiện đại | Cần điều chỉnh UI/browser support nếu có browser cũ | Product Owner | Open |
| ASM-002 | MVP ưu tiên web application, chưa cần native mobile app | Scope tăng nếu mobile app bị yêu cầu sớm | Product Owner | Confirmed |
| ASM-003 | Student, Teacher và Admin là ba nhóm user nghiệp vụ chính | Scope role thay đổi nếu thêm Guardian/Parent/Manager | BA | Confirmed |
| ASM-004 | Teacher account được kích hoạt bằng manual invitation link | Nếu muốn system gửi email tự động, cần email provider và scope tăng | Product Owner | Confirmed |
| ASM-005 | Admin nhập email Teacher để ràng buộc invitation, không phải để system gửi mail | Nếu bỏ email matching, security risk tăng | BA / Security | Confirmed |
| ASM-006 | Student có thể join Classroom bằng Class Code hoặc Invite Link | Nếu một phương thức bị loại, UI/API/test scope thay đổi | Product Owner | Confirmed |
| ASM-007 | Google Classroom chỉ được dùng làm nguồn tham khảo workflow | Nếu định vị thành clone, rủi ro branding/scope tăng | Product Owner | Confirmed |
| ASM-008 | MongoDB là database chính | Nếu đổi database, data model và implementation thay đổi lớn | Technical Lead | Confirmed |
| ASM-009 | Backend dùng Node.js/ExpressJS RESTful API | Nếu đổi framework/API style, architecture docs phải cập nhật | Technical Lead | Confirmed |
| ASM-010 | Frontend dùng ReactJS | Nếu đổi frontend framework, UI implementation scope thay đổi | Technical Lead | Confirmed |
| ASM-011 | Swagger/OpenAPI dùng để document API | Nếu không dùng Swagger, QA/frontend khó test và tích hợp | Technical Lead | Confirmed |
| ASM-012 | Docker/Docker Compose dùng cho local/dev setup | Nếu bỏ Docker, DevOps scope và onboarding dev thay đổi | DevOps | Confirmed |
| ASM-013 | CI/CD pipeline cơ bản sẽ có trong MVP hoặc demo release | Nếu không có CI/CD, production readiness giảm | DevOps | Open |
| ASM-014 | Cloud provider chưa cố định tại BA stage | Cần cập nhật deployment docs khi chọn provider | DevOps | Open |
| ASM-015 | File upload có thể được triển khai cơ bản hoặc bằng link/resource URL trước | Nếu cần storage provider đầy đủ, scope tăng | Tech Lead | Open |
| ASM-016 | Email provider không bắt buộc cho Teacher invitation MVP | Nếu cần auto email notification, integration scope tăng | Product Owner | Confirmed |
| ASM-017 | UAT có đại diện Student, Teacher và Admin | Nếu thiếu đại diện, validation nghiệp vụ yếu | QA Lead | Open |
| ASM-018 | MVP không yêu cầu payment, SIS, AI hoặc Google Workspace integration | Nếu stakeholder yêu cầu, phải qua change control | Product Owner | Confirmed |

## Constraints

| ID | Constraint | Mô tả | Tác động |
| --- | --- | --- | --- |
| CON-001 | Technology Stack | Frontend ReactJS, Backend Node.js/ExpressJS, Database MongoDB | Giới hạn lựa chọn kỹ thuật |
| CON-002 | API Style | Backend phải cung cấp RESTful API | Không dùng GraphQL trong MVP |
| CON-003 | API Documentation | API MVP phải có Swagger/OpenAPI | Endpoint cần được document song song |
| CON-004 | Role-Based Access | Hệ thống phải có RBAC cho Student, Teacher, Admin, Super Admin | Mọi API/UI cần kiểm tra permission |
| CON-005 | Teacher Invitation Security | Invitation token phải one-time, expires, revoke được, không lưu raw token | Data/API phải thiết kế an toàn |
| CON-006 | Manual Invitation Delivery | System không bắt buộc gửi email tự động cho Teacher invitation trong MVP | UI/API phải trả link để Admin copy |
| CON-007 | Password Security | Không lưu plain text password; password phải hash | Auth implementation bắt buộc |
| CON-008 | Classroom Access Control | Student chỉ truy cập Classroom đã join | API query và authorization phải kiểm soát |
| CON-009 | Teacher Ownership | Teacher chỉ quản lý Classroom do mình sở hữu trừ khi có Admin permission | Ràng buộc API và UI |
| CON-010 | Auditability | Hành động quan trọng như invite, accept, revoke, role change, block account phải có audit log | Cần AuditLog entity/API |
| CON-011 | MVP Focus | MVP phải tập trung core workflow, tránh scope creep | Advanced features cần Post-MVP |
| CON-012 | Cloud-ready | Thiết kế phải hỗ trợ triển khai Cloud | Config/secrets/env cần chuẩn |
| CON-013 | Dockerized Development | Hệ thống cần chạy được bằng Docker/Docker Compose nếu thuộc MVP technical scope | DevOps setup cần sớm |
| CON-014 | Privacy | Không expose token raw, password, dữ liệu nhạy cảm trong logs | Logging/error handling phải kiểm soát |
| CON-015 | Documentation Language | Nội dung tài liệu BA bằng tiếng Việt, tên file/thư mục tiếng Anh, file `.md` | Cần giữ format nhất quán |

## Dependencies

### Product / Business Dependencies

| ID | Dependency | Mô tả | Owner | Risk |
| --- | --- | --- | --- | --- |
| DEP-BIZ-001 | Product Owner availability | Cần PO review scope, priority, UAT và release | Product Owner | High |
| DEP-BIZ-002 | Teacher Representative feedback | Cần review Teacher workflow | BA / PO | High |
| DEP-BIZ-003 | Student Representative feedback | Cần review join, classwork, submission, progress | BA / QA | Medium |
| DEP-BIZ-004 | Admin Representative feedback | Cần review user, role, policy, report, audit | BA / PO | High |
| DEP-BIZ-005 | Scope approval | MVP scope cần được PO baseline | Product Owner | High |
| DEP-BIZ-006 | Change control decision | Scope change cần quyết định rõ | Product Owner / BA | Medium |

### Technical Dependencies

| ID | Dependency | Mô tả | Owner | Risk |
| --- | --- | --- | --- | --- |
| DEP-TECH-001 | Node.js runtime | Backend development và deployment | Tech Lead | Medium |
| DEP-TECH-002 | MongoDB service | Database local/staging/production | Tech Lead / DevOps | High |
| DEP-TECH-003 | ReactJS setup | Frontend development | Frontend Developer | Medium |
| DEP-TECH-004 | Swagger/OpenAPI tooling | API documentation | Backend / QA | Medium |
| DEP-TECH-005 | JWT/Auth library | Authentication and authorization | Backend | High |
| DEP-TECH-006 | Password hashing library | Password security | Backend | High |
| DEP-TECH-008 | File upload/storage option | Resource/submission attachment | Tech Lead / DevOps | Medium |
| DEP-TECH-009 | Logging mechanism | Application logs and audit | Tech Lead | Medium |

### DevOps Dependencies

| ID | Dependency | Mô tả | Owner | Risk |
| --- | --- | --- | --- | --- |
| DEP-DEVOPS-001 | Docker runtime | Local/dev container setup | DevOps | Medium |
| DEP-DEVOPS-002 | CI/CD provider | Build/test/deploy pipeline | DevOps | Medium |
| DEP-DEVOPS-003 | Cloud provider account | Staging/demo deployment | DevOps / PO | High |
| DEP-DEVOPS-004 | Domain and SSL | Public deployment access | DevOps | Medium |
| DEP-DEVOPS-005 | Environment variables/secrets management | Secure config | DevOps / Tech Lead | High |
| DEP-DEVOPS-006 | Monitoring/logging tool | Operational visibility | DevOps | Medium |

### External Service Dependencies

| ID | Dependency | Mô tả | Có bắt buộc cho MVP? |
| --- | --- | --- | --- |
| DEP-EXT-001 | Email provider | Chỉ cần nếu triển khai email notification hoặc reset password tự động | Không bắt buộc cho Teacher invitation |
| DEP-EXT-002 | Cloud storage provider | Cần nếu upload file production-ready | Có thể hoãn hoặc dùng local/basic |
| DEP-EXT-003 | Video/meeting provider | Cần nếu tích hợp lớp học online | Không |
| DEP-EXT-004 | AI provider | Cần nếu làm AI recommendation/grading | Không |
| DEP-EXT-005 | SIS provider | Cần nếu sync danh sách lớp/sinh viên | Không |

## Dependency Criticality

| Criticality | Dependency | Lý do |
| --- | --- | --- |
| High | Product Owner approval | Không có approval thì scope không baseline |
| High | Teacher/Admin workflow feedback | Sai workflow sẽ làm sản phẩm không dùng được |
| High | MongoDB/Auth/RBAC | Nền tảng dữ liệu và bảo mật |
| High | Cloud/secrets nếu deploy demo | Ảnh hưởng khả năng trình bày/deployment |
| Medium | File upload provider | Có thể triển khai link/resource cơ bản trước |
| Low/Mid | Email provider | Không bắt buộc vì Teacher invitation dùng manual copy link |

## Assumption Validation Plan

| Assumption | Cách xác minh | Thời điểm |
| --- | --- | --- |
| Teacher invitation dùng manual copy link | Product Owner xác nhận và BA baseline | Đã xác nhận trong scope |
| Cloud provider chưa được lựa chọn | DevOps đề xuất provider và Product Owner chấp thuận ADR | Trước deployment planning |
| Student/Teacher/Admin UAT có đại diện | QA/PO xác nhận danh sách UAT users | Trước UAT |
| File upload scope cơ bản | PO/Tech Lead quyết định local/cloud storage | Trước development module Resource/Submission |
| Notification scope | PO xác nhận in-app/email level | Trước development notification |

## Impact Nếu Assumption Thay Đổi

| Thay đổi | Impact |
| --- | --- |
| Chuyển Teacher invitation từ manual copy sang system email | Cần email provider, email template, delivery log, retry, failure handling, test scenarios mới |
| Bổ sung lại phương thức join mới ngoài Class Code/Invite Link | Cần Change Control và cập nhật đồng bộ UI/API/data/security/test/release |
| Thêm native mobile app | Tăng scope rất lớn, cần mobile team và API hardening |
| Thêm SIS integration | Cần data mapping, sync job, error handling và security review |
| Đổi MongoDB sang SQL | Ảnh hưởng data model, query, migration và implementation |

## Kết Luận

Các assumption, constraint và dependency quan trọng nhất của MVP là:

- Teacher invitation dùng **manual copy link**, không phụ thuộc email provider.
- Sản phẩm là web application dùng ReactJS, Node.js/ExpressJS và MongoDB.
- API phải là RESTful API có Swagger/OpenAPI.
- Security/RBAC/AuditLog là bắt buộc ngay từ MVP.
- Docker, CI/CD và Cloud deployment là một phần technical scope.
- Các tích hợp nâng cao như AI, SIS, Google Workspace, payment và native mobile đều không bắt buộc trong MVP.
