# Kịch bản video demo đồ án Microlearning Classroom LMS

## Mục tiêu và phạm vi

Video này dành cho giảng viên, trình diễn các luồng nghiệp vụ chính đã triển khai từ Phase 02-06,
quyền của bốn vai trò và bằng chứng kiểm thử Phase 08 trên **môi trường local với dữ liệu giả lập**.
Thời lượng gợi ý là 55-65 phút; có thể chia thành hai video tại mốc 30 phút nếu nơi nộp bài giới
hạn dung lượng. Không cần quay cảnh chờ build, nhập biểu mẫu dài hoặc đọc từng dòng log.

Video là bằng chứng hỗ trợ nghiệm thu, không tự biến các ô `PENDING` trong
[local-uat-matrix.md](local-uat-matrix.md) thành `PASS`. Sau khi quay, chủ dự án vẫn ghi kết quả
thực tế, mốc thời gian và quyết định L4 vào bảng đó. Không giới thiệu ứng dụng là Production hay
cho rằng mọi người trên Internet đã truy cập được; phạm vi Phase 08 hiện là local-only.

## Chuẩn bị trước khi bấm ghi

- Mở Web `http://localhost:3300`, API `http://localhost:4300`, Swagger
  `http://localhost:4300/api-docs/`. Kiểm tra `/health`, `/ready` và
  `/api/v1/system/version`. Runtime hiện dùng candidate
  `d01f7b08a731c344950644382a4727787a8bad04`, `environment=test`; nếu khác thì dừng quay
  và kiểm tra lại stack. Không dùng Web `localhost:3000` vì stack đó báo `local-dev`.
- Chuẩn bị các phiên trình duyệt tách biệt cho `ADMIN`, `TEACHER`, `STUDENT`, `SUPER_ADMIN`.
  Tài khoản mẫu: `admin.active@example.test`, `teacher.active@example.test`,
  `student.active@example.test`, `student.active.2@example.test`,
  `student.active.4@example.test`, `superadmin.active@example.test`. Lấy mật khẩu demo local từ
  trao đổi riêng với chủ dự án; không đưa mật khẩu vào file này hay video.
- Chọn một hậu tố duy nhất, ví dụ `DEMO-<ngay>-01`, cho email Teacher mời mới, Classroom, Course,
  Lesson, Quiz và Assignment. Ghi lại tên và ID của tài nguyên mới **ngoài khung hình** để chuyển
  cảnh nhanh. Dùng dữ liệu giả lập; không dùng tên hoặc email sinh viên thật.
- Classroom mẫu `640000000000000000000001` và Course mẫu
  `650000000000000000000001` thuộc `teacher.active@example.test` và đã có
  `student.active@example.test` tham gia. Dùng chúng khi cần minh họa bài nộp/điểm có sẵn.
  Classroom tạo mới được dùng cho luồng join, Course/Lesson/Quiz/Assignment mới.
- Nếu video được dùng làm evidence cho `LOCAL-UAT-03/04`, quay thêm lần chạy với
  `student.active@example.test` trong Course mẫu theo [local-uat-matrix.md](local-uat-matrix.md).
  Demo trên lớp mới không tự thay thế fixture và kết quả quan sát bắt buộc của hai hàng UAT đó.
- Chuẩn bị cửa sổ GitHub Actions của PR hiện hành và bản báo cáo test local: run
  `P08-LOCAL-20260922T033616Z-18ded4` đạt `40/40`; smoke trên stack UAT đạt `6/6`.
  Kiểm tra trạng thái CI ngay trước khi quay, không dùng ảnh xanh cũ để khẳng định commit mới.
- Tắt thông báo cá nhân. Khi chuyển cảnh có Class Code, invitation URL, access token, cookie hay
  connection string, chỉ cho thấy trạng thái thành công; che phần giá trị một lần. Không quay
  Secret Manager, `.env`, MongoDB URI hoặc mật khẩu.

## Cách trình bày

Mỗi cảnh nên theo nhịp: **vai trò -> hành động -> kết quả trên UI -> quy tắc nghiệp vụ**. Dừng
vài giây ở màn hình kết quả để giảng viên đọc được. Nếu thao tác thất bại, không cắt bỏ rồi tuyên
bố thành công; ghi lại lỗi, thử lại trên dữ liệu sạch và đưa vào defect log. Các câu trong mục
`Lời dẫn` có thể đọc gần nguyên văn, nhưng nên nói tự nhiên.

### 00. Giới thiệu và xác nhận phiên bản (00:00-02:00)

- **Quay:** Màn hình đăng nhập, sau đó API `/api/v1/system/version`, `/ready` và Web `/health`.
- **Kết quả cần thấy:** Web/API hoạt động, commit và `environment=test` đúng bản đang demo.
- **Lời dẫn:** "Em là Trần Đức Toàn, MSSV 2351010210. Đây là Microlearning Classroom LMS,
  ứng dụng quản lý lớp học và học tập ngắn cho Student, Teacher, Admin và Super Admin. Video dùng
  môi trường local với dữ liệu giả lập. Em sẽ đi theo một luồng từ tạo lớp đến học, nộp bài,
  chấm điểm và báo cáo."

### 01. Đăng ký, đăng nhập và hồ sơ Student (02:00-05:00)

- **Quay:** Mở `/register`, tạo một Student với email giả lập duy nhất; đăng nhập; mở `/profile`,
  sửa họ tên; đăng xuất và thử mở lại `/profile`.
- **Kết quả cần thấy:** Đăng ký/đăng nhập thành công; tên mới lưu được; trang được bảo vệ yêu cầu
  đăng nhập sau logout. Không hiển thị mật khẩu khi nhập.
- **Lời dẫn:** "Student có thể tự đăng ký. Phiên đăng nhập và trang cá nhân được kiểm soát theo
  trạng thái tài khoản; sau khi đăng xuất không thể tiếp tục dùng trang riêng."
- **Đối chiếu:** `UC-001/002/047/049/050`, `LOCAL-UAT-01`.

### 02. Admin mời Teacher thủ công (05:00-09:00)

- **Quay:** Đăng nhập Admin, mở `Lời mời Teacher`, tạo lời mời cho email giả lập mới, chọn hạn
  hiệu lực, bấm sao chép theo kênh giao thủ công. Cắt/che khung hình chứa token. Trong phiên riêng,
  mở lời mời, kích hoạt Teacher, đăng nhập; quay lại Admin và tìm email trong danh sách Teacher.
- **Kết quả cần thấy:** Lời mời được tạo, Teacher kích hoạt và xuất hiện trong danh sách; link
  dùng một lần không còn hiển thị sau khi đóng.
- **Lời dẫn:** "Teacher không tự chọn vai trò để đăng ký. Admin cấp lời mời có hạn và gửi bằng
  cách sao chép thủ công; hệ thống ghi nhận thao tác quản trị."
- **Đối chiếu:** `UC-026/027/051`, `LOCAL-UAT-07`.

### 03. Teacher tạo Classroom và quyền tham gia (09:00-13:00)

- **Quay:** Dùng `teacher.active@example.test`, vào `/teacher/dashboard`, tạo Classroom mới với
  tên gắn hậu tố demo; mở chi tiết lớp, trạng thái và tab quyền tham gia. Tạo Class Code và Invite
  Link; không để giá trị đầy đủ trên bản ghi hình.
- **Kết quả cần thấy:** Lớp mới nằm trong danh sách Teacher; mã/link chỉ được trao một lần và có
  trạng thái quản lý. Teacher chỉ thao tác được với lớp của mình.
- **Lời dẫn:** "Classroom là phạm vi sở hữu của Teacher. Hai cách mời Student là mã lớp và đường
  dẫn, đều đi qua chính sách enrollment của hệ thống."
- **Đối chiếu:** `UC-003/004/005/024`, `LOCAL-UAT-05`.

### 04. Student tham gia bằng mã và link (13:00-17:00)

- **Quay:** Đăng nhập `student.active.4@example.test`, nhập mã của lớp mới, vào chi tiết lớp;
  thử nhập lại cùng mã. Dùng `student.active.2@example.test` trong phiên riêng để mở Invite Link,
  đăng nhập nếu được hỏi rồi tham gia.
- **Kết quả cần thấy:** Mỗi Student có đúng một membership; lần nhập lại không tạo enrollment
  trùng. Link mời không còn token trong URL sau khi ứng dụng xử lý. Không dùng mã bị che của lớp
  seed vì không thể khôi phục giá trị thật từ bản masked.
- **Lời dẫn:** "Server xử lý join lặp một cách idempotent; link mời không được giữ lại trong URL
  hiển thị sau khi dùng."
- **Đối chiếu:** `UC-006/007/052/053`, `LOCAL-UAT-02/10`.

### 05. Teacher biên soạn và xuất bản nội dung (17:00-24:00)

- **Quay:** Trở lại Classroom mới, tạo Course mới; trong `Quản lý nội dung` thêm Module, tạo
  Lesson ngắn có Markdown, thời lượng, deadline tương lai và cờ bắt buộc; thêm hai Flashcard;
  xem Preview rồi publish Module, Lesson và Course theo thứ tự UI yêu cầu. Mở Course dashboard.
- **Kết quả cần thấy:** Course/Module/Lesson đi từ draft sang published; nội dung và thứ tự
  Flashcard đúng; deadline hiện trên bài học; dashboard phản ánh số nội dung đã xuất bản.
- **Lời dẫn:** "Teacher soạn nội dung theo cấu trúc Course, Module, micro-lesson. Student chỉ
  thấy nội dung đã phát hành và thuộc lớp mình tham gia."
- **Đối chiếu:** `UC-011/012/017/018/044/046`, `LOCAL-UAT-05`.

### 06. Thông báo và trải nghiệm học của Student (24:00-29:00)

- **Quay:** Teacher tạo bản nháp Announcement rồi publish trong lớp mới. Student `.4` mở
  Stream và Classwork, thấy thông báo/Course/Lesson; vào To-do, mở Lesson, lật Flashcard,
  bắt đầu và hoàn thành bài; mở lại To-do, Deadlines, `/student/progress`.
- **Kết quả cần thấy:** Chỉ thông báo published hiện với Student; Lesson biến khỏi To-do còn
  hoạt động sau khi hoàn thành; tiến độ cập nhật; các liên kết quay lại/trước/sau không gãy.
- **Lời dẫn:** "Student có một danh sách việc cần làm thống nhất. Hoàn thành Lesson cập nhật
  progress, không phải chỉ đổi màu ở giao diện."
- **Đối chiếu:** `UC-009/020/041/042/043/053/054/058/059`, `LOCAL-UAT-03`.

### 07. Quiz: tạo, làm, lưu và xem kết quả (29:00-35:00)

- **Quay:** Teacher tạo Quiz một câu trắc nghiệm trong Course mới; đặt hạn tương lai, số lượt
  làm, thời gian và chính sách công bố kết quả ngay; thêm đáp án `201 Created`, Preview rồi
  publish. Student `.4` mở Quiz, bắt đầu, chọn đáp án, `Lưu bài`, tải lại trang để thấy câu trả
  lời còn đó, sau đó nộp và xác nhận. Mở kết quả của chính Student.
- **Kết quả cần thấy:** Đáp án lưu/resume được; nộp một lần; kết quả chỉ xuất hiện theo release
  policy; Student không nhìn thấy answer key/rubric trước thời điểm cho phép.
- **Lời dẫn:** "Quiz lưu bài làm trên server; hệ thống chấm câu hỏi khách quan và áp dụng giới
  hạn lượt làm cùng chính sách công bố kết quả."
- **Đối chiếu:** `UC-010/061/062`, `LOCAL-UAT-04`.

### 08. Assignment: giao bài, nộp và nộp lại (35:00-41:00)

- **Quay:** Teacher tạo Assignment kiểu `TEXT` trong Course mới, bật chính sách hủy nộp/nộp
  lại, đặt hạn rồi publish. Student `.4` nhập nội dung giả lập, lưu nháp, nộp, hủy nộp và nộp
  lại. Teacher mở danh sách bài nộp của Assignment đó.
- **Kết quả cần thấy:** Có một submission hiện hành, lịch sử phiên bản được giữ; Teacher thấy
  trạng thái nộp và Student của lớp; thao tác lặp không tạo bản nộp hiện hành thứ hai.
- **Lời dẫn:** "Bản nháp khác với bài đã nộp. Hủy nộp hoặc nộp lại chịu ràng buộc policy và
  giữ lịch sử để chấm điểm có thể truy vết."
- **Đối chiếu:** `UC-019/021/056`, `LOCAL-UAT-04/10`.

### 09. Teacher review, chấm lại và deadline cá nhân (41:00-47:00)

- **Quay:** Trong Course mẫu đã seed, mở Quiz `Review thiết kế API an toàn` để minh họa review
  câu trả lời ngắn; mở bài `Thiết kế REST Endpoint` đã trả điểm, chấm lại với lý do và phản hồi;
  quay về Gradebook để thấy điểm đổi. Mở deadline exception mẫu và lịch sử thay đổi.
- **Kết quả cần thấy:** Review/regrade có score, feedback, lý do và history; Gradebook cùng
  Student Grade detail phản ánh current returned grade; deadline riêng không đổi hạn của toàn lớp.
- **Lời dẫn:** "Kết quả thủ công chỉ được công bố sau review. Chấm lại không xóa lịch sử cũ;
  gia hạn cá nhân là ngoại lệ cho đúng Student, không sửa deadline chung."
- **Đối chiếu:** `UC-022/046/062/063`, `LOCAL-UAT-06`.

### 10. Student, Teacher và Admin xem báo cáo đúng phạm vi (47:00-52:00)

- **Quay:** Student `student.active@example.test` mở Dashboard, To-do, Progress và Grades của
  mình. Teacher mở Course dashboard, ranking/analytics, Gradebook, bộ lọc và Student detail của
  Course sở hữu. Admin mở Dashboard và `Báo cáo quản trị`, lọc Role, xem Audit Log.
- **Kết quả cần thấy:** Student chỉ thấy tiến độ/điểm của mình; Teacher thấy số liệu lớp mình;
  Admin thấy aggregate/metadata, không thấy raw answer hoặc nội dung bài nộp riêng tư.
- **Lời dẫn:** "Phase 06 tổng hợp dữ liệu từ học tập và đánh giá nhưng vẫn giữ phân quyền theo
  owner và quyền riêng tư của Student."
- **Đối chiếu:** `UC-015/023/025/036/037/045/057/058/063`, `LOCAL-UAT-03/06/07`.

### 11. Quản trị và Super Admin (52:00-56:00)

- **Quay:** Admin mở danh sách Student/Teacher, chi tiết một user giả lập, danh sách
  Classroom/Course và Enrollment Policy; nếu thay đổi policy để minh họa, bật lại giá trị ban
  đầu **trước** khi rời cảnh. Mở `/admin/users/admins` bằng cả Admin và Super Admin để cho thấy
  cả hai đều có quyền xem danh sách. Trong chi tiết tài khoản giả lập, đối chiếu nút đổi vai trò:
  chỉ Super Admin có hành động này. Không xác nhận đổi vai trò thật trong video.
- **Kết quả cần thấy:** Cả hai vai trò xem được danh sách Admin, nhưng Admin thường không có
  quyền đổi vai trò; backend cũng từ chối thao tác này nếu gọi trực tiếp. Các báo cáo không vượt
  phạm vi dữ liệu đã cấp.
- **Lời dẫn:** "Role cao hơn không có nghĩa bỏ qua audit hay xem câu trả lời riêng tư. Quyền
  route và quyền dữ liệu đều được kiểm tra tại backend."
- **Đối chiếu:** `UC-014/025/028/030/031/032/065/066/067/071`, `LOCAL-UAT-07/08`.

### 12. Negative test và bảo mật (56:00-60:00)

- **Quay:** Thoát phiên rồi thử vào trang được bảo vệ; dùng Student mở route Admin; dùng
  Teacher mở Gradebook của Course không sở hữu; nhập payload đăng nhập sai định dạng. Hiện
  báo cáo Playwright/CI cho các HTTP `401/403/404/422` và trường hợp join lặp. Không quay
  bearer token, cookie value hoặc tài nguyên của người khác.
- **Kết quả cần thấy:** Guest bị yêu cầu đăng nhập, role sai bị từ chối, tài nguyên không thuộc
  quyền không lộ dữ liệu, input sai có validation error, retry không tạo dữ liệu trùng.
- **Lời dẫn:** "Bảo mật không chỉ là ẩn menu. API vẫn xác thực, kiểm tra role và ownership,
  validate payload; lỗi trả về có cấu trúc để frontend xử lý."
- **Đối chiếu:** `UC-050/072/073/079`, `LOCAL-UAT-09/10`.

### 13. API, kiểm thử và kết luận (60:00-63:00)

- **Quay:** Mở Swagger `/api-docs/`, một endpoint và schema response; quay lại
  `/api/v1/system/version`, báo cáo local `40/40`, smoke `6/6`, các check CI mới nhất. Kết thúc
  bằng màn hình Dashboard của một vai trò.
- **Kết quả cần thấy:** Hợp đồng API tra cứu được; commit runtime trùng bản được test; các
  check bắt buộc xanh. `Staging Terraform plan` có thể `skipped` theo scope local, không gọi là
  Production PASS.
- **Lời dẫn:** "Ứng dụng chạy local bằng Docker Compose, API có OpenAPI, kiểm thử tự động và
  CI. Phạm vi nghiệm thu hiện tại là local academic demo; Production deployment được hoãn,
  không phải một phần đã hoàn thành trong video này."
- **Đối chiếu:** `UC-016/074/076`, Phase 08 L0-L3. L4 chỉ hoàn thành khi chủ dự án ghi
  nghiệm thu thủ công.

## Danh sách kiểm tra sau khi quay

- [ ] Video có cảnh thành công **và** negative path, không chỉ lướt qua dashboard.
- [ ] Tên Classroom/Course/Quiz/Assignment trong các cảnh nối được với nhau; cảnh dùng fixture
      seed được giới thiệu rõ, không giả vờ là dữ liệu mới vừa tạo.
- [ ] Không lộ mật khẩu, token, full invitation URL, Class Code một lần, MongoDB URI, `.env`,
      cookie value hoặc dữ liệu cá nhân thật.
- [ ] Âm thanh rõ, chữ UI đọc được; khi chuyển vai trò có nhãn `Student/Teacher/Admin/Super Admin`.
- [ ] URL/version trong video khớp bản được test; không gắn nhãn `100%` trước khi hoàn tất L4.
- [ ] Ghi mốc video và kết quả thực tế vào từng hàng `LOCAL-UAT-01` đến `LOCAL-UAT-10`; lỗi
      quan sát được có defect/retest. Chỉ sau đó mới ghi quyết định, thời gian UTC và chủ thể ký.
- [ ] Với `LOCAL-UAT-03/04`, có cảnh bổ sung trên Course mẫu và Student seed; không dùng riêng
      cảnh lớp mới để đánh dấu hai hàng này `PASS`.

## Ngoài phạm vi video này

Không demo hoặc tuyên bố đã hoàn thành những thứ chưa bật trong bản local: thanh toán, email
tự động, file upload/media nâng cao, AI grading, các luồng export/analytics chưa khả dụng
trong bản demo, ứng dụng mobile native hoặc Production Cloud Run. BA có thể ghi chúng như tham chiếu,
`Should/Could` hoặc kế hoạch tương lai; video chỉ nói về hành vi thực tế của phiên bản đang chạy.
