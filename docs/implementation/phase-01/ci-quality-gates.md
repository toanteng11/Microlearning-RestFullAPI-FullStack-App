# Phase 01 CI Quality Gates

## 1. Trigger

Workflow `.github/workflows/ci.yml` chạy khi Pull Request hoặc push vào `main`.

## 2. Quality Job

```text
Checkout
  -> Setup pinned Node with npm cache
  -> npm ci
  -> npm run check:ci
  -> upload mandatory coverage artifact
```

`npm run check:ci` gồm lint, automated negative lint assertion, format check, typecheck, coverage tests và production build. Workflow fail nếu coverage không đạt threshold hoặc không sinh ra `apps/*/coverage`.

Mọi GitHub Action dependency được pin bằng full commit SHA và ghi chú version để giảm rủi ro tag bị thay đổi trong chuỗi cung ứng CI.

Coverage regression floor:

| Area | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| API | 75% | 45% | 70% | 75% |
| Web | 80% | 70% | 80% | 80% |

## 3. Security Jobs

CI có hai lớp kiểm tra security bắt buộc:

- `Production dependency audit` chạy `npm audit --omit=dev --audit-level=high` để chặn dependency production có High hoặc Critical vulnerability.
- `Secret scan` dùng `gitleaks/gitleaks-action@v3` để quét hardcoded secret như token, private key, password, API key hoặc credential bị commit.

Local verification tại Phase 01 cho dependency audit trả `0 vulnerabilities`. Secret scan đã pass trên Pull Request #1 và được cấu hình làm required check.

## 4. Pull Request Governance

PR template yêu cầu Task ID, BA trace, verification, contract/data impact, UI evidence, risk và rollback. Sau khi có GitHub remote, branch protection cần:

- Không push trực tiếp `main`.
- Yêu cầu `Lint, test and build`, `Production dependency audit` và `Secret scan` pass.
- Ít nhất một reviewer approve.
- Dismiss approval khi có thay đổi quan trọng mới.
- Hạn chế force push/delete protected branch.

## 5. Negative Gate Evidence

`scripts/verify-negative-lint-gate.mjs` gọi ESLint bằng một đoạn TypeScript có unused variable cố ý. Script chỉ pass khi nhận error `@typescript-eslint/no-unused-vars`; nếu lint không còn từ chối violation, quality job sẽ fail. Cách này duy trì negative evidence ở mọi Pull Request mà không cần giữ branch chứa code lỗi.

## 6. Chưa Thuộc Phase 01

- Container publish/registry.
- Staging/Production deploy.
- Protected environment approval.
- Post-deploy smoke/rollback automation.

Các mục này thuộc Phase 07 và phải tái sử dụng artifact đã pass CI, không build lại source khác cho Production.
