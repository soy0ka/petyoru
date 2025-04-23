# Stage 1 - Build
FROM node:22-alpine AS builder

WORKDIR /app

# Corepack (Yarn 4)
RUN corepack enable && corepack prepare yarn@4.8.1 --activate

# 환경변수 전달을 위해 build args 설정
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# 종속성 설치 및 빌드
COPY . .
RUN yarn install --immutable
RUN yarn build

# Stage 2 - Runtime
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Corepack 재설정 (실행 시점)
RUN corepack enable && corepack prepare yarn@4.8.1 --activate

# 빌드 결과 복사
COPY --from=builder /app .

# 포트 설정
EXPOSE 3000

# Next.js 앱 실행
CMD ["yarn", "start"]
