# Continuous Integration

Workflow chính nằm tại `.github/workflows/ci.yml`.

Pull Request và push vào `main` phải chạy locked install, lint, format check, typecheck, test, build và production dependency audit. Branch protection trên GitHub cần yêu cầu các job bắt buộc pass trước merge.

Deployment chưa được tự động hóa ở Phase 01. Phase 07 sẽ thêm container registry, Staging/Production environment, approval, smoke test và rollback signal.
