=== PR #63 Review ===

[BE-040] VOC Domain 엔티티 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 873.116243ms...
Attempt 2 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2578.6656190000003ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2634.525388ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2666.851052ms...
Attempt 5 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Max attempts reached
Error generating content via API. Full report available at: /var/folders/rf/c_jy4wk16056rzdtgzdtw20r0000gn/T/gemini-client-error-generateJson-api-2026-01-25T05-37-53-432Z.json RetryableQuotaError: You have exhausted your capacity on this model. Your quota will reset after 2s.
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
  retryDelayMs: 2555.250577
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
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 237.781876ms...
Attempt 2 failed: You have exhausted your capacity on this model.. Retrying after 10000ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1003.959195ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2568.607177ms...
Attempt 5 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2614.019794ms...
## PR 리뷰 요약
전반적으로 `Voc` 도메인 모델과 관련 엔티티들이 잘 설계되었습니다. 특히 도메인 로직을 엔티티 내에 포함시킨 점과 상태 전이 로직을 `Enum`으로 관리하는 점이 훌륭합니다. 다만, 코드에 포함된 유효하지 않은 어노테이션들은 즉시 수정이 필요한 심각한 문제입니다.
### 주요 이슈 (수정 필요)
*   **유효하지 않은 어노테이션:** `Voc.java`, `VocAttachment.java`, `VocMemo.java` 파일에 `@backend/...`, `@docs/...`, `@frontend/...` 와 같이 잘못된 어노테이션이 포함되어 있습니다. 이는 파일 경로가 잘못 삽입된 것으로 보이며, 컴파일 오류를 유발하므로 반드시 제거해야 합니다.
### 긍정적인 점
*   **도메인 로직 캡슐화:** `Voc` 엔티티 내에 `updateStatus`, `assign` 등 비즈니스 로직을 포함하여 객체의 응집도를 높였습니다.
*   **상태 전이 관리:** `VocStatus` Enum 내에 `canTransitionTo` 메소드를 두어 상태 변경 규칙을 명확하고 안전하게 관리하고 있습니다.
*   **데이터베이스 인덱싱:** `@Table` 어노테이션에 `indexes`를 명시하여 주요 조회 컬럼에 대한 성능을 고려했습니다.
### 개선 제안
*   **연관관계 매핑:** `Voc` 엔티티에서 `assigneeId`, `categoryId`를 `Long` 타입으로 직접 가지고 있습니다. 이는 모듈 간 결합도를 낮추는 장점이 있지만, `User` 및 `Category` 엔티티와 `@ManyToOne` 연관관계를 직접 맺으면 타입 안정성, 객체지향적 탐색, 데이터 무결성 측면에서 더 유리할 수 있습니다. 장기적으로 리팩토링을 고려해볼 만합니다.
*   **연관관계 편의 메소드:** `VocAttachment`, `VocMemo`의 `setVoc` 메소드의 접근 제어자를 `package-private` 이나 `protected`로 변경하여, `Voc` 엔티티의 `add/remove` 메소드를 통해서만 연관관계가 설정되도록 강제하는 것을 권장합니다.
*   **필드 네이밍:** `VocMemo`의 `internal` 필드는 boolean 타입이므로, `@Column(name = "is_internal")` 어노테이션을 사용하고 필드명은 `internal`로 지정하는 것이 더 일반적인 Java 네이밍 컨벤션에 부합합니다.
