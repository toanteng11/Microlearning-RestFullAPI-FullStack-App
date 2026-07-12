# Data Dictionary

## Mục Đích

Tài liệu này mô tả các field dữ liệu quan trọng của hệ thống **Microlearning Classroom LMS Platform**. Data dictionary giúp Developer thiết kế MongoDB schema, Backend xây RESTful API, Frontend hiểu response, QA viết test data và BA kiểm tra requirement có đủ dữ liệu hay không.

## Quy Ước Chung

| Quy ước | Ý nghĩa |
| --- | --- |
| `ObjectId` | MongoDB ObjectId reference |
| `String` | Chuỗi text |
| `Number` | Số |
| `Boolean` | Đúng/sai |
| `Date` | ISO date/time |
| `Array<T>` | Mảng phần tử kiểu T |
| `Enum` | Giá trị nằm trong danh sách cho phép |
| Required = Có | Field bắt buộc khi tạo mới hoặc theo ngữ cảnh |

## Common Fields

Các collection nghiệp vụ nên có các field chung sau:

| Field | Type | Required | Mô tả |
| --- | --- | --- | --- |
| `_id` | ObjectId | Có | ID nội bộ MongoDB |
| createdAt | Date | Có | Thời điểm tạo |
| updatedAt | Date | Có | Thời điểm cập nhật gần nhất |
| createdBy | ObjectId | Không | User tạo record, nếu có |
| updatedBy | ObjectId | Không | User cập nhật gần nhất, nếu có |
| deletedAt | Date | Không | Thời điểm soft delete, nếu áp dụng |
| deletedBy | ObjectId | Không | User thực hiện soft delete, nếu áp dụng |

## User

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| email | String | Có | Email đăng nhập | Unique, lowercase, đúng email format |
| passwordHash | String | Có | Mật khẩu đã hash | Không expose qua API |
| fullName | String | Có | Tên hiển thị | Trim, 2-100 ký tự |
| role | Enum | Có | Role chính | `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN` |
| roles | Array<String> | Không | Nhiều role nếu mở rộng | MVP có thể dùng một `role` |
| status | Enum | Có | Trạng thái account | `PENDING`, `ACTIVE`, `INACTIVE`, `BLOCKED`, `DELETED` |
| avatarUrl | String | Không | Ảnh đại diện | URL hợp lệ |
| studentCode | String | Không | Mã Student nội bộ | Chỉ dùng cho Student |
| department | String | Không | Khoa/bộ môn/đơn vị | Dùng filter/report |
| phoneNumber | String | Không | Số điện thoại | Optional |
| lastLoginAt | Date | Không | Lần login gần nhất | Phục vụ Admin list |
| lastActiveAt | Date | Không | Lần hoạt động gần nhất | Phục vụ report/progress |
| invitedBy | ObjectId | Không | Admin mời account nếu là Teacher | Reference User |
| activatedAt | Date | Không | Thời điểm kích hoạt account | Teacher invitation |
| registrationSource | Enum | Có | Nguồn tạo account | `SELF_REGISTRATION`, `TEACHER_INVITATION`, `ADMIN_CREATED`, `IMPORT`; public register luôn là `SELF_REGISTRATION` |

## Role

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| name | String | Có | Tên role | Unique: `STUDENT`, `TEACHER`, `ADMIN`, `SUPER_ADMIN` |
| description | String | Không | Mô tả role |  |
| isSystemRole | Boolean | Có | Role hệ thống | Không cho xóa nếu true |
| status | Enum | Có | Trạng thái | `ACTIVE`, `INACTIVE` |

## Permission

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| code | String | Có | Mã permission | Unique, ví dụ `user.view_students` |
| resource | String | Có | Resource | `user`, `classroom`, `quiz`, `audit_log` |
| action | String | Có | Action | `view`, `create`, `update`, `delete`, `export` |
| scope | String | Không | Scope | `own`, `owned`, `enrolled`, `all`, `sensitive` |
| description | String | Không | Mô tả |  |

## TeacherInvitation

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| email | String | Có | Email Teacher được mời | Lowercase, email format |
| tokenHash | String | Có | Hash của invitation token | Unique, không lưu raw token |
| role | Enum | Có | Role gán sau khi accept | Mặc định `TEACHER` |
| status | Enum | Có | Trạng thái invitation | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |
| deliveryMethod | Enum | Có | Cách gửi link | Mặc định `MANUAL_COPY` |
| invitedBy | ObjectId | Có | Admin tạo invitation | Reference User |
| acceptedBy | ObjectId | Không | Teacher account sau khi accept | Reference User |
| expiresAt | Date | Có | Thời điểm hết hạn | Phải lớn hơn createdAt |
| acceptedAt | Date | Không | Thời điểm accept | Chỉ có khi `ACCEPTED` |
| revokedAt | Date | Không | Thời điểm revoke | Chỉ có khi `REVOKED` |
| lastCopiedAt | Date | Không | Lần copy gần nhất | Optional audit shortcut |
| copyCount | Number | Không | Số lần copy | Mặc định 0 |
| lastCopyChannelHint | Enum | Không | Kênh Admin dự định gửi | `EMAIL_MANUAL`, `ZALO`, `FACEBOOK`, `MESSENGER`, `TEAMS`, `OTHER` |

## Classroom

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| name | String | Có | Tên Classroom | 2-120 ký tự |
| description | String | Không | Mô tả lớp | Tối đa 1000 ký tự |
| subject | String | Không | Môn học/chủ đề | Optional |
| section | String | Không | Nhóm/lớp/phòng | Optional |
| ownerTeacherId | ObjectId | Có | Teacher sở hữu Classroom | User role `TEACHER` |
| status | Enum | Có | Trạng thái Classroom | `ACTIVE`, `ARCHIVED`, `LOCKED` |
| enrollmentStatus | Enum | Có | Trạng thái join | `OPEN`, `CLOSED`, `LOCKED` |
| allowClassCodeJoin | Boolean | Có | Classroom-level setting | Không vượt Admin policy |
| allowInviteLinkJoin | Boolean | Có | Classroom-level setting | Không vượt Admin policy |
| archivedAt | Date | Không | Thời điểm archive | Không xóa dữ liệu học |

## Enrollment

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| classroomId | ObjectId | Có | Classroom đã tham gia | Reference Classroom |
| studentId | ObjectId | Có | Student tham gia | User role `STUDENT` |
| status | Enum | Có | Trạng thái enrollment | `ACTIVE`, `REMOVED`, `LEFT`, `BLOCKED` |
| joinedBy | Enum | Có | Phương thức join | Chỉ `CLASS_CODE` hoặc `INVITE_LINK` trong scope hiện tại |
| joinedAt | Date | Có | Thời điểm join |  |
| removedAt | Date | Không | Thời điểm remove |  |
| removedBy | ObjectId | Không | Teacher/Admin remove | Reference User |
| sourceTokenId | ObjectId | Không | Link token đã dùng | Optional |

## ClassCode

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| classroomId | ObjectId | Có | Classroom sở hữu code | Reference Classroom |
| code | String | Có | Mã join | Unique khi `status = ACTIVE` |
| status | Enum | Có | Trạng thái | `ACTIVE`, `DISABLED`, `REGENERATED`, `EXPIRED` |
| generatedBy | ObjectId | Có | Teacher tạo/regenerate | Reference User |
| generatedAt | Date | Có | Thời điểm tạo |  |
| disabledAt | Date | Không | Thời điểm vô hiệu |  |

## ClassroomInviteLink

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| classroomId | ObjectId | Có | Classroom liên quan | Reference Classroom |
| tokenHash | String | Có | Hash token join | Unique |
| status | Enum | Có | Trạng thái | `ACTIVE`, `DISABLED`, `REGENERATED`, `EXPIRED` |
| createdBy | ObjectId | Có | Teacher tạo link | Reference User |
| expiresAt | Date | Không | Thời điểm hết hạn | Optional |
| disabledAt | Date | Không | Thời điểm disable |  |
| copyCount | Number | Không | Số lần copy | Optional |

## Course

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| classroomId | ObjectId | Có | Classroom cha | Reference Classroom |
| ownerTeacherId | ObjectId | Có | Teacher sở hữu | Reference User |
| title | String | Có | Tên Course | 2-150 ký tự |
| description | String | Không | Mô tả Course |  |
| status | Enum | Có | Trạng thái | `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` |
| displayOrder | Number | Không | Thứ tự trong Classroom | >= 0 |
| publishedAt | Date | Không | Thời điểm publish |  |
| archivedAt | Date | Không | Thời điểm archive |  |

## Module

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| courseId | ObjectId | Có | Course cha | Reference Course |
| title | String | Có | Tên Module/Topic | 2-150 ký tự |
| description | String | Không | Mô tả |  |
| displayOrder | Number | Có | Thứ tự | >= 0 |
| status | Enum | Có | Trạng thái | `ACTIVE`, `ARCHIVED` |

## Lesson

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| courseId | ObjectId | Có | Course cha | Reference Course |
| moduleId | ObjectId | Không | Module cha | Reference Module |
| title | String | Có | Tiêu đề Lesson | 2-150 ký tự |
| content | String/Object | Có | Nội dung bài học | Có thể rich text/block JSON |
| contentType | Enum | Có | Loại nội dung | `TEXT`, `VIDEO`, `LINK`, `MIXED` |
| estimatedMinutes | Number | Không | Thời lượng dự kiến | 1-60 đề xuất cho microlearning |
| completionDeadline | Date | Có khi publish/assign | Deadline hoàn thành riêng của Lesson | Hiển thị To-do/Calendar; có thể chưa bắt buộc khi `DRAFT` |
| deadlineLastUpdatedAt | Date | Không | Thời điểm deadline được cập nhật gần nhất | Dùng cho audit/debug |
| deadlineLastUpdatedBy | ObjectId | Không | User cập nhật deadline gần nhất | Reference User/Teacher |
| deadlineChangeReason | String | Không | Lý do thay đổi deadline gần nhất | Bắt buộc khi reset deadline của Lesson đã publish/assigned |
| deadlineHistory | Array | Không | Lịch sử thay đổi deadline | Gồm oldDeadline, newDeadline, changedBy, changedAt, reason |
| isRequired | Boolean | Có | Có bắt buộc hoàn thành không | Mặc định true |
| status | Enum | Có | Trạng thái | `DRAFT`, `SCHEDULED`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` |
| displayOrder | Number | Có | Thứ tự | >= 0 |

## Flashcard

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| lessonId | ObjectId | Có | Lesson cha | Reference Lesson |
| frontText | String | Có | Mặt trước/câu hỏi | Không rỗng |
| backText | String | Có | Mặt sau/câu trả lời | Không rỗng |
| displayOrder | Number | Có | Thứ tự | >= 0 |
| status | Enum | Có | Trạng thái | `ACTIVE`, `ARCHIVED` |

## LearningResource

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| ownerType | Enum | Có | Gắn với đối tượng nào | `CLASSROOM`, `COURSE`, `MODULE`, `LESSON`, `ASSIGNMENT`, `QUESTION` |
| ownerId | ObjectId | Có | ID đối tượng cha |  |
| resourceType | Enum | Có | Loại resource | `PDF`, `IMAGE`, `VIDEO_URL`, `LINK`, `FILE` |
| title | String | Có | Tên resource |  |
| url | String | Có | URL file/link | Không lưu binary trong MongoDB |
| provider | String | Không | Storage provider | `LOCAL`, `S3`, `CLOUDINARY`, `EXTERNAL` |
| mimeType | String | Không | MIME type | Validate theo policy |
| fileSize | Number | Không | Size byte | Không vượt max size |
| isRequired | Boolean | Có | Có tính progress không | Mặc định false |

## Announcement

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| classroomId | ObjectId | Có | Classroom nhận thông báo | Reference Classroom |
| teacherId | ObjectId | Có | Teacher đăng | Reference User |
| content | String | Có | Nội dung thông báo | Không rỗng |
| attachments | Array<Object> | Không | File/link đính kèm | Metadata |
| status | Enum | Có | Trạng thái | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| publishedAt | Date | Không | Thời điểm publish |  |

## Quiz

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| courseId | ObjectId | Có | Course cha | Reference Course |
| moduleId | ObjectId | Không | Module cha | Reference Module |
| lessonId | ObjectId | Không | Lesson liên quan | Optional |
| title | String | Có | Tên Quiz |  |
| instruction | String | Không | Hướng dẫn |  |
| dueDate | Date | Không | Deadline Quiz | To-do/Calendar |
| maxScore | Number | Có | Tổng điểm | >= 0 |
| attemptLimit | Number | Không | Số lần làm | >= 1 nếu có |
| timeLimitMinutes | Number | Không | Giới hạn thời gian | >= 1 nếu có |
| status | Enum | Có | Trạng thái | `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED` |

## Question

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| quizId | ObjectId | Có | Quiz cha | Reference Quiz |
| questionText | String | Có | Nội dung câu hỏi | Bắt buộc dù có media |
| questionType | Enum | Có | Loại câu hỏi | `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER` |
| points | Number | Có | Điểm câu hỏi | >= 0 |
| options | Array<QuestionOption> | Tùy type | Các đáp án | Required với choice questions |
| correctAnswer | Mixed | Tùy type | Đáp án đúng | Không expose cho Student trước khi submit |
| displayOrder | Number | Có | Thứ tự | >= 0 |
| explanation | String | Không | Giải thích đáp án | Hiển thị theo policy |
| hasMedia | Boolean | Có | Có media hay không | Derived hoặc lưu nhanh |

## QuestionMedia

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| questionId | ObjectId | Có | Question được gắn media | Reference Question |
| mediaType | Enum | Có | Loại media | `IMAGE`, `VIDEO` |
| mediaUrl | String | Có | URL file hoặc video URL | URL hợp lệ |
| caption | String | Không | Chú thích | Optional |
| altText | String | Không | Text thay thế | Nên có với image |
| fileSize | Number | Không | Dung lượng | Theo upload policy |
| mimeType | String | Không | MIME type | Theo upload policy |
| displayOrder | Number | Không | Thứ tự hiển thị |  |

## QuizAttempt

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| quizId | ObjectId | Có | Quiz được làm | Reference Quiz |
| studentId | ObjectId | Có | Student làm Quiz | Reference User |
| classroomId | ObjectId | Có | Classroom ngữ cảnh | Reference Classroom |
| courseId | ObjectId | Có | Course ngữ cảnh | Reference Course |
| attemptNumber | Number | Có | Lần làm thứ mấy | Không vượt attemptLimit |
| answers | Array<QuizAnswer> | Có | Câu trả lời |  |
| status | Enum | Có | Trạng thái | `IN_PROGRESS`, `SUBMITTED`, `GRADED`, `PENDING_REVIEW` |
| score | Number | Không | Điểm đạt được | 0 đến maxScore |
| startedAt | Date | Có | Bắt đầu |  |
| submittedAt | Date | Không | Nộp bài |  |
| gradedAt | Date | Không | Chấm xong |  |

## Assignment

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| courseId | ObjectId | Có | Course cha | Reference Course |
| moduleId | ObjectId | Không | Module cha | Optional |
| title | String | Có | Tên Assignment |  |
| instruction | String | Có | Hướng dẫn | Không rỗng |
| dueDate | Date | Không | Deadline nộp | To-do/Calendar |
| maxScore | Number | Có | Điểm tối đa | >= 0 |
| allowedSubmissionTypes | Array<Enum> | Có | Cách nộp | `TEXT`, `FILE`, `LINK`, `MARK_DONE` |
| allowResubmit | Boolean | Có | Cho nộp lại không | Theo policy |
| status | Enum | Có | Trạng thái | `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED` |

## Submission

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| assignmentId | ObjectId | Có | Assignment cha | Reference Assignment |
| studentId | ObjectId | Có | Student nộp bài | Reference User |
| classroomId | ObjectId | Có | Classroom ngữ cảnh | Reference Classroom |
| courseId | ObjectId | Có | Course ngữ cảnh | Reference Course |
| submissionType | Enum | Có | Loại bài nộp | `TEXT`, `FILE`, `LINK`, `MARK_DONE`, `MIXED` |
| textAnswer | String | Không | Nội dung text | Required nếu type TEXT |
| attachments | Array<Attachment> | Không | File/link nộp | Validate type/size/url |
| status | Enum | Có | Trạng thái | `DRAFT`, `SUBMITTED`, `UNSUBMITTED`, `LATE`, `GRADED`, `RETURNED`, `MISSING` |
| submittedAt | Date | Không | Thời điểm nộp |  |
| returnedAt | Date | Không | Thời điểm Teacher trả bài |  |
| isLate | Boolean | Có | Có trễ hạn không | Derived từ dueDate/submittedAt |

## Grade

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| targetType | Enum | Có | Đối tượng được chấm | `QUIZ_ATTEMPT`, `SUBMISSION` |
| targetId | ObjectId | Có | ID đối tượng |  |
| studentId | ObjectId | Có | Student nhận điểm | Reference User |
| teacherId | ObjectId | Không | Teacher chấm | Null nếu auto-grade |
| score | Number | Có | Điểm | 0 đến maxScore |
| maxScore | Number | Có | Điểm tối đa | >= score |
| gradingType | Enum | Có | Cách chấm | `AUTO`, `MANUAL`, `MIXED` |
| status | Enum | Có | Trạng thái | `DRAFT`, `PUBLISHED`, `RETURNED` |
| gradedAt | Date | Không | Thời điểm chấm |  |

## Feedback

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| targetType | Enum | Có | Đối tượng feedback | `QUIZ_ATTEMPT`, `SUBMISSION`, `COURSE_PROGRESS` |
| targetId | ObjectId | Có | ID đối tượng |  |
| studentId | ObjectId | Có | Student nhận feedback | Reference User |
| teacherId | ObjectId | Có | Teacher gửi feedback | Reference User |
| content | String | Có | Nội dung nhận xét | Không rỗng |
| visibility | Enum | Có | Phạm vi | `PRIVATE_TO_STUDENT`, `TEACHER_ONLY` |
| returnedAt | Date | Không | Thời điểm công bố |  |

## LearningProgress

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| studentId | ObjectId | Có | Student | Reference User |
| classroomId | ObjectId | Có | Classroom | Reference Classroom |
| courseId | ObjectId | Có | Course | Reference Course |
| activityType | Enum | Có | Loại activity | `LESSON`, `FLASHCARD`, `RESOURCE`, `QUIZ`, `ASSIGNMENT` |
| activityId | ObjectId | Có | ID activity |  |
| status | Enum | Có | Tiến độ | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `MISSING`, `LATE`, `NEEDS_REVIEW` |
| progressPercentage | Number | Có | % hoàn thành | 0-100 |
| startedAt | Date | Không | Bắt đầu |  |
| completedAt | Date | Không | Hoàn thành |  |
| lastActivityAt | Date | Không | Hoạt động gần nhất |  |

## CourseProgressSummary

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| courseId | ObjectId | Có | Course | Reference Course |
| classroomId | ObjectId | Có | Classroom | Reference Classroom |
| studentId | ObjectId | Có | Student | Reference User |
| processScore | Number | Có | Điểm quá trình | 0-100, sort mặc định DESC |
| progressPercentage | Number | Có | Tỷ lệ hoàn thành | 0-100 |
| completedActivities | Number | Có | Số activity hoàn thành | >= 0 |
| totalRequiredActivities | Number | Có | Tổng activity bắt buộc | >= completedActivities |
| quizAverage | Number | Không | Điểm quiz trung bình | 0-100 hoặc null |
| assignmentAverage | Number | Không | Điểm assignment trung bình | 0-100 hoặc null |
| missingItems | Number | Có | Số việc thiếu | >= 0 |
| lateItems | Number | Có | Số việc trễ hạn | >= 0 |
| lastActiveAt | Date | Không | Hoạt động gần nhất |  |
| recalculatedAt | Date | Có | Thời điểm tính lại |  |

## StudentTodoItem

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| studentId | ObjectId | Có | Student | Reference User |
| classroomId | ObjectId | Có | Classroom | Reference Classroom |
| courseId | ObjectId | Không | Course liên quan | Reference Course |
| activityType | Enum | Có | Loại việc | `LESSON`, `QUIZ`, `ASSIGNMENT`, `MATERIAL` |
| activityId | ObjectId | Có | Activity cần làm |  |
| title | String | Có | Tên việc cần làm | Denormalized để đọc nhanh |
| dueDate | Date | Không | Deadline | Sort theo deadline |
| status | Enum | Có | Trạng thái | `NOT_STARTED`, `IN_PROGRESS`, `MISSING`, `LATE`, `NEEDS_REVISION` |
| actionUrl | String | Có | URL mở activity | Frontend dùng điều hướng |
| completedAt | Date | Không | Thời điểm hoàn thành | Khi có thì rời To-do active |

## Notification

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| recipientId | ObjectId | Có | User nhận | Reference User |
| type | Enum | Có | Loại notification | `ANNOUNCEMENT`, `DEADLINE`, `FEEDBACK`, `SUBMISSION`, `ACCOUNT` |
| title | String | Có | Tiêu đề |  |
| body | String | Không | Nội dung |  |
| targetType | String | Không | Resource liên quan |  |
| targetId | ObjectId | Không | ID resource |  |
| isRead | Boolean | Có | Đã đọc chưa | Default false |
| readAt | Date | Không | Thời điểm đọc |  |

## AuditLog

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| actorId | ObjectId | Không | User thực hiện | Null nếu system job |
| action | String | Có | Hành động | Ví dụ `ACCOUNT_BLOCKED` |
| resourceType | String | Có | Loại resource | `USER`, `CLASSROOM`, `INVITATION` |
| resourceId | ObjectId/String | Có | ID resource |  |
| metadata | Object | Không | Before/after/reason/channel | Không chứa secret |
| ipAddress | String | Không | IP actor | Optional |
| userAgent | String | Không | Browser/client info | Optional |
| severity | Enum | Không | Mức độ | `INFO`, `WARNING`, `CRITICAL` |
| createdAt | Date | Có | Thời điểm log | Append-only |

## SystemSetting

| Field | Type | Required | Mô tả | Validation / Ghi chú |
| --- | --- | --- | --- | --- |
| key | String | Có | Khóa setting | Unique |
| value | Mixed | Có | Giá trị setting | Validate theo key |
| category | Enum | Có | Nhóm setting | `ENROLLMENT`, `FILE_UPLOAD`, `NOTIFICATION`, `SECURITY`, `FEATURE_FLAG` |
| isSensitive | Boolean | Có | Có nhạy cảm không | Không expose value nếu sensitive |
| updatedBy | ObjectId | Không | Admin cập nhật | Audit bắt buộc |

## DeploymentRecord / BackupRecord

| Entity | Field | Type | Required | Mô tả |
| --- | --- | --- | --- | --- |
| DeploymentRecord | version | String | Có | Version/commit được deploy |
| DeploymentRecord | environment | Enum | Có | `DEV`, `STAGING`, `PRODUCTION` |
| DeploymentRecord | status | Enum | Có | `SUCCESS`, `FAILED`, `ROLLED_BACK` |
| DeploymentRecord | deployedAt | Date | Có | Thời điểm deploy |
| BackupRecord | backupType | Enum | Có | `MANUAL`, `SCHEDULED`, `PRE_RELEASE` |
| BackupRecord | scope | Array<String> | Có | Collections được backup |
| BackupRecord | status | Enum | Có | `SUCCESS`, `FAILED` |
| BackupRecord | createdAt | Date | Có | Thời điểm backup |
