# Student Use Cases

## Mục Đích

Tài liệu này đặc tả các use case chính của **Student** trên web application. Các use case tập trung vào việc tham gia Classroom, xem việc cần làm, học nội dung, làm Quiz, nộp Assignment và xem kết quả học tập.

## UC-006 - Join Classroom Bằng Class Code

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-021, FR-023 |
| UI Touchpoints | `/join/code`, Student Dashboard join widget |
| API Touchpoints | `POST /api/v1/classrooms/join-by-code` |

### Preconditions

- Student đã login và status `ACTIVE`.
- Admin policy cho phép Class Code Join.
- Classroom active và Class Code hợp lệ.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở màn hình Join Classroom bằng Class Code. |
| 2 | Student | Nhập Class Code và bấm `Join`. |
| 3 | System | Validate code format và policy. |
| 4 | System | Kiểm tra Classroom active và code còn hiệu lực. |
| 5 | System | Kiểm tra Student chưa enroll trước đó. |
| 6 | System | Tạo Enrollment/Roster record status `ACTIVE`. |
| 7 | System | Redirect Student đến Classroom detail. |

### Alternative / Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| ALT-001 | Student đã join | Hiển thị already joined và nút mở Classroom. |
| EX-001 | Code sai | Hiển thị lỗi code không hợp lệ. |
| EX-002 | Admin tắt Class Code Join | Hiển thị thông báo phương thức join không khả dụng. |
| EX-003 | Classroom archived | Từ chối join. |

## UC-007 - Join Classroom Bằng Invite Link

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-022, FR-023 |
| UI Touchpoints | `/join/invite/:token` |
| API Touchpoints | `GET /api/v1/classrooms/invitations/:token`, `POST /api/v1/classrooms/join-by-token` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Invite Link. |
| 2 | System | Preview Classroom nếu token hợp lệ. |
| 3 | Student | Bấm `Join Classroom`. |
| 4 | System | Kiểm tra login, policy, token, Classroom status. |
| 5 | System | Tạo Enrollment nếu chưa có. |
| 6 | System | Redirect Classroom detail. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Token hết hạn/revoked | Hiển thị link không hợp lệ. |
| EX-002 | Student mở link khi chưa Login | Redirect Login và giữ join token an toàn. |
| EX-003 | Duplicate enrollment | Không tạo bản ghi trùng, chuyển đến Classroom. |

## UC-041 - Xem Student To-do / Việc Cần Làm

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-049, FR-050, FR-056 |
| UI Touchpoints | `/student/dashboard`, `/student/todo` |
| API Touchpoints | `GET /api/v1/students/me/dashboard`, `GET /api/v1/students/me/todo` |

### Preconditions

- Student đã login.
- Student có ít nhất một Classroom hoặc có empty state rõ nếu chưa join.

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Student Dashboard. |
| 2 | System | Gọi API dashboard và To-do. |
| 3 | System | Tổng hợp Lesson, Quiz, Assignment, Material chưa hoàn thành. |
| 4 | System | Sắp xếp item gần deadline/quá hạn lên trước. |
| 5 | System | Hiển thị title, Classroom, type, due date, status và action. |
| 6 | Student | Search/filter theo Classroom, status hoặc activity type nếu cần. |

### Alternative / Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| ALT-001 | Không có việc cần làm | Hiển thị empty state: hiện tại chưa có việc cần làm. |
| ALT-002 | Có nhiều item | Dùng pagination/load more. |
| EX-001 | API lỗi | Hiển thị error state và nút retry. |

### Business Rules

- Item đã hoàn thành không nằm trong To-do active.
- Student chỉ thấy item thuộc Classroom đã enroll.
- Deadline của Lesson/Activity phải đồng bộ từ Teacher.

## UC-042 - Mở Learning Activity Từ To-do

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-050, FR-057 |
| UI Touchpoints | To-do item action |
| API Touchpoints | `GET /api/v1/students/me/todo/:todoItemId` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Click một To-do item. |
| 2 | System | Xác định activity type: Lesson, Quiz, Assignment hoặc Material. |
| 3 | System | Kiểm tra quyền truy cập activity. |
| 4 | System | Điều hướng đến đúng màn hình chi tiết. |
| 5 | System | Lưu return context để Student quay lại To-do. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Activity đã bị unpublish | Hiển thị activity unavailable và quay lại To-do. |
| EX-002 | Student bị remove khỏi Classroom | Từ chối truy cập và hiển thị thông báo. |

## UC-053 - Xem Classroom Detail Và Classwork

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-051 |
| UI Touchpoints | `/student/classrooms/:classroomId` |
| API Touchpoints | `GET /api/v1/classrooms/:classroomId`, `GET /api/v1/classrooms/:classroomId/classwork` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Classroom detail từ Dashboard. |
| 2 | System | Kiểm tra Enrollment active. |
| 3 | System | Hiển thị Stream, Classwork, Course/Module/Activity đã publish. |
| 4 | Student | Chọn Course, Lesson, Quiz, Assignment hoặc Resource. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Student chưa enroll | Trả 403 hoặc redirect join flow nếu policy cho phép. |
| EX-002 | Classroom archived | Hiển thị archived state, chỉ cho xem dữ liệu theo policy. |

## UC-009 - Hoàn Thành Lesson

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-052, FR-059 |
| UI Touchpoints | `/student/lessons/:lessonId` |
| API Touchpoints | `GET /api/v1/lessons/:lessonId`, `POST /api/v1/lessons/:lessonId/complete` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Lesson Player. |
| 2 | System | Kiểm tra Student có quyền xem Lesson. |
| 3 | System | Hiển thị nội dung, media/resource và deadline nếu có. |
| 4 | Student | Đọc/học nội dung và bấm `Mark as Complete`. |
| 5 | System | Ghi Progress `COMPLETED`, completedAt và cập nhật Course progress. |
| 6 | System | Gợi ý Previous/Next hoặc quay lại To-do. |

### Alternative / Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| ALT-001 | Lesson đã hoàn thành | Hiển thị completed state, cho phép học lại nếu cần. |
| ALT-002 | Lesson quá deadline | Vẫn cho học nếu policy cho phép, đánh dấu late. |
| EX-001 | Lesson unpublished | Hiển thị unavailable. |

## UC-054 - Học Flashcard

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-053 |
| UI Touchpoints | Lesson Flashcard section |
| API Touchpoints | `GET /api/v1/lessons/:lessonId/flashcards` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Flashcard trong Lesson/Module. |
| 2 | System | Load danh sách Flashcard theo quyền. |
| 3 | Student | Lật card, chuyển next/previous. |
| 4 | System | Ghi progress nếu Flashcard required. |

## UC-055 - Mở Learning Resource

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Should |
| Related FR | FR-032, FR-068 |
| UI Touchpoints | Resource viewer / embedded link |
| API Touchpoints | `GET /api/v1/resources/:resourceId` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Click Resource trong Lesson/Classwork. |
| 2 | System | Kiểm tra quyền truy cập Classroom/Course. |
| 3 | System | Mở PDF/image/video URL/link hoặc attachment. |
| 4 | System | Ghi progress nếu resource required. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | File bị xóa hoặc link lỗi | Hiển thị lỗi resource unavailable. |
| EX-002 | Không có quyền | Trả 403/404 an toàn. |

## UC-010 - Làm Quiz

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-036 đến FR-040 |
| UI Touchpoints | `/student/quizzes/:quizId` |
| API Touchpoints | `GET /api/v1/quizzes/:quizId`, `POST /api/v1/quizzes/:quizId/attempts` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Quiz từ Classwork/To-do. |
| 2 | System | Hiển thị instruction, points, attempt limit, time limit, due date. |
| 3 | Student | Bấm bắt đầu Quiz. |
| 4 | System | Hiển thị câu hỏi theo type và media nếu có. |
| 5 | Student | Trả lời câu hỏi và submit. |
| 6 | System | Validate attempt, lưu answers, submittedAt. |
| 7 | System | Auto-grade câu hỏi khách quan, pending review cho short answer nếu cần. |
| 8 | System | Hiển thị score/status theo visibility policy. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Hết attempt limit | Không cho bắt đầu attempt mới. |
| EX-002 | Quiz unpublished | Hiển thị unavailable. |
| EX-003 | Submit trùng attempt | Từ chối submit, giữ attempt đã hoàn tất. |
| EX-004 | Media lỗi | Question vẫn hiển thị text; media error state rõ. |

## UC-056 - Nộp Assignment

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-043, FR-044 |
| UI Touchpoints | `/student/assignments/:assignmentId` |
| API Touchpoints | `GET /api/v1/assignments/:assignmentId`, `POST /api/v1/assignments/:assignmentId/submissions`, `PATCH /api/v1/submissions/:submissionId` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Assignment detail. |
| 2 | System | Hiển thị instruction, due date, max score, attachment và submission methods. |
| 3 | Student | Nhập text, upload file, thêm link hoặc mark as done theo policy. |
| 4 | System | Validate nội dung, file type/size, link format. |
| 5 | Student | Bấm `Turn in`. |
| 6 | System | Lưu Submission, status, submittedAt và late flag nếu quá hạn. |
| 7 | System | Cập nhật To-do và Progress. |

### Alternative / Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| ALT-001 | Student unsubmit/resubmit | Cho phép nếu policy bật và bài chưa bị khóa. |
| ALT-002 | Nộp trễ | Lưu submission nhưng đánh dấu late nếu policy cho phép. |
| EX-001 | File sai type/size | Reject upload và hiển thị lỗi. |
| EX-002 | Assignment đã đóng | Không cho nộp mới. |

## UC-058 - Xem Learning Progress

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-054, FR-059 |
| UI Touchpoints | `/student/progress` |
| API Touchpoints | `GET /api/v1/progress/me` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở My Learning Progress. |
| 2 | System | Lấy progress theo Classroom/Course/Activity. |
| 3 | System | Hiển thị completed, not started, in progress, missing, late và percentage. |
| 4 | Student | Filter theo Classroom/Course nếu cần. |

## UC-057 - Xem Grade Và Feedback

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-055 |
| UI Touchpoints | `/student/grades` |
| API Touchpoints | `GET /api/v1/students/me/grades` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Grade & Feedback page. |
| 2 | System | Kiểm tra Student chỉ truy cập dữ liệu của mình. |
| 3 | System | Hiển thị Quiz/Assignment score, feedback, returned status. |
| 4 | Student | Mở chi tiết feedback nếu cần. |

## UC-059 - Xem Learning Calendar / Deadline View

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Should |
| Related FR | FR-056 |
| UI Touchpoints | `/student/calendar` |
| API Touchpoints | `GET /api/v1/students/me/deadlines` |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở Calendar/Deadline View. |
| 2 | System | Lấy Lesson/Quiz/Assignment deadlines từ Classroom đã enroll. |
| 3 | System | Hiển thị theo ngày/tuần/tháng hoặc list view. |
| 4 | Student | Click deadline để mở activity. |

## UC-043 - Điều Hướng Back / Previous / Next Trong Learning Flow

| Thuộc tính | Nội dung |
| --- | --- |
| Primary Actor | Student |
| Priority | Must |
| Related FR | FR-057 |
| UI Touchpoints | Lesson, Quiz, Assignment, Classroom Detail |
| API Touchpoints | Không bắt buộc, phụ thuộc page |

### Main Flow

| Step | Actor/System | Hành động |
| --- | --- | --- |
| 1 | Student | Mở một activity từ To-do/Classwork. |
| 2 | System | Hiển thị breadcrumb và Back/Previous/Next phù hợp. |
| 3 | Student | Bấm Back để quay lại danh sách trước đó. |
| 4 | System | Giữ return context, filter/page nếu có thể. |
| 5 | Student | Bấm Previous/Next để chuyển activity liền kề. |

### Exception Flows

| Mã | Tình huống | Hành vi |
| --- | --- | --- |
| EX-001 | Form đang nhập chưa lưu | Hiển thị confirm trước khi rời trang. |
| EX-002 | Không có next activity | Disable Next hoặc hiển thị trạng thái cuối danh sách. |
