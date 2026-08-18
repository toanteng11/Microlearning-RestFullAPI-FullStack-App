variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Artifact Registry region."
  type        = string
}

variable "repository_id" {
  description = "Docker repository identifier."
  type        = string
  default     = "microlearning"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{3,62}$", var.repository_id))
    error_message = "repository_id must be a lowercase Artifact Registry identifier."
  }
}

variable "image_name" {
  description = "Canonical package/image name retained by cleanup policy."
  type        = string
  default     = "microlearning-app"
}

variable "writer_members" {
  description = "IAM members allowed to upload and read artifacts."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for member in var.writer_members : startswith(member, "serviceAccount:")
    ])
    error_message = "Artifact writers must be serviceAccount IAM members."
  }
}

variable "labels" {
  description = "Non-sensitive labels."
  type        = map(string)
}
