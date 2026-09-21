# Production Terraform Root

This root owns the isolated Production state, service accounts, Workload Identity Federation, Secret
Manager contract, immutable Cloud Run image contract and monitoring resources used by Phase 08.

Do not run raw `terraform apply` commands. The owner-only Phase 08 bootstrap scripts constrain and verify
the identity and secret-container prerequisites independently. Full Production promotion still requires
the protected `production` GitHub environment, the exact Staging-verified digest, manual confirmation and
Phase 08 Go/No-Go evidence.

The secret-container bootstrap never creates or reads secret versions. Production values must be added
through the approved protected procedure and must not appear in Terraform variables, source code, logs or
evidence.
