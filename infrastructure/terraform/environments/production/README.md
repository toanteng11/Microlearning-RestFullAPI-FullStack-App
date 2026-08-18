# Production Terraform Root

This root is validation-only in Phase 07. It defines a separate state prefix, service accounts, WIF provider
and immutable image contract so Phase 08 can promote the exact Staging-verified digest.

Do not run `terraform apply` during Phase 07. Production requires the protected `production` GitHub
environment, manual confirmation and Phase 08 Go/No-Go evidence.
