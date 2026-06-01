# Dockerfile — RDV-Pro production image.
#
# Two stages: a builder that installs everything (including dev
# deps for `tsc --noEmit`), and a slim runtime that only carries
# what's needed to run `tsx src/index.ts`.
#
# The image runs as a non-root user, listens on $PORT (default
# 3000), and surfaces /health for the load balancer.
#
# Build:  docker build -t rdv-pro .
# Run :   docker run --env-file .env -p 3000:3000 rdv-pro

# --- builder ---------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy lockfile first for cache efficiency.
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Fail the build if TypeScript doesn't compile cleanly.
RUN npm run typecheck

# --- runtime ---------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

# Drop privileges. The Node Alpine image ships a `node` user.
USER node

# Copy what the runtime actually needs.
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/src ./src
COPY --chown=node:node --from=builder /app/knowledge ./knowledge
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/tsconfig.json ./tsconfig.json

ENV NODE_ENV=production
EXPOSE 3000

# tsx runs TypeScript directly — no separate build step needed.
# If you want to ship plain .js, add `tsc --emit` and adjust.
CMD ["npx", "tsx", "src/index.ts"]
