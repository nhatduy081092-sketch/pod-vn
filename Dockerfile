# syntax=docker/dockerfile:1.7
# ============================================================
# YALA (yala.vn) – 1 Dockerfile, 3 image production:
#   --target api   Hono API + Prisma (kèm Prisma CLI để chạy migrate)
#   --target web   Next.js storefront (standalone)
#   --target cms   Next.js CMS (standalone)
# Build qua docker-compose.production.yml (xem DEPLOY.md).
# ============================================================
ARG NODE_VERSION=22
ARG PNPM_VERSION=10.28.0

# ---------- nền chung ----------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    CI=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# openssl: Prisma engine; ca-certificates: gọi HTTPS (R2, Telegram, webhook)
# Tải sẵn pnpm (thử lại tới 5 lần – mạng VPS hay bị ngắt giữa chừng khi tải từ registry npm)
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable \
 && for i in 1 2 3 4 5; do corepack prepare "pnpm@${PNPM_VERSION}" --activate && pnpm --version && break; echo "Tải pnpm lỗi, thử lại lần $i…"; sleep $((i * 5)); done \
 && pnpm --version
WORKDIR /app

# ---------- cài dependency (cache theo lockfile) ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY apps/cms/package.json apps/cms/
COPY apps/api/package.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set fetch-retries 6 \
 && pnpm config set fetch-retry-mintimeout 10000 \
 && pnpm config set fetch-retry-maxtimeout 90000 \
 && pnpm config set network-concurrency 8 \
 && for i in 1 2 3; do pnpm install --frozen-lockfile && exit 0; echo "pnpm install lỗi, thử lại lần $i…"; sleep $((i * 10)); done; exit 1

# ---------- mã nguồn + Prisma Client ----------
FROM deps AS source
COPY . .
RUN pnpm --filter @pod/db generate

# ---------- API (+ migrate) ----------
FROM source AS api
ENV NODE_ENV=production \
    API_PORT=4000 \
    UPLOAD_DIR=uploads
# thư mục ảnh upload (gắn volume) thuộc user không phải root
RUN mkdir -p /app/apps/api/uploads && chown -R node:node /app/apps/api/uploads
USER node
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--import", "tsx", "src/index.ts"]

# ---------- build Next.js (web + cms) ----------
FROM source AS next-build
# NEXT_PUBLIC_* và URL rewrite được "đóng băng" lúc build -> truyền qua build args
ARG NEXT_PUBLIC_SITE_URL=https://yala.vn
ARG NEXT_PUBLIC_API_URL=http://api:4000
ARG API_URL=http://api:4000
ARG NEXT_PUBLIC_UPLOADS_BASE=
ARG NEXT_PUBLIC_GA4_ID=
ARG NEXT_PUBLIC_META_PIXEL_ID=
ENV NODE_ENV=production \
    NEXT_OUTPUT=standalone \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    API_URL=$API_URL \
    NEXT_PUBLIC_UPLOADS_BASE=$NEXT_PUBLIC_UPLOADS_BASE \
    NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID \
    NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID
RUN pnpm --filter @pod/web build && pnpm --filter @pod/cms build

# ---------- runtime Next.js (chỉ file cần chạy) ----------
FROM node:${NODE_VERSION}-bookworm-slim AS next-runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0
WORKDIR /app

FROM next-runtime AS web
COPY --from=next-build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=next-build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=next-build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]

FROM next-runtime AS cms
COPY --from=next-build --chown=node:node /app/apps/cms/.next/standalone ./
COPY --from=next-build --chown=node:node /app/apps/cms/.next/static ./apps/cms/.next/static
COPY --from=next-build --chown=node:node /app/apps/cms/public ./apps/cms/public
USER node
ENV PORT=3001
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/cms/server.js"]
