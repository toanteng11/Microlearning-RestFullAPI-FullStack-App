# Acceptance Criteria Overview

## Mục Đích

Mục 18 xác định điều kiện để Microlearning Classroom LMS Platform được xem là đáp ứng yêu cầu nghiệp vụ và sẵn sàng demo/UAT/release. Acceptance Criteria không chỉ kiểm tra “có nút chức năng”, mà xác nhận đúng actor, đúng business rule, đúng dữ liệu, đúng error handling, đúng bảo mật và đúng môi trường triển khai.

## Acceptance Model

```text
Business Requirement / Functional Requirement / Business Rule
        -> Acceptance Criterion (pass/fail rõ ràng)
        -> Test Scenario / UAT Scenario
        -> Test Data + API/UI/Log Evidence
        -> Defect or Acceptance Sign-off
```

| Artifact | Vai trò |
| --- | --- |
| Acceptance Criterion | Điều kiện pass/fail cụ thể cho behavior hoặc quality. |
| Test Scenario | Các bước, data và expected result để kiểm tra criterion. |
| UAT Scenario | Workflow do Product Owner/end-user representative xác nhận business fitness. |
| Quality Gate | Điều kiện kỹ thuật/NFR/DevOps trước release. |
| Evidence | Screenshot, API response, Swagger, AuditLog, CI/CD result, health/version result hoặc test execution record. |
| Defect/Waiver | Kết quả khi criterion fail hoặc rủi ro được chấp nhận có kiểm soát. |

## Nguyên Tắc Acceptance

| ID | Nguyên tắc | Áp dụng |
| --- | --- | --- |
| ACC-PR-01 | Testable | Mỗi criterion có precondition, action và expected result đo được; tránh “giao diện tốt” hoặc “chạy ổn”. |
| ACC-PR-02 | Backend authoritative | Các rule về role, ownership, deadline, score, export phải pass qua API/service, không chỉ UI. |
| ACC-PR-03 | Positive and negative | Mỗi flow Must có happy path và ít nhất các denial/exception quan trọng. |
| ACC-PR-04 | Data integrity | Không chỉ kiểm response; kiểm state MongoDB/read model/audit khi workflow thay đổi data. |
| ACC-PR-05 | Privacy/security | Không dùng test thành công của role đúng để suy ra role khác đã bị chặn; phải có negative authorization test. |
| ACC-PR-06 | Environment-aware | Local, Staging/UAT và Production readiness có tiêu chí/evidence riêng. |
| ACC-PR-07 | Traceable | Criterion map được tới FR/BR/Use Case/NFR và test scenario. |
| ACC-PR-08 | No silent waiver | Must failure không được bỏ qua; waiver phải có risk, mitigation, owner, expiry và approver. |

## Given/When/Then Format

```text
Given: precondition, role, status, ownership, data/environment
When: actor thực hiện hành động qua UI/API
Then: observable result, data transition, side effect/audit/error expected
And: data outside scope không bị lộ hoặc thay đổi ngoài ý muốn
```

Ví dụ:

```text
Given Teacher A ACTIVE sở hữu Course X và Lesson L đã PUBLISHED
When Teacher A reset deadline L với deadline mới hợp lệ và reason
Then deadline history và AuditLog được tạo, Student To-do/Calendar/late-missing được cập nhật
And Progress/Submission/Attempt cũ không bị xóa
```

## Scope Acceptance

| Group | Nội dung bắt buộc |
| --- | --- |
| Functional workflow | Auth, Teacher Invitation, Classroom join, content, learning, assessment, grading, admin governance, reporting. |
| Business rule | Account status, RBAC/ownership, policy precedence, lifecycle, deadline, score, audit, data retention. |
| UI/UX | Route/role visibility, navigation, responsive core flow, loading/empty/error, accessibility basics. |
| API/Data | Swagger, response/error contract, authorization, validation, pagination, data state/index/read-model behavior. |
| Security/privacy | Token/password/secret protection, object-level denial, upload/export policy, AuditLog redaction. |
| Performance/reliability | NFR p95 baseline, idempotency, health/dependency errors, backup/rollback direction. |
| DevOps/release | Docker/CI/CD, environment config, HTTPS/CORS/SPA fallback, health/version/smoke/monitoring. |
| Documentation | BA/API/DevOps/known issue/release evidence up to date. |

## Acceptance Levels

| Level | Mục đích | Gate owner |
| --- | --- | --- |
| Developer Acceptance | Developer verifies unit/integration/local behavior before handoff. | Developer/Technical Lead |
| QA/System Acceptance | QA verifies functional/regression/API/data/NFR behavior in test or Staging. | QA Lead |
| UAT | Product Owner/Teacher/Student/Admin representative confirms business workflow. | Product Owner/BA |
| Release Acceptance | Team confirms quality/deploy/operations/rollback readiness. | Product Owner, Technical Lead, QA Lead, DevOps |

## Out Of Scope Acceptance

- Không xác nhận rằng sản phẩm là bản clone hoặc dùng thương hiệu/UI của Google Classroom; các workflow chỉ tham khảo nghiệp vụ.
- Không nghiệm thu native mobile app, payment, AI recommendation/grading, email/Gmail automation, external BI/SSO integration hoặc certificate feature nếu chưa được approved scope.
- Không dùng dữ liệu Production thật cho UAT nếu chưa có privacy approval/masking/access control.

## Exit Definition

Một release/demo được xem là accept-ready khi tất cả Must criterion trong scope đã pass, không có defect Critical/High chưa được xử lý hoặc waiver chính thức, evidence đủ, quality gate pass và Product Owner có cơ sở sign-off.

## Tài Liệu Trong Mục 18

| Tài liệu | Mục đích |
| --- | --- |
| `acceptance-criteria-overview.md` | Nguyên tắc, scope, format và levels. |
| `system-acceptance-criteria.md` | System-wide acceptance baseline/gate. |
| `acceptance-criteria-catalog.md` | Catalog criterion có mã và traceability. |
| `uat-plan.md` | Kế hoạch UAT, entry/exit, data/environment/roles. |
| `uat-execution-and-signoff.md` | Cách thực thi UAT, evidence, sign-off và retest. |
| `test-scenarios.md` | Core functional/API/data test scenarios. |
| `teacher-invitation-test-scenarios.md` | UAT/test flow invitation thủ công và security edge cases. |
| `google-classroom-reference-test-scenarios.md` | Workflow reference Stream/Classwork/Submission, không phải clone. |
| `security-privacy-acceptance.md` | Security/privacy/audit/upload/export acceptance. |
| `api-data-acceptance.md` | API/Swagger/authorization/validation/data integrity acceptance. |
| `ui-ux-acceptance.md` | UI/navigation/state/accessibility/responsive acceptance. |
| `devops-release-acceptance.md` | Docker/CI-CD/Cloud/health/rollback/release acceptance. |
| `defect-waiver-management.md` | Severity, triage, waiver, known issue và closure rule. |

## Liên Kết

- Requirements: `../07-requirements/`.
- Business Rules: `../17-business-rules/`.
- NFR quality gate: `../13-non-functional-requirements/nfr-quality-gates.md`.
- DevOps release: `../15-devops-deployment/release-management.md`.
