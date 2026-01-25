=== PR #64 Review ===

[BE-011] Auth Adapter (Controller + Security) 구현

Loaded cached credentials.
Attempt 1 failed: You have exhausted your capacity on this model. Your quota will reset after 0s.. Retrying after 494.68470599999995ms...
요청하신 PR Diff에 대한 리뷰입니다. 전반적으로 **헥사고날 아키텍처(Ports and Adapters)** 패턴을 잘 준수하고 있으며, 코드 스타일이 일관됩니다.
### 1. 🚨 잠재적 버그 (Critical)
*   **`LoginRequest.java` 컴파일 에러:**
    *   `@frontend/src/types/email.ts(message = ...)` 부분은 복사/붙여넣기 실수로 보입니다.
    *   **수정:** `jakarta.validation.constraints.Email` 어노테이션인 `@Email(message = ...)`로 수정해야 합니다.
### 2. 아키텍처 준수 및 구조
*   **포트/어댑터 패턴 준수:** `AuthController`(Adapter)가 `LoginUseCase`(Input Port)를 호출하고, `CustomUserDetailsService`가 `LoadUserPort`(Output Port)를 사용하는 구조가 명확하게 분리되어 있습니다.
*   **응답 표준화:** `ApiResponse<T>`를 통해 성공/실패 응답 형식을 통일한 점이 좋습니다.
### 3. 개선점 및 제안
*   **`JwtAuthenticationFilter` 예외 처리:**
    *   `validateToken` 실패 시 단순히 로깅하거나 넘어가고 있는데, 토큰 만료나 잘못된 서명 등의 예외가 발생했을 때 클라이언트에게 명확한 에러 응답(401)을 주기 위해 `AuthenticationEntryPoint`와의 연동을 확인해야 합니다.
*   **`ApiResponse` 메타데이터 분리:**
    *   단건 조회(`success(T data)`) 시에도 `Meta` 객체에 `page`, `size` 등의 null 필드가 포함됩니다. 페이징용 응답(`PageResponse`)과 일반 응답의 메타데이터 구조를 분리하거나, `@JsonInclude(NON_NULL)`이 `Meta` 내부 필드에도 적용되는지 확인이 필요합니다.
*   **하드코딩된 ROLE 접두사:**
    *   `CustomUserDetailsService`에서 `"ROLE_" + user.role()` 처럼 문자열을 직접 결합하고 있습니다. 이를 상수화하거나 도메인 로직 내에서 권한 매핑을 처리하는 것이 유지보수에 유리합니다.
### 4. 코드 품질
*   **가독성:** 롬복(`Lombok`)을 적절히 사용하여 코드가 간결하며, `SecurityUser`를 확장하여 비즈니스 로직에 필요한 `userId`, `displayName`을 시큐리티 컨텍스트에 포함시킨 점은 실용적인 접근입니다.
*   **Swagger 적용:** 컨트롤러에 문서화 어노테이션이 잘 적용되어 있습니다.
