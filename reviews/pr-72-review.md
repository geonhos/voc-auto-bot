=== PR #72 Review ===
FE-040: VOC 입력 화면 (SC-02) 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 745.330633ms...
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1283.998918ms...
제공해주신 PR diff에 대한 코드 리뷰입니다.

### 📋 종합 평가
전반적으로 **Next.js App Router**와 **React Hook Form**을 활용한 깔끔하고 모듈화된 구현입니다. 특히 MVVM 패턴을 도입하여 비즈니스 로직(`useVocFormViewModel`)과 UI를 분리하려는 시도가 돋보입니다. 몇 가지 타입 안전성과 재사용성 측면에서 보완하면 완성도가 더욱 높아질 것입니다.

### ✅ 주요 장점
1.  **아키텍처 준수**: `VocForm`에서 `useVocFormViewModel`을 사용하여 View와 Logic을 분리, 유지보수성을 높였습니다.
2.  **컴포넌트 모듈화**: `CategorySelect`, `FileUpload` 등 복잡한 UI 로직을 별도 컴포넌트로 잘 분리했습니다.
3.  **UX 고려**: 파일 업로드 시 미리보기, 용량 계산, 카테고리 계층 선택(대분류→중분류) 등 사용자 경험을 고려한 디테일이 좋습니다.

### 🛠 개선이 필요한 점

#### 1. Code Quality & Typing
*   **`frontend/src/components/voc/VocForm.tsx`**
    *   **`error as any` 지양**: `{(error as any)?.response?....}` 형태의 타입 단언은 런타임 에러의 원인이 될 수 있습니다. API 에러 응답 타입을 정의하고 Type Guard를 사용하거나, 제네릭을 활용해 타입을 명확히 하는 것이 좋습니다.
*   **`frontend/src/components/voc/FileUpload.tsx`**
    *   **유틸리티 분리**: `formatFileSize` 함수는 `lib/utils.ts` 등으로 이동시켜 다른 컴포넌트에서도 재사용할 수 있도록 리팩토링을 권장합니다.

#### 2. Potential Bugs & Logic
*   **`frontend/src/components/voc/CategorySelect.tsx`**
    *   **API 로딩/에러 처리**: `useCategories` 훅의 `isLoading` 상태만 처리되어 있습니다. API 호출 실패 시(`isError`)에 대한 UI 처리(예: 재시도 버튼 또는 에러 메시지)가 필요합니다.
    *   **기본값 처리**: `setValue('categoryId', null)`로 초기화하고 있습니다. 폼 검증 스키마(Zod 등)에서 `null`을 허용하는지, 아니면 `undefined`여야 하는지 확인이 필요합니다.

#### 3. Performance & Best Practices
*   **`frontend/src/components/voc/FileUpload.tsx`**
    *   **메모리 관리**: 현재는 파일 객체만 저장하지만, 만약 이미지 미리보기(썸네일) 기능이 추가된다면 `URL.createObjectURL` 사용 후 `useEffect`에서 `revokeObjectURL`로 메모리 해제를 해줘야 합니다. (현재 코드는 파일명만 보여주므로 당장은 문제없음)
*   **`frontend/src/components/voc/VocForm.tsx`**
    *   **접근성(A11y)**: 입력 필드들의 `aria-invalid` 처리는 잘 되어 있습니다. 다만 `CategorySelect` 내부의 `select` 태그들에도 적절한 `aria-label`이나 `aria-describedby`가 연결되었는지 확인해보면 좋습니다.

### 💡 제안 사항
> `FileUpload` 컴포넌트에서 `acceptedTypes`를 props로 받고 있지만, 실제 `validate` 로직(파일 확장자/MIME 타입 검사)은 `input` 태그의 `accept` 속성에만 의존하고 있습니다. 보안을 위해 `handleFileChange` 내부에서도 파일 타입을 한 번 더 검증하는 로직 추가를 권장합니다.
