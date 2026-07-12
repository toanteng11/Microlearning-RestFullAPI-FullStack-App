# Requirement Management Plan

## Mục Đích

Tài liệu này mô tả cách requirement của dự án **Microlearning Classroom LMS Platform** được ghi nhận, phân tích, ưu tiên, review, phê duyệt, thay đổi và trace trong suốt vòng đời dự án.

## Requirement Types

| Loại | Prefix | Ví dụ |
| --- | --- | --- |
| Business Requirement | BRQ | BRQ-005 Student phải thấy việc cần làm |
| Functional Requirement | FR | FR-049 Student Dashboard hiển thị To-do |
| Non-Functional Requirement | NFR | NFR-SEC-001 Password phải hash |
| User Story | US | US-STU-009 Student xem To-do |
| Use Case | UC | UC-041 Xem Student To-do |
| Acceptance Criteria | AC | AC-TEA-013 Progress ranking sort cao xuống thấp |
| Test Scenario | TS | TS-017 Teacher xem Student Progress Ranking |

## Requirement Lifecycle

| Bước | Mô tả | Owner |
| --- | --- | --- |
| 1. Capture | Ghi nhận yêu cầu từ user, stakeholder, tài liệu tham khảo hoặc phát hiện BA | Business Analyst |
| 2. Clarify | Làm rõ actor, pain point, business value, workflow và edge cases | BA, Product Owner |
| 3. Classify | Phân loại BRQ/FR/NFR/UI/API/Data/DevOps | Business Analyst |
| 4. Prioritize | Gán Must/Should/Could/Won't | Product Owner, BA |
| 5. Detail | Viết acceptance criteria, rules, data/API/UI impact | Business Analyst |
| 6. Review | Review với PO, Tech Lead, QA, UX, DevOps nếu liên quan | Cross-functional |
| 7. Approve | Đưa vào baseline hoặc backlog | Product Owner |
| 8. Implement | Developer triển khai theo requirement | Developers |
| 9. Verify | QA test theo scenarios/UAT | QA Lead |
| 10. Maintain | Cập nhật khi scope thay đổi | Business Analyst |

## Requirement Status

| Status | Ý nghĩa |
| --- | --- |
| Draft | Đang soạn, chưa sẵn sàng implement |
| In Review | Đã đủ nội dung để stakeholder review |
| Approved | Được chấp nhận làm baseline/backlog |
| In Development | Đang được implement |
| Ready For Test | Developer đã xong, chờ QA verify |
| Accepted | QA/UAT pass |
| Deferred | Tạm hoãn sang release sau |
| Rejected | Không làm hoặc không phù hợp scope |
| Changed | Đã bị thay đổi bởi change request |

## Priority Management

| Priority | Rule |
| --- | --- |
| Must | Bắt buộc cho workflow chính hoặc security/governance |
| Should | Quan trọng nhưng có thể giảm scope nếu cần |
| Could | Optional/Post-MVP |
| Won't | Không thuộc MVP/đồ án hiện tại |

Nếu một feature ảnh hưởng trực tiếp đến vòng đời:

```text
Teacher tạo nội dung -> Student học/nộp bài -> System ghi progress -> Teacher xem dashboard -> Admin governance
```

thì feature đó thường là `Must`.

## Change Control

Mọi thay đổi requirement cần ghi nhận nếu ảnh hưởng đến:

- Scope MVP.
- User role/permission.
- Data model.
- API contract.
- UI flow.
- Test scenarios/UAT.
- Security/privacy.
- DevOps/deployment.
- Timeline hoặc release.

Thay đổi cần cập nhật tối thiểu:

- File requirement liên quan.
- Revision history.
- Business rules nếu có.
- User stories/use cases nếu có.
- Acceptance criteria/test scenarios nếu có.
- API/data/UI docs nếu bị ảnh hưởng.
- Traceability nếu là requirement quan trọng.

## Traceability Rules

Mỗi requirement Must nên trace được theo chuỗi:

```text
Business Requirement
        ↓
Functional Requirement
        ↓
User Story / Use Case
        ↓
API / Data / UI
        ↓
Test Scenario / Acceptance Criteria
        ↓
Release
```

Ví dụ:

```text
BRQ-TCH-PROGRESS-RANKING
        ↓
FR-061
        ↓
US-TCH-020 / UC-045
        ↓
Teacher Course Dashboard API / CourseProgressSummary / `../12-ui-ux-requirements/teacher-course-dashboard.md`
        ↓
TS-017
        ↓
MVP
```

## Review Responsibilities

| Role | Review focus |
| --- | --- |
| Product Owner | Business value, priority, MVP scope |
| Business Analyst | Completeness, clarity, traceability, consistency |
| Technical Lead | Feasibility, architecture, API/data impact |
| Frontend Developer | UI flow, state, responsive behavior |
| Backend Developer | API, validation, authorization, data model |
| QA Lead | Testability, edge cases, acceptance criteria |
| UX Designer | Usability, navigation, empty/loading/error states |
| DevOps Engineer | Deployment, environment, CI/CD, monitoring impact |
| Security Reviewer | RBAC, token, password, data access |

## Baseline Requirement Package

Requirement baseline cho MVP gồm:

- Business requirements rõ.
- Functional requirements đầy đủ.
- Role-based requirements cho Student, Teacher, Admin.
- Business rules.
- Scope baseline.
- API endpoint catalog.
- Data entities và dictionary.
- UI/UX requirements.
- Acceptance criteria và test scenarios.
- Traceability.

## Requirement Risk Controls

| Rủi ro | Cách kiểm soát |
| --- | --- |
| Requirement mơ hồ | Bắt buộc có acceptance criteria |
| Thiếu chức năng nhỏ | Có UI/UX checklist cho navigation, empty state, To-do |
| API không khớp frontend | Review API contract trước development |
| Data model thiếu field | Review data dictionary khi thêm requirement |
| Scope phình to | Dùng MoSCoW và release recommendation |
| Security thiếu kiểm soát | Review RBAC/object-level access control |
| QA khó test | Requirement phải testable và có scenario |
