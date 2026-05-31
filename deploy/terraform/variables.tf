variable "project_id" {
  type        = string
  description = "GCP project ID to deploy into."
}

variable "region" {
  type        = string
  description = "Region for Cloud Run, Artifact Registry, and the bucket."
  default     = "us-central1"
}

variable "mongodb_uri" {
  type        = string
  sensitive   = true
  description = "MongoDB Atlas SRV connection string (incl. credentials and db name). Stored in Secret Manager."
}

variable "image_tag" {
  type        = string
  description = "Container image tag to deploy (must already be pushed to Artifact Registry)."
  default     = "latest"
}

variable "repository_id" {
  type        = string
  description = "Artifact Registry Docker repository name."
  default     = "app-monitor"
}

variable "enqueue_schedule" {
  type        = string
  description = "Cron schedule (UTC) for the daily enqueue job."
  default     = "0 6 * * *"
}

variable "screenshots_bucket_name" {
  type        = string
  description = "Globally-unique name for the screenshots bucket. Defaults to <project_id>-app-monitor-screenshots."
  default     = ""
}
