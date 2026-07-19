# Teacher Use Cases

## Mục Đích

Tài liệu này đặc tả các use case chính của **Teacher** trên web application. Teacher là actor tạo Classroom, cấu hình cách Student tham gia, xây dựng nội dung microlearning, giao Quiz/Assignment, đặt deadline, xem tiến độ và chấm điểm.

## UC-003 - Tạo Classroom

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-020 |
| UI Touchpoints | `/teacher/classrooms/new` |
| API Touchpoints | `POST /api/v1/classrooms` |

### Preconditions

- Teacher đã login.
- Account status `ACTIVE`.
- Role `TEACHER`.
- Admin policy cho phép Teacher tạo Classroom.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Bấm `Create Classroom`. |
| 2 | System | Hiển thị form gồm name, section/class, description, subject nếu có. |
| 3 | Teacher | Nhập thông tin và bấm `Create`. |
| 4 | System | Validate required fields và permission. |
| 5 | System | Tạo Classroom, gán owner Teacher, status `ACTIVE` hoặc `DRAFT` theo policy. |
| 6 | System | Redirect đến Classroom detail hoặc Settings để cấu hình join methods. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Teacher bị `BLOCKED` | Từ chối tạo Classroom. |
| EX-002 | Thiếu tên Classroom | Hiển thị validation error. |
| EX-003 | Admin tắt quyền tạo Classroom | Hiển thị thông báo không đủ quyền. |

## UC-004 - Generate / Regenerate Class Code

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-021, FR-025 |
| UI Touchpoints | Classroom Settings |
| API Touchpoints | `POST /api/v1/classrooms/:classroomId/class-code/regenerate` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Classroom Settings. |
| 2 | System | Hiển thị trạng thái Class Code và Admin policy. |
| 3 | Teacher | Bấm generate/regenerate Class Code. |
| 4 | System | Kiểm tra Teacher là owner và policy cho phép. |
| 5 | System | Tạo Class Code duy nhất, vô hiệu code cũ nếu regenerate. |
| 6 | System | Hiển thị code mới và nút copy. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Admin tắt Class Code Join | Disable action và hiển thị lý do. |
| EX-002 | Teacher không phải owner | Trả 403. |

## UC-005 - Generate Invite Link

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-022, FR-025 |
| UI Touchpoints | Classroom Settings |
| API Touchpoints | `POST /api/v1/classrooms/:id/invite-links`, `POST /api/v1/classrooms/:id/invite-links/:linkId/regenerate`, `POST /api/v1/classrooms/:id/invite-links/:linkId/disable` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Classroom Settings. |
| 2 | Teacher | Chọn tạo Invite Link. |
| 3 | System | Kiểm tra policy và quyền owner. |
| 4 | System | Tạo token ngẫu nhiên, chỉ lưu hash/metadata và trả raw Invite Link đúng một lần. |
| 5 | System | Hiển thị copy action và cảnh báo link không thể xem lại; lần load sau chỉ trả metadata. |

### Alternative Flows

| Mã | Tình huống | Luồng |
| --- | --- | --- |
| ALT-001 | Teacher disable link | Gọi action-specific disable endpoint; link cũ không còn join được, Student cũ không bị remove. |
| ALT-002 | Teacher regenerate link | Token cũ bị vô hiệu, token mới được tạo và raw link mới chỉ trả một lần. |

## UC-024 - Quản Lý Classroom Settings

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-025 |
| UI Touchpoints | `/teacher/classrooms/:id/settings` |
| API Touchpoints | `PATCH /api/v1/classrooms/:id/settings` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Settings. |
| 2 | System | Load Classroom settings và Admin policy. |
| 3 | Teacher | Bật/tắt Class Code, Invite Link hoặc quyền comment/post nếu có. |
| 4 | System | Validate setting không vượt Admin policy. |
| 5 | System | Lưu settings và hiển thị success toast. |

## UC-011 - Tạo Course

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-026 |
| UI Touchpoints | `/teacher/classrooms/:id/courses/new` |
| API Touchpoints | `POST /api/v1/courses` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Bấm `Create Course` trong Classroom. |
| 2 | System | Hiển thị form Course title, description, status. |
| 3 | Teacher | Nhập dữ liệu và bấm save. |
| 4 | System | Validate owner Classroom và input. |
| 5 | System | Tạo Course liên kết Classroom, owner Teacher. |
| 6 | System | Redirect Course Detail Dashboard. |

## UC-044 - Xem Teacher Course Detail Dashboard

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-027 |
| UI Touchpoints | `/teacher/courses/:courseId/dashboard` |
| API Touchpoints | `GET /api/v1/teacher/courses/:courseId/dashboard` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Click vào Course mình quản lý. |
| 2 | System | Kiểm tra Teacher là owner hoặc có quyền. |
| 3 | System | Load Course summary, Lesson/Activity list, Student list, progress ranking, deadline. |
| 4 | System | Hiển thị dashboard với tabs/sections rõ ràng. |
| 5 | Teacher | Chọn quản lý bài học, xem Student hoặc xem progress. |

### Web States

| State | Yêu cầu |
| --- | --- |
| Loading | Hiển thị skeleton cho summary và tables. |
| Empty | Nếu Course chưa có activity, hiển thị action tạo Lesson/Quiz/Assignment. |
| Error | Có retry và Back to Classroom. |

## UC-017 - Tạo Module / Topic

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-028 |
| UI Touchpoints | Course Module manager |
| API Touchpoints | `POST /api/v1/courses/:courseId/modules`, `PATCH /api/v1/modules/:moduleId` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Bấm `Add Module`. |
| 2 | Teacher | Nhập title, description và order nếu có. |
| 3 | System | Validate Course ownership. |
| 4 | System | Tạo Module và cập nhật order. |

### Alternative Flows

| Mã | Tình huống | Luồng |
| --- | --- | --- |
| ALT-001 | Reorder Module | Teacher kéo thả/sửa order, system lưu thứ tự mới. |

## UC-012 - Quản Lý Lessons

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-029, FR-033, FR-034 |
| UI Touchpoints | Lesson editor |
| API Touchpoints | `POST /api/v1/lessons`, `PATCH /api/v1/lessons/:id`, `PATCH /api/v1/lessons/:id/status` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Tạo hoặc mở Lesson editor. |
| 2 | Teacher | Nhập title, content, module, resource nếu có. |
| 3 | System | Validate required fields và quyền Course owner. |
| 4 | Teacher | Save draft hoặc publish Lesson. |
| 5 | System | Lưu status `DRAFT`/`PUBLISHED`; Student chỉ thấy item published. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Rời trang khi chưa save | Hiển thị unsaved changes confirmation. |
| EX-002 | Không đủ quyền | Trả 403. |

## UC-046 - Đặt Deadline Hoàn Thành Cho Từng Lesson

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-030 |
| UI Touchpoints | Lesson/Activity editor, Course Dashboard |
| API Touchpoints | `PATCH /api/v1/teacher/lessons/:lessonId/deadline` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Lesson/Activity editor hoặc Course Dashboard. |
| 2 | Teacher | Chọn completion deadline. |
| 3 | System | Validate deadline format/timezone. |
| 4 | System | Lưu `completionDeadline`. |
| 5 | System | Cập nhật Student To-do và Deadline View. |

### Alternative Flows

| Mã | Tình huống | Luồng |
| --- | --- | --- |
| ALT-001 | Teacher xóa deadline | System bỏ deadline khỏi activity và cập nhật To-do/Calendar. |
| ALT-002 | Teacher sửa deadline | System cập nhật item liên quan và có thể tạo notification. |

## UC-018 - Tạo Flashcard

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-031 |
| UI Touchpoints | Flashcard editor |
| API Touchpoints | `POST /api/v1/lessons/:lessonId/flashcards` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Flashcard section trong Lesson. |
| 2 | Teacher | Nhập front/question và back/answer. |
| 3 | System | Validate nội dung và quyền. |
| 4 | System | Lưu Flashcard theo Lesson/Module. |

## UC-061 - Quản Lý Quiz Question Và Question Media

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Should |
| Related FR | FR-037, FR-038 |
| UI Touchpoints | Quiz builder |
| API Touchpoints | `POST /api/v1/quizzes/:quizId/questions`, `POST /api/v1/questions/:questionId/media`, `DELETE /api/v1/questions/:questionId/media/:mediaId` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Quiz builder. |
| 2 | Teacher | Chọn question type: single choice, multiple choice, true/false, short answer. |
| 3 | Teacher | Nhập question text, options, correct answer, points. |
| 4 | Teacher | Tùy chọn thêm image/video nếu cần. |
| 5 | System | Validate question, answer, media type/URL/file size. |
| 6 | System | Lưu question và media metadata. |
| 7 | Teacher | Preview question trước khi publish. |

### Business Rules

- Question không có media vẫn hợp lệ.
- Student chỉ xem media nếu có quyền làm Quiz.
- Video upload có thể để Post-MVP; MVP có thể dùng video URL.

## UC-019 - Tạo Assignment

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-042 |
| UI Touchpoints | Assignment editor |
| API Touchpoints | `POST /api/v1/assignments`, `PATCH /api/v1/assignments/:id` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Bấm `Create Assignment`. |
| 2 | Teacher | Nhập instruction, due date, max score, submission methods, attachment nếu có. |
| 3 | System | Validate fields và quyền Course/Classroom. |
| 4 | Teacher | Save draft hoặc publish. |
| 5 | System | Assignment xuất hiện trong Student Classwork/To-do nếu publish/assign. |

## UC-021 - Xem Submission Status

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-045 |
| UI Touchpoints | Submission table |
| API Touchpoints | `GET /api/v1/assignments/:assignmentId/submissions` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Assignment Submissions. |
| 2 | System | Load submissions theo Student trong Classroom/Course. |
| 3 | System | Hiển thị submitted, missing, late, graded, returned. |
| 4 | Teacher | Search/filter/sort theo status hoặc Student. |

## UC-022 - Chấm Điểm Và Gửi Feedback

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-046, FR-047, FR-048 |
| UI Touchpoints | Submission detail |
| API Touchpoints | `PATCH /api/v1/submissions/:submissionId/grade`, `POST /api/v1/submissions/:submissionId/feedback`, `POST /api/v1/submissions/:submissionId/return` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Submission detail. |
| 2 | System | Hiển thị bài nộp, file/link/text, status và rubric nếu có. |
| 3 | Teacher | Nhập score và feedback. |
| 4 | System | Validate score không vượt max score. |
| 5 | Teacher | Bấm `Return Work`. |
| 6 | System | Lưu Grade/Feedback, status `RETURNED`, Student xem được kết quả. |

## UC-045 - Xem Student Progress Ranking Trong Course

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-061, FR-063 |
| UI Touchpoints | Course Progress tab |
| API Touchpoints | `GET /api/v1/teacher/courses/:courseId/progress?sort=processScore:desc` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Course Progress tab. |
| 2 | System | Load Student progress ranking. |
| 3 | System | Sort mặc định `processScore DESC`. |
| 4 | System | Hiển thị Student, processScore, progress %, completed lessons, missing/late items, last active. |
| 5 | Teacher | Filter/search Student cần hỗ trợ. |

## UC-063 - Quản Lý Gradebook Basic

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Should |
| Related FR | FR-062 |
| UI Touchpoints | `/teacher/gradebook` |
| API Touchpoints | `GET /api/v1/teacher/gradebook` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở Gradebook. |
| 2 | System | Hiển thị Student x Quiz/Assignment score. |
| 3 | Teacher | Filter theo Classroom/Course/activity. |
| 4 | Teacher | Export nếu có quyền. |

## UC-064 - Search / Filter / Pagination Cho Teacher Tables

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Teacher |
| Priority | Must |
| Related FR | FR-064 |
| UI Touchpoints | Roster, submissions, progress, gradebook |
| API Touchpoints | List APIs with `page`, `limit`, `search`, `filter`, `sort` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Teacher | Mở bảng dữ liệu lớn. |
| 2 | System | Load page đầu với limit mặc định. |
| 3 | Teacher | Search/filter/sort. |
| 4 | System | Gọi API server-side, không lọc toàn bộ ở client. |
| 5 | System | Hiển thị pagination metadata. |
