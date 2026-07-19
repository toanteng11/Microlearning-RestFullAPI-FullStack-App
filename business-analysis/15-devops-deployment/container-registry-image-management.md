# Container Registry And Image Management

## Mục Đích

Container registry là nơi lưu Docker image đã build để Staging và Production chạy đúng cùng một artifact. Quản lý image đúng giúp team trả lời được ba câu hỏi quan trọng: **bản nào đang chạy, được tạo từ commit nào, và rollback về bản nào**.

## Image Inventory

| Image | Producer | Consumer | Nội dung không được có |
| --- | --- | --- | --- |
| `microlearning-app` | GitHub Actions multi-stage build | Google Cloud Run | Secret, local `.env`, Production config, database dump, source/test artifact không cần runtime. Image chứa React build, Node.js API và Swagger assets cần thiết. |
| `microlearning-web` / `microlearning-api` | Local/CI build khi cần | Docker Compose và test harness | Không promote trực tiếp lên Production; không chứa secret hoặc local `.env`. |
| `microlearning-worker` (future) | CI nếu async worker được duyệt | Worker runtime | Không tạo image khi chưa có worker module/use case. |

MongoDB Production/backup không phải registry image artifact. Local MongoDB image chỉ phục vụ Compose/test theo policy.

## Accepted Registry Baseline

- Registry: **Google Artifact Registry** private Docker repository.
- Region: cùng region `asia-southeast1` với Cloud Run để giảm latency và cross-region image transfer.
- Repository logical name: `microlearning`.
- Production image logical path: `microlearning-app`.
- GitHub Actions là image publisher; Cloud Run service account chỉ cần pull/read.
- Dùng cleanup policy nhưng luôn giữ current Production digest và ít nhất một prior stable digest.
- Free storage allowance không được coi là bảo đảm vĩnh viễn; Phase 07 phải kiểm tra quota/pricing hiện hành, giới hạn số image và ghi cost evidence.

## Tagging Policy

| Tag / metadata | Mục đích | Có dùng deploy Production? |
| --- | --- | --- |
| Immutable commit tag, ví dụ `sha-abc1234` | Trace chính xác source revision | Có, khuyến nghị bắt buộc. |
| Release tag, ví dụ `v1.0.0` hoặc `1.0.0` | Release note/human readable | Có nếu trỏ cùng immutable digest. |
| Environment promotion label/manifest | Ghi nhận artifact đã qua Staging/Production | Có, không thay thế immutable tag. |
| Image digest | Identity bất biến do registry tạo | Có, tốt nhất để deployment/runtime pin. |
| `latest` | Convenience Local/dev only nếu team muốn | Không làm căn cứ Production/rollback. |

Ví dụ logical mapping:

```text
commit abc1234
  -> microlearning-app:sha-abc1234 (digest sha256:...)
  -> tested in Staging
  -> release v1.3.0 points to same digest
  -> Production deploy pins digest sha256:...
```

## Build, Scan Và Publish Flow

```text
CI checkout commit
  -> install locked dependencies
  -> lint/test/build
  -> docker build with metadata labels
  -> scan dependency/image/SBOM if available
  -> push immutable tag + digest to private registry
  -> record commit, build run, scan result and digest
  -> deploy/promote only if quality policy passes
```

| Gate | Pass condition | Failure behavior |
| --- | --- | --- |
| Docker build | Image build deterministic, no missing config baked into image | Stop pipeline; fix Dockerfile/dependency. |
| Metadata | Version, commit SHA, build time/source recorded | Warning/fail according to release policy; traceability must exist before Production. |
| Vulnerability scan | Critical finding triaged; policy exception documented if accepted | Block/waive only through Technical Lead security decision. |
| Push | Image in intended private registry/project path | Do not deploy local/unpushed image to Cloud. |
| Digest record | Deployment manifest/release record knows digest | Do not use mutable tag-only release. |

## Registry Security

- Registry repository phải private trừ khi Product Owner/Technical Lead phê duyệt public distribution rõ ràng.
- CI publish credential chỉ có quyền repository/path cần thiết; runtime chỉ pull image cần chạy.
- Production deploy job không dùng credential của Developer cá nhân hoặc shared password.
- Bật provider audit log/2FA/protected project/branch/tag khi có khả năng.
- Không upload image có `.env`, key, database dump, artifact secret hoặc source dependency không cần thiết.
- Scan image không thay thế code review, dependency review hoặc runtime security.

## Retention Và Cleanup

| Artifact type | Retention direction | Lý do |
| --- | --- | --- |
| Current Production + previous stable images | Giữ tối thiểu theo rollback policy | Rollback nhanh/trace incident. |
| Staging release candidates gần đây | Giữ theo sprint/review period | Re-test/compare regression. |
| Unreferenced commit images | Cleanup theo policy sau grace period | Giảm cost/rác registry. |
| Security-blocked image | Giữ evidence ngắn hạn hoặc delete theo policy | Không được promote/deploy. |
| Release image | Giữ theo release/audit retention | Reproduce/review historical release. |

Không cleanup image đang được deployment manifest/release record/reference rollback sử dụng. DevOps phải kiểm tra digest/tag được chạy trước khi xóa artifact.

## Promotion Rules

- Chỉ promote image đã pass CI cho commit xác định.
- Staging và Production phải dùng cùng image digest khi không có lý do kỹ thuật được review.
- Rebuild cùng commit tạo digest khác phải được coi là artifact mới và ghi lý do; mục tiêu là build reproducible.
- Release note phải chứa application version, commit/tag/digest, Web/API change và migration note.
- Rollback chọn prior stable digest đã biết, không chọn “image cũ bất kỳ” theo cảm tính.

## Evidence Checklist

- Registry URL/repository path (không chứa credential) được ghi trong runbook/provider config.
- Pipeline output có image tag, digest, commit SHA, build time, scan result.
- Staging/Production deployment record có artifact identity và operator/pipeline run.
- Retention/cleanup owner và previous stable image policy rõ ràng.
