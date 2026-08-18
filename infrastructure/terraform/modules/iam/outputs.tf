output "service_account_emails" {
  description = "Service-account emails keyed by account_id."
  value       = { for account_id, account in google_service_account.this : account_id => account.email }
}

output "service_account_names" {
  description = "Full service-account resource names keyed by account_id."
  value       = { for account_id, account in google_service_account.this : account_id => account.name }
}

output "deployer_email" {
  description = "Deployment service-account email."
  value       = google_service_account.this[var.deployer_account_id].email
}
