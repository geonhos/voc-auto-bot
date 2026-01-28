# VOC AI 로그 분석 기능 구현

## 개요
VOC 생성 시 AI를 활용하여 관련 로그를 자동으로 분석하고 예상 원인과 신뢰도를 제공하는 기능

## 구현 내용

### 1. 새로 추가된 파일

#### DTO
- `VocLogAnalysis.java` - AI 로그 분석 결과 DTO
  - summary: 분석 요약
  - confidence: 신뢰도 (0.0 ~ 1.0)
  - keywords: 추출된 키워드
  - possibleCauses: 예상 원인 목록
  - relatedLogs: 관련 로그 (최대 5개)
  - recommendation: 권장 조치사항

- `VocResponseWithAnalysis.java` - 로그 분석 결과를 포함한 VOC 응답 DTO
  - 기존 VocResponse의 모든 필드 포함
  - logAnalysis 필드 추가

#### Service
- `VocLogAnalysisService.java` - VOC 로그 분석 서비스
  - `analyzeLogsForVoc()`: VOC 제목/내용에서 키워드 추출 → 로그 검색 → AI 분석
  - 키워드 추출 (에러, 실패, 타임아웃, 데이터베이스 등)
  - OpenSearch에서 최근 24시간 로그 검색
  - LLM을 통한 로그 분석 및 원인 추정

### 2. 수정된 파일

#### Controller
- `VocController.java`
  - `createVoc()` 메서드 수정
  - VOC 생성 후 자동으로 로그 분석 수행
  - 분석 실패 시에도 VOC 생성은 정상 처리
  - 응답 타입을 `VocResponseWithAnalysis`로 변경

### 3. 동작 흐름

```
1. 사용자 VOC 생성 요청
   ↓
2. VOC 엔티티 생성 및 저장
   ↓
3. VOC 제목/내용에서 키워드 추출
   - "오류", "에러", "실패" → ["error", "failed"]
   - "느림", "타임아웃" → ["timeout"]
   - "데이터베이스" → ["database"]
   ↓
4. OpenSearch에서 키워드로 로그 검색 (최근 24시간)
   ↓
5. LLM에게 프롬프트 전송
   - VOC 정보 + 검색된 로그
   - JSON 형식 응답 요청
   ↓
6. LLM 응답 파싱
   - summary, confidence, keywords, causes, recommendation
   ↓
7. VocResponseWithAnalysis 반환
   - VOC 정보 + AI 분석 결과
```

### 4. API 응답 예시

```json
{
  "status": "SUCCESS",
  "data": {
    "id": 123,
    "ticketId": "VOC-20260128-0001",
    "title": "데이터베이스 연결 오류",
    "content": "로그인 시 타임아웃 에러 발생",
    "status": "NEW",
    "priority": "HIGH",
    ...
    "logAnalysis": {
      "summary": "Database connection pool exhaustion causing timeout errors during login attempts",
      "confidence": 0.85,
      "keywords": ["database", "connection", "timeout", "pool"],
      "possibleCauses": [
        "Connection pool size too small",
        "Long-running queries not being closed",
        "Database server performance degradation"
      ],
      "relatedLogs": [
        {
          "timestamp": "2026-01-28 12:34:56",
          "logLevel": "ERROR",
          "serviceName": "voc-backend",
          "message": "Database connection timeout after 30s",
          "relevanceScore": 0.8
        }
      ],
      "recommendation": "Increase HikariCP connection pool size and review slow queries"
    }
  }
}
```

### 5. 예외 처리

- **로그가 없는 경우**
  ```json
  {
    "summary": "관련 로그를 찾을 수 없습니다.",
    "confidence": 0.0,
    "keywords": [],
    "possibleCauses": [],
    "relatedLogs": [],
    "recommendation": "로그 분석을 수행할 수 없습니다."
  }
  ```

- **OpenSearch 연결 실패**
  - 빈 분석 결과 반환
  - VOC 생성은 정상 처리

- **LLM 분석 실패**
  - 오류 메시지와 함께 빈 분석 결과 반환
  - VOC 생성은 정상 처리

### 6. 의존성

기존 인프라 활용:
- OpenSearch (로그 저장소)
- Ollama (LLM)
- LogSearchPort (로그 검색)
- LlmPort (AI 호출)

### 7. 테스트

`VocLogAnalysisServiceTest.java` 작성:
- ✅ 정상 분석 케이스
- ✅ 로그 없음 케이스
- ✅ 로그 검색 오류 케이스
- ✅ AI 분석 오류 케이스

### 8. 성능 고려사항

- 동기 처리: 현재는 VOC 생성 시 동기로 분석
- 최적화 방안:
  1. 비동기 처리 (CompletableFuture)
  2. 캐싱 (유사한 VOC 분석 결과 재사용)
  3. 타임아웃 설정 (5초)

### 9. 향후 개선 사항

1. **비동기 처리**
   - VOC 생성 응답 즉시 반환
   - 분석 완료 시 웹소켓으로 푸시

2. **더 정교한 키워드 추출**
   - NLP 기반 키워드 추출
   - TF-IDF, Word2Vec 활용

3. **분석 결과 저장**
   - 향후 참고를 위해 DB에 저장
   - 분석 품질 개선에 활용

4. **유사 VOC 추천**
   - 벡터 임베딩 기반 유사도 검색
   - pgvector 활용

## 빌드 및 실행

```bash
# Backend build
cd backend
./gradlew clean build

# Docker compose
cd ..
docker-compose up -d postgres redis ollama opensearch
docker-compose up backend
```

## API 테스트

```bash
# VOC 생성 (로그 분석 포함)
curl -X POST http://localhost:8080/api/v1/vocs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "데이터베이스 연결 오류",
    "content": "로그인 시도 시 타임아웃 에러가 발생합니다",
    "categoryId": 1,
    "customerEmail": "customer@example.com",
    "priority": "HIGH"
  }'
```

## 주요 클래스 다이어그램

```
VocController
    ↓ (uses)
VocLogAnalysisService
    ↓ (uses)
LogSearchPort ← OpenSearchAdapter
LlmPort ← OllamaAdapter
    ↓ (returns)
VocLogAnalysis
    ↓ (wrapped in)
VocResponseWithAnalysis
```

## 기술 스택

- Spring Boot 3.2.2
- Java 17
- Ollama (LLM)
- OpenSearch 2.11.1
- Jackson (JSON parsing)
- Lombok

## 작성자

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
