# Requirement Traceability Matrix

## Mục Đích

RTM map toàn bộ Business Requirements `BRQ-001` đến `BRQ-025` tới Functional Requirements, User Stories/Use Cases, Business Rules, Acceptance/Test, thiết kế và release. Matrix là baseline để review coverage và impact; trạng thái `Pending Implementation Evidence` chỉ ra evidence code/CI/UAT sẽ được gắn khi delivery bắt đầu.

## Cách Đọc Matrix

- `FR`, `US`, `UC`, `BR`, `AC`, `TS` là ID/link chính; các range dùng khi nhóm artifact cùng phục vụ một business capability.
- `Design Impact` trỏ đến package UI/API/Data/Architecture/DevOps cần review, không thay thế detailed design document.
- `Coverage` mô tả BA baseline. Nó không khẳng định code/test runtime đã hoàn thành.

## RTM

| BRQ | Functional Requirement | User Story / Use Case | Business Rule | Acceptance / Test | Design Impact | Release | Coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BRQ-001 Internal Classroom LMS | FR-020 đến FR-025 | US-TCH-001 đến 003; US-STU-002/003; UC-003 đến UC-007 | BR-002, BR-016, BR-050 đến 057 | AC-JOIN-001 đến 003; TS-003 đến 006, TS-024/025 | Classroom/Enrollment API, MongoDB Enrollment, Student/Teacher Classroom UI | MVP | Covered; implementation evidence pending |
| BRQ-002 Microlearning Content | FR-026, 028 đến 034, 031 đến 033 | US-TCH-005, 006, 010, 011; UC-011, 012, 017, 018 | BR-058 đến 068 | AC-CNT-001/002; TS-010, TS-026 | Course/Module/Lesson/Resource data, Content API, Teacher/Student UI | MVP | Covered; implementation evidence pending |
| BRQ-003 Teacher Content Ownership | FR-026 đến FR-038 | US-TCH-005 đến 015; UC-011, 012, 017 đến 020 | BR-004, BR-008, BR-039, BR-060 | AC-CNT-001/002; TS-026, TS-028 | RBAC/object authorization, Course/Content service, Teacher Workspace UI | MVP | Covered; implementation evidence pending |
| BRQ-004 Student Registration And Join Classroom | FR-001, FR-002, FR-021 đến FR-023 | US-STU-001 đến 003; US-AUTH-008 đến 010/020; UC-001/002/006/007/052 | BR-001/001A đến 001C, BR-002, BR-017 đến 019, BR-050 đến 057 | AC-AUTH-005/006, AC-JOIN-001 đến 003; TS-001/001A/001B/005/006/024/025 | Registration/Auth API, User data, Join API/token data, Class Code/Invite Link UI, Enrollment policy | MVP | Covered; implementation evidence pending |
| BRQ-005 Student To-do | FR-049, FR-050, FR-056, FR-057 | US-STU-009/010/011; UC-041 đến 043 | BR-029, BR-030, BR-070, BR-071 | AC-DASH-001; TS-012 đến 014 | Student Dashboard/To-do UI, StudentTodoItem/read model, Deadline API | MVP | Covered; implementation evidence pending |
| BRQ-006 Student Learning Flow | FR-039, FR-043, FR-052 đến 055, FR-059 | US-STU-006 đến 008, 033, 043 đến 054; UC-009, 010, 054, 056 đến 058 | BR-005 đến 007, BR-069 đến 074, BR-083 đến 095 | AC-LRN-001/002, AC-ASM-002 đến 006; TS-008/009/021 đến 023/027 | Lesson/Quiz/Assignment API, Progress/Submission/Grade data, Student UI | MVP | Covered; implementation evidence pending |
| BRQ-007 Teacher Course Dashboard | FR-027 | US-TCH-019; UC-044 | BR-033, BR-039, BR-074 | AC-DASH-002; TS-016 | Teacher Course Dashboard UI, Course/roster/activity API, summary read model | MVP | Covered; implementation evidence pending |
| BRQ-008 Progress Ranking | FR-060, FR-061, FR-063 | US-TCH-016, 020; UC-023, UC-045 | BR-034, BR-074, BR-081, BR-082 | AC-DASH-002; TS-011/017 | CourseProgressSummary, ranking API/index, reporting metric/UI | MVP | Covered; implementation evidence pending |
| BRQ-009 Lesson/Activity Deadline | FR-030, FR-056 | US-TCH-021; UC-046, UC-059 | BR-035, BR-061, BR-071, BR-075 đến 080 | AC-DLN-001 đến 003; TS-018 đến 020 | Deadline history, To-do/Calendar/read model, deadline API/UI | MVP | Covered; implementation evidence pending |
| BRQ-010 Quiz And Question Media | FR-036 đến FR-041 | US-TCH-007, 018; US-STU-007; UC-010, 061, 062 | BR-031, BR-032, BR-083 đến 088 | AC-ASM-001 đến 003; TS-009/015/032 | Quiz/Question/Media storage/API, Quiz Builder/Player UI | MVP / MVP Lite | Covered; implementation evidence pending |
| BRQ-011 Grading And Feedback | FR-045 đến FR-048, FR-055 | US-TCH-013/014; US-GC-TCH-004/005; UC-021, UC-022, UC-057 | BR-089 đến 096 | AC-ASM-004 đến 006; TS-021 đến 023; TS-GC-005 đến 010 | Submission/Grade/Feedback data/API, Gradebook/Student result UI, AuditLog | MVP | Covered; implementation evidence pending |
| BRQ-012 Learning Records | FR-059, FR-060, FR-063, FR-069 | US-STU-008; US-TCH-016; UC-009, 023, 045, 079 | BR-069 đến 074, BR-094 | AC-LRN-001/002, AC-DATA-001; TS-008/011/017/022/027 | LearningProgress/QuizAttempt/Submission/Grade, summary rebuild, reporting | MVP | Covered; implementation evidence pending |
| BRQ-013 Admin User Governance | FR-004, FR-005, FR-009, FR-009A/B/C, FR-010 | US-ADM-001, 001A/B/C, 002, 008; UC-014, 026, 028 đến 030, 065 đến 067 | BR-009, BR-020 đến 024, BR-036 đến 041, BR-098 đến 100 | AC-ADM-001/002, AC-AUTH-002 to 004; TS-028 to 030 | User/Role/Permission data, Admin lists/API, AuditLog, RBAC | MVP | Covered; implementation evidence pending |
| BRQ-014 Teacher Invitation | FR-006, FR-007, FR-008 | US-ADM-004/005; US-TCH-INV-001 đến 004; UC-027, UC-051 | BR-010 đến 014C, BR-042 đến 049 | AC-INV-001 đến 003; TS-INV-001 đến 020 | Invitation token model/API, Admin/Teacher activation UI, Audit/security | MVP | Covered; implementation evidence pending |
| BRQ-015 Manual Invitation Distribution | FR-006, FR-007, FR-008 | US-ADM-005, US-TCH-INV-*; UC-027 | BR-014A, BR-014C, BR-048 | AC-INV-001; TS-INV-002/011/016/020 | Manual-copy UI/API, no email provider dependency, operational guidance | MVP | Covered; implementation evidence pending |
| BRQ-016 Enrollment Policy | FR-011, FR-025 | US-ADM-007, 009; UC-024, UC-031, UC-069 | BR-017 đến 019, BR-051, BR-097, BR-104 | AC-JOIN-002; TS-024/025 | System settings/policy API, Classroom settings UI, Join service | MVP | Covered; implementation evidence pending |
| BRQ-017 Reports And Audit | FR-016, FR-017, FR-018, FR-069 | US-ADM-003, 014, 015, 056 đến 064; UC-015, 025, 036 đến 038, 079 | BR-101, BR-102, BR-105 đến 110 | AC-RPT-001/002, AC-SEC-001; TS-031/033 | Reporting/analytics, AuditLog, Export job/API/UI, monitoring | MVP | Covered; implementation evidence pending |
| BRQ-018 Data Retention Governance | FR-012, FR-013, FR-024, FR-069 | US-ADM-008, 011, 017; UC-032, 033, 040, 070 | BR-022, BR-041, BR-063, BR-099, BR-100 to 104 | AC-ADM-002, AC-DATA-001; TS-026/030/033 | Archive/soft-delete/ownership data, retention/privacy, backup/audit | MVP Lite | Covered; implementation evidence pending |
| BRQ-019 RESTful API And Swagger | FR-064 đến FR-067, FR-067A | US-TECH-001 đến 010; UC-016, 072, 073 | BR-036 to 040, BR-105 | AC-API-001 đến 003; API-AC-001 đến 009; TS-034/036 | `/api/v1`, OpenAPI JSON, Swagger UI `/api-docs`, error/pagination/auth/exposure contract | MVP | Covered; implementation evidence pending |
| BRQ-020 Classroom Workflow Reference | FR-035, FR-042 đến 048, FR-051, FR-055 | US-GC-TCH-001 đến 006; US-GC-STU-001 đến 005; UC-019 to 022, 053, 056, 057 | BR-058 to 068, BR-089 to 095 | TS-GC-001 đến 015 | Stream/Classwork/Submission/Grade UI/API; reference-only scope note | MVP | Covered; implementation evidence pending |
| BRQ-021 Access Control | FR-005, FR-064, FR-068 | US-AUTH-006/007; US-STU-012; US-TECH-005/012; UC-050, 055, 072 | BR-001 to 004, BR-036 to 040, BR-103, BR-105 | AC-AUTH-002 to 004, AC-SEC-002; TS-023/028/031/032 | RBAC/object auth middleware, media/report authorization, security logs | MVP | Covered; implementation evidence pending |
| BRQ-022 Navigation Controls | FR-057 | US-STU-011; UC-043 | BR-030, BR-062 | UI-STU-006; TS-013/014 | Navigation controls, route return context, unsaved-data guard | MVP | Covered; implementation evidence pending |
| BRQ-023 Resource And File Support | FR-032, FR-038, FR-068 | US-STU-034/035; US-TECH-011 to 013; UC-055, UC-061 | BR-025, BR-031/032, BR-065, BR-103 | AC-SEC-002; TS-015/032 | Object storage/media metadata, file policy/API, Resource/Media UI | Should / MVP Lite | Covered; implementation evidence pending |
| BRQ-024 DevOps Foundation | FR-071, FR-072, FR-073 | US-DEVOPS-001 to 006; UC-074, UC-075 | DevOps release/config rules | AC-OPS-001; DOP-AC-001 to 013; TS-035 | Docker/Compose, CI/CD, environment/secret, Cloud deployment | MVP | Covered; implementation evidence pending |
| BRQ-025 Monitoring Backup Rollback | FR-070, FR-074, FR-075 | US-DEVOPS-007 to 012; UC-076 to 078 | Reliability/audit/recovery rules | AC-OPS-002; DOP-AC-014 to 018; TS-035 | Health/version, logs/monitoring, backup/restore, rollback/runbook | MVP | Covered; implementation evidence pending |

## Coverage Summary

| Check | Result |
| --- | --- |
| BRQ rows | `BRQ-001` đến `BRQ-025` đều có matrix row. |
| Must business scope | Có FR, UC/US, BR khi applicable và AC/TS/quality link. |
| Technical/DevOps scope | Trace tới NFR/DevOps acceptance thay vì ép phải có end-user story. |
| Implementation/UAT evidence | Chờ code, CI, Staging/UAT execution và release records; theo dõi trong `traceability-gap-register.md`. |

## Maintenance Rule

Khi một BRQ/FR/BR/AC/TS đổi ID, scope, priority hoặc behavior, Business Analyst cập nhật row tương ứng trong cùng Change Request. Không thay đổi ID trong matrix bằng text tự do mà không cập nhật document nguồn.
