# Payment Error Mock Data

결제 오류 시나리오를 테스트하기 위한 Mock 데이터입니다.

## 파일 구조

```
data/
├── paymentErrors.json   # 결제 오류 로그 및 거래 데이터
├── paymentErrors.ts     # TypeScript 모듈 및 헬퍼 함수
└── README.md           # 문서
```

## 오류 시나리오 (12가지)

| Error Code | Description | Level | 테스트 카드 |
|-----------|-------------|-------|-----------|
| `PAYMENT_TIMEOUT` | 결제 처리 시간 초과 | ERROR | **** 0000 |
| `INSUFFICIENT_BALANCE` | 잔액 부족 | CRITICAL | **** 1111 |
| `INVALID_CARD` | 유효하지 않은 카드 | ERROR | **** 2222 |
| `CARD_EXPIRED` | 카드 유효기간 만료 | WARN | **** 3333 |
| `NETWORK_ERROR` | 네트워크 연결 오류 | ERROR | **** 4444 |
| `FRAUD_DETECTED` | 이상 거래 감지 | CRITICAL | **** 5555 |
| `DAILY_LIMIT_EXCEEDED` | 일일 한도 초과 | WARN | **** 6666 |
| `SYSTEM_ERROR` | 내부 시스템 오류 | ERROR | **** 7777 |
| `AUTHENTICATION_FAILED` | 카드 인증 실패 | WARN | **** 8888 |
| `DUPLICATE_TRANSACTION` | 중복 거래 요청 | ERROR | - |
| `MERCHANT_NOT_FOUND` | 가맹점 정보 없음 | ERROR | - |
| `CURRENCY_NOT_SUPPORTED` | 지원하지 않는 통화 | WARN | - |

## API Endpoints

### 1. 결제 오류 로그 조회
```
GET /api/v1/payments/errors
```

**Query Parameters:**
- `errorCode`: 오류 코드 필터
- `accountId`: 계정 ID 필터
- `level`: 로그 레벨 필터 (ERROR, WARN, CRITICAL)
- `fromDate`: 시작 날짜 (ISO 8601)
- `toDate`: 종료 날짜 (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ERR-001",
      "timestamp": "2026-01-28T10:30:00Z",
      "level": "ERROR",
      "service": "payment-service",
      "errorCode": "PAYMENT_TIMEOUT",
      "message": "결제 처리 시간 초과",
      "accountId": "ACC-12345",
      "transactionId": "TXN-67890",
      "amount": 50000,
      "currency": "KRW",
      "cardLast4": "1234",
      "merchantId": "MERCHANT-001"
    }
  ],
  "totalCount": 1
}
```

### 2. 특정 오류 로그 조회
```
GET /api/v1/payments/errors/:id
```

### 3. 결제 거래 내역 조회
```
GET /api/v1/payments/transactions
```

**Query Parameters:**
- `status`: 거래 상태 필터
- `accountId`: 계정 ID 필터
- `errorCode`: 오류 코드 필터

### 4. 특정 거래 조회
```
GET /api/v1/payments/transactions/:id
```

### 5. 결제 처리 (시뮬레이션)
```
POST /api/v1/payments/process
```

**Request Body:**
```json
{
  "accountId": "ACC-12345",
  "amount": 50000,
  "currency": "KRW",
  "cardNumber": "1234-5678-9012-0000",
  "cardExpiry": "12/26",
  "cardCvv": "123",
  "merchantId": "MERCHANT-001"
}
```

**카드 번호 끝자리로 오류 시나리오 테스트:**
- `0000`: PAYMENT_TIMEOUT
- `1111`: INSUFFICIENT_BALANCE
- `2222`: INVALID_CARD
- `3333`: CARD_EXPIRED
- `4444`: NETWORK_ERROR
- `5555`: FRAUD_DETECTED
- `6666`: DAILY_LIMIT_EXCEEDED
- `7777`: SYSTEM_ERROR
- `8888`: AUTHENTICATION_FAILED
- `9999`: Random error
- 기타: SUCCESS

### 6. 오류 통계 조회
```
GET /api/v1/payments/statistics/errors
```

**Query Parameters:**
- `fromDate`: 시작 날짜
- `toDate`: 종료 날짜

**Response:**
```json
{
  "success": true,
  "data": {
    "totalErrors": 12,
    "errorsByCode": {
      "PAYMENT_TIMEOUT": 1,
      "INSUFFICIENT_BALANCE": 1,
      "INVALID_CARD": 1
    },
    "errorsByLevel": {
      "ERROR": 7,
      "WARN": 4,
      "CRITICAL": 2
    },
    "totalFailedAmount": 1235000,
    "averageFailedAmount": 102916.67
  }
}
```

## 사용 예시

### TypeScript/React
```typescript
import { getPaymentErrorLogs, getRandomPaymentError } from '@/mocks/data/paymentErrors';

// 특정 오류 코드 필터링
const timeoutErrors = getPaymentErrorLogs({ errorCode: 'PAYMENT_TIMEOUT' });

// 계정별 오류 조회
const accountErrors = getPaymentErrorLogs({ accountId: 'ACC-12345' });

// 랜덤 오류 시나리오
const randomError = getRandomPaymentError();
```

## 테스트 시나리오

### 1. 결제 타임아웃
```bash
curl -X POST http://localhost:5173/api/v1/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "ACC-TEST",
    "amount": 50000,
    "currency": "KRW",
    "cardNumber": "1234-5678-9012-0000",
    "cardExpiry": "12/26",
    "cardCvv": "123",
    "merchantId": "MERCHANT-001"
  }'
```

### 2. 잔액 부족
카드 번호 끝자리를 `1111`로 변경

### 3. 오류 로그 조회
```bash
curl http://localhost:5173/api/v1/payments/errors?level=CRITICAL
```

## 데이터 확장

새로운 오류 시나리오 추가:

1. `paymentErrors.json`에 새 오류 로그 추가
2. `handlers.ts`에 해당 오류 처리 로직 추가
3. README 업데이트

## 참고사항

- Mock 데이터는 개발/테스트 환경에서만 사용됩니다
- 프로덕션 환경에서는 실제 API를 사용합니다
- MSW (Mock Service Worker)를 통해 HTTP 요청을 인터셉트합니다
