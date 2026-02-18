#!/bin/bash
# Run this on an INTERNET-CONNECTED machine to export Ollama models
# for air-gapped deployment.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="${1:-1.0.0}"
OUTPUT_DIR="${SCRIPT_DIR}/../../ollama-export"
MANIFEST_FILE="${OUTPUT_DIR}/manifest.json"

mkdir -p "$OUTPUT_DIR"

echo "=== Ollama Model Export (v${VERSION}) ==="

# Models to export (override via OLLAMA_EXPORT_MODELS env var)
DEFAULT_MODELS="bge-m3:latest ${LLM_MODEL:-exaone3.5:7.8b}"
MODELS="${OLLAMA_EXPORT_MODELS:-$DEFAULT_MODELS}"

# Pull required models
echo "[1/4] Pulling models..."
for model in $MODELS; do
    echo "  Pulling: $model"
    ollama pull "$model"
done

# Get model storage location
OLLAMA_DIR="${OLLAMA_MODELS:-$HOME/.ollama/models}"

# Package models
echo "[2/4] Packaging models..."
tar -czf "${OUTPUT_DIR}/ollama-models-v${VERSION}.tar.gz" -C "$OLLAMA_DIR" .

# Generate checksum
echo "[3/4] Generating checksum..."
(cd "$OUTPUT_DIR" && sha256sum "ollama-models-v${VERSION}.tar.gz" > "ollama-models-v${VERSION}.sha256")

# Generate manifest
echo "[4/4] Writing manifest..."
cat > "$MANIFEST_FILE" <<EOF
{
  "version": "${VERSION}",
  "models": "$(echo "$MODELS" | tr ' ' ',')",
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "=== Export Complete ==="
echo "Files in: ${OUTPUT_DIR}/"
echo "  - ollama-models-v${VERSION}.tar.gz"
echo "  - ollama-models-v${VERSION}.sha256"
echo "  - manifest.json"
echo ""
echo "Transfer these files to the air-gapped environment."
