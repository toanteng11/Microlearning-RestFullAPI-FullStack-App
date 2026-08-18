locals {
  expected_subject = "repo:${var.github_repository}:environment:${var.github_environment}"
  workflow_clause = join(" || ", [
    for workflow_ref in sort(tolist(var.allowed_workflow_refs)) : "assertion.workflow_ref == '${workflow_ref}'"
  ])
  attribute_condition = join(" && ", [
    "assertion.repository == '${var.github_repository}'",
    "assertion.repository_id == '${var.github_repository_id}'",
    "assertion.repository_owner == '${var.github_repository_owner}'",
    "assertion.repository_owner_id == '${var.github_repository_owner_id}'",
    "assertion.sub == '${local.expected_subject}'",
    "assertion.ref == '${var.github_ref}'",
    "assertion.environment == '${var.github_environment}'",
    "(${local.workflow_clause})",
  ])
}

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = var.pool_id
  display_name              = "GitHub ${var.github_environment}"
  description               = "GitHub Actions identities restricted to Microlearning ${var.github_environment} workflows"
  disabled                  = false

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = var.provider_id
  display_name                       = "GitHub ${var.github_environment} provider"
  description                        = "Exact repository, environment, ref and workflow trust boundary"
  disabled                           = false

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.environment"         = "assertion.environment"
    "attribute.workflow_ref"        = "assertion.workflow_ref"
    "attribute.ref"                 = "assertion.ref"
    "attribute.repository"          = "assertion.repository"
    "attribute.repository_id"       = "assertion.repository_id"
    "attribute.repository_owner"    = "assertion.repository_owner"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
  }

  attribute_condition = local.attribute_condition

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account_iam_member" "github_impersonation" {
  service_account_id = var.deployer_service_account_name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository_id/${var.github_repository_id}"
}
