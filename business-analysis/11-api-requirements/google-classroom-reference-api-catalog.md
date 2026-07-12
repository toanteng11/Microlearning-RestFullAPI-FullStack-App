# Google Classroom Reference API Catalog

## Mục Đích

Tài liệu này mô tả các API concept được tham khảo từ workflow Google Classroom và cách chuyển hóa vào hệ thống **Microlearning Classroom LMS Platform**. Dự án **không tích hợp Google Classroom API**, không sao chép schema/API độc quyền; chỉ tham khảo nghiệp vụ quen thuộc như Classroom, Stream, Classwork, People/Roster, Assignment, Submission và Grade.

## Concept Mapping

| Workflow tham khảo | API trong dự án |
| --- | --- |
| Classroom | `/api/v1/classrooms` |
| People/Roster | `/api/v1/classrooms/{classroomId}/students`, `/api/v1/admin/users/students` |
| Class Stream | `/api/v1/classrooms/{classroomId}/announcements` |
| Classwork | Course/Lesson/Quiz/Assignment/Resource APIs |
| Assignment | `/api/v1/assignments` |
| Submission | `/api/v1/assignments/{assignmentId}/submissions`, `/api/v1/teacher/assignments/{assignmentId}/submissions` |
| Grades | `/api/v1/students/me/grades`, `/api/v1/teacher/courses/{courseId}/gradebook` |
| Invite link / Class code | Classroom Join APIs |

## Classroom-like API Groups Trong Dự Án

| API Group | Mục đích |
| --- | --- |
| Classroom APIs | Tạo và quản lý lớp |
| Classroom Join APIs | Student join bằng Code/Link |
| Announcement APIs | Stream thông báo |
| Classwork APIs | Lesson/Quiz/Assignment/Resource trong Course |
| Roster APIs | Teacher xem Student trong lớp |
| Submission APIs | Student nộp bài, Teacher xem/chấm |
| Grade APIs | Student xem điểm, Teacher quản lý gradebook |

## Important Differences

| Điểm khác | Lý do |
| --- | --- |
| Có Course bên trong Classroom | Dự án tập trung microlearning theo Course/Module/Lesson |
| Có Student To-do riêng | Yêu cầu UX giúp Student thấy việc cần làm |
| Có Teacher Course Detail Dashboard | Teacher cần xem bài học, Student, progress ranking và deadline |
| Admin invitation manual copy link | Không phụ thuộc Gmail/SMTP trong MVP |
| Không dùng Google API | Chỉ tham khảo nghiệp vụ, không tích hợp |

## Reference Rules

- Không dùng Google Classroom logo/brand trong API docs.
- Không gọi Google Classroom API.
- Không yêu cầu Google Workspace.
- Không lưu Google classroom IDs.
- Tên endpoint theo domain của dự án.

## BA Notes

Các workflow tham khảo giúp người dùng quen cách học/lớp/bài tập, nhưng API phải phục vụ sản phẩm riêng:

```text
Microlearning Classroom LMS
  = Classroom workflow
  + Microlearning Course/Module/Lesson
  + Student To-do
  + Teacher Course Dashboard
  + DevOps/API/Swagger learning objective
```
