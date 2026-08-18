locals {
  environment         = "production"
  state_bucket_name   = "microlearning-tfstate-${var.project_number}"
  runtime_account_id  = "ml-runtime-production"
  deployer_account_id = "ml-github-production"
  repository_path     = "${var.region}-docker.pkg.dev/${var.project_id}/microlearning/microlearning-app"
}

module "iam" {
  source = "../../modules/iam"

  project_id = var.project_id
  service_accounts = {
    (local.runtime_account_id) = {
      display_name = "Microlearning Production Runtime"
      description  = "Future Cloud Run production runtime identity"
    }
    (local.deployer_account_id) = {
      display_name = "Microlearning GitHub Production"
      description  = "Future protected Production promotion identity"
    }
  }

  deployer_account_id = local.deployer_account_id
  deployer_project_roles = [
    "roles/iam.serviceAccountViewer",
    "roles/iam.securityReviewer",
    "roles/logging.configWriter",
    "roles/monitoring.editor",
    "roles/run.admin",
    "roles/secretmanager.viewer",
    "roles/serviceusage.serviceUsageViewer",
  ]
  deployer_act_as_account_ids = [local.runtime_account_id]
}

module "workload_identity" {
  source = "../../modules/workload-identity"

  project_id                    = var.project_id
  pool_id                       = "github-production"
  provider_id                   = "production-promote"
  deployer_service_account_name = module.iam.service_account_names[local.deployer_account_id]
  github_repository             = var.github_repository
  github_repository_id          = var.github_repository_id
  github_repository_owner       = var.github_repository_owner
  github_repository_owner_id    = var.github_repository_owner_id
  github_environment            = local.environment
  github_ref                    = "refs/heads/main"
  allowed_workflow_refs = [
    "${var.github_repository}/.github/workflows/promote-production.yml@refs/heads/main",
  ]
}

resource "google_storage_bucket_iam_member" "terraform_state_deployer" {
  bucket = local.state_bucket_name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${module.iam.deployer_email}"
}

module "cloud_run_contract" {
  source = "../../modules/cloud-run-service"

  project_id                    = var.project_id
  region                        = var.region
  environment                   = local.environment
  service_name                  = "microlearning-production"
  image_ref                     = var.image_ref
  runtime_service_account_email = module.iam.service_account_emails[local.runtime_account_id]
  max_instances                 = 2
  container_concurrency         = 20
  provision                     = false
}

module "secret_contract" {
  source = "../../modules/secret-containers"

  project_id  = var.project_id
  environment = local.environment
  secret_ids = [
    "ml-production-access-token-secret",
    "ml-production-auth-identity-pepper",
    "ml-production-classroom-code-pepper",
    "ml-production-mongodb-uri",
  ]
  secret_accessors = {
    for secret_id in [
      "ml-production-access-token-secret",
      "ml-production-auth-identity-pepper",
      "ml-production-classroom-code-pepper",
      "ml-production-mongodb-uri",
      ] : secret_id => [
      "serviceAccount:${module.iam.service_account_emails[local.runtime_account_id]}",
    ]
  }
  labels = {
    application = "microlearning"
    environment = "production"
    managed_by  = "terraform"
    phase       = "07"
  }
  provision = false
}

module "monitoring_contract" {
  source = "../../modules/monitoring"

  project_id      = var.project_id
  environment     = local.environment
  resource_prefix = "microlearning-production-"
  provision       = false
  service_name    = "microlearning-production"
  service_host    = "production-not-provisioned.invalid"
  app_version     = ""
  commit_sha      = ""
  image_digest    = ""
}
