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

# Pull required models
echo "[1/4] Pulling models..."
ollama pull nomic-embed-text:latest
ollama pull gemma3:4b

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
  "models": [
    {"name": "nomic-embed-text", "tag": "latest", "purpose": "embedding"},
    {"name": "gemma3", "tag": "4b", "purpose": "llm"}
  ],
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "exported_by": "$(whoami)"
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
