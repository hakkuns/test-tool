#!/bin/bash
# Prepare distribution package for PostgreSQL Test Helper
# This script builds the application and packages everything needed for deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="${PROJECT_ROOT}/dist"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="postgres-test-helper-${TIMESTAMP}"
PACKAGE_DIR="${DIST_DIR}/${PACKAGE_NAME}"

echo "=================================================="
echo "PostgreSQL Test Helper - Distribution Builder"
echo "=================================================="
echo ""

# Clean and create dist directory
echo "🧹 Cleaning previous builds..."
rm -rf "${DIST_DIR}"
mkdir -p "${PACKAGE_DIR}"

# Build backend
echo ""
echo "🏗️  Building backend..."
cd "${PROJECT_ROOT}/backend"
pnpm install --frozen-lockfile --prod=false
pnpm run build

# Build frontend
echo ""
echo "🏗️  Building frontend..."
cd "${PROJECT_ROOT}/frontend"
pnpm install --frozen-lockfile --prod=false
pnpm run build

# Copy workspace files (for pnpm workspace)
echo ""
echo "📦 Packaging workspace configuration..."
cp "${PROJECT_ROOT}/package.json" "${PACKAGE_DIR}/"
cp "${PROJECT_ROOT}/pnpm-lock.yaml" "${PACKAGE_DIR}/"
cp "${PROJECT_ROOT}/pnpm-workspace.yaml" "${PACKAGE_DIR}/"

# Copy backend files
echo ""
echo "📦 Packaging backend..."
mkdir -p "${PACKAGE_DIR}/backend"
cp -r "${PROJECT_ROOT}/backend/dist" "${PACKAGE_DIR}/backend/"
cp "${PROJECT_ROOT}/backend/package.json" "${PACKAGE_DIR}/backend/"
cp "${PROJECT_ROOT}/backend/.env.example" "${PACKAGE_DIR}/backend/.env"

# Copy frontend files
echo ""
echo "📦 Packaging frontend..."
mkdir -p "${PACKAGE_DIR}/frontend"
cp -r "${PROJECT_ROOT}/frontend/.next" "${PACKAGE_DIR}/frontend/"
cp -r "${PROJECT_ROOT}/frontend/public" "${PACKAGE_DIR}/frontend/"
cp "${PROJECT_ROOT}/frontend/package.json" "${PACKAGE_DIR}/frontend/"
cp "${PROJECT_ROOT}/frontend/.env.example" "${PACKAGE_DIR}/frontend/.env.local"

# Convert next.config.ts to next.config.mjs for production
cat > "${PACKAGE_DIR}/frontend/next.config.mjs" << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;
EOF

# Copy Docker files
echo ""
echo "🐳 Copying Docker configuration..."
mkdir -p "${PACKAGE_DIR}/docker"
cp "${PROJECT_ROOT}/docker/Dockerfile.dist" "${PACKAGE_DIR}/Dockerfile"
cp "${PROJECT_ROOT}/docker/start.sh" "${PACKAGE_DIR}/docker/"
chmod +x "${PACKAGE_DIR}/docker/start.sh"

# Create docker-compose for deployment
cat > "${PACKAGE_DIR}/docker-compose.yml" << 'EOF'
services:
  postgres-test-helper:
    build: .
    container_name: postgres-test-helper
    ports:
      - "3000:3000"
      - "3001:3001"
    env_file:
      - backend/.env
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge
EOF

# Copy documentation
echo ""
echo "📄 Copying documentation..."
cp "${PROJECT_ROOT}/docker/DEPLOYMENT.md" "${PACKAGE_DIR}/README.md" 2>/dev/null || true

# Create .dockerignore
cat > "${PACKAGE_DIR}/.dockerignore" << 'EOF'
node_modules
.git
.gitignore
dist
.turbo
*.log
.env
.env.local
README.md
docs
.github
.devcontainer
EOF

# Create version info
cat > "${PACKAGE_DIR}/VERSION.txt" << EOF
PostgreSQL Test Helper
Build Date: $(date '+%Y-%m-%d %H:%M:%S')
Version: ${TIMESTAMP}
EOF

# Create tarball
echo ""
echo "🗜️  Creating distribution archive..."
cd "${DIST_DIR}"
tar -czf "${PACKAGE_NAME}.tar.gz" "${PACKAGE_NAME}"

# Calculate size
ARCHIVE_SIZE=$(du -h "${PACKAGE_NAME}.tar.gz" | cut -f1)

echo ""
echo "=================================================="
echo "✅ Distribution package created successfully!"
echo "=================================================="
echo ""
echo "📦 Package: ${PACKAGE_NAME}.tar.gz"
echo "📏 Size: ${ARCHIVE_SIZE}"
echo "📂 Location: ${DIST_DIR}/${PACKAGE_NAME}.tar.gz"
echo ""
echo "To deploy:"
echo "  1. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  2. Configure: Edit backend/.env with your settings"
echo "  3. Build: docker-compose build"
echo "  4. Run: docker-compose up -d"
echo ""
