# Lesson Deadline Management UI Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu UI/UX cho chức năng quản lý deadline riêng của từng **Lesson**. Trong dự án này, mỗi Lesson được Teacher giao cho Student cần có deadline riêng để Student biết rõ phải hoàn thành bài học nào, vào thời điểm nào.

Chức năng này đặc biệt quan trọng vì trong thực tế có thể phát sinh ngoại lệ như:

- Teacher đặt sai deadline ban đầu.
- Lớp học bị nghỉ đột xuất.
- Student hoặc cả lớp cần thêm thời gian vì lý do khách quan.
- Nội dung Lesson được cập nhật và cần gia hạn thời gian hoàn thành.
- Hệ thống hoặc môi trường học tập gặp sự cố làm Student không thể hoàn thành đúng hạn.

Vì vậy, Teacher cần có chức năng **Reset Deadline** hoặc **Update Deadline** cho từng Lesson.

## Phạm Vi

| Nội dung | In scope |
| --- | --- |
| Đặt deadline riêng cho từng Lesson | Có |
| Cập nhật/reset deadline cho từng Lesson | Có |
| Nhập lý do thay đổi deadline | Có |
| Cập nhật Student To-do sau khi đổi deadline | Có |
| Cập nhật Student Deadline Calendar sau khi đổi deadline | Có |
| Ghi nhận lịch sử thay đổi deadline | Có, khuyến nghị để audit và debug |
| Reset deadline riêng cho từng Student | Chưa bắt buộc trong MVP, có thể mở rộng sau |

## Entry Points

Teacher có thể mở chức năng deadline từ các vị trí:

| Entry point | Cách hiển thị |
| --- | --- |
| Teacher Course Detail Dashboard | Button `Set Deadline`, `Edit Deadline` hoặc `Reset Deadline` trên từng Lesson row. |
| Course Content Management | Action menu của từng Lesson. |
| Micro Lesson Editor | Section `Lesson Deadline` trong form lesson. |
| Lesson Detail Preview | Action `Reset Deadline` nếu Teacher có quyền. |

## UI Controls

| Control | Mô tả |
| --- | --- |
| Deadline DateTime Picker | Chọn ngày giờ deadline mới cho Lesson. |
| Reset Deadline Button | Mở modal đặt lại deadline khi Lesson đã có deadline. |
| Deadline Change Reason | Textarea bắt buộc khi reset deadline đã publish/assigned. |
| Apply Button | Lưu deadline mới. |
| Cancel Button | Đóng modal, không thay đổi dữ liệu. |
| Deadline Badge | Hiển thị `No Deadline`, `Due Soon`, `Overdue`, `Updated`, `Extended` nếu phù hợp. |
| Deadline History Link | Xem lịch sử thay đổi nếu MVP hỗ trợ. |

## Modal Reset Deadline

Khi Teacher bấm `Reset Deadline`, UI nên hiển thị modal:

| Field | Required | Mô tả |
| --- | --- | --- |
| Current Deadline | Read-only | Deadline hiện tại của Lesson. |
| New Deadline | Có | Deadline mới. |
| Reason | Có nếu Lesson đã publish/assigned | Lý do thay đổi deadline. |
| Apply To | Có thể ẩn trong MVP | Mặc định là toàn bộ Student được assign vào Lesson. |
| Notify Students | Không bắt buộc MVP | Gửi notification nếu notification system đã có. |

Ví dụ reason:

```text
Gia hạn vì lớp nghỉ buổi học ngày 2026-07-15.
```

## Business Rules

| Rule ID | Nội dung |
| --- | --- |
| LDM-BR-001 | Mỗi Lesson được publish/assign cho Student cần có deadline riêng. |
| LDM-BR-002 | Lesson ở trạng thái `DRAFT` có thể chưa cần deadline, nhưng trước khi publish/assign hệ thống phải yêu cầu Teacher đặt deadline nếu course policy bắt buộc. |
| LDM-BR-003 | Teacher có thể reset deadline của Lesson khi Teacher là owner Course hoặc có permission phù hợp. |
| LDM-BR-004 | Deadline mới không nên nhỏ hơn thời điểm hiện tại, trừ khi Admin/Teacher có quyền đặc biệt và hệ thống cho phép đánh dấu ngoại lệ. |
| LDM-BR-005 | Khi reset deadline cho Lesson đã publish/assigned, Teacher phải nhập lý do thay đổi. |
| LDM-BR-006 | Sau khi deadline thay đổi, Student To-do, Student Calendar, Lesson Detail và Teacher Course Dashboard phải hiển thị deadline mới. |
| LDM-BR-007 | Nếu deadline được gia hạn, trạng thái `LATE` hoặc `MISSING` của Student cần được backend tính lại theo deadline mới. |
| LDM-BR-008 | Hệ thống nên lưu lịch sử thay đổi deadline gồm deadline cũ, deadline mới, người thay đổi, thời điểm thay đổi và lý do. |
| LDM-BR-009 | Reset deadline không được xóa progress hoặc submission/attempt đã tồn tại. |
| LDM-BR-010 | Nếu Lesson đã archived, không cho reset deadline trừ khi được restore hoặc Admin có quyền đặc biệt. |

## API Expectation

Frontend sử dụng API:

```text
PATCH /api/v1/teacher/lessons/{lessonId}/deadline
```

Request body đề xuất:

```json
{
  "completionDeadline": "2026-07-20T16:59:00.000Z",
  "reason": "Gia hạn vì lớp nghỉ đột xuất.",
  "notifyStudents": true
}
```

Backend cần trả về deadline mới, deadline cũ nếu có, và metadata đủ để UI cập nhật ngay.

## UI Behavior Sau Khi Reset Deadline

| Khu vực | Hành vi sau khi reset |
| --- | --- |
| Teacher Course Detail Dashboard | Cập nhật deadline mới trên Lesson row, badge chuyển sang trạng thái phù hợp. |
| Student Dashboard To-do | Item Lesson được sort lại theo deadline mới. |
| Student Deadline Calendar | Deadline mới hiển thị đúng ngày/giờ. |
| Lesson Player | Hiển thị deadline mới nếu Student mở Lesson. |
| Notification | Nếu bật notify, Student nhận thông báo deadline đã thay đổi. |

## Error States

| Lỗi | UI message gợi ý |
| --- | --- |
| Lesson không tồn tại | Không tìm thấy Lesson cần cập nhật deadline. |
| Teacher không có quyền | Bạn không có quyền thay đổi deadline của Lesson này. |
| Deadline không hợp lệ | Deadline mới không hợp lệ. Vui lòng chọn lại ngày giờ. |
| Thiếu reason | Vui lòng nhập lý do thay đổi deadline. |
| Lesson đã archived | Lesson đã được lưu trữ nên không thể thay đổi deadline. |
| Network/API error | Không thể cập nhật deadline. Vui lòng thử lại. |

## Acceptance Criteria

- Teacher có thể đặt deadline riêng cho từng Lesson.
- Teacher có thể reset/cập nhật deadline của một Lesson khi có ngoại lệ.
- Khi Lesson đã publish/assigned, reset deadline yêu cầu nhập reason.
- Deadline mới hiển thị trên Teacher Course Detail Dashboard.
- Deadline mới cập nhật sang Student To-do và Student Deadline Calendar.
- Student status liên quan deadline được backend tính lại theo deadline mới.
- Reset deadline không làm mất progress, quiz attempt hoặc submission cũ.
- UI có loading, success, validation error và API error state khi reset deadline.
