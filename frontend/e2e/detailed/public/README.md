# VOC 상태 조회 페이지 상세 E2E 테스트

## 개요
공개 VOC 상태 조회 페이지(`/voc/status`)의 모든 UI 요소와 사용자 인터랙션을 상세하게 테스트합니다.

## 테스트 파일
- `voc-status.detailed.spec.ts` (1,119 lines, 79 test cases)

## 테스트 범위

### 1. 페이지 렌더링 (6 tests)
- 페이지 타이틀 및 헤딩
- 모든 폼 필드 렌더링
- 필수 필드 표시(*)
- 도움말 텍스트
- 보안 안내 메시지
- 인증 없이 접근 가능

### 2. Ticket ID 입력 필드 (8 tests)
- 포커스 상태
- 텍스트 입력
- 빈 값 유효성 검사
- 형식 유효성 검사 (VOC-YYYYMMDD-XXXXX)
- 최대 길이 제한 (22자)
- 포커스 스타일
- 에러 상태 스타일

### 3. 이메일 입력 필드 (6 tests)
- 포커스 상태
- 텍스트 입력
- 빈 값 유효성 검사
- 이메일 형식 유효성 검사
- @ 필수 검증
- 포커스 스타일

### 4. 초기화 버튼 (4 tests)
- 입력 필드 초기화
- 에러 메시지 초기화
- 로딩 중 비활성화
- 호버 스타일

### 5. 조회 버튼 (5 tests)
- 폼 제출
- 로딩 상태 (버튼 비활성화, 텍스트 변경)
- 유효성 검사 우선 실행
- Enter 키 제출
- 호버 스타일

### 6. 조회 결과 표시 (8 tests)
- 결과 제목
- Ticket ID 표시
- VOC 제목 표시
- 접수일시 표시
- 최종 수정일시 표시
- 카테고리 표시
- 우선순위 배지
- 상태 배지

### 7. Ticket ID 복사 버튼 (4 tests)
- 버튼 표시
- 클릭 시 아이콘 변경 (check)
- 호버 스타일
- 2초 후 아이콘 복원

### 8. 상태 타임라인 (9 tests)
- 타임라인 섹션 제목
- 모든 히스토리 아이템 표시
- 상태 라벨 표시
- 날짜/시간 표시
- 담당자 정보 표시
- 완료 상태 아이콘 (초록색)
- 진행중 상태 아이콘 (파란색)
- 아이템 간 연결선
- 마지막 아이템 연결선 없음

### 9. 에러 상태 - 404 (3 tests)
- 조회 결과 없음 메시지
- 안내 메시지
- 검색 아이콘

### 10. 에러 상태 - 네트워크 오류 (3 tests)
- 네트워크 오류 메시지
- 서버 500 에러 메시지
- 에러 후 폼 수정 가능

### 11. 키보드 네비게이션 (3 tests)
- Tab 키 순방향 이동
- Shift+Tab 역방향 이동
- Enter 키 폼 제출

### 12. 접근성 (6 tests)
- aria-label 설정
- aria-required 설정
- aria-invalid 설정
- role="alert" 설정
- aria-describedby 연결
- 버튼 aria-label

### 13. 반응형 레이아웃 (4 tests)
- 모바일 뷰포트 (375x667)
- 모바일 버튼 세로 배치
- 태블릿 뷰포트 (768x1024)
- 데스크톱 최대 너비

### 14. 보안 (3 tests)
- XSS 공격 방어
- SQL Injection 방어
- HTML 태그 이스케이프

### 15. 에지 케이스 (5 tests)
- 매우 긴 제목 처리
- statusHistory 없는 경우
- 다크모드 지원
- 더블 클릭 중복 제출 방지
- 연속 조회 가능

## 실행 방법

```bash
# 전체 상세 테스트 실행
npx playwright test e2e/detailed/public/voc-status.detailed.spec.ts

# 특정 브라우저에서 실행
npx playwright test e2e/detailed/public/voc-status.detailed.spec.ts --project=chromium

# 헤드풀 모드로 실행 (브라우저 UI 표시)
npx playwright test e2e/detailed/public/voc-status.detailed.spec.ts --headed

# 디버그 모드
npx playwright test e2e/detailed/public/voc-status.detailed.spec.ts --debug

# 특정 테스트만 실행 (grep)
npx playwright test e2e/detailed/public/voc-status.detailed.spec.ts --grep "타임라인"
```

## 주요 특징

1. **완전한 UI 커버리지**: 모든 입력 필드, 버튼, 결과 표시 요소를 테스트
2. **상세한 인터랙션 검증**: 클릭, 호버, 포커스, 키보드 입력 등
3. **접근성 준수**: ARIA 속성 및 스크린 리더 지원 검증
4. **보안 테스트**: XSS, SQL Injection 방어 확인
5. **반응형 디자인**: 모바일/태블릿/데스크톱 뷰포트 테스트
6. **에러 처리**: 다양한 에러 상황 대응 검증
7. **에지 케이스**: 극단적 상황 및 비정상 입력 처리

## 기존 테스트와의 차이점

| 항목 | 기존 테스트 (voc-status.spec.ts) | 상세 테스트 (voc-status.detailed.spec.ts) |
|------|----------------------------------|-------------------------------------------|
| 테스트 개수 | ~30개 | 79개 |
| 초점 | 주요 기능 동작 | 모든 UI 요소 및 인터랙션 |
| UI 세부사항 | 기본 렌더링 확인 | 스타일, 호버, 포커스 등 상세 검증 |
| 접근성 | 일부 검증 | 모든 ARIA 속성 검증 |
| 에지 케이스 | 기본적인 에러 처리 | 다양한 극단 상황 테스트 |
| 보안 | - | XSS, SQL Injection 방어 테스트 |

## 커버리지

- **컴포넌트**: VocStatusLookup, VocStatusResult, VocStatusTimeline
- **폼 유효성 검사**: Zod schema 기반 모든 검증 규칙
- **API 통신**: 성공/실패 시나리오, 네트워크 오류
- **사용자 경험**: 로딩 상태, 에러 메시지, 성공 피드백
- **접근성**: WCAG 2.1 Level AA 준수 확인

## 유지보수 가이드

### 테스트 추가 시
1. 관련 describe 블록 찾기
2. 새 test case 추가
3. AAA 패턴 (Arrange-Act-Assert) 준수
4. 한글로 명확한 테스트 설명 작성

### 컴포넌트 변경 시
1. UI 변경: 셀렉터 업데이트 필요
2. 유효성 검사 변경: 에러 메시지 확인 테스트 수정
3. API 응답 변경: Mock 데이터 구조 업데이트
4. 새 기능 추가: 해당 describe 블록에 테스트 추가

## 참고 자료
- [Playwright 공식 문서](https://playwright.dev)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [프로젝트 테스트 규칙](../../README.md)
