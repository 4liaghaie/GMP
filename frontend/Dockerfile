FROM node:22-alpine AS deps

WORKDIR /app

RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://repo.abrha.net/alpine|g' /etc/apk/repositories

COPY package*.json ./

RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false && \
    npm ci --include=optional && \
    npm install --no-save lightningcss-linux-x64-musl@$(node -p "require('./node_modules/lightningcss/package.json').version")

FROM node:22-alpine AS builder

WORKDIR /app

RUN sed -i 's|https://dl-cdn.alpinelinux.org/alpine|https://repo.abrha.net/alpine|g' /etc/apk/repositories && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set strict-ssl false

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}
ARG NEXT_PUBLIC_RUBIKA_USERNAME
ENV NEXT_PUBLIC_RUBIKA_USERNAME=${NEXT_PUBLIC_RUBIKA_USERNAME}
ARG NEXT_PUBLIC_RUBIKA_LINK
ENV NEXT_PUBLIC_RUBIKA_LINK=${NEXT_PUBLIC_RUBIKA_LINK}
ARG NEXT_PUBLIC_BALE_USERNAME
ENV NEXT_PUBLIC_BALE_USERNAME=${NEXT_PUBLIC_BALE_USERNAME}

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
