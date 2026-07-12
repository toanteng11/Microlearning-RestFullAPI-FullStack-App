# Frontend Component And State Requirements

## Mục Đích

Tài liệu này mô tả các yêu cầu dùng chung cho component, UI state và interaction pattern trong ReactJS application. Mục tiêu là giúp Dev xây dựng UI nhất quán, tránh mỗi màn hình tự xử lý loading/error/form/table theo một kiểu khác nhau.

## Component Groups Bắt Buộc

| Nhóm component | Component gợi ý | Dùng ở đâu |
| --- | --- | --- |
| Layout | AppShell, Header, Sidebar, MobileNav, Breadcrumb, PageHeader | Tất cả workspace |
| Feedback | Toast, Alert, ConfirmDialog, InlineError, EmptyState, LoadingSkeleton | Tất cả màn hình gọi API |
| Forms | TextInput, PasswordInput, Select, MultiSelect, DateTimePicker, FileUpload, FormActions | Auth, Teacher editor, Admin settings |
| Data display | DataTable, CardList, StatCard, Badge, ProgressBar, Timeline | Dashboard, list, analytics |
| Learning | LessonPlayer, QuizQuestion, QuizOption, AssignmentSubmission, ResourceViewer | Student learning flow |
| Teacher tools | CourseContentList, QuizBuilder, QuestionMediaPicker, GradebookTable, RosterTable | Teacher workspace |
| Admin tools | UserListTable, InvitationLinkPanel, AuditLogTable, PolicyForm | Admin workspace |

## Global UI States

### Loading State

Yêu cầu:

- Dùng skeleton cho dashboard, list và card grid.
- Dùng spinner ngắn cho button action như Save, Submit, Revoke.
- Không làm layout nhảy mạnh khi dữ liệu tải xong.
- Nếu nhiều API gọi song song, mỗi khu vực có thể loading riêng thay vì khóa toàn bộ page.

### Empty State

Yêu cầu:

- Message phải giải thích rõ vì sao chưa có dữ liệu.
- Nếu user có quyền tạo dữ liệu, empty state nên có primary action.
- Nếu user không có quyền tạo dữ liệu, empty state chỉ nên hướng dẫn bước tiếp theo.

Ví dụ:

```text
Course này chưa có bài học nào.
Hãy tạo Lesson đầu tiên để Student bắt đầu học.
```

### Error State

Yêu cầu:

- Hiển thị lỗi dễ hiểu, không show raw stack trace.
- Có nút `Retry` nếu lỗi có thể thử lại.
- Nếu lỗi do permission, chuyển sang Forbidden state thay vì message mơ hồ.
- Nếu lỗi do validation, highlight field lỗi.

### Forbidden State

Yêu cầu:

- Hiển thị rõ user không có quyền truy cập.
- Có nút quay về dashboard theo role.
- Không tiết lộ dữ liệu nhạy cảm của entity bị từ chối.

### Not Found State

Yêu cầu:

- Dùng khi route sai hoặc entity không tồn tại.
- Có action quay về dashboard hoặc list gần nhất.
- Không redirect im lặng nếu user cần biết link đã hỏng.

### Success State

Yêu cầu:

- Sau action thành công, hiển thị toast ngắn.
- UI phải cập nhật dữ liệu liên quan bằng refetch hoặc optimistic update có kiểm soát.
- Với action quan trọng như Revoke Invitation, Archive Classroom, Change Role, cần confirm trước khi thực hiện.

## Form Requirements

| Requirement ID | Nội dung |
| --- | --- |
| FORM-UI-001 | Field bắt buộc phải có dấu hiệu rõ ràng và validation message tại field. |
| FORM-UI-002 | Button `Submit` disabled khi đang submit để tránh double submit. |
| FORM-UI-003 | Password field có thể có show/hide password nếu phù hợp. |
| FORM-UI-004 | Form nhiều field phải nhóm theo section dễ hiểu. |
| FORM-UI-005 | Editor có dữ liệu chưa lưu phải cảnh báo khi user rời trang. |
| FORM-UI-006 | Date/time input phải thống nhất timezone hiển thị theo cấu hình hệ thống. |
| FORM-UI-007 | API validation error phải map được về field nếu backend trả `details`. |

## Table Requirements

Các màn hình Admin và Teacher sử dụng table nhiều, nên cần chuẩn hóa:

| Requirement ID | Nội dung |
| --- | --- |
| TABLE-UI-001 | Table có dữ liệu lớn phải có pagination. |
| TABLE-UI-002 | Table có filter/search phải giữ query trên URL nếu phù hợp để share/debug. |
| TABLE-UI-003 | Column action phải nhất quán: View, Edit, Archive, Revoke, Copy Link. |
| TABLE-UI-004 | Status phải hiển thị bằng text + badge, không chỉ dùng màu. |
| TABLE-UI-005 | Mobile có thể chuyển table thành card list để tránh tràn ngang. |
| TABLE-UI-006 | Sort mặc định phải theo nghiệp vụ, ví dụ Teacher Course Progress sort `processScore DESC`. |

## Button And Action Requirements

| Action type | UI behavior |
| --- | --- |
| Primary action | Chỉ nên có 1 primary action chính trên một khu vực. |
| Secondary action | Dùng cho Preview, Cancel, Back, Filter, Export. |
| Destructive action | Cần confirm dialog, màu cảnh báo, message rõ tác động. |
| Copy action | Sau khi copy phải có feedback `Đã copy`. |
| Submit action | Có loading state và chống double click. |
| Disabled action | Phải có lý do nếu user có thể không hiểu vì sao bị disabled. |

## Media Requirements

Áp dụng cho Lesson, Quiz Question, Assignment Attachment và Resource:

- Image phải có preview trước khi upload hoặc sau khi chọn.
- Video phải có title/file name và trạng thái upload.
- File upload phải validate type và size ở frontend trước khi gửi API.
- Media không bắt buộc trong câu hỏi trắc nghiệm, nhưng UI phải hỗ trợ thêm nếu Teacher cần.
- Khi media lỗi tải, UI phải hiển thị fallback message thay vì vỡ layout.

## Authentication State Requirements

| State | Hành vi |
| --- | --- |
| No token | Redirect về `/login` nếu route yêu cầu auth. |
| Access token expired | Gọi refresh token nếu API hỗ trợ. |
| Refresh failed | Logout và redirect `/login`. |
| Role changed | Refetch profile/permission và cập nhật navigation. |
| Account disabled | Logout hoặc hiển thị thông báo tài khoản không còn active. |

## Notification Requirements

- Notification icon hiển thị unread count nếu backend hỗ trợ.
- Student cần notification cho assignment mới, deadline gần tới, feedback mới.
- Teacher cần notification cho submission mới, Student late/missing, invitation/course events nếu có.
- Admin cần notification cho system events quan trọng, invitation status và audit/security warning.

## Acceptance Criteria

- Tất cả màn hình list có loading, empty và error state.
- Tất cả form có validation và submit loading.
- Các action nguy hiểm có confirm dialog.
- Các status quan trọng có badge kèm text.
- Mobile không bị tràn layout ở table/list chính.
- User không mất dữ liệu editor khi vô tình điều hướng ra khỏi form có thay đổi chưa lưu.
