# AI Service Implementation Summary

## 개요

Python + FastAPI + LangChain 기반 VOC 로그 분석 서비스 구현 완료

- **브랜치**: `feature/130-ai-analysis`
- **워크트리**: `/Users/geonho.yeom/workspace/voc-wt-130-ai-analysis`
- **이슈**: #130

## 구현 내용

### 1. Python AI Service (FastAPI)

#### 디렉토리 구조

```
ai-service/
├── main.py                          # FastAPI 엔트리포인트
├── requirements.txt                 # Python 의존성
├── Dockerfile                       # Docker 이미지
├── docker-compose.yml              # 독립 실행용 Docker Compose
├── test_api.sh                     # API 테스트 스크립트
├── .env.example                    # 환경 변수 예시
├── .gitignore
├── README.md                       # 상세 문서
└── app/
    ├── __init__.py
    ├── api/
    │   ├── __init__.py
    │   └── routes.py               # API 라우트
    ├── services/
    │   ├── __init__.py
    │   ├── embedding_service.py   # 벡터화 및 유사도 검색
    │   └── analysis_service.py    # RAG 기반 분석
    ├── models/
    │   ├── __init__.py
    │   └── schemas.py             # Pydantic 모델
    └── data/
        └── mock_logs.json         # Mock 로그 (30개 시나리오)
```

#### 주요 기능

1. **벡터 기반 유사도 검색** (`embedding_service.py`)
   - ChromaDB를 Vector Store로 사용
   - Ollama `nomic-embed-text` 모델로 로그 임베딩
   - VOC 내용과 유사한 로그 검색 (Top-K)

2. **RAG 패턴 적용** (`analysis_service.py`)
   - 유사 로그를 컨텍스트로 LLM에 전달
   - Ollama `llama3.2:latest` 모델로 분석
   - 구조화된 JSON 응답 생성

3. **API 엔드포인트** (`routes.py`)
   - `GET /health`: 서비스 상태 확인
   - `POST /api/v1/analyze`: VOC 로그 분석

#### Mock 데이터 (30개 시나리오)

- 결제 오류 (타임아웃, 카드 인증 실패, 잔액 부족)
- 인증 오류 (토큰 만료, 계정 잠김)
- 데이터베이스 오류 (연결 풀 고갈)
- 시스템 오류 (서비스 불가, Circuit Breaker)
- 캐시 오류 (Redis 연결 실패)
- 파일 업로드 오류
- 알림 전송 실패
- API Rate Limit
- 검색 타임아웃
- 배치 작업 실패 (OutOfMemory)

### 2. Spring Boot 연동

#### 새로 생성한 파일

1. **`PythonAiServiceConfig.java`**
   - Python AI 서비스 연동 설정
   - RestTemplate Bean 등록
   - `ai.service.*` 프로퍼티 바인딩

2. **`PythonAiServiceAdapter.java`**
   - Python AI 서비스 REST API 호출
   - 응답을 `VocLogAnalysis`로 변환
   - 에러 처리 및 로깅

#### 수정한 파일

1. **`VocLogAnalysisService.java`**
   - Python AI 서비스를 우선 사용
   - 실패 시 기존 OpenSearch + LLM 방식으로 폴백
   - 기존 로직을 `analyzeLogsLegacy()` 메서드로 분리

2. **`application.yml`**
   ```yaml
   ai:
     service:
       url: ${AI_SERVICE_URL:http://localhost:8001}
       analyze-endpoint: /api/v1/analyze
       timeout: ${AI_SERVICE_TIMEOUT:30000}
   ```

### 3. Docker 통합

#### 수정한 파일: `docker-compose.yml`

1. **AI Service 추가**
   ```yaml
   ai-service:
     build:
       context: ./ai-service
       dockerfile: Dockerfile
     container_name: voc-ai-service
     restart: unless-stopped
     environment:
       OLLAMA_BASE_URL: http://ollama:11434
       EMBEDDING_MODEL: ${EMBEDDING_MODEL:-nomic-embed-text}
       LLM_MODEL: ${LLM_MODEL:-llama3.2:latest}
       PORT: 8001
     ports:
       - "8001:8001"
     depends_on:
       - ollama
     volumes:
       - ai_service_chroma:/app/chroma_db
     networks:
       - voc-network
     profiles:
       - full
       - llm
   ```

2. **Backend 환경 변수 추가**
   ```yaml
   AI_SERVICE_URL: http://ai-service:8001
   ```

3. **Volume 추가**
   ```yaml
   ai_service_chroma:
   ```

## API 사용 예시

### Health Check

```bash
curl http://localhost:8001/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "vectorstore_initialized": true
}
```

### VOC 분석

```bash
curl -X POST http://localhost:8001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "title": "결제 오류 발생",
    "content": "결제 진행 중 타임아웃 오류가 발생했습니다."
  }'
```

**Response:**
```json
{
  "summary": "결제 게이트웨이 연결 타임아웃으로 인한 결제 실패가 발생했습니다.",
  "confidence": 0.92,
  "keywords": ["payment", "timeout", "gateway", "connection"],
  "possibleCauses": [
    "결제 게이트웨이 서버 응답 지연",
    "네트워크 연결 불안정",
    "타임아웃 설정 값 부족"
  ],
  "relatedLogs": [
    {
      "timestamp": "2026-01-28T10:15:23.456Z",
      "logLevel": "ERROR",
      "serviceName": "payment-service",
      "message": "Payment gateway timeout: Connection to PG server failed",
      "relevanceScore": 0.95
    }
  ],
  "recommendation": "결제 게이트웨이 서버 상태 확인 및 네트워크 연결 점검이 필요합니다."
}
```

## 실행 방법

### 1. Python AI Service 단독 실행

```bash
cd ai-service

# 가상환경 생성 및 활성화
python -m venv .venv
source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# Ollama 모델 다운로드 (필요시)
ollama pull llama3.2:latest
ollama pull nomic-embed-text

# 서비스 실행
python main.py
```

### 2. Docker Compose로 전체 실행

```bash
# LLM 프로필로 실행 (Ollama + AI Service 포함)
docker-compose --profile llm up -d

# 또는 전체 프로필
docker-compose --profile full up -d
```

### 3. API 테스트

```bash
cd ai-service
./test_api.sh
```

## 기술 스택

### Python AI Service

- **Python 3.11+**
- **FastAPI**: REST API 서버
- **LangChain**: RAG 파이프라인
- **Ollama**: 로컬 LLM (llama3.2) + Embeddings (nomic-embed-text)
- **ChromaDB**: Vector Store
- **Pydantic**: 데이터 검증

### Spring Boot Integration

- **RestTemplate**: HTTP 클라이언트
- **@ConfigurationProperties**: 설정 바인딩
- **Fallback Pattern**: Python 서비스 실패 시 기존 로직 사용

## 아키텍처 플로우

```
[VOC 입력]
    ↓
[Spring Boot Backend]
    ↓
    ├─ [Python AI Service 호출] ──→ [성공] → [분석 결과 반환]
    │                                    ↓
    │                            [벡터 검색 (ChromaDB)]
    │                                    ↓
    │                            [RAG 분석 (Ollama LLM)]
    │
    └─ [실패/Fallback]
         ↓
    [OpenSearch 로그 검색]
         ↓
    [기존 LLM 분석]
         ↓
    [분석 결과 반환]
```

## 설정 값

### Python AI Service

| 환경 변수 | 기본값 | 설명 |
|----------|--------|------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama 서버 URL |
| `EMBEDDING_MODEL` | `nomic-embed-text` | 임베딩 모델 |
| `LLM_MODEL` | `llama3.2:latest` | LLM 모델 |
| `PORT` | `8001` | API 포트 |

### Spring Boot Backend

| 프로퍼티 | 기본값 | 설명 |
|---------|--------|------|
| `ai.service.url` | `http://localhost:8001` | AI 서비스 URL |
| `ai.service.analyze-endpoint` | `/api/v1/analyze` | 분석 엔드포인트 |
| `ai.service.timeout` | `30000` | HTTP 타임아웃 (ms) |

## 파일 변경 사항

### 생성된 파일 (Python)

1. `/ai-service/main.py`
2. `/ai-service/requirements.txt`
3. `/ai-service/Dockerfile`
4. `/ai-service/docker-compose.yml`
5. `/ai-service/test_api.sh`
6. `/ai-service/.env.example`
7. `/ai-service/.gitignore`
8. `/ai-service/README.md`
9. `/ai-service/app/__init__.py`
10. `/ai-service/app/api/__init__.py`
11. `/ai-service/app/api/routes.py`
12. `/ai-service/app/services/__init__.py`
13. `/ai-service/app/services/embedding_service.py`
14. `/ai-service/app/services/analysis_service.py`
15. `/ai-service/app/models/__init__.py`
16. `/ai-service/app/models/schemas.py`
17. `/ai-service/app/data/mock_logs.json`

### 생성된 파일 (Java)

1. `/backend/voc-adapter/src/main/java/com/geonho/vocautobot/adapter/out/ai/PythonAiServiceConfig.java`
2. `/backend/voc-adapter/src/main/java/com/geonho/vocautobot/adapter/out/ai/PythonAiServiceAdapter.java`

### 수정된 파일

1. `/backend/voc-application/build.gradle` (Jackson 의존성 추가)
2. `/backend/voc-application/src/main/java/com/geonho/vocautobot/application/analysis/service/VocLogAnalysisService.java`
3. `/backend/voc-adapter/src/main/resources/application.yml`
4. `/docker-compose.yml`

## 테스트 가이드

### 1. Python Service 단위 테스트

```bash
cd ai-service
pytest -v
```

### 2. API 통합 테스트

```bash
cd ai-service
./test_api.sh
```

### 3. Java Integration 테스트

```java
@Test
void testPythonAiServiceIntegration() {
    String title = "결제 오류";
    String content = "타임아웃 발생";

    VocLogAnalysis result = vocLogAnalysisService.analyzeLogsForVoc(title, content);

    assertNotNull(result);
    assertTrue(result.confidence() > 0.5);
    assertFalse(result.keywords().isEmpty());
}
```

## 성능 최적화

- **벡터 검색**: Top-5 결과만 반환 (조정 가능)
- **LLM Temperature**: 0.3 (일관된 결과)
- **HTTP Timeout**: 30초
- **ChromaDB Persistence**: 디스크 저장으로 재시작 시 재임베딩 불필요

## 향후 개선 사항

1. **실제 로그 연동**
   - Mock 데이터 → 실제 로그 스트림 연동
   - Kafka/Logstash → Python Service

2. **모델 최적화**
   - 더 큰 LLM 모델 사용 (정확도 향상)
   - 한국어 특화 모델 적용

3. **캐싱**
   - 동일 VOC에 대한 분석 결과 캐싱
   - Redis 활용

4. **모니터링**
   - Prometheus + Grafana
   - AI 서비스 응답 시간, 성공률 추적

5. **배치 분석**
   - 여러 VOC 동시 분석 API
   - 비동기 처리

## 문제 해결

### Ollama 연결 실패

```bash
# Ollama 서비스 재시작
killall ollama
ollama serve
```

### ChromaDB 초기화 오류

```bash
# ChromaDB 디렉토리 삭제 후 재시작
rm -rf ai-service/chroma_db/
```

### Python 의존성 오류

```bash
# 가상환경 재생성
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 참고 문서

- [Python AI Service README](ai-service/README.md)
- [LangChain Documentation](https://python.langchain.com/)
- [Ollama](https://ollama.ai/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [ChromaDB](https://www.trychroma.com/)

## 작성자

- **구현 완료일**: 2026-01-28
- **이슈**: #130
- **브랜치**: `feature/130-ai-analysis`
