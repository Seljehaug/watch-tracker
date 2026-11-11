# Dockerfile v1 (M2 A3, D65): Node builds the Angular app, nginx serves the result.
# Replaced by v2 in M2 D1, where the ASP.NET Core image serves both Angular and the API.

# --- Stage 1: build -------------------------------------------------------------------------
# Node 24, as in .nvmrc. This stage is thrown away once the build is copied out of it.
FROM node:24-slim AS build
WORKDIR /app

# The dependencies on their own first: this layer is reused from the cache until package.json
# or the lockfile changes, so a code change doesn't run npm ci again.
COPY package.json package-lock.json ./
RUN npm ci

# Then the rest of the source (minus .dockerignore) and the production build.
COPY . .
RUN npm run build

# --- Stage 2: serve -------------------------------------------------------------------------
# Only what is copied in here ends up in the image: no Node, no node_modules, no source.
FROM nginx:1.30-alpine

# Our site replaces the image's default one.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/watch-tracker/browser /usr/share/nginx/html

# Documents the port nginx listens on; fly.toml's internal_port must match it.
EXPOSE 80
