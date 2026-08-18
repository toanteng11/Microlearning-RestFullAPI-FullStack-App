# Artifact Registry And Retention Runbook

## 1. Baseline

- Repository: `asia-southeast1-docker.pkg.dev/microlearning-platform-502716/microlearning`.
- Package: `microlearning-app`.
- Repository private, immutable tags bật và deletion prevention bật.
- Cleanup policy luôn ở `dry_run=true` trong Phase 07.
- Deployment input chỉ chấp nhận `microlearning-app@sha256:<64-hex>`.

Repository đã tồn tại từ `2026-07-18` và được giữ nguyên. Staging root có declarative import block để đưa
repository vào remote state ở first reviewed apply. Không chạy `terraform import` thêm lần nữa và không xóa
repository trước apply.

## 2. Publish contract

1. Build từ exact main commit đã Pass CI.
2. Gắn OCI labels cho version, commit, build time và source.
3. Chạy production image smoke, Trivy vulnerability gate và CycloneDX SBOM.
4. Push một lần bằng release tag truy vết được.
5. Resolve digest từ Artifact Registry ngay sau push.
6. Chạy `validate-image-reference.mjs` với full digest.
7. Tạo release manifest bằng local image, output path và full registry digest.
8. Chạy `validate-release-manifest.mjs`; upload manifest, scan và SBOM cùng workflow run.

Tag `latest`, tag-only input hoặc digest không thuộc canonical repository đều bị chặn trước Terraform plan.

## 2.1 First import verification

First Staging plan phải hiển thị `module.artifact_registry.google_artifact_registry_repository.this` là
`import`, không phải create mới. Sau apply, chạy plan lần hai; repository phải no-op. Nếu plan vẫn create hoặc
replace repository, dừng ngay và kiểm tra backend/state/import ID.

## 3. Digest protection window

Trước mọi cleanup, tạo inventory gồm:

- digest đang phục vụ Staging;
- prior known-good digest dùng rollback;
- digest ứng viên Production/đang chờ UAT;
- digest gắn incident hoặc evidence retention;
- 20 version gần nhất theo Terraform keep policy.

Không xóa bất kỳ digest nào thuộc inventory này. Cleanup candidate chỉ gồm untagged artifact cũ hơn 30 ngày;
Phase 07 chỉ xem dry-run result, chưa bật xóa tự động.

## 4. Review cleanup dry run

1. Export danh sách package/version và cleanup dry-run log.
2. So sánh candidate digest với active/prior/pending inventory.
3. Nếu có giao nhau, dừng và sửa policy trong Terraform.
4. Ghi estimated reclaimed bytes và số digest candidate.
5. Chỉ Phase 08 hoặc decision record mới được đổi `cleanup_policy_dry_run=false`.

Không sửa cleanup policy trực tiếp trên Console. Emergency retention change phải được backfill vào Terraform
trong một ngày làm việc.

## 5. Rollback artifact

Rollback dùng prior exact digest trong release manifest; không rebuild cùng commit và không tra cứu tag tại
thời điểm rollback. Nếu prior digest không còn tồn tại, stop deployment và mở incident vì retention control đã
thất bại.
