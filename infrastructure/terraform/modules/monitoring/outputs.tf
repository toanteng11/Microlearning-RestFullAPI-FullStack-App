output "validated_contract" {
  description = "Validated Monitoring inputs and provisioned resource references."
  value = {
    project_id           = var.project_id
    environment          = var.environment
    resource_prefix      = var.resource_prefix
    provision            = var.provision
    service_name         = var.service_name
    service_host         = var.service_host
    app_version          = var.app_version
    commit_sha           = var.commit_sha
    image_digest         = var.image_digest
    dashboard            = var.provision ? google_monitoring_dashboard.operations[0].id : null
    health_uptime_check  = var.provision ? google_monitoring_uptime_check_config.health[0].id : null
    notification_channel = var.provision && var.notification_email != null ? google_monitoring_notification_channel.owner[0].name : null
  }
}
