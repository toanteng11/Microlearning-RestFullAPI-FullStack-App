# User Flow Map

## Mục Đích

Tài liệu này mô tả các user flow chính của hệ thống theo từng role. Các flow này là cơ sở để:

- Frontend Developer xây dựng routing và navigation.
- Backend Developer kiểm tra API sequence cần hỗ trợ.
- QA Engineer viết test scenario và UAT flow.
- DevOps Engineer xây dựng smoke test sau deployment.

## Flow 00 - Student Tự Đăng Ký Trước Khi Login

```mermaid
flowchart TD
    A["Guest mở /register"] --> B["Nhập full name, email, password và confirm password"]
    B --> C["Frontend gọi POST /api/v1/auth/register"]
    C --> D{"Dữ liệu hợp lệ và email chưa tồn tại?"}
    D -->|Không| E["Hiển thị validation hoặc duplicate email"]
    D -->|Có| F["Backend tạo STUDENT ACTIVE và hash password"]
    F --> G["Không tạo session hoặc Enrollment"]
    G --> H["Redirect /login và giữ returnUrl join nếu có"]
    H --> I["Student Login"]
```

### Yêu Cầu Chính

- Frontend không gửi hoặc tin cậy field `role`/`status`; backend phải dùng field allowlist và gán cố định `STUDENT`/`ACTIVE`.
- Registration thành công không được xem là Login thành công.
- Nếu bắt đầu từ Invite Link, chỉ giữ return context; sau Login phải validate lại join token và policy.

## Flow 01 - Login Và Redirect Theo Role

```mermaid
flowchart TD
    A["User mở /login"] --> B["Nhập email và password"]
    B --> C["Frontend gọi POST /api/v1/auth/login"]
    C --> D{"Login thành công?"}
    D -->|Không| E["Hiển thị lỗi đăng nhập"]
    D -->|Có| F["Lưu token/session theo cơ chế bảo mật"]
    F --> G["Gọi GET /api/v1/users/me"]
    G --> H{"Role chính là gì?"}
    H -->|Student| I["Redirect /student/dashboard"]
    H -->|Teacher| J["Redirect /teacher/dashboard"]
    H -->|Admin hoặc Super Admin| K["Redirect /admin/dashboard"]
```

### Yêu Cầu Chính

- Không redirect theo role hard-code từ form login nếu chưa có profile/role hợp lệ.
- Nếu account có status khác `ACTIVE`, UI phải hiển thị thông báo phù hợp.
- Nếu token hết hạn, hệ thống thử `POST /api/v1/auth/refresh-token` trước khi logout.

## Flow 02 - Admin Tạo Teacher Invitation Link Thủ Công

Đây là flow đã được chọn cho dự án: hệ thống tạo link mời, Admin tự copy link và gửi thủ công qua email cá nhân, Zalo, Facebook, Messenger hoặc kênh phù hợp khác.

```mermaid
flowchart TD
    A["Admin mở Teacher Invitation Management"] --> B["Admin nhập email Teacher"]
    B --> C["Frontend gọi POST /api/v1/admin/teacher-invitations"]
    C --> D["Backend tạo invitation token"]
    D --> E["Frontend hiển thị invitation link"]
    E --> F["Admin bấm Copy Link"]
    F --> G["Frontend copy link vào clipboard"]
    G --> H["Gọi copy-events nếu cần tracking"]
    H --> I["Admin gửi link thủ công qua kênh ngoài hệ thống"]
    I --> J["Teacher mở link /teacher/invite?token=..."]
    J --> K["Teacher tự nhập họ tên và password"]
    K --> L["Frontend gọi POST /api/v1/teacher/invitations/{token}/accept"]
    L --> M["Account Teacher chuyển thành ACTIVE"]
```

### Yêu Cầu Chính

- Admin cần nhập email để hệ thống biết invitation dành cho ai, kiểm tra trùng lặp và audit.
- Hệ thống không tự gửi email trong MVP.
- Admin không được biết password của Teacher.
- Link mời cần có trạng thái: `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED`.
- Nếu Admin revoke link, Teacher mở link phải thấy token không còn hợp lệ.

## Flow 03 - Student Tham Gia Classroom Bằng Class Code

```mermaid
flowchart TD
    A["Student login"] --> B["Mở Join By Code"]
    B --> C["Nhập Class Code"]
    C --> D["Gọi POST /api/v1/classrooms/join-by-code"]
    D --> E{"Join thành công?"}
    E -->|Không| F["Hiển thị invalid code hoặc enrollment locked"]
    E -->|Có| G["Hiển thị success"]
    G --> H["Redirect Classroom Detail"]
    H --> I["Classroom xuất hiện trong Student Dashboard"]
```

### Yêu Cầu Chính

- Nếu Student đã tham gia Classroom, UI phải báo rõ `already joined`.
- Nếu Classroom bị khóa enrollment, UI phải báo không thể tham gia.
- Sau khi join thành công, To-do và Classroom list phải được refetch.

## Flow 04 - Student Tham Gia Classroom Bằng Invite Link

```mermaid
flowchart TD
    A["Student hoặc Guest mở invite link"] --> B["Frontend gọi GET /api/v1/classrooms/invitations/{token}"]
    B --> C{"Token hợp lệ?"}
    C -->|Không| D["Hiển thị link không hợp lệ hoặc đã hết hạn"]
    C -->|Có| E["Hiển thị preview Classroom"]
    E --> F{"User đã login?"}
    F -->|Chưa| G["Redirect login; cho phép sang register nếu chưa có account và giữ returnUrl"]
    F -->|Rồi| H["Student bấm Join"]
    G --> I["Login thành công"]
    I --> H
    H --> J["Gọi POST /api/v1/classrooms/join-by-token"]
    J --> K["Redirect Classroom Detail"]
```

### Yêu Cầu Chính

- Guest có thể preview thông tin cơ bản nếu policy cho phép, nhưng chỉ Student đã login mới join chính thức.
- Nếu chưa có account, Guest có thể Register nhưng vẫn phải Login trước khi quay lại đúng link mời ban đầu.

## Flow 05 - Student Học Từ To-do Đến Hoàn Thành Activity

```mermaid
flowchart TD
    A["Student mở Dashboard"] --> B["Xem To-do / Việc cần làm"]
    B --> C{"Activity type"}
    C -->|Lesson| D["Mở Lesson Player"]
    C -->|Quiz| E["Mở Quiz Attempt"]
    C -->|Assignment| F["Mở Assignment Detail"]
    C -->|Material| G["Mở Resource Viewer"]
    D --> H["Hoàn thành Lesson"]
    E --> I["Submit Quiz"]
    F --> J["Submit Assignment"]
    G --> K["Đánh dấu đã xem nếu có"]
    H --> L["Refetch To-do và Progress"]
    I --> L
    J --> L
    K --> L
    L --> M["Item hoàn thành không còn ở To-do chính"]
```

### Yêu Cầu Chính

- To-do item phải mở đúng activity theo `actionUrl` hoặc metadata từ API.
- Khi mở activity từ To-do, màn hình con phải có `Back to To-do`.
- Deadline và trạng thái `MISSING`, `LATE`, `IN_PROGRESS` phải hiển thị rõ.

## Flow 06 - Teacher Tạo Classroom Mới

```mermaid
flowchart TD
    A["Teacher mở Teacher Dashboard"] --> B["Bấm Create Classroom"]
    B --> C["Nhập tên, mô tả, section nếu có"]
    C --> D["Gọi POST /api/v1/classrooms"]
    D --> E["Backend tạo Classroom"]
    E --> F["Teacher mở Classroom Settings"]
    F --> G["Generate Class Code / Invite Link"]
    G --> H["Teacher chia sẻ cho Student"]
```

### Yêu Cầu Chính

- Form tạo Classroom cần validation tên Classroom.
- Sau khi tạo thành công, Teacher phải được đưa vào Classroom Detail hoặc Settings.
- Teacher có thể tạo Class Code và Invite Link để Student tham gia.

## Flow 07 - Teacher Tạo Course Và Nội Dung Microlearning

```mermaid
flowchart TD
    A["Teacher mở Classroom hoặc Course Management"] --> B["Tạo Course"]
    B --> C["Tạo Module/Topic"]
    C --> D["Tạo Lesson"]
    D --> E["Tạo Flashcard nếu cần"]
    E --> F["Tạo Quiz nếu cần"]
    F --> G["Thêm image/video optional vào câu hỏi nếu cần"]
    G --> H["Tạo Assignment nếu cần"]
    H --> I["Đặt deadline riêng cho từng Lesson/Activity"]
    I --> J["Preview as Student"]
    J --> K["Publish Course/Activity"]
    K --> L["Student thấy activity trong Classwork và To-do"]
```

### Yêu Cầu Chính

- Teacher có thể lưu draft trước khi publish.
- Activity chưa publish chỉ Teacher thấy.
- Deadline từng Lesson/Quiz/Assignment phải đồng bộ sang Student To-do và Calendar.
- Nếu phát sinh ngoại lệ, Teacher có thể reset deadline của từng Lesson và nhập lý do thay đổi.
- Quiz Question Media là optional, câu hỏi không có media vẫn hợp lệ.

## Flow 08 - Teacher Theo Dõi Tiến Độ Course

```mermaid
flowchart TD
    A["Teacher mở Course Detail Dashboard"] --> B["Frontend gọi dashboard/progress API"]
    B --> C["Hiển thị Lessons / Activities"]
    C --> D["Hiển thị Student Progress Ranking"]
    D --> E["Sort mặc định processScore DESC"]
    E --> F["Teacher lọc Student cần hỗ trợ"]
    F --> G["Mở Student detail hoặc Submission detail"]
```

### Yêu Cầu Chính

- Teacher nhìn thấy toàn bộ bài học đã tạo khi vào Course.
- Danh sách Student progress phải sắp xếp từ điểm quá trình cao xuống thấp theo mặc định.
- Các trạng thái missing/late cần nổi bật để Teacher phát hiện Student cần hỗ trợ.

## Flow 09 - Admin Quản Lý User Theo Danh Sách Riêng

```mermaid
flowchart TD
    A["Admin mở User Management"] --> B{"Chọn loại danh sách"}
    B -->|Student| C["GET /api/v1/admin/users/students"]
    B -->|Teacher| D["GET /api/v1/admin/users/teachers"]
    B -->|Admin| E["GET /api/v1/admin/users/admins"]
    C --> F["Filter, search, pagination"]
    D --> F
    E --> F
    F --> G["Mở User detail hoặc action status/role"]
```

### Yêu Cầu Chính

- Không dùng một danh sách mặc định tải toàn bộ Student, Teacher và Admin cùng lúc.
- Mỗi list có filter và pagination riêng.
- Action đổi status/role cần confirm và audit log ở backend.

## Flow 10 - DevOps Deployment Smoke Test

```mermaid
flowchart TD
    A["Deploy frontend lên Cloud"] --> B["Mở public URL"]
    B --> C["Kiểm tra Login page render"]
    C --> D["Kiểm tra SPA route refresh"]
    D --> E["Kiểm tra API base URL kết nối Backend"]
    E --> F["Gọi /health hoặc system version"]
    F --> G["Login bằng test account từng role"]
    G --> H["Mở Student, Teacher, Admin Dashboard"]
    H --> I["Kiểm tra Swagger/API contract nếu cần"]
```

### Yêu Cầu Chính

- Refresh trực tiếp route `/student/dashboard`, `/teacher/dashboard`, `/admin/dashboard` không được bị web server 404.
- Environment variable như API base URL phải đúng với môi trường deploy.
- Frontend build version phải trace được với commit/version được deploy.

## Exception Flows Chung

| Trường hợp | UI phải xử lý |
| --- | --- |
| API trả 401 | Thử refresh token; nếu thất bại thì logout và redirect login. |
| API trả 403 | Hiển thị Forbidden page. |
| API trả 404 | Hiển thị Not Found hoặc entity not found state. |
| API trả 409 | Hiển thị conflict rõ ràng, ví dụ already joined hoặc invitation already accepted. |
| Network error | Hiển thị retry và không xóa dữ liệu đã hiển thị nếu có thể giữ cache an toàn. |
| Validation error | Hiển thị lỗi tại field tương ứng. |
| User rời editor khi chưa lưu | Hiển thị confirm unsaved changes. |
