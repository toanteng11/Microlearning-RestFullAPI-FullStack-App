# Production Promotion Runbook

## 1. Trạng thái và ranh giới

Phase 07 thiết kế, kiểm tra cấu trúc và bảo vệ workflow này. Actual Production deployment thuộc Phase 08 sau
System Test, UAT và Go/No-Go. Dự án cá nhân tuân theo `solo-project-governance.md`; không được mô tả
self-confirmation là independent approval.

## 2. Promotion principle

Production nhận cùng exact image digest đã Pass Staging. Không rebuild, không deploy mutable tag và không
thay code giữa Staging verification với Production promotion.

## 3. Preconditions

- Phase 07 exit `PASS`.
- Phase 08 System Test/UAT Pass và có sign-off.
- Go/No-Go `GO`.
- Production Atlas tier, backup/PITR, network và data policy được duyệt.
- Production secrets/identities/resources tách Staging.
- Latest drift plan clean.
- Current Production revision/digest được ghi.
- Rollback owner và observation window sẵn sàng.
- Protected GitHub environment chỉ cho `main`, no-bypass và manual `workflow_dispatch`.
- Owner nhập đúng confirmation phrase `PROMOTE_PRODUCTION`; independent reviewer là `APPROVED_NA`
  cho đến khi dự án có collaborator.

## 4. Promotion verification

Workflow tự động kiểm tra:

1. input là digest hợp lệ;
2. digest tồn tại trong Artifact Registry;
3. release manifest/commit/main CI tồn tại;
4. digest trùng một Staging deployment record `PASS`;
5. scan/SBOM không hết hạn theo policy;
6. UAT/Go decision IDs được cung cấp;
7. Terraform plan chỉ thay expected Production revision/config;
8. confirmation phrase, Go/No-Go record và no-bypass policy hợp lệ.

## 5. Deployment strategy

Baseline là revision deployment có controlled traffic:

1. deploy new revision với no/limited traffic nếu capability/config cho phép;
2. chờ startup/readiness;
3. smoke direct/tagged revision nếu dùng revision tag;
4. chuyển traffic theo bước đã chốt;
5. theo dõi error/latency/auth/data;
6. chuyển 100% khi gate Pass;
7. giữ prior revision trong rollback window.

Với phạm vi đồ án nhỏ, có thể chuyển trực tiếp 100% sau readiness nhưng phải ghi lý do và rollback rehearsal.

## 6. Production smoke

Chỉ dùng test accounts/dataset được duyệt. Không reset/seed Production tùy ý. Smoke tối thiểu:

- health/readiness/version;
- public login page và session;
- một read-only journey mỗi role;
- một controlled write journey có cleanup nếu được phê duyệt;
- Swagger policy theo Production decision;
- logs/metrics/alerts nhận tín hiệu.

## 7. Abort/rollback conditions

- digest/version mismatch;
- auth/RBAC regression;
- error/latency/readiness vượt threshold;
- data integrity issue;
- security/secret exposure;
- monitoring mù;
- owner/Go-No-Go decision yêu cầu abort.

Rollback đưa traffic về prior stable revision/digest, không rebuild.

## 8. Production deployment record

Ghi đầy đủ release ID, UAT/Go decision, decision owner, digest, commit, Terraform plan, revision, traffic changes,
smoke, observation, incident/rollback và final decision.

## 9. Forbidden actions

- deploy từ feature branch;
- dùng Staging database/secret/identity cho Production;
- sửa resource trong Console để “cho chạy” mà không incident/backfill;
- rotate secret cùng lúc với code release nếu không có kế hoạch riêng;
- xóa prior revision/image trước khi hết rollback window;
- đánh dấu thành công khi evidence upload fail.
