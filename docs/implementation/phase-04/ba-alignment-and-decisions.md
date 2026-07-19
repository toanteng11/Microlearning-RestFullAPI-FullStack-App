# Phase 04 BA Alignment And Decisions

## 1. Mục Đích

Tài liệu này diễn giải BA baseline thành quyết định có thể code và test. Nó không thay thế BA; mọi refinement làm thay đổi business behavior phải được phản hồi về BA trong change control trước khi Phase 04 đóng.

## 2. Requirement Coverage

| BA ID | Diễn giải thực thi P04 | Phạm vi |
| --- | --- | --- |
| `FR-026` | Teacher tạo Course `DRAFT` trong Classroom mình sở hữu; publish là mutation riêng | Must |
| `FR-027` | Course Dashboard hoạt động với Lesson completion v1, không hiển thị điểm giả | Must |
| `FR-028` | Module CRUD/reorder bằng exact-set + `structureRevision` | Must |
| `FR-029` | Lesson Markdown, preview, lifecycle và Student visibility | Must |
| `FR-030` | Deadline toàn Lesson, reset reason/history, derived state cập nhật ngay | Must |
| `FR-031` | Flashcard trong Lesson, kế thừa visibility; không tính progress riêng ở v1 | Must |
| `FR-032` | URL resource trước; private upload chỉ khi conditional gate đạt | Conditional Should |
| `FR-033` | Lifecycle common + effective visibility được server kiểm soát | Must |
| `FR-034` | Preview bằng Student presentation nhưng giữ Teacher authorization | Should |
| `FR-035` | Announcement lifecycle và enrolled Student stream | Must |
| `FR-049/050` | Dashboard/To-do trả Lesson-only ở P04, mở rộng activity ở P05/06 | Must slice |
| `FR-052/053` | Lesson completion và Flashcard learning flow | Must |
| `FR-057` | Back/Previous/Next/breadcrumb là behavior bắt buộc | Must |
| `FR-064/065` | Pagination/filter và UI state chuẩn | Must |
| `FR-067/068` | Swagger/OpenAPI và authorized media access | Must/Conditional |

## 3. BA Ambiguity Register

| ID | Điểm chưa thống nhất | Quyết định P04 | Lý do |
| --- | --- | --- | --- |
| P04-BA-001 | `FR-026` cho phép tạo thẳng `PUBLISHED` | Create luôn `DRAFT`; publish bằng endpoint riêng | Publish cần validate structure/deadline và audit rõ |
| P04-BA-002 | Course validation thiếu `SCHEDULED` nhưng `FR-033` yêu cầu | Course/Lesson/Announcement dùng common lifecycle có `SCHEDULED` | Đồng nhất business rule; OpenAPI là contract chốt |
| P04-BA-003 | Data dictionary Module dùng `ACTIVE/ARCHIVED` | Module dùng `DRAFT/PUBLISHED/UNPUBLISHED/ARCHIVED`, không schedule riêng | Module là ancestor visibility; schedule nằm ở Course/Lesson |
| P04-BA-004 | Flashcard có thể thuộc Lesson hoặc Module | Must chỉ cho Flashcard thuộc Lesson | Tránh hai nguồn ordering/visibility; có thể mở rộng sau |
| P04-BA-005 | Course Dashboard yêu cầu process score trước assessment | `processScore=lesson completion percentage`, versioned | Không giả lập Quiz/Assignment/Grade chưa tồn tại |
| P04-BA-006 | Student To-do yêu cầu Lesson/Quiz/Assignment | P04 chỉ trả `activityType=LESSON`; contract mở rộng enum ở P05 | Deliver vertical slice trung thực |
| P04-BA-007 | `CourseProgressSummary` được gọi Must/read model | P04 tính on demand, không materialize | BA cho phép aggregation ở MVP; tránh consistency job sớm |
| P04-BA-008 | API có cả status patch và delete Course | `PATCH /status` cho lifecycle; `DELETE` chỉ soft archive | Giữ REST catalog và không hard delete |
| P04-BA-009 | Deadline có thể clear nhưng publish bắt buộc deadline | Clear chỉ ở `DRAFT/UNPUBLISHED`; `PUBLISHED/SCHEDULED` bị chặn | Bảo toàn BR-061 |
| P04-BA-010 | Deadline shortening là Should override | Must mặc định chặn rút ngắn; override defer | Tránh làm Student bất lợi mà thiếu governance |
| P04-BA-011 | Scheduled publish cần background job | Effective visibility tính theo thời gian tại read; reconciliation là Should | Cloud Run không bảo đảm process timer sống liên tục |
| P04-BA-012 | Learning Resource gồm file nhưng provider chưa cần ở P04 | URL metadata là Conditional; upload chỉ private GCS | Không dùng Firebase/local disk, không chặn Must |
| P04-BA-013 | Published Lesson edit nhưng vẫn phải có persisted version | Body bị khóa khi `PUBLISHED/SCHEDULED`; unpublish rồi edit | Tránh dual-version complexity trong MVP và không có local-only draft |
| P04-BA-014 | Flashcard required có thể tính progress | P04 tính completion ở Lesson level | Một công thức duy nhất, mở rộng activity adapter sau |
| P04-BA-015 | Admin có thể quản trị content | Admin chỉ read governance; không mutate Teacher content | Least privilege và đúng actor ownership |

## 4. Metric Definition V1

### 4.1 Required Lesson Set

Tại thời điểm `asOf`, required set gồm Lesson thỏa tất cả:

- `isRequired=true`.
- Lesson effective status là `PUBLISHED`.
- Course effective status là `PUBLISHED`.
- Module cha, nếu có, effective status là `PUBLISHED`.
- Classroom `ACTIVE`.

### 4.2 Student Progress

```text
requiredLessonCount = count(required visible lessons)
completedRequiredLessonCount = count(required lessons with COMPLETED progress)
progressPercentage =
  requiredLessonCount == 0 ? 0 : round(completedRequiredLessonCount * 100 / requiredLessonCount, 2)
processScore = progressPercentage
```

Response bắt buộc trả `metricVersion=P04_LESSON_COMPLETION_V1` và `asOf`. Không diễn giải `processScore` này là grade.

### 4.3 Ranking

Thứ tự mặc định:

1. `processScore DESC`.
2. `progressPercentage DESC`.
3. `lastActiveAt DESC`, giá trị null đứng cuối.
4. `studentId ASC` làm stable tie-breaker.

Chỉ Enrollment `ACTIVE` được xếp hạng. Student removed không xuất hiện nhưng progress history vẫn được giữ.

## 5. To-do Definition V1

Một Lesson xuất hiện trong active To-do khi:

- Student và Enrollment đều `ACTIVE`.
- Ancestor và Lesson nhìn thấy theo visibility policy.
- Lesson `isRequired=true`.
- Chưa có progress `COMPLETED`.
- Có `completionDeadline`.

To-do key mang dạng opaque `LESSON:<lessonId>` ở server; client không parse ID để tự dựng route. API trả `actionUrl` đã allowlist theo route contract.

## 6. Status And Time Semantics

- API nhận/trả timestamp ISO-8601 UTC.
- Database lưu UTC; UI format theo browser timezone và luôn hiển thị timezone context gần deadline.
- `now == completionDeadline` được xem là quá hạn.
- `LATE`: completed, nhưng `completedAt > deadline`.
- `MISSING`: chưa completed và `now >= deadline`.
- `UPCOMING`: chưa completed và `now < deadline`.
- Đổi deadline tính lại derived state nhưng không sửa `startedAt/completedAt`.

## 7. Resource Decision

### Must Baseline

Không có file upload bắt buộc. Lesson Markdown, Flashcard và Announcement đủ tạo vertical slice P04.

### Conditional URL Resource

- Chỉ `https` URL.
- Type `LINK` hoặc `VIDEO_URL`.
- Server normalize và validate protocol/length; cấm `javascript:`, `data:`, `file:`.
- Client mở external URL với `noopener,noreferrer` và warning domain khi cần.

### Conditional GCS Upload

- Provider: Google Cloud Storage, không Firebase Storage.
- Bucket private; object key do server cấp, không dùng filename gốc làm key.
- Upload/download qua signed URL ngắn hạn hoặc authenticated proxy đã reauthorize.
- Metadata lưu MongoDB; binary không lưu MongoDB và không lưu container filesystem.

## 8. Approval Matrix

| Nhóm quyết định | Reviewer tối thiểu | Trạng thái hiện tại |
| --- | --- | --- |
| Scope/priority/metric | Product Owner/BA | Accepted via PR `#8` |
| API/data/lifecycle | Technical Lead/Backend | Accepted via PR `#8` |
| Security/resource | Security/DevOps | Accepted via PR `#8` |
| UX/navigation/accessibility | Frontend/QA | Accepted via PR `#8` |
| Acceptance/evidence | QA/Product Owner | Accepted via PR `#8` |

Repository owner merge planning PR là bằng chứng phê duyệt cho dự án cá nhân. Không ghi nhận chữ ký của role không thực sự review.

## 9. Change Back To BA

Trước khi đóng P04, review các refinement sau để đưa vào BA revision nếu được chấp thuận:

- Course create default `DRAFT`.
- Module lifecycle alignment.
- `P04_LESSON_COMPLETION_V1` và phased To-do/dashboard.
- Deadline clear/shortening constraints.
- File provider Google Cloud Storage và URL-first delivery.
- Published content edit requires unpublish trong MVP.
