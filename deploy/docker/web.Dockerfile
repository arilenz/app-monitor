# Web image — builds the Vite SPA and serves it via nginx, which also reverse
# proxies /api to the API service (same-origin, so no CORS and no API URL baked
# into the bundle). The proxy target is injected at runtime via ${API_URL}.
# Build context: repo root.
# ---- build ----
FROM node:20-slim AS build
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
# Empty base => the SPA calls /api on its own origin; nginx proxies it onward.
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
# The official image runs envsubst over /etc/nginx/templates/*.template at start.
# Restrict substitution to API_URL so nginx's own $variables survive.
ENV NGINX_ENVSUBST_FILTER=API_URL
COPY deploy/docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
