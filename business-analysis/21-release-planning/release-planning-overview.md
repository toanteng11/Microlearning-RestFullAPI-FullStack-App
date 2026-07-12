# Release Planning Overview

## Mục Đích

Release Planning chuyển scope và backlog thành các increment có thể kiểm chứng được. Với **Microlearning Classroom LMS Platform**, một release không chỉ là code được deploy mà là một tập hợp capability đã được scope, build, test, UAT, vận hành và phê duyệt theo mức rủi ro phù hợp.

Tài liệu này liên kết Product Owner, Business Analyst, Developer, QA và DevOps để trả lời rõ:

- Bản MVP phải mang lại workflow nào cho Student, Teacher và Admin?
- Feature nào là Must, feature nào chỉ được đưa vào khi capacity/evidence cho phép?
- Increment nào là internal integration, UAT candidate và bản MVP demo/Cloud release?
- Điều kiện nào chặn release hoặc buộc defer scope?
- Ai có quyền quyết định scope, Go/No-Go, waiver và recovery?

## Phạm Vi

Release Planning quản lý các nội dung sau:

- MVP scope, release scope và Post-MVP boundaries.
- Release increment, capability bundle, backlog order và dependency.
- Entry/exit criteria cho development, integration, UAT và Cloud release.
- Quality evidence: requirements/business rules, API/Swagger, data, UI, security, CI/CD, UAT, monitoring, backup/rollback.
- Release risk, known limitation, waiver, Go/Conditional Go/No-Go và post-release follow-up.

Release Planning không thay thế quy trình thao tác deploy/rollback chi tiết. Các thao tác đó thuộc `../15-devops-deployment/`; mục 21 quyết định **khi nào** một scope đủ điều kiện đi tiếp và **ai** phê duyệt.

## Nguyên Tắc Release

1. **Value slice trước technical completeness đơn lẻ:** mỗi increment cần tạo được giá trị kiểm chứng cho workflow, không chỉ hoàn thành một collection hay page rời rạc.
2. **Must trước Should:** không lấy capacity của auth/RBAC, deadline, grading, audit, Swagger hoặc recovery để đổi lấy tính năng đẹp hơn.
3. **Evidence trước trạng thái Complete:** BA coverage, mockup hoặc code review không tự thay cho CI, QA, UAT và operational evidence.
4. **No silent scope change:** thay đổi Must/Should, API/data/security, release target hoặc external integration phải qua Change Control.
5. **Risk-based release:** security, privacy, data integrity, grade/progress/deadline, migration và Cloud change cần gate nghiêm hơn UI copy hay cosmetic fix.
6. **Rollback is planned, not hoped for:** high-risk release phải biết exact artifact, compatibility, backup/recovery decision và người xử lý.
7. **Không hứa ngày khi chưa có capacity:** roadmap dùng sequence và gate; ngày target chỉ được Product Owner/Project Lead ghi khi có plan nguồn lực được xác nhận.

## Thuật Ngữ Release

| Thuật ngữ | Ý nghĩa |
| --- | --- |
| Backlog Item | Đơn vị công việc có value/technical outcome, owner, priority, trace và acceptance rõ. |
| Release Increment | Nhóm capability được tích hợp để kiểm thử nội bộ; chưa mặc định public. |
| Release Candidate (RC) | Artifact versioned đã pass điều kiện CI cần thiết và sẵn sàng Staging/UAT. |
| Deployment | Hành động đưa artifact/config lên một environment. |
| Release | Quyết định cho audience mục tiêu sử dụng build/deployment. |
| Scope Freeze | Thời điểm không nhận change mới vào release đang chuẩn bị, trừ defect/security/hotfix được authority chấp nhận. |
| Go / Conditional Go / No-Go | Kết quả release readiness review theo evidence và residual risk. |

## Bộ Tài Liệu Mục 21

| Tài liệu | Câu hỏi trả lời |
| --- | --- |
| `release-planning-overview.md` | Mục tiêu, nguyên tắc, lifecycle và liên kết governance của kế hoạch release là gì? |
| `release-strategy.md` | Chiến lược increment/environment/artifact và cách phát hành theo risk là gì? |
| `mvp-scope.md` | Capability nào bắt buộc cho MVP, capability nào conditional/Post-MVP? |
| `release-roadmap.md` | Trình tự `REL-0` đến MVP, sau MVP và gate của từng increment là gì? |
| `release-backlog-catalog.md` | Backlog release-level nào được ưu tiên, trace tới requirement và evidence nào? |
| `backlog-management.md` | Backlog được tạo, refined, ước lượng, thay đổi, đóng và báo cáo thế nào? |
| `release-dependencies-and-assumptions.md` | Dependency/assumption/open decision nào ảnh hưởng commitment release? |
| `release-entry-exit-criteria.md` | Khi nào feature/RC/release được phép đi tiếp, block hoặc defer? |
| `release-governance-and-approval.md` | Ai quyết định scope, approval, waiver, communication và post-release follow-up? |

## Release Lifecycle

```text
Scope baseline / backlog refinement
  -> release increment selection and dependency review
  -> implementation + API/data/UI design + local quality checks
  -> CI / integrated environment verification
  -> scope freeze + Release Candidate
  -> QA regression + UAT + NFR/DevOps evidence
  -> release readiness review: Go / Conditional Go / No-Go
  -> controlled Cloud deployment + smoke/monitoring window
  -> release closure, known issue and lessons learned
```

Mỗi mũi tên là một decision point. Nếu entry criteria chưa đạt, item ở lại backlog, bị tách scope hoặc release bị lùi; không ghi nhận pass bằng assumption.

## Vai Trò Chính

| Role | Trách nhiệm trong Release Planning |
| --- | --- |
| Product Owner | Chịu trách nhiệm business value, priority, scope trade-off, business acceptance và final Go/No-Go theo matrix. |
| Business Analyst | Duy trì release scope/backlog/traceability, làm rõ impact và ghi nhận decision/known limitation. |
| Technical Lead | Xác nhận design/API/data/security compatibility, technical readiness và technical recovery decision. |
| Frontend / Backend Lead | Cam kết implementation scope, API/UI/data evidence, dependency và regression impact. |
| QA Lead | Xác nhận test strategy, defect severity/retest, UAT evidence và quality release recommendation. |
| DevOps Engineer | Xác nhận CI/CD, artifact, environment, Cloud, observability, backup/rollback/release execution readiness. |
| Security Reviewer | Review/approve khi release có auth/RBAC/token/secret/privacy/export/upload risk. |
| Teacher / Student / Admin Representative | Tham gia UAT và xác nhận workflow thực tế của role. |

## Điều Kiện Thành Công Của Kế Hoạch

- Scope MVP có owner, priority, dependencies và acceptance evidence rõ.
- Release increment có thể kiểm chứng bằng workflow end-to-end, không chỉ bằng checklist module rời.
- Backlog Must, Should, Could, Won't không trộn lẫn; mọi exception có decision/Change Request.
- RC/UAT/Cloud release có version/artifact/evidence/rollback target và risk decision.
- Known issue, deferred scope, Accepted Risk và Post-MVP item được ghi minh bạch.

## Liên Kết

- Scope baseline/Change Control: `../04-scope/scope-baseline.md`, `../04-scope/change-control.md`.
- Feature priority: `../07-requirements/feature-priority.md`.
- Acceptance/UAT: `../18-acceptance-criteria/`.
- Traceability/gaps: `../19-traceability/`.
- Risk/issue/decision: `../20-risk-management/`.
- Release operation: `../15-devops-deployment/release-management.md`.
