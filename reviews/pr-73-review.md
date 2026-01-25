=== PR #73 Review ===
feat: implement VOC application layer with hexagonal architecture

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1883.844376ms...
제공해주신 PR diff에 대한 코드 리뷰입니다.

**총평:** 헥사고날 아키텍처(Ports & Adapters) 구조를 잘 준수하고 있으며, Java Record와 Validation을 활용한 DTO 설계가 깔끔합니다. 다만, **컴파일이 불가능한 치명적인 문법 오류**와 일부 로직의 안전성 보완이 필요합니다.

### 🔴 버그 및 수정 필요 (Critical)

1.  **컴파일 오류 (`CreateVocCommand.java`)**
    *   `customerEmail` 필드에 `@Email` 어노테이션 대신 파일 경로가 잘못 삽입되었습니다.
    *   **수정 전:** `@frontend/src/types/email.ts(message = ...)`
    *   **수정 후:** `@Email(message = ...)`

2.  **구현 코드 누락 (`VocService.java`)**
    *   `updateVoc` 메서드의 구현이 `voc.updateInfo(...)` 호출 직후 끊겨 있습니다. 변경 감지(Dirty Checking)를 의도했더라도 명시적 리턴이나 `saveVocPort` 호출 여부를 확인해야 하며, diff 상으로는 코드가 미완성 상태입니다.

### 🟡 개선점 및 제안 (Improvements)

1.  **Ticket ID 생성 전략 (`VocService.java`)**
    *   `createVoc` 메서드에서 Ticket ID 중복을 막기 위해 `while` 루프를 사용 중입니다. ID 충돌이 잦거나 생성기에 문제가 생길 경우 무한 루프 위험이 있습니다.
    *   **제안:** DB의 Unique Constraint를 활용하고 충돌 시 재시도(Retry)하는 방식이나, 충돌 가능성이 희박한 UUID/ULID 사용을 권장합니다.

2.  **예외 처리 구체화**
    *   현재 `IllegalArgumentException`을 범용적으로 사용하고 있습니다.
    *   **제안:** `VocNotFoundException`과 같이 도메인에 특화된 커스텀 예외를 정의하면 상위 레이어(Web/Controller)에서 에러 응답을 더 정교하게 처리할 수 있습니다.

3.  **검색 쿼리 확장성 (`VocListQuery.java`)**
    *   검색 필터 조건이 많아지고 있습니다. 향후 동적 쿼리가 복잡해질 경우를 대비해 QueryDSL 도입이나 Specification 패턴 적용을 고려해볼 만합니다.

### ✅ 좋은 점 (Good Practices)

*   **아키텍처:** In/Out Port의 분리가 명확하고 의존성 방향이 도메인을 향해 잘 설계되었습니다.
*   **DTO 안전성:** `VocListQuery` 생성자에서 페이지 크기(`size`)에 상한(100)을 두고, 정렬 기본값을 설정하여 잘못된 요청을 방어하는 로직이 훌륭합니다.
*   **가독성:** `Record`를 활용하여 데이터 전송 객체를 간결하게 정의했습니다.
