# E2E 테스트 Hard-coded Timeout 제거 리팩토링

## 작업 개요
`voc-table.detailed.spec.ts`와 `voc-kanban.detailed.spec.ts`의 모든 `waitForTimeout` 호출을 제거하고 적절한 Playwright 대기 전략으로 대체했습니다.

## 변경 사항

### voc-table.detailed.spec.ts
총 **25개의 waitForTimeout 제거**

#### 1. API 응답 대기 (18개)
**변경 전:**
```typescript
await searchButton.click();
await page.waitForTimeout(500);
expect(searchParam).toBe('배송');
```

**변경 후:**
```typescript
const responsePromise = page.waitForResponse((response) =>
  response.url().includes('/api/vocs?')
);
await searchButton.click();
await responsePromise;
expect(searchParam).toBe('배송');
```

**적용 케이스:**
- 검색 버튼 클릭 (라인 196)
- Enter 키 검색 (라인 222)
- 검색어 초기화 (라인 242, 246)
- 상태 체크박스 선택 (라인 340)
- 우선순위 체크박스 선택 (라인 422)
- 날짜 범위 선택 (라인 503, 505)
- 초기화 버튼 (라인 552, 576)
- 페이지 크기 변경 (라인 827, 861)
- 페이지 네비게이션 (라인 907, 941)
- 복합 필터 (라인 1202, 1209, 1282)

#### 2. UI 애니메이션/상태 변경 대기 (7개)
**변경 전:**
```typescript
await page.getByRole('button', { name: '필터' }).click();
await page.waitForTimeout(300);
```

**변경 후:**
```typescript
await page.getByRole('button', { name: '필터' }).click();
await expect(page.locator('text=상태').first()).toBeVisible();
```

**적용 케이스:**
- 필터 토글 (라인 300, 384, 458, 543, 1217, 1236, 1273)

### voc-kanban.detailed.spec.ts
총 **4개의 waitForTimeout 제거**

#### 1. 드래그 앤 드롭 API 대기
**변경 전:**
```typescript
await card.dragTo(targetColumn);
await page.waitForTimeout(1000);
expect(apiCalled).toBe(true);
```

**변경 후:**
```typescript
const responsePromise = page.waitForResponse(
  (response) => response.url().includes('/api/vocs/1/status') &&
  response.request().method() === 'PATCH'
);
await card.dragTo(targetColumn);
await responsePromise;
expect(apiCalled).toBe(true);
```

#### 2. 네트워크 유휴 대기
**변경 전:**
```typescript
await card.dragTo(sameColumn);
await page.waitForTimeout(500);
expect(apiCalled).toBe(false);
```

**변경 후:**
```typescript
await card.dragTo(sameColumn);
await page.waitForLoadState('networkidle');
expect(apiCalled).toBe(false);
```

#### 3. 다이얼로그 이벤트 대기
**변경 전:**
```typescript
page.on('dialog', async (dialog) => {
  alertMessage = dialog.message();
  await dialog.accept();
});
await card.dragTo(targetColumn);
await page.waitForTimeout(1000);
expect(alertMessage).toContain('상태 변경에 실패했습니다');
```

**변경 후:**
```typescript
const dialogPromise = new Promise<void>((resolve) => {
  page.once('dialog', async (dialog) => {
    alertMessage = dialog.message();
    await dialog.accept();
    resolve();
  });
});
await card.dragTo(targetColumn);
await dialogPromise;
expect(alertMessage).toContain('상태 변경에 실패했습니다');
```

#### 4. DOM 요소 가시성 대기
**변경 전:**
```typescript
await card.dragTo(targetColumn);
await page.waitForTimeout(2000);
const inProgressColumn = page.locator('div:has-text("처리중")').locator('..');
await expect(inProgressColumn.locator('text=VOC-2024-001')).toBeVisible();
```

**변경 후:**
```typescript
await card.dragTo(targetColumn);
const inProgressColumn = page.locator('div:has-text("처리중")').locator('..');
await expect(inProgressColumn.locator('text=VOC-2024-001')).toBeVisible({ timeout: 5000 });
```

## 리팩토링 전략 요약

### 1. API 응답 대기
- **사용:** `page.waitForResponse()`
- **이점:** 실제 API 응답을 기다리므로 더 정확하고 빠름
- **예시:** 검색, 필터, 페이지네이션 등 모든 데이터 요청

### 2. DOM 요소 상태 대기
- **사용:** `expect().toBeVisible()`, `expect().toHaveValue()`
- **이점:** 요소가 실제로 나타날 때까지 대기, 애니메이션 완료 보장
- **예시:** 필터 패널 열기, 버튼 상태 변경

### 3. 네트워크 유휴 대기
- **사용:** `page.waitForLoadState('networkidle')`
- **이점:** 모든 네트워크 활동 완료 대기
- **예시:** 페이지 초기 로드, 복잡한 상호작용 후

### 4. 이벤트 기반 대기
- **사용:** Promise 기반 이벤트 리스너
- **이점:** 특정 이벤트 발생까지 정확히 대기
- **예시:** 다이얼로그 표시, 커스텀 이벤트

## 테스트 안정성 개선 효과

1. **더 빠른 테스트 실행**
   - 불필요한 대기 시간 제거
   - 조건 충족 즉시 진행

2. **더 안정적인 테스트**
   - 임의의 타임아웃이 아닌 실제 상태 기반 대기
   - 타이밍 이슈로 인한 flaky test 감소

3. **더 명확한 의도**
   - 무엇을 기다리는지 코드에서 명확히 표현
   - 유지보수 용이성 향상

4. **Playwright 모범 사례 준수**
   - 공식 문서 권장사항 따름
   - Auto-waiting 기능 최대 활용

## 제거된 총 Timeout 수
- **voc-table.detailed.spec.ts:** 25개
- **voc-kanban.detailed.spec.ts:** 4개
- **총계:** 29개

## 검증 방법
```bash
# voc-table 테스트 실행
npx playwright test e2e/detailed/voc/voc-table.detailed.spec.ts

# voc-kanban 테스트 실행
npx playwright test e2e/detailed/voc/voc-kanban.detailed.spec.ts
```

## 참고 문서
- [Playwright Best Practices - Don't use wait for timeout](https://playwright.dev/docs/best-practices#dont-use-waitfortimeout)
- [Playwright Auto-waiting](https://playwright.dev/docs/actionability)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)
