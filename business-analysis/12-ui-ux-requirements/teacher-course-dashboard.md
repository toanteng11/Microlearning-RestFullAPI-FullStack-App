# Teacher Course Detail Dashboard UI Requirements

## Mục Đích

Tài liệu này mô tả màn hình **Teacher Course Detail Dashboard**. Đây là màn hình Teacher nhìn thấy sau khi bấm vào một Course do mình quản lý.

Màn hình này cần giúp Teacher trả lời ngay:

- Course này có những bài học nào?
- Student nào đang tham gia hoặc được assign vào Course?
- Mỗi Student đang đạt điểm quá trình bao nhiêu?
- Ai đang hoàn thành tốt, ai đang bị trễ hoặc cần hỗ trợ?
- Deadline hoàn thành của từng bài học là khi nào?

## Entry Point

Teacher có thể vào màn hình này từ:

- Teacher Dashboard.
- Classroom Detail.
- Course/Classwork Management.
- Link trực tiếp đến Course nếu có quyền.

## Layout Đề Xuất

```text
Teacher Course Detail Dashboard
├── Course Header
│   ├── Course title
│   ├── Classroom name
│   ├── Course status
│   └── Quick actions
├── Course Summary
│   ├── Total lessons
│   ├── Total students
│   ├── Average progress
│   └── Missing / late count
├── Lessons / Activities
│   ├── Lesson list
│   ├── Quiz list
│   ├── Assignment list
│   └── Deadline per item
├── Student Progress Ranking
│   ├── Sort by process score DESC
│   ├── Student list
│   ├── Progress percentage
│   └── Missing / late items
└── Course Deadlines
    ├── Upcoming deadlines
    └── Overdue items
```

## Khu Vực Course Header

| Field | Mô tả |
| --- | --- |
| Course Title | Tên khóa học |
| Classroom Name | Classroom chứa Course |
| Course Status | Draft, Published, Scheduled, Archived |
| Teacher / Owner | Teacher sở hữu Course |
| Quick Actions | Add Lesson, Add Quiz, Add Assignment, Edit Course, Preview as Student |

## Khu Vực Lessons / Activities

Khi vào Course Dashboard, Teacher phải thấy tất cả bài học và hoạt động đã tạo trong Course.

| Cột | Mô tả |
| --- | --- |
| Order | Thứ tự bài trong Module/Course |
| Title | Tên Lesson/Quiz/Assignment |
| Type | Lesson, Flashcard, Quiz, Assignment, Resource |
| Status | Draft, Published, Scheduled, Unpublished, Archived |
| Deadline | Deadline hoàn thành riêng của từng Lesson/Activity |
| Completion | Số Student đã hoàn thành / tổng Student |
| Actions | Edit, Preview, Set Deadline, Reset Deadline, View Progress |

## Khu Vực Student Progress Ranking

Teacher cần xem danh sách Student và điểm quá trình, mặc định sắp xếp từ cao xuống thấp.

Default sort:

```text
processScore DESC
```

| Cột | Mô tả |
| --- | --- |
| Rank | Thứ hạng hiện tại |
| Student Name | Họ tên Student |
| Email | Email Student |
| Process Score | Điểm quá trình từ 0 đến 100 |
| Progress % | Tỷ lệ hoàn thành |
| Completed Lessons | Số bài đã hoàn thành |
| Missing Items | Số việc chưa làm |
| Late Items | Số việc trễ hạn |
| Last Active | Lần hoạt động gần nhất |
| Actions | View Student Detail, Message/Reminder nếu có |

## Process Score Gợi Ý

Trong MVP, có thể dùng công thức đơn giản:

```text
processScore = progressPercentage
```

Khi hệ thống có Gradebook tốt hơn, có thể mở rộng:

```text
processScore = completionScore * 60% + quizAverage * 25% + assignmentScore * 15%
```

UI không nên hard-code công thức. Backend nên trả về `processScore` để frontend chỉ hiển thị và sort.

## Deadline Từng Bài

Teacher cần có khả năng đặt deadline riêng cho từng Lesson/Activity. Đối với Lesson đã được publish/assign cho Student, deadline là thông tin bắt buộc để Student nhìn thấy trong To-do và Deadline View.

| UI Control | Mô tả |
| --- | --- |
| Set Deadline | Đặt deadline cho Lesson/Quiz/Assignment |
| Edit Deadline | Chỉnh deadline đã đặt |
| Reset Deadline | Đặt lại deadline khi có ngoại lệ như nghỉ học, đặt sai hạn, cập nhật nội dung hoặc cần gia hạn |
| Clear Deadline | Xóa deadline nếu không cần |
| Deadline Badge | Hiển thị trạng thái Due soon, Overdue, No deadline |

Khi Teacher reset deadline của Lesson đã publish/assigned, UI cần yêu cầu Teacher nhập lý do thay đổi. Lý do này giúp hệ thống audit và giúp Teacher/QA kiểm tra vì sao deadline bị đổi.

Deadline phải hiển thị ở:

- Teacher Course Detail Dashboard.
- Student Dashboard To-do.
- Student Deadline View.
- Lesson/Activity detail.

## Empty States

| Tình huống | Message gợi ý |
| --- | --- |
| Course chưa có Lesson | Course này chưa có bài học nào. Hãy tạo Lesson đầu tiên. |
| Course chưa có Student | Chưa có Student nào trong Course. Hãy chia sẻ Class Code hoặc Invite Link. |
| Chưa có progress | Chưa có dữ liệu tiến độ. Progress sẽ xuất hiện khi Student bắt đầu học. |

## Business Rules

- Teacher chỉ xem được Course mà Teacher sở hữu hoặc được phân quyền.
- Course Dashboard hiển thị cả Draft và Published content cho Teacher.
- Student chỉ thấy content đã Published hoặc được assign.
- Student Progress Ranking mặc định sort theo `processScore DESC`.
- Mỗi Lesson được publish/assign cho Student cần có deadline riêng.
- Teacher có thể reset/cập nhật deadline của từng Lesson khi có ngoại lệ.
- Khi reset deadline của Lesson đã publish/assigned, Teacher phải nhập lý do thay đổi.
- Nếu deadline bị thay đổi, Student To-do và Deadline View phải cập nhật theo deadline mới.
- Nếu deadline được gia hạn, trạng thái late/missing cần được backend tính lại theo deadline mới.

## Acceptance Criteria

- Teacher bấm vào Course và thấy Course Detail Dashboard.
- Dashboard hiển thị tất cả Lesson/Activity đã tạo trong Course.
- Teacher xem được Student list của Course.
- Teacher xem được Process Score của từng Student.
- Bảng Student Progress mặc định sắp xếp từ điểm cao xuống thấp.
- Teacher đặt được deadline hoàn thành cho từng Lesson.
- Teacher đặt lại được deadline của từng Lesson khi có ngoại lệ.
- Deadline hiển thị trong Course Dashboard và Student To-do/Deadline View.
- Deadline mới sau khi reset được cập nhật vào Student To-do và Student Deadline View.
- Teacher có thể mở từng Lesson/Activity để edit hoặc xem progress.
