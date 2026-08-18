# Phase 07 Parts 15-17 Evidence

## 1. Scope

Tài liệu này ghi nhận implementation evidence cho ba part cuối của Phase 07:

- Part 15: Production Promotion Readiness;
- Part 16: Security, Cost And Quality Hardening;
- Part 17: Exit Evidence And Phase 08 Handoff.

## 2. Local Evidence

| Check | Result | Source |
| --- | --- | --- |
| Promotion contract | Pass | `npm run promotion:contract:test` |
| Hardening contract | Pass | `npm run hardening:contract:test` |
| Phase 07 exit contract | Pass | `npm run exit:contract:test` |
| Phase 08 handoff contract | Pass | `npm run handoff:contract:test` |
| Full repository check | Pass | `npm run check` |
| Terraform/IaC validation | Pass | `npm run terraform:check` |
| Cloud E2E discovery | Pass, 4 tests listed | `npm run test:e2e:cloud -- --list` |
| Diff/whitespace validation | Pass | `git diff --check` |

## 3. Controls Implemented

### Part 15

- Production workflow chỉ chạy bằng `workflow_dispatch`.
- Dùng protected `production` environment và WIF identity riêng.
- Stable Staging record phải là `PASS`, `stable=true`, full commit SHA và exact image digest.
- Bắt buộc confirmation phrase, UAT `PASS`, Go/No-Go `GO` và decision IDs.
- Phase 07 chỉ tạo Terraform plan; không thực hiện Production apply hoặc traffic change.

### Part 16

- Production image phải chạy non-root, có health check và không copy `.env`/`.git`.
- CI phải giữ lint/test/build, dependency audit và secret scan.
- Terraform source không được chứa service-account key resource; Production provisioning giữ `false`.
- GitHub Actions phải dùng action SHA bất biến.
- Hardening workflow chạy từ clean checkout và lưu image/scan/SBOM artifact.

### Part 17

- Exit contract bắt buộc `66/66` Must Pass, Critical/High bằng `0`, exact release identity và HTTPS evidence.
- Exit phải bảo toàn `NO_GO_PHASE_08` cho Production.
- Handoff contract bắt buộc staging digest bất biến, System Test/UAT/Go-No-Go, Production plan/Atlas readiness
  và rollback reference.
- Placeholder hoặc trạng thái `Pending` bị từ chối trong exit/handoff record.

## 4. Remote/Cloud Evidence Still Required

Local Pass không thay thế execution evidence. Trước khi đánh dấu Phase 07 `COMPLETED`, cần lưu:

1. PR implementation với required checks Pass, merge vào protected `main` và post-merge main CI Pass.
2. Build/publish, Staging CD, deployment record và Cloud Smoke/E2E của cả bốn actor.
3. Monitoring/alert notification, Atlas backup/restore và prior-revision rollback rehearsal.
4. Chạy `Phase 07 Hardening` trên GitHub và lưu artifact clean-clone/scan/SBOM.
5. Chạy `Validate Production Promotion` bằng stable record thật để chứng minh plan-only guard.
6. Điền `66/66` vào exit report, thay toàn bộ placeholder bằng URL/ID thật và accepted Phase 08 handoff.

Production apply vẫn thuộc Phase 08 và phải giữ `NO_GO` cho đến khi System Test, UAT và Go/No-Go được duyệt.

## 5. Current Status

`LOCAL_PASS_REMOTE_PENDING` cho Parts 15-17. Không được chuyển thành `COMPLETED` chỉ dựa trên các kết quả
local ở mục 2.
