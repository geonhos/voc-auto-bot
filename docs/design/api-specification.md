# VOC Auto Bot - API 명세서

> 버전: 1.0
> 작성일: 2026-01-25
> 관련 이슈: #41

## 1. 개요

VOC Auto Bot 시스템의 REST API 명세서입니다. 도메인 모델(`domain-model.md`)과 화면 정의서(SC-01 ~ SC-11)를 기반으로 설계되었습니다.

### 1.1 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL | `https://api.voc-auto-bot.com/v1` |
| 인증 방식 | Bearer Token (JWT) |
| Content-Type | `application/json` |
| 문자 인코딩 | UTF-8 |

### 1.2 공통 응답 형식

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-25T10:30:00Z"
  }
}
```

**페이지네이션 응답:**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 100,
    "totalPages": 5,
    "timestamp": "2026-01-25T10:30:00Z"
  }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "VOC_NOT_FOUND",
    "message": "요청한 VOC를 찾을 수 없습니다",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-01-25T10:30:00Z"
  }
}
```

### 1.3 공통 HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 204 | 삭제 성공 (No Content) |
| 400 | 잘못된 요청 (유효성 검증 실패) |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 등) |
| 429 | 요청 제한 초과 |
| 500 | 서버 오류 |

### 1.4 공통 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_REQUEST | 400 | 요청 형식 오류 |
| VALIDATION_ERROR | 400 | 유효성 검증 실패 |
| UNAUTHORIZED | 401 | 인증 필요 |
| TOKEN_EXPIRED | 401 | 토큰 만료 |
| FORBIDDEN | 403 | 접근 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| DUPLICATE | 409 | 중복 데이터 |
| RATE_LIMITED | 429 | 요청 제한 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## 2. 인증 API

### 2.1 로그인

사용자 인증 후 액세스 토큰을 발급합니다.

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "username": "string (required, max: 50)",
  "password": "string (required, max: 100)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": 1,
      "username": "user01",
      "email": "user01@example.com",
      "name": "홍길동",
      "role": "HANDLER",
      "isTemporaryPassword": false
    }
  }
}
```

**Error Codes:**
| 코드 | 설명 |
|------|------|
| INVALID_CREDENTIALS | 아이디 또는 비밀번호 불일치 |
| ACCOUNT_LOCKED | 계정 잠금 (5회 연속 실패) |
| ACCOUNT_INACTIVE | 비활성 계정 |

---

### 2.2 토큰 갱신

리프레시 토큰으로 새 액세스 토큰을 발급합니다.

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "string (required)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

---

### 2.3 로그아웃

토큰을 무효화합니다.

**Endpoint:** `POST /auth/logout`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204):** No Content

---

### 2.4 비밀번호 변경

현재 비밀번호를 변경합니다.

**Endpoint:** `PUT /auth/password`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "currentPassword": "string (required)",
  "newPassword": "string (required, min: 8, 대소문자+숫자+특수문자)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 변경되었습니다"
  }
}
```

---

## 3. VOC API

### 3.1 VOC 목록 조회

VOC 목록을 페이지네이션으로 조회합니다.

**Endpoint:** `GET /vocs`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | integer | X | 페이지 번호 (기본: 1) |
| size | integer | X | 페이지 크기 (기본: 20, 최대: 100) |
| status | string | X | 상태 필터 (RECEIVED, ANALYZING, ANALYSIS_FAILED, PROCESSING, COMPLETED, REJECTED) |
| mainCategoryId | long | X | 대분류 카테고리 ID |
| subCategoryId | long | X | 중분류 카테고리 ID |
| assigneeId | long | X | 담당자 ID |
| keyword | string | X | 제목/내용 검색어 |
| startDate | date | X | 시작일 (YYYY-MM-DD) |
| endDate | date | X | 종료일 (YYYY-MM-DD) |
| sort | string | X | 정렬 (createdAt,desc / createdAt,asc) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "ticketId": "VOC-20260123-00001",
      "title": "결제 오류 발생",
      "status": "PROCESSING",
      "priority": "HIGH",
      "mainCategory": {
        "id": 1,
        "name": "오류/버그"
      },
      "subCategory": {
        "id": 3,
        "name": "시스템 오류"
      },
      "assignee": {
        "id": 5,
        "name": "김담당"
      },
      "customerEmail": "us**@example.com",
      "createdAt": "2026-01-23T14:30:25Z",
      "updatedAt": "2026-01-23T15:45:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 156,
    "totalPages": 8
  }
}
```

---

### 3.2 VOC 상세 조회

VOC 상세 정보를 조회합니다.

**Endpoint:** `GET /vocs/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketId": "VOC-20260123-00001",
    "title": "결제 오류 발생",
    "content": "결제 진행 중 오류가 발생했습니다...",
    "status": "PROCESSING",
    "priority": "HIGH",
    "customerName": "홍길동",
    "customerEmail": "user@example.com",
    "customerPhone": "010-****-5678",
    "mainCategory": {
      "id": 1,
      "name": "오류/버그"
    },
    "subCategory": {
      "id": 3,
      "name": "시스템 오류"
    },
    "reporter": {
      "id": 2,
      "name": "박접수"
    },
    "assignee": {
      "id": 5,
      "name": "김담당"
    },
    "attachments": [
      {
        "id": 1,
        "originalFilename": "screenshot.png",
        "fileSize": 1258291,
        "mimeType": "image/png",
        "downloadUrl": "/api/v1/vocs/1/attachments/1"
      }
    ],
    "analysis": {
      "id": 1,
      "summary": "결제 게이트웨이 타임아웃으로 분석됨",
      "suggestedCategory": {
        "id": 3,
        "name": "시스템 오류"
      },
      "suggestedPriority": "HIGH",
      "sentiment": "NEGATIVE",
      "keywords": ["결제", "오류", "타임아웃"],
      "confidence": 0.92,
      "createdAt": "2026-01-23T14:31:00Z"
    },
    "processingNote": null,
    "rejectReason": null,
    "createdAt": "2026-01-23T14:30:25Z",
    "updatedAt": "2026-01-23T15:45:00Z",
    "analysisCompletedAt": "2026-01-23T14:31:00Z",
    "processingStartedAt": "2026-01-23T14:45:00Z",
    "completedAt": null
  }
}
```

---

### 3.3 VOC 등록

새 VOC를 등록합니다.

**Endpoint:** `POST /vocs`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request (multipart/form-data):**
| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | O | 제목 (max: 200) |
| content | string | O | 내용 |
| customerName | string | O | 최종 사용자 이름 (max: 50) |
| customerEmail | string | O | 최종 사용자 이메일 |
| customerPhone | string | X | 연락처 |
| mainCategoryId | long | O | 대분류 카테고리 ID |
| subCategoryId | long | X | 중분류 카테고리 ID |
| occurrenceTime | datetime | X | 발생 시각 |
| attachments | file[] | X | 첨부파일 (최대 5개, 총 30MB) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketId": "VOC-20260123-00001",
    "status": "RECEIVED",
    "message": "VOC가 등록되었습니다. AI 분석이 시작됩니다."
  }
}
```

**Error Codes:**
| 코드 | 설명 |
|------|------|
| FILE_TOO_LARGE | 파일 크기 초과 (개당 10MB) |
| TOO_MANY_FILES | 첨부파일 개수 초과 (최대 5개) |
| INVALID_FILE_TYPE | 허용되지 않는 파일 형식 |
| CATEGORY_NOT_FOUND | 카테고리 없음 |

---

### 3.4 VOC 상태 변경

VOC 상태를 변경합니다.

**Endpoint:** `PATCH /vocs/{id}/status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "status": "COMPLETED | REJECTED | PROCESSING",
  "processingNote": "string (COMPLETED 시 필수)",
  "rejectReason": "string (REJECTED 시 필수)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketId": "VOC-20260123-00001",
    "previousStatus": "PROCESSING",
    "currentStatus": "COMPLETED",
    "message": "VOC 상태가 변경되었습니다"
  }
}
```

**Error Codes:**
| 코드 | 설명 |
|------|------|
| INVALID_STATUS_TRANSITION | 허용되지 않는 상태 전이 |
| PROCESSING_NOTE_REQUIRED | 처리 내용 필수 (COMPLETED) |
| REJECT_REASON_REQUIRED | 반려 사유 필수 (REJECTED) |

---

### 3.5 VOC 담당자 배정

VOC 담당자를 배정/변경합니다.

**Endpoint:** `PATCH /vocs/{id}/assignee`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "assigneeId": 5
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "ticketId": "VOC-20260123-00001",
    "assignee": {
      "id": 5,
      "name": "김담당"
    }
  }
}
```

---

### 3.6 VOC 첨부파일 다운로드

첨부파일을 다운로드합니다.

**Endpoint:** `GET /vocs/{vocId}/attachments/{attachmentId}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):** Binary file with appropriate Content-Type header

---

### 3.7 VOC 상태 조회 (공개)

Ticket ID와 이메일로 VOC 상태를 조회합니다. (인증 불필요)

**Endpoint:** `GET /vocs/status`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| ticketId | string | O | Ticket ID (VOC-YYYYMMDD-XXXXX) |
| email | string | O | 최종 사용자 이메일 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ticketId": "VOC-20260123-00001",
    "title": "결제 오류 발생",
    "status": "PROCESSING",
    "statusHistory": [
      {
        "status": "RECEIVED",
        "changedAt": "2026-01-23T14:30:25Z"
      },
      {
        "status": "ANALYZING",
        "changedAt": "2026-01-23T14:30:30Z"
      },
      {
        "status": "PROCESSING",
        "changedAt": "2026-01-23T14:45:00Z"
      }
    ],
    "category": "오류/버그 > 시스템 오류",
    "createdAt": "2026-01-23T14:30:25Z"
  }
}
```

**Rate Limit:** 분당 10건

**Error Codes:**
| 코드 | 설명 |
|------|------|
| VOC_NOT_FOUND | VOC 없음 또는 이메일 불일치 |
| RATE_LIMITED | 요청 제한 초과 |

---

### 3.8 유사 VOC 조회

해당 VOC와 유사한 VOC 목록을 조회합니다.

**Endpoint:** `GET /vocs/{id}/similar`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| limit | integer | X | 조회 개수 (기본: 5, 최대: 20) |
| minScore | float | X | 최소 유사도 (기본: 0.7) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "ticketId": "VOC-20260120-00045",
      "title": "결제 타임아웃 오류",
      "status": "COMPLETED",
      "similarityScore": 0.92,
      "matchedKeywords": ["결제", "타임아웃"],
      "processingNote": "결제 게이트웨이 타임아웃 설정 조정으로 해결",
      "createdAt": "2026-01-20T10:15:00Z",
      "completedAt": "2026-01-20T14:30:00Z"
    }
  ]
}
```

---

### 3.9 VOC 메모 목록 조회

VOC 메모 목록을 조회합니다.

**Endpoint:** `GET /vocs/{id}/memos`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "고객에게 1차 연락 완료",
      "author": {
        "id": 5,
        "name": "김담당"
      },
      "isInternal": true,
      "createdAt": "2026-01-23T15:00:00Z",
      "updatedAt": "2026-01-23T15:00:00Z"
    }
  ]
}
```

---

### 3.10 VOC 메모 등록

VOC에 메모를 추가합니다.

**Endpoint:** `POST /vocs/{id}/memos`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "content": "string (required)",
  "isInternal": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "content": "결제 게이트웨이 확인 결과 정상",
    "author": {
      "id": 5,
      "name": "김담당"
    },
    "isInternal": true,
    "createdAt": "2026-01-23T16:00:00Z"
  }
}
```

---

### 3.11 VOC 상태 이력 조회

VOC 상태 변경 이력을 조회합니다.

**Endpoint:** `GET /vocs/{id}/history`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fromStatus": null,
      "toStatus": "RECEIVED",
      "changedBy": {
        "id": 2,
        "name": "박접수"
      },
      "changeReason": "VOC 등록",
      "createdAt": "2026-01-23T14:30:25Z"
    },
    {
      "id": 2,
      "fromStatus": "RECEIVED",
      "toStatus": "ANALYZING",
      "changedBy": {
        "id": 0,
        "name": "System"
      },
      "changeReason": "AI 분석 시작",
      "createdAt": "2026-01-23T14:30:30Z"
    }
  ]
}
```

---

### 3.12 AI 분석 로그 조회

AI 분석에서 수집된 로그를 조회합니다.

**Endpoint:** `GET /vocs/{id}/analysis/logs`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "logSource": "payment-service",
      "logPeriod": "2026-01-23T14:20:00Z ~ 2026-01-23T14:30:00Z",
      "logContent": "[ERROR] PaymentGateway timeout after 30000ms...",
      "analysis": "결제 게이트웨이 연동 시 타임아웃 발생",
      "errorCode": "GATEWAY_TIMEOUT",
      "createdAt": "2026-01-23T14:31:00Z"
    }
  ]
}
```

---

### 3.13 AI 분석 DB 조회 결과

AI 분석에서 수집된 DB 조회 결과를 조회합니다.

**Endpoint:** `GET /vocs/{id}/analysis/queries`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "queryName": "결제 트랜잭션 조회",
      "queryDescription": "해당 주문의 결제 시도 내역",
      "resultData": {
        "orderId": "ORD-20260123-12345",
        "attempts": 3,
        "lastAttemptStatus": "TIMEOUT",
        "gatewayResponse": "Connection timeout"
      },
      "recordCount": 1,
      "createdAt": "2026-01-23T14:31:00Z"
    }
  ]
}
```

---

## 4. 카테고리 API

### 4.1 카테고리 트리 조회

전체 카테고리를 트리 구조로 조회합니다.

**Endpoint:** `GET /categories/tree`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| includeInactive | boolean | X | 비활성 포함 여부 (기본: false) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "오류/버그",
      "type": "MAIN",
      "isActive": true,
      "sortOrder": 1,
      "children": [
        {
          "id": 3,
          "name": "시스템 오류",
          "type": "SUB",
          "isActive": true,
          "sortOrder": 1
        },
        {
          "id": 4,
          "name": "UI/UX 오류",
          "type": "SUB",
          "isActive": true,
          "sortOrder": 2
        }
      ]
    }
  ]
}
```

---

### 4.2 카테고리 목록 조회

카테고리 목록을 플랫하게 조회합니다.

**Endpoint:** `GET /categories`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| type | string | X | 유형 필터 (MAIN, SUB) |
| parentId | long | X | 상위 카테고리 ID |
| isActive | boolean | X | 활성 여부 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "오류/버그",
      "type": "MAIN",
      "parentId": null,
      "description": "시스템 오류, 버그 관련 VOC",
      "isActive": true,
      "sortOrder": 1,
      "vocCount": 127,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-23T14:22:00Z"
    }
  ]
}
```

---

### 4.3 카테고리 상세 조회

카테고리 상세 정보를 조회합니다.

**Endpoint:** `GET /categories/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "오류/버그",
    "type": "MAIN",
    "parentId": null,
    "parent": null,
    "description": "시스템 오류, 버그 관련 VOC",
    "isActive": true,
    "sortOrder": 1,
    "vocCount": 127,
    "children": [
      {
        "id": 3,
        "name": "시스템 오류"
      }
    ],
    "createdAt": "2026-01-15T10:30:00Z",
    "createdBy": {
      "id": 1,
      "name": "관리자"
    },
    "updatedAt": "2026-01-23T14:22:00Z",
    "updatedBy": {
      "id": 1,
      "name": "관리자"
    }
  }
}
```

---

### 4.4 카테고리 등록

새 카테고리를 등록합니다. (ADMIN 권한)

**Endpoint:** `POST /categories`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "string (required, max: 100)",
  "type": "MAIN | SUB (required)",
  "parentId": "long (SUB인 경우 required)",
  "description": "string (max: 200)",
  "sortOrder": "integer (required, min: 1)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "보안",
    "type": "MAIN",
    "isActive": true,
    "sortOrder": 4
  }
}
```

---

### 4.5 카테고리 수정

카테고리 정보를 수정합니다. (ADMIN 권한)

**Endpoint:** `PUT /categories/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "string (max: 100)",
  "description": "string (max: 200)",
  "isActive": "boolean",
  "sortOrder": "integer (min: 1)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "오류/버그 (수정)",
    "isActive": true
  }
}
```

**Error Codes:**
| 코드 | 설명 |
|------|------|
| CATEGORY_IN_USE | 사용 중인 카테고리 삭제 불가 |
| PARENT_INACTIVE | 상위 카테고리가 비활성 상태 |

---

### 4.6 카테고리 삭제

카테고리를 삭제합니다. (ADMIN 권한, 사용 중인 경우 불가)

**Endpoint:** `DELETE /categories/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204):** No Content

**Error Codes:**
| 코드 | 설명 |
|------|------|
| CATEGORY_IN_USE | 사용 중인 카테고리 삭제 불가 |
| HAS_CHILDREN | 하위 카테고리가 있어 삭제 불가 |

---

## 5. 사용자 API

### 5.1 사용자 목록 조회

사용자 목록을 조회합니다. (ADMIN 권한)

**Endpoint:** `GET /users`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| page | integer | X | 페이지 번호 (기본: 1) |
| size | integer | X | 페이지 크기 (기본: 20) |
| role | string | X | 역할 필터 (REPORTER, HANDLER, ADMIN) |
| status | string | X | 상태 필터 (ACTIVE, INACTIVE, LOCKED, TEMP_PASSWORD) |
| keyword | string | X | 이름/이메일 검색 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "name": "관리자",
      "role": "ADMIN",
      "department": "IT팀",
      "position": "팀장",
      "status": "ACTIVE",
      "lastLoginAt": "2026-01-25T09:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "size": 20,
    "totalElements": 25,
    "totalPages": 2
  }
}
```

---

### 5.2 사용자 상세 조회

사용자 상세 정보를 조회합니다. (ADMIN 권한)

**Endpoint:** `GET /users/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "username": "handler01",
    "email": "handler01@example.com",
    "name": "김담당",
    "role": "HANDLER",
    "department": "고객지원팀",
    "position": "대리",
    "status": "ACTIVE",
    "isTemporaryPassword": false,
    "loginFailCount": 0,
    "lastLoginAt": "2026-01-25T08:30:00Z",
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-20T14:00:00Z"
  }
}
```

---

### 5.3 사용자 등록

새 사용자를 등록합니다. (ADMIN 권한)

**Endpoint:** `POST /users`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "username": "string (required, max: 50)",
  "email": "string (required, max: 100)",
  "name": "string (required, max: 50)",
  "role": "REPORTER | HANDLER | ADMIN (required)",
  "department": "string (max: 100)",
  "position": "string (max: 50)"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 26,
    "username": "newuser",
    "email": "newuser@example.com",
    "name": "신규사용자",
    "role": "REPORTER",
    "status": "TEMP_PASSWORD",
    "temporaryPassword": "Abc12345!",
    "message": "임시 비밀번호가 이메일로 발송되었습니다"
  }
}
```

**Error Codes:**
| 코드 | 설명 |
|------|------|
| USERNAME_DUPLICATE | 아이디 중복 |
| EMAIL_DUPLICATE | 이메일 중복 |

---

### 5.4 사용자 수정

사용자 정보를 수정합니다. (ADMIN 권한)

**Endpoint:** `PUT /users/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "email": "string (max: 100)",
  "name": "string (max: 50)",
  "role": "REPORTER | HANDLER | ADMIN",
  "department": "string (max: 100)",
  "position": "string (max: 50)",
  "status": "ACTIVE | INACTIVE"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "김담당 (수정)",
    "role": "HANDLER"
  }
}
```

---

### 5.5 사용자 삭제

사용자를 삭제합니다. (ADMIN 권한, 실제로는 비활성화)

**Endpoint:** `DELETE /users/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204):** No Content

---

### 5.6 비밀번호 초기화

사용자 비밀번호를 초기화합니다. (ADMIN 권한)

**Endpoint:** `POST /users/{id}/reset-password`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "임시 비밀번호가 이메일로 발송되었습니다"
  }
}
```

---

### 5.7 계정 잠금 해제

잠긴 계정을 해제합니다. (ADMIN 권한)

**Endpoint:** `POST /users/{id}/unlock`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "ACTIVE",
    "message": "계정 잠금이 해제되었습니다"
  }
}
```

---

## 6. 이메일 API

### 6.1 이메일 템플릿 목록 조회

이메일 템플릿 목록을 조회합니다.

**Endpoint:** `GET /email-templates`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| isActive | boolean | X | 활성 여부 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "VOC 완료 안내 (기본)",
      "code": "VOC_COMPLETED",
      "isActive": true,
      "isSystem": true,
      "createdAt": "2026-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "VOC 반려 안내",
      "code": "VOC_REJECTED",
      "isActive": true,
      "isSystem": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### 6.2 이메일 템플릿 상세 조회

이메일 템플릿 상세를 조회합니다.

**Endpoint:** `GET /email-templates/{id}`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "VOC 완료 안내 (기본)",
    "code": "VOC_COMPLETED",
    "subject": "[{{ticketId}}] VOC 처리 완료 안내",
    "body": "안녕하세요.\n\n고객님께서 문의하신 [{{title}}] 건이 처리 완료되었습니다.\n\n처리 내용:\n{{processingNote}}\n\n감사합니다.",
    "isActive": true,
    "isSystem": true,
    "availableVariables": [
      "ticketId",
      "title",
      "status",
      "processingNote",
      "rejectReason"
    ],
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-15T10:00:00Z"
  }
}
```

---

### 6.3 이메일 발송

VOC 관련 이메일을 발송합니다.

**Endpoint:** `POST /vocs/{vocId}/emails`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "templateId": "long (optional)",
  "subject": "string (required, max: 200)",
  "body": "string (required, max: 2000)"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "recipient": "user@example.com",
    "subject": "[VOC-20260123-00001] VOC 처리 완료 안내",
    "status": "SENT",
    "sentAt": "2026-01-25T10:30:00Z"
  }
}
```

---

### 6.4 이메일 발송 이력 조회

VOC의 이메일 발송 이력을 조회합니다.

**Endpoint:** `GET /vocs/{vocId}/emails`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "recipient": "user@example.com",
      "subject": "[VOC-20260123-00001] VOC 처리 완료 안내",
      "status": "SENT",
      "sentBy": {
        "id": 5,
        "name": "김담당"
      },
      "sentAt": "2026-01-25T10:30:00Z",
      "createdAt": "2026-01-25T10:30:00Z"
    }
  ]
}
```

---

## 7. 통계 API

### 7.1 대시보드 KPI 조회

대시보드 KPI 데이터를 조회합니다.

**Endpoint:** `GET /statistics/kpi`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| period | string | X | 기간 (TODAY, WEEK, MONTH, 기본: WEEK) |
| startDate | date | X | 사용자 지정 시작일 |
| endDate | date | X | 사용자 지정 종료일 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "period": {
      "type": "WEEK",
      "startDate": "2026-01-19",
      "endDate": "2026-01-25"
    },
    "totalCount": 1234,
    "totalCountChange": 12.5,
    "avgProcessingTimeHours": 2.3,
    "avgProcessingTimeChange": -5.2,
    "completionRate": 54.9,
    "completionRateChange": 3.1,
    "inProgressCount": 234,
    "inProgressPercentage": 18.96
  }
}
```

---

### 7.2 기간별 VOC 추이 조회

기간별 VOC 접수 추이를 조회합니다.

**Endpoint:** `GET /statistics/trend`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| period | string | X | 기간 (WEEK, MONTH, 기본: WEEK) |
| startDate | date | X | 사용자 지정 시작일 |
| endDate | date | X | 사용자 지정 종료일 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "labels": ["01/19", "01/20", "01/21", "01/22", "01/23", "01/24", "01/25"],
    "datasets": [
      {
        "label": "VOC 접수 건수",
        "data": [45, 52, 48, 61, 55, 67, 58]
      }
    ]
  }
}
```

---

### 7.3 카테고리별 VOC 현황 조회

카테고리별 VOC 현황을 조회합니다.

**Endpoint:** `GET /statistics/by-category`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| period | string | X | 기간 (TODAY, WEEK, MONTH) |
| limit | integer | X | 조회 개수 (기본: 10) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "labels": ["오류/버그", "문의", "개선", "불만", "칭찬"],
    "datasets": [
      {
        "label": "VOC 건수",
        "data": [456, 389, 234, 78, 45]
      }
    ]
  }
}
```

---

### 7.4 상태별 VOC 현황 조회

상태별 VOC 현황을 조회합니다.

**Endpoint:** `GET /statistics/by-status`

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| period | string | X | 기간 (TODAY, WEEK, MONTH) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "labels": ["완료", "처리중", "분석중", "접수", "반려", "분석실패"],
    "datasets": [
      {
        "data": [678, 234, 156, 89, 45, 32],
        "percentages": [54.9, 19.0, 12.6, 7.2, 3.6, 2.6]
      }
    ]
  }
}
```

---

## 8. 권한 매트릭스

| API | REPORTER | HANDLER | ADMIN |
|-----|----------|---------|-------|
| 로그인/로그아웃 | O | O | O |
| 비밀번호 변경 | O | O | O |
| VOC 등록 | O | O | O |
| VOC 목록 조회 | 본인 등록 | O | O |
| VOC 상세 조회 | 본인 등록 | O | O |
| VOC 상태 변경 | X | O | O |
| VOC 담당자 배정 | X | O | O |
| VOC 메모 작성 | X | O | O |
| 이메일 발송 | X | O | O |
| 카테고리 조회 | O | O | O |
| 카테고리 관리 | X | X | O |
| 사용자 조회 | X | X | O |
| 사용자 관리 | X | X | O |
| 통계 조회 | X | O | O |

---

## 9. Rate Limiting

| 엔드포인트 | 제한 |
|------------|------|
| POST /auth/login | 5회/분 (IP당) |
| GET /vocs/status | 10회/분 (IP당) |
| 기타 인증된 API | 100회/분 (사용자당) |

---

## 10. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-01-25 | Claude | 최초 작성 |
