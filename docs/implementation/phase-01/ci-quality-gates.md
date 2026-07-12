# Phase 01 CI Quality Gates

## 1. Trigger

Workflow `.github/workflows/ci.yml` chạy khi Pull Request hoặc push vào `main`.

## 2. Quality Job

```text
Checkout
  -> Setup pinned Node with npm cache
  -> npm ci
  -> npm run check
  -> upload coverage artifact when present
```

`npm run check` gồm lint, format check, typecheck, tests và production build.

## 3. Security Jobs

CI có hai lớp kiểm tra security bắt buộc:

- `Production dependency audit` chạy `npm audit --omit=dev --audit-level=critical` để chặn dependency production có critical vulnerability.
- `Secret scan` dùng `gitleaks/gitleaks-action@v3` để quét hardcoded secret như token, private key, password, API key hoặc credential bị commit.

Local verification tại Phase 01 cho dependency audit trả `0 vulnerabilities`. Secret scan cần được xác nhận trên GitHub Actions sau khi workflow mới được push và chạy trên Pull Request.

## 4. Pull Request Governance

PR template yêu cầu Task ID, BA trace, verification, contract/data impact, UI evidence, risk và rollback. Sau khi có GitHub remote, branch protection cần:

- Không push trực tiếp `main`.
- Yêu cầu `Lint, test and build`, `Production dependency audit` và `Secret scan` pass.
- Ít nhất một reviewer approve.
- Dismiss approval khi có thay đổi quan trọng mới.
- Hạn chế force push/delete protected branch.

## 5. Negative Gate Evidence

Local lint được chạy với đoạn code cố ý có unused variable và trả exit code `1` cùng `@typescript-eslint/no-unused-vars`. Remote Pull Request fail evidence vẫn cần sau khi repository có GitHub remote.

## 6. Chưa Thuộc Phase 01

- Container publish/registry.
- Staging/Production deploy.
- Protected environment approval.
- Post-deploy smoke/rollback automation.

Các mục này thuộc Phase 07 và phải tái sử dụng artifact đã pass CI, không build lại source khác cho Production.
