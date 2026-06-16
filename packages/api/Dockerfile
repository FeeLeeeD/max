# syntax=docker/dockerfile:1
#
# Production image for @max/api.
#
# BUILD CONTEXT MUST BE THE REPO ROOT (not packages/api), because this is a pnpm
# workspace: the lockfile, pnpm-workspace.yaml and the @max/sandbox package all
# live above packages/api and are required to install + build. Build with:
#
#   docker build -f packages/api/Dockerfile -t max-api .
#
# Multi-stage:
#   base    — Node + pinned pnpm via corepack
#   build   — install (frozen) + compile TS + produce a pruned, prod-only deploy
#   runtime — minimal image: compiled JS + prod node_modules + migrations only
#
# Base image choice: node:20-slim (Debian). All runtime deps are pure JS
# (hono, @hono/node-server, zod, pg, dotenv, portkey-ai) and embeddings now go
# to Voyage over HTTP, so there are no native ML addons. Alpine (musl) would
# also work and be a touch smaller, but Debian slim avoids musl edge cases for
# zero practical downside here.

# ---------------------------------------------------------------------------
FROM node:20-slim AS base
# Pin pnpm to the 9.x line to match the root package.json "engines" (>=9). The
# repo lockfile is pnpm v9 format; staying on 9 keeps --frozen-lockfile valid.
RUN corepack enable && corepack prepare pnpm@latest-9 --activate
WORKDIR /repo

# ---------------------------------------------------------------------------
FROM base AS build

# 1) Copy ONLY the manifests + lockfile first, so `pnpm install` is cached and
#    only re-runs when dependencies change (not on every source edit).
#    --frozen-lockfile validates the lockfile against EVERY workspace importer,
#    so all package.json files must be present even though we only build api +
#    sandbox. These manifests stay in the build stage and never reach runtime.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/api/package.json        packages/api/
COPY packages/sandbox/package.json    packages/sandbox/
COPY packages/kb-tool/package.json    packages/kb-tool/
COPY packages/widget/package.json     packages/widget/
COPY packages/shared/package.json     packages/shared/

# Install deps for api + its workspace deps (sandbox). The trailing "..." pulls
# in each filtered package's dependencies. Dev deps (typescript, tsx) are needed
# here to compile, so this is a full (non-prod) install.
RUN pnpm install --frozen-lockfile --filter @max/api...

# 2) Copy the TS sources + build config needed to compile.
COPY packages/api/tsconfig.json       packages/api/
COPY packages/api/src                 packages/api/src
COPY packages/sandbox/tsconfig.json   packages/sandbox/
COPY packages/sandbox/src             packages/sandbox/src

# Compile. `tsc --build` on @max/api follows its project reference and also
# builds @max/sandbox, emitting packages/api/dist and packages/sandbox/dist.
RUN pnpm --filter @max/api build

# 3) Produce a self-contained, prod-only deploy at /prod. `pnpm deploy` copies
#    @max/api and injects a real copy of @max/sandbox into /prod/node_modules
#    (no workspace symlinks), pruning devDependencies. On pnpm 9 this "copy the
#    workspace package" behavior IS the default (the --legacy flag that opts back
#    into it only exists on pnpm 10+, which defaults to inject-workspace-packages).
#    Each package's "files": ["dist"] is what makes deploy ship the compiled
#    dist (and drop the TS src) — without it, deploy would honor .gitignore
#    (which ignores dist/) and ship nothing runnable.
RUN pnpm --filter=@max/api --prod deploy /prod

# 4) The repo's @max/sandbox "exports" map points at ./src/*.ts (so `tsx` can run
#    sources directly in dev). At runtime under plain `node` those specifiers
#    must resolve to compiled JS, so rewrite the DEPLOYED copy's exports
#    ./src/X.ts -> ./dist/X.js. This is image-only; the repo is untouched.
#    --input-type=commonjs because /prod/package.json is type:module.
RUN node --input-type=commonjs -e "const fs=require('fs');const f='/prod/node_modules/@max/sandbox/package.json';const p=JSON.parse(fs.readFileSync(f,'utf8'));for(const k of Object.keys(p.exports)){p.exports[k]=p.exports[k].replace(/^\.\/src\//,'./dist/').replace(/\.ts$/,'.js')}fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n')"

# ---------------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
# Default app port; override at runtime with -e PORT=...
ENV PORT=8000
WORKDIR /app

# The pruned, prod-only app (compiled JS + prod node_modules). No TS sources, no
# dev deps, no other workspace packages.
COPY --from=build /prod /app

# Migrations: the migrator reads .sql from `${config.projectRoot}/db/migrations`,
# where config.projectRoot = resolve(dir(import.meta.url), "../../..") computed
# from the COMPILED sandbox config. pnpm deploy stores the real package inside its
# virtual store (node_modules/.pnpm/@max+sandbox@<hash>/node_modules/@max/sandbox),
# and Node resolves the symlink to that real path — so projectRoot lands in that
# hashed .pnpm dir, NOT /app/node_modules. The hash isn't stable, so instead of
# hardcoding it we compute the exact same path the app will (realpath of the
# sandbox dist + ../../..) and drop the SQL there.
COPY db/migrations /tmp/migrations
RUN ROOT="$(node --input-type=commonjs -e "const p=require('path'),fs=require('fs');console.log(p.resolve(fs.realpathSync('/app/node_modules/@max/sandbox/dist'),'../../..'))")" \
  && mkdir -p "$ROOT/db" \
  && mv /tmp/migrations "$ROOT/db/migrations" \
  && ls "$ROOT/db/migrations"

# Drop root privileges (the node image ships an unprivileged "node" user). The
# app only reads files and talks to the network, so read-only access is enough.
USER node

EXPOSE 8000

# Liveness via the existing GET /health route (returns 200 when the DB is
# reachable). Uses Node's built-in fetch (Node 20) to avoid adding curl/wget.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Real entrypoint: the deployed @max/api compiled output. node is PID 1 and
# receives SIGTERM/SIGINT directly, which index.ts handles for graceful shutdown.
CMD ["node", "dist/index.js"]
