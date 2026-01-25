=== PR #58 Review ===

[FE-030] 카테고리 관리 화면 (SC-09) 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1153.7808570000002ms...
Attempt 2 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2707.3290779999998ms...
제공해주신 PR Diff에 대한 코드 리뷰입니다.
**총평:**
React Hook Form과 Zod를 활용한 폼 관리, 커스텀 훅을 통한 비즈니스 로직 분리 등 전반적으로 **코드 품질이 우수하고 아키텍처를 잘 준수**하고 있습니다. 다만, UX와 에러 처리의 재사용성 측면에서 몇 가지 개선이 필요해 보입니다.
### 1. 🛠 코드 품질 및 패턴
*   **Good:** `react-hook-form`과 `zod`를 도입하여 유효성 검사 로직을 선언적으로 깔끔하게 작성했습니다.
*   **Good:** `useCategoryTree`, `useDeleteCategory` 등 데이터 패칭 로직을 커스텀 훅으로 분리하여 관심사를 잘 분리했습니다.
*   **Improvement:** `CategoryForm`에서 `useEffect`를 사용해 폼을 `reset`하는 패턴은 때로 불필요한 렌더링이나 버그를 유발할 수 있습니다. 대신 부모 컴포넌트에서 `CategoryForm` 호출 시 `key` prop을 부여(예: `key={selectedCategory?.id || 'new'}`)하여 선택된 카테고리가 바뀔 때 컴포넌트가 다시 마운트되도록 하는 것이 더 안전하고 React스러운 패턴입니다.
### 2. 🚨 잠재적 버그 및 UX 개선
*   **UX (Alert/Confirm):** `alert`와 `confirm`은 브라우저의 기본 블로킹 UI로, 사용자 경험이 좋지 않습니다. 프로젝트 내의 **Modal**이나 **Toast** UI 컴포넌트로 대체하는 것을 강력히 권장합니다.
*   **Type Assertion:** `register('code' as keyof ...)`와 같은 강제 타입 단언이 보입니다. `Create`와 `Update` 폼의 타입 정의가 달라 발생하는 문제로 보이는데, 타입을 `Discriminated Union`으로 관리하거나 폼 컴포넌트를 분리/추상화하여 타입 안전성을 확보하는 것이 좋습니다.
### 3. ♻️ 유지보수성 (Refactoring)
*   **에러 핸들링 중복:** `CategoriesPage`와 `CategoryForm` 양쪽에서 에러 메시지를 추출하는 로직(`(error as { response... })...`)이 복잡하고 중복됩니다.
    *   **제안:** `getApiErrorMessage(error)`와 같은 유틸리티 함수로 분리하여 가독성을 높이고 중복을 제거하세요.
### 4. 📝 사소한 사항
*   **변수명:** `selectedCategory` 상태 관리가 직관적이나, 폼 제어를 위한 상태(`isEditing`, `showForm` 등)가 많아지고 있습니다. 로직이 더 복잡해진다면 `useReducer`나 별도의 훅으로 폼 상태 관리를 묶는 것을 고려해보세요.
