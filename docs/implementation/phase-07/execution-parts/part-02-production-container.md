# Part 02 - Production Container

## Goal

Tạo một Production image non-root, nhỏ, traceable và có thể chạy React/API/Swagger cùng process.

## Parent PR

`P07-PR01 - Production Runtime And Container`

## Dependencies

- Part 01 implementation complete trên cùng branch.

## Work

1. thiết kế multi-stage Dockerfile theo container contract;
2. pin Node base version/digest policy;
3. dùng `npm ci` và workspace build;
4. copy đúng compiled API/Web/runtime dependencies;
5. cấu hình non-root user và exec-form command;
6. bổ sung OCI labels/build metadata;
7. hoàn thiện `.dockerignore`;
8. tạo local Production-like run/smoke scripts;
9. test graceful stop;
10. scan image, generate SBOM;
11. kiểm tra layer/filesystem không có secret/dev artifact;
12. ghi image size/budget baseline.

## Validation

- TC-015..022 Pass;
- image starts với test MongoDB và becomes ready;
- root/React/deep-link/API/Swagger/version Pass;
- UID khác `0`;
- Critical/exploitable High findings `0`;
- current CI remains green.

## Evidence

`P07-EV-007..009`, image labels/size/SBOM/scan/local smoke.

## Stop Conditions

- image có `.env`, credential hoặc source artifact không chủ đích;
- runtime chạy root;
- production image chỉ hoạt động nhờ bind mount;
- scan gate bị ignore.

## Definition Of Done

- AC-014..016 Pass trên P07-PR01 CI;
- P07-PR01 merged và post-merge main CI Pass.
