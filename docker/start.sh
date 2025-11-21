#!/bin/sh
# Startup script for PostgreSQL Test Helper

set -e

echo "Starting PostgreSQL Test Helper..."

# Start backend in background
cd /app/backend
echo "Starting backend on port 3001..."
NODE_ENV=production PORT=3001 node dist/server.js &
BACKEND_PID=$!

# Start frontend
cd /app/frontend
echo "Starting frontend on port 3000..."
NODE_ENV=production PORT=3000 npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
