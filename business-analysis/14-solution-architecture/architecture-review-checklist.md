# Architecture Review Checklist

## Mục Đích

Checklist này được dùng khi Technical Lead review kiến trúc trước implementation, trước Staging release và trước Production release. Đây là checklist kiểm soát chất lượng, không thay thế code review, security assessment hoặc UAT.

## Review Trước Implementation

| ID | Hạng mục kiểm tra | Evidence/đầu ra cần có | Owner | Status |
| --- | --- | --- | --- | --- |
| ARC-001 | Scope MVP phù hợp architecture modular monolith | Module map và feature boundary | Technical Lead | Open |
| ARC-002 | Mọi feature quan trọng có API, data owner, role/ownership rule | Cross-reference mục 05, 07, 10, 11 | Business Analyst + Technical Lead | Open |
| ARC-003 | ReactJS không truy cập MongoDB/storage credential trực tiếp | Frontend/API design review | Frontend Lead + Backend Lead | Open |
| ARC-004 | Backend có route/middleware/controller/service/repository/error boundary | Source structure/convention | Backend Lead | Open |
| ARC-005 | Invitation/Join/Deadline/Grade flow có audit và error handling | Use case + sequence/API test design | Backend Lead + QA Lead | Open |
| ARC-006 | Student To-do và Teacher ranking có source/read model/rebuild rule | Data architecture + algorithm note | Backend Lead | Open |
| ARC-007 | API version, response/error, pagination, Swagger contract rõ | OpenAPI review | Backend Lead + QA Lead | Open |
| ARC-008 | Media upload xác định type/size/ownership/private access | Upload policy + storage design | Backend Lead + DevOps | Open |
| ARC-009 | Các ADR Proposed có owner/deadline chốt | ADR catalog review | Technical Lead | Open |

## Security Và Privacy Review

| ID | Hạng mục kiểm tra | Evidence/đầu ra cần có | Owner | Status |
| --- | --- | --- | --- | --- |
| ARC-010 | Password/hash/raw token/secret không lộ qua API, UI, log hoặc source | Code/config/log sample/security test | Backend Lead + DevOps | Open |
| ARC-011 | Token expiry/refresh/revoke/logout/reset policy được chốt | ADR-006 Recorded Baseline (Draft), security test evidence và formal approval trước auth release | Technical Lead + Security Reviewer | Baseline set; approval/evidence pending |
| ARC-012 | RBAC và object-level authorization kiểm tra ở backend | Negative API tests Student/Teacher/Admin | Backend Lead + QA Lead | Open |
| ARC-013 | Invitation token one-time/expiry/revoke/email matching | Test evidence | Backend Lead + QA Lead | Open |
| ARC-014 | CORS/HTTPS/rate limit/input validation/error masking đúng | Environment/API security review | Backend Lead + DevOps | Open |
| ARC-015 | Media object private và có controlled access | Storage policy + access test | DevOps + Backend Lead | Open |
| ARC-016 | Retention/backup/audit access bảo vệ dữ liệu Student | Privacy/data review | Technical Lead + DevOps | Open |

## Data, Performance Và Reliability Review

| ID | Hạng mục kiểm tra | Evidence/đầu ra cần có | Owner | Status |
| --- | --- | --- | --- | --- |
| ARC-017 | Collection/index/query pattern cho User list, To-do, ranking, audit | Data model + query/index review | Backend Lead | Open |
| ARC-018 | Duplicate enrollment và unique invariant enforced ở database + service | Index/mutation test | Backend Lead + QA Lead | Open |
| ARC-019 | Deadline reset lưu reason/history và recalculate read model | API/data/regression test | Backend Lead + QA Lead | Open |
| ARC-020 | Progress/score summary có rebuild/retry/consistency plan | Job/runbook + test | Backend Lead | Open |
| ARC-021 | Pagination/max limit/projection ngăn list/query quá tải | API contract/performance test | Backend Lead | Open |
| ARC-022 | NFR p95 baseline đo được với dataset MVP | Performance report | Backend Lead + QA Lead | Open |
| ARC-023 | Backup scope và restore rehearsal được ghi nhận | Backup/restore record | DevOps | Open |

## DevOps Và Release Review

| ID | Hạng mục kiểm tra | Evidence/đầu ra cần có | Owner | Status |
| --- | --- | --- | --- | --- |
| ARC-024 | Local/CI/Staging/Production config tách biệt, secret không hard-code | Environment matrix + secret scan | DevOps | Open |
| ARC-025 | Docker build reproducible, image version/commit traceable | Docker/CI artifact | DevOps | Open |
| ARC-026 | CI chạy lint/test/build/scan theo quality gate | Pipeline result | DevOps + Technical Lead | Open |
| ARC-027 | Deploy chạy health/version/smoke test và monitor sau release | Deployment record | DevOps + QA Lead | Open |
| ARC-028 | Rollback/forward-fix procedure đã test và DB migration safety có note | Rollback rehearsal/runbook | DevOps + Backend Lead | Open |
| ARC-029 | Monitoring có uptime, latency, error rate, MongoDB health và alert owner | Dashboard/alert config | DevOps | Open |
| ARC-030 | Swagger exposure policy và operator access được chốt | Environment security decision | Technical Lead + DevOps | Open |

## Exit Criteria

Một environment chỉ được đánh dấu architecture-ready khi:

- Tất cả item `Must` hoặc rủi ro cao liên quan environment được đóng/có waiver được Product Owner và Technical Lead chấp thuận.
- Không còn secret/raw token/password trong repository, container artifact, UI bundle hoặc log sample.
- Luồng critical đã có test: login, Teacher invitation thủ công, Student join, publish/deadline reset, Student submit/complete, Teacher progress/grading, Admin governance.
- Health/smoke test, backup/restore direction, rollback path và monitoring owner rõ ràng.
- ADR ảnh hưởng đến environment/release đã `Accepted` hoặc có quyết định thay thế được ghi nhận.

## Review Record Template

| Review date | Environment / release | Reviewer | Open risk / waiver | Decision | Follow-up owner / due date |
| --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | Local / Staging / Production | Technical Lead, QA Lead, DevOps | Mô tả ngắn | Pass / Conditional Pass / Blocked | Name / YYYY-MM-DD |
