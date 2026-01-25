=== PR #52 Review ===

[BE-030] Category Domain + Application 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 1s.. Retrying after 1487.365367ms...
Attempt 2 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2597.123028ms...
Attempt 3 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2751.3428169999997ms...
Attempt 4 failed: You have exhausted your capacity on this model. Your quota will reset after 2s.. Retrying after 2630.7530899999997ms...
제공해주신 PR Diff에 대한 리뷰입니다. 전반적으로 헥사고날 아키텍처 구조를 잘 따르고 있으며, Java의 최신 기능(Record)을 적절히 활용하고 있습니다.
### 👍 잘된 점
*   **아키텍처 준수:** `port.in`(UseCase), `port.out`(Port), `usecase`(Service) 패키지 구조가 명확하며 의존성 방향이 올바릅니다.
*   **불변성 및 유효성 검사:** `Record`를 사용하여 DTO의 불변성을 보장하고, `Jakarta Validation` 어노테이션으로 입력값 검증을 간결하게 처리했습니다.
*   **도메인 로직 보호:** `DeleteCategoryService`에서 하위 카테고리 존재 여부, 실제 사용 여부(`checkCategoryUsagePort`)를 검사하여 데이터 무결성을 잘 방어하고 있습니다.
*   **예외 처리:** `BusinessException`을 사용하여 명시적인 에러 처리를 하고 있습니다.
### ⚠️ 잠재적 문제 및 개선점
1.  **N+1 문제 위험 (`CategoryTreeResult`)**:
    *   `CategoryTreeResult.from()` 메서드에서 `category.getChildren()`을 호출하며 재귀적으로 변환하고 있습니다.
    *   JPA 엔티티라면 `children` 컬렉션 조회 시 **N+1 문제**가 발생할 수 있습니다. `LoadCategoryPort` 구현체에서 `JOIN FETCH`나 `@BatchSize` 등을 통해 성능 최적화가 되어 있는지 확인이 필요합니다.
2.  **동시성 이슈 (`CreateCategoryService`)**:
    *   `validateDuplicateCode` 메소드로 중복 체크를 하고 있지만, 요청이 동시에 들어올 경우 **Race Condition**이 발생할 수 있습니다.
    *   DB 컬럼에도 `UNIQUE` 제약 조건이 설정되어 있는지 확인하여 최종적인 데이터 정합성을 보장해야 합니다.
3.  **트랜잭션 범위**:
    *   `CategoryTreeResult` 변환 로직이 서비스 트랜잭션 내부에서 수행되어야 Lazy Loading이 정상 작동합니다. (현재 구조상 서비스 내에서 호출될 것으로 보여 문제는 없으나, 트랜잭션 범위를 벗어나서 변환하지 않도록 주의 필요)
4.  **코드 누락 확인**:
    *   `GetCategoryTreeUseCase` 인터페이스는 정의되었으나, 이를 구현한 **`GetCategoryTreeService`** 클래스가 Diff 목록에 보이지 않습니다. PR에 포함되었는지 확인해주세요.
    *   `GetCategoryService`의 마지막 부분이 잘려 있습니다 (`getChildCategories` 구현부).
### 💡 제안
*   **Entity -> DTO 변환 위치:** 현재 DTO 내부의 static method(`from`)가 도메인 엔티티를 알고 있는 구조입니다. 실용적이지만, 도메인과 DTO의 결합도를 더 낮추려면 별도의 Mapper 클래스를 두는 것도 고려해볼 만합니다.
