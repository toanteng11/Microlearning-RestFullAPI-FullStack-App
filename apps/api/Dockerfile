FROM node:24.14.0-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev

FROM node:24.14.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci

COPY apps/api apps/api
RUN npm run build --workspace @microlearning/api

FROM node:24.14.0-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./package.json
COPY apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist

USER node
EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/server.js"]
