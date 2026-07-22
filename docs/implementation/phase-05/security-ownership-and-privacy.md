# Phase 05 Security, Ownership And Privacy

## 1. Security Objectives

1. Student không thấy correct answer/rubric trước hoặc ngoài policy release.
2. Student chỉ xem/sửa Attempt, Submission, Grade và Feedback của chính mình.
3. Teacher chỉ quản lý assessment thuộc Course/Classroom mình có quyền.
4. Admin không mặc nhiên đọc private learning evidence.
5. Score, state, timestamps và deadline do backend quyết định.
6. Retry/concurrency không tạo duplicate hoặc overwrite im lặng.

## 2. Proposed Capabilities

### Student

- `quiz.view_assigned`
- `quiz.attempt`
- `quiz.result_view_own`
- `assignment.view_assigned`
- `submission.manage_own`
- `submission.view_own`
- `grade.view_own`

### Teacher

- `quiz.manage_owned`
- `quiz.publish_owned`
- `quiz.results_view_owned`
- `quiz.review_owned`
- `assignment.manage_owned`
- `assignment.publish_owned`
- `submission.view_owned`
- `grade.manage_owned`
- `deadline_exception.manage_owned`

### Governance Boundary

P05 reuse `content.governance_view` hiện có cho Admin Course assessment counts/status metadata. Baseline không thêm private Grade/deadline override capability hoặc route cho Admin/Super Admin. Nếu nghiệp vụ exceptional access trở thành yêu cầu, phải change-control API, purpose logging, approval và privacy tests trước khi thêm permission.

## 3. Object Authorization Matrix

| Resource/action | Student | Teacher | Admin | Super Admin |
| --- | --- | --- | --- | --- |
| Quiz published intro | Active enrolled | Owned | Metadata only | Metadata only |
| Question author/scoring config | No | Owned | No | No default |
| Own Attempt | Own | Owned Course | No | No default |
| Other Student Attempt | No | Owned Course | No | No default |
| Assignment published | Active enrolled | Owned | Metadata only | Metadata only |
| Own Submission | Own + policy | Owned Course read | No | No default |
| Grade draft | No | Owned Course | No | No default |
| Returned Grade | Own | Owned Course | Aggregate metadata only | Aggregate metadata only |
| Private feedback/comment | Own context | Owned Course | No | No default |
| Deadline exception | View own effective date | Manage owned | No private row | No default override |

## 4. Scope Resolution Order

```text
authenticated ACTIVE actor
  -> capability
  -> resource parent chain
  -> Classroom/Course ownership or Enrollment
  -> resource lifecycle/availability
  -> Student identity/evidence ownership
  -> field-level projection
```

Không authorize chỉ bằng role hoặc resource ID từ body.

## 5. Correct Answer Secrecy

- Correct option IDs/rubric chỉ ở Teacher/scoring model projection.
- Student DTO serializer dùng explicit allowlist, không spread Mongoose object.
- OpenAPI Student schema không tham chiếu Teacher Question schema.
- React bundle không chứa seeded correct answers ngoài synthetic demo environment.
- Error details không nêu correct answer.
- Logs/traces/audit không serialize answer/scoring snapshot.
- Cache key/proxy không dùng shared public caching cho attempt/result endpoints.

## 6. Grade And Feedback Privacy

- Student endpoint lấy identity từ session, không nhận arbitrary `studentId`.
- Draft Grade/Feedback không xuất hiện trong Student list/count.
- Return transaction là visibility boundary.
- Teacher list luôn scope Course owner và paginated.
- Admin/Super Admin governance chỉ count/status; P05 không có endpoint đọc private Grade/Submission body.
- Export deferred P06 phải tái kiểm privacy, không kế thừa broad DTO.

## 7. Mass Assignment Controls

Request schema `strict` và reject unknown fields. Client không được set:

- owner/student/classroom/course IDs ngoài route/scope;
- score/maxScore/computed percentage;
- attempt/submission/grade status;
- `startedAt/submittedAt/returnedAt/isLate`;
- revision/history/audit fields;
- correct answer snapshot;
- effective deadline override flag hoặc policy bypass field.

## 8. URL And Media Security

- Chỉ `https:`; reject `javascript:`, `data:`, `file:`, credential-in-URL.
- Question media host nằm trong env allowlist.
- Video chỉ approved provider ID/embed URL; iframe `sandbox`, allow tối thiểu.
- Image có `referrerPolicy="no-referrer"`, alt/fallback; CSP `img-src` allowlist.
- Backend không fetch arbitrary URL trong request transaction.
- Link mở `noopener,noreferrer`; UI hiện destination host.
- Không lưu signed/tokenized URL trong long-lived data/log.

## 9. Content Safety

- Instruction/prompt/answer/feedback render Markdown/plain text qua sanitizer hiện có.
- Raw HTML disabled.
- Limit length/nesting để tránh parser/DOM abuse.
- Formula/code snippets là text, không eval.
- External media failure không làm mất Question text.

## 10. Abuse And Rate Limits

| Route group | Key | Baseline control |
| --- | --- | --- |
| Start Attempt | user + quiz + IP | Low burst, attempt natural-key guard |
| Save Answer | user + attempt | Moderate burst, payload size cap |
| Submit Attempt | user + attempt | Strict burst + terminal idempotency |
| Save/Turn In Submission | user + assignment | Moderate/strict burst |
| Grade/Return | teacher + resource | Moderate, revision guard |
| Media/link validation | actor + route | Strict, no network fetch |

Rate limit không thay business transaction guard.

Baseline dùng cửa sổ `60` giây: Start Attempt tối đa `300` request/IP để không khóa cả lớp dùng chung NAT và `20` request/user+Quiz; Save Answer tối đa `180` request/user+Attempt; các assessment mutations khác tối đa `120` request/actor. Submit/turn-in/grade vẫn dùng strict state/revision guard; mọi giá trị phải đi qua environment schema, không hard-code rải rác trong route.

## 11. CSRF, Session And CORS

- Reuse HttpOnly refresh/session policy Phase 02.
- Mutating endpoints follow existing same-origin/CSRF strategy.
- CORS allowlist từ config, không wildcard credentialed origin.
- BLOCKED/INACTIVE account bị chặn ở auth middleware trước domain action.

## 12. Concurrency Threats

| Threat | Control |
| --- | --- |
| Double start | partial unique active attempt + transaction |
| Double submit | terminal state/revision/natural key |
| Two tabs save answers | expected revision conflict |
| Concurrent turn-in | unique current Submission + revision |
| Grade old submission revision | evidence revision match |
| Concurrent regrade | expected grade revision |
| Deadline race | expected exception revision/history unique |

## 13. Audit Policy

Audit required:

- Quiz/Assignment publish/unpublish/close/reopen/archive.
- Question set revision published.
- Attempt finalized/timeout/review/regrade/result release.
- Submission turn-in/unsubmit/resubmit.
- Grade save/return/regrade.
- Deadline exception mutation.
- Mọi future exceptional access/override chỉ được audit sau khi có approved change-control; không tồn tại trong baseline route hiện tại.

Audit metadata allowlist; private answer/submission/feedback content không lưu.

## 14. Security Test Matrix

- Student A guessed Attempt/Submission/Grade của Student B.
- Teacher B guessed Course/Quiz/Assignment của Teacher A.
- Admin/Super Admin gọi private Attempt/Submission/Grade endpoint bị từ chối trong baseline.
- Direct URL to draft/unpublished/archived assessment.
- Correct answer field leak recursive trong Student DTO/OpenAPI.
- Manipulated score/status/timestamp/owner fields.
- External URL schemes/private hosts/credential URLs.
- XSS corpus trong prompt, answer, instruction, feedback.
- Replay/double-click/concurrent race.
- Disabled/removed enrollment and blocked account.

## 15. Incident Handling

Nếu phát hiện answer/grade leakage:

1. Disable affected endpoint/feature flag.
2. Preserve sanitized logs/request IDs; không copy private payload vào issue công khai.
3. Rotate exposed secret nếu có URL token.
4. Identify affected users/resources and timeframe.
5. Patch DTO/cache/log boundary, add regression test.
6. Record incident/decision theo Phase 20 BA governance.
