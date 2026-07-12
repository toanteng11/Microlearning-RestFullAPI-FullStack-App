# Use Case Catalog

## Mục Đích

Tài liệu này là danh mục use case chính thức của hệ thống **Microlearning Classroom LMS Platform**. Catalog này dùng để trace từ Business Requirements, Functional Requirements và User Stories sang Use Case, API, UI và Test Scenarios.

## Quy Ước ID

| Khoảng ID | Nhóm |
| --- | --- |
| UC-001 đến UC-010 | Auth, Classroom join và Student learning core |
| UC-011 đến UC-024 | Teacher content, assessment và Classroom operation |
| UC-025 đến UC-040 | Admin operation và governance |
| UC-041 đến UC-046 | Student To-do, navigation và Teacher Course Dashboard |
| UC-047 đến UC-052 | Auth/access bổ sung |
| UC-053 đến UC-059 | Student learning chi tiết |
| UC-060 đến UC-064 | Teacher detail flows bổ sung |
| UC-065 đến UC-071 | Admin role-specific user lists và governance chi tiết |
| UC-072 đến UC-079 | Technical, API, DevOps và deployment |

## Use Case Catalog Table

| ID | Use Case | Actor chính | Priority | Related FR | Related User Stories | Web Screen / Route Gợi Ý |
| --- | --- | --- | --- | --- | --- | --- |
| UC-001 | Đăng ký Student Account | Guest/Student | Must | FR-002 | US-AUTH-008, US-AUTH-009, US-AUTH-010, US-STU-001 | `/register` |
| UC-002 | Login | User | Must | FR-001, FR-004, FR-005 | US-AUTH-001, US-AUTH-002, US-STU-001 | `/login` |
| UC-003 | Tạo Classroom | Teacher | Must | FR-020 | US-TCH-001 | `/teacher/classrooms/new` |
| UC-004 | Generate / Regenerate Class Code | Teacher | Must | FR-021, FR-025 | US-TCH-002, US-TCH-031 | `/teacher/classrooms/:id/settings` |
| UC-005 | Generate Invite Link | Teacher | Must | FR-022, FR-025 | US-TCH-003, US-TCH-032 | `/teacher/classrooms/:id/settings` |
| UC-006 | Join Classroom bằng Class Code | Student | Must | FR-021, FR-023 | US-STU-002 | `/join/code` |
| UC-007 | Join Classroom bằng Invite Link | Student | Must | FR-022, FR-023 | US-STU-003 | `/join/invite/:token` |
| UC-009 | Hoàn thành Lesson | Student | Must | FR-052, FR-059 | US-STU-006, US-STU-030 | `/student/lessons/:lessonId` |
| UC-010 | Làm Quiz | Student | Must | FR-036 đến FR-040 | US-STU-007, US-STU-036 đến US-STU-042 | `/student/quizzes/:quizId` |
| UC-011 | Tạo Course | Teacher | Must | FR-026 | US-TCH-005 | `/teacher/classrooms/:id/courses/new` |
| UC-012 | Quản lý Lessons | Teacher | Must | FR-029, FR-033, FR-034 | US-TCH-006, US-TCH-049 đến US-TCH-051 | `/teacher/courses/:courseId/lessons` |
| UC-013 | Xem Classroom Progress | Teacher | Should | FR-060 | US-TCH-016, US-TCH-072 | `/teacher/classrooms/:id/progress` |
| UC-014 | Quản lý Users Tổng Quan | Admin | Must | FR-009 | US-ADM-001 | `/admin/users` |
| UC-015 | Xem Reports | Admin | Must | FR-016 | US-ADM-003, US-ADM-056 đến US-ADM-060 | `/admin/reports` |
| UC-016 | Xem Swagger API Documentation | Developer/QA | Must | FR-067 | US-TECH-006 đến US-TECH-010 | `/api-docs` |
| UC-017 | Tạo Module / Topic | Teacher | Must | FR-028 | US-TCH-010, US-TCH-048 | `/teacher/courses/:courseId/modules` |
| UC-018 | Tạo Flashcard | Teacher | Must | FR-031 | US-TCH-011, US-TCH-054 | `/teacher/lessons/:lessonId/flashcards` |
| UC-019 | Tạo Assignment | Teacher | Must | FR-042 | US-TCH-012, US-TCH-066, US-TCH-067 | `/teacher/courses/:courseId/assignments/new` |
| UC-020 | Đăng Announcement | Teacher | Must | FR-035 | US-TCH-015, US-TCH-038 đến US-TCH-040 | `/teacher/classrooms/:id/stream` |
| UC-021 | Xem Submission Status | Teacher | Must | FR-045 | US-TCH-013, US-TCH-068, US-TCH-069 | `/teacher/assignments/:assignmentId/submissions` |
| UC-022 | Chấm điểm và gửi Feedback | Teacher | Must | FR-046, FR-047, FR-048 | US-TCH-014, US-TCH-070, US-TCH-071 | `/teacher/submissions/:submissionId` |
| UC-023 | Xem Teacher Progress Dashboard | Teacher | Must | FR-060 | US-TCH-016 | `/teacher/progress` |
| UC-024 | Quản lý Classroom Settings | Teacher | Must | FR-025 | US-TCH-017, US-TCH-033 | `/teacher/classrooms/:id/settings` |
| UC-025 | Xem Admin Dashboard | Admin | Must | FR-016 | US-ADM-003, US-ADM-018 đến US-ADM-020 | `/admin/dashboard` |
| UC-026 | Quản lý Teacher Account | Admin | Must | FR-009B | US-ADM-001B, US-ADM-035, US-ADM-036 | `/admin/users/teachers` |
| UC-027 | Tạo Và Copy Teacher Invitation Link | Admin | Must | FR-006, FR-007, FR-008 | US-ADM-005, US-ADM-031 đến US-ADM-034 | `/admin/teacher-invitations` |
| UC-028 | Quản lý Student Account | Admin | Must | FR-009A | US-ADM-001A, US-ADM-025 đến US-ADM-030 | `/admin/users/students` |
| UC-029 | Khóa / Mở Khóa Account | Admin | Must | FR-004, FR-009 | US-ADM-008, US-ADM-042 đến US-ADM-044 | `/admin/users/:userId` |
| UC-030 | Quản lý Role Và Permission | Admin/Super Admin | Must | FR-010 | US-ADM-002, US-ADM-037 đến US-ADM-041 | `/admin/roles` |
| UC-031 | Quản lý Enrollment Policy | Admin | Must | FR-011 | US-ADM-009, US-ADM-045 đến US-ADM-049 | `/admin/settings/enrollment` |
| UC-032 | Xem Tất Cả Classroom / Course | Admin | Must | FR-012 | US-ADM-010, US-ADM-050 | `/admin/classrooms` |
| UC-033 | Chuyển Classroom Ownership | Admin | Should | FR-013 | US-ADM-011, US-ADM-065 | `/admin/classrooms/:id/ownership` |
| UC-034 | Cấu Hình File Upload Policy | Admin | Should | FR-014 | US-ADM-012 | `/admin/settings/files` |
| UC-035 | Cấu Hình Notification | Admin | Should | FR-015 | US-ADM-013 | `/admin/settings/notifications` |
| UC-036 | Xem Usage Reports | Admin | Must | FR-016 | US-ADM-056 đến US-ADM-060 | `/admin/reports/usage` |
| UC-037 | Xem Audit Log | Admin | Must | FR-017, FR-069 | US-ADM-014, US-ADM-061 đến US-ADM-064 | `/admin/audit-logs` |
| UC-038 | Export Reports / Audit Log | Admin | Should | FR-018 | US-ADM-015 | `/admin/reports`, `/admin/audit-logs` |
| UC-039 | Quản Lý System Configuration | Super Admin | Must | FR-019 | US-ADM-016, US-ADM-054, US-ADM-055 | `/admin/system-settings` |
| UC-040 | Offboarding Teacher | Admin | Should | FR-013 | US-ADM-017, US-ADM-067, US-ADM-068 | `/admin/users/teachers/:id/offboarding` |
| UC-041 | Xem Student To-do / Việc Cần Làm | Student | Must | FR-049, FR-050 | US-STU-009, US-STU-019 đến US-STU-024 | `/student/dashboard`, `/student/todo` |
| UC-042 | Mở Learning Activity Từ To-do | Student | Must | FR-050, FR-057 | US-STU-010 | `/student/todo/:todoItemId` |
| UC-043 | Điều Hướng Back / Previous / Next Trong Learning Flow | Student | Must | FR-057 | US-STU-011, US-STU-058, US-STU-059 | Lesson/Quiz/Assignment pages |
| UC-044 | Xem Teacher Course Detail Dashboard | Teacher | Must | FR-027 | US-TCH-019, US-TCH-044 đến US-TCH-046 | `/teacher/courses/:courseId/dashboard` |
| UC-045 | Xem Student Progress Ranking Trong Course | Teacher | Must | FR-061, FR-063 | US-TCH-020, US-TCH-047, US-TCH-073 | `/teacher/courses/:courseId/progress` |
| UC-046 | Đặt Deadline Hoàn Thành Cho Từng Lesson | Teacher | Must | FR-030 | US-TCH-021, US-TCH-052, US-TCH-053 | Lesson/Activity editor |
| UC-047 | Logout | User | Must | FR-001 | US-AUTH-005 | Header/Profile menu |
| UC-048 | Forgot / Reset Password | User | Should | FR-003 | US-AUTH-011 đến US-AUTH-014 | `/forgot-password`, `/reset-password` |
| UC-049 | View / Update Profile | User | Should | FR-005 | US-AUTH-015, US-AUTH-016 | `/profile` |
| UC-050 | Route Authorization Guard | System/User | Must | FR-005 | US-AUTH-006, US-AUTH-007 | All protected routes |
| UC-051 | Accept Teacher Invitation | Teacher | Must | FR-007 | US-TCH-INV-001 đến US-TCH-INV-004 | `/teacher/invite?token=...` |
| UC-052 | Open Public Join Link Before Login | Guest/Student | Must | FR-022, FR-023 | US-AUTH-020 | `/join/invite/:token` |
| UC-053 | Xem Classroom Detail Và Classwork | Student | Must | FR-051 | US-STU-025 đến US-STU-029 | `/student/classrooms/:id` |
| UC-054 | Học Flashcard | Student | Must | FR-053 | US-STU-033 | `/student/lessons/:lessonId/flashcards` |
| UC-055 | Mở Learning Resource | Student | Should | FR-032, FR-068 | US-STU-034, US-STU-035 | Resource viewer |
| UC-056 | Nộp Assignment | Student | Must | FR-043, FR-044 | US-STU-043 đến US-STU-049 | `/student/assignments/:assignmentId` |
| UC-057 | Xem Grade Và Feedback | Student | Must | FR-055 | US-STU-050, US-STU-052 đến US-STU-054 | `/student/grades` |
| UC-058 | Xem Learning Progress | Student | Must | FR-054, FR-059 | US-STU-008, US-STU-051 | `/student/progress` |
| UC-059 | Xem Learning Calendar / Deadline View | Student | Should | FR-056 | US-STU-055 | `/student/calendar` |
| UC-060 | Preview Content As Student | Teacher | Should | FR-034 | US-TCH-050, US-TCH-063 | Preview mode |
| UC-061 | Quản lý Quiz Question Và Question Media | Teacher | Should | FR-037, FR-038 | US-TCH-059 đến US-TCH-063 | Quiz builder |
| UC-062 | Xem Quiz Result Và Performance | Teacher | Must | FR-041 | US-TCH-065 | `/teacher/quizzes/:quizId/results` |
| UC-063 | Quản lý Gradebook Basic | Teacher | Should | FR-062 | US-TCH-074, US-TCH-075 | `/teacher/gradebook` |
| UC-064 | Search / Filter / Pagination Cho Teacher Tables | Teacher | Must | FR-064 | US-TCH-078 | Roster, submissions, progress |
| UC-065 | Xem Student List | Admin | Must | FR-009A | US-ADM-001A | `/admin/users/students` |
| UC-066 | Xem Teacher List | Admin | Must | FR-009B | US-ADM-001B | `/admin/users/teachers` |
| UC-067 | Xem Admin List | Admin/Super Admin | Must | FR-009C | US-ADM-001C | `/admin/users/admins` |
| UC-068 | Advanced User Search | Admin | Should | FR-009, FR-064 | US-ADM-021 | `/admin/users/search` |
| UC-069 | Lock Enrollment Classroom | Admin | Should | FR-011, FR-012 | US-ADM-053 | `/admin/classrooms/:id` |
| UC-070 | Review Published Content Governance | Admin | Should | FR-012 | US-ADM-004 | `/admin/classrooms/:id/content` |
| UC-071 | Admin Dangerous Action Confirmation | Admin | Must | FR-004, FR-010, FR-013, FR-069 | US-ADM-071, US-ADM-072 | Admin modals/actions |
| UC-072 | Chuẩn hóa RESTful API Và Error Response | Developer/QA | Must | FR-065, FR-066 | US-TECH-001 đến US-TECH-005 | API layer |
| UC-073 | Server-side Pagination / Filter / Sort | Developer/QA | Must | FR-064 | US-TECH-004 | List APIs |
| UC-074 | Docker Compose Local Runtime | Developer/DevOps | Must | FR-071, FR-073 | US-DEVOPS-001 đến US-DEVOPS-003 | Local environment |
| UC-075 | CI/CD Và Cloud Deployment | DevOps Engineer | Must | FR-072, FR-073 | US-DEVOPS-004 đến US-DEVOPS-006 | Pipeline/Cloud |
| UC-076 | Health Check Và Monitoring | DevOps Engineer/Admin | Must | FR-070, FR-074 | US-DEVOPS-007 đến US-DEVOPS-009 | `/health`, monitoring |
| UC-077 | Backup MongoDB | DevOps Engineer | Must | FR-075 | US-DEVOPS-010 | Backup process |
| UC-078 | Rollback Deployment | DevOps Engineer | Must | FR-075 | US-DEVOPS-011, US-DEVOPS-012 | Deployment process |
| UC-079 | Audit Important Actions | System/Admin | Must | FR-069 | US-ADM-041, US-ADM-049, US-ADM-061 | Audit service |

## Ghi Chú

- Các use case từ `UC-001` đến `UC-046` được giữ lại để không phá traceability đã có.
- Các use case mới từ `UC-047` trở đi bổ sung những chức năng nhỏ nhưng cần thiết cho web application chuyên nghiệp.
- Một số use case kỹ thuật không có actor nghiệp vụ trực tiếp, nhưng vẫn cần vì dự án có RESTful API, Swagger/OpenAPI, Docker, CI/CD và Cloud deployment.
