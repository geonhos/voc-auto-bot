=== PR #65 Review ===

[BE-031] Category Adapter 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1069.151387ms...
Attempt 2 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2537.24215ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2580.1177119999998ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2593.1728930000004ms...
Attempt 5 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Max attempts reached
Error generating content via API. Full report available at: /var/folders/rf/c_jy4wk16056rzdtgzdtw20r0000gn/T/gemini-client-error-generateJson-api-2026-01-25T05-37-53-387Z.json RetryableQuotaError: You have exhausted your capacity on this model. Your quota will reset after 2s.
    at classifyGoogleError (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/utils/googleQuotaErrors.js:133:28)
    at retryWithBackoff (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/utils/retry.js:130:37)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async BaseLlmClient._generateWithRetry (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/baseLlmClient.js:141:20)
    at async BaseLlmClient.generateJson (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/baseLlmClient.js:44:24)
    at async ClassifierStrategy.route (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/routing/strategies/classifierStrategy.js:126:34)
    at async CompositeStrategy.route (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/routing/strategies/compositeStrategy.js:32:34)
    at async ModelRouterService.route (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/routing/modelRouterService.js:43:24)
    at async GeminiClient.processTurn (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/client.js:443:30)
    at async GeminiClient.sendMessageStream (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/client.js:553:20) {
  cause: {
    code: 429,
    message: 'You have exhausted your capacity on this model. Your quota will reset after 2s.',
    details: [ [Object], [Object] ]
  },
  retryDelayMs: 2577.1904339999996
}
[Routing] ClassifierStrategy failed: Error: Failed to generate content: You have exhausted your capacity on this model. Your quota will reset after 2s.
    at BaseLlmClient._generateWithRetry (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/baseLlmClient.js:163:19)
    at async BaseLlmClient.generateJson (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/baseLlmClient.js:44:24)
    at async ClassifierStrategy.route (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/routing/strategies/classifierStrategy.js:126:34)
    at async CompositeStrategy.route (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/routing/strategies/compositeStrategy.js:32:34)
    at async ModelRouterService.route (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/routing/modelRouterService.js:43:24)
    at async GeminiClient.processTurn (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/client.js:443:30)
    at async GeminiClient.sendMessageStream (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/node_modules/@google/gemini-cli-core/dist/src/core/client.js:553:20)
    at async file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/dist/src/nonInteractiveCli.js:192:34
    at async main (file:///opt/homebrew/Cellar/gemini-cli/0.25.0/libexec/lib/node_modules/@google/gemini-cli/dist/src/gemini.js:458:9)
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 220.401977ms...
Attempt 2 failed: You have exhausted your capacity on this model.. Retrying after 10000ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 804.048799ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2532.180889ms...
Attempt 5 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2466.350237ms...
Attempt 6 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2525.633734ms...
## PR 리뷰 요약
카테고리 관리 기능(CRUD)을 추가하는 PR로, 전반적인 Hexagonal Architecture 구조는 잘 따르고 있습니다. 하지만 코드 복사-붙여넣기 과정에서 발생한 것으로 보이는 여러 치명적인 오류가 포함되어 있어 **현재 코드는 컴파일이 불가능한 상태**입니다. 또한, 심각한 성능 저하를 유발할 수 있는 N+1 쿼리 문제와 잠재적 버그가 발견되어 수정이 필요합니다.
---
### 1. 치명적인 오류 (수정 필수)
- **`CategoryJpaEntity.java` & `CategoryJpaRepository.java`**
  - `@Entity`, `@Id`, `@Query` 등 필수 어노테이션 자리에 아래와 같이 유효하지 않은 파일 경로 문자열이 잘못 들어가 있습니다. 이로 인해 애플리케이션이 실행되지 않습니다.
    - 예시: `@docs/design/screens/SC-05-voc-table.html(name = "categories")` -> `@Entity`와 `@Table(name="categories")`로 수정해야 합니다.
    - 예시: `@backend/src/main/java/com/geonho/vocautobot/global/security/JwtTokenProvider.java` -> `@Id`로 수정해야 합니다.
    - 예시: `@frontend/src/providers/QueryProvider.tsx(...)` -> `@Query(...)`로 수정해야 합니다.
### 2. 잠재적 버그 및 성능 문제
- **N+1 쿼리 문제 (성능 저하)**
  - **카테고리 트리 조회:** `CategoryTreeResponse`는 자식 카테고리를 재귀적으로 생성하지만, 레포지토리의 `findCategoryTreeWithChildren` 쿼리는 1단계 자식만 `FETCH JOIN` 합니다. 만약 카테고리 계층이 2단계 이상 깊어지면, 깊이만큼 추가 쿼리가 발생하여 심각한 성능 저하를 유발합니다.
    - **개선 제안:** 재귀 쿼리(Recursive CTE)를 사용하거나, 모든 카테고리를 조회한 후 애플리케이션 메모리에서 트리 구조로 조립하는 로직을 구현하는 것을 권장합니다.
  - **카테고리 목록 조회:** `CategoryResponse`에서 부모 카테고리 이름(`parentName`)을 가져오는 로직 (`category.getParent().getName()`)은 목록 조회 시 각 항목마다 부모를 조회하는 추가 쿼리를 유발할 수 있습니다.
- **의도치 않은 값 변경 버그**
  - `UpdateCategoryRequest.toCommand()` 메서드는 `isActive`나 `sortOrder` 필드가 요청 body에서 누락될 경우, 각각 기본값인 `true`와 `1`로 설정합니다.
  - 이는 사용자가 이름만 수정하려 했을 뿐인데, `false`였던 `isActive` 상태가 `true`로 바뀌는 등 의도치 않은 데이터 변경을 유발할 수 있습니다.
    - **개선 제안:** 업데이트는 명시적으로 값이 제공된 필드에 대해서만 수행하도록 로직을 변경해야 합니다. Application Layer에서 기존 엔티티를 조회하고, 요청된 값만 변경하는 'Dirty Checking' 방식을 활용하는 것이 좋습니다.
### 3. 코드 품질 및 개선 제안
- **명시적인 권한 관리**
  - 컨트롤러 API 설명(`@Operation`)에는 "ADMIN 권한 필요"라고 명시되어 있지만, 코드 상에서는 `@PreAuthorize("hasRole('ADMIN')")` 같은 보안 어노테이션이 누락되어 있습니다. 전역 설정으로 처리되더라도, 코드 가독성과 유지보수를 위해 메서드 레벨에 명시하는 것이 좋습니다.
- **안전한 반환 타입**
  - `CategoryTreeResponse.fromList()`에서 입력 리스트가 `null`일 때 `null`을 반환합니다. `Collections.emptyList()`와 같이 빈 리스트를 반환하면, API 클라이언트 측에서 `NullPointerException`을 예방할 수 있어 더 안전한 코드가 됩니다.
- **삭제 API 응답 처리**
  - `deleteCategory` 메서드는 현재 `void`를 반환하고 `@ResponseStatus(HttpStatus.NO_CONTENT)`를 사용합니다. 이는 RESTful 원칙에 맞지만, 프로젝트의 다른 API들이 모두 `ApiResponse` 래퍼를 사용한다면 일관성을 위해 `ApiResponse.success(null)`과 같이 비어있는 성공 응답을 보내는 것도 고려해볼 수 있습니다.
