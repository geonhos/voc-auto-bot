#!/bin/bash
# Run this on the AIR-GAPPED server to import Ollama models.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_DIR="${1:-.}"
OLLAMA_DATA="${OLLAMA_DATA_DIR:-./ollama-data/models}"

echo "=== Ollama Model Import ==="

# Find the tar.gz file
ARCHIVE=$(ls "${IMPORT_DIR}"/ollama-models-v*.tar.gz 2>/dev/null | head -1)
if [ -z "$ARCHIVE" ]; then
    echo "[ERROR] No model archive found in: ${IMPORT_DIR}"
    exit 1
fi

CHECKSUM="${ARCHIVE%.tar.gz}.sha256"

# Verify integrity
echo "[1/3] Verifying checksum..."
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

# Extract models
echo "[2/3] Extracting models to ${OLLAMA_DATA}..."
mkdir -p "$OLLAMA_DATA"
tar -xzf "$ARCHIVE" -C "$OLLAMA_DATA"

# Verify manifest
MANIFEST="${IMPORT_DIR}/manifest.json"
if [ -f "$MANIFEST" ]; then
    echo "[3/3] Manifest:"
    cat "$MANIFEST"
else
    echo "[3/3] No manifest found."
fi

echo ""
echo "=== Import Complete ==="
echo "Models extracted to: ${OLLAMA_DATA}"
echo "Start Ollama with: docker compose up -d ollama"
