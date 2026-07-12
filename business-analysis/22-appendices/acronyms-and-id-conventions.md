# Acronyms And ID Conventions

## Mục Đích

Tài liệu này là chuẩn nhanh cho acronym, mã định danh và naming convention xuyên suốt bộ BA. Nó tổng hợp convention đã có trong Requirement/Traceability/Risk/Release sources; không tự thay đổi ID source. Khi cần mã mới, owner phải kiểm tra uniqueness và cập nhật source/matrix liên quan.

## Acronyms

| Acronym | Nghĩa | Cách dùng trong dự án |
| --- | --- | --- |
| AC | Acceptance Criterion | Điều kiện chấp nhận có mã trong mục 18. |
| ADR | Architecture Decision Record | Quyết định architecture/security/technology có impact lâu dài. |
| API | Application Programming Interface | RESTful interface Backend cung cấp cho Frontend/technical consumer. |
| BA | Business Analyst | Owner chính của requirement, traceability và document consistency. |
| BR | Business Rule | Quy tắc nghiệp vụ/system policy có enforcement/test impact. |
| BRQ | Business Requirement | Nhu cầu business cấp cao. |
| CI/CD | Continuous Integration / Continuous Delivery or Deployment | Pipeline build/test/artifact/deploy. |
| CR | Change Request | Đề xuất thay đổi baseline phải qua Change Control. |
| DEF | Defect | Lỗi implementation lệch expected behavior/acceptance. |
| DevOps | Development and Operations | Role/capability về Docker, CI/CD, Cloud, observability, recovery. |
| DOP | DevOps / Deployment | Prefix acceptance hoặc artifact liên quan vận hành/deployment. |
| FR | Functional Requirement | Requirement hành vi chi tiết. |
| ID | Identifier | Mã định danh duy nhất, ổn định theo artifact. |
| MVP | Minimum Viable Product | Phạm vi nhỏ nhất tạo value end-to-end và đủ acceptance. |
| NFR | Non-Functional Requirement | Security, performance, reliability, privacy, usability, maintainability. |
| PO | Product Owner | Authority business/scope/priority/release decision. |
| QA | Quality Assurance | Test, UAT, defect/retest, quality recommendation. |
| RBAC | Role-Based Access Control | Access theo role/permission, cần thêm object scope check. |
| RC | Release Candidate | Build/artifact sẵn sàng Staging/UAT sau scope freeze. |
| RPO / RTO | Recovery Point / Recovery Time Objective | Mục tiêu data loss/time recovery. |
| RTM | Requirement Traceability Matrix | Matrix BRQ đến FR/BR/AC/TS/design/release evidence. |
| SLA | Service Level Agreement | Không được claim khi chưa có policy/provider commitment. |
| TS | Test Scenario | Scenario test/UAT có mã. |
| UAT | User Acceptance Testing | Xác nhận user/business acceptance trước release. |
| UX | User Experience | Trải nghiệm và flow của User trên UI. |

## ID Prefix Catalog

| Artifact | Prefix / ví dụ | Source owner/location |
| --- | --- | --- |
| Assumption / Constraint / Dependency | `ASM-001`, `CON-001`, `DEP-DEVOPS-001` | `../04-scope/assumptions-constraints-dependencies.md` |
| Change Request | `CR-001` | `../04-scope/change-control.md` hoặc tracker chính thức |
| Business Requirement | `BRQ-001` | `../07-requirements/business-requirements.md` |
| Functional Requirement | `FR-001`, `FR-009A` | `../07-requirements/functional-requirements.md` |
| User Story | `US-STU-001`, `US-TCH-001`, `US-ADM-001`, `US-DEVOPS-001` | `08-user-stories/` |
| Use Case | `UC-001` đến `UC-079` | `09-use-cases/` |
| Data validation / entity convention | Source-specific ID khi có | `10-data-requirements/` |
| API / UI / DevOps Acceptance | `API-AC-*`, `UI-AC-*`, `DOP-AC-*`, `SEC-AC-*` | `18-acceptance-criteria/` |
| NFR | `NFR-SEC-*`, `NFR-BKP-*`, `NFR-RBK-*`, `NFR-*` | `13-non-functional-requirements/` |
| Architecture review / decision | `ARC-001`, `ADR-001` | `14-solution-architecture/` |
| Business Rule | `BR-001` đến `BR-110` | `17-business-rules/` |
| Acceptance Criterion / Test Scenario | `AC-*`, `TS-*`, `TS-INV-*`, `TS-GC-*` | `18-acceptance-criteria/` |
| Traceability gap | `TR-GAP-001` | `../19-traceability/traceability-gap-register.md` |
| Risk / Issue / Decision | `R-001`, `ISS-001`, `DEC-001` | `20-risk-management/` |
| Incident / evidence execution | `INC-*`, `EVT-*` when tracker/repository creates them | Incident/UAT/release evidence system |
| Release / capability / backlog | `REL-0`, `REL-MVP-1`, `MVP-CAP-001`, `REL-BKL-001`, `REL-DEP-002`, `REL-ASM-001` | `21-release-planning/` |
| Appendix open question | `APP-Q-001` | `open-questions.md` |
| BA Deliverable | `BA-DEL-001` | `../00-document-control/ba-deliverables.md` |

## Quy Tắc Tạo Và Duy Trì ID

1. ID là immutable sau khi được review/trace; không tái sử dụng ID của item đã retired, rejected hoặc superseded.
2. Tạo ID tiếp theo theo sequence phù hợp của source owner; child ID như `FR-009A` chỉ dùng khi mở rộng requirement cha có lý do rõ.
3. Không đổi ID chỉ để sắp xếp đẹp. Nếu đổi bắt buộc, update toàn bộ RTM, test, risk/release/gap/decision references trong cùng change.
4. Range chỉ dùng khi mọi item trong range thực sự liên quan. Nếu không, liệt kê từng ID.
5. Status `Superseded`, `Deprecated`, `Deferred`, `Rejected` giữ historical link; không xóa dòng có impact đã phát hành/test.
6. Template example không được dùng ID thật khi tạo record mới; tạo next available ID ở source system.

## Naming Convention

| Đối tượng | Quy ước |
| --- | --- |
| Folder/file BA | English lowercase kebab-case, ví dụ `../21-release-planning/release-entry-exit-criteria.md`; tất cả là `.md`. |
| Nội dung BA | Viết bằng tiếng Việt; giữ English term/proper name/code/API field khi cần độ chính xác. |
| Heading | Title Case tiếng Anh cho tên document; nội dung heading tiếng Việt hoặc English term chuẩn khi hợp lý. |
| API path | Lowercase plural resource theo API requirement, ví dụ `/api/v1/classrooms`; không tự đổi contract trong Appendix. |
| JavaScript/API/data field | `camelCase`, ví dụ `classroomId`, `completionDeadline`, `createdAt`. |
| MongoDB collection | Lowercase/plural theo data convention, ví dụ `users`, `teacher_invitations`. |
| Enum/status | Theo source contract; ví dụ account status uppercase khi contract định nghĩa `ACTIVE`, `BLOCKED`. |
| Date/time | ISO 8601, timezone rõ khi có deadline/release/audit; UI có thể localize nhưng source lưu/trace cần nhất quán. |
| Version | Document dùng major/minor theo Document Control; artifact/release dùng version/tag/digest/commit có thể trace. |

## Link Convention

- Ưu tiên ID chính xác và relative path tới source document, không chỉ dùng tên feature chung.
- Link evidence không chứa secret, raw token, private Production PII hoặc credential embedded URL.
- Nếu evidence chưa tồn tại, ghi `Pending Implementation Evidence`/Open Gap thay vì tạo link giả.
- Khi source document đổi, link từ Appendix phải được review trong cùng revision.

## Liên Kết

- Traceability source of truth: `../19-traceability/traceability-guidelines.md`.
- Requirement naming: `../07-requirements/requirements-overview.md`.
- Documentation style: `documentation-style-guide.md`.
