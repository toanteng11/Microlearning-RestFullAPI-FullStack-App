# Phase 06 Student Reporting Experience

## 1. Outcome

Sau login, Student biết “cần làm gì tiếp theo”, “đã hoàn thành bao nhiêu” và “kết quả nào đã
được Teacher trả”, không phải mở từng Classroom để tự tổng hợp.

## 2. Route Map

| Route | Purpose |
| --- | --- |
| `/student/dashboard` | Action summary, Course progress preview, recent returned Grade |
| `/student/todo` | To-do full list/filter/pagination hiện có |
| `/student/progress` | Progress theo Course và trend nếu đủ dữ liệu |
| `/student/grades` | Returned Grade list hiện có |
| `/student/grades/:gradeId` | Own returned Grade detail hiện có |

## 3. Student Dashboard

Thứ tự ưu tiên:

1. due soon/missing work;
2. Continue learning action;
3. Course progress;
4. recent returned results;
5. Classroom navigation.

Dashboard không biến thành trang chart. To-do preview tối đa `5` item; nút “Xem tất cả” mở
`/student/todo`.

### 3.1 Dashboard Summary

- active Classroom count;
- pending/due soon/missing count;
- Course đang học và progress/process score;
- recent returned Grade count/preview;
- `asOf`/freshness khi summary đến từ read model.

### 3.2 To-do Item

Re-use P05:

- activity type/title;
- Classroom/Course;
- effective deadline;
- derived status;
- action URL;
- required flag;
- deadline exception indicator nếu có.

## 4. Student Progress Page

Mỗi Course row/card hiển thị:

- Course/Classroom name;
- required/completed;
- progress percentage;
- process score V1;
- missing/late count;
- last active;
- course completion;
- freshness timestamp;
- action vào Course.

Không dùng hero/card marketing. Layout ưu tiên table/list có thể scan và responsive.

## 5. Student Trend

Conditional:

- chọn Course;
- date range bounded;
- tối thiểu hai compatible snapshots;
- chart chỉ thể hiện progress/process score theo thời gian;
- tooltip có date/timezone/definition version;
- nếu version thay đổi, chia đoạn hoặc báo không so sánh được.

Không suy diễn “dự đoán điểm” hoặc “nguy cơ rớt”.

## 6. Grade Summary

- Chỉ current Grade status Student được phép thấy.
- Không hiển thị draft/manual review nội bộ.
- Recent result dẫn tới existing Grade/Quiz result route.
- Average `null` hiển thị `N/A`.
- Feedback summary không đưa vào Admin analytics.

## 7. Request States

| State | Behavior |
| --- | --- |
| Loading | Stable skeleton, không layout shift |
| Empty | Nêu đúng “không có công việc/dữ liệu”, không coi là lỗi |
| No denominator | `N/A`, giải thích “Khóa học chưa có nội dung bắt buộc” |
| Stale | Hiện “Cập nhật lần cuối...” và nút thử lại |
| Partial | Giữ phần hợp lệ, cảnh báo phần chưa tổng hợp |
| Error | Error boundary/inline retry, giữ Back navigation |
| Forbidden | Không hiển thị dữ liệu cache cũ |
| Offline/retry | Không double submit; reporting read có thể retry có kiểm soát |

## 8. Security

- Endpoint Student không nhận `studentId`.
- Course filter phải thuộc active Enrollment; invalid/out-of-scope không lộ tồn tại.
- Cache/query key phải gắn actor/session; logout xóa private query cache.
- Không đưa Grade, email hoặc token vào analytics properties.
- Browser Back/Forward hoạt động; protected route vẫn re-check auth.

## 9. Accessibility And Responsive

- Progress có text + `aria-valuenow`, không chỉ dựa màu.
- Status badge có label.
- Table chuyển thành responsive rows nhưng giữ thứ tự/heading.
- Keyboard focus rõ cho filter/action.
- Chart Conditional có text/table alternative.
- Long Course/activity title wrap, không tràn button/container.

## 10. Student Acceptance Journeys

1. Student có pending Lesson/Quiz/Assignment thấy đúng thứ tự.
2. Complete một activity làm item rời pending list và progress refresh.
3. Deadline exception đổi status cho đúng Student.
4. Returned Grade xuất hiện; draft Grade không xuất hiện.
5. Student A không xem được data Student B.
6. Course không có required activity hiển thị `N/A`.
7. Read model stale không bị trình bày như fresh.
