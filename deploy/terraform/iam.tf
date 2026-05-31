# Runtime identity shared by the API service, worker service, and enqueue job.
resource "google_service_account" "runtime" {
  account_id   = "app-monitor-runtime"
  display_name = "app-monitor runtime (api/worker/enqueue)"
}

# Identity Cloud Scheduler uses to trigger the enqueue job.
resource "google_service_account" "scheduler" {
  account_id   = "app-monitor-scheduler"
  display_name = "app-monitor scheduler"
}

# The worker writes captured images to the bucket. (Granted to the shared
# runtime SA; the API/job don't write but the over-grant is harmless.)
resource "google_storage_bucket_iam_member" "runtime_writer" {
  bucket = google_storage_bucket.screenshots.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.runtime.email}"
}

# Scheduler may execute the enqueue job.
resource "google_cloud_run_v2_job_iam_member" "scheduler_invoker" {
  location = var.region
  name     = google_cloud_run_v2_job.enqueue.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}
