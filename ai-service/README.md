# VOC Log Analysis AI Service

Python + FastAPI 기반 VOC 로그 분석 서비스입니다. LangChain과 Ollama를 사용하여 RAG(Retrieval-Augmented Generation) 패턴으로 VOC와 관련된 시스템 로그를 분석합니다.

## 주요 기능

- **벡터 기반 유사도 검색**: ChromaDB를 사용한 로그 벡터화 및 유사도 검색
- **RAG 패턴**: 유사 로그를 컨텍스트로 LLM에 전달하여 정확한 분석
- **Ollama 통합**: 로컬 LLM 모델 사용 (프라이버시 보장)
- **Mock 데이터**: 30개 시나리오의 다양한 로그 데이터 포함

## 기술 스택

- **Python 3.11+**
- **FastAPI**: REST API 서버
- **LangChain**: RAG 파이프라인 구성
- **Ollama**: 로컬 LLM 및 Embeddings
- **ChromaDB**: Vector Store
- **Pydantic**: 데이터 검증

## 프로젝트 구조

```
ai-service/
├── main.py                 # FastAPI 엔트리포인트
├── requirements.txt        # Python 의존성
├── .env.example           # 환경 변수 예시
├── .gitignore
├── README.md
└── app/
    ├── __init__.py
    ├── api/
    │   ├── __init__.py
    │   └── routes.py      # API 엔드포인트
    ├── services/
    │   ├── __init__.py
    │   ├── embedding_service.py   # 벡터화 및 검색
    │   └── analysis_service.py    # RAG 분석
    ├── models/
    │   ├── __init__.py
    │   └── schemas.py     # Pydantic 모델
    └── data/
        └── mock_logs.json # Mock 로그 데이터
```

## 설치 및 실행

### 1. 사전 요구사항

#### Ollama 설치 및 실행

```bash
# macOS
brew install ollama

# Ollama 서비스 시작
ollama serve

# 필요한 모델 다운로드
ollama pull llama3.2:latest
ollama pull nomic-embed-text
```

### 2. Python 가상환경 설정

```bash
# 가상환경 생성
python -m venv .venv

# 가상환경 활성화
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 필요시 설정 수정
# OLLAMA_BASE_URL=http://localhost:11434
# PORT=8001
```

### 4. 서비스 실행

```bash
# 개발 모드 (Hot reload)
python main.py

# 또는 uvicorn 직접 실행
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

서비스가 정상 실행되면:
- API: http://localhost:8001
- API 문서: http://localhost:8001/docs

## API 사용법

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

### VOC 로그 분석

```bash
curl -X POST http://localhost:8001/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "title": "결제 오류 발생",
    "content": "결제 진행 중 타임아웃 오류가 발생했습니다. 30초 후 연결 실패 메시지가 표시됩니다."
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

## Mock 데이터

`app/data/mock_logs.json`에 30개의 다양한 시나리오 로그가 포함되어 있습니다:

- 결제 오류 (타임아웃, 카드 인증 실패)
- 인증 오류 (토큰 만료, 계정 잠김)
- 데이터베이스 오류 (연결 풀 고갈)
- 시스템 오류 (서비스 불가, Circuit Breaker)
- 캐시 오류 (Redis 연결 실패)
- 파일 업로드 오류
- 알림 전송 실패
- API Rate Limit
- 검색 타임아웃
- 배치 작업 실패

## Java Backend 연동

### Spring Boot에서 호출

```java
@Service
@RequiredArgsConstructor
public class PythonAiServiceClient {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url}")
    private String aiServiceUrl;  // http://localhost:8001

    public VocLogAnalysis analyzeVoc(String title, String content) {
        String url = aiServiceUrl + "/api/v1/analyze";

        Map<String, String> request = Map.of(
            "title", title,
            "content", content
        );

        try {
            ResponseEntity<VocLogAnalysis> response = restTemplate.postForEntity(
                url,
                request,
                VocLogAnalysis.class
            );

            return response.getBody();
        } catch (Exception e) {
            log.error("Failed to call AI service", e);
            return VocLogAnalysis.empty("AI 서비스 호출 실패");
        }
    }
}
```

### application.yml 설정

```yaml
ai:
  service:
    url: http://localhost:8001
```

## 개발 가이드

### 로그 형식 변경

`app/data/mock_logs.json` 파일을 수정하여 로그 데이터를 추가하거나 변경할 수 있습니다.

### 모델 변경

`.env` 파일에서 모델을 변경할 수 있습니다:

```bash
# Embedding 모델
EMBEDDING_MODEL=nomic-embed-text  # 또는 mxbai-embed-large

# LLM 모델
LLM_MODEL=llama3.2:latest         # 또는 llama3.1:8b, mistral:latest
```

### 테스트 실행

```bash
# 전체 테스트 실행
pytest

# 특정 테스트 파일 실행
pytest tests/test_analysis_service.py -v

# 단위 테스트만 실행 (Ollama 불필요)
pytest -m "not integration"

# 통합 테스트 실행 (Ollama 필요)
pytest -m integration

# 커버리지 리포트 생성
pytest --cov=app --cov-report=term-missing --cov-report=html

# 테스트 결과 자세히 보기
pytest -vv --tb=long
```

**테스트 구조:**
- `tests/test_models.py`: Pydantic 모델 검증 테스트
- `tests/test_embedding_service.py`: 벡터 검색 서비스 테스트
- `tests/test_analysis_service.py`: RAG 분석 서비스 테스트
- `tests/test_api.py`: FastAPI 엔드포인트 테스트
- `tests/conftest.py`: Pytest fixtures 및 공통 설정

## 문제 해결

### Ollama 연결 실패

```bash
# Ollama 서비스 상태 확인
ps aux | grep ollama

# Ollama 재시작
killall ollama
ollama serve
```

### 모델 다운로드 필요

```bash
# 필요한 모델 확인
ollama list

# 모델 다운로드
ollama pull llama3.2:latest
ollama pull nomic-embed-text
```

### ChromaDB 초기화 오류

```bash
# ChromaDB 디렉토리 삭제 후 재시작
rm -rf chroma_db/
python main.py
```

## 성능 최적화

- **벡터 검색 결과 수**: `k=5` (기본값, 필요시 조정)
- **LLM Temperature**: `0.3` (일관된 결과를 위해 낮게 설정)
- **최대 로그 수**: Mock 데이터 30개 (실제 환경에서는 조정 필요)

## 라이센스

MIT License

## 참고 자료

- [LangChain Documentation](https://python.langchain.com/)
- [Ollama](https://ollama.ai/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [ChromaDB](https://www.trychroma.com/)
