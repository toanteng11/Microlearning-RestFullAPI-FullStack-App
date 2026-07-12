# Student Dashboard To-do UI Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu UI/UX cho khu vực **To-do / Việc cần làm** trên **Student Dashboard**. Đây là chức năng Must Have vì sau khi Student login, hệ thống cần trả lời ngay câu hỏi quan trọng nhất:

```text
Hôm nay tôi cần làm gì?
```

Nếu thiếu khu vực này, Student phải mở từng Classroom để tự kiểm tra Lesson, Quiz hoặc Assignment chưa làm. Điều này làm trải nghiệm kém chuyên nghiệp và dễ khiến Student bỏ sót bài được Teacher giao.

## Vị Trí Trên Dashboard

Khu vực To-do nên nằm trong màn hình `Student Dashboard`, ưu tiên ở vùng dễ nhìn sau khi login.

Gợi ý bố cục:

```text
Student Dashboard
├── Header / Welcome
├── To-do / Việc cần làm
├── Deadline sắp tới
├── Classroom đã tham gia
└── Progress tổng quan
```

## Nội Dung Cần Hiển Thị

Mỗi To-do item cần có tối thiểu:

| Field | Ý nghĩa |
| --- | --- |
| Title | Tên Lesson, Quiz, Assignment hoặc Material |
| Classroom Name | Lớp học chứa việc cần làm |
| Teacher Name | Teacher giao việc, nếu cần |
| Activity Type | `Lesson`, `Quiz`, `Assignment`, `Material` |
| Due Date | Deadline nếu có |
| Status | `NOT_STARTED`, `IN_PROGRESS`, `MISSING`, `LATE`, `NEEDS_REVISION` |
| Action | `Start`, `Continue`, `Submit`, `Review` hoặc `Open` |

## Quy Tắc Sắp Xếp

To-do list nên được sắp xếp theo thứ tự ưu tiên:

1. Việc quá hạn hoặc missing.
2. Việc sắp đến hạn.
3. Việc đang làm dở.
4. Việc mới được giao.
5. Việc không có deadline.

## Filter Và Tab Gợi Ý

MVP có thể bắt đầu đơn giản, nhưng UI nên dự trù các filter sau:

| Filter/Tab | Ý nghĩa |
| --- | --- |
| All | Tất cả việc chưa hoàn thành |
| Due Soon | Việc sắp đến hạn |
| Missing | Việc đã quá hạn/chưa nộp |
| In Progress | Việc đã bắt đầu nhưng chưa hoàn thành |
| By Classroom | Lọc theo từng Classroom |

## Hành Vi Khi Click To-do Item

| Activity Type | Hành động khi click |
| --- | --- |
| Lesson | Mở Lesson Player |
| Quiz | Mở Quiz Detail hoặc Quiz Attempt |
| Assignment | Mở Assignment Detail / Submission Screen |
| Material | Mở Resource Viewer |

System cần giữ context để Student có thể bấm `Back to To-do` sau khi mở activity.

## Empty State

Khi không có việc cần làm:

```text
Bạn chưa có việc cần làm.
Các bài học, quiz hoặc assignment mới từ Teacher sẽ xuất hiện tại đây.
```

Empty state cần thân thiện, không nên để dashboard trống hoặc chỉ hiện dấu gạch ngang.

## Loading State

Khi To-do đang tải:

- Hiển thị skeleton loading hoặc loading indicator gọn.
- Không làm layout bị nhảy quá nhiều.
- Nếu tải chậm, vẫn hiển thị các phần dashboard khác nếu có dữ liệu.

## Error State

Khi To-do không tải được:

```text
Không thể tải việc cần làm.
Vui lòng thử lại.
```

Cần có nút `Retry`.

## Responsive Requirements

| Viewport | Yêu cầu |
| --- | --- |
| Desktop | To-do có thể hiển thị dạng list hoặc table ngắn |
| Tablet | To-do hiển thị dạng list card gọn |
| Mobile | Mỗi item là một card dọc, action button dễ bấm |

## Accessibility Requirements

- Action button phải có label rõ ràng.
- Status không chỉ phụ thuộc vào màu sắc; cần có text.
- Keyboard user có thể tab qua từng To-do item.
- Screen reader đọc được title, classroom, type, due date và status.

## Acceptance Criteria

- Student thấy To-do ngay trên Dashboard sau khi login.
- To-do hiển thị các activity chưa hoàn thành từ tất cả Classroom đã tham gia.
- Mỗi item có title, classroom, activity type, status và action.
- Student click item thì mở đúng activity.
- Student có thể quay lại To-do sau khi mở activity.
- Item đã hoàn thành không còn nằm trong danh sách việc cần làm chính.
- Empty/loading/error state được xử lý rõ ràng.
