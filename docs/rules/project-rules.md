# VOC Auto Bot - 프로젝트 개발 규칙

> 버전: 1.0
> 작성일: 2026-01-25

## 1. 개요

이 문서는 VOC Auto Bot 프로젝트의 개발 규칙을 정의합니다. 모든 개발자는 코드 작성 전 이 문서를 필수로 참조해야 합니다.

---

## 2. 테스트 커버리지 기준

### 2.1 Backend (Spring Boot)

| 항목 | 기준 |
|------|------|
| 전체 라인 커버리지 | **80% 이상** |
| 브랜치 커버리지 | **75% 이상** |
| Domain Layer | 90% 이상 |
| Application Layer | 85% 이상 |
| Adapter Layer | 75% 이상 |

**테스트 실행:**
```bash
./gradlew test jacocoTestReport jacocoTestCoverageVerification
```

**테스트 종류:**
- Unit Test: `@Test` (JUnit 5)
- Integration Test: `@SpringBootTest`
- Repository Test: `@DataJpaTest`
- Controller Test: `@WebMvcTest`

### 2.2 Frontend (Next.js)

| 항목 | 기준 |
|------|------|
| 전체 커버리지 | **70% 이상** |
| 브랜치 커버리지 | **65% 이상** |
| Components | 70% 이상 |
| Hooks | 80% 이상 |
| Utils | 90% 이상 |

**테스트 실행:**
```bash
npm run test:coverage
```

**테스트 도구:**
- Jest + React Testing Library
- MSW (Mock Service Worker) - API Mocking
- Playwright - E2E Test

---

## 3. Git 워크플로우

### 3.1 브랜치 전략 (Git Flow)

```
main (production)
  └── develop (development)
        ├── feature/be-001-xxx (backend features)
        ├── feature/fe-001-xxx (frontend features)
        ├── feature/infra-001-xxx (infrastructure)
        ├── bugfix/xxx
        └── hotfix/xxx
```

**브랜치 명명 규칙:**
- Feature: `feature/{이슈타입}-{이슈번호}-{간략설명}`
- Bugfix: `bugfix/{이슈번호}-{간략설명}`
- Hotfix: `hotfix/{이슈번호}-{간략설명}`

**예시:**
- `feature/be-001-multimodule-setup`
- `feature/fe-010-login`
- `bugfix/123-fix-login-error`

### 3.2 Conventional Commits

커밋 메시지는 Conventional Commits 형식을 따릅니다.

**형식:**
```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**타입:**
| 타입 | 설명 |
|------|------|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| docs | 문서 수정 |
| style | 코드 포맷팅, 세미콜론 누락 등 |
| refactor | 코드 리팩토링 |
| test | 테스트 코드 |
| chore | 빌드 설정, 패키지 매니저 등 |
| perf | 성능 개선 |
| ci | CI 설정 변경 |

**스코프:**
- `be`: Backend 전체
- `fe`: Frontend 전체
- `domain`: 도메인 레이어
- `api`: API 관련
- `auth`, `voc`, `user`, `category`, `email`: 각 도메인
- `infra`: 인프라 관련

**예시:**
```
feat(be/auth): implement JWT authentication

- Add JwtTokenProvider
- Add JwtAuthenticationFilter
- Configure SecurityConfig

Closes #10
```

### 3.3 Pull Request 규칙

1. **제목**: `[이슈타입-번호] 간략한 설명`
2. **본문**: PR 템플릿 사용
3. **리뷰어**: 최소 1명 필수
4. **CI 통과**: 모든 체크 통과 필수
5. **Squash Merge**: feature 브랜치는 squash merge

**PR 템플릿:**
```markdown
## Summary
- 변경 사항 요약

## Changes
- 주요 변경 내용

## Test Plan
- [ ] Unit Test 추가/수정
- [ ] Integration Test 추가/수정
- [ ] Manual Test 완료

## Screenshots (if applicable)

## Related Issues
- Closes #xxx
```

---

## 4. CI/CD 파이프라인

### 4.1 GitHub Actions 워크플로우

#### Backend CI (`.github/workflows/backend-ci.yml`)
```yaml
trigger: PR to develop/main, push to feature/**

jobs:
  - lint: Checkstyle
  - test: ./gradlew test
  - coverage: JaCoCo coverage verification
  - build: ./gradlew build
  - sonar: SonarQube analysis (optional)
```

#### Frontend CI (`.github/workflows/frontend-ci.yml`)
```yaml
trigger: PR to develop/main, push to feature/**

jobs:
  - lint: ESLint + Prettier
  - type-check: tsc --noEmit
  - test: npm run test:coverage
  - build: npm run build
```

#### Deploy (`.github/workflows/deploy.yml`)
```yaml
trigger: push to main

jobs:
  - backend: Build & Push Docker image → Deploy
  - frontend: Build → Deploy to Vercel/CDN
```

### 4.2 환경

| 환경 | 브랜치 | 배포 트리거 |
|------|--------|-------------|
| Development | develop | Manual |
| Staging | release/* | Auto |
| Production | main | Manual (approval) |

---

## 5. 코드 리뷰 체크리스트

### 5.1 공통

- [ ] 코드가 요구사항을 충족하는가?
- [ ] 테스트 커버리지 기준을 충족하는가?
- [ ] 보안 취약점이 없는가? (OWASP Top 10)
- [ ] 성능 이슈가 없는가?
- [ ] 코드 중복이 없는가?
- [ ] 네이밍이 명확한가?
- [ ] 주석이 필요한 복잡한 로직에 주석이 있는가?

### 5.2 Backend

- [ ] 클린 아키텍처 원칙을 따르는가?
- [ ] 트랜잭션 범위가 적절한가?
- [ ] N+1 쿼리 문제가 없는가?
- [ ] 예외 처리가 적절한가?
- [ ] API 응답 형식이 일관적인가?
- [ ] 로깅이 적절한가?

### 5.3 Frontend

- [ ] 컴포넌트 재사용성이 고려되었는가?
- [ ] 상태 관리가 적절한가?
- [ ] 에러 핸들링이 되어있는가?
- [ ] 로딩 상태가 처리되어있는가?
- [ ] 접근성(a11y)이 고려되었는가?
- [ ] 반응형이 적용되었는가?

---

## 6. Pre-commit Hooks

### 6.1 Backend (Gradle + Git Hooks)

```bash
# .git/hooks/pre-commit
#!/bin/sh
./gradlew spotlessCheck checkstyleMain
```

**Checkstyle 설정:**
- Google Java Style Guide 기반
- 최대 줄 길이: 120
- 탭 대신 스페이스 4칸

### 6.2 Frontend (Husky + lint-staged)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## 7. 코드 스타일

### 7.1 Backend (Java/Kotlin)

- **Java 버전**: 21
- **스타일 가이드**: Google Java Style Guide
- **Formatter**: Spotless + Google Java Format
- **Static Analysis**: Checkstyle, SpotBugs

**주요 규칙:**
- 클래스/인터페이스: PascalCase
- 메서드/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 패키지: lowercase

### 7.2 Frontend (TypeScript/React)

- **TypeScript 버전**: 5.x
- **React 버전**: 18.x
- **스타일 가이드**: Airbnb
- **Formatter**: Prettier + ESLint

**주요 규칙:**
- 컴포넌트: PascalCase
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 파일명: kebab-case (컴포넌트는 PascalCase)

---

## 8. 디렉토리 구조

### 8.1 Backend (클린 아키텍처)

```
backend/
├── voc-domain/           # 도메인 레이어 (순수 비즈니스 로직)
│   └── src/main/java/
│       └── com/geonho/vocautobot/domain/
│           ├── voc/
│           ├── user/
│           ├── category/
│           └── email/
├── voc-application/      # 애플리케이션 레이어 (UseCase)
│   └── src/main/java/
│       └── com/geonho/vocautobot/application/
│           ├── voc/usecase/
│           ├── voc/port/in/
│           └── voc/port/out/
├── voc-adapter/          # 어댑터 레이어 (외부 연동)
│   └── src/main/java/
│       └── com/geonho/vocautobot/adapter/
│           ├── in/web/           # Controller
│           ├── out/persistence/  # JPA Repository
│           ├── out/ai/           # LLM 연동
│           └── out/search/       # OpenSearch
├── voc-bootstrap/        # 부트스트랩 (애플리케이션 진입점)
│   └── src/main/java/
│       └── com/geonho/vocautobot/
│           ├── VocAutoBotApplication.java
│           └── global/           # 공통 설정
└── build.gradle          # 루트 빌드 파일
```

### 8.2 Frontend (Feature-Sliced Design)

```
frontend/
├── app/                  # Next.js App Router
│   ├── (auth)/           # 인증 관련 라우트 그룹
│   │   └── login/
│   ├── (main)/           # 메인 레이아웃 그룹
│   │   ├── voc/
│   │   ├── admin/
│   │   └── dashboard/
│   └── layout.tsx
├── components/           # 재사용 컴포넌트
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── voc/              # VOC 도메인 컴포넌트
│   ├── user/             # 사용자 도메인 컴포넌트
│   └── layout/           # 레이아웃 컴포넌트
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티
│   ├── api/              # API 클라이언트
│   └── utils/
├── types/                # TypeScript 타입
├── store/                # 상태 관리 (Zustand)
├── mocks/                # MSW 핸들러
└── __tests__/            # 테스트 파일
```

---

## 9. 보안 규칙

### 9.1 민감 정보 관리

- **절대 커밋 금지**: `.env`, `*.pem`, `*.key`, `credentials.json`
- **환경 변수**: 모든 비밀 정보는 환경 변수로 관리
- **Secret Manager**: Production 환경은 AWS Secrets Manager 사용

### 9.2 OWASP Top 10 대응

| 취약점 | 대응 |
|--------|------|
| Injection | Prepared Statement, ORM 사용 |
| Broken Auth | JWT + Refresh Token, Rate Limiting |
| XSS | 입력 검증, 출력 인코딩 |
| CSRF | SameSite Cookie, CSRF Token |
| Security Misconfiguration | Security Headers, HTTPS |

---

## 10. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-01-25 | Claude | 최초 작성 |
