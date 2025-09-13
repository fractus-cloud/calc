###############################
# Multi-stage build for calc  #
###############################

# Builder stage: install deps & build production output
FROM node:22-slim AS builder

WORKDIR /app

# Install system deps (if tailwind or other tooling needs build utilities)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git tini && rm -rf /var/lib/apt/lists/*

# Copy only manifest first for better caching
COPY package.json ./

# If a lockfile is later added (package-lock.json, pnpm-lock.yaml, etc.) copy it here
# (We intentionally use `npm install` because no lock file currently exists.)
RUN npm install --no-audit --no-fund

# Copy source
COPY . .

# Build the application (produces .output for Cloudflare preset)
RUN npm run build

###############################
# Runtime stage               #
###############################
FROM node:22-slim AS runner

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    WRANGLER_SEND_METRICS=false

WORKDIR /app

# Install wrangler globally for running the cloudflare-module output locally
RUN npm install --global wrangler@^4.36.0 && \
    apt-get update && apt-get install -y --no-install-recommends ca-certificates tini && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.source="https://github.com/fractus-cloud/calc" \
    org.opencontainers.image.title="calc" \
    org.opencontainers.image.description="Calculation & visualization playground (SolidStart)" \
    org.opencontainers.image.licenses="MIT"

# Copy built output & any runtime assets only
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/wrangler.jsonc ./wrangler.jsonc

# Expose the chosen port
EXPOSE 8080

# A lightweight health endpoint is served from worker root; fallback to 200 via curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT).then(r=>{if(r.ok)process.exit(0);process.exit(1)}).catch(()=>process.exit(1))" || exit 1

# Use tini as init for proper signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Run the built worker locally with assets (Cloudflare module preset) using wrangler
# NOTE: For production Cloudflare deployment prefer `wrangler deploy` outside Docker.
CMD ["wrangler", "dev", "--port", "8080", "--local", "--ip", "0.0.0.0"]
