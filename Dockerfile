# Stage 1 - Build
FROM node:22-alpine AS builder

WORKDIR /app

# Corepack 활성화 (Yarn 4 지원)
RUN corepack enable && corepack prepare yarn@4.8.1 --activate

COPY . .
RUN yarn install --immutable
RUN yarn build

# Stage 2 - Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Corepack 활성화 (필요한 경우만)
RUN corepack enable && corepack prepare yarn@4.8.1 --activate

COPY --from=builder /app ./

EXPOSE 3000
CMD ["yarn", "start"]
