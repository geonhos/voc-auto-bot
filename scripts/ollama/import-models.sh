#!/bin/bash
# Run this on the AIR-GAPPED server to import Ollama models.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMPORT_DIR="${1:-.}"
OLLAMA_DATA="${OLLAMA_DATA_DIR:-/tmp/wt-182/ollama-data/models}"

echo "=== Ollama Model Import ==="

# Find the tar.gz file
ARCHIVE=$(ls "${IMPORT_DIR}"/ollama-models-v*.tar.gz 2>/dev/null | head -1)
if [ -z "$ARCHIVE" ]; then
    echo "[ERROR] No model archive found in: ${IMPORT_DIR}"
    exit 1
fi

CHECKSUM="${ARCHIVE%.tar.gz}.sha256"

# Verify integrity
if [ -f "$CHECKSUM" ]; then
    echo "[1/3] Verifying checksum..."
    (cd "$(dirname "$ARCHIVE")" && sha256sum -c "$(basename "$CHECKSUM")")
else
    echo "[WARN] No checksum file found. Skipping integrity check."
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
