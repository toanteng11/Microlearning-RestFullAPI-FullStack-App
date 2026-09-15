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
    error_message = "Production resources must remain in asia-southeast1."
  }
}

variable "image_ref" {
  description = "Exact Staging-verified immutable image selected for Production."
  type        = string
}

variable "app_version" {
  description = "Release manifest semantic version."
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
  description = "Approved numeric version of ml-production-mongodb-uri."
  type        = string
  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.mongodb_uri_secret_version))
    error_message = "mongodb_uri_secret_version must be an exact numeric version."
  }
}

variable "access_token_secret_version" {
  description = "Approved numeric version of ml-production-access-token-secret."
  type        = string
  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.access_token_secret_version))
    error_message = "access_token_secret_version must be an exact numeric version."
  }
}

variable "auth_identity_pepper_secret_version" {
  description = "Approved numeric version of ml-production-auth-identity-pepper."
  type        = string
  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.auth_identity_pepper_secret_version))
    error_message = "auth_identity_pepper_secret_version must be an exact numeric version."
  }
}

variable "classroom_code_pepper_secret_version" {
  description = "Approved numeric version of ml-production-classroom-code-pepper."
  type        = string
  validation {
    condition     = can(regex("^[1-9][0-9]*$", var.classroom_code_pepper_secret_version))
    error_message = "classroom_code_pepper_secret_version must be an exact numeric version."
  }
}

variable "provision_service" {
  description = "Plan Production Cloud Run. Defaults false until Part 08 review."
  type        = bool
  default     = false
}

variable "provision_secret_containers" {
  description = "Plan Production Secret Manager containers and runtime bindings."
  type        = bool
  default     = false
}

variable "provision_monitoring" {
  description = "Plan Production dashboard, uptime checks and alert policies."
  type        = bool
  default     = false
}

variable "allow_public_invoker" {
  description = "Explicitly permit the public login/Web endpoint for the academic demo profile."
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
  description = "Canonical non-sensitive Production labels."
  type        = map(string)
  default = {
    app                 = "microlearning"
    environment         = "production"
    managed_by          = "terraform"
    phase               = "phase-08"
    owner               = "project-owner"
    cost_center         = "student-project"
    data_classification = "application-data"
  }
}

variable "monitoring_notification_email" {
  description = "Optional owner email supplied through protected Terraform variables."
  type        = string
  default     = null
  validation {
    condition     = var.monitoring_notification_email == null || can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.monitoring_notification_email))
    error_message = "monitoring_notification_email must be a valid email address when provided."
  }
}
