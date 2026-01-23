# SC-04: VOC 리스트 (칸반보드) 화면 정의서

## 1. 화면 개요

### 1.1 화면 식별
- **화면 ID**: SC-04
- **화면명**: VOC 리스트 (칸반보드)
- **화면 경로**: `/vocs/kanban`
- **연관 이슈**: #4

### 1.2 화면 목적
VOC 처리 담당자가 VOC 목록을 칸반보드 형태로 조회하고, 드래그앤드롭으로 상태를 변경하며, 상세 화면으로 이동할 수 있는 화면

### 1.3 주요 기능
- 6개 상태별 칸반 컬럼으로 VOC 카드 표시
- 드래그앤드롭으로 상태 변경
- 상태 전이 규칙 검증
- VOC 카드 클릭 시 상세 화면 이동
- 칸반보드 ↔ 리스트 뷰 전환

---

## 2. 접근 권한

| 사용자 유형 | 접근 권한 | 비고 |
|------------|----------|------|
| VOC 처리 담당자 | 읽기, 상태 변경 | 주요 사용자 |
| 관리자 | 읽기, 상태 변경 | 모든 권한 |
| VOC 접수자 | 접근 불가 | SC-03 화면 사용 |

---

## 3. 관련 요구사항

| 요구사항 ID | 요구사항 내용 |
|-----------|-------------|
| FR-601 | 칸반보드 형태로 VOC 목록을 조회할 수 있다 |
| FR-603 | 칸반보드와 리스트 뷰를 전환할 수 있다 |
| FR-604 | VOC 클릭 시 상세 화면으로 이동한다 |
| FR-605 | 칸반보드에서 드래그앤드롭으로 상태를 변경할 수 있다 |
| FR-606 | 상태 전이 규칙에 위배되는 드래그앤드롭은 차단된다 |

---

## 4. 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────────┐
│ Header (Navigation)                                             │
│  - Logo / 화면명 / 사용자 정보                                    │
├─────────────────────────────────────────────────────────────────┤
│ Toolbar                                                         │
│  [칸반보드▼] [리스트] [새로고침] [필터] [검색창]                    │
├─────────────────────────────────────────────────────────────────┤
│ Kanban Board (Horizontal Scroll)                               │
│ ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐ │
│ │  접수    │ 분석중   │ 분석실패 │ 처리중   │  완료    │  반려    │ │
│ │  (3)    │  (5)    │  (1)    │  (8)    │  (12)   │  (2)    │ │
│ ├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤ │
│ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ │
│ │ │ VOC │ │ │ VOC │ │ │ VOC │ │ │ VOC │ │ │ VOC │ │ │ VOC │ │ │
│ │ │ Card│ │ │ Card│ │ │ Card│ │ │ Card│ │ │ Card│ │ │ Card│ │ │
│ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │ │
│ │         │         │         │         │         │         │ │
│ │ ┌─────┐ │ ┌─────┐ │         │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ │
│ │ │ VOC │ │ │ VOC │ │         │ │ VOC │ │ │ VOC │ │ │ VOC │ │ │
│ │ │ Card│ │ │ Card│ │         │ │ Card│ │ │ Card│ │ │ Card│ │ │
│ │ └─────┘ │ └─────┘ │         │ └─────┘ │ └─────┘ │ └─────┘ │ │
│ │   ...   │   ...   │         │   ...   │   ...   │         │ │
│ └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. UI 요소 목록

### 5.1 Toolbar

| 요소 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| 뷰 전환 버튼 | Toggle Button Group | 칸반보드/리스트 뷰 전환 | 칸반보드 선택됨 |
| 새로고침 버튼 | Icon Button | 데이터 재조회 | - |
| 필터 버튼 | Icon Button | 필터 패널 토글 | - |
| 검색창 | Search Input | Ticket ID, 제목 검색 | 빈 값 |

#### 뷰 전환 버튼
```
[칸반보드 ✓] [리스트]
```
- 칸반보드 클릭 시: 현재 화면 (SC-04)
- 리스트 클릭 시: SC-05 화면으로 이동

### 5.2 칸반 컬럼

각 컬럼은 고정된 순서로 표시되며, 상태별 VOC 건수를 표시한다.

| 컬럼명 | 상태 코드 | 설명 | 색상 |
|--------|----------|------|------|
| 접수 | RECEIVED | VOC 접수 완료 상태 | Gray |
| 분석중 | ANALYZING | AI 분석 진행 중 | Blue |
| 분석실패 | ANALYSIS_FAILED | AI/ELK 장애로 분석 실패 | Red |
| 처리중 | PROCESSING | 담당자 처리 중 | Yellow |
| 완료 | COMPLETED | 처리 완료 | Green |
| 반려 | REJECTED | VOC 반려됨 | Orange |

**컬럼 헤더 형식**:
```
[상태명] (건수)
예: 분석중 (5)
```

### 5.3 VOC 카드

각 VOC는 카드 형태로 표시되며, 다음 정보를 포함한다.

```
┌─────────────────────────────────┐
│ VOC-20260123-00001             │ ← Ticket ID
│ 로그인 시 오류 발생             │ ← 제목 (최대 2줄)
├─────────────────────────────────┤
│ 📂 오류/버그 > 시스템 오류       │ ← 카테고리
│ 👤 user@example.com            │ ← 최종 사용자 이메일
│ 🕐 2026-01-23 14:30            │ ← 접수일시
├─────────────────────────────────┤
│ 📎 2  💬 1  ⚠️ 높음             │ ← 첨부/코멘트/우선순위
└─────────────────────────────────┘
```

#### 카드 필드

| 필드 | 타입 | 표시 조건 | 비고 |
|------|------|----------|------|
| Ticket ID | Text | 항상 | 굵게 표시 |
| 제목 | Text | 항상 | 최대 2줄, 초과 시 ... |
| 카테고리 | Badge | AI 분류 완료 시 | 아이콘 + 텍스트 |
| 최종 사용자 이메일 | Text | 항상 | 마스킹 (예: u***@example.com) |
| 접수일시 | DateTime | 항상 | YYYY-MM-DD HH:mm |
| 첨부파일 수 | Badge | 첨부파일 존재 시 | 📎 아이콘 + 숫자 |
| 코멘트 수 | Badge | 코멘트 존재 시 | 💬 아이콘 + 숫자 |
| 우선순위 | Badge | 우선순위 설정 시 | ⚠️ 높음, ℹ️ 보통, ↓ 낮음 |

#### 카드 상태 표시

- **드래그 가능**: 기본 커서 (pointer)
- **드래그 중**: 투명도 50%, 드래그 핸들 표시
- **드롭 불가 영역**: 빨간 테두리, 금지 커서

### 5.4 빈 상태 (Empty State)

특정 컬럼에 VOC가 없을 경우:
```
┌─────────────────┐
│                 │
│   (빈 박스 아이콘)  │
│  VOC가 없습니다   │
│                 │
└─────────────────┘
```

---

## 6. 사용자 액션 및 이벤트

### 6.1 화면 진입 시

| 순서 | 액션 | 설명 |
|------|------|------|
| 1 | 인증 확인 | 로그인 상태 및 권한 확인 |
| 2 | 데이터 로드 | 전체 VOC 목록 조회 (페이징 없음) |
| 3 | 칸반보드 렌더링 | 상태별로 그룹화하여 표시 |

**API 호출**:
```
GET /api/vocs?view=kanban
```

### 6.2 VOC 카드 클릭

| 액션 | 결과 |
|------|------|
| 카드 클릭 | SC-06 (VOC 상세 화면)으로 이동 |
| 새 탭에서 열기 | Ctrl/Cmd + 클릭 시 새 탭으로 SC-06 열림 |

**네비게이션**:
```
/vocs/{ticketId} (예: /vocs/VOC-20260123-00001)
```

### 6.3 드래그앤드롭 상태 변경

#### 6.3.1 드래그 시작 (Drag Start)
1. 사용자가 카드를 드래그 시작
2. 카드 투명도 50%로 변경
3. 드롭 가능한 컬럼 하이라이트 (연두색 테두리)
4. 드롭 불가 컬럼은 비활성화 표시 (회색 오버레이)

#### 6.3.2 드래그 중 (Drag Over)
1. 드롭 가능 영역에 진입 시 컬럼 배경색 변경
2. 드래그 중인 카드의 예상 위치 표시 (점선 박스)

#### 6.3.3 드롭 (Drop)
1. 유효성 검사 수행 (상태 전이 규칙 확인)
2. 유효하면 상태 변경 API 호출
3. 성공 시 UI 업데이트 및 토스트 메시지 표시
4. 실패 시 원래 위치로 되돌리고 에러 메시지 표시

#### 6.3.4 상태 전이 규칙

| 현재 상태 | 이동 가능한 상태 | 비고 |
|----------|----------------|------|
| 접수 | 분석중 | 자동 전이 (드래그 불가) |
| 분석중 | 처리중, 분석실패 | 분석중 → 처리중은 자동 전이 권장 |
| 분석실패 | 처리중 | 수동 복구 |
| 처리중 | 완료, 반려 | 처리 완료 또는 반려 |
| 완료 | 처리중 | 재처리 |
| 반려 | 처리중 | 재처리 |

**드래그 차단 조건**:
- 접수 → 다른 상태 (자동 전이만 허용)
- 분석중 → 완료/반려 (처리중을 거쳐야 함)
- 분석실패 → 완료/반려/접수 (처리중을 거쳐야 함)

**API 호출**:
```http
PATCH /api/vocs/{ticketId}/status
Content-Type: application/json

{
  "status": "PROCESSING",
  "previousStatus": "ANALYSIS_FAILED"
}
```

### 6.4 뷰 전환

| 액션 | 결과 |
|------|------|
| [리스트] 버튼 클릭 | SC-05 (리스트 뷰)로 이동 |
| URL 파라미터 | `/vocs?view=list` 형태로 이동 |

### 6.5 새로고침

| 액션 | 결과 |
|------|------|
| 새로고침 버튼 클릭 | VOC 목록 재조회 |
| 로딩 중 | 버튼 비활성화 및 스피너 표시 |

### 6.6 검색

| 입력 | 결과 |
|------|------|
| Ticket ID 입력 | 해당 VOC만 필터링 |
| 제목 키워드 입력 | 제목에 키워드 포함된 VOC 필터링 (대소문자 무시) |
| 빈 값 | 전체 VOC 표시 |

**검색 타이밍**: 입력 후 500ms 디바운스

---

## 7. 유효성 검사

### 7.1 상태 전이 규칙 검증

#### 클라이언트 검증
- 드래그 시작 시 이동 가능한 컬럼만 활성화
- 드롭 불가 컬럼은 시각적으로 비활성화

#### 서버 검증
- 상태 변경 API 호출 시 서버에서 재검증
- 위반 시 HTTP 400 응답 반환

**검증 로직**:
```typescript
const allowedTransitions: Record<VocStatus, VocStatus[]> = {
  RECEIVED: [], // 자동 전이만 허용
  ANALYZING: ['PROCESSING', 'ANALYSIS_FAILED'],
  ANALYSIS_FAILED: ['PROCESSING'],
  PROCESSING: ['COMPLETED', 'REJECTED'],
  COMPLETED: ['PROCESSING'],
  REJECTED: ['PROCESSING']
};

function canTransition(from: VocStatus, to: VocStatus): boolean {
  return allowedTransitions[from].includes(to);
}
```

### 7.2 드래그앤드롭 유효성

| 조건 | 결과 |
|------|------|
| 동일 컬럼에 드롭 | 무시 (아무 동작 없음) |
| 허용되지 않은 상태 전이 | 에러 메시지 + 원래 위치로 복원 |
| 네트워크 에러 | 에러 메시지 + 원래 위치로 복원 |

---

## 8. 에러 처리

### 8.1 에러 유형 및 메시지

| 에러 코드 | HTTP 상태 | 메시지 | 액션 |
|----------|-----------|--------|------|
| INVALID_TRANSITION | 400 | "해당 상태로 변경할 수 없습니다. (분석중 → 완료)" | 카드 원위치 복원 + 토스트 표시 |
| VOC_NOT_FOUND | 404 | "VOC를 찾을 수 없습니다." | 목록 새로고침 |
| UNAUTHORIZED | 401 | "권한이 없습니다. 다시 로그인해주세요." | 로그인 화면으로 리다이렉트 |
| NETWORK_ERROR | - | "네트워크 오류가 발생했습니다. 다시 시도해주세요." | 재시도 버튼 표시 |
| SERVER_ERROR | 500 | "서버 오류가 발생했습니다. 관리자에게 문의하세요." | 에러 로그 전송 |

### 8.2 에러 표시 방식

| 에러 유형 | 표시 방식 |
|----------|----------|
| 유효성 검증 실패 | Toast (하단 중앙, 3초) |
| 네트워크 에러 | Toast + 재시도 버튼 |
| 권한 없음 | 전체 화면 모달 + 로그인 버튼 |
| 데이터 로드 실패 | Empty State + 재시도 버튼 |

### 8.3 낙관적 업데이트 (Optimistic Update)

```typescript
// 1. UI 즉시 업데이트
updateCardPosition(cardId, newStatus);

// 2. API 호출
try {
  await updateVocStatus(cardId, newStatus);
  // 성공 시 토스트 표시
  showToast('상태가 변경되었습니다.', 'success');
} catch (error) {
  // 실패 시 원래 상태로 복원
  revertCardPosition(cardId, previousStatus);
  showToast(error.message, 'error');
}
```

---

## 9. 연관 API

### 9.1 VOC 목록 조회

```http
GET /api/vocs?view=kanban&search={keyword}
Authorization: Bearer {token}
```

**응답**:
```json
{
  "data": [
    {
      "ticketId": "VOC-20260123-00001",
      "title": "로그인 시 오류 발생",
      "status": "ANALYZING",
      "category": {
        "majorCode": "ERROR",
        "majorName": "오류/버그",
        "minorCode": "SYSTEM_ERROR",
        "minorName": "시스템 오류"
      },
      "endUserEmail": "user@example.com",
      "createdAt": "2026-01-23T14:30:00Z",
      "attachmentCount": 2,
      "commentCount": 1,
      "priority": "HIGH"
    }
  ],
  "meta": {
    "total": 31,
    "statusCounts": {
      "RECEIVED": 3,
      "ANALYZING": 5,
      "ANALYSIS_FAILED": 1,
      "PROCESSING": 8,
      "COMPLETED": 12,
      "REJECTED": 2
    }
  }
}
```

### 9.2 VOC 상태 변경

```http
PATCH /api/vocs/{ticketId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "PROCESSING",
  "previousStatus": "ANALYSIS_FAILED"
}
```

**응답 (성공)**:
```json
{
  "ticketId": "VOC-20260123-00001",
  "status": "PROCESSING",
  "updatedAt": "2026-01-23T15:00:00Z",
  "updatedBy": "user@company.com"
}
```

**응답 (실패)**:
```json
{
  "error": "INVALID_TRANSITION",
  "message": "해당 상태로 변경할 수 없습니다. (분석중 → 완료)",
  "details": {
    "currentStatus": "ANALYZING",
    "requestedStatus": "COMPLETED",
    "allowedStatuses": ["PROCESSING", "ANALYSIS_FAILED"]
  }
}
```

### 9.3 VOC 검색

```http
GET /api/vocs?search={keyword}&view=kanban
Authorization: Bearer {token}
```

**쿼리 파라미터**:
- `search`: Ticket ID 또는 제목 검색 (부분 일치)
- `view`: kanban (고정값)

---

## 10. 화면 전환

### 10.1 진입 경로

| 출발 화면 | 진입 방식 |
|----------|----------|
| SC-01 (로그인) | 로그인 성공 후 기본 랜딩 페이지 (VOC 처리 담당자) |
| SC-05 (리스트 뷰) | 뷰 전환 버튼 클릭 |
| SC-06 (VOC 상세) | 뒤로가기 또는 목록 버튼 클릭 |

### 10.2 이탈 경로

| 목적지 화면 | 이탈 방식 |
|-----------|----------|
| SC-05 (리스트 뷰) | [리스트] 버튼 클릭 |
| SC-06 (VOC 상세) | VOC 카드 클릭 |
| SC-01 (로그인) | 로그아웃 또는 세션 만료 |

### 10.3 URL 구조

```
/vocs/kanban                        # 칸반 뷰
/vocs/kanban?search=VOC-20260123    # 검색 적용
/vocs/list                          # 리스트 뷰 (SC-05)
/vocs/{ticketId}                    # 상세 화면 (SC-06)
```

---

## 11. 성능 요구사항

| 항목 | 목표 | 측정 방법 |
|------|------|----------|
| 초기 로드 시간 | 2초 이내 | 데이터 조회 + 렌더링 완료 |
| 드래그앤드롭 응답 | 100ms 이내 | UI 업데이트 (낙관적 업데이트) |
| API 응답 시간 | 500ms 이내 | 상태 변경 API 호출 |
| 동시 처리 | 100건 이하 | 단일 화면에 표시되는 VOC 수 제한 |

---

## 12. 접근성 (Accessibility)

### 12.1 키보드 네비게이션

| 키 | 동작 |
|----|------|
| Tab | 다음 카드로 포커스 이동 |
| Shift + Tab | 이전 카드로 포커스 이동 |
| Enter | 카드 상세 화면으로 이동 |
| Space | 드래그 모드 활성화 (키보드 드래그) |
| Arrow Keys | 드래그 모드에서 컬럼 이동 |

### 12.2 ARIA 속성

```html
<!-- 칸반 컬럼 -->
<div
  role="region"
  aria-label="분석중 (5건)"
  aria-live="polite"
>
  <!-- VOC 카드 -->
  <div
    role="button"
    aria-label="VOC-20260123-00001 로그인 시 오류 발생"
    tabindex="0"
    draggable="true"
  >
    ...
  </div>
</div>
```

### 12.3 스크린 리더 지원

- 카드 이동 시: "VOC-20260123-00001이 분석중에서 처리중으로 이동되었습니다."
- 상태 변경 실패 시: "상태 변경 실패: 해당 상태로 변경할 수 없습니다."

---

## 13. UI/UX 상세 사양

### 13.1 반응형 디자인

| 화면 크기 | 레이아웃 |
|----------|----------|
| Desktop (>1200px) | 6개 컬럼 모두 표시, 가로 스크롤 |
| Tablet (768-1199px) | 3개 컬럼씩 2행 표시 |
| Mobile (<768px) | 리스트 뷰로 자동 전환 권장 |

### 13.2 색상 체계

| 상태 | 컬럼 배경 | 카드 좌측 바 | 비고 |
|------|----------|------------|------|
| 접수 | #F5F5F5 | #9E9E9E | 회색 |
| 분석중 | #E3F2FD | #2196F3 | 파란색 |
| 분석실패 | #FFEBEE | #F44336 | 빨간색 |
| 처리중 | #FFF9C4 | #FFC107 | 노란색 |
| 완료 | #E8F5E9 | #4CAF50 | 초록색 |
| 반려 | #FFF3E0 | #FF9800 | 주황색 |

### 13.3 애니메이션

| 액션 | 애니메이션 | 지속 시간 |
|------|-----------|----------|
| 카드 드래그 | 투명도 변경, 그림자 추가 | 즉시 |
| 카드 드롭 | 부드러운 이동 (ease-out) | 200ms |
| 상태 변경 성공 | 카드 페이드인 | 300ms |
| 에러 발생 | 카드 흔들림 (shake) | 400ms |
| 새 VOC 추가 | 상단에서 슬라이드 인 | 300ms |

---

## 14. 테스트 시나리오

### 14.1 기능 테스트

| 테스트 케이스 | 입력 | 예상 결과 |
|-------------|------|----------|
| TC-01 | 화면 진입 | 6개 컬럼과 각 상태별 VOC 카드 표시 |
| TC-02 | VOC 카드 클릭 | SC-06 상세 화면으로 이동 |
| TC-03 | 분석실패 → 처리중 드래그 | 상태 변경 성공 + 토스트 표시 |
| TC-04 | 분석중 → 완료 드래그 | 차단 + 에러 메시지 표시 |
| TC-05 | Ticket ID 검색 | 해당 VOC만 필터링되어 표시 |
| TC-06 | [리스트] 버튼 클릭 | SC-05 리스트 뷰로 이동 |

### 14.2 에러 처리 테스트

| 테스트 케이스 | 시나리오 | 예상 결과 |
|-------------|---------|----------|
| TC-E01 | API 응답 500 에러 | 에러 메시지 + 재시도 버튼 표시 |
| TC-E02 | 네트워크 끊김 | "네트워크 오류" 메시지 + 카드 원위치 |
| TC-E03 | 세션 만료 | 로그인 화면으로 리다이렉트 |
| TC-E04 | 동시 편집 충돌 | 최신 데이터로 새로고침 권장 |

### 14.3 성능 테스트

| 테스트 케이스 | 조건 | 목표 |
|-------------|------|------|
| TC-P01 | VOC 100건 로드 | 2초 이내 렌더링 |
| TC-P02 | 드래그앤드롭 10회 연속 | 프레임 드롭 없음 (60fps) |
| TC-P03 | 검색 입력 (디바운스) | 500ms 후 API 호출 |

---

## 15. 개발 참고사항

### 15.1 기술 스택
- **Framework**: React 18+
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **상태 관리**: TanStack Query + Zustand
- **UI 컴포넌트**: Headless UI
- **스타일링**: TailwindCSS

### 15.2 Feature-Sliced Design 구조

```
src/features/voc-kanban/
├── api/
│   ├── vocApi.ts                   # VOC 목록, 상태 변경 API
│   └── types.ts                    # API 타입 정의
├── components/
│   ├── KanbanBoard.tsx             # 칸반보드 컨테이너
│   ├── KanbanColumn.tsx            # 칸반 컬럼 (드롭존)
│   ├── VocCard.tsx                 # VOC 카드 (드래그 가능)
│   ├── VocCardSkeleton.tsx         # 로딩 스켈레톤
│   └── EmptyState.tsx              # 빈 상태 표시
├── hooks/
│   ├── useKanbanViewModel.ts       # 칸반 뷰모델 (메인 로직)
│   ├── useDragAndDrop.ts           # 드래그앤드롭 로직
│   └── useStatusTransition.ts      # 상태 전이 검증 로직
├── model/
│   ├── types.ts                    # VOC 타입 정의
│   ├── statusTransitionRules.ts    # 상태 전이 규칙
│   └── constants.ts                # 상수 (상태 코드, 색상 등)
└── index.ts
```

### 15.3 주요 구현 포인트

#### 상태 전이 규칙 검증
```typescript
// src/features/voc-kanban/model/statusTransitionRules.ts
export const STATUS_TRANSITION_RULES: Record<VocStatus, VocStatus[]> = {
  RECEIVED: [],
  ANALYZING: ['PROCESSING', 'ANALYSIS_FAILED'],
  ANALYSIS_FAILED: ['PROCESSING'],
  PROCESSING: ['COMPLETED', 'REJECTED'],
  COMPLETED: ['PROCESSING'],
  REJECTED: ['PROCESSING']
};

export function canTransition(from: VocStatus, to: VocStatus): boolean {
  return STATUS_TRANSITION_RULES[from].includes(to);
}
```

#### 낙관적 업데이트
```typescript
// src/features/voc-kanban/hooks/useKanbanViewModel.ts
const mutation = useMutation({
  mutationFn: ({ ticketId, status }) =>
    vocApi.updateStatus(ticketId, status),

  onMutate: async ({ ticketId, status }) => {
    // 낙관적 업데이트
    await queryClient.cancelQueries({ queryKey: ['vocs'] });
    const previousVocs = queryClient.getQueryData(['vocs']);

    queryClient.setQueryData(['vocs'], (old) =>
      updateVocStatus(old, ticketId, status)
    );

    return { previousVocs };
  },

  onError: (err, variables, context) => {
    // 에러 시 복원
    queryClient.setQueryData(['vocs'], context.previousVocs);
    showToast(err.message, 'error');
  }
});
```

---

## 16. 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-01-23 | Claude Code | 초안 작성 |

---

## 관련 문서
- [요구사항 정의서](/docs/REQUIREMENTS.md)
- [SC-05: VOC 리스트 (테이블) 화면 정의서](/docs/screens/SC-05-voc-list.md)
- [SC-06: VOC 상세 화면 정의서](/docs/screens/SC-06-voc-detail.md)
- [API 명세서](/docs/api/API-SPEC.md)
