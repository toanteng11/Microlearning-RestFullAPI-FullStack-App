# Business Rules Catalog

## Mục Đích

Đây là catalog chính thức của Business Rules cho dự án. Các mã `BR-001` đến `BR-035` được giữ nguyên để bảo toàn traceability hiện có. Rule chi tiết, decision table và governance được tách sang các file cùng thư mục.

| Rule ID | Rule tóm tắt | Priority | Domain |
| --- | --- | --- | --- |
| BR-001 | Student phải authenticated trước khi tham gia Classroom. | Must | Access/Join |
| BR-001A | Public registration chỉ được tạo account `STUDENT` `ACTIVE`; client không được tự chọn role/status hoặc dùng endpoint này để tạo Teacher/Admin/Super Admin. | Must | Registration/Security |
| BR-001B | Student registration không tự tạo session, Enrollment, Progress hoặc To-do; Student phải Login thành công trước khi gửi join request. | Must | Registration/Access/Join |
| BR-001C | Nếu registration bắt đầu từ Invite Link, system có thể giữ join context an toàn nhưng phải validate lại toàn bộ token/policy/Classroom sau Login. | Must | Registration/Join/Security |
| BR-002 | Student chỉ có thể tham gia Classroom thông qua Class Code hoặc Invite Link hợp lệ. | Must | Join |
| BR-003 | Student chỉ có thể truy cập các Classroom đã tham gia hoặc được phép xem. | Must | Access |
| BR-004 | Teacher chỉ có thể quản lý Classroom do mình sở hữu, trừ khi được cấp admin permission. | Must | Access |
| BR-005 | Student chỉ có thể hoàn thành Lesson được assign trong Classroom active đã tham gia. | Must | Learning |
| BR-006 | Course được xem là hoàn thành khi tất cả required Lesson và Quiz được hoàn thành theo rules của Teacher. | Must | Learning |
| BR-007 | Quiz attempt phải được liên kết với Student, Quiz, Course và Classroom. | Must | Assessment |
| BR-008 | Teacher là actor chính tạo và cập nhật learning content; Admin chỉ can thiệp nội dung khi có governance/override permission rõ ràng. | Must | Content |
| BR-009 | Chỉ Admin mới có thể quản lý user roles. | Must | Admin |
| BR-010 | Admin không được tạo hoặc biết mật khẩu của Teacher. | Must | Invitation/Security |
| BR-011 | Teacher account được kích hoạt thông qua invitation link do Admin tạo, copy và gửi thủ công. | Must | Invitation |
| BR-012 | Invitation token chỉ được sử dụng một lần và phải có thời hạn. | Must | Invitation |
| BR-013 | Sau khi Teacher accept invitation thành công, account phải có `Role = TEACHER` và `Status = ACTIVE`. | Must | Invitation |
| BR-014 | Password của Teacher phải được hash trước khi lưu và không được gửi qua email. | Must | Security |
| BR-014A | System không bắt buộc gửi Teacher invitation qua email tự động trong MVP; delivery method mặc định là `MANUAL_COPY`. | Must | Invitation |
| BR-014B | Invitation link phải ràng buộc với email Teacher được mời; Teacher nhập email khác thì không thể kích hoạt account. | Must | Invitation |
| BR-014C | Admin có thể gửi invitation link qua email cá nhân, Zalo, Facebook, Messenger, Teams hoặc kênh ngoài hệ thống, nhưng token vẫn phải one-time và có thời hạn. | Must | Invitation |
| BR-015 | Account có status `BLOCKED` không được login hoặc gọi API nghiệp vụ. | Must | Access |
| BR-016 | Chỉ account có `Role = TEACHER` và `Status = ACTIVE` mới được tạo Classroom theo policy mặc định. | Must | Classroom |
| BR-017 | Policy join Classroom ở cấp hệ thống có độ ưu tiên cao hơn Classroom settings. | Must | Join |
| BR-018 | Nếu Admin tắt Class Code Join, tất cả Class Code active không thể dùng để join. | Must | Join |
| BR-019 | Nếu Admin tắt Invite Link, link/token tương ứng phải bị từ chối khi Student truy cập. | Must | Join |
| BR-020 | Việc đổi role, khóa account, mở khóa account và chuyển Classroom ownership phải ghi AuditLog. | Must | Audit |
| BR-021 | Chỉ Super Admin hoặc Admin có permission phù hợp mới được quản lý role nhạy cảm. | Must | Admin |
| BR-022 | Admin không nên xóa cứng user đã có Submission, Grade, Progress hoặc AuditLog. | Must | Data Governance |
| BR-023 | Khi chuyển Classroom ownership, Teacher mới phải có `Role = TEACHER` và `Status = ACTIVE`. | Must | Admin |
| BR-024 | Khi khóa Teacher còn Classroom active, hệ thống phải cảnh báo và yêu cầu transfer/archive trước. | Should | Admin |
| BR-025 | File upload phải được validate theo file type, file size và policy hệ thống. | Should | Content/Media |
| BR-026 | System configuration nhạy cảm chỉ được thay đổi bởi Super Admin hoặc Admin được cấp quyền. | Must | Admin |
| BR-027 | Mọi thay đổi system settings phải được ghi AuditLog. | Must | Audit |
| BR-028 | AuditLog không được cho phép user thường chỉnh sửa hoặc xóa. | Must | Audit |
| BR-029 | Student Dashboard phải hiển thị To-do gồm Lesson, Quiz hoặc Assignment chưa hoàn thành từ Classroom Student đã tham gia; Material chỉ được đưa vào To-do khi Resource Management được bật và Material được đánh dấu required/actionable. | Must | Learning |
| BR-030 | Các màn hình học tập chính phải có Back, Previous, Next, breadcrumb hoặc return link để user không mất ngữ cảnh. | Must | Navigation |
| BR-031 | Image/video trong Quiz Question là tùy chọn; Question không có media vẫn hợp lệ nếu đáp ứng nội dung, đáp án và scoring rule. | Should | Assessment |
| BR-032 | Media Quiz Question phải tuân file policy, allowed type, max size và access control của Classroom/Quiz. | Should | Content/Media |
| BR-033 | Khi Teacher mở Course, hệ thống phải hiển thị Course Detail Dashboard gồm Lesson/Activity list, Student list, progress ranking và deadline. | Must | Reporting |
| BR-034 | Bảng điểm quá trình trong Course mặc định sắp xếp Student theo `processScore DESC`. | Must | Learning/Reporting |
| BR-035 | Teacher phải đặt deadline cho từng Lesson/Activity; deadline đồng bộ sang Student To-do và Deadline View. | Must | Deadline |
| BR-036 | Mọi action nghiệp vụ protected chỉ thực hiện khi account `ACTIVE`, role/permission hợp lệ và session/token hợp lệ. | Must | Access |
| BR-037 | Account `PENDING`, `INACTIVE`, `BLOCKED` hoặc `DELETED` không được thực hiện API nghiệp vụ, dù role vẫn tồn tại. | Must | Access |
| BR-038 | User không được tự cấp role/permission cao hơn hoặc thay đổi status/role của chính mình theo cách tăng quyền. | Must | Access/Admin |
| BR-039 | Permission theo role không thay thế object-level authorization; Teacher/Student phải sở hữu hoặc thuộc resource scope hợp lệ. | Must | Access |
| BR-040 | Request bị từ chối quyền không được trả dữ liệu nhạy cảm hoặc xác nhận tồn tại resource ngoài scope khi policy an toàn yêu cầu. | Must | Security |
| BR-041 | Deactivate/block/delete mềm account không được xóa Submission, Grade, Progress, Enrollment history hoặc AuditLog liên quan. | Must | Data Governance |
| BR-042 | Email dùng cho Teacher Invitation phải normalize và validate; không tạo invitation mới cho Teacher account đang `ACTIVE` nếu không có override policy. | Must | Invitation |
| BR-043 | Một email chỉ có tối đa một Teacher Invitation `PENDING` còn hiệu lực; Admin phải revoke/expire invitation cũ trước khi tạo invitation mới. | Must | Invitation |
| BR-044 | Raw invitation token/link chỉ trả cho Admin ở thời điểm tạo/copy theo permission; database chỉ lưu token hash, không lưu raw token. | Must | Invitation/Security |
| BR-045 | Accept invitation là atomic: token/email/password validation, create/activate Teacher và mark invitation `ACCEPTED` cùng thành công hoặc không trạng thái nào bị cập nhật. | Must | Invitation |
| BR-046 | Invitation chỉ revoke được khi `PENDING`; invitation `ACCEPTED`, `EXPIRED` hoặc `REVOKED` không được accept lại. | Must | Invitation |
| BR-047 | Invitation hết hạn phải bị từ chối tại thời điểm mở/accept và được thể hiện `EXPIRED` để audit, không gia hạn ngầm. | Must | Invitation |
| BR-048 | `MANUAL_COPY` chỉ ghi nhận link đã được tạo/copy, không xác nhận email/Zalo/Facebook/Teams đã gửi hoặc người nhận đã đọc. | Must | Invitation |
| BR-049 | Error của invitation không được lộ raw token, password hoặc trạng thái account không cần thiết cho Guest. | Must | Invitation/Security |
| BR-050 | Chỉ Student `ACTIVE` mới join Classroom; Classroom phải `ACTIVE` và enrollment policy phải cho phép. | Must | Join |
| BR-051 | Thứ tự policy join là system policy -> Classroom setting -> token/code state/expiry -> Student/enrollment state; policy phía trước phủ định thì không xét tiếp. | Must | Join |
| BR-052 | Class Code hoặc Invite Link token chỉ hợp lệ khi đúng Classroom, active, chưa hết hạn nếu có expiry và đúng join method. | Must | Join |
| BR-053 | Không được có hai Enrollment `ACTIVE` cho cùng cặp Student và Classroom. | Must | Join/Data |
| BR-054 | Student có Enrollment `REMOVED`/`LEFT` không tự join lại theo mặc định; Teacher/Admin chỉ được mở lại quyền rejoin, sau đó Student vẫn phải dùng Class Code hoặc Invite Link hợp lệ. | Should | Join |
| BR-055 | Enrollment thành công phải lưu `joinedBy`, time, source token/code reference an toàn khi có và AuditLog/event phù hợp. | Must | Join/Audit |
| BR-056 | Join failure không được tạo Enrollment, To-do, notification hoặc progress summary partial. | Must | Join/Data |
| BR-057 | Khi Classroom bị `ARCHIVED` hoặc `LOCKED`, Student không join mới; quyền xem dữ liệu lịch sử tuân theo status/policy. | Must | Join/Classroom |
| BR-058 | Course, Module, Lesson, Quiz, Assignment dùng lifecycle `DRAFT`, `SCHEDULED` nếu hỗ trợ, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`; transition phải được authorize. | Must | Content |
| BR-059 | Content `DRAFT`, `UNPUBLISHED` hoặc `ARCHIVED` không xuất hiện như activity học mới cho Student; historical record được giữ theo policy. | Must | Content |
| BR-060 | Teacher chỉ publish Content khi Classroom/Course active, owner/scope hợp lệ và dữ liệu bắt buộc của content type đã valid. | Must | Content |
| BR-061 | Lesson `PUBLISHED`/assigned bắt buộc có `completionDeadline` theo MVP policy; Lesson `DRAFT` có thể chưa có deadline. | Must | Content/Deadline |
| BR-062 | Thứ tự Module/Activity Student thấy phải theo `displayOrder` do Teacher quản lý; navigation Previous/Next không vượt scope/visibility. | Must | Content/Navigation |
| BR-063 | Content đã có Progress, Attempt, Submission hoặc Grade không được hard delete; dùng archive/unpublish/version/controlled change. | Must | Content/Data |
| BR-064 | Thay đổi published Question correct answer, points, required status hoặc scoring policy sau khi có attempt/submission phải được review, preserve history và trigger recalculation/regrade theo policy. | Must | Content/Assessment |
| BR-065 | Media chỉ được gắn vào resource khi uploader có quyền resource; object/file private mặc định và chỉ reader thuộc scope mới xem được. | Must | Media/Security |
| BR-066 | Published Content phải dùng dữ liệu/version đã persisted; client không được hiển thị draft local data như đã publish. | Must | Content |
| BR-067 | Course/Module/Activity `ARCHIVED` không được tạo new learning mutation, trừ restore/override authorized; lịch sử vẫn đọc theo scope. | Must | Content |
| BR-068 | Announcement/Resource/Material chỉ hiển thị cho Student khi thuộc Classroom enrolled và status/visibility cho phép. | Must | Content |
| BR-069 | LearningProgress chỉ tạo/cập nhật cho Student có Enrollment `ACTIVE`, content visible và activity thuộc Classroom/Course scope đó. | Must | Learning |
| BR-070 | Student To-do chỉ chứa activity actionable/pending thuộc enrollment active; completed/valid submitted item rời To-do chính nhưng vẫn có trong history/report. | Must | Learning |
| BR-071 | Late/Missing phải tính từ deadline, completion/submission time và late-submission policy: quá deadline chưa có completion hợp lệ là `MISSING`; hoàn thành/nộp sau deadline được đánh dấu `LATE`. | Must | Learning/Deadline |
| BR-072 | Completion phải idempotent; retry/double click không được tạo duplicate Progress, To-do hoặc process score. | Must | Learning/Data |
| BR-073 | Course completion chỉ khi tất cả required activity thỏa completion policy; score threshold chỉ áp dụng khi Course policy đã cấu hình rõ. | Must | Learning |
| BR-074 | `progressPercentage`, `processScore`, late/missing và ranking được backend/service tính; frontend chỉ hiển thị result. | Must | Learning/Reporting |
| BR-075 | Teacher reset deadline chỉ trong Course mình quản lý; Lesson published/assigned bắt buộc có reason. | Must | Deadline |
| BR-076 | Gia hạn deadline có hiệu lực cho Student scope affected; deadline mới không được nhỏ hơn current time trừ authorized exception được ghi reason/audit. | Must | Deadline |
| BR-077 | Không được rút ngắn deadline published/assigned khi đã có Student affected theo mặc định; thay đổi bất lợi cần override policy, reason/audit và communication review. | Should | Deadline |
| BR-078 | Reset deadline phải lưu old/new deadline, actor, time, reason và AuditLog; không overwrite mất lịch sử. | Must | Deadline/Audit |
| BR-079 | Sau deadline reset, To-do, Calendar, late/missing, CourseProgressSummary và report scope liên quan phải recalculate; không xóa Progress/Attempt/Submission cũ. | Must | Deadline/Learning |
| BR-080 | Lesson/Activity archived không reset deadline; phải restore hoặc dùng authorized override theo policy. | Must | Deadline/Content |
| BR-081 | Teacher Course Progress Ranking mặc định `processScore DESC`; tie-break dùng `progressPercentage DESC`, rồi `lastActiveAt DESC`, rồi stable Student identifier ASC. | Should | Reporting |
| BR-082 | Student needing support là rule-based indicator (missing/late/low progress/inactivity threshold) có lý do hiển thị; không phải nhãn đánh giá năng lực. | Should | Reporting |
| BR-083 | Quiz chỉ publish khi có ít nhất một Question hợp lệ; Question choice phải có option/correct answer theo type, Question media là optional. | Must | Assessment |
| BR-084 | Quiz attempt chỉ được start khi Student có scope/visibility hợp lệ và chưa vượt `attemptLimit`; attempt number phải tăng tuần tự cho Student/Quiz. | Must | Assessment |
| BR-085 | Mỗi QuizAttempt gắn duy nhất Student, Quiz, Course, Classroom và attempt number; không chuyển attempt giữa Student/Course/Classroom. | Must | Assessment/Data |
| BR-086 | Nếu Quiz có time limit, backend ghi `startedAt`/`expiresAt`; answer/submit sau expiry phải theo auto-submit/timeout policy đã cấu hình, không tin client clock. | Should | Assessment |
| BR-087 | Attempt `SUBMITTED`/`TIMED_OUT` là immutable cho Student; retry submit trả idempotent result hoặc conflict, không tạo attempt mới ngoài attempt policy. | Must | Assessment |
| BR-088 | Objective Question được auto-score theo correct answer/policy; Short Answer cần `NEEDS_REVIEW` và không được coi là final grade trước review nếu policy yêu cầu. | Must | Assessment |
| BR-089 | Assignment chỉ nhận Submission type được Teacher cấu hình; Student chỉ submit khi enrollment/content/assignment status còn hợp lệ. | Must | Assessment |
| BR-090 | Submission sau due date chỉ nhận khi `allowLateSubmission=true` và Assignment chưa `CLOSED`; result phải gắn `late` theo deadline. | Should | Assessment |
| BR-091 | Resubmit chỉ khi `allowResubmit=true`, Assignment chưa closed và Student có quyền; history submission/time phải được giữ, latest valid submission là current theo policy. | Should | Assessment |
| BR-092 | Grade phải nằm từ `0` đến `maxScore`; chỉ Teacher scope owner/authorized override được grade/regrade và phải gắn đúng Student/assessment/submission. | Must | Assessment/Grade |
| BR-093 | Grade/Feedback chỉ visible cho Student sau khi Teacher `RETURNED`/published result theo Assignment/Quiz policy; draft feedback không lộ cho Student. | Must | Assessment/Privacy |
| BR-094 | Regrade/return/feedback update phải update progress/ranking/report nếu công thức dùng grade và ghi AuditLog/timestamp. | Must | Assessment/Audit |
| BR-095 | Private comment/feedback chỉ visible cho Student liên quan và Teacher/authorized staff có scope; không hiển thị cho Student khác. | Must | Assessment/Privacy |
| BR-096 | Teacher/Admin override grade hoặc assessment state là exceptional action, yêu cầu permission, reason theo policy và AuditLog; không thay workflow hàng ngày. | Should | Assessment/Admin |
| BR-097 | System policy nhạy cảm (join, file, notification, security, report) có độ ưu tiên cao hơn setting resource/user và chỉ actor authorized mới đổi được. | Must | Admin/Policy |
| BR-098 | Role/permission change phải chặn self-escalation, chặn Admin cấp quyền vượt permission của mình và bảo đảm còn ít nhất một Super Admin active theo policy vận hành. | Must | Admin/Security |
| BR-099 | User/Classroom/Course có learning/audit history dùng soft delete/archive; hard delete chỉ qua approved retention/legal process không thuộc MVP. | Must | Data Governance |
| BR-100 | Teacher offboarding/block khi còn Classroom active phải transfer ownership đến Teacher `ACTIVE` hoặc archive Classroom trước khi action hoàn tất, trừ emergency override audited. | Must | Admin |
| BR-101 | AuditLog bắt buộc cho invitation, role/status, ownership, join governance, policy, publish/unpublish, deadline reset, grading/regrade, sensitive export/system action. | Must | Audit |
| BR-102 | AuditLog append-only cho user thường; không expose update/delete API, và metadata không chứa password/raw token/secret/full file content. | Must | Audit/Security |
| BR-103 | File/media access phải check role + scope + ownership/enrollment ở thời điểm request; URL/object key không tự cấp quyền. | Must | Media/Security |
| BR-104 | System setting change có validation, effective scope/time và audit old/new safe value; invalid policy không được partially apply. | Must | Admin/Audit |
| BR-105 | Report/dashboard query luôn áp dụng role + object scope ở backend; filter/sort/export không mở rộng data scope của caller. | Must | Reporting |
| BR-106 | Progress/score/completion/active-user metric dùng definition backend versioned; UI/API/CSV không có công thức khác nhau. | Must | Reporting/Data |
| BR-107 | Aggregate/read model/report snapshot phải trả `asOf`/`recalculatedAt`/definition version phù hợp; stale/partial data phải được hiển thị rõ. | Must | Reporting |
| BR-108 | Export chỉ theo permission/scope, projection/row/time/file limit; download phải re-authorize và file private/expiring. | Should | Reporting/Privacy |
| BR-109 | Export sensitive/report snapshot request-complete-download theo policy phải AuditLog; export không được chứa secret/raw token/hash. | Must | Reporting/Audit |
| BR-110 | Product analytics event chỉ phục vụ adoption/engagement, có schema/version/dedupe và không chứa PII/secret không cần thiết hoặc trở thành source of truth cho grade/progress. | Must | Analytics/Privacy |

## Catalog Usage

- Cột `Priority` xác định release gate; `Must` có test evidence trước release feature liên quan.
- Rule chi tiết có điều kiện, exception, data/audit impact ở file domain tương ứng.
- Khi rule mới hoặc sửa semantics rule cũ, cập nhật `business-rule-governance.md`, Requirements, API/Data/UI/Test/Traceability theo impact.
