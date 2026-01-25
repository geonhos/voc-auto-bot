=== PR #54 Review ===

[FE-010] 로그인 화면 (SC-01) 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 403.198991ms...
Attempt 2 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2705.2126940000003ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2646.787196ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2613.164182ms...
Attempt 5 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Max attempts reached
Error generating content via API. Full report available at: /var/folders/rf/c_jy4wk16056rzdtgzdtw20r0000gn/T/gemini-client-error-generateJson-api-2026-01-25T05-37-53-239Z.json RetryableQuotaError: You have exhausted your capacity on this model. Your quota will reset after 2s.
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
  retryDelayMs: 2728.113434
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
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 504.43730099999993ms...
Attempt 2 failed: You have exhausted your capacity on this model.. Retrying after 10000ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1101.645854ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2644.553609ms...
## PR 리뷰 요약
전반적으로 로그인 기능 구현을 위한 PR로, Next.js와 react-query, zustand를 사용하는 현대적인 웹 애플리케이션의 좋은 패턴을 따르고 있습니다. 코드 구조가 깔끔하고, 재사용성을 고려한 커스텀 훅 사용이 돋보입니다. 몇 가지 잠재적인 버그와 개선점을 아래에 정리했습니다.
### 코드 품질 및 아키텍처
- **Good:** `react-hook-form`과 `zod`를 이용한 폼 처리 및 유효성 검사는 매우 안정적이고 좋은 방식입니다.
- **Good:** `useLogin`, `useLogout` 등 인증 관련 로직을 커스텀 훅으로 분리하여 컴포넌트의 책임을 명확히 분리한 점이 좋습니다.
- **Good:** `zustand` (전역 상태)와 `react-query` (서버 상태)의 조합은 효율적이고 확장성이 좋습니다.
- **Good:** `aria-*` 속성을 사용하여 웹 접근성을 신경 쓴 점이 긍정적입니다.
### 잠재적 버그 및 위험
- **Critical:** 모든 파일에서 `import` 경로 앞에 공백이 있습니다 (예: `' @/hooks/useAuth'`). 이는 모듈을 찾지 못해 애플리케이션이 동작하지 않으므로, `'@/hooks/useAuth'` 와 같이 반드시 수정해야 합니다.
- **Duplication:** 로그인 성공 시 리다이렉션 로직(`useLogin` 훅)과 이미 로그인된 사용자를 리다이렉션하는 로직(`login/page.tsx`)이 중복됩니다. 사용자 역할에 따른 경로를 반환하는 유틸리티 함수(예: `getRedirectPathByRole`)를 만들어 하나로 관리하는 것이 유지보수에 유리합니다.
- **Fragile:** `LoginForm.tsx`에서 API 에러 메시지를 파싱하는 코드가 복잡하고, API 응답 구조가 변경될 경우 쉽게 깨질 수 있습니다. API 에러 타입을 정의하고 옵셔널 체이닝(`?.`)을 사용하여 더 안전하게 접근하는 것을 권장합니다.
- **Bug:** `LoginForm.tsx`의 "비밀번호를 잊으셨나요?" 링크가 `<a>` 태그로 되어 있습니다. 내부 페이지 이동이므로 Next.js의 `<Link>` 컴포넌트를 사용해야 불필요한 페이지 새로고침을 막고 클라이언트 사이드 라우팅의 이점을 살릴 수 있습니다.
### 개선 제안
- **Constants:** `/dashboard`, `/voc/kanban` 같은 URL 경로들을 별도의 상수 파일로 분리하면 매직 스트링을 제거하고 관리를 용이하게 할 수 있습니다.
- **Error Handling:** `axios` 인터셉터 등을 사용하여 API 에러 응답의 구조를 정규화하면 애플리케이션 전반에서 에러를 더욱 일관되게 처리할 수 있습니다.
