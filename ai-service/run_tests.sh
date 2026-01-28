#!/bin/bash
# AI Service 테스트 실행 스크립트

set -e

echo "================================"
echo "VOC AI Service - Test Runner"
echo "================================"
echo ""

# 가상환경 확인
if [ ! -d ".venv" ]; then
    echo "❌ 가상환경이 없습니다. 먼저 생성하세요:"
    echo "   python -m venv .venv"
    echo "   source .venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# 가상환경 활성화 확인
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  가상환경을 활성화하세요:"
    echo "   source .venv/bin/activate"
    exit 1
fi

echo "✅ 가상환경 활성화됨: $VIRTUAL_ENV"
echo ""

# 테스트 실행
echo "🧪 단위 테스트 실행 중..."
echo "================================"
pytest -m "not integration" -v

echo ""
echo "================================"
echo "✅ 단위 테스트 완료!"
echo ""

# Ollama 연결 확인
echo "🔍 Ollama 서버 확인 중..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama 서버 연결됨"
    echo ""
    echo "🧪 통합 테스트 실행 중..."
    echo "================================"
    pytest -m integration -v
    echo ""
    echo "================================"
    echo "✅ 통합 테스트 완료!"
else
    echo "⚠️  Ollama 서버가 실행 중이지 않습니다."
    echo "   통합 테스트는 스킵됩니다."
    echo "   Ollama를 실행하려면: ollama serve"
fi

echo ""
echo "================================"
echo "📊 테스트 커버리지 생성 중..."
echo "================================"
pytest --cov=app --cov-report=term-missing --cov-report=html

echo ""
echo "✅ 모든 테스트 완료!"
echo "📊 커버리지 리포트: htmlcov/index.html"
echo ""
