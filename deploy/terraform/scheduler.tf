# Triggers the enqueue job once a day by calling the Cloud Run Jobs admin API.
# Google APIs authenticate with an OAuth token (not OIDC), minted for the
# scheduler service account, which holds run.invoker on the job.
resource "google_cloud_scheduler_job" "enqueue_daily" {
  name      = "app-monitor-enqueue-daily"
  region    = var.region
  schedule  = var.enqueue_schedule
  time_zone = "Etc/UTC"

  http_target {
    http_method = "POST"
    uri         = "https://${var.region}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${var.project_id}/jobs/${google_cloud_run_v2_job.enqueue.name}:run"

    oauth_token {
      service_account_email = google_service_account.scheduler.email
    }
  }

  depends_on = [
    google_project_service.services,
    google_cloud_run_v2_job_iam_member.scheduler_invoker,
  ]
}
