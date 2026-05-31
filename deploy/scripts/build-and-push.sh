#!/usr/bin/env bash
# Builds the api, worker, and web images and pushes them to Artifact Registry.
# The repository must already exist (created by the bootstrap terraform apply).
#
# Usage: deploy/scripts/build-and-push.sh PROJECT_ID [REGION] [TAG]
#   PROJECT_ID  GCP project (required)
#   REGION      Artifact Registry region (default us-central1)
#   TAG         Image tag (default latest)
#
# Run from the repo root.
set -euo pipefail

PROJECT_ID="${1:?Usage: build-and-push.sh PROJECT_ID [REGION] [TAG]}"
REGION="${2:-us-central1}"
TAG="${3:-latest}"
REPO="app-monitor"

REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}"

# Authenticate the Docker CLI against this region's Artifact Registry.
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# Build for linux/amd64 — Cloud Run runs amd64, so this matters on Apple Silicon.
PLATFORM="linux/amd64"

echo "Building images for ${REGISTRY} (tag ${TAG})…"
docker build --platform "${PLATFORM}" -f deploy/docker/api.Dockerfile    -t "${REGISTRY}/api:${TAG}" .
docker build --platform "${PLATFORM}" -f deploy/docker/worker.Dockerfile -t "${REGISTRY}/worker:${TAG}" .
docker build --platform "${PLATFORM}" -f deploy/docker/web.Dockerfile    -t "${REGISTRY}/web:${TAG}" .

echo "Pushing images…"
docker push "${REGISTRY}/api:${TAG}"
docker push "${REGISTRY}/worker:${TAG}"
docker push "${REGISTRY}/web:${TAG}"

echo "Done. Pushed api, worker, web at tag ${TAG}."
