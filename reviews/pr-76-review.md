=== PR #76 Review ===
[BE-046] Vector Search Adapter (pgvector) 구현

### 종합 평가: 8/10

pgvector를 활용한 벡터 유사도 검색 기능이 잘 구현되었습니다. Hexagonal Architecture 준수, 재시도 전략, HNSW 인덱스 최적화가 우수합니다.

### 1. pgvector 통합 ✅
- **코사인 유사도**: `<=>` 연산자로 효율적 거리 계산
- **768차원 벡터**: Ollama nomic-embed-text 모델과 일치
- **HNSW 인덱스**: 대규모 데이터셋에서 빠른 검색

### 2. Embedding 생성 로직 ✅
- **Retry 메커니즘**: backoff strategy + 타임아웃 설정
- **에러 처리**: 구체적인 `LlmIntegrationException` 타입 정의
- **비동기 처리**: WebClient + Mono Non-blocking I/O

### 3. 유사도 검색 구현 ✅
- **세 가지 검색 방식**: VOC ID 기반, 임계값 적용, 텍스트 직접 검색
- **거리-점수 변환**: `1 - distance` 정확한 계산
- **기본 임계값**: 0.7 (조정 가능)

### 4. Port/Adapter 분리 ✅
- **명확한 레이어 분리**: VectorSearchPort → VectorSearchAdapter → Repository
- **DIP 준수**: 나중에 다른 벡터 DB(Pinecone 등)로 교체 용이

### 개선 제안
1. **배치 임베딩 최적화**: 현재 N개 텍스트에 N번 API 호출 → 단일 배치 요청으로 개선
2. **임베딩 차원 검증**: 768차원 불일치 시 명시적 에러 처리
3. **통합 테스트 추가**: Testcontainers로 PostgreSQL + pgvector 테스트
4. **캐싱 검토**: 동일 텍스트 반복 임베딩 방지

**결론: Approve (배치 최적화 및 통합 테스트 추가 권장)**
