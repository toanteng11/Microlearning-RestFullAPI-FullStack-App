# References

## Mục Đích

Tài liệu này quản lý các nguồn được dùng để tham khảo workflow, standard hoặc technical implementation. Reference hỗ trợ quyết định nhưng **không tự thay thế** scope, Business Rule, privacy policy hoặc acceptance đã được Product Owner/Technical Lead phê duyệt.

## Quy Tắc Sử Dụng Reference

- Ưu tiên source nội bộ đã được review khi quyết định hành vi sản phẩm.
- External reference phải ghi rõ purpose, boundary, owner và thời điểm cần review lại; không copy brand, logo, UI đặc thù, nội dung bản quyền hoặc policy ngoài phạm vi dự án.
- Google Classroom chỉ là nguồn tham khảo nghiệp vụ/workflow. Sản phẩm không được định vị là clone hoặc integration Google Classroom khi chưa có approved scope.
- Standard/version mới phải được Technical Lead/Security/DevOps đánh giá compatibility trước khi áp dụng vào implementation.
- URL external chỉ là nguồn đọc; không chứa credential, token, invite link, secret hoặc project data.

## Internal Project References

| Reference group | Vị trí | Mục đích sử dụng |
| --- | --- | --- |
| Document Control | `../00-document-control/` | Version, approval, revision, deliverables. |
| Scope and Stakeholders | `../03-stakeholders/`, `../04-scope/` | Authority, baseline, assumption, dependency, change control. |
| Requirements and Workflows | `../05-user-roles/` đến `../09-use-cases/` | Role, process, FR/US/UC/priority. |
| Data / API / UI / NFR | `../10-data-requirements/` đến `../13-non-functional-requirements/` | Contract, validation, privacy, accessibility, quality gates. |
| Architecture and DevOps | `../14-solution-architecture/`, `../15-devops-deployment/` | Architecture decision, Docker, CI/CD, Cloud, recovery, operations. |
| Reporting and Business Rules | `../16-reporting-analytics/`, `../17-business-rules/` | Metric, export, audit, business enforcement. |
| Acceptance, Traceability, Risk, Release | `../18-acceptance-criteria/` đến `../21-release-planning/` | Test/UAT/evidence, gap, risk, roadmap, Go/No-Go. |

## External Reference Catalog

| REF ID | Source | Purpose / allowed use | Boundary / owner | Last reviewed |
| --- | --- | --- | --- | --- |
| REF-EXT-001 | [Google Classroom Help Center](https://support.google.com/edu/classroom/) | Tham khảo workflow class code/link join, class organization, classwork, assignment, feedback, teacher/student/admin help topics. | Không clone brand/UI/API; BA + Product Owner review workflow adaptation. | 2026-07-11 |
| REF-EXT-002 | [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) | Tham khảo contract description cho RESTful API/Swagger: paths, schema, request/response, auth/error documentation. | Technical Lead + Backend Lead chọn version/tool compatibility. | 2026-07-11 |
| REF-EXT-003 | [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/) | Tham khảo secure development/verification cho auth, access, session, input, logging và data protection. | Security Reviewer + Technical Lead; không claim compliance level nếu chưa assessment. | 2026-07-11 |
| REF-EXT-004 | [Docker Docs](https://docs.docker.com/) | Tham khảo Docker image, Compose, build/runtime và container operation. | DevOps + Technical Lead; provider command/config nằm trong runbook riêng. | 2026-07-11 |
| REF-EXT-005 | [React Documentation](https://react.dev/) | Tham khảo ReactJS component/state/UI implementation. | Frontend Lead; không thay thế UI/UX/accessibility requirements. | 2026-07-11 |
| REF-EXT-006 | [Node.js Documentation](https://nodejs.org/docs/latest/api/) | Tham khảo Node.js runtime/API behavior cho Backend. | Backend Lead; version quyết định trong technology stack/lockfile. | 2026-07-11 |
| REF-EXT-007 | [MongoDB Documentation](https://www.mongodb.com/docs/) | Tham khảo data model, indexes, query, backup/operation capability. | Backend Lead + DevOps; không thay data/retention rule bằng vendor default. | 2026-07-11 |

## Reference Validation Checklist

- [ ] Source là official/primary hoặc được authority chấp nhận.
- [ ] Mục đích và boundary của source rõ, không kéo feature ngoài scope.
- [ ] Standard/version/tool compatibility được Technical Lead/DevOps/Security review khi implementation dùng nó.
- [ ] Nội dung reference được diễn giải lại theo project requirement, không copy nguyên văn dài hoặc copy branded UI/content.
- [ ] Nếu reference thay đổi decision hiện tại, tạo Issue/Decision/Change Request thay vì tự sửa implementation.

## Liên Kết

- Google workflow boundary: `google-classroom-reference-glossary.md`.
- Product positioning: `../02-product-vision/google-classroom-reference.md`.
- Technical stack: `../14-solution-architecture/technology-stack.md`.
- Security/DevOps: `../13-non-functional-requirements/`, `../15-devops-deployment/`.
