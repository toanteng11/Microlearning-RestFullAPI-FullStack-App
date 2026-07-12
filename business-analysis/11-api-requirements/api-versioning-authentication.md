# API Versioning And Authentication

## Mục Đích

Tài liệu này mô tả quy tắc versioning, authentication và authorization cho RESTful API của hệ thống.

## API Versioning

Tất cả API nghiệp vụ phải có version trong path:

```text
/api/v1
```

Ví dụ:

```text
GET /api/v1/classrooms
GET /api/v1/students/me/todo
GET /api/v1/admin/users/students
```

## Versioning Rules

| Rule | Mô tả |
| --- | --- |
| API-VR-001 | Không tạo endpoint production thiếu `/api/v1`. |
| API-VR-002 | Breaking change phải tạo `/api/v2` hoặc có migration plan. |
| API-VR-003 | Non-breaking change như thêm optional field có thể giữ `/api/v1`. |
| API-VR-004 | Swagger phải hiển thị version hiện tại. |
| API-VR-005 | Deprecated endpoint phải có ghi chú nếu vẫn giữ tạm. |

## Authentication Model

| Thành phần | Yêu cầu |
| --- | --- |
| Access token | JWT short-lived token cho protected APIs |
| Refresh token | Optional, dùng làm mới access token |
| Password | Hash trước khi lưu, không expose |
| Reset token | Lưu dạng hash, expiry, one-time use |
| Invitation token | Lưu dạng hash, expiry, one-time use |

## Auth Endpoints

| Method | Endpoint | Auth | Mục đích |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | No | Public Student self-registration; chỉ tạo `STUDENT` `ACTIVE`, không tạo session/Enrollment |
| POST | `/api/v1/auth/login` | No | Login và nhận token/session |
| POST | `/api/v1/auth/refresh-token` | Yes/Refresh | Làm mới access token |
| POST | `/api/v1/auth/logout` | Yes | Logout session hiện tại |
| POST | `/api/v1/auth/forgot-password` | No | Yêu cầu reset password |
| POST | `/api/v1/auth/reset-password` | No | Đặt password mới bằng reset token |
| GET | `/api/v1/users/me` | Yes | Lấy current user |
| PATCH | `/api/v1/users/me` | Yes | Cập nhật profile được phép |

## Authorization Model

Hệ thống dùng:

```text
Authentication
        ↓
Account Status Check
        ↓
Role-Based Access Control
        ↓
Permission Check
        ↓
Object-Level Access Control
        ↓
Business Policy Check
```

## Account Status Rules

| Status | API behavior |
| --- | --- |
| PENDING | Chỉ dùng được flow activation phù hợp |
| ACTIVE | Được gọi API theo role/permission |
| INACTIVE | Không được gọi API nghiệp vụ |
| BLOCKED | Không được login hoặc gọi API protected |
| DELETED | Không được login hoặc gọi API |

## Role Authorization Summary

| API Area | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- |
| Own profile | Có | Có | Có | Có |
| Join Classroom | Có | Không mặc định | Không mặc định | Không mặc định |
| Student Dashboard | Own only | Không | Không | Không |
| Create Classroom | Không | Có | Governance only | Có thể override |
| Manage Course/Content | Không | Owned only | Governance only | Có thể override |
| Grade/Feedback | Own view only | Owned classroom | Governance only | Có thể override |
| Admin User Lists | Không | Không | Có theo permission | Có |
| Role/Permission | Không | Không | Giới hạn | Có |
| System Settings | Không | Không | Giới hạn | Có |
| Audit Log | Không | Không | Có theo permission | Có |

## Object-Level Access Examples

| Resource | Rule |
| --- | --- |
| Classroom | Student xem nếu có Enrollment active; Teacher quản lý nếu owner; Admin xem theo governance |
| Course | Student xem nếu thuộc Classroom đã enroll và Course publish; Teacher quản lý nếu owner |
| Lesson | Student xem nếu publish/assigned; Teacher quản lý nếu Course owned |
| QuizAttempt | Student chỉ xem attempt của mình; Teacher xem attempt trong Classroom owned |
| Submission | Student chỉ xem/nộp submission của mình; Teacher xem trong Classroom owned |
| Grade/Feedback | Student chỉ xem của mình; Teacher tạo trong Classroom owned |
| Admin Users | Admin xem theo permission `user.view_students`, `user.view_teachers`, `user.view_admins` |

## Token Security Requirements

- Không lưu raw refresh token/reset token/invitation token nếu không cần; ưu tiên hash.
- Không log token trong application logs.
- Access token nên có expiry ngắn.
- Refresh token có thể revoke khi logout/block account.
- Khi account bị `BLOCKED`, session/token cũ nên bị vô hiệu nếu hệ thống có session store.

## Public Endpoint Rules

Endpoint public gồm:

- Login.
- Student self-registration của MVP; backend gán cố định role `STUDENT` và không tạo session/Enrollment.
- Forgot/reset password.
- Teacher invitation preview/accept.
- Classroom invite preview.
- Health check public-safe nếu cần.

Public endpoint không được expose dữ liệu riêng tư. Preview Classroom Invite chỉ nên trả metadata tối thiểu như classroom name/teacher name nếu policy cho phép.
