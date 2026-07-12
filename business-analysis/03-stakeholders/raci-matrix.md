# RACI Matrix

## Mục Đích

Tài liệu này xác định trách nhiệm của các stakeholder trong các hoạt động chính của dự án **Microlearning Classroom LMS Platform**.

RACI giúp tránh tình trạng:

- Không rõ ai chịu trách nhiệm cuối cùng.
- Nhiều người cùng quyết định một việc nhưng không ai accountable.
- Stakeholder quan trọng không được tham vấn.
- Đội phát triển thiếu thông tin từ BA, QA, DevOps hoặc người dùng cuối.

## Chú Thích RACI

| Ký hiệu | Ý nghĩa | Diễn giải |
| --- | --- | --- |
| R | Responsible | Người trực tiếp thực hiện công việc |
| A | Accountable | Người chịu trách nhiệm cuối cùng và phê duyệt kết quả |
| C | Consulted | Người được tham vấn, cung cấp input hoặc review |
| I | Informed | Người cần được thông báo |

Nguyên tắc: mỗi hoạt động nên có đúng một vai trò **A** để tránh mơ hồ trách nhiệm.

## Vai Trò Trong RACI

| Viết tắt | Vai trò |
| --- | --- |
| PO | Product Owner |
| BA | Business Analyst |
| PM | Project Manager / Scrum Master |
| TEA | Teacher Representative |
| STU | Student Representative |
| ADM | Admin Representative |
| TL | Technical Lead |
| UX | UI/UX Designer |
| DEV | Frontend/Backend Developers |
| QA | QA Lead / QA Engineer |
| DO | DevOps Engineer |
| SEC | Security / Privacy Reviewer |

## Governance And BA RACI

| Hoạt động | PO | BA | PM | TEA | STU | ADM | TL | UX | DEV | QA | DO | SEC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Xác định Product Vision | A | R | C | C | C | C | C | C | I | I | I | I |
| Xác định Product Positioning | A | R | C | C | C | C | C | C | I | I | I | I |
| Xác định MVP Scope | A | R | C | C | C | C | C | C | I | C | C | C |
| Quản lý Stakeholder Register | C | A/R | C | I | I | I | I | I | I | I | I | I |
| Elicit Requirements | A | R | C | C | C | C | C | C | I | C | I | C |
| Phân tích Requirement Priority | A | R | C | C | C | C | C | I | I | C | I | C |
| Quản lý Change Request | A | R | R | C | C | C | C | I | I | C | C | C |
| Duy trì Traceability Matrix | C | A/R | I | I | I | I | C | I | I | C | I | I |
| Duy trì Decision Log | A | R | R | C | I | C | C | I | I | I | I | C |

## Product Workflow RACI

| Hoạt động | PO | BA | PM | TEA | STU | ADM | TL | UX | DEV | QA | DO | SEC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Thiết kế Student Join Flow | A | R | I | C | C | C | C | R | C | C | I | C |
| Thiết kế Student Dashboard | A | R | I | C | C | I | C | R | C | C | I | I |
| Thiết kế Teacher Classroom Workflow | A | R | I | C | I | C | C | R | C | C | I | I |
| Thiết kế Teacher Classwork Workflow | A | R | I | C | C | I | C | R | C | C | I | I |
| Thiết kế Assignment Submission Workflow | A | R | I | C | C | I | C | R | C | C | I | C |
| Thiết kế Grading And Feedback Workflow | A | R | I | C | C | I | C | R | C | C | I | C |
| Thiết kế Progress Tracking Workflow | A | R | I | C | C | C | C | C | C | C | I | C |
| Thiết kế Admin User Management | A | R | I | I | I | C | C | C | C | C | I | C |
| Thiết kế Admin Reports / AuditLog | A | R | I | I | I | C | C | C | C | C | I | C |

## Technical Delivery RACI

| Hoạt động | PO | BA | PM | TEA | STU | ADM | TL | UX | DEV | QA | DO | SEC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Xác định System Architecture | C | C | I | I | I | I | A/R | C | C | C | C | C |
| Thiết kế MongoDB Data Model | I | C | I | I | I | C | A | I | R | C | I | C |
| Thiết kế RESTful API Contract | C | C | I | I | I | C | A | I | R | C | I | C |
| Viết Swagger/OpenAPI | I | C | I | I | I | I | A | I | R | C | I | I |
| Thiết kế Authentication/RBAC | C | C | I | I | I | C | A | I | R | C | I | C |
| Thiết kế AuditLog | C | C | I | I | I | C | A | I | R | C | I | C |
| Implement ReactJS Frontend | I | C | I | I | I | I | A | C | R | C | I | I |
| Implement Node.js Backend | I | C | I | I | I | I | A | I | R | C | I | C |
| Implement File Upload / Storage | I | C | I | I | I | C | A | I | R | C | C | C |
| Code Review | I | I | I | I | I | I | A/R | I | R | C | I | C |

## QA And UAT RACI

| Hoạt động | PO | BA | PM | TEA | STU | ADM | TL | UX | DEV | QA | DO | SEC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Xác định Acceptance Criteria | A | R | I | C | C | C | C | C | I | C | I | C |
| Lập Test Strategy | C | C | I | I | I | I | C | I | C | A/R | I | C |
| Viết Test Scenarios | C | C | I | C | C | C | C | I | I | A/R | I | C |
| API Testing | I | C | I | I | I | I | C | I | C | A/R | I | C |
| UI Functional Testing | I | C | I | I | I | I | C | C | C | A/R | I | I |
| Security-related Testing | I | C | I | I | I | C | C | I | C | R | I | A/C |
| UAT Student Workflow | A | R | C | I | C | I | I | C | I | R | I | I |
| UAT Teacher Workflow | A | R | C | C | I | I | I | C | I | R | I | I |
| UAT Admin Workflow | A | R | C | I | I | C | I | C | I | R | I | C |
| Defect Triage | A | C | R | I | I | I | C | C | R | R | I | C |

## DevOps And Release RACI

| Hoạt động | PO | BA | PM | TEA | STU | ADM | TL | UX | DEV | QA | DO | SEC |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Docker Strategy | I | I | I | I | I | I | C | I | C | C | A/R | I |
| CI/CD Pipeline | I | I | I | I | I | I | C | I | C | C | A/R | I |
| Environment Configuration | I | I | I | I | I | C | C | I | C | C | A/R | C |
| Cloud Deployment | I | I | C | I | I | I | C | I | C | C | A/R | C |
| Monitoring / Logging Foundation | I | C | I | I | I | C | C | I | C | C | A/R | C |
| Rollback Strategy | C | I | C | I | I | I | C | I | C | C | A/R | C |
| Release Readiness Review | A | C | R | I | I | C | C | I | C | C | C | C |
| Production / Demo Deployment Approval | A | I | C | I | I | I | C | I | I | C | C | C |

## Key Accountability Summary

| Domain | Accountable |
| --- | --- |
| Product Vision | Product Owner |
| Requirements Documentation | Business Analyst |
| MVP Scope | Product Owner |
| Teacher Workflow Validation | Product Owner, với Teacher Representative consulted |
| Student Workflow Validation | Product Owner, với Student Representative consulted |
| Admin Workflow Validation | Product Owner, với Admin Representative consulted |
| Architecture | Technical Lead |
| API Contract | Technical Lead |
| Data Model | Technical Lead |
| UX Direction | Product Owner, với UI/UX Designer responsible |
| Quality Gate | QA Lead |
| CI/CD And Deployment | DevOps Engineer |
| Security/Privacy Review | Security / Privacy Reviewer |
| Release Approval | Product Owner |

## RACI Governance Rules

- Nếu một hoạt động có nhiều người muốn quyết định, Product Owner và Project Manager phải xác định lại một vai trò **A** duy nhất.
- Nếu một requirement ảnh hưởng đến security, role, account, invitation token hoặc audit log, Security/Privacy Reviewer phải được consulted.
- Nếu một requirement ảnh hưởng đến API, data model hoặc deployment, Technical Lead phải được consulted hoặc accountable tùy domain.
- Nếu một requirement ảnh hưởng đến UAT, QA Lead phải được consulted trước khi baseline.
- Nếu một scope change ảnh hưởng đến MVP, Product Owner phải accountable và BA phải cập nhật change impact.

## Kết Luận

RACI của dự án đặt **Product Owner** làm người chịu trách nhiệm cuối cùng về sản phẩm và release, **Business Analyst** chịu trách nhiệm phân tích/tài liệu requirement, **Technical Lead** chịu trách nhiệm kỹ thuật, **QA Lead** chịu trách nhiệm chất lượng, và **DevOps Engineer** chịu trách nhiệm triển khai.

Các representative của **Teacher**, **Student** và **Admin** không nhất thiết phê duyệt scope cuối cùng, nhưng phải được tham vấn để đảm bảo sản phẩm đúng nghiệp vụ và dùng được trong thực tế.
