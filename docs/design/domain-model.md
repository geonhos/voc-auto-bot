# VOC Auto Bot - 도메인 모델 설계

> 버전: 1.1
> 작성일: 2026-01-23
> 수정일: 2026-02-04
> 관련 이슈: #39

## 1. 개요

VOC Auto Bot 시스템의 도메인 모델을 정의합니다. 이 문서는 화면 정의서(SC-01 ~ SC-11)를 기반으로 도출된 Entity, 속성, 관계, 상태 흐름 및 비즈니스 규칙을 포함합니다.

---

## 2. Entity 정의

### 2.1 User (사용자)

시스템 사용자 정보를 관리합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| username | String(50) | O | 로그인 아이디, UK |
| password | String(255) | O | 암호화된 비밀번호 |
| email | String(100) | O | 이메일 주소, UK |
| name | String(50) | O | 실명 |
| role | Enum | O | 역할 (REPORTER, HANDLER, ADMIN) |
| department | String(100) | X | 부서명 |
| position | String(50) | X | 직급/직책 |
| status | Enum | O | 상태 (ACTIVE, INACTIVE, LOCKED, TEMP_PASSWORD) |
| isTemporaryPassword | Boolean | O | 임시 비밀번호 여부 |
| loginFailCount | Integer | O | 연속 로그인 실패 횟수 (기본: 0) |
| lastLoginAt | DateTime | X | 마지막 로그인 일시 |
| createdAt | DateTime | O | 생성일시 |
| updatedAt | DateTime | O | 수정일시 |

**역할(Role) 정의:**
- `REPORTER` (VOC 접수자): VOC 등록, 자신이 등록한 VOC 조회
- `HANDLER` (처리 담당자): VOC 조회/처리, 이메일 발송
- `ADMIN` (관리자): 전체 VOC 관리, 사용자/카테고리 관리, 통계 조회

**상태(Status) 정의:**
- `ACTIVE`: 활성 계정
- `INACTIVE`: 비활성 계정
- `LOCKED`: 잠금 (로그인 5회 연속 실패)
- `TEMP_PASSWORD`: 임시 비밀번호 발급 상태

---

### 2.2 Voc (VOC)

고객의 목소리(Voice of Customer) 데이터를 관리합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| ticketId | String(22) | O | Ticket ID, UK, 형식: VOC-YYYYMMDD-XXXXX |
| title | String(200) | O | VOC 제목 |
| content | Text | O | VOC 상세 내용 |
| customerName | String(50) | O | 최종 사용자 이름 |
| customerEmail | String(100) | O | 최종 사용자 이메일 |
| customerPhone | String(20) | X | 최종 사용자 연락처 |
| mainCategoryId | Long | O | 대분류 카테고리 FK |
| subCategoryId | Long | X | 중분류 카테고리 FK |
| status | Enum | O | VOC 상태 |
| priority | Enum | O | 우선순위 (LOW, MEDIUM, HIGH, URGENT) |
| reporterId | Long | O | 접수자 FK |
| assigneeId | Long | X | 담당자 FK |
| processingNote | Text | X | 처리 내용 |
| rejectReason | Text | X | 반려 사유 |
| analysisCompletedAt | DateTime | X | AI 분석 완료 일시 |
| processingStartedAt | DateTime | X | 처리 시작 일시 |
| completedAt | DateTime | X | 완료 일시 |
| createdAt | DateTime | O | 접수 일시 |
| updatedAt | DateTime | O | 수정일시 |

**Ticket ID 형식:**
- 형식: `VOC-YYYYMMDD-XXXXX`
- 예시: `VOC-20260123-00001`
- 생성 규칙: 날짜 + 일일 순번(5자리, zero-padding)

---

### 2.3 VocAttachment (VOC 첨부파일)

VOC에 첨부된 파일을 관리합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK |
| originalFilename | String(255) | O | 원본 파일명 |
| storedFilename | String(255) | O | 저장된 파일명 (UUID) |
| filePath | String(500) | O | 저장 경로 |
| fileSize | Long | O | 파일 크기 (bytes) |
| mimeType | String(100) | O | MIME 타입 |
| createdAt | DateTime | O | 업로드 일시 |

**제약조건:**
- VOC당 최대 5개 첨부 가능
- 파일당 최대 10MB
- 전체 합계 최대 30MB

---

### 2.4 Category (카테고리)

VOC 분류 체계를 관리합니다 (대분류/중분류 2단계).

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| name | String(100) | O | 카테고리명 |
| type | Enum | O | 유형 (MAIN: 대분류, SUB: 중분류) |
| parentId | Long | X | 상위 카테고리 FK (중분류인 경우) |
| description | Text | X | 설명 |
| isActive | Boolean | O | 활성 여부 (기본: true) |
| sortOrder | Integer | O | 정렬 순서 |
| createdAt | DateTime | O | 생성일시 |
| updatedAt | DateTime | O | 수정일시 |

**계층 구조:**
- `MAIN` (대분류): parentId = null
- `SUB` (중분류): parentId = 대분류 ID

---

### 2.5 VocAnalysis (VOC AI 분석 결과)

AI가 분석한 VOC 결과를 저장합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK, UK |
| summary | Text | O | AI 요약 |
| suggestedCategoryId | Long | X | AI 추천 카테고리 FK |
| suggestedPriority | Enum | X | AI 추천 우선순위 |
| sentiment | Enum | X | 감정 분석 (POSITIVE, NEUTRAL, NEGATIVE) |
| keywords | JSON | X | 추출된 키워드 배열 |
| confidence | Decimal(3,2) | O | 분석 신뢰도 (0.00 ~ 1.00) |
| rawResponse | JSON | X | AI 원본 응답 |
| createdAt | DateTime | O | 분석 일시 |

---

### 2.6 LogAnalysisResult (로그 분석 결과)

VOC 관련 시스템 로그 분석 결과를 저장합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK |
| logSource | String(100) | O | 로그 소스 (예: payment-service, auth-service) |
| logPeriod | String(50) | O | 조회 기간 |
| logContent | Text | O | 로그 내용 (마스킹 적용) |
| analysis | Text | O | 분석 결과 |
| errorCode | String(50) | X | 발견된 에러 코드 |
| createdAt | DateTime | O | 분석 일시 |

---

### 2.7 DbQueryResult (DB 조회 결과)

VOC 관련 데이터베이스 조회 결과를 저장합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK |
| queryName | String(100) | O | 조회 쿼리명 |
| queryDescription | String(255) | O | 조회 설명 |
| resultData | JSON | O | 조회 결과 (마스킹 적용) |
| recordCount | Integer | O | 결과 레코드 수 |
| createdAt | DateTime | O | 조회 일시 |

---

### 2.8 SimilarVoc (유사 VOC)

AI가 분석한 유사 VOC 매핑 정보입니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | 원본 VOC FK |
| similarVocId | Long | O | 유사 VOC FK |
| similarityScore | Decimal(3,2) | O | 유사도 점수 (0.00 ~ 1.00) |
| matchedKeywords | JSON | X | 일치 키워드 배열 |
| createdAt | DateTime | O | 생성일시 |

**제약조건:**
- UK: (vocId, similarVocId)
- 자기 자신 참조 불가

---

### 2.9 VocMemo (VOC 메모)

VOC에 대한 내부 메모를 관리합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK |
| authorId | Long | O | 작성자 FK |
| content | Text | O | 메모 내용 |
| isInternal | Boolean | O | 내부 메모 여부 (기본: true) |
| createdAt | DateTime | O | 작성일시 |
| updatedAt | DateTime | O | 수정일시 |

---

### 2.10 VocStatusHistory (VOC 상태 이력)

VOC 상태 변경 이력을 추적합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK |
| fromStatus | Enum | X | 이전 상태 (최초 생성 시 null) |
| toStatus | Enum | O | 변경된 상태 |
| changedById | Long | O | 변경자 FK |
| changeReason | Text | X | 변경 사유 |
| createdAt | DateTime | O | 변경 일시 |

---

### 2.11 EmailTemplate (이메일 템플릿)

이메일 발송용 템플릿을 관리합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| name | String(100) | O | 템플릿명 |
| code | String(50) | O | 템플릿 코드, UK |
| subject | String(200) | O | 이메일 제목 템플릿 |
| body | Text | O | 이메일 본문 템플릿 |
| isActive | Boolean | O | 활성 여부 |
| isSystem | Boolean | O | 시스템 기본 템플릿 여부 |
| createdAt | DateTime | O | 생성일시 |
| updatedAt | DateTime | O | 수정일시 |

**템플릿 변수:**
- `{{ticketId}}` - VOC 접수번호
- `{{title}}` - VOC 제목
- `{{status}}` - 처리 상태
- `{{processingNote}}` - 처리 내용
- `{{rejectReason}}` - 반려 사유

---

### 2.12 EmailLog (이메일 발송 이력)

이메일 발송 이력을 관리합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| vocId | Long | O | VOC FK |
| templateId | Long | X | 사용된 템플릿 FK |
| recipient | String(100) | O | 수신자 이메일 |
| subject | String(200) | O | 발송된 제목 |
| body | Text | O | 발송된 본문 |
| status | Enum | O | 발송 상태 (PENDING, SENT, FAILED) |
| sentAt | DateTime | X | 발송 일시 |
| failReason | Text | X | 실패 사유 |
| sentById | Long | O | 발송자 FK |
| createdAt | DateTime | O | 생성일시 |

---

### 2.13 AuditLog (감사 로그)

시스템 전반의 주요 활동을 기록합니다.

| 속성명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| id | Long | O | PK, 자동 생성 |
| entityType | String(50) | O | 대상 Entity 타입 (VOC, USER, CATEGORY 등) |
| entityId | Long | O | 대상 Entity ID |
| action | String(50) | O | 수행 작업 (CREATE, UPDATE, DELETE, STATUS_CHANGE 등) |
| actorId | Long | O | 수행자 FK |
| actorIp | String(45) | X | 수행자 IP (IPv6 지원) |
| beforeData | JSON | X | 변경 전 데이터 |
| afterData | JSON | X | 변경 후 데이터 |
| description | Text | X | 활동 설명 |
| createdAt | DateTime | O | 발생 일시 |

---

## 3. VOC 상태 흐름

### 3.1 상태 정의

| 상태 | 코드 | 설명 | 종료 상태 |
|------|------|------|----------|
| 접수 | NEW | VOC가 시스템에 등록됨 | - |
| 처리중 | IN_PROGRESS | 담당자가 VOC를 처리 중 | - |
| 분석실패 | PENDING | AI 분석 실패 (수동 처리 필요) | - |
| 완료 | RESOLVED | VOC 처리 완료 | **O** |
| 반려 | REJECTED | VOC 반려 (처리 불가) | **O** |
| 종료 | CLOSED | VOC 종료 | **O** |

**종료 상태 (Terminal Status)**: 완료(RESOLVED), 반려(REJECTED), 종료(CLOSED)는 종료 상태로, 다른 상태로 전이할 수 없습니다.

### 3.2 상태 전이 다이어그램

```
┌──────────┐
│          │
│   NEW    │──────────────────────────────────────┐
│  (접수)   │                                      │
│          │                                      │
└────┬─────┘                                      │
     │                                            │
     │ 처리중 전환                                 │
     ▼                                            │
┌───────────┐     ┌───────────┐                  │
│           │     │           │                  │
│IN_PROGRESS├────►│ RESOLVED  │◄─────────────────┤
│ (처리중)   │     │  (완료)    │  완료 처리        │
│           │     │           │                  │
└─────┬─────┘     └───────────┘                  │
      │           [종료 상태]                      │
      │                                          │
      │           ┌───────────┐                  │
      │           │           │                  │
      └──────────►│ REJECTED  │◄─────────────────┘
       반려        │  (반려)    │  반려 처리
                  │           │
                  └───────────┘
                  [종료 상태]

┌──────────┐
│          │
│ PENDING  │───────────────────────┐
│(분석실패) │                       │
│          │                       ▼
└──────────┘              RESOLVED 또는 REJECTED
```

**주요 변경점**:
- 완료(RESOLVED)와 반려(REJECTED)는 **종료 상태**로, 다른 상태로 전이 불가
- 접수(NEW) 상태에서 바로 완료/반려로 전이 가능

### 3.3 상태 전이 규칙

| 현재 상태 | 전이 가능 상태 | 전이 조건 | 권한 |
|-----------|----------------|-----------|------|
| NEW | IN_PROGRESS | 처리 시작 | HANDLER, ADMIN |
| NEW | RESOLVED | 바로 완료 처리 | HANDLER, ADMIN |
| NEW | REJECTED | 바로 반려 처리 | HANDLER, ADMIN |
| IN_PROGRESS | RESOLVED | 처리 완료 | HANDLER, ADMIN |
| IN_PROGRESS | REJECTED | 반려 | HANDLER, ADMIN |
| PENDING | RESOLVED | 완료 처리 | HANDLER, ADMIN |
| PENDING | REJECTED | 반려 | HANDLER, ADMIN |
| RESOLVED | - | **종료 상태 (전이 불가)** | - |
| REJECTED | - | **종료 상태 (전이 불가)** | - |
| CLOSED | - | **종료 상태 (전이 불가)** | - |

**종료 상태 비즈니스 규칙**:
- RESOLVED, REJECTED, CLOSED는 종료 상태로 어떤 상태로도 전이할 수 없습니다.
- 잘못된 종료 상태를 수정해야 하는 경우 관리자가 새로운 VOC를 생성해야 합니다.

---

## 4. ERD (Entity Relationship Diagram)

```
┌─────────────────┐          ┌─────────────────┐
│      USER       │          │    CATEGORY     │
├─────────────────┤          ├─────────────────┤
│ id (PK)         │          │ id (PK)         │
│ username (UK)   │          │ name            │
│ password        │          │ type            │
│ email (UK)      │          │ parentId (FK)   │──┐
│ name            │          │ description     │  │ self-reference
│ role            │          │ isActive        │  │ (SUB → MAIN)
│ department      │          │ sortOrder       │◄─┘
│ position        │          │ createdAt       │
│ status          │          │ updatedAt       │
│ isTemporaryPwd  │          └────────┬────────┘
│ loginFailCount  │                   │
│ lastLoginAt     │                   │ 1
│ createdAt       │                   │
│ updatedAt       │                   │
└────────┬────────┘                   │
         │                            │
         │ 1                          │
         │                            │
         ▼ N                          ▼ N
┌─────────────────────────────────────────────────────────────┐
│                            VOC                              │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                     │
│ ticketId (UK)                                               │
│ title                                                       │
│ content                                                     │
│ customerName                                                │
│ customerEmail                                               │
│ customerPhone                                               │
│ mainCategoryId (FK) ─────────────────────────────┘         │
│ subCategoryId (FK)  ─────────────────────────────┘         │
│ status                                                      │
│ priority                                                    │
│ reporterId (FK) ─────────────────────────────────┘         │
│ assigneeId (FK) ─────────────────────────────────┘         │
│ processingNote                                              │
│ rejectReason                                                │
│ analysisCompletedAt                                         │
│ processingStartedAt                                         │
│ completedAt                                                 │
│ createdAt                                                   │
│ updatedAt                                                   │
└────┬───────────────┬──────────────┬────────────┬───────────┘
     │               │              │            │
     │ 1             │ 1            │ 1          │ 1
     │               │              │            │
     ▼ N             ▼ 0..1         ▼ N          ▼ N
┌────────────┐ ┌─────────────┐ ┌──────────────┐ ┌────────────────┐
│VOC_ATTACH  │ │VOC_ANALYSIS │ │LOG_ANALYSIS  │ │DB_QUERY_RESULT │
│MENT        │ │             │ │_RESULT       │ │                │
├────────────┤ ├─────────────┤ ├──────────────┤ ├────────────────┤
│id (PK)     │ │id (PK)      │ │id (PK)       │ │id (PK)         │
│vocId (FK)  │ │vocId (FK,UK)│ │vocId (FK)    │ │vocId (FK)      │
│originalFn  │ │summary      │ │logSource     │ │queryName       │
│storedFn    │ │suggestedCat │ │logPeriod     │ │queryDescription│
│filePath    │ │suggestedPri │ │logContent    │ │resultData      │
│fileSize    │ │sentiment    │ │analysis      │ │recordCount     │
│mimeType    │ │keywords     │ │errorCode     │ │createdAt       │
│createdAt   │ │confidence   │ │createdAt     │ └────────────────┘
└────────────┘ │rawResponse  │ └──────────────┘
               │createdAt    │
               └─────────────┘

┌───────────────────────────────────────────────────────────┐
│                     (VOC 관계 계속)                        │
└────┬───────────────┬──────────────┬───────────────────────┘
     │               │              │
     │ 1             │ 1            │ 1
     │               │              │
     ▼ N             ▼ N            ▼ N
┌────────────┐ ┌─────────────────┐ ┌──────────────────┐
│SIMILAR_VOC │ │VOC_STATUS_      │ │    VOC_MEMO      │
│            │ │HISTORY          │ │                  │
├────────────┤ ├─────────────────┤ ├──────────────────┤
│id (PK)     │ │id (PK)          │ │id (PK)           │
│vocId (FK)  │ │vocId (FK)       │ │vocId (FK)        │
│similarVocId│ │fromStatus       │ │authorId (FK)     │
│(FK)        │ │toStatus         │ │content           │
│similarity  │ │changedById (FK) │ │isInternal        │
│Score       │ │changeReason     │ │createdAt         │
│matchedKw   │ │createdAt        │ │updatedAt         │
│createdAt   │ └─────────────────┘ └──────────────────┘
└────────────┘

┌─────────────────┐      ┌─────────────────┐
│ EMAIL_TEMPLATE  │      │    EMAIL_LOG    │
├─────────────────┤      ├─────────────────┤
│ id (PK)         │◄──┐  │ id (PK)         │
│ name            │   │  │ vocId (FK)      │
│ code (UK)       │   │  │ templateId (FK) ├─┘
│ subject         │   │  │ recipient       │
│ body            │   │  │ subject         │
│ isActive        │   │  │ body            │
│ isSystem        │   │  │ status          │
│ createdAt       │   │  │ sentAt          │
│ updatedAt       │   │  │ failReason      │
└─────────────────┘   │  │ sentById (FK)   │
                      │  │ createdAt       │
                      │  └─────────────────┘
                      │
                      └── 0..1

┌─────────────────┐
│   AUDIT_LOG     │
├─────────────────┤
│ id (PK)         │
│ entityType      │
│ entityId        │
│ action          │
│ actorId (FK)    │
│ actorIp         │
│ beforeData      │
│ afterData       │
│ description     │
│ createdAt       │
└─────────────────┘
```

---

## 5. 비즈니스 규칙

### 5.1 사용자 관련

| ID | 규칙 | 설명 |
|----|------|------|
| BR-U01 | 로그인 실패 잠금 | 5회 연속 로그인 실패 시 계정 잠금 (LOCKED) |
| BR-U02 | 비밀번호 정책 | 최소 8자, 대소문자/숫자/특수문자 포함 |
| BR-U03 | 임시 비밀번호 | 임시 비밀번호 로그인 시 비밀번호 변경 강제 |
| BR-U04 | 권한 상속 | ADMIN > HANDLER > REPORTER 권한 포함 |

### 5.2 VOC 관련

| ID | 규칙 | 설명 |
|----|------|------|
| BR-V01 | Ticket ID 자동생성 | 형식: VOC-YYYYMMDD-XXXXX (일일 순번) |
| BR-V02 | 자동 분석 시작 | VOC 등록 즉시 AI 분석 자동 시작 |
| BR-V03 | 첨부파일 제한 | 최대 5개, 개당 10MB, 총 30MB |
| BR-V04 | 담당자 자동배정 | 카테고리별 기본 담당자 자동 배정 (설정 시) |
| BR-V05 | 상태 변경 이력 | 모든 상태 변경은 이력 자동 기록 |
| BR-V06 | 완료/반려 이메일 | 완료/반려 시 최종 사용자에게 이메일 발송 |

### 5.3 카테고리 관련

| ID | 규칙 | 설명 |
|----|------|------|
| BR-C01 | 2단계 계층 | 대분류(MAIN) > 중분류(SUB) 2단계만 지원 |
| BR-C02 | 비활성화 제약 | 사용 중인 카테고리는 비활성화만 가능 (삭제 불가) |
| BR-C03 | 대분류 필수 | VOC 등록 시 대분류 필수, 중분류 선택 |
| BR-C04 | 하위 카테고리 연동 | 대분류 비활성화 시 하위 중분류도 비활성화 |

### 5.4 이메일 관련

| ID | 규칙 | 설명 |
|----|------|------|
| BR-E01 | 템플릿 변수 치환 | 발송 시 템플릿 변수 자동 치환 |
| BR-E02 | 시스템 템플릿 보호 | isSystem=true 템플릿은 삭제 불가 |
| BR-E03 | 발송 실패 재시도 | 발송 실패 시 최대 3회 재시도 |
| BR-E04 | 발송 이력 보관 | 모든 발송 이력 영구 보관 |

### 5.5 보안 관련

| ID | 규칙 | 설명 |
|----|------|------|
| BR-S01 | 데이터 마스킹 | 민감정보(이메일, 연락처) 부분 마스킹 표시 |
| BR-S02 | 감사 로그 | 주요 활동(생성/수정/삭제/상태변경) 자동 기록 |
| BR-S03 | 상태 조회 인증 | Ticket ID + 이메일 일치 시에만 상태 조회 허용 |
| BR-S04 | Rate Limiting | 상태 조회 API: 분당 10건 제한 |

---

## 6. 통계 관련 Derived Data

Dashboard(SC-11)에서 사용되는 통계 데이터입니다. 실시간 집계 또는 배치 처리로 생성됩니다.

### 6.1 KPI 지표

| 지표 | 산출 방식 |
|------|-----------|
| 총 접수 건수 | 기간 내 VOC count |
| 평균 처리 시간 | AVG(completedAt - createdAt) for COMPLETED status |
| 완료율 | COMPLETED count / Total count × 100 |
| 처리 중 건수 | PROCESSING status count |

### 6.2 차트 데이터

| 차트 | 데이터 |
|------|--------|
| 기간별 추이 | 일별/주별/월별 VOC 접수 건수 |
| 카테고리별 현황 | 대분류별 VOC 건수 (상위 10개) |
| 상태별 현황 | 상태별 VOC 건수 및 비율 |

---

## 7. 인덱스 전략

### 7.1 권장 인덱스

```sql
-- VOC 테이블
CREATE INDEX idx_voc_status ON voc(status);
CREATE INDEX idx_voc_created_at ON voc(created_at);
CREATE INDEX idx_voc_assignee_status ON voc(assignee_id, status);
CREATE INDEX idx_voc_reporter ON voc(reporter_id);
CREATE INDEX idx_voc_main_category ON voc(main_category_id);

-- 상태 이력
CREATE INDEX idx_voc_status_history_voc ON voc_status_history(voc_id);
CREATE INDEX idx_voc_status_history_created ON voc_status_history(created_at);

-- 감사 로그
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);

-- 이메일 로그
CREATE INDEX idx_email_log_voc ON email_log(voc_id);
CREATE INDEX idx_email_log_status ON email_log(status);
```

---

## 8. 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-01-23 | Claude | 최초 작성 |
| 1.1 | 2026-02-04 | Claude | 상태 전이 규칙 변경 - 종료 상태(RESOLVED, REJECTED, CLOSED) 개념 도입, 종료 상태에서 재처리 불가 |
