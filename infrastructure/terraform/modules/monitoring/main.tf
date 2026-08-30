check "monitoring_environment_boundary" {
  assert {
    condition     = startswith(var.resource_prefix, "microlearning-${var.environment}-")
    error_message = "resource_prefix must match the selected environment."
  }
}

check "monitoring_provisioning_inputs" {
  assert {
    condition = !var.provision || (var.service_name != "" && var.service_host != "" && var.app_version != "" &&
    can(regex("^[a-f0-9]{40}$", var.commit_sha)) && can(regex("^sha256:[a-f0-9]{64}$", var.image_digest)))
    error_message = "service identity and exact release metadata are required when Monitoring is provisioned."
  }
}

locals {
  notification_channels = var.provision && var.notification_email != null ? [
    google_monitoring_notification_channel.owner[0].name
  ] : []

  cloud_run_resource_filter = join(" AND ", [
    "resource.type = \"cloud_run_revision\"",
    "resource.labels.service_name = \"${var.service_name}\"",
  ])
}

resource "google_logging_metric" "http_5xx" {
  count       = var.provision ? 1 : 0
  name        = "${var.resource_prefix}http-5xx"
  description = "Cloud Run HTTP 5xx responses for the Microlearning service."
  filter      = <<-EOT
    ${local.cloud_run_resource_filter}
    AND jsonPayload.http.status >= 500
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_logging_metric" "readiness_failures" {
  count       = var.provision ? 1 : 0
  name        = "${var.resource_prefix}readiness-failures"
  description = "Cloud Run readiness endpoint failures for the Microlearning service."
  filter      = <<-EOT
    ${local.cloud_run_resource_filter}
    AND jsonPayload.http.route = "/ready"
    AND jsonPayload.http.status >= 500
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_logging_metric" "auth_failures" {
  count       = var.provision ? 1 : 0
  name        = "${var.resource_prefix}auth-failures"
  description = "Authentication failures and rate limits for the Microlearning service."
  filter      = <<-EOT
    ${local.cloud_run_resource_filter}
    AND jsonPayload.http.route = "/api/v1/auth/login"
    AND jsonPayload.http.status >= 401
  EOT

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_monitoring_notification_channel" "owner" {
  count        = var.provision && var.notification_email != null ? 1 : 0
  display_name = "${var.resource_prefix}owner email"
  type         = "email"
  description  = "Owner notification channel for ${var.environment} operational alerts."

  labels = {
    email_address = var.notification_email
  }

  user_labels = {
    environment = var.environment
    managed_by  = "terraform"
    phase       = "phase-07"
  }
}

resource "google_monitoring_dashboard" "operations" {
  count   = var.provision ? 1 : 0
  project = var.project_id

  dashboard_json = jsonencode({
    displayName = "${var.resource_prefix}operations"
    gridLayout = {
      columns = "2"
      widgets = [
        {
          text = {
            content = <<-EOT
              ## Active release
              - Service: `${var.service_name}`
              - Environment: `${var.environment}`
              - Version: `${var.app_version}`
              - Commit: `${var.commit_sha}`
              - Image digest: `${var.image_digest}`
            EOT
            format  = "MARKDOWN"
          }
        },
        {
          title = "HTTP 5xx responses"
          xyChart = {
            dataSets = [{
              plotType   = "LINE"
              targetAxis = "Y1"
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.http_5xx[0].name}\" resource.type=\"cloud_run_revision\""
                  aggregation = {
                    alignmentPeriod    = "300s"
                    perSeriesAligner   = "ALIGN_SUM"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
            }]
            yAxis = {
              label = "responses"
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Readiness failures"
          xyChart = {
            dataSets = [{
              plotType   = "LINE"
              targetAxis = "Y1"
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.readiness_failures[0].name}\" resource.type=\"cloud_run_revision\""
                  aggregation = {
                    alignmentPeriod    = "300s"
                    perSeriesAligner   = "ALIGN_SUM"
                    crossSeriesReducer = "REDUCE_SUM"
                  }
                }
              }
            }]
          }
        },
        {
          title = "Cloud Run memory utilization"
          xyChart = {
            dataSets = [{
              plotType   = "LINE"
              targetAxis = "Y1"
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "${local.cloud_run_resource_filter} AND metric.type=\"run.googleapis.com/container/memory/utilizations\""
                  aggregation = {
                    alignmentPeriod    = "300s"
                    perSeriesAligner   = "ALIGN_PERCENTILE_95"
                    crossSeriesReducer = "REDUCE_MEAN"
                  }
                }
              }
            }]
            yAxis = {
              label = "ratio"
              scale = "LINEAR"
            }
          }
        },
        {
          title = "Cloud Run request latency"
          xyChart = {
            dataSets = [{
              plotType   = "LINE"
              targetAxis = "Y1"
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "${local.cloud_run_resource_filter} AND metric.type=\"run.googleapis.com/request_latencies\""
                  aggregation = {
                    alignmentPeriod  = "300s"
                    perSeriesAligner = "ALIGN_DELTA"
                  }
                }
              }
            }]
            yAxis = {
              label = "latency"
              scale = "LINEAR"
            }
          }
        },
      ]
    }
  })
}

resource "google_monitoring_uptime_check_config" "health" {
  count        = var.provision ? 1 : 0
  project      = var.project_id
  display_name = "${var.resource_prefix}health"
  timeout      = "10s"
  period       = "300s"
  http_check {
    path         = "/health"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = var.service_host
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_monitoring_alert_policy" "uptime" {
  count        = var.provision ? 1 : 0
  project      = var.project_id
  display_name = "${var.resource_prefix}uptime failure"
  combiner     = "OR"
  enabled      = true

  lifecycle {
    create_before_destroy = true
  }

  documentation {
    content   = "Health uptime failed repeatedly. Check the active Cloud Run revision, readiness and Atlas dependency. Runbook: phase-07/observability-and-alerting.md"
    mime_type = "text/markdown"
  }

  notification_channels = local.notification_channels

  conditions {
    display_name = "${var.resource_prefix}health uptime"

    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" resource.type=\"uptime_url\" metric.label.check_id=\"${google_monitoring_uptime_check_config.health[0].uptime_check_id}\""
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      duration        = "300s"

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_FRACTION_TRUE"
        cross_series_reducer = "REDUCE_MIN"
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
  }

  user_labels = {
    environment = var.environment
    severity    = "high"
    owner       = "project-owner"
    runbook     = "phase-07-observability"
  }
}

resource "google_monitoring_alert_policy" "http_5xx" {
  count        = var.provision ? 1 : 0
  project      = var.project_id
  display_name = "${var.resource_prefix}http 5xx"
  combiner     = "OR"
  enabled      = true

  documentation {
    content   = "HTTP 5xx responses exceeded five percent for five minutes. Triage logs and consider exact-digest rollback. Runbook: phase-07/rollback-and-incident-response.md"
    mime_type = "text/markdown"
  }

  notification_channels = local.notification_channels

  conditions {
    display_name = "${var.resource_prefix}http 5xx ratio"

    condition_threshold {
      filter             = "${local.cloud_run_resource_filter} AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      denominator_filter = "${local.cloud_run_resource_filter} AND metric.type=\"run.googleapis.com/request_count\""
      comparison         = "COMPARISON_GT"
      threshold_value    = 0.05
      duration           = "300s"

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }

      denominator_aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
  }

  user_labels = {
    environment = var.environment
    severity    = "high"
    owner       = "project-owner"
    runbook     = "phase-07-observability"
  }
}

resource "google_monitoring_alert_policy" "readiness" {
  count        = var.provision ? 1 : 0
  project      = var.project_id
  display_name = "${var.resource_prefix}readiness failure"
  combiner     = "OR"
  enabled      = true

  documentation {
    content   = "A readiness request returned HTTP 5xx. Check Atlas TLS, secret versions and the active Cloud Run revision. Runbook: phase-07/observability-and-alerting.md"
    mime_type = "text/markdown"
  }

  notification_channels = local.notification_channels

  conditions {
    display_name = "${var.resource_prefix}readiness log match"

    condition_matched_log {
      filter = <<-EOT
        ${local.cloud_run_resource_filter}
        AND jsonPayload.http.route = "/ready"
        AND jsonPayload.http.status >= 500
      EOT
    }
  }

  alert_strategy {
    auto_close = "1800s"

    notification_rate_limit {
      period = "300s"
    }
  }

  user_labels = {
    environment = var.environment
    severity    = "high"
    owner       = "project-owner"
    runbook     = "phase-07-observability"
  }
}

resource "google_monitoring_alert_policy" "memory" {
  count        = var.provision ? 1 : 0
  project      = var.project_id
  display_name = "${var.resource_prefix}memory utilization"
  combiner     = "OR"
  enabled      = true

  documentation {
    content   = "Cloud Run memory utilization exceeded 80 percent for ten minutes. Check instance pressure and tune the bounded container baseline. Runbook: phase-07/observability-and-alerting.md"
    mime_type = "text/markdown"
  }

  notification_channels = local.notification_channels

  conditions {
    display_name = "${var.resource_prefix}memory threshold"

    condition_threshold {
      filter          = "${local.cloud_run_resource_filter} AND metric.type=\"run.googleapis.com/container/memory/utilizations\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      duration        = "600s"

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_MEAN"
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
  }

  user_labels = {
    environment = var.environment
    severity    = "medium"
    owner       = "project-owner"
    runbook     = "phase-07-observability"
  }
}
