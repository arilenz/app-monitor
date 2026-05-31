locals {
  registry = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"

  api_image    = "${local.registry}/api:${var.image_tag}"
  worker_image = "${local.registry}/worker:${var.image_tag}"
  web_image    = "${local.registry}/web:${var.image_tag}"

  bucket_name = (
    var.screenshots_bucket_name != ""
    ? var.screenshots_bucket_name
    : "${var.project_id}-app-monitor-screenshots"
  )

  # APIs that must be enabled before the rest of the stack can be created.
  services = toset([
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com",
    "cloudscheduler.googleapis.com",
    "iam.googleapis.com",
  ])
}

resource "google_project_service" "services" {
  for_each = local.services

  service = each.value
  # Keep APIs enabled if the stack is torn down — other resources may use them.
  disable_on_destroy = false
}
