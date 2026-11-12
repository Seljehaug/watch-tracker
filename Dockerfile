# Dockerfile v2 (M2 D1, D65): Node builds the Angular app, the .NET SDK builds the API, and the
# ASP.NET Core runtime serves both from one origin (D71) – Angular from wwwroot, the API on /api.
# Replaces v1, where nginx served Angular alone. Three stages; only the last ends up in the image.

# --- Stage 1: build Angular -------------------------------------------------------------------
# Node 24, as in .nvmrc. This stage is thrown away once the build is copied out of it.
FROM node:24-slim AS angular
WORKDIR /app

# The dependencies on their own first: this layer is reused from the cache until package.json
# or the lockfile changes, so a code change doesn't run npm ci again.
COPY package.json package-lock.json ./
RUN npm ci

# Only what the Angular build reads. Not `COPY . .` as in v1: that would bring server/ along,
# and a C# change would build Angular again for nothing.
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY public public
COPY src src
RUN npm run build

# --- Stage 2: build the API -------------------------------------------------------------------
# The .NET SDK – the compiler and NuGet. Thrown away too; the image only gets what it builds.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api
WORKDIR /src

# The same trick as npm ci: restore the NuGet packages from the project file alone, so this
# layer is reused until a package changes.
COPY server/WatchTracker.Api/WatchTracker.Api.csproj server/WatchTracker.Api/
RUN dotnet restore server/WatchTracker.Api/WatchTracker.Api.csproj

# Then the API's source, and a Release build of it into /out: the DLLs and appsettings*.json,
# which run anywhere the ASP.NET Core runtime is installed.
COPY server/WatchTracker.Api server/WatchTracker.Api
RUN dotnet publish server/WatchTracker.Api/WatchTracker.Api.csproj --no-restore -c Release -o /out

# --- Stage 3: run -----------------------------------------------------------------------------
# Only the ASP.NET Core runtime: no SDK, no Node, no source.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=api /out ./
# Angular's build goes in wwwroot beside the DLLs, the folder ASP.NET Core serves files from.
COPY --from=angular /app/dist/watch-tracker/browser wwwroot

# The image comes with a user without root rights, app (its id is in APP_UID). Run as it, so a
# hole in the app can't change the files in the image – they belong to root.
USER $APP_UID

# The image sets ASPNETCORE_HTTP_PORTS=8080, so the app listens on 8080; fly.toml's
# internal_port must match it (D2). No ASPNETCORE_ENVIRONMENT: it defaults to Production, which
# reads appsettings.Production.json (JSON logs) and needs ConnectionStrings__Default from outside.
EXPOSE 8080

ENTRYPOINT ["dotnet", "WatchTracker.Api.dll"]
