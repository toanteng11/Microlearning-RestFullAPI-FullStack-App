# Classroom Workflow Reference Test Scenarios

## Mục Đích

Tài liệu này kiểm tra các workflow Classroom/Stream/Classwork/Submission/Feedback được tham khảo về nghiệp vụ từ các LMS phổ biến như Google Classroom. Dự án **không** nghiệm thu như bản clone và không sao chép thương hiệu, logo hay giao diện độc quyền.

## Reference Workflow Scenarios

| ID | Scenario | Actor | Preconditions | Expected result | Priority |
| --- | --- | --- | --- | --- | --- |
| TS-GC-001 | Teacher đăng Announcement lên Class Stream | Teacher owner | Classroom ACTIVE, Teacher authorized | Announcement published chỉ cho Classroom scope; Audit/event as policy. | Must |
| TS-GC-002 | Student xem Class Stream | Student enrolled | Announcement published/visible | Student thấy announcement mới nhất của Classroom mình, không thấy lớp khác. | Must |
| TS-GC-003 | Teacher tạo Assignment trong Classwork | Teacher owner | Course/Classroom valid | Assignment has instruction, max score, allowed submission policy and due date/late policy explicit. | Must |
| TS-GC-004 | Student xem Assignment detail | Student enrolled | Assignment published/visible | Student sees instruction/due/authorized attachment, no Teacher-only grade data. | Must |
| TS-GC-005 | Student nộp Submission | Student enrolled | Allowed submission type/open Assignment | Submission persisted with submitted/late status/time; retry not duplicate. | Must |
| TS-GC-006 | Teacher xem Submission list | Teacher owner | Assignment has Student variants | Teacher sees submitted/missing/late/graded/returned only in owned scope. | Must |
| TS-GC-007 | Teacher chấm điểm Submission | Teacher owner | Valid Submission/max score | Grade saved correctly and audit/recalculation performed where applicable. | Must |
| TS-GC-008 | Teacher gửi Feedback/return work | Teacher owner | Grade/Submission valid | Feedback private and Student visibility begins only after returned/published policy. | Must |
| TS-GC-009 | Student xem Grade và Feedback | Student owner | Teacher returned result | Student sees only own released result/feedback. | Must |
| TS-GC-010 | Teacher xem Grades/Progress | Teacher owner | Multiple Student/activity states | Teacher sees scoped gradebook/progress/ranking with correct filters/pagination. | Should |
| TS-GC-011 | Teacher tạo Lesson/Material với deadline | Teacher owner | Course valid | Published Lesson appears in Student To-do with deadline; Material only actionable if required policy. | Must |
| TS-GC-012 | Student theo learning flow từ To-do | Student enrolled | Pending Lesson/Quiz/Assignment | Student opens item, completes/submits, returns context; To-do/progress update. | Must |
| TS-GC-013 | Teacher reset Lesson deadline | Teacher owner | Published Lesson with affected Student | Reason/history/audit/recalculation, no historical data loss. | Must |
| TS-GC-014 | Teacher manages roster | Teacher owner | Classroom with Student | Teacher views own roster; removal/re-enrollment policy respects history and access. | Should |
| TS-GC-015 | Cross-Classroom privacy denial | Student/Teacher outside scope | Other Classroom data exists | Stream/Classwork/Submission/Grade/Resource data is not exposed. | Must |

## Reference Acceptance Principles

- Classroom is the organizational center for Stream, Classwork, People/Roster and Grades/Progress workflow.
- Student sees only content/feedback/results within active enrollment; Teacher sees owned scope.
- Submission workflow respects late/missing/returned/regrade/feedback rules rather than imitating any external product UI.
- Naming and visual design remain the project’s own; only validated business workflow is in scope.

## Liên Kết

- Student/Teacher functional reference: `../07-requirements/student-learner-functions-reference.md`, `../07-requirements/teacher-functions-reference.md`.
- Business rules: `../17-business-rules/classroom-content-rules.md`, `../17-business-rules/assessment-grading-rules.md`.
