#!/bin/bash
# Export all Docker images needed for air-gapped deployment.
# Run on an INTERNET-CONNECTED machine.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
OUTPUT_DIR="${PROJECT_ROOT}/image-export"
VERSION="${1:-$(date +%Y%m%d)}"

mkdir -p "$OUTPUT_DIR"

echo "=== Docker Image Export (${VERSION}) ==="

# List of base images (update versions as needed)
IMAGES=(
    "pgvector/pgvector:pg16"
    "redis:7.2-alpine"
    "mailhog/mailhog:v1.0.1"
    "minio/minio:RELEASE.2024-11-07T00-52-20Z"
    "nginx:1.25-alpine"
)

# Pull all images
echo "[1/3] Pulling images..."
for img in "${IMAGES[@]}"; do
    echo "  Pulling: $img"
    docker pull "$img"
done

# Build application images
echo "[2/3] Building application images..."
(cd "$PROJECT_ROOT" && docker compose build backend frontend ai-service 2>/dev/null || echo "  [WARN] Some app images may not build without full env")

# Save all images to tar
echo "[3/3] Saving images..."
ARCHIVE="${OUTPUT_DIR}/docker-images-${VERSION}.tar"
docker save -o "$ARCHIVE" "${IMAGES[@]}"
gzip "$ARCHIVE"

# Generate checksum
(cd "$OUTPUT_DIR" && sha256sum "docker-images-${VERSION}.tar.gz" > "docker-images-${VERSION}.sha256")

# Write manifest
cat > "${OUTPUT_DIR}/manifest.json" <<EOF
{
  "version": "${VERSION}",
  "images": [
$(printf '    "%s",\n' "${IMAGES[@]}" | sed '$ s/,$//')
  ],
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "=== Export Complete ==="
echo "Files in: ${OUTPUT_DIR}/"
echo "Transfer to air-gapped environment and run import-images.sh"
