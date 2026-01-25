=== PR #74 Review ===
feat: AI Adapter (LLM - Ollama) 구현

Loaded cached credentials.
제공해주신 PR diff에 대한 리뷰입니다. 전반적으로 헥사고날 아키텍처 구조를 잘 따르고 있으나, 테스트 코드의 문법 오류와 JSON 파싱의 견고성 등 몇 가지 수정이 필요합니다.

### 1. 🚨 버그 및 수정 필요 (Critical)
- **테스트 코드 컴파일 오류**: `OllamaAdapterTest.java` 파일 내 `@Test` 어노테이션 위치에 파일 경로(`@backend/voc-application/...`)가 잘못 삽입되어 있습니다. 이는 명백한 Copy & Paste 실수로 보이며 컴파일되지 않으므로 수정이 필요합니다.
- **JSON 파싱 로직 취약성**: `OllamaAdapter.parseAnalysisResponse`에서 `replaceAll`로 마크다운 코드 블록을 제거하는 방식은 LLM이 서문(preamble)을 붙이거나 형식을 조금만 바꿔도 파싱 에러(`JsonParseException`)를 유발합니다.
  - **개선**: 응답 문자열에서 첫 번째 `{`와 마지막 `}` 인덱스를 찾아 `substring`으로 JSON 부분만 추출하는 방식이 훨씬 안전합니다.

### 2. 🏗 아키텍처 및 디자인 (Architecture & Design)
- **구조 준수**: `LlmPort` 인터페이스 구현, `Config` 분리, `PromptTemplate` 분리는 역할과 책임이 잘 분리된 좋은 구조입니다.
- **WebClient vs RestClient**: `WebClient`를 사용하고 바로 `.block()`을 호출하여 동기식으로 처리 중입니다.
  - 프로젝트가 Spring WebFlux 기반이 아니라면, 불필요한 WebFlux 의존성을 제거하고 Spring Boot 3.2+의 `RestClient`를 사용하는 것이 더 가볍고 모던한 방식입니다.
- **예외 처리 추상화**: 단순 `RuntimeException` 대신 `LlmIntegrationException` 등 구체적인 커스텀 예외를 정의하여 던지면 상위 레이어에서 에러 원인(네트워크 vs 파싱 등)에 따라 적절히 대응하기 좋습니다.

### 3. 💡 개선 제안 (Suggestions)
- **프롬프트 관리**: 현재 `PromptTemplate`에 프롬프트가 하드코딩되어 있습니다. 프롬프트 튜닝이 빈번할 수 있으므로, 이를 외부 설정 파일(yml)이나 별도 리소스로 분리하는 것을 고려해보세요.
- **로깅 강화**: `parseAnalysisResponse` 실패 시 원본 `llmResponse` 전체를 로그에 남기도록 되어 있는데, 민감 정보가 포함될 수 있으므로 주의가 필요하며(현재는 괜찮아 보임), 파싱 실패 원인을 명확히 알 수 있도록 로그 레벨을 조정하는 것이 좋습니다.

### 4. 기타 확인
- `AnalyzeVocUseCase.java`는 파일 생성만 되고 내용이 비어있는 것으로 보입니다. 구현이 누락된 것인지 확인해주세요.
