check "seed_environment_guard" {
  assert {
    condition = (
      lookup(var.environment_variables, "APP_ENV", "") == "staging" &&
      lookup(var.environment_variables, "BOOTSTRAP_ADMIN_ENABLED", "") == "false"
    )
    error_message = "Seed Job requires APP_ENV=staging and BOOTSTRAP_ADMIN_ENABLED=false."
  }
}

check "seed_password_isolated" {
  assert {
    condition     = contains(keys(var.secret_environment_variables), "SEED_DEMO_PASSWORD")
    error_message = "Seed Job must mount SEED_DEMO_PASSWORD from an exact Secret Manager version."
  }
}

resource "google_cloud_run_v2_job" "this" {
  count = var.provision ? 1 : 0

  project             = var.project_id
  name                = var.job_name
  location            = var.region
  deletion_protection = true
  labels              = var.labels

  template {
    task_count  = 1
    parallelism = 1

    template {
      service_account = var.service_account_email
      timeout         = "900s"
      max_retries     = 0

      containers {
        name    = "seed"
        image   = var.image_ref
        command = ["node"]
        args    = ["apps/api/dist/scripts/seed-demo.js"]

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }

        dynamic "env" {
          for_each = var.environment_variables
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = var.secret_environment_variables
          content {
            name = env.key
            value_source {
              secret_key_ref {
                secret  = "projects/${var.project_id}/secrets/${env.value.secret_id}"
                version = env.value.version
              }
            }
          }
        }
      }
    }
  }

  lifecycle {
    prevent_destroy = true
  }
}
