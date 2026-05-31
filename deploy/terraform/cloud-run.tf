# ---- API service (public; the web container proxies to it) ----
resource "google_cloud_run_v2_service" "api" {
  name                = "app-monitor-api"
  location            = var.region
  deletion_protection = false

  template {
    service_account = google_service_account.runtime.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = local.api_image
      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "STORAGE_DRIVER"
        value = "gcs"
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.screenshots.name
      }
      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mongodb_uri.secret_id
            version = "latest"
          }
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_version.mongodb_uri,
    google_secret_manager_secret_iam_member.runtime_access,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---- Worker service (always-on poller; no public ingress) ----
resource "google_cloud_run_v2_service" "worker" {
  name                = "app-monitor-worker"
  location            = var.region
  deletion_protection = false
  ingress             = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = google_service_account.runtime.email

    # Exactly one always-running worker. The queue claim is atomic, so scaling
    # out would be safe, but one instance keeps cost and ordering predictable.
    scaling {
      min_instance_count = 1
      max_instance_count = 1
    }

    containers {
      image = local.worker_image
      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "STORAGE_DRIVER"
        value = "gcs"
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.screenshots.name
      }
      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.mongodb_uri.secret_id
            version = "latest"
          }
        }
      }

      resources {
        # Chromium needs headroom; cpu_idle=false keeps the CPU allocated
        # between requests so the polling loop actually runs.
        limits = {
          cpu    = "1"
          memory = "2Gi"
        }
        cpu_idle = false
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_version.mongodb_uri,
    google_secret_manager_secret_iam_member.runtime_access,
  ]
}

# ---- Web service (public; serves SPA + proxies /api to the API) ----
resource "google_cloud_run_v2_service" "web" {
  name                = "app-monitor-web"
  location            = var.region
  deletion_protection = false

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      image = local.web_image
      ports {
        container_port = 8080
      }

      # nginx substitutes this into its proxy_pass at startup.
      env {
        name  = "API_URL"
        value = google_cloud_run_v2_service.api.uri
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "256Mi"
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  location = var.region
  name     = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ---- Enqueue job (run daily by Cloud Scheduler) ----
resource "google_cloud_run_v2_job" "enqueue" {
  name                = "app-monitor-enqueue-daily"
  location            = var.region
  deletion_protection = false

  template {
    template {
      service_account = google_service_account.runtime.email
      max_retries     = 1

      containers {
        image   = local.api_image
        command = ["node", "dist/bin/enqueue-daily.js"]

        env {
          name = "MONGODB_URI"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.mongodb_uri.secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_version.mongodb_uri,
    google_secret_manager_secret_iam_member.runtime_access,
  ]
}
