# Phase 08 — Security, Privacy and Compliance

## Release controls

- No secret, password, token, full MongoDB URI, private key or real PII in repository, Markdown, logs or artifacts.
- Production and Staging use separate service accounts, WIF providers, Terraform state, Secret Manager IDs and Atlas data/users.
- Image references are immutable digests; no `latest` promotion.
- UAT uses synthetic or approved sanitized data; invitation/password artifacts are masked.
- Backend denial must be verified (`401/403/404` as contract), not merely by hidden UI controls.
- Logs/audit/export must not expose secrets, hashes, raw tokens or cross-scope data.

## Existing checks

```powershell
npm run audit:production
npm run container:scan -- <IMAGE_REF> artifacts/phase-08/security/image-scan.json
npm run container:verify -- <IMAGE_REF>
npm run sbom:production
npm run terraform:security
npm run cloud:security:verify -- <service_url> <app_version> <commit_sha> <image_ref> <revision> <report.json>
npm run e2e:artifacts:scan -- artifacts/phase-08 <report.json>
npm run phase-08:quality:tooling:test
npm run phase-08:quality:validate -- <quality-summary.json> <validation-report.json>
```

Run only with actual image/path values. These commands produce evidence; a command definition alone is not a Pass.

The Part 04 quality runner uses only synthetic identities and writes status codes, bounded timing samples and redacted findings. It never writes access/refresh tokens, passwords, invitation tokens or full connection strings into evidence.

## Security gate

Critical/High finding, unauthorized access, secret exposure, privacy breach, unsafe export/log, or unreviewed IAM/secret change is immediate `NO_GO`. Exceptions require security authority, impact, mitigation, expiry and communication; ordinary UAT waiver is insufficient.

## Privacy/compliance record

```text
Data mode and classification: <PENDING>
Retention/deletion owner: <PENDING>
Access review evidence: <PENDING>
Scan/redaction reports: <PENDING>
Privacy/security decision ID: <PENDING>
Residual risk/expiry: <PENDING>
```
