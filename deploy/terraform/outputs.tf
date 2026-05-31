output "web_url" {
  description = "Public URL of the web app."
  value       = google_cloud_run_v2_service.web.uri
}

output "api_url" {
  description = "Public URL of the API service."
  value       = google_cloud_run_v2_service.api.uri
}

output "worker_service" {
  description = "Name of the always-on worker service."
  value       = google_cloud_run_v2_service.worker.name
}

output "screenshots_bucket" {
  description = "Bucket where captured screenshots are stored."
  value       = google_storage_bucket.screenshots.name
}

output "registry" {
  description = "Artifact Registry path images are pushed to."
  value       = local.registry
}
