# Google Classroom Reference Data Model

## Mục Đích

Tài liệu này ghi nhận các khái niệm dữ liệu được tham khảo từ workflow Google Classroom để áp dụng phù hợp cho **Microlearning Classroom LMS Platform**. Đây chỉ là tài liệu tham khảo nghiệp vụ, không sao chép Google Classroom API, database, brand hoặc giao diện.

## Mapping Concept

| Google Classroom-like Concept | Data Model Trong Dự Án | Ghi chú |
| --- | --- | --- |
| Class | Classroom | Lớp học do Teacher tạo |
| People/Roster | Enrollment / ClassroomMember | Danh sách Student trong Classroom |
| Class Stream | Announcement | Thông báo và activity update |
| Classwork | Lesson, Quiz, Assignment, LearningResource | Dự án mở rộng theo microlearning |
| Topic | Module | Nhóm nội dung trong Course |
| Material | LearningResource | PDF, link, image, video URL |
| Assignment | Assignment | Bài tập có due date và submission |
| Student Submission | Submission | Bài nộp của Student |
| Grade | Grade | Điểm Quiz/Assignment |
| Private Comment | PrivateComment / Feedback | Giao tiếp riêng Teacher-Student |
| Invite Link / Class Code | ClassroomInviteLink / ClassCode | Cơ chế join lớp |

## Entity Bổ Sung Từ Workflow Tham Khảo

| Entity | Vai trò trong dự án | Priority |
| --- | --- | --- |
| Announcement | Teacher đăng thông báo trong Classroom Stream | Must |
| LearningResource | Chia sẻ tài liệu học tập | Should |
| Assignment | Giao bài tập cho Student | Must |
| Submission | Student nộp bài | Must |
| Grade | Điểm cho Quiz/Assignment | Must |
| Feedback | Nhận xét của Teacher | Must |
| PrivateComment | Trao đổi riêng trong Assignment | Should |
| Module | Nhóm nội dung tương tự Topic | Must |

## Classwork Data Strategy

Trong dự án này, không nhất thiết cần một collection `classwork_items` riêng ở MVP. Có hai cách:

### Option A - Separate Collections

```text
lessons
quizzes
assignments
learning_resources
```

Ưu điểm:

- Mỗi loại activity có schema rõ.
- Dễ validate theo từng loại.
- Phù hợp MVP.

Nhược điểm:

- Khi hiển thị Classwork cần query/aggregate nhiều collection.

### Option B - Unified ClassworkItem

```text
classwork_items
  type = LESSON / QUIZ / ASSIGNMENT / MATERIAL
  targetId = ObjectId
```

Ưu điểm:

- Classwork list query nhanh hơn.
- Dễ reorder toàn bộ activity.

Nhược điểm:

- Tăng độ phức tạp sync với target entity.

### Khuyến Nghị Cho Đồ Án

MVP nên dùng **Option A** để dễ hiểu và dễ triển khai. Nếu cần Course Dashboard/Classwork list nhanh hơn, có thể thêm read model sau.

## Stream Data Strategy

Announcement có thể được lưu riêng:

```text
announcements
- classroomId
- teacherId
- content
- attachments
- status
- publishedAt
```

Nếu sau này muốn activity feed đầy đủ, có thể thêm:

```text
stream_posts
- classroomId
- postType
- targetType
- targetId
- content
- createdBy
- createdAt
```

## Submission And Grade Strategy

| Data | Source |
| --- | --- |
| Assignment status | Assignment + Submission |
| Missing | Assignment dueDate qua hạn và chưa có Submission submitted |
| Late | Submission submittedAt > Assignment dueDate |
| Graded | Grade tồn tại |
| Returned | Submission status `RETURNED` hoặc Grade/Feedback published |

## Relationship Notes

```text
Classroom
  ├── Enrollment
  ├── Announcement
  ├── Course
        ├── Module
        ├── Lesson
        ├── Quiz
        ├── Assignment
        └── LearningResource
```

## Data Rules Adapted From Classroom Workflow

| Rule ID | Rule |
| --- | --- |
| GC-DATA-001 | Student chỉ xem Classwork của Classroom đã enroll. |
| GC-DATA-002 | Teacher chỉ quản lý Classwork của Classroom/Course mình sở hữu. |
| GC-DATA-003 | Assignment due date phải đồng bộ sang Student To-do. |
| GC-DATA-004 | Submission không bị mất khi Assignment archive/unpublish. |
| GC-DATA-005 | Grade/Feedback chỉ hiển thị cho Student sau khi Teacher return/publish theo policy. |
| GC-DATA-006 | Private comment chỉ Teacher và Student liên quan xem được. |

## Out Of Scope

- Không tích hợp Google Classroom API.
- Không lưu Google Classroom IDs.
- Không dùng Google Classroom brand/logo/schema nội bộ.
- Không đồng bộ dữ liệu từ Google Workspace.
