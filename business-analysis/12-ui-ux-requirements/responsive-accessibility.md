# Responsive And Accessibility Requirements

## Mục Đích

Tài liệu này mô tả yêu cầu responsive và accessibility cho ReactJS application. Hệ thống phục vụ Student, Teacher và Admin nên giao diện phải sử dụng được trên nhiều kích thước màn hình, đặc biệt là Student học trên mobile và Teacher/Admin làm việc trên desktop.

## Breakpoints Đề Xuất

| Nhóm thiết bị | Kích thước tham khảo | Mục tiêu thiết kế |
| --- | --- | --- |
| Mobile | `<= 767px` | Student học, xem To-do, làm quiz, nộp assignment cơ bản. |
| Tablet | `768px - 1023px` | Student học tốt hơn, Teacher thao tác nhẹ. |
| Desktop | `>= 1024px` | Teacher/Admin quản trị, table, dashboard, analytics. |
| Wide Desktop | `>= 1440px` | Tối ưu dashboard nhiều cột nhưng không kéo text quá dài. |

## Responsive Requirements Chung

| Requirement ID | Nội dung |
| --- | --- |
| RESP-001 | Layout không được tràn ngang trên mobile, trừ trường hợp table có cơ chế scroll có chủ đích. |
| RESP-002 | Sidebar desktop phải chuyển thành drawer/mobile navigation trên mobile. |
| RESP-003 | Page title, action button và breadcrumb phải không đè lên nhau. |
| RESP-004 | Card/list item phải có chiều rộng co giãn theo container. |
| RESP-005 | Form field phải full-width trên mobile nếu không đủ không gian. |
| RESP-006 | Primary action phải dễ bấm trên mobile, không quá sát mép hoặc sát action nguy hiểm. |
| RESP-007 | Table quan trọng trên mobile nên chuyển thành card list nếu có nhiều cột. |
| RESP-008 | Lesson/Quiz media phải scale theo viewport và không che đáp án/action. |
| RESP-009 | Modal trên mobile phải gần full-screen nếu nội dung dài. |
| RESP-010 | Không dùng font size scale theo viewport width; dùng size ổn định theo design system. |

## Student Responsive Behavior

| Màn hình | Desktop | Mobile |
| --- | --- | --- |
| Student Dashboard | Có thể chia 2 cột: To-do chính và summary/deadline. | To-do nằm đầu trang, các summary xếp dọc. |
| Student To-do | List/table ngắn có filter. | Card list, action button rõ ràng. |
| Classroom Detail | Tabs hoặc navigation ngang. | Tabs có thể scroll ngang hoặc chuyển thành dropdown. |
| Lesson Player | Nội dung rộng, có sidebar outline nếu cần. | Nội dung một cột, Back/Next cố định ở vùng dễ thao tác nếu phù hợp. |
| Quiz Attempt | Câu hỏi và đáp án rõ, media không quá lớn. | Một câu hỏi một màn hình hoặc list dọc dễ cuộn, button submit không bị che. |
| Assignment Submission | Form và attachment list cạnh nhau nếu đủ rộng. | Form và upload xếp dọc, trạng thái upload rõ ràng. |

## Teacher Responsive Behavior

| Màn hình | Desktop | Mobile/Tablet |
| --- | --- | --- |
| Teacher Dashboard | Dashboard nhiều khu vực, quick actions rõ. | Tối giản thành list/card, ưu tiên action chính. |
| Course Detail Dashboard | Activities và Student Progress Ranking có thể nằm cùng trang. | Activities trước, progress table chuyển card hoặc scroll có nhãn rõ. |
| Quiz Builder | Có thể chia question list và editor. | Question list thành drawer/dropdown, editor full-width. |
| Gradebook | Table đầy đủ cột. | Cần horizontal scroll có header sticky hoặc card hóa dữ liệu chính. |
| Submission Management | Table/list có filter. | Card list theo Student, status và action chấm điểm. |

## Admin Responsive Behavior

Admin chủ yếu dùng desktop, nhưng vẫn cần usable trên tablet/mobile cho tác vụ khẩn cấp.

| Màn hình | Desktop | Mobile/Tablet |
| --- | --- | --- |
| Admin Dashboard | Metrics grid, audit/reports summary. | Metrics xếp dọc, chỉ hiển thị thông tin quan trọng. |
| User Lists | DataTable với filter, sort, pagination. | Card list hoặc table scroll có cột chính cố định nếu implement được. |
| Teacher Invitation | Form + generated link + history table. | Form trước, generated link dễ copy, history rút gọn. |
| Audit Log | Table nhiều filter. | Filter collapsed, log item dạng list. |
| Reports | Charts/table. | Summary trước, chart đơn giản, export action rõ. |

## Accessibility Requirements

| Requirement ID | Nội dung |
| --- | --- |
| A11Y-001 | Sử dụng semantic HTML: `button`, `form`, `label`, `nav`, `main`, `table` đúng ngữ cảnh. |
| A11Y-002 | Tất cả input phải có label hoặc accessible name. |
| A11Y-003 | Icon button phải có accessible label, ví dụ copy link, edit, delete, close. |
| A11Y-004 | Keyboard user phải tab được qua navigation, form, modal, table action và learning controls. |
| A11Y-005 | Modal phải trap focus và trả focus về button mở modal khi đóng. |
| A11Y-006 | Error message phải liên kết với field lỗi nếu có thể. |
| A11Y-007 | Status không được chỉ dùng màu; phải có text như `Late`, `Missing`, `Active`, `Revoked`. |
| A11Y-008 | Color contrast phải đủ đọc trên text, button, badge và error message. |
| A11Y-009 | Video/image trong lesson hoặc quiz cần alt text/title/caption nếu nội dung yêu cầu. |
| A11Y-010 | Toast quan trọng cần có cơ chế screen reader announcement nếu implement được. |

## Keyboard Navigation Requirements

| Khu vực | Yêu cầu |
| --- | --- |
| Login/Register | Tab theo thứ tự field, Enter submit form. |
| Sidebar/Header | Tab tới menu chính, active state rõ. |
| To-do List | Tab tới từng item/action, Enter mở activity. |
| Lesson Player | Có thể dùng button Previous/Next bằng keyboard. |
| Quiz | Có thể chọn đáp án bằng keyboard, submit bằng button rõ ràng. |
| Modal/Confirm | Focus nằm trong modal, Escape đóng nếu không làm mất dữ liệu nguy hiểm. |
| DataTable | Action trong từng row có thể focus và kích hoạt bằng keyboard. |

## Content And Text Requirements

- Nội dung tiếng Việt phải rõ ràng, ngắn gọn, tránh câu mơ hồ.
- Technical/domain term như Student, Teacher, Admin, Classroom, Course, Lesson, Quiz có thể giữ tiếng Anh để thống nhất tài liệu và code.
- Error message cần nói user nên làm gì tiếp theo.
- Không hiển thị raw error từ backend nếu message đó quá kỹ thuật hoặc chứa thông tin nhạy cảm.

## Media Accessibility

| Media type | Yêu cầu |
| --- | --- |
| Image trong question | Có alt text hoặc mô tả nếu ảnh chứa thông tin cần trả lời. |
| Video trong lesson/question | Có title rõ, controls dùng được bằng keyboard nếu dùng player custom. |
| Attachment | Hiển thị file name, type, size và trạng thái upload. |

## Acceptance Criteria

- Student có thể xem Dashboard, To-do, Lesson và Quiz trên mobile mà không bị tràn layout.
- Teacher có thể quản lý Course Dashboard và Quiz Builder trên desktop rõ ràng.
- Admin User Lists có pagination/filter và không hiển thị cột chồng chéo trên mobile.
- Tất cả form P0 có label, validation và keyboard submit.
- Tất cả action icon quan trọng có accessible label.
- Status quan trọng có text kèm màu/badge.
- Refresh layout ở các breakpoint mobile, tablet, desktop không làm mất action chính.
