# Teacher User Stories

## Mục Đích

Tài liệu này mô tả chi tiết user stories cho vai trò **Teacher** trong hệ thống **Microlearning Classroom LMS Platform**. Teacher là actor chính tạo Classroom, tạo Course, xây dựng nội dung microlearning, giao Quiz/Assignment, đặt deadline, theo dõi Student progress, chấm điểm và feedback.

## Teacher Journey Tổng Quan

```text
Kích hoạt account bằng invitation link
        ↓
Login Teacher Dashboard
        ↓
Tạo Classroom
        ↓
Chia sẻ Class Code / Invite Link
        ↓
Tạo Course, Module, Lesson, Flashcard, Quiz, Assignment, Resource
        ↓
Đặt deadline cho Lesson/Activity
        ↓
Publish content
        ↓
Theo dõi Student list, Progress Ranking, Submission
        ↓
Chấm điểm, feedback, return work
```

## Epic TCH-00 - Teacher Invitation Và Account Activation

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-INV-001 | Là Teacher, tôi muốn mở invitation link do Admin gửi thủ công để kích hoạt tài khoản. | Must | FR-006, FR-007 | Link hợp lệ hiển thị activation form; link hết hạn/revoked hiển thị lỗi rõ. |
| US-TCH-INV-002 | Là Teacher, tôi muốn tự tạo mật khẩu mới để Admin không biết mật khẩu của tôi. | Must | FR-007 | Password được hash; account chuyển `ACTIVE`; role là `TEACHER`. |
| US-TCH-INV-003 | Là Teacher, tôi muốn hệ thống kiểm tra email trong invitation để tránh người khác dùng link của tôi. | Must | FR-007 | Email nhập phải khớp email được mời; không khớp thì activation bị từ chối. |
| US-TCH-INV-004 | Là Teacher, tôi muốn được chuyển đến Teacher Dashboard sau khi kích hoạt thành công. | Must | FR-007, FR-001 | Sau activation login/redirect đúng dashboard hoặc yêu cầu login lại theo policy. |

## Epic TCH-01 - Teacher Dashboard

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-022 | Là Teacher, tôi muốn xem Teacher Dashboard để biết các Classroom/Course mình đang quản lý. | Must | FR-020, FR-026 | Dashboard hiển thị Classroom/Course owned, status, recent activity và quick actions. |
| US-TCH-023 | Là Teacher, tôi muốn tìm kiếm Classroom/Course để truy cập nhanh khi có nhiều lớp. | Should | FR-020, FR-026, FR-064 | Search theo title/name trả kết quả đúng; có empty state khi không tìm thấy. |
| US-TCH-024 | Là Teacher, tôi muốn lọc Classroom/Course theo status để tập trung vào lớp active hoặc archived. | Should | FR-020, FR-026, FR-064 | Filter active/archived/draft/published hoạt động đúng; danh sách có pagination nếu nhiều. |
| US-TCH-025 | Là Teacher, tôi muốn có quick action tạo Classroom, tạo Course hoặc tạo Announcement từ dashboard. | Should | FR-020, FR-026, FR-035 | Quick actions mở đúng form và giữ quyền theo role/status. |

## Epic TCH-02 - Classroom Management

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-001 | Là Teacher, tôi muốn tạo Classroom để tổ chức Student và learning content. | Must | FR-020 | Teacher `ACTIVE` tạo được Classroom với tên/mô tả hợp lệ; Classroom liên kết owner Teacher. |
| US-TCH-026 | Là Teacher, tôi muốn cập nhật thông tin Classroom để chỉnh tên, mô tả hoặc thông tin lớp. | Must | FR-020 | Chỉ Teacher owner/được phân quyền cập nhật; thay đổi được lưu và hiển thị cho Student phù hợp. |
| US-TCH-027 | Là Teacher, tôi muốn archive Classroom không còn sử dụng để danh sách lớp gọn hơn. | Must | FR-020 | Classroom archived không nhận join mới; dữ liệu Progress/Submission/Grade được giữ. |
| US-TCH-028 | Là Teacher, tôi muốn restore hoặc mở lại Classroom nếu policy cho phép. | Should | FR-020 | Classroom archived có thể restore nếu Teacher còn quyền và Admin policy cho phép. |
| US-TCH-029 | Là Teacher, tôi muốn xem Classroom detail để quản lý Stream, Classwork, People/Roster và Settings. | Must | FR-020, FR-024, FR-025, FR-051 | Classroom detail hiển thị các khu vực chính; Student chỉ thấy phần được publish/allowed. |

## Epic TCH-03 - Class Code Và Invite Link

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-002 | Là Teacher, tôi muốn tạo Class Code để Student tham gia Classroom của tôi. | Must | FR-021 | System tạo Class Code duy nhất cho Classroom active; code hoạt động nếu Admin policy cho phép. |
| US-TCH-030 | Là Teacher, tôi muốn copy Class Code để gửi cho Student qua kênh phù hợp. | Must | FR-021, FR-057 | Copy action rõ ràng; UI hiển thị success state; code không lộ nếu Teacher không có quyền. |
| US-TCH-031 | Là Teacher, tôi muốn reset/regenerate Class Code khi code cũ bị lộ hoặc dùng sai. | Must | FR-021, FR-025 | Code cũ vô hiệu; code mới join được; action được audit nếu cần. |
| US-TCH-003 | Là Teacher, tôi muốn tạo Invite Link để chia sẻ quyền truy cập Classroom dễ dàng. | Must | FR-022 | System tạo link hợp lệ nếu policy cho phép; link có thể copy. |
| US-TCH-032 | Là Teacher, tôi muốn tắt hoặc regenerate Invite Link khi không muốn Student mới dùng link cũ. | Must | FR-022, FR-025 | Link cũ không join được sau khi disabled/regenerated; Student cũ không bị remove. |
| US-TCH-033 | Là Teacher, tôi muốn biết join method nào bị Admin policy tắt để không hướng dẫn Student sai. | Must | FR-011, FR-025 | UI hiển thị disabled state nếu Class Code/Invite Link bị Admin tắt; Teacher không bật vượt policy. |

## Epic TCH-04 - Roster Và Student Management

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-008 | Là Teacher, tôi muốn xem Student roster để biết ai đã tham gia Classroom. | Must | FR-024 | Roster hiển thị Student name, email, status, joinedAt và progress summary nếu có. |
| US-TCH-034 | Là Teacher, tôi muốn tìm kiếm Student trong roster để xử lý nhanh khi lớp đông. | Must | FR-024, FR-064 | Search theo name/email/student code; pagination khi danh sách lớn. |
| US-TCH-035 | Là Teacher, tôi muốn lọc Student theo status để biết ai active, removed hoặc inactive. | Should | FR-024, FR-064 | Filter status trả đúng Student; removed Student không mất dữ liệu học tập cũ. |
| US-TCH-036 | Là Teacher, tôi muốn remove Student khỏi Classroom nếu tham gia nhầm hoặc không còn học. | Must | FR-024 | Remove cập nhật enrollment status; Student không truy cập content mới; progress/submission được giữ. |
| US-TCH-037 | Là Teacher, tôi muốn xem Student detail trong Classroom để kiểm tra progress, submission và grade của Student đó. | Must | FR-024, FR-060 | Teacher chỉ xem Student thuộc Classroom owned; hiển thị progress/quiz/submission liên quan. |

## Epic TCH-05 - Announcement Và Stream

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-015 | Là Teacher, tôi muốn đăng Announcement để thông báo nội dung quan trọng cho lớp. | Must | FR-035 | Announcement publish tới Student trong Classroom; có title/content hoặc body hợp lệ. |
| US-TCH-038 | Là Teacher, tôi muốn chỉnh sửa Announcement khi có sai sót. | Should | FR-035 | Chỉ Teacher owner/được quyền chỉnh sửa; updatedAt được cập nhật. |
| US-TCH-039 | Là Teacher, tôi muốn xóa hoặc archive Announcement không còn phù hợp. | Should | FR-035 | Announcement không còn hiển thị cho Student nếu bị archive/delete theo policy. |
| US-TCH-040 | Là Teacher, tôi muốn đính kèm resource hoặc link trong Announcement nếu cần. | Should | FR-032, FR-035 | Attachment/link được validate và Student trong Classroom mở được nếu có quyền. |

## Epic TCH-06 - Course Và Course Detail Dashboard

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-005 | Là Teacher, tôi muốn tạo Course trong Classroom để Student học nội dung được giao. | Must | FR-026 | Course được liên kết Classroom, owner Teacher và status `DRAFT` hoặc `PUBLISHED`. |
| US-TCH-041 | Là Teacher, tôi muốn cập nhật Course title, description và metadata để nội dung rõ ràng. | Must | FR-026 | Course update lưu đúng field; Student chỉ thấy Course publish/assigned. |
| US-TCH-042 | Là Teacher, tôi muốn publish/unpublish Course để kiểm soát thời điểm Student thấy nội dung. | Must | FR-026, FR-033 | Publish làm Course visible theo quyền; unpublish không xóa progress cũ. |
| US-TCH-043 | Là Teacher, tôi muốn archive Course không còn dùng để giữ dữ liệu nhưng giảm lộn xộn. | Should | FR-026, FR-033 | Course archived không hiển thị active list; dữ liệu cũ được giữ. |
| US-TCH-019 | Là Teacher, tôi muốn khi bấm vào Course của mình thì thấy Course Detail Dashboard hiển thị tất cả bài học và hoạt động đã tạo. | Must | FR-027 | Dashboard hiển thị Lesson, Quiz, Assignment, Resource theo Module/Topic, có status publish và deadline nếu có. |
| US-TCH-044 | Là Teacher, tôi muốn Course Dashboard hiển thị Course summary để biết tổng lesson, quiz, assignment, student và completion. | Must | FR-027, FR-060 | Summary cards/metrics đúng dữ liệu và cập nhật khi content/progress thay đổi. |
| US-TCH-045 | Là Teacher, tôi muốn Course Dashboard có tab/list bài học để quản lý toàn bộ activity trong Course. | Must | FR-027 | List hiển thị title, type, module, status, deadline, completion count và action edit/view. |
| US-TCH-046 | Là Teacher, tôi muốn Course Dashboard có Student list để xem ai đang học Course. | Must | FR-027, FR-024 | Student list lấy từ roster/assignment scope; có search/filter/pagination. |
| US-TCH-020 | Là Teacher, tôi muốn xem danh sách Student và điểm quá trình trong Course, được sắp xếp từ cao xuống thấp. | Must | FR-061, FR-063 | Progress table sort mặc định `processScore DESC`; hiển thị processScore, progress %, completed, missing/late. |
| US-TCH-047 | Là Teacher, tôi muốn lọc Progress Ranking theo status để tìm Student cần hỗ trợ. | Should | FR-060, FR-061, FR-064 | Filter not started/in progress/missing/late/low progress trả đúng danh sách. |

## Epic TCH-07 - Module, Topic, Lesson Và Deadline

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-010 | Là Teacher, tôi muốn tạo Module/Topic để tổ chức nội dung học theo chương hoặc chủ đề. | Must | FR-028 | Module/Topic có title/description/order và chứa content items. |
| US-TCH-048 | Là Teacher, tôi muốn sắp xếp lại Module/Topic để course flow hợp lý hơn. | Must | FR-028 | Order lưu đúng; Student thấy thứ tự mới nếu content publish. |
| US-TCH-006 | Là Teacher, tôi muốn tạo Micro Lesson để nội dung dễ tiếp thu với Student. | Must | FR-029 | Lesson lưu title/content/status và gắn Course/Module phù hợp. |
| US-TCH-049 | Là Teacher, tôi muốn chỉnh sửa Lesson khi cần cập nhật nội dung. | Must | FR-029 | Lesson update không làm mất progress cũ; Student thấy bản mới theo status. |
| US-TCH-050 | Là Teacher, tôi muốn preview Lesson như Student trước khi publish để kiểm tra trải nghiệm học. | Should | FR-034 | Preview hiển thị gần giống Student view, gồm media/resource nếu có. |
| US-TCH-051 | Là Teacher, tôi muốn publish/unpublish Lesson để kiểm soát visibility. | Must | FR-029, FR-033 | Student chỉ thấy Lesson publish/assigned; unpublish không xóa progress cũ. |
| US-TCH-021 | Là Teacher, tôi muốn đặt deadline hoàn thành cho từng Lesson khi tạo hoặc cập nhật Course content. | Must | FR-030 | Mỗi Lesson/Activity có thể có `completionDeadline`; deadline hiển thị cho Student To-do/Deadline View. |
| US-TCH-052 | Là Teacher, tôi muốn cập nhật hoặc xóa deadline nếu kế hoạch học thay đổi. | Must | FR-030 | Deadline mới lưu đúng; Student To-do/Calendar cập nhật; thay đổi có thể tạo notification nếu bật. |
| US-TCH-053 | Là Teacher, tôi muốn biết Lesson nào chưa có deadline để bổ sung nếu cần. | Should | FR-030, FR-027 | Course Dashboard hiển thị filter/status cho activity thiếu deadline. |

## Epic TCH-08 - Flashcard Và Learning Resource

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-011 | Là Teacher, tôi muốn tạo Flashcard để Student ôn tập nhanh trong Lesson. | Must | FR-031 | Flashcard có front/back hoặc question/answer; hiển thị đúng Lesson/Module. |
| US-TCH-054 | Là Teacher, tôi muốn chỉnh sửa hoặc xóa Flashcard khi nội dung chưa phù hợp. | Should | FR-031 | Chỉ Teacher có quyền được update/delete; Student thấy nội dung mới theo publish state. |
| US-TCH-055 | Là Teacher, tôi muốn thêm Learning Resource như PDF, image, video URL, link hoặc attachment để bổ sung tài liệu học. | Should | FR-032 | Resource lưu metadata, URL/provider, type, access scope; Student mở được nếu có quyền. |
| US-TCH-056 | Là Teacher, tôi muốn đánh dấu Resource là required hoặc optional để ảnh hưởng progress đúng. | Should | FR-032, FR-059 | Required resource có thể tính progress; optional resource không chặn completion nếu policy quy định. |
| US-TCH-057 | Là Teacher, tôi muốn xóa hoặc thay resource lỗi để Student không gặp link/file hỏng. | Should | FR-032 | Resource update/delete theo quyền; UI báo nếu resource đang được dùng. |

## Epic TCH-09 - Quiz Builder Và Question Media

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-007 | Là Teacher, tôi muốn tạo Quiz để đánh giá Student. | Must | FR-036 | Quiz có title/instruction/points/setting và được lưu dưới Course/Lesson. |
| US-TCH-058 | Là Teacher, tôi muốn cấu hình attempt limit, time limit, due date và scoring rule cho Quiz. | Must | FR-036 | Settings lưu đúng; Student view dùng đúng rule. |
| US-TCH-059 | Là Teacher, tôi muốn tạo câu hỏi `single_choice` để Student chọn một đáp án. | Must | FR-037 | Question có options, correct answer và points; auto-grade hoạt động. |
| US-TCH-060 | Là Teacher, tôi muốn tạo câu hỏi `multiple_choice` để Student chọn nhiều đáp án. | Must | FR-037 | Có nhiều correct answers; scoring rule rõ; validation không cho question thiếu option. |
| US-TCH-061 | Là Teacher, tôi muốn tạo câu hỏi `true_false` để kiểm tra kiến thức nhanh. | Must | FR-037 | Question có correct boolean answer; auto-grade hoạt động. |
| US-TCH-062 | Là Teacher, tôi muốn tạo câu hỏi `short_answer` để Student trả lời ngắn. | Must/Should | FR-037, FR-040 | Question lưu expected answer/rubric nếu có; attempt có thể pending manual review. |
| US-TCH-018 | Là Teacher, tôi muốn tùy chọn thêm image hoặc video vào câu hỏi Quiz để minh họa tình huống hoặc nội dung cần quan sát. | Should | FR-038 | Teacher có thể thêm, preview và xóa media; Student xem được media khi làm Quiz; question không media vẫn hợp lệ. |
| US-TCH-063 | Là Teacher, tôi muốn preview Quiz trước khi publish để kiểm tra câu hỏi, điểm và media. | Should | FR-034, FR-036, FR-038 | Preview hiển thị question order, options, media, instruction và settings. |
| US-TCH-064 | Là Teacher, tôi muốn publish/unpublish Quiz để kiểm soát khi nào Student làm được. | Must | FR-033, FR-036 | Quiz publish visible theo quyền; unpublish không xóa attempt đã nộp. |
| US-TCH-065 | Là Teacher, tôi muốn xem Quiz result và performance để biết Student hiểu bài đến đâu. | Must | FR-041 | Result hiển thị score theo Student, attempt time, câu đúng/sai, average score. |

## Epic TCH-10 - Assignment, Submission, Grading Và Feedback

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-012 | Là Teacher, tôi muốn tạo Assignment nhỏ để Student nộp bài luyện tập. | Must | FR-042 | Assignment có instruction, due date, max score, attachment và publish status. |
| US-TCH-066 | Là Teacher, tôi muốn chỉnh sửa Assignment khi instruction hoặc deadline thay đổi. | Must | FR-042 | Update lưu đúng; Student To-do/Calendar cập nhật nếu due date đổi. |
| US-TCH-067 | Là Teacher, tôi muốn cấu hình submission policy như text/file/link/mark as done để phù hợp bài tập. | Must | FR-042, FR-043 | Student chỉ thấy submission methods được bật. |
| US-TCH-013 | Là Teacher, tôi muốn xem Submission status để biết Student nào đã nộp, chưa nộp hoặc nộp trễ. | Must | FR-045 | Submission list hiển thị submitted, missing, late, graded, returned theo từng Student. |
| US-TCH-068 | Là Teacher, tôi muốn lọc Submission theo status để xử lý chấm bài nhanh hơn. | Must | FR-045, FR-064 | Filter submitted/missing/late/graded/returned hoạt động; có pagination. |
| US-TCH-069 | Là Teacher, tôi muốn mở từng Submission để xem nội dung, file, link và thời gian nộp. | Must | FR-045 | Submission detail hiển thị dữ liệu bài nộp và quyền truy cập file an toàn. |
| US-TCH-014 | Là Teacher, tôi muốn chấm điểm và gửi feedback để Student biết cần cải thiện gì. | Must | FR-046, FR-048 | Grade/feedback lưu đúng; Student thấy sau khi Teacher return. |
| US-TCH-070 | Là Teacher, tôi muốn return work sau khi chấm để công bố kết quả cho Student. | Must | FR-046 | Returned status cập nhật; Student nhận grade/feedback theo policy. |
| US-TCH-071 | Là Teacher, tôi muốn gửi private comment trong Assignment để trao đổi riêng với Student. | Should | FR-047 | Comment chỉ Teacher và Student liên quan xem được; không lộ cho Student khác. |

## Epic TCH-11 - Progress, Gradebook Và Analytics

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-016 | Là Teacher, tôi muốn xem dashboard tiến độ từng Student để phát hiện người cần hỗ trợ. | Must | FR-060 | Dashboard hiển thị progress %, completed lessons, quiz score, assignment status và last active. |
| US-TCH-072 | Là Teacher, tôi muốn xem Student có progress thấp hoặc quá hạn để hỗ trợ kịp thời. | Must | FR-060, FR-061 | Có filter/sort theo low progress, missing, late; dữ liệu đúng Course/Classroom. |
| US-TCH-073 | Là Teacher, tôi muốn xem `processScore` do system trả về để frontend không tự hard-code công thức. | Must | FR-063 | API trả processScore; UI hiển thị đúng; sort sử dụng dữ liệu backend. |
| US-TCH-074 | Là Teacher, tôi muốn xem Gradebook Basic để tổng hợp điểm Quiz/Assignment theo Student. | Should | FR-062 | Gradebook hiển thị Student, activities, score, status; filter/export nếu có quyền. |
| US-TCH-075 | Là Teacher, tôi muốn export report cơ bản nếu cần báo cáo hoặc lưu trữ. | Should | FR-018, FR-062 | Export phản ánh filter hiện tại và quyền truy cập. |

## Epic TCH-12 - Settings, Navigation Và UX

| ID | User Story | Priority | Related FR | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| US-TCH-017 | Là Teacher, tôi muốn quản lý Classroom Settings để kiểm soát Class Code, Invite Link và quyền comment. | Must | FR-025 | Teacher bật/tắt/reset Class Code và Invite Link trong phạm vi Admin policy; thay đổi lưu đúng. |
| US-TCH-076 | Là Teacher, tôi muốn các form tạo nội dung có draft/save state để không mất dữ liệu khi đang soạn. | Should | FR-029, FR-036, FR-042, FR-057 | Draft lưu khi Teacher bấm save; cảnh báo trước khi rời trang nếu có thay đổi chưa lưu. |
| US-TCH-077 | Là Teacher, tôi muốn có Back/breadcrumb trong Course, Lesson, Quiz, Assignment để quay lại đúng ngữ cảnh. | Must | FR-057 | Back/breadcrumb trả về Classroom/Course/list trước đó; không mất filter nếu có thể. |
| US-TCH-078 | Là Teacher, tôi muốn các bảng Student, Submission, Progress có search/filter/sort/pagination để xử lý lớp đông. | Must | FR-064 | Table không tải toàn bộ dữ liệu một lần; filter/sort đúng và ổn định. |
| US-TCH-079 | Là Teacher, tôi muốn thấy loading, empty và error state rõ ràng khi API đang tải hoặc lỗi. | Must | FR-065 | UI không bị trắng; có retry hoặc message phù hợp. |

## Teacher Story Notes

| Chủ đề | Ghi chú BA |
| --- | --- |
| Course Detail Dashboard | Đây là màn hình trung tâm sau khi Teacher bấm vào Course. |
| Progress Ranking | Mặc định sort `processScore DESC` để Teacher thấy Student có điểm quá trình cao trước, đồng thời có filter để tìm Student cần hỗ trợ. |
| Deadline | Deadline áp dụng cho Lesson/Activity và phải đồng bộ sang Student To-do/Calendar. |
| Quiz Media | Image/video trong câu hỏi là optional, không làm question không media trở nên invalid. |
| Admin Policy | Teacher không thể bật join method nếu Admin đã tắt ở cấp hệ thống. |
