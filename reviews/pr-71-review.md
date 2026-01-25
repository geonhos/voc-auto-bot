=== PR #71 Review ===
feat: VOC table view with filtering and pagination (FE-043)

Loaded cached credentials.
요청하신 PR 변경사항(`frontend/src/app/(main)/voc/table/page.tsx` 외 4건)에 대한 리뷰입니다.

### **종합 의견**
전반적으로 **Next.js App Router (Client Component)** 구조를 잘 따르고 있으며, 컴포넌트의 책임 분리(페이지, 필터, 테이블, 배지)가 깔끔하게 이루어졌습니다. **ViewModel 패턴**을 도입하여 비즈니스 로직을 분리한 점이 훌륭합니다.

### **1. 코드 품질 및 아키텍처**
*   **ViewModel 패턴 적용:** `page.tsx` 내 `useVocTableViewModel` 훅을 통해 상태 관리와 UI 렌더링을 분리한 점은 유지보수성과 테스트 용이성 측면에서 매우 좋은 설계입니다.
*   **타입 안정성:** `VocListParams`, `VocFilterState` 등 타입을 명확히 정의하고 사용하여 안정성을 확보했습니다.
*   **컴포넌트 모듈화:** `VocPriorityBadge`, `VocStatusBadge` 등 재사용 가능한 UI 요소를 작은 컴포넌트로 잘 분리했습니다. `cn` 유틸리티를 활용한 클래스 병합도 적절합니다.

### **2. 개선점 및 제안 (Refactoring & Improvements)**
*   **중복 로직 제거 (`VocSearchFilter.tsx`):**
    *   `handleStatusChange`와 `handlePriorityChange`의 로직이 배열을 토글한다는 점에서 완전히 동일합니다. 이를 제네릭 핸들러 함수 하나로 통합하여 코드를 줄일 수 있습니다.
*   **날짜 포맷팅 함수 분리 (`VocTable.tsx`):**
    *   `formatDate`, `formatDateTime` 함수가 컴포넌트 내부에 선언되어 있습니다. 일관된 날짜 표기를 위해 `lib/utils.ts` 또는 별도의 `dateUtils`로 분리하여 전역에서 재사용하는 것을 권장합니다.
*   **Fallback 처리 방식 (`page.tsx`):**
    *   `vocs` 데이터가 없을 때 렌더링 시점에 거대한 더미 객체(`content: [], page: 0...`)를 넘기는 대신, `VocTable` 내부에서 `vocs`가 없으면 얼리 리턴(Early Return)하거나 상위에서 조건부 렌더링을 하는 것이 더 깔끔합니다.

### **3. 잠재적 버그 및 UX**
*   **필터링 UX/성능:** `VocSearchFilter`에서 체크박스 클릭 시마다 즉시 `onFilterChange`가 호출되어 API 요청이 발생할 것으로 보입니다. 사용자가 여러 필터를 빠르게 선택할 경우 불필요한 요청이 발생할 수 있으므로, **Debounce** 처리를 하거나 '적용' 버튼을 두는 방식을 고려해 볼 만합니다.
*   **Form Submit 기본 동작:** `VocSearchFilter`의 검색 폼에서 `e.preventDefault()`는 잘 처리되어 있으나, 엔터 키 입력 시 동작이 명시적인지 확인이 필요합니다.

### **4. 기타**
*   **하드코딩된 문자열:** "접수", "처리중" 등의 라벨이 코드 내에 하드코딩되어 있습니다. 추후 확장성을 위해 상수 파일(`constants/voc.ts`)로 관리하거나 i18n 도입을 고려하면 좋습니다.
