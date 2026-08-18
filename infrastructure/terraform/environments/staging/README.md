# Staging Terraform Root

This root owns the Phase 07 staging foundation: bounded service accounts, private Artifact Registry,
GitHub WIF trust, state-bucket object access and validation-only contracts for later parts.

The first apply is an owner-operated bootstrap action. Do not run it from an untrusted pull request. Secret
values are created outside Terraform; this root only validates future secret container IDs. The existing
`microlearning` Artifact Registry repository is adopted through the declarative import block in `main.tf`;
do not delete or recreate it.

```powershell
terraform init
terraform plan -var-file="terraform.tfvars"
```

Review the plan policy report before any apply. Phase 07 must never target Production from this root.
