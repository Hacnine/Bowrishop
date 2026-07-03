# Backend Dockerfile for NestJS
FROM node:24-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install system utilities required by healthchecks and Prisma
RUN apt-get update \
	&& apt-get install -y --no-install-recommends wget openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# Copy workspace files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc* ./
COPY backend/package.json ./backend/

# Install dependencies for backend workspace only
RUN pnpm install --frozen-lockfile --filter backend

# Copy backend source code
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Provide dummy DATABASE_URL for build-time Prisma commands only (ARG = build-time only)
ARG DATABASE_URL="postgresql://trendora:trendora@localhost:5432/trendora"

# Generate Prisma client
RUN DATABASE_URL=${DATABASE_URL} npx prisma generate

# Build NestJS application and verify output
RUN pnpm run build && ls -la dist/src/ && test -f dist/src/main.js

EXPOSE 3001

# Run migrations then start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]