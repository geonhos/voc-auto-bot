#!/bin/bash

# VOC Log Analysis AI Service - API Test Script

BASE_URL="http://localhost:8001"

echo "=================================="
echo "VOC Log Analysis AI Service Test"
echo "=================================="
echo ""

# Test 1: Health Check
echo "[1] Health Check"
curl -s "$BASE_URL/health" | python -m json.tool
echo ""
echo ""

# Test 2: Payment Timeout Error
echo "[2] Testing Payment Timeout Error"
curl -s -X POST "$BASE_URL/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "결제 오류 발생",
    "content": "결제 진행 중 타임아웃 오류가 발생했습니다. 30초 후 연결 실패 메시지가 표시됩니다."
  }' | python -m json.tool
echo ""
echo ""

# Test 3: Authentication Error
echo "[3] Testing Authentication Error"
curl -s -X POST "$BASE_URL/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "로그인 실패",
    "content": "로그인 시도 시 토큰 만료 오류가 발생합니다. 다시 로그인하라는 메시지가 표시됩니다."
  }' | python -m json.tool
echo ""
echo ""

# Test 4: Database Connection Error
echo "[4] Testing Database Connection Error"
curl -s -X POST "$BASE_URL/api/v1/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "VOC 목록 조회 실패",
    "content": "VOC 목록을 불러오는 중 데이터베이스 연결 오류가 발생했습니다. 5초 후 타임아웃됩니다."
  }' | python -m json.tool
echo ""
echo ""

echo "=================================="
echo "Test Complete"
echo "=================================="
