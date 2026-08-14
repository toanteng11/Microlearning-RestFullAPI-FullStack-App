# Phase 07 Pull Request Execution Guide

## 1. Purpose

Giữ thay đổi Cloud có blast radius nhỏ, review được và không trộn planning, runtime, infrastructure, tests và
release evidence vào một PR quá lớn.

## 2. Before Opening PR

1. update branch từ latest `main`;
2. kiểm tra chỉ có intended files;
3. chạy relevant local gates;
4. scan secret và staged diff;
5. cập nhật tests/docs/traceability;
6. ghi risk/rollback;
7. không commit generated credential/state/plan binary.

## 3. PR Template Content

```text
Phase/Part:
Scope:
BA/AC IDs:
Architecture decisions affected:
Runtime/IaC/workflow changes:
Tests and evidence:
Cloud resources/cost impact:
Security/secrets/IAM impact:
Data/migration impact:
Backward compatibility:
Rollback:
Known risks/debt:
Screenshots/artifacts (redacted):
```

## 4. Review Checklist

- scope matches WBS/part;
- no hidden Production apply;
- image/config/secret/reference immutable where required;
- least privilege/WIF condition reviewed;
- Terraform plan understood;
- runtime and prior image data compatibility preserved;
- cloud-specific tests present;
- evidence contains no secret/real PII;
- required check names remain valid;
- docs and operational runbooks updated.

## 5. Merge Rules

- all required checks Pass;
- Pull Request bắt buộc; independent approval là `APPROVED_NA` theo solo-project governance;
- owner hoàn tất self-review checklist và xác nhận không còn known unrecorded defect;
- conversations resolved;
- branch up to date according to repository rule;
- merge method follows repository policy;
- không dùng admin bypass để vượt quality gate;
- after merge, verify main CI and downstream CD where expected.

## 6. Infrastructure PR Special Rules

- attach redacted plan summary;
- explain create/update/delete count;
- call out IAM/public/network/cost changes;
- never apply PR plan from fork/untrusted source;
- saved apply plan must correspond to reviewed commit/config;
- manual Console prerequisite/evidence referenced.

## 7. Deployment PR/Workflow Special Rules

- commit and image digest recorded;
- prior stable revision known;
- smoke and rollback path ready;
- concurrency lock verified;
- failed evidence upload fails release;
- no Production promotion in Phase 07.

## 8. Post-Merge

1. confirm post-merge main CI;
2. confirm expected build/deploy workflow triggered;
3. monitor Staging deployment and observation window;
4. record run URLs/digest/revision;
5. update AC/evidence result;
6. create defect/incident if any gate fails;
7. do not mark part Done from local success alone.
