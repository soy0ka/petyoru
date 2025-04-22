# Stage 1 - Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY package.json yarn.lock ./
# Enable Corepack and prepare Yarn v4.8.1 as defined in package.json
RUN corepack enable && corepack prepare yarn@4.8.1 --activate
RUN yarn install
RUN yarn build

# Stage 2 - Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["yarn", "start"]
