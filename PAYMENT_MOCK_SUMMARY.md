# 결제 오류 Mock 데이터 구현 완료

## 구현 내용

### 1. 타입 정의 (payment.ts)
- 12가지 결제 오류 코드 타입 정의
- PaymentErrorLog, PaymentTransaction, PaymentRequest/Response 인터페이스

### 2. Mock 데이터 (paymentErrors.json)
12가지 결제 오류 시나리오:
1. PAYMENT_TIMEOUT - 결제 처리 시간 초과
2. INSUFFICIENT_BALANCE - 잔액 부족
3. INVALID_CARD - 유효하지 않은 카드
4. CARD_EXPIRED - 카드 유효기간 만료
5. NETWORK_ERROR - 네트워크 연결 오류
6. FRAUD_DETECTED - 이상 거래 감지
7. DAILY_LIMIT_EXCEEDED - 일일 한도 초과
8. SYSTEM_ERROR - 내부 시스템 오류
9. AUTHENTICATION_FAILED - 카드 인증 실패
10. DUPLICATE_TRANSACTION - 중복 거래 요청
11. MERCHANT_NOT_FOUND - 가맹점 정보 없음
12. CURRENCY_NOT_SUPPORTED - 지원하지 않는 통화

### 3. MSW Handlers (handlers.ts)
추가된 API 엔드포인트:
- GET /api/v1/payments/errors - 오류 로그 조회 (필터링 지원)
- GET /api/v1/payments/errors/:id - 특정 오류 로그 조회
- GET /api/v1/payments/transactions - 거래 내역 조회
- GET /api/v1/payments/transactions/:id - 특정 거래 조회
- POST /api/v1/payments/process - 결제 처리 시뮬레이션
- GET /api/v1/payments/statistics/errors - 오류 통계

### 4. 헬퍼 함수 (paymentErrors.ts)
- getPaymentErrorLogs() - 필터링 지원
- getPaymentTransactions() - 필터링 지원
- getRandomPaymentError() - 랜덤 오류 시나리오

### 5. 문서화
- README.md - 사용법, API 엔드포인트, 테스트 시나리오

## 테스트 방법

카드 번호 끝자리로 오류 시나리오 테스트:
- **** 0000 → PAYMENT_TIMEOUT
- **** 1111 → INSUFFICIENT_BALANCE
- **** 2222 → INVALID_CARD
- **** 3333 → CARD_EXPIRED
- **** 4444 → NETWORK_ERROR
- **** 5555 → FRAUD_DETECTED
- **** 6666 → DAILY_LIMIT_EXCEEDED
- **** 7777 → SYSTEM_ERROR
- **** 8888 → AUTHENTICATION_FAILED
- **** 9999 → Random error
- 기타 → SUCCESS

## 파일 구조
```
frontend/src/
├── types/
│   ├── payment.ts (NEW)
│   └── index.ts (MODIFIED)
└── mocks/
    ├── handlers.ts (MODIFIED)
    └── data/
        ├── paymentErrors.json (NEW)
        ├── paymentErrors.ts (NEW)
        └── README.md (NEW)
```

## 활용 방안
1. E2E 테스트에서 결제 오류 시나리오 테스트
2. UI 컴포넌트 오류 처리 로직 검증
3. 오류 로그 대시보드 개발 시 샘플 데이터 활용
4. 결제 플로우 통합 테스트
