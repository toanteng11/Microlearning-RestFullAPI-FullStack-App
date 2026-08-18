# Part 09 - Build And Publish CD

## Implementation Status

`LOCAL_PASS_REMOTE_PENDING` ngày `2026-08-17`. Source workflow, release-lineage contract, unit test và local
quality gates đã Pass; workflow publish thật trên protected `main`, registry digest và run URL vẫn Pending.

## Goal

Tự động build/test/scan/push một Production image từ successful protected main commit và xuất exact digest
manifest.

## Parent PR

`P07-PR04 - Build Publish And Staging CD`

## Dependencies

- P07-PR01 image contract merged.
- Parts 04-05 registry/WIF ready.
- Existing main CI green.

## Work

1. create/reuse workflow trigger only after successful main CI;
2. checkout exact commit from trusted event;
3. configure scoped workflow permissions/WIF;
4. build Production image once;
5. run image route/non-root/shutdown/content checks;
6. pre-push scan local image;
7. push immutable tag and resolve digest;
8. scan/generate final SBOM against exact registry digest;
9. generate release manifest with checksums/URLs;
10. upload artifacts with retention;
11. expose trusted digest output to deploy workflow;
12. add concurrency/re-run behavior;
13. negative test untrusted PR/mutable tag path.

## Validation

- main CI failure cannot publish;
- exact commit/digest/manifest match;
- scan gate cannot be ignored;
- workflow has no long-lived cloud key;
- artifacts contain no secret.

## Evidence

`P07-EV-009`, `P07-EV-016`, successful build/publish workflow run.

## Stop Conditions

- PR code can push/deploy without trusted main gate;
- build uses Production secret;
- digest output derived from untrusted text;
- build and deploy rebuild different images.

## Definition Of Done

- AC-035..037 Pass;
- release manifest is consumable by Part 10.

## Implemented Source

- `.github/workflows/build-publish.yml` chỉ nhận successful `Continuous Integration` run của `main` hoặc
  manual recovery có confirmation, successful source run ID và full commit SHA;
- `scripts/resolve-trusted-workflow-run.mjs` xác minh workflow name, event, repository, branch, conclusion,
  run ID/URL và full SHA trước khi checkout exact commit;
- image dùng immutable `commit-<full-sha>` tag để publish một lần, sau đó toàn bộ scan/SBOM/deploy dùng
  `repository@sha256:<digest>`;
- `scripts/generate-release-manifest.mjs`, `scripts/validate-release-lineage.mjs` và
  `scripts/lib/cd-contract.mjs` khóa provenance từ source CI tới build run;
- artifact `phase-07-release-candidate` lưu manifest, Trivy reports, CycloneDX SBOM và checksums trong 30
  ngày; rerun chỉ reuse digest đã tồn tại, không rebuild rồi ghi đè tag.

## Local Verification

- `npm run release:contract:test`: Pass;
- `npm run lint`: Pass;
- `npm run format:check`: Pass;
- `npm run typecheck`: Pass;
- `npm run terraform:check`: Pass.

Part chỉ chuyển `DONE` sau khi source merge vào `main`, post-merge CI Pass và `Build And Publish` tạo artifact
thật từ exact successful main run.
