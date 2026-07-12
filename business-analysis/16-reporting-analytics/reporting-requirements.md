# Reporting Requirements

## Mục Đích

Tài liệu này ghi nhận functional requirements cho dashboard, report, analytics, filter, export và governance. Các requirement dùng mã `REP-*` để trace tới API, UI, test và acceptance criteria.

## Reporting Functional Requirements

| ID | Requirement | Priority | Acceptance criteria tóm tắt |
| --- | --- | --- | --- |
| REP-001 | Hệ thống phải cung cấp Student To-do Dashboard hiển thị activity pending, due soon, late/missing trong scope Student. | Must | Student chỉ thấy To-do của enrollment active; mỗi item dẫn tới activity hợp lệ. |
| REP-002 | Student phải xem personal Course/Classroom progress, completed/required và deadline status. | Must | Dữ liệu chỉ thuộc Student đang đăng nhập, có `asOf/recalculatedAt` khi dùng summary. |
| REP-003 | Student phải xem quiz/assignment result và feedback của chính mình sau khi policy publish/grade cho phép. | Must | Không đọc được record Student khác qua UI/API/URL. |
| REP-004 | Teacher phải có Course Dashboard hiển thị content/activity, deadline, roster và progress summary. | Must | Chỉ Teacher owner/authorized; activity list/filter đúng Course. |
| REP-005 | Teacher phải xem Student Progress Ranking mặc định sort Process Score từ cao xuống thấp. | Must | Có process score/progress/completed/late/missing/last active theo scope và pagination/filter. |
| REP-006 | Teacher phải xem Roster Completion theo Lesson/Quiz/Assignment để nhận biết not started/in progress/completed/late/missing. | Must | Deadline reset cập nhật trạng thái/report theo rule; history không mất. |
| REP-007 | Teacher phải xem Assessment Performance và Student Learning Detail trong Course/Classroom mình có quyền. | Should | Score/submission/feedback scope chính xác; ungraded/missing được hiển thị rõ. |
| REP-008 | Admin phải xem User Administration Summary và role-specific Student/Teacher/Admin lists. | Must | List filter/pagination/projection theo RBAC; không trả hash/token/secret. |
| REP-009 | Admin phải xem Teacher Invitation, Classroom/Course Governance và Audit/Export Activity theo permission. | Must | Status/date/actor/action filter; raw invitation token không xuất hiện lại. |
| REP-010 | Admin/PO authorized phải xem aggregate Platform Adoption/Learning Outcome trend theo policy. | Should | Scope/filter/timezone/as-of/definition rõ; Teacher không xem cross-class data ngoài quyền. |
| REP-011 | Report list/chart phải hỗ trợ filter hợp lệ: date range, Classroom, Course, activity, Student, Teacher, role/status, deadline/completion/score range tùy report. | Must | Filter được validate/authorize; invalid range trả error chuẩn; filter không mở rộng data scope. |
| REP-012 | List/report lớn phải có pagination, default/max limit, server-side sort/filter và projection. | Must | Không tải toàn bộ Student/Submission/AuditLog vào browser chỉ để render report. |
| REP-013 | Aggregate/snapshot phải hiển thị data freshness như `asOf`/`recalculatedAt`; UI có loading/empty/error/partial state. | Must | Không hiển thị data stale như real-time không cảnh báo. |
| REP-014 | Các công thức metric phải dùng definition tại `metric-definitions.md` và tính ở backend/report job. | Must | UI/API/CSV cùng result; progress/score không tự tính khác ở frontend. |
| REP-015 | Export report chỉ được cung cấp khi feature/policy cho phép, theo role + object scope; export nhạy cảm cần AuditLog. | Should | Teacher chỉ export lớp mình; Student self only; Admin permission; no secret/raw token. |
| REP-016 | Export/snapshot nặng phải có status `PROCESSING/READY/FAILED`, giới hạn dữ liệu/file và chống duplicate request phù hợp. | Should | User biết trạng thái; job error không lộ internal detail. |
| REP-017 | Analytics event phải có event name/schema/version/time/actor context tối thiểu, validate và deduplicate. | Should | Invalid/noisy event bị reject/quarantine; no raw PII/secret. |
| REP-018 | Event analytics chỉ dùng cho engagement/adoption; không là source of truth cho grade/progress/submission/audit. | Must | Business record MongoDB vẫn là nguồn chính thức. |
| REP-019 | Report/dashboard API phải ghi requestId/log latency/error; job/event failure có monitoring phù hợp. | Should | DevOps trace được failure/freshness/performance. |
| REP-020 | Thay đổi definition/report schema/analytics event có impact phải được version, review và traceability update. | Must | Có change record/test/backward compatibility hoặc migration note. |

## Filter And Sorting Rules

| Filter/sort | Rule |
| --- | --- |
| Date range | Validate format, `from <= to`, maximum range theo report/performance policy, timezone shown. |
| Classroom/Course/Activity | Backend xác minh caller có quyền scope trước khi query; ID guessing không được trả data. |
| Student/Teacher | Teacher chỉ filter Student thuộc Classroom/Course owned; Admin theo permission; Student không chọn user khác. |
| Status | Allowlist enum như ACTIVE/ARCHIVED, PENDING/ACCEPTED/EXPIRED, COMPLETED/LATE/MISSING. |
| Score/completion range | Numeric bound validated; `N/A`/ungraded excluded/explicit by policy. |
| Sort | Allowlist sortable field; stable secondary sort; ranking default Process Score DESC, không dùng client-only sort toàn dataset. |
| Pagination | Response có `page/limit/total` hoặc cursor metadata theo API standard; max limit enforced backend. |

## Out Of Scope Hiện Tại

- Certificate/badge analytics khi Certificate feature chưa được approve.
- Recommendation/prediction về khả năng đậu/rớt hoặc automated grading decision.
- Public leaderboard giữa Classroom/Teacher khác nhau.
- Scheduled email report, Gmail integration, external BI/data warehouse connector.
- Theo dõi hành vi xâm lấn privacy như recording keystroke, screen activity hoặc precise location.

## Traceability

- Data/summary: `../10-data-requirements/` và `../14-solution-architecture/data-architecture.md`.
- API: `../11-api-requirements/`.
- UI: `../12-ui-ux-requirements/`.
- Privacy/NFR: `../13-non-functional-requirements/privacy-compliance.md`, `../13-non-functional-requirements/performance-scalability.md`.
