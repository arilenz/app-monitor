# MongoDB Atlas connection string, injected into the API/worker/job at runtime.
resource "google_secret_manager_secret" "mongodb_uri" {
  secret_id = "app-monitor-mongodb-uri"

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "mongodb_uri" {
  secret      = google_secret_manager_secret.mongodb_uri.id
  secret_data = var.mongodb_uri
}

# The runtime service account (api + worker + enqueue job) may read it.
resource "google_secret_manager_secret_iam_member" "runtime_access" {
  secret_id = google_secret_manager_secret.mongodb_uri.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.runtime.email}"
}
