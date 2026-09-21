locals {
  environment         = "production"
  state_bucket_name   = "microlearning-tfstate-${var.project_number}"
  runtime_account_id  = "ml-runtime-production"
  deployer_account_id = "ml-github-production"
  repository_path     = "${var.region}-docker.pkg.dev/${var.project_id}/microlearning/microlearning-app"
  service_name        = "microlearning-production"
  canonical_url       = "https://${local.service_name}-bu73wlfj5a-as.a.run.app"
  image_digest        = split("@", var.image_ref)[1]

  runtime_environment_variables = {
    NODE_ENV         = "production"
    APP_ENV          = local.environment
    APP_VERSION      = var.app_version
    COMMIT_SHA       = var.commit_sha
    IMAGE_DIGEST     = local.image_digest
    BUILD_TIME       = var.build_time
    PUBLIC_WEB_URL   = local.canonical_url
    ALLOWED_ORIGINS  = local.canonical_url
    LOG_LEVEL        = "info"
    TRUST_PROXY_HOPS = "1"

    MONGODB_MAX_POOL_SIZE               = "10"
    MONGODB_MIN_POOL_SIZE               = "0"
    MONGODB_SERVER_SELECTION_TIMEOUT_MS = "10000"
    MONGODB_CONNECT_TIMEOUT_MS          = "10000"
    MONGODB_SOCKET_TIMEOUT_MS           = "30000"

    ACCESS_TOKEN_ISSUER         = "microlearning-api"
    ACCESS_TOKEN_AUDIENCE       = "microlearning-web"
    ACCESS_TOKEN_TTL_SECONDS    = "900"
    REFRESH_TOKEN_TTL_SECONDS   = "604800"
    REFRESH_REUSE_GRACE_SECONDS = "5"
    REFRESH_COOKIE_NAME         = "ml_refresh"
    REFRESH_COOKIE_SECURE       = "true"
    TEACHER_INVITATION_TTL_DAYS = "7"

    CLASSROOM_CODE_LENGTH             = "8"
    CLASSROOM_INVITE_TOKEN_BYTES      = "32"
    CLASSROOM_INVITE_DEFAULT_TTL_DAYS = "30"
    CLASSROOM_JOIN_IP_LIMIT           = "20"
    CLASSROOM_JOIN_IDENTITY_LIMIT     = "10"
    CLASSROOM_JOIN_WINDOW_SECONDS     = "900"
    CLASSROOM_PREVIEW_IP_LIMIT        = "30"

    CONTENT_MARKDOWN_MAX_CHARS     = "100000"
    COURSE_MAX_PER_CLASSROOM       = "100"
    MODULE_MAX_PER_COURSE          = "100"
    LESSON_MAX_PER_COURSE          = "500"
    FLASHCARD_MAX_PER_LESSON       = "100"
    CONTENT_WRITE_WINDOW_SECONDS   = "60"
    CONTENT_WRITE_IDENTITY_LIMIT   = "120"
    LEARNING_ACTION_WINDOW_SECONDS = "60"
    LEARNING_ACTION_IDENTITY_LIMIT = "180"
    DASHBOARD_PAGE_MAX             = "100"
    LEARNING_RESOURCES_ENABLED     = "false"
    GCS_UPLOADS_ENABLED            = "false"

    QUESTION_IMAGE_URL_ENABLED         = "false"
    QUESTION_VIDEO_URL_ENABLED         = "false"
    QUESTION_MEDIA_ALLOWED_HOSTS       = ""
    ASSIGNMENT_LINK_SUBMISSION_ENABLED = "false"
    ASSIGNMENT_MARK_DONE_ENABLED       = "false"
    ASSESSMENT_FILE_UPLOAD_ENABLED     = "false"
    QUIZ_ATTEMPT_START_IP_LIMIT        = "300"
    QUIZ_ATTEMPT_IDENTITY_LIMIT        = "20"
    QUIZ_ANSWER_SAVE_LIMIT             = "180"
    ASSESSMENT_MUTATION_WINDOW_SECONDS = "60"
    ASSESSMENT_MUTATION_IDENTITY_LIMIT = "120"

    REPORTING_ENABLED                               = "true"
    REPORTING_TIMEZONE                              = "Asia/Ho_Chi_Minh"
    REPORTING_DUE_SOON_WINDOW_HOURS                 = "72"
    REPORTING_PAGE_MAX                              = "50"
    REPORTING_DASHBOARD_PREVIEW_LIMIT               = "5"
    REPORTING_GRADEBOOK_ACTIVITY_MAX                = "50"
    REPORTING_STALE_AFTER_SECONDS                   = "300"
    REPORTING_INLINE_REFRESH_MAX_STUDENTS           = "5"
    REPORTING_ON_DEMAND_COURSE_REFRESH_MAX_STUDENTS = "100"
    REPORTING_REFRESH_REQUEST_BUDGET_MS             = "900"
    REPORTING_REBUILD_BATCH_SIZE                    = "50"
    REPORTING_REBUILD_MAX_ATTEMPTS                  = "3"
    REPORTING_CLASSROOM_EXPANSION_BATCH_SIZE        = "50"
    REPORTING_INVALIDATION_LOCK_SECONDS             = "120"
    REPORTING_INVALIDATION_MAX_ATTEMPTS             = "3"
    REPORTING_INVALIDATION_RETRY_BASE_SECONDS       = "30"
    REPORTING_INVALIDATION_RETRY_MAX_SECONDS        = "300"
    REPORTING_PRIVACY_MIN_GROUP_SIZE                = "5"
    REPORTING_MAX_DATE_RANGE_DAYS                   = "365"
    REPORT_EXPORT_ENABLED                           = "false"
    REPORT_EXPORT_MAX_ROWS                          = "5000"
    REPORT_EXPORT_MAX_DATE_RANGE_DAYS               = "365"
    ANALYTICS_EVENTS_ENABLED                        = "false"
    ANALYTICS_EVENT_RETENTION_DAYS                  = "90"
    ANALYTICS_EVENT_BODY_MAX_BYTES                  = "16384"
    ANALYTICS_EVENT_IDENTITY_LIMIT                  = "120"
    STUDENT_PROGRESS_TREND_ENABLED                  = "false"
    ADMIN_LEARNING_OUTCOMES_ENABLED                 = "false"
    WEIGHTED_PROCESS_SCORE_ENABLED                  = "false"

    RATE_LIMIT_WINDOW_SECONDS                  = "900"
    REGISTER_RATE_LIMIT_MAX                    = "10"
    LOGIN_RATE_LIMIT_MAX                       = "30"
    REFRESH_RATE_LIMIT_MAX                     = "60"
    PUBLIC_INVITATION_RATE_LIMIT_MAX           = "20"
    ADMIN_INVITATION_RATE_LIMIT_WINDOW_SECONDS = "3600"
    ADMIN_INVITATION_RATE_LIMIT_MAX            = "20"
    LOGIN_FAILURE_WINDOW_SECONDS               = "900"
    LOGIN_FAILURE_MAX_ATTEMPTS                 = "5"
    LOGIN_COOLDOWN_SECONDS                     = "900"
    BOOTSTRAP_ADMIN_ENABLED                    = "false"
  }

  runtime_secret_environment_variables = {
    MONGODB_URI = {
      secret_id = "ml-production-mongodb-uri"
      version   = var.mongodb_uri_secret_version
    }
    ACCESS_TOKEN_SECRET = {
      secret_id = "ml-production-access-token-secret"
      version   = var.access_token_secret_version
    }
    AUTH_IDENTITY_PEPPER = {
      secret_id = "ml-production-auth-identity-pepper"
      version   = var.auth_identity_pepper_secret_version
    }
    CLASSROOM_CODE_PEPPER = {
      secret_id = "ml-production-classroom-code-pepper"
      version   = var.classroom_code_pepper_secret_version
    }
  }
}

module "iam" {
  source     = "../../modules/iam"
  project_id = var.project_id
  service_accounts = {
    (local.runtime_account_id) = {
      display_name = "Microlearning Production Runtime"
      description  = "Cloud Run production runtime identity without deployment access"
    }
    (local.deployer_account_id) = {
      display_name = "Microlearning GitHub Production"
      description  = "Protected production promotion identity using short-lived WIF credentials"
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
  source                        = "../../modules/workload-identity"
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

module "cloud_run_service" {
  source                        = "../../modules/cloud-run-service"
  project_id                    = var.project_id
  region                        = var.region
  environment                   = local.environment
  service_name                  = local.service_name
  image_ref                     = var.image_ref
  runtime_service_account_email = module.iam.service_account_emails[local.runtime_account_id]
  max_instances                 = 2
  container_concurrency         = 20
  environment_variables         = local.runtime_environment_variables
  secret_environment_variables  = local.runtime_secret_environment_variables
  labels                        = var.labels
  allow_public_invoker          = var.allow_public_invoker
  deletion_protection           = true
  provision                     = var.provision_service
  depends_on                    = [module.secret_contract]
}

module "secret_contract" {
  source      = "../../modules/secret-containers"
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
  labels    = var.labels
  provision = var.provision_secret_containers || var.bootstrap_secret_containers
}

module "monitoring" {
  source             = "../../modules/monitoring"
  project_id         = var.project_id
  environment        = local.environment
  resource_prefix    = "microlearning-production-"
  provision          = var.provision_monitoring
  service_name       = local.service_name
  service_host       = replace(local.canonical_url, "https://", "")
  app_version        = var.app_version
  commit_sha         = var.commit_sha
  image_digest       = local.image_digest
  notification_email = var.monitoring_notification_email
}

check "production_resources_move_together" {
  assert {
    condition     = var.provision_service == var.provision_secret_containers && var.provision_service == var.provision_monitoring
    error_message = "Production service, secret containers and monitoring must be planned together."
  }
}

check "secret_container_bootstrap_isolated" {
  assert {
    condition = !var.bootstrap_secret_containers || (
      !var.provision_service &&
      !var.provision_secret_containers &&
      !var.provision_monitoring
    )
    error_message = "Secret-container bootstrap must not provision the Production service, normal secret path or monitoring."
  }
}
