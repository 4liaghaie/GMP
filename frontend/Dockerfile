FROM node:22-alpine AS deps

WORKDIR /app

RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://repo.abrha.net/alpine|g' /etc/apk/repositories

COPY package*.json ./

RUN npm config set registry https://mirror-npm.runflare.com && \
    npm config set strict-ssl false && \
    npm ci

FROM node:22-alpine AS builder

WORKDIR /app

RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://repo.abrha.net/alpine|g' /etc/apk/repositories && \
    npm config set registry https://mirror-npm.runflare.com && \
    npm config set strict-ssl false

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://repo.abrha.net/alpine|g' /etc/apk/repositories && \
    addgroup -S nextjs && \
    adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]