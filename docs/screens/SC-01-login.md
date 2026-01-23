# SC-01: 로그인 화면

> **관련 이슈**: #11
> **작성일**: 2026-01-23
> **작성자**: Frontend Developer

---

## 1. 화면 개요

### 1.1 목적
VOC Auto Bot 시스템에 접근하기 위한 인증 화면으로, 아이디/비밀번호 기반 로그인을 제공한다.

### 1.2 사용자
- VOC 접수자
- VOC 처리 담당자
- 관리자

### 1.3 접근 경로
- URL: `/login`
- 진입:
  - 직접 URL 접근
  - 비로그인 상태에서 보호된 페이지 접근 시 자동 리다이렉트

---

## 2. 접근 권한

| 상태 | 접근 권한 |
|------|-----------|
| 비로그인 | 접근 가능 |
| 로그인 상태 | 메인 페이지로 자동 리다이렉트 |

---

## 3. 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   VOC Auto Bot                          │
│                                                         │
│   ┌─────────────────────────────────────────────┐       │
│   │  로그인                                      │       │
│   │                                              │       │
│   │  아이디                                      │       │
│   │  [                                    ]      │       │
│   │                                              │       │
│   │  비밀번호                                    │       │
│   │  [                                    ]      │       │
│   │                                              │       │
│   │  [ 로그인 ]                                 │       │
│   │                                              │       │
│   │  비밀번호를 잊으셨나요?                     │       │
│   └─────────────────────────────────────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.1 구성 요소
- 중앙 정렬된 로그인 폼 카드
- 헤더: "VOC Auto Bot" 로고/텍스트
- 폼 타이틀: "로그인"
- 입력 필드: 아이디, 비밀번호
- 액션 버튼: 로그인
- 보조 링크: 비밀번호 찾기 (FR-005 관련)

---

## 4. UI 요소 목록

### 4.1 입력 필드

| 필드명 | 타입 | 필수 여부 | Placeholder | maxLength | 비고 |
|--------|------|----------|-------------|-----------|------|
| 아이디 | text | 필수 | 아이디 입력 | 50 | autocomplete="username" |
| 비밀번호 | password | 필수 | 비밀번호 입력 | 100 | autocomplete="current-password" |

### 4.2 버튼

| 버튼명 | 타입 | 스타일 | 동작 |
|--------|------|--------|------|
| 로그인 | submit | Primary | 로그인 요청 |

### 4.3 링크

| 링크 텍스트 | 경로 | 비고 |
|------------|------|------|
| 비밀번호를 잊으셨나요? | `/forgot-password` | 임시 비밀번호 발급 (FR-005) |

---

## 5. 사용자 액션 및 이벤트

### 5.1 로그인 버튼 클릭

#### 액션 플로우
```
1. 클라이언트 유효성 검사 수행
   ├─ 실패 → 에러 메시지 표시 (섹션 6 참조)
   └─ 성공 → 2단계 진행

2. 로그인 API 호출 (POST /api/auth/login)
   ├─ 성공 → 3단계 진행
   └─ 실패 → 에러 처리 (섹션 7 참조)

3. 응답 처리
   ├─ 임시 비밀번호 로그인 (isTemporaryPassword: true)
   │   └─ 비밀번호 변경 화면으로 이동 (/change-password) [FR-006]
   └─ 정상 로그인
       ├─ 토큰 저장 (localStorage/sessionStorage)
       ├─ 사용자 정보 저장
       └─ 역할별 메인 페이지로 이동
           ├─ VOC 접수자 → /voc/create
           ├─ VOC 처리 담당자 → /voc/list
           └─ 관리자 → /dashboard
```

### 5.2 비밀번호 찾기 링크 클릭
- `/forgot-password` 페이지로 이동
- 관리자가 임시 비밀번호 발급 가능 (FR-005)

---

## 6. 유효성 검사

### 6.1 클라이언트 검증 규칙

| 필드 | 검증 규칙 | 에러 메시지 |
|------|----------|-------------|
| 아이디 | 필수 입력 | "아이디를 입력해주세요" |
| 아이디 | 1자 이상 | "아이디를 입력해주세요" |
| 비밀번호 | 필수 입력 | "비밀번호를 입력해주세요" |
| 비밀번호 | 1자 이상 | "비밀번호를 입력해주세요" |

### 6.2 검증 시점
- **실시간 검증**: 없음 (Submit 시에만 검증)
- **Submit 검증**: 로그인 버튼 클릭 시

---

## 7. 에러 처리

### 7.1 서버 응답 에러

| HTTP Status | 에러 코드 | 메시지 | 동작 |
|-------------|-----------|--------|------|
| 401 | AUTH_INVALID_CREDENTIALS | "아이디 또는 비밀번호가 올바르지 않습니다" | 폼 상단에 에러 메시지 표시 |
| 403 | AUTH_ACCOUNT_LOCKED | "로그인 실패 5회로 인해 계정이 잠금되었습니다. 관리자에게 문의하세요" | 폼 상단에 에러 메시지 표시 (FR-004) |
| 500 | INTERNAL_SERVER_ERROR | "시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요" | 폼 상단에 에러 메시지 표시 |

### 7.2 네트워크 에러
- **타임아웃**: "서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요"
- **연결 실패**: "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요"

### 7.3 에러 메시지 표시 위치
- 폼 상단에 Alert/Banner 형태로 표시
- 빨간색 배경, 아이콘 포함
- 닫기 버튼 제공

### 7.4 로그인 실패 횟수 처리 (FR-004)
- 서버에서 실패 횟수 카운트 및 계정 잠금 처리
- 잠금 시 HTTP 403 + `AUTH_ACCOUNT_LOCKED` 반환
- 클라이언트는 에러 메시지만 표시

---

## 8. 연관 API

### 8.1 로그인 API

#### Request
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

#### Response (성공 - 정상 로그인)
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-1234",
      "username": "user@example.com",
      "name": "홍길동",
      "role": "VOC_HANDLER",
      "isTemporaryPassword": false
    }
  }
}
```

#### Response (성공 - 임시 비밀번호 로그인) [FR-006]
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-1234",
      "username": "user@example.com",
      "name": "홍길동",
      "role": "VOC_HANDLER",
      "isTemporaryPassword": true
    }
  }
}
```

#### Response (실패 - 인증 실패)
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "아이디 또는 비밀번호가 올바르지 않습니다"
  }
}
```

#### Response (실패 - 계정 잠금) [FR-004]
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "AUTH_ACCOUNT_LOCKED",
    "message": "로그인 실패 5회로 인해 계정이 잠금되었습니다. 관리자에게 문의하세요",
    "details": {
      "lockedAt": "2026-01-23T10:30:00Z",
      "reason": "MAX_LOGIN_ATTEMPTS"
    }
  }
}
```

---

## 9. 화면 전환

### 9.1 화면 전환 테이블

| 조건 | 전환 화면 | 비고 |
|------|----------|------|
| 로그인 성공 (정상 비밀번호) - VOC 접수자 | `/voc/create` | VOC 입력 화면 |
| 로그인 성공 (정상 비밀번호) - VOC 처리 담당자 | `/voc/list` | VOC 리스트 화면 (칸반) |
| 로그인 성공 (정상 비밀번호) - 관리자 | `/dashboard` | 통계 대시보드 |
| 로그인 성공 (임시 비밀번호) | `/change-password` | 비밀번호 변경 강제 (FR-006) |
| 비밀번호 찾기 클릭 | `/forgot-password` | 임시 비밀번호 발급 화면 |
| 이미 로그인 상태 | 역할별 메인 페이지 | 자동 리다이렉트 |

### 9.2 리다이렉트 처리
- 보호된 페이지 접근 시도 후 로그인 성공 시:
  - `returnUrl` 파라미터가 있으면 해당 URL로 이동
  - 없으면 역할별 기본 페이지로 이동

---

## 10. 보안 요구사항

### 10.1 비밀번호 보안 (FR-003)
- 비밀번호는 평문으로 전송되지만 HTTPS 사용 필수
- 서버에서 bcrypt 등으로 해시화하여 저장
- 클라이언트에서 비밀번호 저장 금지

### 10.2 토큰 관리
- Access Token: 짧은 유효기간 (15분)
- Refresh Token: 긴 유효기간 (7일)
- httpOnly Cookie 또는 Secure Storage 사용 권장

### 10.3 CSRF 방어
- CSRF 토큰 사용 (필요 시)
- SameSite Cookie 설정

---

## 11. 접근성 (Accessibility)

### 11.1 필수 구현 사항

| 요소 | 속성 | 값 |
|------|------|-----|
| 아이디 입력 | `id` | `username` |
| 아이디 입력 | `aria-label` | `아이디` |
| 아이디 입력 | `aria-required` | `true` |
| 아이디 입력 | `aria-invalid` | 에러 시 `true` |
| 비밀번호 입력 | `id` | `password` |
| 비밀번호 입력 | `aria-label` | `비밀번호` |
| 비밀번호 입력 | `aria-required` | `true` |
| 비밀번호 입력 | `aria-invalid` | 에러 시 `true` |
| 로그인 버튼 | `type` | `submit` |
| 로그인 버튼 | `aria-label` | `로그인` |
| 에러 메시지 | `role` | `alert` |
| 에러 메시지 | `aria-live` | `assertive` |

### 11.2 키보드 접근성
- Tab 키로 포커스 이동 가능
- Enter 키로 폼 제출 가능
- 포커스 가시성 확보 (outline 표시)

---

## 12. 상태 관리

### 12.1 로컬 상태

| 상태명 | 타입 | 초기값 | 설명 |
|--------|------|--------|------|
| `username` | string | `""` | 아이디 입력값 |
| `password` | string | `""` | 비밀번호 입력값 |
| `isSubmitting` | boolean | `false` | 제출 중 상태 |
| `error` | string \| null | `null` | 에러 메시지 |

### 12.2 전역 상태
- 로그인 성공 후:
  - 사용자 정보 (user)
  - 인증 토큰 (accessToken, refreshToken)
  - 인증 상태 (isAuthenticated)

---

## 13. 로딩 상태

### 13.1 제출 중 (isSubmitting: true)
- 로그인 버튼 비활성화
- 로딩 인디케이터 표시 (버튼 내 스피너 또는 오버레이)
- 입력 필드 비활성화 (선택 사항)

### 13.2 로딩 텍스트
- 버튼 텍스트: "로그인 중..." 또는 스피너 아이콘

---

## 14. 테스트 시나리오

### 14.1 정상 시나리오
1. 유효한 아이디/비밀번호 입력 → 로그인 성공 → 역할별 메인 페이지 이동
2. 임시 비밀번호로 로그인 → 비밀번호 변경 화면 이동 (FR-006)

### 14.2 에러 시나리오
1. 빈 아이디 입력 → "아이디를 입력해주세요" 에러
2. 빈 비밀번호 입력 → "비밀번호를 입력해주세요" 에러
3. 잘못된 인증 정보 → "아이디 또는 비밀번호가 올바르지 않습니다" 에러
4. 5회 로그인 실패 → 계정 잠금 메시지 표시 (FR-004)
5. 네트워크 오류 → 연결 실패 메시지 표시

### 14.3 접근성 테스트
1. 키보드만으로 로그인 가능
2. 스크린 리더로 폼 요소 인식 가능
3. 에러 메시지 스크린 리더로 읽힘

---

## 15. 구현 참고사항

### 15.1 기술 스택
- React 18+
- TypeScript 5+
- TanStack Query (로그인 API 호출)
- React Hook Form + Zod (폼 관리 및 검증)
- Zustand (인증 상태 관리)

### 15.2 파일 구조 (Feature-Sliced Design)
```
src/features/auth/
├── api/
│   └── authApi.ts           # 로그인 API
├── components/
│   ├── LoginForm.tsx        # 로그인 폼 컴포넌트
│   └── LoginForm.test.tsx   # 컴포넌트 테스트
├── hooks/
│   └── useLoginViewModel.ts # 로그인 로직 (ViewModel)
├── model/
│   ├── types.ts             # 타입 정의
│   └── schemas.ts           # Zod 스키마
└── index.ts
```

### 15.3 주요 구현 포인트
1. **비즈니스 로직 분리**: `useLoginViewModel` 훅에서 로그인 로직 처리
2. **TanStack Query 사용**: 서버 상태 관리 (캐싱, 에러 처리)
3. **임시 비밀번호 감지**: `isTemporaryPassword` 플래그로 비밀번호 변경 화면 분기
4. **토큰 저장**: 로그인 성공 시 Zustand store에 저장 및 localStorage 동기화

---

## 16. 관련 요구사항

| 요구사항 ID | 내용 | 구현 위치 |
|------------|------|----------|
| FR-001 | 아이디/비밀번호 로그인 | 섹션 5.1 (로그인 플로우) |
| FR-003 | 비밀번호 암호화 | 섹션 10.1 (보안) |
| FR-004 | 로그인 실패 5회 시 계정 잠금 | 섹션 7.1, 7.4 (에러 처리) |
| FR-005 | 임시 비밀번호 발급 | 섹션 5.2 (비밀번호 찾기 링크) |
| FR-006 | 임시 비밀번호 로그인 시 변경 강제 | 섹션 5.1 (로그인 플로우), 9.1 (화면 전환) |

---

## 17. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-01-23 | Frontend Developer | 초안 작성 |
