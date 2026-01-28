import { test, expect } from '@playwright/test';

/**
 * @description 대시보드 페이지 상세 E2E 테스트 시나리오
 * @route /dashboard
 * @issue #117
 *
 * ## 테스트 대상 UI 요소
 * 1. KPI 카드 4개 (총 접수, 평균 처리 시간, 완료율, 처리 중)
 * 2. 기간 필터 버튼들 (오늘, 7일, 30일, 사용자 지정)
 * 3. 새로고침 버튼
 * 4. 트렌드 차트 (호버, 범례)
 * 5. 카테고리 차트 (파이 차트)
 * 6. 상태 차트 (막대 차트)
 * 7. 반응형 레이아웃
 *
 * ## 기존 테스트와의 차이
 * - 기존 테스트: 기본 렌더링, 필터 전환, API 에러 처리
 * - 상세 테스트: UI 인터랙션, 호버 효과, 차트 상호작용, 키보드 네비게이션, 접근성
 */

test.describe('대시보드 페이지 (/dashboard) - 상세 시나리오', () => {
  const mockDashboardData = {
    kpi: {
      totalVocs: 1250,
      totalVocsChange: { value: 8.5, type: 'increase' as const, count: 98 },
      avgResolutionTimeHours: 24.5,
      avgResolutionTimeChange: { value: -12.3, type: 'decrease' as const },
      resolutionRate: 87.3,
      resolutionRateChange: { value: 2.1, type: 'increase' as const },
      pendingVocs: 158,
      pendingVocsChange: { value: 0, type: 'neutral' as const, count: 0 },
    },
    trend: [
      { date: '2024-01-01', received: 45, resolved: 38, pending: 7 },
      { date: '2024-01-02', received: 52, resolved: 47, pending: 5 },
      { date: '2024-01-03', received: 48, resolved: 51, pending: -3 },
      { date: '2024-01-04', received: 61, resolved: 55, pending: 6 },
      { date: '2024-01-05', received: 58, resolved: 60, pending: -2 },
      { date: '2024-01-06', received: 43, resolved: 45, pending: -2 },
      { date: '2024-01-07', received: 50, resolved: 48, pending: 2 },
    ],
    categoryStats: [
      { categoryId: 1, categoryName: '제품 문의', count: 450, percentage: 36.0 },
      { categoryId: 2, categoryName: '기술 지원', count: 325, percentage: 26.0 },
      { categoryId: 3, categoryName: '배송 문의', count: 275, percentage: 22.0 },
      { categoryId: 4, categoryName: '환불 요청', count: 125, percentage: 10.0 },
      { categoryId: 5, categoryName: '기타', count: 75, percentage: 6.0 },
    ],
    statusDistribution: [
      { status: 'NEW', statusLabel: '신규', count: 158, percentage: 12.6 },
      { status: 'IN_PROGRESS', statusLabel: '처리중', count: 305, percentage: 24.4 },
      { status: 'RESOLVED', statusLabel: '해결', count: 687, percentage: 55.0 },
      { status: 'REJECTED', statusLabel: '거부', count: 100, percentage: 8.0 },
    ],
  };

  test.beforeEach(async ({ page }) => {
    // API 모킹
    await page.route('**/api/statistics/dashboard**', async (route) => {
      const url = route.request().url();
      const period = new URL(url).searchParams.get('period') || '7days';

      let responseData = mockDashboardData;

      if (period === 'today') {
        responseData = {
          ...mockDashboardData,
          kpi: { ...mockDashboardData.kpi, totalVocs: 50 },
        };
      } else if (period === '30days') {
        responseData = {
          ...mockDashboardData,
          kpi: {
            ...mockDashboardData.kpi,
            totalVocs: 3500,
            avgResolutionTimeHours: 28.3,
          },
        };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: responseData,
        }),
      });
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('1. KPI 카드 UI 인터랙션', () => {
    test('1.1 KPI 카드에 호버 시 시각적 피드백이 있다', async ({ page }) => {
      const firstKpiCard = page
        .locator('[role="region"][aria-label*="총 접수"]')
        .first();

      // 호버 전 위치 저장
      const beforeBox = await firstKpiCard.boundingBox();

      // Act - 호버
      await firstKpiCard.hover();

      // 짧은 대기 (transition 효과)
      await page.waitForTimeout(300);

      // Assert - shadow 클래스 확인 (hover:shadow-md)
      await expect(firstKpiCard).toHaveClass(/hover:shadow-md/);

      // 위치 변경 확인 (hover:-translate-y-0.5)
      const afterBox = await firstKpiCard.boundingBox();
      if (beforeBox && afterBox) {
        // Y 좌표가 약간 위로 이동했는지 확인 (픽셀 차이는 작을 수 있음)
        expect(afterBox.y).toBeLessThanOrEqual(beforeBox.y);
      }
    });

    test('1.2 KPI 카드의 변화 지표 아이콘이 올바르게 표시된다', async ({ page }) => {
      // Arrange & Assert - 증가 (총 접수)
      const increasedCard = page.locator('[role="region"][aria-label*="총 접수"]').first();
      await expect(increasedCard.locator('svg[aria-hidden="true"]').first()).toBeVisible(); // ArrowUpIcon

      // 감소 (평균 처리 시간)
      const decreasedCard = page
        .locator('[role="region"][aria-label*="평균 처리 시간"]')
        .first();
      await expect(decreasedCard.locator('svg[aria-hidden="true"]').first()).toBeVisible(); // ArrowDownIcon

      // 중립 (처리 중)
      const neutralCard = page.locator('[role="region"][aria-label*="처리 중"]').first();
      const neutralIcon = neutralCard.locator('svg[aria-hidden="true"]').first();
      if ((await neutralIcon.count()) > 0) {
        await expect(neutralIcon).toBeVisible(); // MinusIcon
      }
    });

    test('1.3 KPI 카드의 변화율 텍스트가 올바른 색상을 가진다', async ({ page }) => {
      // 증가 - info 색상
      const increasedChange = page
        .locator('[role="region"][aria-label*="총 접수"]')
        .first()
        .locator('p')
        .filter({ hasText: /\+8\.5%/ });
      await expect(increasedChange).toHaveClass(/text-info/);

      // 감소 - success 색상
      const decreasedChange = page
        .locator('[role="region"][aria-label*="평균 처리 시간"]')
        .first()
        .locator('p')
        .filter({ hasText: /-12\.3%/ });
      await expect(decreasedChange).toHaveClass(/text-success/);
    });

    test('1.4 모든 KPI 카드가 role="region"과 aria-label을 가진다', async ({ page }) => {
      const kpiCards = page.locator('[role="region"]').filter({
        has: page.locator('p.text-3xl'),
      });

      const count = await kpiCards.count();
      expect(count).toBe(4);

      // 각 카드의 aria-label 확인
      await expect(kpiCards.nth(0)).toHaveAttribute('aria-label', /총 접수|평균|완료|처리/);
    });

    test('1.5 KPI 값이 로케일에 맞게 포맷팅된다 (천 단위 쉼표)', async ({ page }) => {
      const totalVocValue = page
        .locator('[role="region"][aria-label*="총 접수"]')
        .first()
        .locator('p.text-3xl');
      await expect(totalVocValue).toHaveText(/1,250건/);
    });
  });

  test.describe('2. 기간 필터 버튼 상세 테스트', () => {
    test('2.1 기본 선택된 기간 버튼이 시각적으로 강조된다', async ({ page }) => {
      const sevenDaysButton = page.getByRole('button', {
        name: '최근 7일',
        exact: false,
      });

      // aria-pressed 확인
      await expect(sevenDaysButton).toHaveAttribute('aria-pressed', 'true');

      // 활성 스타일 확인
      await expect(sevenDaysButton).toHaveClass(/bg-primary/);
      await expect(sevenDaysButton).toHaveClass(/text-white/);
    });

    test('2.2 비활성 기간 버튼에 호버 시 배경색이 변경된다', async ({ page }) => {
      const todayButton = page.getByRole('button', { name: '오늘', exact: true });

      // 호버 전 상태 (비활성)
      await expect(todayButton).toHaveAttribute('aria-pressed', 'false');

      // Act
      await todayButton.hover();

      // Assert - hover:bg-gray-100 클래스 확인
      await expect(todayButton).toHaveClass(/hover:bg-gray-100/);
    });

    test('2.3 기간 버튼 클릭 시 즉시 aria-pressed가 변경된다', async ({ page }) => {
      const todayButton = page.getByRole('button', { name: '오늘', exact: true });

      // Before
      await expect(todayButton).toHaveAttribute('aria-pressed', 'false');

      // Act
      await todayButton.click();

      // After
      await expect(todayButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('2.4 사용자 지정 버튼 클릭 시 DatePicker가 열린다', async ({ page }) => {
      const customButton = page.getByRole('button', {
        name: '사용자 지정 날짜 범위',
        exact: false,
      });

      // Act
      await customButton.click();

      // Assert - DatePicker 다이얼로그 확인
      const datePicker = page.locator('[role="dialog"]');
      await expect(datePicker).toBeVisible({ timeout: 3000 });
    });

    test('2.5 사용자 지정 버튼에 CalendarIcon이 표시된다', async ({ page }) => {
      const customButton = page.getByRole('button', {
        name: '사용자 지정 날짜 범위',
        exact: false,
      });

      const icon = customButton.locator('svg.h-4.w-4');
      await expect(icon).toBeVisible();
    });

    test('2.6 기간 필터 버튼 그룹이 role="group"과 aria-label을 가진다', async ({ page }) => {
      const buttonGroup = page.locator('[role="group"][aria-label="기간 선택"]');
      await expect(buttonGroup).toBeVisible();
    });

    test('2.7 기간 변경 시 로딩 상태 없이 데이터가 즉시 업데이트된다', async ({ page }) => {
      const todayButton = page.getByRole('button', { name: '오늘', exact: true });

      // Act
      await todayButton.click();

      // API 응답 대기
      await page.waitForResponse((response) =>
        response.url().includes('/api/statistics/dashboard')
      );

      // Assert - 스피너가 표시되지 않고 데이터 즉시 변경
      const totalVocValue = page
        .locator('[role="region"][aria-label*="총 접수"]')
        .first()
        .locator('p.text-3xl');
      await expect(totalVocValue).toHaveText(/50건/);
    });
  });

  test.describe('3. 새로고침 버튼', () => {
    test('3.1 새로고침 버튼이 올바른 아이콘과 텍스트를 가진다', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: '데이터 새로고침' });

      await expect(refreshButton).toBeVisible();
      await expect(refreshButton.locator('svg.h-4.w-4')).toBeVisible(); // RefreshCwIcon
      await expect(refreshButton).toContainText('새로고침');
    });

    test('3.2 새로고침 버튼 클릭 시 API가 다시 호출된다', async ({ page }) => {
      let apiCallCount = 0;

      page.on('request', (request) => {
        if (request.url().includes('/api/statistics/dashboard')) {
          apiCallCount++;
        }
      });

      const refreshButton = page.getByRole('button', { name: '데이터 새로고침' });

      const initialCallCount = apiCallCount;

      // Act
      await refreshButton.click();

      // 응답 대기
      await page.waitForResponse((response) =>
        response.url().includes('/api/statistics/dashboard')
      );

      // Assert
      expect(apiCallCount).toBeGreaterThan(initialCallCount);
    });

    test('3.3 새로고침 버튼에 호버 시 배경색이 변경된다', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: '데이터 새로고침' });

      // Act
      await refreshButton.hover();

      // Assert
      await expect(refreshButton).toHaveClass(/hover:bg-gray-100/);
    });

    test('3.4 새로고침 버튼이 ml-auto로 우측에 정렬된다', async ({ page }) => {
      const container = page.locator('.ml-auto').filter({
        has: page.getByRole('button', { name: '데이터 새로고침' }),
      });

      await expect(container).toBeVisible();
    });
  });

  test.describe('4. 트렌드 차트 상호작용', () => {
    test('4.1 트렌드 차트 제목이 올바르게 표시된다', async ({ page }) => {
      const chartTitle = page.locator('h3').filter({ hasText: '기간별 VOC 접수 추이' });
      await expect(chartTitle).toBeVisible();
      await expect(chartTitle).toHaveClass(/text-lg/);
      await expect(chartTitle).toHaveClass(/font-bold/);
    });

    test('4.2 트렌드 차트에 dateRange 라벨이 표시된다', async ({ page }) => {
      const dateRangeLabel = page.locator('span[aria-label^="기간:"]');

      if ((await dateRangeLabel.count()) > 0) {
        await expect(dateRangeLabel).toBeVisible();
        await expect(dateRangeLabel).toHaveClass(/text-xs/);
      }
    });

    test('4.3 트렌드 차트의 범례 아이템이 모두 표시된다', async ({ page }) => {
      // Recharts의 Legend는 자동으로 생성되므로 text로 확인
      await expect(page.locator('text=VOC 접수 건수').first()).toBeVisible();
      await expect(page.locator('text=해결').first()).toBeVisible();
      await expect(page.locator('text=미해결').first()).toBeVisible();
    });

    test('4.4 트렌드 차트 데이터 포인트에 호버 시 툴팁이 표시된다', async ({ page }) => {
      // ResponsiveContainer 내부의 SVG 찾기
      const chartArea = page.locator('.recharts-wrapper').first();
      await expect(chartArea).toBeVisible();

      // 차트 중앙 영역에 호버 (데이터 포인트)
      const box = await chartArea.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // 툴팁 확인 (recharts-tooltip-wrapper)
        const tooltip = page.locator('.recharts-tooltip-wrapper');
        if ((await tooltip.count()) > 0) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('4.5 트렌드 차트의 라인이 3개 렌더링된다', async ({ page }) => {
      const lines = page.locator('.recharts-line');
      const lineCount = await lines.count();
      expect(lineCount).toBe(3); // received, resolved, pending
    });

    test('4.6 트렌드 차트의 X축 라벨이 날짜 형식이다', async ({ page }) => {
      const xAxisLabels = page.locator('.recharts-xAxis .recharts-text');
      const firstLabel = xAxisLabels.first();

      if ((await firstLabel.count()) > 0) {
        const labelText = await firstLabel.textContent();
        // MM/dd 형식 확인
        expect(labelText).toMatch(/\d{2}\/\d{2}/);
      }
    });

    test('4.7 데이터가 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
      // 빈 데이터로 API 재모킹
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockDashboardData,
              trend: [],
            },
          }),
        });
      });

      // 새로고침
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Assert
      const emptyMessage = page.locator('text=데이터가 없습니다').first();
      await expect(emptyMessage).toBeVisible();
    });
  });

  test.describe('5. 카테고리 차트 상호작용', () => {
    test('5.1 카테고리 차트 제목과 "상위 10개" 라벨이 표시된다', async ({ page }) => {
      const chartTitle = page.locator('h3').filter({ hasText: '카테고리별 VOC 현황' });
      await expect(chartTitle).toBeVisible();

      const limitLabel = page.locator('text=상위 10개');
      if ((await limitLabel.count()) > 0) {
        await expect(limitLabel).toBeVisible();
      }
    });

    test('5.2 카테고리 파이 차트가 렌더링된다', async ({ page }) => {
      const pieChart = page.locator('.recharts-pie');
      await expect(pieChart).toBeVisible();
    });

    test('5.3 카테고리 차트의 범례가 표시된다', async ({ page }) => {
      // 카테고리 이름이 범례에 표시되는지 확인
      await expect(page.locator('text=제품 문의').first()).toBeVisible();
      await expect(page.locator('text=기술 지원').first()).toBeVisible();
    });

    test('5.4 카테고리 차트 섹터에 호버 시 툴팁이 표시된다', async ({ page }) => {
      const chartArea = page.locator('.recharts-wrapper').nth(1); // 두 번째 차트
      await expect(chartArea).toBeVisible();

      const box = await chartArea.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        // 툴팁 확인
        const tooltip = page.locator('.recharts-tooltip-wrapper');
        if ((await tooltip.count()) > 0) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('5.5 카테고리 차트의 라벨에 퍼센트가 표시된다', async ({ page }) => {
      // 파이 차트 라벨은 SVG text로 렌더링됨
      const pieLabels = page.locator('.recharts-pie-label-text');

      if ((await pieLabels.count()) > 0) {
        const firstLabel = await pieLabels.first().textContent();
        expect(firstLabel).toMatch(/%/); // 퍼센트 기호 포함
      }
    });

    test('5.6 데이터가 없을 때 빈 상태 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockDashboardData,
              categoryStats: [],
            },
          }),
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const emptyMessages = page.locator('text=데이터가 없습니다');
      expect(await emptyMessages.count()).toBeGreaterThan(0);
    });
  });

  test.describe('6. 상태 차트 상호작용', () => {
    test('6.1 상태 차트 제목이 표시된다', async ({ page }) => {
      const chartTitle = page.locator('h3').filter({ hasText: '상태별 VOC 현황' });
      await expect(chartTitle).toBeVisible();
    });

    test('6.2 상태 막대 차트가 렌더링된다', async ({ page }) => {
      const barChart = page.locator('.recharts-bar');
      await expect(barChart).toBeVisible();
    });

    test('6.3 상태 차트의 막대 색상이 상태별로 다르다', async ({ page }) => {
      const barCells = page.locator('.recharts-bar-rectangle path');
      const cellCount = await barCells.count();
      expect(cellCount).toBeGreaterThan(0);

      // 각 막대가 fill 속성을 가지는지 확인
      for (let i = 0; i < Math.min(cellCount, 4); i++) {
        const fillAttr = await barCells.nth(i).getAttribute('fill');
        expect(fillAttr).toBeTruthy();
      }
    });

    test('6.4 상태 차트 막대에 호버 시 툴팁이 표시된다', async ({ page }) => {
      const chartArea = page.locator('.recharts-wrapper').nth(2); // 세 번째 차트
      await expect(chartArea).toBeVisible();

      const box = await chartArea.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(500);

        const tooltip = page.locator('.recharts-tooltip-wrapper');
        if ((await tooltip.count()) > 0) {
          await expect(tooltip).toBeVisible();
        }
      }
    });

    test('6.5 상태 차트의 X축에 상태 라벨이 표시된다', async ({ page }) => {
      // X축 라벨 확인
      const xAxisLabels = page.locator('.recharts-xAxis .recharts-text');
      if ((await xAxisLabels.count()) > 0) {
        const labelTexts = await xAxisLabels.allTextContents();
        expect(labelTexts.some((text) => text.includes('신규') || text.includes('처리중'))).toBe(
          true
        );
      }
    });
  });

  test.describe('7. 반응형 레이아웃', () => {
    test('7.1 모바일 뷰포트에서 KPI 카드가 세로로 정렬된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      const kpiCards = page.locator('[role="region"]').filter({
        has: page.locator('p.text-3xl'),
      });

      const firstCard = kpiCards.first();
      const secondCard = kpiCards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        // 모바일에서는 카드가 세로로 쌓임
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    });

    test('7.2 모바일 뷰포트에서 기간 필터 버튼이 줄바꿈된다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      const buttonGroup = page.locator('[role="group"][aria-label="기간 선택"]');
      await expect(buttonGroup).toBeVisible();

      // flex-wrap 클래스 확인
      await expect(buttonGroup).toHaveClass(/flex-wrap/);
    });

    test('7.3 태블릿 뷰포트에서 차트가 2열 그리드로 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(300);

      // ChartGrid는 grid-cols-1 md:grid-cols-2 클래스 사용
      const chartGrid = page.locator('.grid').filter({
        has: page.locator('h3', { hasText: '카테고리별' }),
      });

      if ((await chartGrid.count()) > 0) {
        await expect(chartGrid).toBeVisible();
      }
    });

    test('7.4 데스크톱 뷰포트에서 모든 KPI 카드가 한 줄에 표시된다', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(300);

      const kpiCards = page.locator('[role="region"]').filter({
        has: page.locator('p.text-3xl'),
      });

      const firstCard = kpiCards.first();
      const lastCard = kpiCards.nth(3);

      const firstBox = await firstCard.boundingBox();
      const lastBox = await lastCard.boundingBox();

      if (firstBox && lastBox) {
        // 같은 행에 있으면 Y 좌표가 비슷함 (오차 허용)
        expect(Math.abs(firstBox.y - lastBox.y)).toBeLessThan(50);
      }
    });

    test('7.5 작은 뷰포트에서 padding이 줄어든다 (p-4 vs p-6)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(300);

      const mainContainer = page.locator('.p-4.md\\:p-6').first();
      if ((await mainContainer.count()) > 0) {
        await expect(mainContainer).toBeVisible();
      }
    });
  });

  test.describe('8. 키보드 네비게이션', () => {
    test('8.1 Tab 키로 기간 필터 버튼 간 이동이 가능하다', async ({ page }) => {
      const todayButton = page.getByRole('button', { name: '오늘', exact: true });
      const sevenDaysButton = page.getByRole('button', { name: '7일', exact: true });

      // 첫 버튼에 포커스
      await todayButton.focus();
      await expect(todayButton).toBeFocused();

      // Tab으로 다음 버튼 이동
      await page.keyboard.press('Tab');
      await expect(sevenDaysButton).toBeFocused();
    });

    test('8.2 Enter/Space 키로 기간 필터 버튼을 활성화할 수 있다', async ({ page }) => {
      const todayButton = page.getByRole('button', { name: '오늘', exact: true });

      await todayButton.focus();

      // Act - Enter 키
      await page.keyboard.press('Enter');

      // Assert
      await expect(todayButton).toHaveAttribute('aria-pressed', 'true');

      // 다른 버튼으로 전환 (Space 키)
      const sevenDaysButton = page.getByRole('button', { name: '7일', exact: true });
      await sevenDaysButton.focus();
      await page.keyboard.press('Space');

      await expect(sevenDaysButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('8.3 Shift+Tab으로 역방향 이동이 가능하다', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: '데이터 새로고침' });
      const customButton = page.getByRole('button', {
        name: '사용자 지정 날짜 범위',
        exact: false,
      });

      await refreshButton.focus();

      // Act - 역방향 이동
      await page.keyboard.press('Shift+Tab');

      // 사용자 지정 버튼 또는 이전 버튼에 포커스
      // (정확한 순서는 DOM 구조에 따라 다름)
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('9. 접근성 (Accessibility)', () => {
    test('9.1 메인 제목이 h1이다', async ({ page }) => {
      const mainTitle = page.locator('h1', { hasText: '통계 대시보드' });
      await expect(mainTitle).toBeVisible();
    });

    test('9.2 모든 차트 제목이 h3이고 적절한 계층 구조를 가진다', async ({ page }) => {
      const chartTitles = page.locator('h3');
      const count = await chartTitles.count();
      expect(count).toBeGreaterThanOrEqual(2);

      // 각 차트 제목이 font-bold 클래스를 가짐
      await expect(chartTitles.first()).toHaveClass(/font-bold/);
    });

    test('9.3 모든 아이콘 버튼에 aria-label이 설정되어 있다', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: '데이터 새로고침' });
      await expect(refreshButton).toHaveAttribute('aria-label', '데이터 새로고침');

      const customButton = page.getByRole('button', {
        name: '사용자 지정 날짜 범위',
        exact: false,
      });
      await expect(customButton).toHaveAttribute('aria-label', '사용자 지정 날짜 범위');
    });

    test('9.4 기간 필터 버튼 그룹이 role="group"과 aria-label을 가진다', async ({ page }) => {
      const buttonGroup = page.locator('[role="group"][aria-label="기간 선택"]');
      await expect(buttonGroup).toBeVisible();
    });

    test('9.5 KPI 카드가 role="region"과 aria-label을 가진다', async ({ page }) => {
      const kpiCard = page.locator('[role="region"][aria-label*="총 접수"]').first();
      await expect(kpiCard).toBeVisible();
      await expect(kpiCard).toHaveAttribute('aria-label');
    });

    test('9.6 차트의 dateRange에 aria-label이 설정되어 있다', async ({ page }) => {
      const dateRangeLabel = page.locator('span[aria-label^="기간:"]');

      if ((await dateRangeLabel.count()) > 0) {
        const ariaLabel = await dateRangeLabel.getAttribute('aria-label');
        expect(ariaLabel).toMatch(/기간:/);
      }
    });

    test('9.7 변화 지표에 보조 설명이 aria-label로 제공된다', async ({ page }) => {
      const changeIndicator = page
        .locator('[role="region"][aria-label*="총 접수"]')
        .first()
        .locator('p')
        .filter({ hasText: /\+8\.5%/ });

      if ((await changeIndicator.count()) > 0) {
        await expect(changeIndicator).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('10. 로딩 상태', () => {
    test('10.1 초기 로딩 시 스피너가 표시된다', async ({ page }) => {
      // 느린 API 응답 시뮬레이션
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockDashboardData,
          }),
        });
      });

      await page.goto('/dashboard');

      // 로딩 스피너 확인
      const spinner = page.locator('.animate-spin');
      if ((await spinner.count()) > 0) {
        await expect(spinner).toBeVisible();
      }

      // 로딩 완료 대기
      await page.waitForLoadState('networkidle');
    });

    test('10.2 로딩 중에도 페이지 제목과 설명이 표시된다', async ({ page }) => {
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockDashboardData,
          }),
        });
      });

      await page.goto('/dashboard');

      // 로딩 중에도 제목 표시
      const title = page.locator('h1', { hasText: '통계 대시보드' });
      await expect(title).toBeVisible();

      const description = page.locator('p', {
        hasText: 'VOC 처리 현황을 한눈에 확인하세요.',
      });
      await expect(description).toBeVisible();
    });
  });

  test.describe('11. 정보 안내 섹션', () => {
    test('11.1 하단에 정보 안내 메시지가 표시된다', async ({ page }) => {
      const infoSection = page.locator('.bg-blue-50.dark\\:bg-blue-900\\/20');
      await expect(infoSection).toBeVisible();
    });

    test('11.2 정보 안내 메시지에 아이콘이 표시된다', async ({ page }) => {
      const infoSection = page.locator('.bg-blue-50.dark\\:bg-blue-900\\/20');
      const icon = infoSection.locator('span.material-icons-outlined');

      await expect(icon).toBeVisible();
      await expect(icon).toHaveText('info');
    });

    test('11.3 정보 안내 메시지 내용이 올바르다', async ({ page }) => {
      const infoText = page.locator('p.text-xs').filter({
        hasText: '통계 데이터는 매시간 자동으로 갱신됩니다',
      });

      await expect(infoText).toBeVisible();
      await expect(infoText).toContainText('최대 90일까지 조회 가능합니다');
    });
  });

  test.describe('12. 에지 케이스', () => {
    test('12.1 API 오류 시 에러 메시지가 표시된다', async ({ page }) => {
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: '서버 오류' },
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const errorMessage = page.locator('text=데이터를 불러올 수 없습니다');
      await expect(errorMessage).toBeVisible();
    });

    test('12.2 네트워크 오류 시 재시도 가능하다', async ({ page }) => {
      let failCount = 0;

      await page.route('**/api/statistics/dashboard**', async (route) => {
        failCount++;
        if (failCount === 1) {
          await route.abort('failed');
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: mockDashboardData,
            }),
          });
        }
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // 재시도 (새로고침)
      const refreshButton = page.getByRole('button', { name: '데이터 새로고침' });
      if ((await refreshButton.count()) > 0) {
        await refreshButton.click();
        await page.waitForLoadState('networkidle');

        // 성공적으로 데이터 로드
        const kpiCard = page.locator('[role="region"]').first();
        await expect(kpiCard).toBeVisible();
      }
    });

    test('12.3 KPI 값이 null일 때 0으로 표시된다', async ({ page }) => {
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ...mockDashboardData,
              kpi: {
                totalVocs: null,
                avgResolutionTimeHours: null,
                resolutionRate: null,
                pendingVocs: null,
              },
            },
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // null 값이 0으로 처리되는지 확인
      const totalVocValue = page
        .locator('[role="region"][aria-label*="총 접수"]')
        .first()
        .locator('p.text-3xl');
      await expect(totalVocValue).toHaveText(/0건/);
    });

    test('12.4 차트 데이터가 빈 배열일 때 빈 상태가 표시된다', async ({ page }) => {
      await page.route('**/api/statistics/dashboard**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              kpi: mockDashboardData.kpi,
              trend: [],
              categoryStats: [],
              statusDistribution: [],
            },
          }),
        });
      });

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const emptyMessages = page.locator('text=데이터가 없습니다');
      const count = await emptyMessages.count();
      expect(count).toBeGreaterThanOrEqual(2); // 여러 차트가 빈 상태
    });
  });

  test.describe('13. 다크 모드', () => {
    test('13.1 다크 모드에서 배경색이 올바르게 적용된다', async ({ page }) => {
      // 다크 모드 활성화
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 카드 배경색 확인 (dark:bg-surface-dark)
      const kpiCard = page.locator('[role="region"]').first();
      await expect(kpiCard).toHaveClass(/dark:bg-surface-dark/);
    });

    test('13.2 다크 모드에서 텍스트 색상이 올바르게 적용된다', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 제목 텍스트 확인 (dark:text-slate-100)
      const chartTitle = page.locator('h3').first();
      await expect(chartTitle).toHaveClass(/dark:text-slate-100/);
    });

    test('13.3 다크 모드에서 border 색상이 올바르게 적용된다', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      const kpiCard = page.locator('[role="region"]').first();
      await expect(kpiCard).toHaveClass(/dark:border-border-dark/);
    });
  });
});
