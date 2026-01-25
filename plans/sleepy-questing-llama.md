# VOC Auto Bot - 개발 실행 계획

## 개요

Backend(Spring Boot)와 Frontend(Next.js) 프로젝트를 클린 아키텍처로 구현합니다.
**기능 단위로 이슈를 분류**하고, **의존성 없는 태스크는 병렬로 개발**합니다.

### 참조 문서
- `docs/design/domain-model.md` - 13개 Entity 정의
- `docs/design/api-specification.md` - 44개 API 엔드포인트
- `docs/api/openapi.yaml` - OpenAPI 3.0 스펙
- `docs/design/screens/` - 11개 화면 설계서

### 개발 규칙 (별도 문서 관리)
> **중요**: 개발 규칙은 이 플랜 문서와 별도로 `docs/rules/project-rules.md`에서 관리합니다.
>
> 포함 내용:
> - 테스트 커버리지 기준 (Backend 80%, Frontend 70%)
> - Git 워크플로우 (Git Flow, Conventional Commits)
> - CI/CD 파이프라인 설정 (GitHub Actions)
> - 코드 리뷰 체크리스트
> - Pre-commit Hooks
>
> 모든 개발자는 코드 작성 전 해당 문서를 필수로 참조해야 합니다.

---

## Phase 0: 프로젝트 초기 설정

### Task 0.1: 프로젝트 룰 문서 생성
- **파일**: `docs/rules/project-rules.md`
- **내용**: 테스트 커버리지, Git 워크플로우, CI/CD, 코드 리뷰 규칙
- **의존성**: 없음

### Task 0.2: .gitignore 생성
- **파일**: `.gitignore`
- **의존성**: 없음

### Task 0.3: 기존 backend 폴더 정리
- 기존 `backend/` 폴더 삭제 후 클린 아키텍처로 재구성
- **의존성**: 없음

---

## Phase 1: 인프라 이슈 (병렬 가능)

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  INFRA: Docker  │  │  BE: 멀티모듈   │  │  FE: 프로젝트   │
│  환경 구성      │  │  프로젝트 설정  │  │  초기 설정      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  INFRA: DB      │  │  BE: 공통 모듈  │  │  FE: API Client │
│  Migration      │  │  (Exception 등) │  │  + 타입 정의    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### INFRA-001: Docker 개발 환경 구성
```yaml
branch: feature/infra-001-docker
작업:
  - docker-compose.yml
  - PostgreSQL + pgvector
  - Redis (캐시/세션)
  - OpenSearch (로그 검색)
  - Ollama (LLM)
의존성: 없음 (병렬 가능)
```

### INFRA-002: DB Migration 설정
```yaml
branch: feature/infra-002-db-migration
작업:
  - Flyway 설정
  - V1__init_schema.sql
  - V2__enable_pgvector.sql
  - V3__seed_data.sql
의존성: INFRA-001
```

### BE-001: Backend 멀티모듈 프로젝트 설정
```yaml
branch: feature/be-001-multimodule-setup
작업:
  - settings.gradle (멀티모듈 정의)
  - 루트 build.gradle
  - voc-domain/build.gradle
  - voc-application/build.gradle
  - voc-adapter/build.gradle
  - voc-bootstrap/build.gradle
  - application.yml (프로필별)
의존성: 없음 (병렬 가능)
```

### BE-002: Backend 공통 모듈 (global)
```yaml
branch: feature/be-002-global-common
작업:
  - global/common: ApiResponse, PageResponse, BaseEntity
  - global/exception: ErrorCode, BusinessException, GlobalExceptionHandler
  - global/security: JwtTokenProvider, JwtAuthenticationFilter
  - global/config: SecurityConfig, JpaConfig, AsyncConfig
  - global/config: SwaggerConfig (SpringDoc - API 문서 자동화)
의존성: BE-001
```

### FE-001: Frontend 프로젝트 초기 설정
```yaml
branch: feature/fe-001-project-setup
작업:
  - Next.js 14 프로젝트 생성
  - TypeScript, Tailwind CSS, ESLint 설정
  - shadcn/ui 초기화
  - 디렉토리 구조 생성
의존성: 없음 (병렬 가능)
```

### FE-002: Frontend API Client + 타입 정의
```yaml
branch: feature/fe-002-api-types
작업:
  - lib/api/client.ts (Axios 설정)
  - types/*.ts (OpenAPI 기반 타입)
  - store/authStore.ts
  - providers/QueryProvider.tsx
  - mocks/handlers.ts (MSW - BE 없이 FE 개발 가능)
  - mocks/browser.ts, mocks/server.ts
의존성: FE-001
```

---

## Phase 2: 도메인별 이슈 (병렬 가능)

### 인증 도메인

#### BE-010: Auth Domain + Application
```yaml
branch: feature/be-010-auth-domain
작업:
  - domain/auth: (순수 도메인 로직)
  - application/auth/usecase: LoginUseCase, LogoutUseCase, RefreshTokenUseCase
  - application/auth/port: AuthPort interfaces
의존성: BE-002
```

#### BE-011: Auth Adapter (Controller + Security)
```yaml
branch: feature/be-011-auth-adapter
작업:
  - adapter/in/web/AuthController
  - adapter/in/web/dto: LoginRequest, LoginResponse
  - CustomUserDetailsService
의존성: BE-010
```

#### FE-010: 로그인 화면 (SC-01)
```yaml
branch: feature/fe-010-login
작업:
  - app/(auth)/login/page.tsx
  - components/auth/LoginForm.tsx
  - hooks/useAuth.ts
의존성: FE-002
```

---

### 사용자 도메인

#### BE-020: User Domain + Application
```yaml
branch: feature/be-020-user-domain
작업:
  - domain/user: User, UserRole, UserRepository (Port)
  - application/user/usecase: CreateUserUseCase, UpdateUserUseCase
  - application/user/port: in/out interfaces
의존성: BE-002
```

#### BE-021: User Adapter
```yaml
branch: feature/be-021-user-adapter
작업:
  - adapter/in/web/UserController
  - adapter/out/persistence: UserJpaEntity, UserJpaRepository, UserPersistenceAdapter
의존성: BE-020
```

#### FE-020: 사용자 관리 화면 (SC-10)
```yaml
branch: feature/fe-020-user-management
작업:
  - app/(main)/admin/users/page.tsx
  - components/user/UserTable.tsx
  - components/user/UserForm.tsx
  - hooks/useUsers.ts
의존성: FE-002
```

---

### 카테고리 도메인

#### BE-030: Category Domain + Application
```yaml
branch: feature/be-030-category-domain
작업:
  - domain/category: Category (self-reference 계층), CategoryRepository
  - application/category/usecase: CreateCategoryUseCase, GetCategoryTreeUseCase
의존성: BE-002
```

#### BE-031: Category Adapter
```yaml
branch: feature/be-031-category-adapter
작업:
  - adapter/in/web/CategoryController
  - adapter/out/persistence: CategoryJpaEntity, CategoryPersistenceAdapter
의존성: BE-030
```

#### FE-030: 카테고리 관리 화면 (SC-09)
```yaml
branch: feature/fe-030-category-management
작업:
  - app/(main)/admin/categories/page.tsx
  - components/category/CategoryTree.tsx
  - components/category/CategoryForm.tsx
  - hooks/useCategories.ts
의존성: FE-002
```

---

### VOC 핵심 도메인

#### BE-040: VOC Domain
```yaml
branch: feature/be-040-voc-domain
작업:
  - domain/voc: Voc, VocStatus, VocPriority, VocAttachment, VocMemo
  - domain/voc: VocRepository (Port), TicketIdGenerator
  - domain/voc/event: VocCreatedEvent, VocStatusChangedEvent
의존성: BE-002
```

#### BE-041: VOC Application (UseCase)
```yaml
branch: feature/be-041-voc-usecase
작업:
  - application/voc/usecase: CreateVocUseCase, UpdateVocUseCase, ChangeVocStatusUseCase
  - application/voc/usecase: AssignVocUseCase, GetVocListUseCase
  - application/voc/port: in/out interfaces
  - application/voc/event: VocEventHandler
의존성: BE-040
```

#### BE-042: VOC Adapter (Persistence)
```yaml
branch: feature/be-042-voc-persistence
작업:
  - adapter/out/persistence/voc: VocJpaEntity, VocJpaRepository
  - adapter/out/persistence/voc: VocPersistenceAdapter, VocPersistenceMapper
  - QueryDSL 동적 검색 구현
의존성: BE-041
```

#### BE-043: VOC Adapter (Controller)
```yaml
branch: feature/be-043-voc-controller
작업:
  - adapter/in/web/VocController
  - adapter/in/web/VocPublicController (상태 조회 - 인증 불필요)
  - adapter/in/web/dto: VocRequest, VocResponse, VocListResponse
의존성: BE-042
```

#### FE-040: VOC 입력 화면 (SC-02)
```yaml
branch: feature/fe-040-voc-input
작업:
  - app/(main)/voc/input/page.tsx
  - components/voc/VocForm.tsx
  - components/voc/VocSuccessModal.tsx
  - hooks/useVocMutation.ts
의존성: FE-030 (카테고리 선택 필요)
```

#### FE-041: VOC 상태 조회 화면 (SC-03)
```yaml
branch: feature/fe-041-voc-status
작업:
  - app/(main)/voc/status/page.tsx
  - components/voc/VocStatusLookup.tsx
의존성: FE-002
```

#### FE-042: VOC 칸반 보드 (SC-04)
```yaml
branch: feature/fe-042-voc-kanban
작업:
  - app/(main)/voc/kanban/page.tsx
  - components/voc/VocKanbanBoard.tsx
  - components/voc/VocKanbanColumn.tsx
  - components/voc/VocCard.tsx
  - hooks/useVocs.ts
의존성: FE-002
```

#### FE-043: VOC 테이블 뷰 (SC-05)
```yaml
branch: feature/fe-043-voc-table
작업:
  - app/(main)/voc/table/page.tsx
  - components/voc/VocTable.tsx
  - components/voc/VocSearchFilter.tsx
의존성: FE-042 (공통 hooks 재사용)
```

#### FE-044: VOC 상세 화면 (SC-06)
```yaml
branch: feature/fe-044-voc-detail
작업:
  - app/(main)/voc/[id]/page.tsx
  - components/voc/VocDetail.tsx
  - components/voc/VocMemoList.tsx
  - components/voc/VocStatusHistory.tsx
  - components/voc/VocAnalysisPanel.tsx
의존성: FE-002
```

#### FE-045: 유사 VOC 팝업 (SC-07)
```yaml
branch: feature/fe-045-similar-voc
작업:
  - app/(main)/voc/[id]/similar/page.tsx
  - components/voc/SimilarVocList.tsx
  - components/voc/SimilarVocCard.tsx
의존성: FE-044
```

---

### AI/검색 도메인 (Gemini 피드백 반영)

#### BE-044: AI Adapter (LLM - Ollama)
```yaml
branch: feature/be-044-ai-adapter
작업:
  - adapter/out/ai/OllamaAdapter.java
  - adapter/out/ai/LlmPort.java (interface)
  - application/analysis/usecase: AnalyzeVocUseCase
  - LangChain4j 또는 HTTP Client 연동
의존성: BE-041
```

#### BE-045: Log Analysis Adapter (OpenSearch)
```yaml
branch: feature/be-045-log-adapter
작업:
  - adapter/out/search/OpenSearchAdapter.java
  - adapter/out/search/LogSearchPort.java (interface)
  - ELK/OpenSearch 쿼리 구현
의존성: BE-002, INFRA-001
```

#### BE-046: Vector Search Adapter (pgvector)
```yaml
branch: feature/be-046-vector-adapter
작업:
  - adapter/out/persistence/VectorSearchAdapter.java
  - pgvector 기반 유사도 검색
  - 임베딩 생성 및 저장 로직
의존성: BE-044, INFRA-002
```

---

### 이메일 도메인

#### BE-050: Email Domain + Application
```yaml
branch: feature/be-050-email-domain
작업:
  - domain/email: EmailTemplate, EmailLog, EmailStatus
  - application/email/usecase: SendEmailUseCase, GetTemplateUseCase
  - application/email/port: EmailPort
의존성: BE-002
```

#### BE-051: Email Adapter
```yaml
branch: feature/be-051-email-adapter
작업:
  - adapter/in/web/EmailController, EmailTemplateController
  - adapter/out/email/SmtpEmailAdapter
  - adapter/out/persistence/email: EmailTemplateJpaEntity
의존성: BE-050
```

#### FE-050: 이메일 발송 화면 (SC-08)
```yaml
branch: feature/fe-050-email
작업:
  - app/(main)/email/page.tsx
  - components/email/EmailTemplateList.tsx
  - components/email/EmailComposer.tsx
  - hooks/useEmailTemplates.ts
의존성: FE-002
```

---

### 통계/대시보드 도메인

#### BE-060: Statistics Application
```yaml
branch: feature/be-060-statistics
작업:
  - application/statistics/usecase: GetKpiUseCase, GetTrendUseCase
  - adapter/in/web/StatisticsController
  - 통계 쿼리 구현
의존성: BE-043 (VOC 데이터 필요)
```

#### FE-060: 대시보드 화면 (SC-11)
```yaml
branch: feature/fe-060-dashboard
작업:
  - app/(main)/dashboard/page.tsx
  - components/dashboard/KpiCard.tsx
  - components/dashboard/TrendChart.tsx
  - components/dashboard/CategoryChart.tsx
  - hooks/useStatistics.ts
의존성: FE-002
```

---

## 의존성 그래프

```
Phase 0 (병렬)
├── Task 0.1: 프로젝트 룰 문서
├── Task 0.2: .gitignore
└── Task 0.3: 기존 backend 정리

Phase 1 - 인프라/설정 (병렬)
INFRA-001 ─┬─→ INFRA-002
           │
BE-001 → BE-002                 FE-001 → FE-002
    ↓                               ↓
Phase 2 (도메인별 병렬)

┌────────────────────────────────────────────────────────────┐
│  BE-010 → BE-011          FE-010 (로그인)                  │
│  (Auth)                                                     │
├────────────────────────────────────────────────────────────┤
│  BE-020 → BE-021          FE-020 (사용자 관리)             │
│  (User)                                                     │
├────────────────────────────────────────────────────────────┤
│  BE-030 → BE-031          FE-030 (카테고리 관리)           │
│  (Category)                                                 │
├────────────────────────────────────────────────────────────┤
│  BE-040 → BE-041 → BE-042 → BE-043                         │
│  (VOC Domain)     ↓                                         │
│               BE-044 (AI) → BE-046 (Vector)                │
│                    ↓                                        │
│               BE-045 (Log Search)                          │
│                           FE-040 (VOC 입력) ← FE-030 필요   │
│                           FE-041 (VOC 상태)                 │
│                           FE-042 (VOC 칸반)                 │
│                           FE-043 (VOC 테이블) ← FE-042 필요 │
│                           FE-044 (VOC 상세) → FE-045 (유사) │
├────────────────────────────────────────────────────────────┤
│  BE-050 → BE-051          FE-050 (이메일)                  │
│  (Email)                                                    │
├────────────────────────────────────────────────────────────┤
│  BE-060 ← BE-043 필요     FE-060 (대시보드)                │
│  (Statistics)                                               │
└────────────────────────────────────────────────────────────┘
```

---

## Orchestrator 실행 전략

### Round 0 (선행 - 필수)
- **Task 0.3: 기존 backend 폴더 정리** (BE-001 충돌 방지)

### Round 1 (병렬 5개)
- Task 0.1: 프로젝트 룰 문서 (`docs/rules/project-rules.md`)
- Task 0.2: .gitignore
- INFRA-001: Docker 환경
- BE-001: Backend 멀티모듈 설정
- FE-001: Frontend 초기 설정

### Round 2 (병렬 3개)
- INFRA-002: DB Migration
- BE-002: Backend 공통 모듈
- FE-002: Frontend API Client

### Round 3 (병렬 6개 - 도메인별)
- BE-010: Auth Domain
- BE-020: User Domain
- BE-030: Category Domain
- FE-010: 로그인 화면
- FE-020: 사용자 관리 화면
- FE-030: 카테고리 관리 화면

### Round 4 (병렬)
- BE-011, BE-021, BE-031: Adapter들
- BE-040: VOC Domain
- BE-045: Log Analysis Adapter
- FE-041, FE-042, FE-044: VOC 화면들 (독립적)

### Round 5 (병렬)
- BE-041: VOC UseCase
- BE-044: AI Adapter (Ollama)
- FE-040, FE-043: VOC 입력/테이블

### Round 6+
- BE-042, BE-043: VOC Persistence/Controller
- BE-046: Vector Search
- BE-050, BE-051: Email
- BE-060: Statistics
- FE-045, FE-050, FE-060: 유사VOC, 이메일, 대시보드

---

## 검증 방법

1. **각 이슈 PR마다**: Gemini CLI 리뷰
2. **Backend**: `./gradlew build jacocoTestCoverageVerification`
3. **Frontend**: `npm run build && npm run test:coverage`
4. **CI/CD**: GitHub Actions 파이프라인 통과
