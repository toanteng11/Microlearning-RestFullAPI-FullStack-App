# Thông Tin Tài Liệu

## Tổng Quan Tài Liệu

Tài liệu này là phần kiểm soát tài liệu cho bộ **Business Analysis Documentation** của dự án **Microlearning Classroom LMS Platform**. Phần này dùng để xác định thông tin tài liệu, quyền sở hữu, trạng thái, lịch sử thay đổi, quy trình phê duyệt và danh sách deliverables BA cần hoàn thành.

## Metadata Tài Liệu

| Trường | Giá trị |
| --- | --- |
| Document Title | Business Analysis Documentation - Microlearning Classroom LMS Platform |
| Document Section | 00 - Document Control |
| Project Name | Microlearning Classroom LMS Platform |
| Product Type | Web-based Microlearning Classroom LMS and RESTful API System |
| Technology Scope | ReactJS, Node.js, ExpressJS, MongoDB Atlas, Docker, GitHub Actions, Swagger/OpenAPI, Google Cloud Run |
| Document Version | 1.42 |
| Document Status | In Review |
| Created Date | 2026-07-07 |
| Last Updated Date | 2026-07-19 |
| Prepared By | Business Analyst |
| Reviewed By | Product Owner, Technical Lead, QA Lead |
| Approved By | Product Owner |
| Repository Location | business-analysis/ |

## Mục Đích Tài Liệu

Mục đích của phần **Document Control** là:

- Cung cấp thông tin nhận diện chính thức cho bộ tài liệu BA.
- Quản lý phiên bản, thay đổi và trạng thái phê duyệt của tài liệu.
- Xác định người chịu trách nhiệm soạn thảo, rà soát và phê duyệt.
- Chuẩn hóa danh sách deliverables BA cần có trong dự án.
- Đảm bảo các bên liên quan sử dụng đúng phiên bản tài liệu.

## Phạm Vi Tài Liệu

Phần này áp dụng cho toàn bộ tài liệu BA trong thư mục `business-analysis/`, bao gồm:

- Project overview
- Product vision
- Stakeholder analysis
- Scope management
- User roles and permissions
- Business processes
- Business requirements và functional requirements
- User stories và use cases
- Data requirements
- API requirements
- UI/UX requirements
- Non-functional requirements
- Solution architecture
- DevOps và deployment
- Reporting và analytics
- Business rules
- Acceptance criteria và UAT
- Traceability
- Risk management
- Release planning
- Appendices

## Đối Tượng Sử Dụng Tài Liệu

| Đối tượng | Mục đích sử dụng |
| --- | --- |
| Product Owner | Review business scope, priorities, acceptance criteria và release readiness |
| Business Analyst | Duy trì requirements, business rules, traceability và chất lượng tài liệu |
| Technical Lead | Căn chỉnh architecture, API, data và deployment với requirements |
| Developers | Hiểu feature scope, API behavior, data expectations và acceptance criteria |
| QA Engineers | Xây dựng test scenarios, UAT cases và validation plan từ BA requirements |
| DevOps Engineer | Hiểu Docker, CI/CD, cloud deployment, rollback và environment requirements |
| Stakeholders | Review product direction, business value, risks và release scope |

## Quy Tắc Kiểm Soát Tài Liệu

- Mỗi thay đổi lớn phải được ghi nhận trong `revision-history.md`.
- Requirements đã được phê duyệt phải trace được đến business requirements, user stories, use cases và test scenarios.
- Bất kỳ thay đổi nào ảnh hưởng đến scope, cost, timeline, architecture hoặc release readiness phải tuân theo quy trình trong `../04-scope/change-control.md`.
- Document status phải được đánh dấu rõ là Draft, In Review, Approved, Superseded hoặc Archived.
- Chỉ các section đã được phê duyệt mới được dùng làm baseline input cho development và UAT.

## Định Nghĩa Trạng Thái Tài Liệu

| Trạng thái | Ý nghĩa |
| --- | --- |
| Draft | Nội dung đang được soạn và có thể thay đổi thường xuyên |
| In Review | Nội dung đã sẵn sàng để stakeholder review |
| Approved | Nội dung đã được review và chấp nhận làm baseline |
| Superseded | Nội dung đã được thay thế bởi phiên bản mới hơn |
| Archived | Nội dung không còn active nhưng được giữ để tham khảo |

## Quy Ước Versioning

| Loại version | Ví dụ | Ý nghĩa |
| --- | --- | --- |
| Major | 1.0, 2.0 | Baseline đã được phê duyệt hoặc thay đổi lớn ở cấp release |
| Minor | 1.1, 1.2 | Bổ sung section, cập nhật requirement hoặc tinh chỉnh scope |
| Draft | 0.1, 0.2 | Phiên bản làm việc ban đầu trước khi phê duyệt |

## Tài Liệu Liên Quan

| Tài liệu | Vị trí |
| --- | --- |
| Revision History | revision-history.md |
| Approval Record | approval.md |
| BA Deliverables | ba-deliverables.md |
| Scope Baseline | ../04-scope/scope-baseline.md |
| Change Control | ../04-scope/change-control.md |
| Requirement Traceability Matrix | ../19-traceability/requirement-traceability-matrix.md |
| UAT Plan | ../18-acceptance-criteria/uat-plan.md |
| Risk Register | ../20-risk-management/risk-register.md |
| Issue And Decision Log | ../20-risk-management/issue-decision-log.md |
| Release Planning Overview | ../21-release-planning/release-planning-overview.md |
| Release Entry Exit Criteria | ../21-release-planning/release-entry-exit-criteria.md |
| Appendices Overview | ../22-appendices/appendices-overview.md |
| Glossary And ID Conventions | ../22-appendices/glossary.md, ../22-appendices/acronyms-and-id-conventions.md |
