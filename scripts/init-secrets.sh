#!/bin/bash
# ============================================================
# init-secrets.sh - Generate .env file with random secrets
# ============================================================
# Usage: ./scripts/init-secrets.sh
#
# Generates a .env file in the project root with:
#   - Random passwords for PostgreSQL, Redis, MinIO
#   - Random JWT secret and AI Service API key
#   - Sensible defaults for non-secret configuration
#
# Prerequisites: openssl (available on macOS/Linux)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠ .env file already exists at: $ENV_FILE"
    echo "  To regenerate, delete it first: rm $ENV_FILE"
    exit 0
fi

# Generate random secrets
POSTGRES_PASSWORD=$(openssl rand -base64 24)
REDIS_PASSWORD=$(openssl rand -base64 24)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 48)
AI_SERVICE_API_KEY=$(openssl rand -hex 32)

cat > "$ENV_FILE" <<EOF
# =========================
# Database Configuration
# =========================
POSTGRES_DB=vocautobot
POSTGRES_USER=voc_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_PORT=5432

# =========================
# Redis Configuration
# =========================
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}

# =========================
# MinIO Configuration
# =========================
MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}

# =========================
# JWT Configuration
# =========================
JWT_SECRET=${JWT_SECRET}

# =========================
# AI Service Configuration
# =========================
AI_SERVICE_API_KEY=${AI_SERVICE_API_KEY}

# =========================
# Application Configuration
# =========================
SPRING_PROFILES_ACTIVE=docker

# =========================
# LLM Configuration
# =========================
LLM_MODEL=gpt-oss:20b

# =========================
# Application Ports
# =========================
BACKEND_PORT=8080
FRONTEND_PORT=3000

# =========================
# Frontend Configuration
# =========================
NEXT_PUBLIC_API_URL=http://localhost:8080/api
EOF

echo ".env created at: $ENV_FILE"
echo "Secrets have been randomly generated."
