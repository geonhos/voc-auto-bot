=== PR #75 Review ===
[BE-042] VOC Persistence Adapter 구현

### 종합 평가: 8.5/10

클린 아키텍처(Hexagonal Architecture)를 잘 준수하며, JPA Entity 설계, QueryDSL Specification, Domain-Entity 매핑이 체계적으로 구현되었습니다.

### 1. 클린 아키텍처 준수 ✅
- **포트 계층 분리**: `LoadVocPort`, `SaveVocPort` 인터페이스를 통해 도메인과 영속성 계층 완벽 분리
- **어댑터 패턴 적용**: `VocPersistenceAdapter`가 두 포트를 구현하여 비즈니스 로직과 DB 접근 격리
- **의존성 역전 원칙**: 고수준 모듈(도메인)이 추상화(포트)에 의존

### 2. JPA Entity 설계 ✅
- **인덱스 전략 우수**: ticket_id(UNIQUE), status, category_id, assignee_id, created_at
- **연관관계 설계**: `@OneToMany` 양방향, cascade + orphanRemoval 생명주기 관리
- **LAZY 로딩**: N+1 문제 예방

### 3. QueryDSL Specification 구현 ✅
- **JpaSpecificationExecutor 활용**: 동적 쿼리 지원
- **다양한 필터**: 상태, 우선순위, 카테고리, 담당자, 검색어
- **NULL 안전성**: 부분 검색 가능

### 4. Domain-Entity 매핑 ✅
- **양방향 매핑**: `VocPersistenceMapper`로 Domain ↔ JPA Entity 변환
- **Builder 패턴**: 가독성 좋은 객체 생성

### 5. TicketIdGeneratorAdapter ✅
- **포맷**: `VOC-YYYYMMDD-XXXXX`
- **중복 방지**: while 루프로 기존 ID 체크

### 개선 제안
1. 도메인 `Voc` 클래스에서 JPA 어노테이션 제거 권장 (순수 도메인 모델 유지)
2. `IllegalArgumentException` 대신 도메인 정의 예외(`VocNotFoundException`) 사용
3. Specification 빌더 패턴으로 조합 가능성 개선

**결론: Approve**
