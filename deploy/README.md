# Deploying app-monitor to Google Cloud

This directory deploys the whole stack to GCP using **Terraform** (infrastructure)
and **Docker** (images). MongoDB is hosted on **MongoDB Atlas** (GCP has no
managed Mongo).

## Architecture on GCP

```
                                  ┌────────────────────────┐
   browser ──HTTPS──▶  Cloud Run: web (nginx)              │
                       │  serves SPA, proxies /api ─────────┼──▶ Cloud Run: api
                       └────────────────────────┘               (Express)
                                                                    │
   Cloud Scheduler ──daily──▶ Cloud Run Job: enqueue-daily         │ reads/writes
        (cron)                       │ inserts pending jobs         ▼
                                     └───────────────────────▶  MongoDB Atlas
                                                                    ▲
                        Cloud Run: worker (always-on) ──────────────┘
                          Playwright/Chromium poller
                                     │ uploads PNGs
                                     ▼
                          GCS bucket (public read) ◀── browser loads <img>
```

| Component        | GCP resource                          | Notes                                            |
| ---------------- | ------------------------------------- | ------------------------------------------------ |
| Web SPA          | Cloud Run service (nginx)             | Serves the build, reverse-proxies `/api` → api   |
| API              | Cloud Run service (public)            | Express + Mongoose                               |
| Worker           | Cloud Run service, `min=1`, CPU always on | Playwright/Chromium queue poller             |
| Daily enqueue    | Cloud Run Job + Cloud Scheduler       | Cron triggers the job via the Run admin API      |
| Screenshots      | Cloud Storage bucket (public read)    | `GcsStorage` uploads here; SPA renders the URLs  |
| Mongo URI        | Secret Manager                        | Injected into api/worker/job                     |
| Database         | MongoDB Atlas (external)              | You create the cluster; we wire the connection   |
| Images           | Artifact Registry (Docker)            | Built by `build-and-push.sh`                      |

## What changed in the app for GCP

- `lib/storage.ts` gained a `GcsStorage` driver. Selected by `STORAGE_DRIVER=gcs`
  + `GCS_BUCKET=<bucket>`. Local dev (`STORAGE_DRIVER` unset) still writes to disk.
- `bin/worker.ts` starts a tiny health HTTP server **only when `PORT` is set**
  (Cloud Run sets it), so the always-on worker passes Cloud Run's port check.
  Locally `PORT` is unset, so nothing changes.
- No other app code changed.

## Prerequisites

- `gcloud` CLI, authenticated: `gcloud auth login`
- Docker (with buildx; images are built for `linux/amd64`)
- Terraform ≥ 1.5
- A GCP project with billing enabled
- A MongoDB Atlas cluster (see below)

## 1. MongoDB Atlas

1. Create a cluster (the free M0 tier is fine to start).
2. Create a database user (username + password).
3. **Network access:** Cloud Run uses dynamic egress IPs, so either:
   - allow `0.0.0.0/0` in Atlas (simplest; rely on the strong DB password), or
   - (hardened) put the services behind a VPC connector with Cloud NAT and a
     static egress IP, then allowlist that IP. Not configured here.
4. Copy the SRV connection string, e.g.
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/app-monitor?retryWrites=true&w=majority`.

## 2. Configure Terraform

```bash
cd deploy/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: project_id, region, mongodb_uri
```

Give Terraform credentials:

```bash
gcloud auth application-default login
```

## 3. Bootstrap: enable APIs + create the image repository

The Cloud Run services reference images that must exist *before* they deploy,
so create the registry (and the APIs it depends on) first:

```bash
terraform init
terraform apply -target=google_artifact_registry_repository.repo
```

## 4. Build and push images

From the **repo root**:

```bash
./deploy/scripts/build-and-push.sh "$PROJECT_ID" us-central1
```

This builds `api`, `worker`, and `web` and pushes them to Artifact Registry.

## 5. Deploy everything

```bash
cd deploy/terraform
terraform apply
```

Terraform wires the dependency graph itself — including passing the API's
generated URL into the web container's nginx proxy — so this is a single apply.

When it finishes:

```bash
terraform output web_url     # open this in your browser
terraform output api_url
```

## Redeploying new code

```bash
./deploy/scripts/build-and-push.sh "$PROJECT_ID" us-central1 v2
cd deploy/terraform
terraform apply -var="image_tag=v2"
```

(Use a fresh tag so Cloud Run picks up the new image; `latest` is cached.)

## Tear down

```bash
cd deploy/terraform
terraform destroy
```

The bucket has `force_destroy = true`, so it's removed even with screenshots in
it. The Atlas cluster is external — delete it in the Atlas console separately.

## Notes & caveats

- **Public bucket:** screenshots are world-readable so `<img src>` works without
  signing. If an org policy blocks public buckets, remove the `public_read`
  binding in `storage.tf` and switch `GcsStorage` to signed URLs.
- **Public API:** the API allows unauthenticated invocation because the web
  container proxies to it without an identity token. To lock it down, make the
  API internal and have nginx attach a Cloud Run ID token.
- **Cloud Scheduler** no longer requires an App Engine app in most projects. If
  `apply` fails creating the scheduler job, ensure the project has a valid
  default location.
- Terraform CLI was not available in the authoring environment, so the configs
  here were not `terraform validate`'d locally — run `terraform validate` after
  `terraform init` before your first apply.
