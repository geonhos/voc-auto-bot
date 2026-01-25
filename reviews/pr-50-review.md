=== PR #50 Review ===

[BE-020] User Domain + Application 구현

Loaded cached credentials.
제공해주신 PR diff에 대한 코드 리뷰입니다. 전반적으로 헥사고날 아키텍처 구조를 잘 따르고 있으나, **컴파일이 불가능한 치명적인 오류**와 **성능상 심각한 문제**가 발견되었습니다.
### 🚫 1. 치명적 오류 (수정 필수)
*   **잘못된 어노테이션 사용 (`CreateUserCommand`, `UpdateUserCommand`)**
    *   `@frontend/src/types/email.ts`라는 존재하지 않는 어노테이션이 작성되어 있습니다.
    *   **수정:** `jakarta.validation.constraints.Email` 또는 `@Email`로 수정해야 합니다.
    *   ```java
        // 변경 전
        @frontend/src/types/email.ts(message = "...")
        // 변경 후
        @Email(message = "...")
        ```
*   **정규표현식 이스케이프 처리 (`CreateUserCommand`, `ChangePasswordCommand`)**
    *   Java 문자열 내에서 역슬래시(`\`)는 이스케이프가 필요합니다. `\d`는 컴파일 에러를 유발합니다.
    *   **수정:** `\d`로 변경해야 합니다.
    *   ```java
        // 변경 전: "(?=.*\d)"
        // 변경 후: "(?=.*\d)"
        ```
*   **구현 메서드 누락 (`GetUserService`)**
    *   `getUsers` 메서드 내부에서 `matchesSearch(user, query.search())`를 호출하고 있으나, 해당 `private` 메서드의 정의가 파일 내에 없습니다.
### ⚠️ 2. 성능 및 로직 이슈
*   **인메모리 페이징 및 필터링 (`GetUserService`)**
    *   **문제점:** `loadUserPort.loadAll()` 등으로 **전체 데이터**를 DB에서 가져온 후, 애플리케이션 메모리에서 필터링(`stream().filter`)을 수행하고 있습니다. 또한 `UserListQuery`에 `page`, `size`가 있음에도 실제 페이징 처리가 적용되지 않고 리스트 전체를 반환합니다. 데이터가 많아질 경우 **OOM(Out Of Memory)** 발생 위험이 큽니다.
    *   **개선:** 검색 조건(`search`)과 페이징(`page`, `size`)을 `LoadUserPort`로 넘겨 **DB 쿼리 단계(SQL)**에서 처리해야 합니다.
    *   ```java
        // 권장 인터페이스
        Page<User> searchUsers(UserSearchCondition condition, Pageable pageable);
        ```
*   **Enum 변환 안전성 (`CreateUserService`)**
    *   `UserRole.valueOf(command.role())`는 유효하지 않은 문자열이 들어올 경우 `IllegalArgumentException`을 발생시켜 500 에러로 이어질 수 있습니다.
    *   **개선:** 입력값을 검증하거나, 예외를 잡아 커스텀 예외(`BusinessException`)로 변환하여 명시적인 400 Bad Request 응답을 내려야 합니다.
### 💡 3. 코드 품질 및 아키텍처
*   **아키텍처 준수:** `port.in`, `usecase`, `port.out` 패키지 구조를 사용하여 헥사고날 아키텍처의 의존성 규칙을 잘 지키고 있습니다.
*   **비밀번호 정책:** 특수문자 범위를 `[ @$!%*?&]`로 제한하고 있습니다. 사용자가 흔히 쓰는 `#`, `^` 등이 포함되지 않아 불편할 수 있으니 범위를 넓히거나 제한을 푸는 것을 고려해 보세요.
*   **DTO 불변성:** Java `record`를 사용하여 불변성을 보장하고 간결하게 작성한 점은 좋습니다.
### 📋 요약
컴파일 오류(`@Email`, 정규식)를 우선 수정하시고, `GetUserService`의 **조회 로직을 반드시 DB 레벨의 페이징 쿼리로 변경**하시기 바랍니다.
