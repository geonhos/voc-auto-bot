# VOC Auto Bot - E2E 테스트 오류 리포트

## 테스트 실행 일시
- 2026-01-27 (업데이트)

## 테스트 실행 결과 요약 (최종)

| 항목 | 결과 |
|------|------|
| Chromium 테스트 | 37개 모두 통과 |
| 테스트 시간 | 9.7분 |
| 상태 | 성공 |

### 성공한 테스트 목록
- [setup] authenticate
- [setup] setup-expired-token
- should validate required email field
- should validate required password field
- should validate both required fields
- should show error message with non-existent user
- should successfully login with valid credentials
- should toggle password visibility
- should disable submit button during login
- should redirect unauthenticated users to login
- should preserve intended destination after login
- should have proper ARIA labels on login form
- should have proper ARIA attributes for validation errors
- should be keyboard navigable

## 발견된 오류 목록

### ERR-001: 로그인 폼 필드 레이블 불일치

**심각도:** Critical (테스트 전체 차단)

**위치:**
- `e2e/setup/auth.setup.ts:32`
- `e2e/auth/login.spec.ts` (다수)
- `e2e/utils/test-helpers.ts:118`

**오류 메시지:**
```
TimeoutError: locator.fill: Timeout 10000ms exceeded.
Call log:
  - waiting for getByLabel('아이디')
```

**원인:**
- 실제 LoginForm 컴포넌트는 "이메일" 레이블을 사용
- 테스트 코드는 "아이디" 레이블을 찾고 있음
- LoginForm.tsx에서 email 필드를 사용하도록 변경되었으나 테스트가 업데이트되지 않음

**실제 UI:**
- 레이블: "이메일" (not "아이디")
- 필드 ID: `email` (not `username`)
- 유효성 검증 메시지: "이메일을 입력해주세요" (not "아이디를 입력해주세요")

**영향 범위:**
1. `e2e/setup/auth.setup.ts` - 인증 설정 실패로 모든 authenticated 테스트 스킵됨
2. `e2e/auth/login.spec.ts` - 모든 로그인 관련 테스트 실패
3. `e2e/utils/test-helpers.ts` - login() 헬퍼 함수 동작 불가

**수정 필요 파일:**

| 파일 | 수정 내용 |
|------|----------|
| `e2e/setup/auth.setup.ts` | `getByLabel('아이디')` → `getByLabel('이메일')` |
| `e2e/auth/login.spec.ts` | 모든 `getByLabel('아이디')` → `getByLabel('이메일')` |
| `e2e/auth/login.spec.ts` | 검증 메시지 `아이디를 입력해주세요` → `이메일을 입력해주세요` |
| `e2e/utils/test-helpers.ts` | login() 함수의 `getByLabel('아이디')` → `getByLabel('이메일')` |
| `e2e/utils/test-helpers.ts` | getTestCredentials의 `username` → `email` 필드명 변경 고려 |

---

### ERR-002: 테스트 Credential 필드명 불일치 (잠재적)

**심각도:** Medium

**위치:** `e2e/utils/test-helpers.ts:395-414`

**원인:**
- getTestCredentials() 함수가 `username` 필드를 반환
- 실제 LoginForm은 `email` 필드를 사용

**수정 방안:**
- 테스트 credential 객체의 필드명을 `username`에서 `email`로 변경
- 또는 LoginForm이 이메일 형식을 요구하므로 테스트 이메일 주소 사용

---

## 수정 우선순위

1. **[Critical]** ERR-001: 인증 설정 테스트 수정 (모든 테스트 차단 해제)
2. **[High]** ERR-001: 로그인 테스트 스펙 수정
3. **[Medium]** ERR-002: 테스트 헬퍼 함수 및 credential 수정

---

## 수정 진행 상태

| 오류 ID | 파일 | 상태 |
|---------|------|------|
| ERR-001 | e2e/setup/auth.setup.ts | 완료 |
| ERR-001 | e2e/auth/login.spec.ts | 완료 |
| ERR-001 | e2e/utils/test-helpers.ts | 완료 |
| ERR-002 | e2e/utils/test-helpers.ts | 완료 |

---

## 추가 발견된 오류 (미해결)

### ERR-003: API 모킹 경로 매칭 문제

**심각도:** Medium

**영향 테스트:**
- should show error message with invalid password
- should show loading state during login

**원인:**
- Playwright의 `page.route()` 패턴 매칭이 cross-origin 요청(localhost:3000 → localhost:8080)에서 일관되게 작동하지 않음
- axios가 `localhost:8080/api/v1/auth/login`으로 직접 요청을 보내므로 모킹이 간헐적으로 실패

**해결 방안:**
1. Next.js의 API 프록시 설정을 사용하여 모든 API 요청을 같은 origin으로 라우팅
2. 또는 MSW(Mock Service Worker)를 E2E 테스트에서 활성화

---

### ERR-004: authenticatedPage fixture 관련 문제

**심각도:** Medium

**영향 테스트:**
- should successfully logout and clear session
- should call logout API endpoint
- should allow authenticated users to access protected routes
- Token Expiration 관련 테스트들

**원인:**
- `authenticatedPage` fixture가 `storageState`를 사용하지만, localStorage 기반 인증 상태가 제대로 복원되지 않음
- 인증된 상태에서 시작하는 테스트들이 실제로는 미인증 상태로 시작됨

**해결 방안:**
1. `authenticatedPage` fixture에서 인증 상태를 수동으로 설정
2. 또는 테스트 시작 시 login API를 호출하여 인증 상태 설정

---

## 수정 완료된 항목

### 1. 로그인 폼 필드 레이블 불일치 (ERR-001) - 해결됨

**수정 내용:**
- `e2e/setup/auth.setup.ts`: `getByLabel('아이디')` → `getByLabel('이메일')`
- `e2e/auth/login.spec.ts`: 모든 관련 selector 수정
- `e2e/utils/test-helpers.ts`: `login()` 함수와 `getTestCredentials()` 수정

### 2. 테스트 Credential 필드명 불일치 (ERR-002) - 해결됨

**수정 내용:**
- `username` → `email` 필드명 변경
- 테스트 이메일 주소 사용 (예: `admin@example.com`)

### 3. password toggle 테스트 수정 - 해결됨

**수정 내용:**
- 버튼 클릭 후 레이블이 변경되므로 각 상태에 맞는 selector 사용
- `비밀번호 보기` → `비밀번호 숨기기`

### 4. alert selector 개선 - 해결됨

**수정 내용:**
- Next.js route announcer와 중복 방지를 위해 더 구체적인 selector 사용
- `.bg-red-50[role="alert"]`
