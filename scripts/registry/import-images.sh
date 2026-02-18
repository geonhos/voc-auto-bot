#!/bin/bash
# Import Docker images on an AIR-GAPPED server.
set -euo pipefail

IMPORT_DIR="${1:-.}"

echo "=== Docker Image Import ==="

# Find archive
ARCHIVE=$(ls "${IMPORT_DIR}"/docker-images-*.tar.gz 2>/dev/null | sort -r | head -1)
if [ -z "$ARCHIVE" ]; then
    echo "[ERROR] No image archive found in: ${IMPORT_DIR}"
    exit 1
fi

# Verify checksum
CHECKSUM="${ARCHIVE%.tar.gz}.sha256"
echo "[1/2] Verifying checksum..."
if [ -f "$CHECKSUM" ]; then
    (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM")")
else
    echo "[ERROR] No checksum file found: ${CHECKSUM}"
    echo "  Air-gapped deployments require integrity verification."
    echo "  Use --skip-verify to bypass (not recommended)."
    if [ "${2:-}" != "--skip-verify" ]; then
        exit 1
    fi
    echo "[WARN] Skipping verification as requested."
fi

# Load images
echo "[2/2] Loading images..."
docker load -i "$ARCHIVE"

echo ""
echo "=== Import Complete ==="
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -20
