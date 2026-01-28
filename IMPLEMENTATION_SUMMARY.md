# Issue #130 구현 요약: VOC 입력 시 AI 로그 분석

## 작업 내용

VOC(Voice of Customer) 생성 시 AI를 활용하여 시스템 로그를 자동 분석하고, 문제의 예상 원인과 신뢰도를 제공하는 기능을 구현했습니다.

## 새로 생성된 파일

### 1. DTOs
```
backend/voc-application/src/main/java/com/geonho/vocautobot/application/analysis/dto/
├── VocLogAnalysis.java  # AI 로그 분석 결과 DTO

backend/voc-adapter/src/main/java/com/geonho/vocautobot/adapter/in/web/voc/dto/
├── VocResponseWithAnalysis.java  # 로그 분석 결과 포함 VOC 응답 DTO
```

### 2. Services
```
backend/voc-application/src/main/java/com/geonho/vocautobot/application/analysis/service/
├── VocLogAnalysisService.java  # VOC 로그 분석 핵심 서비스
```

### 3. Tests
```
backend/voc-application/src/test/java/com/geonho/vocautobot/application/analysis/service/
├── VocLogAnalysisServiceTest.java  # 단위 테스트
```

### 4. Documentation
```
AI_LOG_ANALYSIS_IMPLEMENTATION.md  # 상세 구현 문서
IMPLEMENTATION_SUMMARY.md  # 구현 요약 (이 파일)
```

## 수정된 파일

```
backend/voc-adapter/src/main/java/com/geonho/vocautobot/adapter/in/web/voc/
├── VocController.java  # createVoc() 메서드에 로그 분석 통합
```

## 주요 기능

### 1. 키워드 기반 로그 검색
- VOC 제목/내용에서 자동으로 키워드 추출
- 에러, 실패, 타임아웃, 데이터베이스 등 시스템 문제 관련 키워드
- OpenSearch에서 최근 24시간 로그 검색

### 2. AI 기반 로그 분석
- Ollama LLM을 활용한 로그 분석
- JSON 형식의 구조화된 응답
- 분석 요약, 신뢰도, 예상 원인, 권장 조치 제공

### 3. 응답 형식
```json
{
  "logAnalysis": {
    "summary": "문제 요약 (2-3문장)",
    "confidence": 0.85,
    "keywords": ["keyword1", "keyword2"],
    "possibleCauses": ["원인1", "원인2", "원인3"],
    "relatedLogs": [
      {
        "timestamp": "2026-01-28 12:34:56",
        "logLevel": "ERROR",
        "serviceName": "voc-backend",
        "message": "로그 메시지",
        "relevanceScore": 0.8
      }
    ],
    "recommendation": "권장 조치사항"
  }
}
```

### 4. 예외 처리
- 로그가 없을 경우: 빈 분석 결과 반환
- OpenSearch 연결 실패: VOC는 정상 생성, 분석만 실패
- LLM 분석 실패: 오류 메시지 포함하여 빈 결과 반환

## 기술 스택 및 의존성

### Backend
- Spring Boot 3.2.2
- Java 17
- Jackson (JSON 처리)
- Lombok

### AI/ML
- Ollama (LLM 서비스)
- OpenSearch (로그 저장소)

### 기존 인프라 활용
- LogSearchPort (로그 검색 포트)
- LlmPort (LLM 호출 포트)
- OllamaAdapter (기존 Ollama 연동)

## 아키텍처 패턴

### Hexagonal Architecture 준수
```
Adapter Layer (Web)
    VocController
        ↓
Application Layer (Use Case)
    VocLogAnalysisService
        ↓
Port (Interface)
    LogSearchPort, LlmPort
        ↓
Adapter Layer (Infrastructure)
    OpenSearchAdapter, OllamaAdapter
```

### 의존성 방향
- Adapter → Application → Domain
- 모든 의존성이 내부를 향함
- Port를 통한 외부 시스템 추상화

## 테스트 커버리지

### 단위 테스트 (VocLogAnalysisServiceTest)
1. ✅ 정상 시나리오 - 로그 검색 및 AI 분석 성공
2. ✅ 로그 없음 - 빈 분석 결과 반환
3. ✅ 로그 검색 오류 - 안전한 예외 처리
4. ✅ LLM 분석 오류 - 안전한 예외 처리

### 테스트 프레임워크
- JUnit 5
- Mockito (모킹)
- AssertJ (assertion)

## API 변경사항

### Before
```http
POST /api/v1/vocs
Response: VocResponse (기본 VOC 정보만)
```

### After
```http
POST /api/v1/vocs
Response: VocResponseWithAnalysis (VOC 정보 + AI 로그 분석)
```

## 성능 특성

### 현재 구현
- 동기 처리 (VOC 생성과 함께 분석 완료)
- 예상 응답 시간: 2-5초 (로그 검색 + AI 분석)
- 타임아웃: LLM 기본 타임아웃 설정 활용

### 향후 최적화 계획
1. 비동기 처리 (CompletableFuture)
2. 결과 캐싱 (유사 VOC)
3. 타임아웃 설정 (5초 제한)
4. WebSocket 알림 (분석 완료 시)

## 보안 고려사항

- 로그에는 민감 정보가 포함될 수 있으므로 필터링 필요 (향후)
- LLM 프롬프트에 민감 정보 포함 방지
- 인증된 사용자만 VOC 생성 및 로그 분석 가능

## 환경 변수

기존 설정 활용:
```yaml
ollama:
  base-url: ${LLM_API_URL:http://ollama:11434}
  model: ${LLM_MODEL:gpt-oss:20b}
  
opensearch:
  host: ${OPENSEARCH_HOST:opensearch}
  port: ${OPENSEARCH_PORT:9200}
```

## 빌드 및 배포

```bash
# 1. 백엔드 빌드
cd /Users/geonho.yeom/workspace/voc-wt-130-ai-analysis/backend
./gradlew clean build

# 2. Docker Compose 실행
cd ..
docker-compose up -d postgres redis ollama opensearch
docker-compose up backend

# 3. 테스트
curl -X POST http://localhost:8080/api/v1/vocs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title": "DB 연결 오류", ...}'
```

## 문제 해결 가이드

### OpenSearch 연결 실패
```
증상: logAnalysis가 null이거나 "OpenSearch is not available"
해결: docker-compose logs opensearch 확인
```

### LLM 분석 실패
```
증상: confidence가 0.0이고 summary에 오류 메시지
해결: Ollama 서비스 상태 확인, 모델 다운로드 확인
```

### 키워드 추출 실패
```
증상: "키워드를 추출할 수 없습니다"
원인: VOC 내용이 너무 짧거나 일반적인 내용
해결: 정상 동작, 로그 없음으로 처리
```

## 향후 개선 사항

### 단기 (다음 스프린트)
1. 비동기 처리 구현
2. 프론트엔드 UI 추가 (분석 결과 표시)
3. 타임아웃 설정

### 중기
1. 키워드 추출 개선 (NLP 활용)
2. 분석 결과 DB 저장
3. 분석 품질 피드백 수집

### 장기
1. 유사 VOC 자동 추천
2. 벡터 임베딩 기반 검색
3. 분석 정확도 향상 (Fine-tuning)

## 코드 품질 체크리스트

- ✅ Type hints (Java 17 Records)
- ✅ Docstrings (Javadoc)
- ✅ 예외 처리 (try-catch)
- ✅ 로깅 (SLF4J)
- ✅ 테스트 작성 (JUnit 5)
- ✅ Hexagonal Architecture 준수
- ✅ SOLID 원칙 준수

## 커밋 준비

```bash
cd /Users/geonho.yeom/workspace/voc-wt-130-ai-analysis

# 변경된 파일 확인
git status

# 추가된 파일들
git add backend/voc-application/src/main/java/com/geonho/vocautobot/application/analysis/dto/VocLogAnalysis.java
git add backend/voc-application/src/main/java/com/geonho/vocautobot/application/analysis/service/VocLogAnalysisService.java
git add backend/voc-adapter/src/main/java/com/geonho/vocautobot/adapter/in/web/voc/dto/VocResponseWithAnalysis.java
git add backend/voc-adapter/src/main/java/com/geonho/vocautobot/adapter/in/web/voc/VocController.java
git add backend/voc-application/src/test/java/com/geonho/vocautobot/application/analysis/service/VocLogAnalysisServiceTest.java
git add AI_LOG_ANALYSIS_IMPLEMENTATION.md
git add IMPLEMENTATION_SUMMARY.md

# 커밋 메시지
# [Feature] VOC 입력 시 AI 로그 분석 구현 (#130)
# 
# VOC 생성 시 AI로 관련 로그를 자동 분석하여 예상 원인과 신뢰도 제공
# 
# 구현 내용:
# - VocLogAnalysis DTO: AI 분석 결과 (summary, confidence, causes, recommendation)
# - VocLogAnalysisService: 키워드 추출 → 로그 검색 → AI 분석
# - VocController: createVoc() 메서드에 로그 분석 통합
# - 예외 처리: OpenSearch/LLM 실패 시에도 VOC 생성 정상 처리
# 
# 기술 스택:
# - Spring Boot 3.2.2, Java 17
# - Ollama LLM, OpenSearch
# - Hexagonal Architecture
# 
# 테스트:
# - VocLogAnalysisServiceTest (4개 시나리오)
# 
# Refs #130
# 
# Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## 작업 완료 확인

- ✅ DTO 생성 (VocLogAnalysis, VocResponseWithAnalysis)
- ✅ 서비스 구현 (VocLogAnalysisService)
- ✅ 컨트롤러 통합 (VocController)
- ✅ 테스트 작성 (VocLogAnalysisServiceTest)
- ✅ 문서화 (2개 마크다운 파일)
- ✅ 예외 처리 (로그 없음, 검색 실패, LLM 실패)
- ✅ 로깅 추가 (분석 시작/완료/실패)

## 참고 자료

- Issue: #130
- Branch: `feature/130-ai-analysis`
- Worktree: `/Users/geonho.yeom/workspace/voc-wt-130-ai-analysis`
- 상세 문서: `AI_LOG_ANALYSIS_IMPLEMENTATION.md`

