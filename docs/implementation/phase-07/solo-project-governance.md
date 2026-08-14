# Phase 07 Solo Project Governance

## 1. Mục đích

Dự án do một cá nhân phát triển và vận hành. Vì không có collaborator độc lập, các yêu cầu bắt buộc
approval từ người thứ hai không thể áp dụng trung thực. Tài liệu này thay thế kiểm soát nhiều người bằng
các kiểm soát kỹ thuật, quyết định có timestamp và evidence có thể kiểm tra lại.

Governance mode được Project Owner xác nhận ngày `2026-08-13` và có hiệu lực cho đến khi dự án có
collaborator phù hợp.

Không được tạo tài khoản phụ hoặc approval giả chỉ để vượt Gate. `Required reviewer` được đánh dấu
`APPROVED_NA` vì giới hạn nhân sự, không phải vì rủi ro Production đã biến mất.

## 2. Vai trò

Trần Đức Toàn đồng thời giữ các vai trò Product Owner, Business Analyst, Technical Lead, Developer,
DevOps, Security và QA. Khi một quyết định liên quan nhiều vai trò, decision record vẫn phải ghi riêng:

- phạm vi và giá trị nghiệp vụ;
- ảnh hưởng kỹ thuật;
- ảnh hưởng bảo mật/dữ liệu;
- test/evidence;
- rollback và residual risk.

## 3. Pull Request control

Mọi thay đổi vào `main` vẫn phải đi qua Pull Request, nhưng số approval bắt buộc là `0`.

Các kiểm soát bù bắt buộc:

1. cấm push trực tiếp vào `main`;
2. bắt buộc branch cập nhật theo latest `main`;
3. bắt buộc toàn bộ CI quality gates Pass;
4. bắt buộc resolve conversation;
5. bắt buộc linear history;
6. áp dụng branch protection cho administrator;
7. cấm force push và xóa `main`;
8. tự review `Files changed`, checklist và diff trước merge;
9. không merge khi chính người thực hiện còn biết defect/risk chưa được ghi nhận;
10. lưu PR URL, commit và CI run làm evidence.

Required checks baseline:

- `Lint, test and build`;
- `Production dependency audit`;
- `MongoDB replica-set transaction`;
- `OpenAPI contract`;
- `Integrated browser E2E`;
- `Secret scan`.

## 4. Staging deployment control

`staging` tự động deploy chỉ sau successful CI của protected `main`.

- Chỉ branch `main` được deploy.
- Không yêu cầu environment reviewer.
- Không cho administrator bypass protection.
- Workflow dùng WIF/OIDC, không dùng service-account JSON key.
- Deployment dùng exact image digest và phải Pass smoke/E2E.
- Workflow fail hoặc evidence thiếu thì release không được đánh dấu ổn định.

## 5. Production deployment control

Phase 07 không triển khai Production thật. Phase 08 chỉ được phép Production promotion khi:

1. workflow chỉ có trigger `workflow_dispatch`;
2. source branch/ref là protected `main`;
3. owner nhập chính xác confirmation phrase `PROMOTE_PRODUCTION`;
4. input gồm release record ID và exact digest đã Pass Staging;
5. workflow xác minh System Test, UAT và Go/No-Go decision record;
6. Production dùng identity, state, secret và database riêng;
7. Terraform plan được tạo và lưu trước apply;
8. concurrency chỉ cho một Production deployment;
9. prior stable digest/revision và rollback path đã sẵn sàng;
10. post-deploy smoke, observation và deployment record là bắt buộc.

GitHub `production` environment giữ `Protected branches only`. `Required reviewers` để tắt theo solo
waiver; `Allow administrators to bypass configured protection rules` phải tắt. Manual
`workflow_dispatch` và confirmation phrase là kiểm soát thao tác, không được mô tả là independent
approval.

## 6. Solo approval record

Mỗi Gate/Go decision dùng mẫu:

```text
Decision ID:
Decision owner: Trần Đức Toàn
Role perspective: Product Owner | Technical Lead | DevOps | Security | QA
Decision: APPROVED | REJECTED | APPROVED_NA
UTC timestamp:
Scope/commit/digest:
Evidence URLs:
Known risks:
Rollback:
Reason independent reviewer is N/A: Solo project
```

Một decision không được dùng thay evidence tự động. CI, smoke, security scan, Terraform plan và Cloud
deployment record vẫn phải tồn tại khi criterion yêu cầu.

## 7. Stop conditions

- branch protection hoặc required CI bị tắt để merge nhanh;
- Production chạy tự động từ push/main;
- Production workflow chấp nhận tag hoặc digest chưa Pass Staging;
- confirmation phrase không được kiểm tra chính xác;
- dùng cùng credential/state/database giữa Staging và Production;
- Production deploy trước Phase 08 Go/No-Go;
- evidence tự khai mâu thuẫn với CI/Cloud state;
- secret hoặc dữ liệu thật xuất hiện trong repository/evidence.

## 8. Nâng cấp governance

Khi dự án có collaborator phù hợp, owner phải bỏ solo waiver và bật:

- Pull Request approval tối thiểu `1`;
- Production required reviewer;
- prevent self-review;
- CODEOWNERS nếu ownership đã rõ.
