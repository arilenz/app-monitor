# Worker image — the queue poller that drives Playwright/Chromium.
# Runtime base is the official Playwright image with browsers + OS deps
# preinstalled; its tag MUST match the playwright version in package-lock.json
# (currently 1.60.0). Build context: repo root.
# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN npm run build

# ---- runtime ----
FROM mcr.microsoft.com/playwright:v1.60.0-jammy AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Cloud Run requires a liveness port; worker.ts serves it when PORT is set.
EXPOSE 8080
CMD ["node", "dist/bin/worker.js"]
