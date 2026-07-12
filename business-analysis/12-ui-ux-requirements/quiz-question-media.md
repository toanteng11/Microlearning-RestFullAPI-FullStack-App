# Quiz Question Media UI Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu UI/UX cho chức năng **thêm image hoặc video vào Quiz Question**. Đây là chức năng tùy chọn, dùng khi Teacher cần minh họa trực quan cho câu hỏi trắc nghiệm.

Chức năng này không bắt buộc cho mọi câu hỏi. Một question dạng text thông thường vẫn phải hoạt động bình thường.

## Vị Trí Trong UI

Chức năng media nằm trong `Teacher Quiz Builder`, tại khu vực tạo hoặc chỉnh sửa từng question.

```text
Teacher Quiz Builder
└── Question Editor
    ├── Question Text
    ├── Question Type
    ├── Answer Options
    ├── Correct Answer
    ├── Points
    └── Optional Media
        ├── Add Image
        ├── Add Video URL
        ├── Preview Media
        └── Remove Media
```

## Supported Media

| Media Type | MVP đề xuất | Ghi chú |
| --- | --- | --- |
| Image upload | Should | Phù hợp câu hỏi nhìn hình chọn đáp án |
| Image URL | Should | Giảm tải upload nếu Teacher có link ảnh |
| Video URL | Could | Ưu tiên hơn video upload để giảm chi phí storage |
| Video upload | Could / Post-MVP | Chỉ nên làm khi hạ tầng storage sẵn sàng |

## Field UI Gợi Ý

| Field | Mục đích | Bắt buộc |
| --- | --- | --- |
| Media Type | Chọn image hoặc video | Có nếu thêm media |
| Media File / URL | Upload file hoặc nhập URL | Có nếu thêm media |
| Caption | Chú thích ngắn dưới media | Không |
| Alt Text | Mô tả thay thế cho accessibility | Nên có với image |
| Preview | Xem trước media trong question | Có |

## UI Behavior

- Teacher có thể tạo question không có media.
- Teacher có thể thêm media sau khi đã nhập question text.
- Teacher có thể preview media trước khi publish Quiz.
- Teacher có thể remove media mà không xóa question.
- Nếu media lỗi hoặc không tải được, UI hiển thị lỗi rõ ràng và cho Teacher thay media.
- Student chỉ nhìn thấy media trong Quiz nếu media đã được lưu hợp lệ và Quiz được publish.

## Validation Messages

| Tình huống | Message gợi ý |
| --- | --- |
| File không đúng loại | File này không được hỗ trợ. Vui lòng chọn image hoặc video hợp lệ. |
| File quá lớn | File vượt quá dung lượng cho phép. |
| URL không hợp lệ | URL media không hợp lệ. |
| Media không tải được | Không thể tải media. Vui lòng kiểm tra lại file hoặc URL. |

## Acceptance Criteria

- Teacher có thể thêm image vào Quiz Question.
- Teacher có thể thêm video URL vào Quiz Question nếu hệ thống bật tính năng này.
- Teacher có thể preview media trong Quiz Builder.
- Teacher có thể xóa media khỏi question.
- Question không có media vẫn lưu và publish bình thường.
- Student xem được media khi làm Quiz nếu Student có quyền truy cập Quiz.
