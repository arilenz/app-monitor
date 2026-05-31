# API service image. Also used (with an overridden command) by the
# enqueue-daily Cloud Run Job. Build context: repo root.
# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci
COPY apps/api/tsconfig.json ./
COPY apps/api/src ./src
RUN npm run build

# ---- runtime ----
FROM node:20-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY apps/api/package.json apps/api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Cloud Run injects PORT (default 8080); config.ts reads it.
EXPOSE 8080
CMD ["node", "dist/server.js"]
