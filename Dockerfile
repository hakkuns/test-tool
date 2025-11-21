# Production Dockerfile for PostgreSQL Test Helper
# Multi-stage build: backend + frontend

# Stage 1: Backend build
FROM node:22-alpine AS backend-builder
WORKDIR /build
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy backend package.json first for layer caching
COPY backend/package.json ./backend/

# Install all dependencies (workspace aware)
RUN pnpm install --frozen-lockfile --filter ./backend

# Copy backend source
COPY backend/src ./backend/src
COPY backend/tsconfig.json ./backend/
COPY backend/build.mjs ./backend/

# Build backend
WORKDIR /build/backend
RUN pnpm run build

# Stage 2: Frontend build
FROM node:22-alpine AS frontend-builder
WORKDIR /build
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy frontend package.json first for layer caching
COPY frontend/package.json ./frontend/

# Install all dependencies (workspace aware)
RUN pnpm install --frozen-lockfile --filter ./frontend

# Copy frontend source
COPY frontend/. ./frontend/

# Set build-time environment variable
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build frontend
WORKDIR /build/frontend
RUN pnpm run build

# Stage 3: Production runtime
FROM node:22-alpine AS runtime
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.1 --activate

# Copy backend
COPY --from=backend-builder /build/backend/dist ./backend/dist
COPY --from=backend-builder /build/backend/package.json ./backend/
COPY --from=backend-builder /build/node_modules ./node_modules

# Copy frontend
COPY --from=frontend-builder /build/frontend/.next ./frontend/.next
COPY --from=frontend-builder /build/frontend/public ./frontend/public
COPY --from=frontend-builder /build/frontend/package.json ./frontend/
COPY --from=frontend-builder /build/frontend/next.config.ts ./frontend/

# Copy workspace files for monorepo structure
COPY --from=frontend-builder /build/package.json ./
COPY --from=frontend-builder /build/pnpm-workspace.yaml ./

# Copy startup script
COPY docker/start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["/app/start.sh"]
