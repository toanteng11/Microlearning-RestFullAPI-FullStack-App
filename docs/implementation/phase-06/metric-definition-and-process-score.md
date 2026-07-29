# Phase 06 Metric Definition And Process Score

## 1. Mục Đích

Metric trong P06 là contract nghiệp vụ, không phải phép tính tùy ý trong UI. Mỗi metric phải có
ID, version, actor scope, source, công thức, rounding, empty rule, freshness và owner.

## 2. Global Metric Rules

| Rule | Baseline |
| --- | --- |
| Storage time | UTC |
| Default display/filter timezone | `Asia/Ho_Chi_Minh` |
| Date interval | Start inclusive, end exclusive |
| Percentage range | `0..100` |
| Rounding | Một chữ số thập phân, half-up tại response boundary |
| Empty denominator | `null`, UI `N/A` |
| Source | Backend transactional source hoặc versioned read model |
| Authority | Backend; Web không tính lại official metric |
| Metadata | `definitionId`, `definitionVersion`, `asOf`, `recalculatedAt`, `freshness` |

## 3. Definition Registry

| Definition ID | Version | Formula/source | Empty rule |
| --- | --- | --- | --- |
| `required_activity_count` | `P06_REQUIRED_ACTIVITY_COUNT_V1` | Count visible required Lesson/Quiz/Assignment | `0` |
| `completed_required_count` | `P06_COMPLETED_REQUIRED_COUNT_V1` | Required activity có canonical completed state | `0` |
| `progress_percentage` | `P05_REQUIRED_ACTIVITY_COMPLETION_V1` | completed / required * 100 | `null` nếu required=0 |
| `process_score` | `P06_PROCESS_SCORE_V1` | Bằng authoritative progress percentage | `null` |
| `course_completion` | `P06_COURSE_COMPLETION_V1` | required > 0 và completed = required | `false` nếu required=0 |
| `missing_activity_count` | `P06_MISSING_COUNT_V1` | Required activity due < asOf và chưa completed | `0` |
| `late_activity_count` | `P06_LATE_COUNT_V1` | Completed sau effective deadline | `0` |
| `last_active_at` | `P06_LAST_ACTIVE_V1` | Max `learning_progress.lastActiveAt` trong Course | `null` |
| `returned_grade_average` | `P06_RETURNED_GRADE_AVERAGE_V1` | Sum current returned score / sum maxScore * 100 | `null` |
| `activity_completion_rate` | `P06_ACTIVITY_COMPLETION_RATE_V1` | completed active Students / active roster * 100 | `null` |
| `submission_rate` | `P06_SUBMISSION_RATE_V1` | submitted/currently completed / eligible roster * 100 | `null` |
| `feedback_coverage` | `P06_FEEDBACK_COVERAGE_V1` | returned Grade có feedback / returned Grade * 100 | `null` |

## 4. Required Activity Eligibility

Một activity chỉ vào denominator khi đồng thời:

1. thuộc Course đang báo cáo;
2. type nằm trong `LESSON`, `QUIZ`, `ASSIGNMENT`;
3. `isRequired=true`;
4. đã visible/assigned cho Student theo lifecycle P05 tại `asOf`;
5. Student có active Enrollment phù hợp trong reporting scope;
6. activity không bị hard-delete hoặc loại khỏi Course theo source policy.

Draft activity không vào denominator. Archived Course có thể xem historical report nếu actor có
quyền, nhưng metric phải dùng snapshot/asOf rõ ràng.

## 5. Canonical Completion Mapping

| Activity | Completed khi | Không completed khi |
| --- | --- | --- |
| Lesson | Learning Progress canonical status `COMPLETED` | Chưa bắt đầu/đang học |
| Quiz | Attempt đạt terminal completion theo P05 policy | Draft/active/expired chưa finalize |
| Assignment | Submission state được P05 tính completion | Draft/unsubmitted/missing |

`LATE` là completed có thời điểm sau effective deadline; vẫn vào numerator nhưng đồng thời tăng
late count. `MISSING` không vào numerator.

## 6. Process Score V1

```text
if requiredActivityCount == 0:
  processScore = null
else:
  raw = completedRequiredCount / requiredActivityCount * 100
  processScore = roundHalfUp(raw, 1)
```

Required invariants:

- `processScore` không nhận từ client.
- `processScore` luôn cùng value với `progressPercentage` trong V1.
- Grade, bonus, attendance, event count và last active không tham gia formula.
- Regrade không đổi process score trừ khi P05 completion state thực sự đổi.
- Deadline exception có thể đổi `MISSING/LATE`, nhưng không tự đổi completed numerator.

## 7. Stable Ranking

Default sort:

```text
1. processScore DESC NULLS LAST
2. completedRequiredCount DESC
3. missingActivityCount ASC
4. lateActivityCount ASC
5. lastActiveAt DESC NULLS LAST
6. studentId ASC
```

Rank dùng ordinal position sau full server-side sort/filter. Pagination không reset tie-breaker.
Hai Student có cùng score vẫn có thứ tự deterministic; UI không được tự sort lại current page.

Khi client chọn sort khác, field được chọn là primary theo `sortOrder`, mọi nullable value vẫn
`NULLS LAST`, và `studentId ASC` luôn là tie-breaker cuối. `rank` khi đó là ordinal position của
filtered/custom-sorted result, không phải default process-score rank; response metadata phải trả
lại normalized `sortBy/sortOrder`.

## 8. Returned Grade Average

Eligible Grade:

- current Grade của Quiz/Assignment trong Course;
- status visible cho actor projection;
- đối với Student/Admin aggregate: chỉ Grade status `RETURNED`;
- `maxScore > 0`;
- không phải deleted/superseded revision.

Formula:

```text
gradePointsEarned = sum(score)
gradePointsPossible = sum(maxScore)
average = roundHalfUp(gradePointsEarned / gradePointsPossible * 100, 1)
```

Không lấy trung bình cộng từng percentage vì activity có maxScore khác nhau. Teacher Gradebook
có thể thấy current draft score trong owned grading context, nhưng draft không đi vào Student/
Admin average.

`QuizAttempt.RESULT_RELEASED` không được query thay cho Grade average. P05 đã đồng bộ highest
Quiz Grade về `grades`; P06 dùng current Grade `RETURNED` để giữ một source thống nhất cho
Quiz và Assignment.

## 9. Status Metrics

| Status | Rule |
| --- | --- |
| `PENDING` | Required, chưa complete, deadline chưa vào due-soon window |
| `DUE_SOON` | Required, chưa complete, deadline trong configured window |
| `MISSING` | Required, chưa complete, effective deadline < asOf |
| `LATE` | CompletedAt > effective deadline |
| `COMPLETED` | Canonical completed, không late |
| `NO_DEADLINE` | Deadline không có; không tự suy ra missing |

Deadline exception luôn được resolve trước status.

## 10. Freshness Contract

```json
{
  "freshness": {
    "status": "FRESH",
    "asOf": "2026-07-28T03:00:00.000Z",
    "recalculatedAt": "2026-07-28T03:00:01.000Z",
    "sourceChangedAt": "2026-07-28T02:59:58.000Z",
    "staleAfterSeconds": 300,
    "failedItemsCount": 0
  }
}
```

| Status | Nghĩa/UI |
| --- | --- |
| `FRESH` | Dữ liệu đã phản ánh source watermark hiện tại |
| `STALE` | Có snapshot cũ; UI cảnh báo thời điểm cập nhật |
| `PARTIAL` | Một phần dữ liệu hợp lệ; UI nêu số item chưa tổng hợp |
| `REBUILDING` | Đang tính lại; UI giữ layout và cho retry/refetch |
| `FAILED` | Không có dữ liệu tin cậy để trình bày |

## 11. Metric Version Change

Khi formula/eligibility/rounding đổi:

1. tạo definition version mới;
2. không overwrite historical snapshot cũ;
3. mark read model version cũ stale/incompatible;
4. rebuild theo version mới;
5. không so sánh trend/ranking giữa incompatible versions;
6. cập nhật OpenAPI/UI tooltip/tests/traceability.

## 12. Unit Test Matrix

- denominator `0`, `1`, nhiều activity.
- percentage có rounding boundary.
- late completed vừa vào numerator vừa vào late count.
- deadline exception trước/sau deadline.
- draft/archived activity eligibility.
- draft vs returned Grade.
- maxScore khác nhau.
- null score ordering.
- stable ordering khi mọi metric bằng nhau.
- incompatible definition version bị từ chối.
