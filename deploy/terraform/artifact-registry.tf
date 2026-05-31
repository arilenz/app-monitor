# Docker repository that holds the api/worker/web images. Created during the
# bootstrap apply so images can be pushed before the services are deployed.
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = var.repository_id
  format        = "DOCKER"
  description   = "app-monitor container images"

  depends_on = [google_project_service.services]
}
