# Backlog Management

## Mục Đích

Product Backlog là nguồn công việc được ưu tiên để tạo release. Nó bao gồm business capability, user story, technical enabler, API/data/UI work, defect, security finding, DevOps task, research spike và Change Request. Backlog không phải danh sách mong muốn vô hạn: mỗi item phải có value/risk/acceptance/owner/trace/release treatment rõ để Product Owner và team đưa ra trade-off đúng.

## Loại Backlog Item

| Type | Khi dùng | Ví dụ |
| --- | --- | --- |
| Epic / Capability | Nhóm value lớn, cần tách stories/tasks. | Classroom Join, Learning Workflow, DevOps Foundation. |
| User Story | Hành vi có giá trị theo actor. | Student join bằng Invite Link, Teacher reset deadline. |
| Technical Enabler | Điều kiện kỹ thuật bắt buộc để feature/release an toàn. | JWT token ADR, MongoDB index, Swagger contract, CI gate. |
| Defect | Behavior lệch requirement/acceptance. | Duplicate Enrollment sau retry join. |
| Security / Risk Action | Control hoặc mitigation có target/evidence. | Hash invitation token, dependency scan, restore rehearsal. |
| Spike | Nghiên cứu có timebox và output decision, không tự tạo feature shipped. | Chọn Cloud provider, file storage option. |
| Change Request | Thay đổi baseline scope/priority/behavior đã approved. | Nâng Gradebook từ Should lên Must. |
| Operational Task | Cấu hình/rehearsal/documentation cần cho release. | Staging secret setup, backup verification, release note. |

## Backlog Item Required Fields

| Field | Nội dung bắt buộc |
| --- | --- |
| Backlog ID / title | Mã bất biến, tên kết quả rõ; dùng `REL-BKL-*`, story/defect/CR ID liên quan. |
| Type / owner | Loại item, Product/Technical owner và implementer/team khi đã phân công. |
| Problem / value | User/business/quality/risk nào được giải quyết; không chỉ nêu giải pháp UI. |
| Scope and non-goal | Behavior bao gồm và loại trừ; role/resource/environment affected. |
| Priority | MoSCoW và lý do; Must/Should không tự đổi khi chưa có authority. |
| Target release / status | REL-0, REL-1, REL-2, REL-MVP-1, REL-1.1 hoặc Future; lifecycle status. |
| Traceability | BRQ/FR/US/UC/BR/AC/TS/NFR/API/Data/UI/Risk/CR liên quan. |
| Acceptance / evidence | Observable pass/deny/recovery condition, test/UAT/CI/runbook evidence expected. |
| Dependency / risk | Upstream item, decision/provider/data migration/role/security/release dependency. |
| Estimate / capacity | Team estimate/confidence sau refinement; không dùng estimate như commitment một mình. |
| Definition of Done | Code/design/test/docs/observability/trace/review required for item type. |

Không để password, raw token, secret, PII, Production URL credential hoặc full private submission vào backlog description/evidence.

## Priority Model

### MoSCoW Là Quyết Định Scope

| Priority | Quy tắc release |
| --- | --- |
| Must | Không thể đạt core workflow, security/data integrity, legal/policy hoặc MVP acceptance nếu thiếu. Must không được defer im lặng. |
| Should | Giá trị cao nhưng MVP vẫn giữ lời hứa nếu hoãn có record; default đưa REL-1.1 nếu capacity/risk chưa đủ. |
| Could | Có lợi nhưng không ảnh hưởng MVP outcome; chỉ lấy vào khi không làm rủi ro Must tăng. |
| Won't | Không thuộc release/roadmap hiện tại; giữ rationale để tránh quay lại debate. |

### Thứ Tự Trong Cùng Priority

Khi nhiều item có cùng MoSCoW, Product Owner cùng BA/Technical Lead/QA/DevOps đánh giá theo thứ tự:

1. Security/privacy/data integrity/release blocker.
2. Dependency unlock cho workflow end-to-end.
3. Direct value cho Student, Teacher, Admin trong MVP flow.
4. Reduction of high risk/rework hoặc operational readiness.
5. Effort/uncertainty/capacity sau khi value và risk đã rõ.

Không dùng một công thức điểm để hạ ưu tiên của RBAC, backup, audit, deadline/grade correctness hoặc CI security gate chỉ vì chúng không phải màn hình user-facing.

## Backlog Lifecycle

```text
Draft -> Needs Clarification -> Ready for Refinement -> Ready for Development
      -> In Progress -> In Review -> Integrated -> Verified
      -> Done / Released
      -> Blocked / Deferred / Cancelled
```

| Status | Điều kiện |
| --- | --- |
| Draft / Needs Clarification | Có ý tưởng/vấn đề nhưng thiếu value, scope, decision, trace hoặc owner. |
| Ready for Refinement | Có đủ context để team phân tích acceptance, dependency, risk và estimate. |
| Ready for Development | Pass Definition of Ready, target release/capacity đã xác nhận; không còn ambiguity blocking. |
| In Progress / In Review | Implementation hoặc peer review đang diễn ra; status không đồng nghĩa integrated. |
| Integrated | Đã merge/deploy vào shared environment và cần/đang có integration verification. |
| Verified | QA/owner evidence xác nhận item acceptance; chưa mặc định release. |
| Done | DoD complete, trace/docs updated, no unresolved item-level blocker. |
| Released | Included trong release record, deployed/verified in target environment. |
| Blocked / Deferred | Có reason, owner/decision/target; Deferred không mất trace. |

## Definition Of Ready (DoR)

Một item chỉ vào development/release commitment khi:

- Business problem, actor, expected behavior và non-goal rõ.
- MoSCoW/target release/owner được Product Owner hoặc authority xác nhận.
- FR/BR/AC/US/UC trace có sẵn hoặc BA ghi action bổ sung trước implementation.
- API/data/UI/security/DevOps impact và dependency/risk đã được Technical/QA/DevOps review phù hợp.
- Acceptance gồm positive, denial/edge case nếu role/state/deadline/data mutation liên quan.
- Test data/environment/capacity approach rõ; open decision không block hoặc có planned resolution before target.

## Definition Of Done (DoD)

DoD áp dụng theo item type và không thay release exit criteria. Một user/technical item thường cần:

- Code/config reviewed, buildable và versioned; no known secret/raw token exposure.
- API/Swagger/schema/error/auth/pagination updated khi contract affected.
- Data validation/index/migration/history/read-model/reconciliation considered when data affected.
- UI role/visibility/loading/empty/error/navigation states complete when frontend affected.
- Unit/integration/negative/regression tests proportional to risk; QA evidence attached.
- Logging/audit/metric/alert/feature flag/recovery impact addressed when operation/sensitive action affected.
- BA trace/acceptance/known limitation/docs updated; open risk/defect explicitly linked.

`Done` không bằng `Released`: release vẫn cần RC, UAT, quality/DevOps gate, approval và deployment verification.

## Release Planning And Capacity

- Release scope được chọn từ items `Ready for Development` hoặc items có explicit dependency plan, không chọn toàn bộ backlog Must bằng assumption.
- Team estimate/capacity là input planning; nếu capacity không đủ, Product Owner giảm Should/Could trước, hoặc quyết định đổi MVP scope qua Change Control.
- Technical Enabler/security/DevOps/QA work phải được phân bổ cùng capability, không để thành “việc phụ” cuối release.
- Một capability chỉ claim complete khi upstream/downstream components needed for acceptance cùng đạt: ví dụ Join cần API/data/UI/policy/audit/test; Deadline cần input/history/To-do/recalculation/dashboard/test.

## Defect, Risk Và Change Handling

| Item phát sinh | Backlog treatment |
| --- | --- |
| Critical/High defect | Triage ngay; link AC/BR/FR/Risk/release; block scope/release theo defect policy cho đến fix/retest/authorized decision. |
| Security/privacy/data incident | Tạo Incident/Defect/Risk action, containment trước; không xếp như normal enhancement. |
| Technical debt | Ghi impact/risk/interest; ưu tiên khi đe dọa reliability/security/delivery, không dùng label debt để giấu scope change. |
| New feature/request | Draft/Refinement; nếu baseline affected thì Change Request trước khi commitment. |
| Deferred Should/Could | Giữ target `REL-1.1`/Future, rationale and original trace; không xóa acceptance. |
| Accepted Risk / waiver | Link Risk/Waiver/expiry/mitigation/release note; không mark item Done nếu remediation còn nợ. |

## Backlog Review Cadence And Reporting

| Cadence | Nội dung |
| --- | --- |
| Weekly / sprint refinement | Clarify top items, DoR, dependency, acceptance, risk, estimate and priority. |
| Before increment commitment | Confirm capacity, Ready items, dependencies, quality enablers and exclusions. |
| Before RC / scope freeze | Review incomplete items, defect/risk/gap status, defer list and release note draft. |
| After UAT/release | Update Released/Deferred/Defect/Follow-up; create lessons learned and remove stale items only with decision. |

Minimum release backlog report: total Must/Should by status, committed/deferred scope, blocked items/owner, high risk/defect, open decision/dependency, evidence coverage and Go/No-Go implication.

## Liên Kết

- Release catalog: `release-backlog-catalog.md`.
- Scope/roadmap: `mvp-scope.md`, `release-roadmap.md`.
- Change/Risk/Defect: `../04-scope/change-control.md`, `../20-risk-management/`, `../18-acceptance-criteria/defect-waiver-management.md`.
