check "runtime_environment_boundary" {
  assert {
    condition     = !var.provision || lookup(var.environment_variables, "APP_ENV", "") == var.environment
    error_message = "APP_ENV must match the Terraform environment."
  }
}

check "public_invoker_is_intentional" {
  assert {
    condition     = !var.provision || var.allow_public_invoker
    error_message = "The public Web entry point requires allow_public_invoker=true."
  }
}

resource "google_cloud_run_v2_service" "this" {
  count = var.provision ? 1 : 0

  project             = var.project_id
  name                = var.service_name
  location            = var.region
  ingress             = "INGRESS_TRAFFIC_ALL"
  deletion_protection = var.deletion_protection
  labels              = var.labels

  template {
    service_account                  = var.runtime_service_account_email
    timeout                          = "300s"
    max_instance_request_concurrency = var.container_concurrency

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }

    containers {
      name  = "application"
      image = var.image_ref

      ports {
        name           = "http1"
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle          = true
        startup_cpu_boost = true
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

      startup_probe {
        initial_delay_seconds = 0
        timeout_seconds       = 3
        period_seconds        = 5
        failure_threshold     = 24

        http_get {
          path = "/ready"
          port = 8080
        }
      }

      liveness_probe {
        initial_delay_seconds = 5
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 3

        http_get {
          path = "/health"
          port = 8080
        }
      }

      readiness_probe {
        timeout_seconds   = 3
        period_seconds    = 5
        failure_threshold = 3

        http_get {
          path = "/ready"
          port = 8080
        }
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  count = var.provision && var.allow_public_invoker ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this[0].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
