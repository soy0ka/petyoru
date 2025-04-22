# Stage 1 - Build
FROM node:20-alpine AS builder

WORKDIR /app

# Corepack 활성화 (Yarn 4 지원)
RUN corepack enable && corepack prepare yarn@4.8.1 --activate

COPY . .
RUN yarn install
RUN yarn build

# Stage 2 - Runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Corepack 필요 시 재설정
RUN corepack enable && corepack prepare yarn@4.8.1 --activate

COPY --from=builder /app ./

EXPOSE 3000
CMD ["yarn", "start"]
