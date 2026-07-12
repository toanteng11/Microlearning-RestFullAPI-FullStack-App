# Scope Baseline

## Mục Đích

Tài liệu này xác định **scope baseline** cho dự án **Microlearning Classroom LMS Platform**. Scope baseline là phiên bản phạm vi được thống nhất tại thời điểm hiện tại để phục vụ planning, backlog, development, QA, UAT, deployment và change control.

Khi scope baseline đã được Product Owner phê duyệt, mọi thay đổi ảnh hưởng đến MVP, timeline, architecture, API, data model, UAT hoặc deployment phải đi qua quy trình trong `../04-scope/change-control.md`.

## Baseline Status

| Trường | Giá trị |
| --- | --- |
| Baseline Name | MVP Scope Baseline - Microlearning Classroom LMS Platform |
| Baseline Version | Draft 1.2 |
| Linked BA Document Version | 1.38 |
| Baseline Status | Draft |
| Prepared By | Business Analyst |
| Reviewers | Product Owner, Technical Lead, QA Lead, DevOps Engineer |
| Approval Owner | Product Owner |

## Scope Baseline Statement

MVP của dự án là một web-based Microlearning Classroom LMS Platform cho phép Admin quản trị user/role/invitation/policy/report/audit, Teacher tạo Classroom và Classwork, Student tham gia Classroom bằng Class Code/Invite Link, học Micro Lesson, làm Quiz, nộp Assignment, nhận Grade/Feedback và theo dõi Progress. Hệ thống được xây dựng bằng ReactJS, Node.js/ExpressJS, MongoDB, có RESTful API, Swagger/OpenAPI, Docker, CI/CD và định hướng Cloud deployment.

## Baseline Objectives

| ID | Objective | Success Evidence |
| --- | --- | --- |
| SBO-001 | Hoàn thành workflow Teacher onboarding bằng manual invitation link | Admin tạo/copy link; Teacher accept link và account active |
| SBO-002 | Hoàn thành workflow Classroom creation và joining | Teacher tạo Classroom; Student join bằng Code/Link |
| SBO-003 | Hoàn thành workflow microlearning content | Teacher tạo Module, Lesson, Flashcard, Quiz, Assignment |
| SBO-004 | Hoàn thành workflow learning và assessment | Student học, làm Quiz, nộp Assignment |
| SBO-005 | Hoàn thành workflow grading và feedback | Teacher chấm điểm, return work; Student xem Grade/Feedback |
| SBO-006 | Hoàn thành progress tracking | Student và Teacher xem được progress phù hợp |
| SBO-007 | Hoàn thành Admin governance cơ bản | Admin quản lý user, role, policy, report và audit log |
| SBO-008 | Hoàn thành technical foundation | API documented, Dockerized, CI/CD và Cloud deployment foundation |

## MVP Functional Baseline

| ID | Scope Item | Description | Priority | Baseline Status |
| --- | --- | --- | --- | --- |
| MVP-F-001 | Authentication | Login, logout, access/refresh token, account status và password hashing | Must | Included |
| MVP-F-001A | Student Registration | Guest tự đăng ký account chỉ với role `STUDENT`; đăng ký thành công chuyển đến Login và không tự tạo session hoặc Enrollment | Must | Included |
| MVP-F-002 | RBAC | Role Student, Teacher, Admin, Super Admin | Must | Included |
| MVP-F-003 | Teacher Invitation | Admin tạo/copy manual invitation link; Teacher accept và tạo password | Must | Included |
| MVP-F-004 | User Management | Admin quản lý account và account status | Must | Included |
| MVP-F-005 | Classroom Management | Teacher tạo, cập nhật, archive Classroom | Must | Included |
| MVP-F-006 | Join Mechanisms | Student join bằng Class Code hoặc Invite Link | Must | Included |
| MVP-F-007 | Roster Management | Teacher xem và quản lý Student trong Classroom | Must | Included |
| MVP-F-008 | Class Stream | Teacher đăng Announcement cơ bản | Must | Included |
| MVP-F-009 | Module / Topic | Teacher tổ chức nội dung theo Module/Topic | Must | Included |
| MVP-F-010 | Micro Lesson | Teacher tạo Lesson; Student học Lesson | Must | Included |
| MVP-F-011 | Flashcard | Teacher tạo Flashcard; Student học Flashcard | Must | Included |
| MVP-F-012 | Quiz | Teacher tạo Quiz; Student làm Quiz; system ghi score | Must | Included |
| MVP-F-013 | Assignment | Teacher tạo Assignment; Student nộp Submission | Must | Included |
| MVP-F-014 | Grading / Feedback | Teacher chấm điểm và feedback; Student xem kết quả | Must | Included |
| MVP-F-015 | Progress Tracking | Student/Teacher xem progress | Must | Included |
| MVP-F-016 | Admin Reports | Admin xem dashboard/report cơ bản | Must | Included |
| MVP-F-017 | AuditLog | System ghi log hành động quan trọng | Must | Included |
| MVP-F-018 | System Settings Basic | Enrollment policy và một số setting cơ bản | Must | Included |
| MVP-F-019 | Resource Management Basic | PDF/video/image/link/resource cơ bản | Should | Deferred to REL1.1 |
| MVP-F-020 | Gradebook Basic | Bảng điểm cơ bản | Should | Deferred to REL1.1 |
| MVP-F-021 | Deadline Calendar Basic | Calendar view deadline; due date của Lesson/Quiz/Assignment vẫn là Must trong workflow core | Should | Deferred to REL1.1 |

## MVP Technical Baseline

| ID | Technical Scope | Description | Priority | Baseline Status |
| --- | --- | --- | --- | --- |
| MVP-T-001 | ReactJS Frontend | Web app cho Student, Teacher, Admin | Must | Included |
| MVP-T-002 | Node.js/ExpressJS Backend | RESTful API backend | Must | Included |
| MVP-T-003 | MongoDB | Database chính | Must | Included |
| MVP-T-004 | Swagger/OpenAPI | Document API MVP | Must | Included |
| MVP-T-005 | Error Response Standard | Chuẩn lỗi API | Must | Included |
| MVP-T-006 | JWT/Session Auth | Authentication foundation | Must | Included |
| MVP-T-007 | Password Hashing | Secure password storage | Must | Included |
| MVP-T-008 | Token Hashing | Invitation token hash only | Must | Included |
| MVP-T-009 | Docker / Docker Compose | Local/dev setup và deployment foundation | Must | Included |
| MVP-T-010 | CI/CD Basic | Build/test/deploy pipeline cơ bản | Must | Included |
| MVP-T-011 | Cloud Deployment | Staging/demo cloud deployment | Must | Included |
| MVP-T-012 | Logging / Monitoring Foundation | Health check, logs, audit | Must | Included |

## Baseline Exclusions

| ID | Exclusion | Reason |
| --- | --- | --- |
| EXC-001 | Native mobile app | Web application là scope chính |
| EXC-002 | Payment / marketplace | Không phù hợp LMS nội bộ MVP |
| EXC-003 | Full Google Workspace integration | Chỉ tham khảo Google Classroom workflow |
| EXC-004 | Gmail/API auto email invitation bắt buộc | Teacher invitation dùng manual copy link |
| EXC-005 | SIS integration | Phụ thuộc hệ thống ngoài |
| EXC-006 | AI recommendation / AI grading | Post-MVP |
| EXC-007 | Guardian management | Không phải đối tượng chính |
| EXC-008 | Live video integration sâu | Không phải core MVP |
| EXC-009 | Multi-tenant billing | Không thuộc mô hình nội bộ |
| EXC-010 | Advanced plagiarism/originality report | Cần provider hoặc engine riêng |
| EXC-011 | QR Code Join | Loại khỏi phạm vi để giảm UI/API/data/test/dependency; Student dùng Class Code hoặc Invite Link |

## Baseline Deliverables

| Deliverable | Mô tả | Owner |
| --- | --- | --- |
| BA Documentation | Bộ tài liệu trong `business-analysis/` | BA |
| Functional Requirements | Requirements theo role và module | BA / PO |
| User Stories | Student, Teacher, Admin stories | BA / PO |
| Use Cases | Use case catalog và use case docs | BA |
| Data Model | MongoDB entities và data dictionary | Tech Lead / BA |
| API Catalog | RESTful API requirements và Swagger/OpenAPI | Tech Lead / Backend |
| UI/UX Requirements | Frontend pages, flows, wireframe index | BA / UX |
| Test Scenarios | Acceptance criteria, UAT, test scenarios | QA |
| Docker Strategy | Docker/Docker Compose docs | DevOps |
| CI/CD Pipeline | Pipeline definition | DevOps |
| Cloud Deployment Plan | Deployment environment và cloud overview | DevOps |

## Baseline Acceptance Criteria

| ID | Acceptance Criteria |
| --- | --- |
| BAC-001 | Admin tạo Teacher invitation link và copy link được. |
| BAC-002 | Teacher mở invitation link hợp lệ, tạo password và account active với role `TEACHER`. |
| BAC-003 | Guest đăng ký được account `STUDENT`; sau khi login với account `ACTIVE`, Student join Classroom bằng Class Code hoặc Invite Link theo enrollment policy. |
| BAC-004 | Teacher tạo Classroom và ít nhất một Module, Lesson, Quiz và Assignment. |
| BAC-005 | Student xem Classwork, học Lesson, làm Quiz và nộp Assignment. |
| BAC-006 | Teacher xem Submission, chấm điểm và gửi Feedback. |
| BAC-007 | Student xem được Progress, Grade và Feedback. |
| BAC-008 | Teacher xem được progress từng Student trong Classroom. |
| BAC-009 | Admin quản lý user, role/account status và xem report/audit log cơ bản. |
| BAC-010 | Swagger/OpenAPI có đủ endpoint thuộc MVP. |
| BAC-011 | Docker Compose chạy được hệ thống local. |
| BAC-012 | CI/CD pipeline build/test/deploy được môi trường staging/demo. |

## Baseline Traceability

| Baseline Area | Trace To |
| --- | --- |
| Product Vision | `../02-product-vision/product-vision.md` |
| Target Users | `../02-product-vision/target-users.md` |
| Stakeholders | `../03-stakeholders/stakeholder-register.md` |
| In Scope | `in-scope.md` |
| Out Of Scope | `out-of-scope.md` |
| Functional Requirements | `../07-requirements/functional-requirements.md` |
| Feature Priority | `../07-requirements/feature-priority.md` |
| User Stories | `08-user-stories/` |
| Use Cases | `09-use-cases/` |
| Data Requirements | `10-data-requirements/` |
| API Requirements | `11-api-requirements/` |
| UI/UX | `12-ui-ux-requirements/` |
| DevOps | `15-devops-deployment/` |
| UAT / Acceptance | `18-acceptance-criteria/` |

## Baseline Change Rules

- Any new **Must-have feature** requires Product Owner approval.
- Any change affecting API contract requires Technical Lead review.
- Any change affecting data model requires Technical Lead and QA review.
- Any change affecting UAT scope requires QA Lead review.
- Any change affecting Docker, CI/CD or Cloud deployment requires DevOps review.
- Any change affecting role, permission, invitation token, password or audit log requires Security/Privacy review.
- Any change affecting MVP timeline must be logged in change control.

## Kết Luận

Scope baseline hiện tại xác định một MVP có phạm vi rõ ràng, đủ để chứng minh giá trị sản phẩm và năng lực kỹ thuật. Baseline tập trung vào:

```text
Teacher invitation manual link
Classroom management
Student join
Microlearning content
Quiz / Assignment / Submission
Grading / Feedback
Progress tracking
Admin governance
RESTful API / Swagger
Docker / CI/CD / Cloud
```

Các tính năng ngoài baseline phải được quản lý bằng change control để tránh scope creep.
