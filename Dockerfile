# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.19.0-alpine@sha256:2a49bdf71e9fd965a58c1703fd9ddd205b34e5782b692a72dd1d248abb0beb43

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM deps AS build
COPY tsconfig.base.json eslint.config.mjs ./
COPY scripts/verify-web-bundle.mjs scripts/verify-web-bundle.mjs
COPY apps/api apps/api
COPY apps/web apps/web
ENV VITE_API_BASE_URL=""
RUN npm run build --workspace @microlearning/web \
  && node scripts/verify-web-bundle.mjs \
  && npm run build --workspace @microlearning/api

FROM ${NODE_IMAGE} AS production-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --workspace @microlearning/api --include-workspace-root \
  && find node_modules -type f -name '*.map' -delete \
  && find node_modules -depth -type d \( -name test -o -name tests -o -name docs \) -exec rm -rf '{}' + \
  && npm cache clean --force

FROM ${NODE_IMAGE} AS runtime
ARG APP_VERSION=0.0.0-local
ARG COMMIT_SHA=0000000000000000000000000000000000000000
ARG BUILD_TIME=1970-01-01T00:00:00Z
ARG SOURCE_URL=https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App

LABEL org.opencontainers.image.title="Microlearning Classroom LMS Platform" \
  org.opencontainers.image.description="Single-origin React, REST API and Swagger runtime" \
  org.opencontainers.image.version="${APP_VERSION}" \
  org.opencontainers.image.revision="${COMMIT_SHA}" \
  org.opencontainers.image.created="${BUILD_TIME}" \
  org.opencontainers.image.source="${SOURCE_URL}"

ENV NODE_ENV=production \
  PORT=8080
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules/npm \
  /usr/local/bin/npm \
  /usr/local/bin/npx \
  /usr/local/lib/node_modules/corepack \
  /usr/local/bin/corepack \
  /usr/local/bin/yarn \
  /usr/local/bin/yarnpkg \
  /usr/local/bin/pnpm \
  /usr/local/bin/pnpx

COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./package.json
COPY --chown=node:node apps/api/package.json apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist apps/api/dist
COPY --from=build --chown=node:node /app/apps/web/dist apps/web/dist

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]
