# Change Control

## Mục Đích

Tài liệu này xác định quy trình kiểm soát thay đổi cho dự án **Microlearning Classroom LMS Platform**.

Change Control đảm bảo mọi thay đổi ảnh hưởng đến scope, requirement, API, data model, UI/UX, test, DevOps hoặc release đều được ghi nhận, phân tích tác động, phê duyệt và trace đầy đủ.

## Khi Nào Cần Change Control

Change Control bắt buộc khi thay đổi:

- Thêm, sửa hoặc xóa feature trong MVP.
- Thay đổi priority của feature từ Should/Could sang Must.
- Thay đổi user role hoặc permission.
- Thay đổi Teacher invitation workflow.
- Thay đổi API contract, endpoint, request/response hoặc error schema.
- Thay đổi data model, entity, validation hoặc retention.
- Thay đổi UI flow chính của Student, Teacher hoặc Admin.
- Thay đổi NFR như security, performance, availability, privacy.
- Thay đổi Docker, CI/CD, Cloud deployment hoặc rollback strategy.
- Thay đổi acceptance criteria, UAT scope hoặc release readiness.

## Không Cần Change Control Chính Thức

Các thay đổi sau có thể xử lý như editorial/minor update:

| Loại thay đổi | Ví dụ |
| --- | --- |
| Editorial | Sửa lỗi chính tả, format, wording không làm đổi nghĩa |
| Clarification | Làm rõ requirement đã tồn tại nhưng không đổi behavior |
| Minor documentation update | Thêm cross-reference, cập nhật heading |
| Internal implementation detail | Refactor code không đổi behavior/API |
| Test data update | Cập nhật dữ liệu test không đổi scenario |

Nếu không chắc thay đổi có ảnh hưởng scope hay không, BA cần ghi nhận và hỏi Product Owner.

## Change Request Lifecycle

| Trạng thái | Ý nghĩa |
| --- | --- |
| Draft | Change mới được ghi nhận, chưa đủ thông tin |
| Submitted | Change đã được gửi để phân tích |
| Under Analysis | BA/Tech Lead/QA/DevOps đang phân tích tác động |
| Pending Decision | Đã phân tích, chờ Product Owner hoặc authority quyết định |
| Approved | Được chấp thuận để đưa vào backlog/scope |
| Rejected | Bị từ chối |
| Deferred | Hoãn sang release sau |
| Implemented | Đã được triển khai |
| Verified | Đã được QA/UAT xác minh |
| Closed | Đã hoàn tất và cập nhật tài liệu |

## Change Control Process

```text
Stakeholder đề xuất change
        ↓
BA ghi nhận Change Request
        ↓
BA làm rõ business reason và affected scope
        ↓
Tech Lead / QA / DevOps / Security phân tích impact nếu cần
        ↓
Product Owner quyết định Approved / Rejected / Deferred
        ↓
Nếu Approved, BA cập nhật requirements, scope baseline và traceability
        ↓
Team đưa vào backlog / sprint / release plan
        ↓
QA cập nhật test scenarios và UAT
        ↓
Change được verify và close
```

## Change Request Template

| Field | Mô tả |
| --- | --- |
| Change ID | Mã định danh duy nhất, ví dụ `CR-001` |
| Title | Tên ngắn của thay đổi |
| Requester | Người đề xuất |
| Request Date | Ngày đề xuất |
| Description | Mô tả chi tiết thay đổi |
| Business Reason | Lý do nghiệp vụ |
| Current Behavior | Hành vi/phạm vi hiện tại |
| Proposed Behavior | Hành vi/phạm vi mong muốn |
| Affected Users | Student, Teacher, Admin, Super Admin, Developer, QA, DevOps |
| Affected Scope | Product, process, data, API, UI, NFR, DevOps, UAT |
| Priority | Must, Should, Could, Won't |
| Urgency | Immediate, Next Sprint, Next Release, Future |
| Impact Summary | Tóm tắt tác động |
| Decision | Approved, Rejected, Deferred |
| Decision Owner | Người quyết định |
| Decision Date | Ngày quyết định |
| Follow-up Actions | Các việc cần làm sau quyết định |
| Linked Requirements | Requirement/User Story/Use Case liên quan |
| Status | Trạng thái lifecycle |

## Impact Assessment Matrix

| Impact Area | Câu hỏi phân tích |
| --- | --- |
| Business Value | Change có tăng giá trị cho Student/Teacher/Admin không? |
| MVP Scope | Change có làm thay đổi MVP baseline không? |
| Timeline | Change có làm tăng effort hoặc trễ milestone không? |
| UX | Change có ảnh hưởng user flow hoặc wireframe không? |
| API | Change có thêm/sửa/xóa endpoint, request/response không? |
| Data | Change có thêm/sửa entity, field, validation, index không? |
| Security | Change có ảnh hưởng auth, RBAC, token, password, privacy không? |
| QA | Change có cần test cases mới hoặc regression test không? |
| DevOps | Change có ảnh hưởng Docker, CI/CD, env, Cloud, monitoring không? |
| Documentation | Change có yêu cầu cập nhật BA docs, API docs, UAT docs không? |

## Approval Authority

| Change Type | Required Approval | Consulted |
| --- | --- | --- |
| Business scope change | Product Owner | BA, Teacher/Admin/Student Representative |
| MVP Must-have change | Product Owner | BA, Tech Lead, QA Lead |
| Teacher invitation workflow change | Product Owner | BA, Tech Lead, Security, QA |
| Role/permission change | Product Owner / Super Admin | BA, Tech Lead, Security, QA |
| API contract change | Technical Lead | BA, Frontend, Backend, QA |
| Data model change | Technical Lead | BA, Backend, QA |
| UI/UX flow change | Product Owner | BA, UX, QA, affected user representative |
| Security/privacy change | Security Reviewer / Tech Lead | PO, BA, QA |
| Deployment change | DevOps Engineer | Tech Lead, QA, PO |
| Release Go/No-Go change | Product Owner | QA Lead, Tech Lead, DevOps, BA |

## Change Priority Guidance

| Priority | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| Must | Bắt buộc để MVP đạt mục tiêu hoặc đảm bảo security/compliance | Teacher invitation token phải expire |
| Should | Quan trọng nhưng có thể release sau nếu thiếu thời gian | Gradebook basic, file policy |
| Could | Có giá trị nhưng không ảnh hưởng MVP | Co-teacher, online class link |
| Won't | Không làm trong release hiện tại | AI grading, native mobile app |

## Change Impact Levels

| Impact Level | Mô tả | Quy trình |
| --- | --- | --- |
| Low | Chỉnh tài liệu hoặc UI text, không đổi behavior | BA cập nhật, thông báo PO nếu cần |
| Medium | Đổi behavior nhỏ, thêm field/API nhỏ, ảnh hưởng test | PO/Tech Lead/QA review |
| High | Đổi workflow chính, data model, security hoặc MVP scope | Change request chính thức và approval |
| Critical | Ảnh hưởng release, security major, deployment hoặc timeline lớn | Escalate Product Owner và key stakeholders |

## Mẫu Change Request Record

| Change ID | Title | Requester | Date | Priority | Impact | Decision | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CR-XXX | [Tiêu đề thay đổi] | [Requester] | [YYYY-MM-DD] | [Priority] | [Impact] | [Decision] | Draft | [Owner] |

## Example Change Request

| Field | Example |
| --- | --- |
| Change ID | CR-INV-001 |
| Title | Chuyển Teacher invitation từ email tự động sang manual copy link |
| Requester | Product Owner / User |
| Business Reason | Không muốn phụ thuộc Gmail/Email provider trong MVP |
| Current Behavior | System tự gửi invitation email |
| Proposed Behavior | System tạo link, Admin copy và gửi thủ công qua email/Zalo/Facebook/Teams |
| Affected Scope | Process, Requirements, Data, API, Test Scenarios, Business Rules |
| Impact | Medium |
| Decision | Approved |
| Follow-up | Cập nhật BA docs và nâng document version |

## Documentation Update Rules

Khi change được approve, BA cần kiểm tra và cập nhật nếu liên quan:

| Artifact | Khi nào cần cập nhật |
| --- | --- |
| Product Vision | Change ảnh hưởng định hướng sản phẩm hoặc MVP vision |
| Scope Docs | Change ảnh hưởng in-scope/out-of-scope/baseline |
| Requirements | Change thêm/sửa/xóa requirement |
| User Stories | Change ảnh hưởng role hoặc user goal |
| Use Cases | Change ảnh hưởng workflow |
| Data Requirements | Change ảnh hưởng entity, field, validation |
| API Requirements | Change ảnh hưởng endpoint/request/response/error |
| UI/UX Requirements | Change ảnh hưởng screen hoặc user flow |
| Business Rules | Change ảnh hưởng rule vận hành |
| Test Scenarios | Change ảnh hưởng expected behavior |
| Traceability Matrix | Change cần trace sang requirement/test |
| Revision History | Change đáng kể cần ghi version |

## Change Control SLA Đề Xuất

| Change Type | Thời gian phản hồi đề xuất |
| --- | --- |
| Low impact | 1-2 ngày làm việc |
| Medium impact | 2-3 ngày làm việc |
| High impact | 3-5 ngày làm việc |
| Critical | Trong vòng 24 giờ |

## Escalation Rules

- Nếu change bị pending quá SLA, BA escalates đến Product Owner.
- Nếu change có technical blocker, Technical Lead phải đưa ra recommendation.
- Nếu change ảnh hưởng UAT hoặc release, QA Lead phải tham gia decision.
- Nếu change ảnh hưởng deployment, DevOps phải xác nhận.
- Nếu change ảnh hưởng security/privacy, Security Reviewer phải review trước approval.

## Change Control Risks

| Risk | Tác động | Mitigation |
| --- | --- | --- |
| Scope creep | MVP trễ và mất trọng tâm | MoSCoW priority và PO approval |
| Change không ghi nhận | Requirement/code/test lệch nhau | Change log và revision history |
| Technical impact bị đánh giá thấp | Rework API/data/deployment | Tech Lead review bắt buộc |
| QA không được thông báo | Test thiếu coverage | QA Lead consulted cho change ảnh hưởng behavior |
| Stakeholder bypass process | Quyết định không trace được | Communication plan và decision log |

## Kết Luận

Change Control là cơ chế bảo vệ scope baseline. Với dự án này, mọi thay đổi liên quan đến Teacher invitation, Classroom, Join Flow, Classwork, Submission, Grading, Progress, Admin Governance, API, Data Model, RBAC, AuditLog, Docker/CI-CD hoặc Cloud deployment đều cần được phân tích impact rõ ràng trước khi đưa vào delivery.
