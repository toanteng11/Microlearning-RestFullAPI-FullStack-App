variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
  default     = "microlearning-platform-502716"
}

variable "project_number" {
  description = "Immutable Google Cloud project number."
  type        = string
  default     = "759791798260"

  validation {
    condition     = can(regex("^[0-9]+$", var.project_number))
    error_message = "project_number must be numeric."
  }
}

variable "region" {
  description = "Canonical Google Cloud region."
  type        = string
  default     = "asia-southeast1"

  validation {
    condition     = var.region == "asia-southeast1"
    error_message = "Phase 07 resources must remain in asia-southeast1."
  }
}

variable "image_ref" {
  description = "Exact immutable image selected for validation/deployment."
  type        = string
}

variable "app_version" {
  description = "Release manifest application version."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+\\.[0-9]+\\.[0-9]+(?:[-+][0-9A-Za-z.-]+)?$", var.app_version))
    error_message = "app_version must be a semantic version."
  }
}

variable "commit_sha" {
  description = "Full trusted main commit SHA."
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9]{40}$", var.commit_sha))
    error_message = "commit_sha must contain 40 lowercase hexadecimal characters."
  }
}

variable "build_time" {
  description = "Release manifest ISO-8601 UTC build timestamp."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]+)?Z$", var.build_time))
    error_message = "build_time must be an ISO-8601 UTC timestamp."
  }
}

variable "mongodb_uri_secret_version" {
  description = "Approved exact numeric version of ml-staging-mongodb-uri."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.mongodb_uri_secret_version))
    error_message = "mongodb_uri_secret_version must be an exact numeric version, never latest."
  }
}

variable "access_token_secret_version" {
  description = "Approved exact numeric version of ml-staging-access-token-secret."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.access_token_secret_version))
    error_message = "access_token_secret_version must be an exact numeric version."
  }
}

variable "auth_identity_pepper_secret_version" {
  description = "Approved exact numeric version of ml-staging-auth-identity-pepper."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.auth_identity_pepper_secret_version))
    error_message = "auth_identity_pepper_secret_version must be an exact numeric version."
  }
}

variable "classroom_code_pepper_secret_version" {
  description = "Approved exact numeric version of ml-staging-classroom-code-pepper."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.classroom_code_pepper_secret_version))
    error_message = "classroom_code_pepper_secret_version must be an exact numeric version."
  }
}

variable "seed_demo_password_secret_version" {
  description = "Approved exact numeric version of ml-staging-seed-demo-password."
  type        = string

  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.seed_demo_password_secret_version))
    error_message = "seed_demo_password_secret_version must be an exact numeric version."
  }
}

variable "provision_service" {
  description = "Provision the public Staging service after the private seed/index job succeeds."
  type        = bool
  default     = true
}

variable "provision_seed_job" {
  description = "Provision the private on-demand Staging seed job."
  type        = bool
  default     = true
}

variable "github_repository" {
  description = "Exact GitHub owner/repository claim."
  type        = string
  default     = "toanteng11/Microlearning-RestFullAPI-FullStack-App"
}

variable "github_repository_id" {
  description = "Immutable GitHub repository ID."
  type        = string
  default     = "1298420607"
}

variable "github_repository_owner" {
  description = "Exact GitHub repository owner login."
  type        = string
  default     = "toanteng11"
}

variable "github_repository_owner_id" {
  description = "Immutable GitHub owner ID."
  type        = string
  default     = "237665091"
}

variable "labels" {
  description = "Canonical labels applied to managed resources."
  type        = map(string)
  default = {
    app                 = "microlearning"
    environment         = "staging"
    managed_by          = "terraform"
    phase               = "phase-07"
    owner               = "project-owner"
    cost_center         = "student-project"
    data_classification = "synthetic"
  }
}

variable "monitoring_notification_email" {
  description = "Optional owner email for Staging Monitoring alerts; keep it in local tfvars or a protected variable."
  type        = string
  default     = null

  validation {
    condition     = var.monitoring_notification_email == null || can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.monitoring_notification_email))
    error_message = "monitoring_notification_email must be a valid email address when provided."
  }
}
