# Bucket for captured screenshots. GcsStorage uploads here and the frontend
# renders the objects directly, so they are world-readable.
resource "google_storage_bucket" "screenshots" {
  name                        = local.bucket_name
  location                    = var.region
  uniform_bucket_level_access = true
  # Allow `terraform destroy` to remove the bucket even with objects in it.
  force_destroy = true

  depends_on = [google_project_service.services]
}

# Public read so <img src> works without signed URLs. If an org policy blocks
# public buckets (public access prevention / domain-restricted sharing), drop
# this and switch GcsStorage to signed URLs instead.
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.screenshots.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
