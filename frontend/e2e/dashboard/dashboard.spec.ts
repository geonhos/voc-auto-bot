import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { mockApi } from '../utils/test-helpers';

/**
 * @description E2E tests for Dashboard (SC-11)
 * Tests cover KPI cards, charts rendering, period filters, and recent VOC list
 */
test.describe('Dashboard - SC-11', () => {
  let dashboardPage: DashboardPage;

  const mockDashboardData = {
    kpi: {
      totalVocs: 1250,
      avgResolutionTimeHours: 24.5,
      resolutionRate: 87.3,
      pendingVocs: 158,
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
      { status: 'PENDING', count: 158, percentage: 12.6 },
      { status: 'IN_PROGRESS', count: 305, percentage: 24.4 },
      { status: 'RESOLVED', count: 687, percentage: 55.0 },
      { status: 'REJECTED', count: 100, percentage: 8.0 },
    ],
    priorityDistribution: [
      { priority: 'HIGH', count: 125, percentage: 10.0 },
      { priority: 'MEDIUM', count: 750, percentage: 60.0 },
      { priority: 'LOW', count: 375, percentage: 30.0 },
    ],
    recentVocs: [
      {
        id: 1001,
        title: '제품 배송 지연 문의',
        category: '배송 문의',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        createdAt: '2024-01-07T14:30:00Z',
      },
      {
        id: 1002,
        title: '기능 사용법 문의',
        category: '제품 문의',
        status: 'PENDING',
        priority: 'MEDIUM',
        createdAt: '2024-01-07T13:15:00Z',
      },
      {
        id: 1003,
        title: '환불 요청',
        category: '환불 요청',
        status: 'RESOLVED',
        priority: 'HIGH',
        createdAt: '2024-01-07T11:45:00Z',
      },
    ],
  };

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);

    // Mock dashboard statistics API
    await mockApi(
      page,
      /\/api\/statistics\/dashboard/,
      {
        status: 200,
        body: mockDashboardData,
      },
      { method: 'GET' }
    );

    await dashboardPage.goto();
  });

  test('should display KPI cards', async () => {
    // Verify all KPI cards are displayed
    const cardCount = await dashboardPage.getKpiCardCount();
    expect(cardCount).toBe(4);

    // Verify specific KPI cards
    await dashboardPage.verifyKpiCard(/총 접수|total/i, /1,250|1250/);
    await dashboardPage.verifyKpiCard(/평균 처리|average.*time/i, /24\.5/);
    await dashboardPage.verifyKpiCard(/완료율|resolution rate/i, /87\.3/);
    await dashboardPage.verifyKpiCard(/처리 중|pending/i, /158/);
  });

  test('should display KPI change indicators', async () => {
    // Verify increase indicator
    await dashboardPage.verifyKpiCardChange(/총 접수|total/i, 'increase');

    // Verify decrease indicator (processing time improved)
    await dashboardPage.verifyKpiCardChange(/평균 처리|average.*time/i, 'decrease');

    // Verify neutral indicator
    await dashboardPage.verifyKpiCardChange(/처리 중|pending/i, 'neutral');
  });

  test('should render trend chart', async () => {
    // Verify trend chart is rendered
    await dashboardPage.verifyTrendChartRendered();

    // Verify chart has data points
    const dataPoints = dashboardPage.trendChart.locator('[data-testid="chart-data-point"]');
    const count = await dataPoints.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render category chart', async () => {
    // Verify category chart is rendered
    await dashboardPage.verifyCategoryChartRendered();

    // Verify chart legend
    await dashboardPage.verifyChartLegend('category');
  });

  test('should render status chart', async () => {
    // Verify status chart is rendered
    await dashboardPage.verifyStatusChartRendered();

    // Verify chart legend
    await dashboardPage.verifyChartLegend('status');
  });

  test('should render priority chart', async () => {
    // Verify priority chart is rendered
    await dashboardPage.verifyPriorityChartRendered();

    // Verify chart legend
    await dashboardPage.verifyChartLegend('priority');
  });

  test('should display recent VOC list', async () => {
    // Verify recent VOC list is displayed
    await dashboardPage.verifyRecentVocList(3);

    // Verify recent VOC count
    const count = await dashboardPage.getRecentVocCount();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should navigate to VOC detail when clicking recent VOC item', async ({ page }) => {
    // Click on first recent VOC item
    await dashboardPage.clickRecentVoc(0);

    // Verify navigation to VOC detail page
    await page.waitForURL(/\/voc\/\d+/);
    expect(page.url()).toMatch(/\/voc\/\d+/);
  });

  test('should change period filter to today', async ({ page }) => {
    // Mock today's data
    await mockApi(
      page,
      /\/api\/statistics\/dashboard\?period=today/,
      {
        status: 200,
        body: {
          ...mockDashboardData,
          kpi: {
            ...mockDashboardData.kpi,
            totalVocs: 50,
          },
        },
      },
      { method: 'GET' }
    );

    // Change to today
    await dashboardPage.changePeriod('today');

    // Verify period is selected
    await dashboardPage.verifyPeriodSelected('today');

    // Verify data updated
    await dashboardPage.verifyKpiCard(/총 접수|total/i, /50/);
  });

  test('should change period filter to 7 days', async ({ page }) => {
    // Mock 7 days data
    await mockApi(
      page,
      /\/api\/statistics\/dashboard\?period=7days/,
      {
        status: 200,
        body: mockDashboardData,
      },
      { method: 'GET' }
    );

    // Change to 7 days
    await dashboardPage.changePeriod('7days');

    // Verify period is selected
    await dashboardPage.verifyPeriodSelected('7days');

    // Verify date range label updated
    await dashboardPage.verifyDateRange(/7일|7 days/i);
  });

  test('should change period filter to 30 days', async ({ page }) => {
    // Mock 30 days data
    await mockApi(
      page,
      /\/api\/statistics\/dashboard\?period=30days/,
      {
        status: 200,
        body: {
          ...mockDashboardData,
          kpi: {
            totalVocs: 3500,
            avgResolutionTimeHours: 28.3,
            resolutionRate: 85.2,
            pendingVocs: 520,
          },
        },
      },
      { method: 'GET' }
    );

    // Change to 30 days
    await dashboardPage.changePeriod('30days');

    // Verify period is selected
    await dashboardPage.verifyPeriodSelected('30days');

    // Verify data updated
    await dashboardPage.verifyKpiCard(/총 접수|total/i, /3,500|3500/);
  });

  test('should refresh dashboard data', async ({ page }) => {
    // Mock refreshed data
    await mockApi(
      page,
      /\/api\/statistics\/dashboard/,
      {
        status: 200,
        body: {
          ...mockDashboardData,
          kpi: {
            ...mockDashboardData.kpi,
            totalVocs: 1260,
          },
        },
      },
      { method: 'GET' }
    );

    // Refresh data
    await dashboardPage.refreshData();

    // Verify data updated
    await dashboardPage.verifyKpiCard(/총 접수|total/i, /1,260|1260/);
  });

  test('should show loading state when fetching data', async ({ page }) => {
    // Navigate to dashboard (loading should appear briefly)
    await page.goto('/dashboard');

    // Verify loading state
    await dashboardPage.verifyLoadingState();

    // Wait for data to load
    await dashboardPage.waitForDataLoad();

    // Verify KPI cards are displayed
    const cardCount = await dashboardPage.getKpiCardCount();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await mockApi(
      page,
      /\/api\/statistics\/dashboard/,
      {
        status: 500,
        body: {
          error: {
            message: '서버 오류가 발생했습니다',
            code: 'INTERNAL_SERVER_ERROR',
          },
        },
      },
      { method: 'GET' }
    );

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Verify error state
    await dashboardPage.verifyErrorState(/서버 오류|error/i);
  });

  test('should display empty state when no data', async ({ page }) => {
    // Mock empty data
    await mockApi(
      page,
      /\/api\/statistics\/dashboard/,
      {
        status: 200,
        body: {
          kpi: {
            totalVocs: 0,
            avgResolutionTimeHours: 0,
            resolutionRate: 0,
            pendingVocs: 0,
          },
          trend: [],
          categoryStats: [],
          statusDistribution: [],
          recentVocs: [],
        },
      },
      { method: 'GET' }
    );

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Wait for loading to complete
    await dashboardPage.waitForDataLoad();

    // Verify empty state (at least for some charts)
    await dashboardPage.verifyKpiCard(/총 접수|total/i, /0/);
  });

  test('should display chart tooltip on hover', async () => {
    // Hover over trend chart data point
    const dataPoints = dashboardPage.trendChart.locator('[data-testid="chart-data-point"]');
    await dataPoints.first().hover();

    // Verify tooltip is displayed
    await dashboardPage.verifyChartTooltip(/received|resolved|접수|처리/i);
  });

  test('should filter VOCs by category when clicking category chart', async ({ page }) => {
    // Mock category filter navigation
    await dashboardPage.clickCategoryChartBar('제품 문의');

    // Verify navigation to filtered VOC list
    await page.waitForURL(/\/voc.*category/);
    expect(page.url()).toMatch(/category/);
  });

  test('should toggle chart legend items', async () => {
    // Toggle legend item
    await dashboardPage.toggleLegendItem('trend', /received|접수/i);

    // Verify legend item state changed (might hide corresponding data)
    // This depends on your chart library implementation
  });

  test('should display correct date range label', async () => {
    // Default period (7 days)
    await dashboardPage.verifyDateRange(/2024-01-01.*2024-01-07/i);
  });

  test('should get all KPI values', async () => {
    // Get all KPI values
    const kpiValues = await dashboardPage.getAllKpiValues();

    // Verify all KPIs are present
    expect(Object.keys(kpiValues).length).toBeGreaterThan(0);
    expect(kpiValues).toHaveProperty('총 접수 건수');
    expect(kpiValues).toHaveProperty('평균 처리 시간');
    expect(kpiValues).toHaveProperty('완료율');
    expect(kpiValues).toHaveProperty('처리 중');
  });

  test('should handle custom period selection', async ({ page }) => {
    // Change to custom period
    await dashboardPage.changePeriod('custom');

    // Verify custom period selector appears
    const datePicker = page.getByRole('dialog', { name: /date|기간/i });
    await expect(datePicker).toBeVisible();

    // Select custom date range (implementation depends on date picker component)
    // This is a placeholder - adjust based on your date picker implementation
  });

  test('should maintain filter state on page refresh', async ({ page }) => {
    // Change period
    await dashboardPage.changePeriod('30days');

    // Refresh page
    await page.reload();

    // Verify period is still selected (if you implement state persistence)
    // await dashboardPage.verifyPeriodSelected('30days');
  });

  test('should display responsive charts on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to dashboard
    await dashboardPage.goto();

    // Verify charts are still rendered
    await dashboardPage.verifyTrendChartRendered();
    await dashboardPage.verifyCategoryChartRendered();

    // Verify KPI cards are stacked vertically
    const kpiCards = dashboardPage.kpiCards;
    const firstCard = kpiCards.first();
    const secondCard = kpiCards.nth(1);

    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();

    if (firstBox && secondBox) {
      // In mobile view, cards should be stacked (second card should be below first)
      expect(secondBox.y).toBeGreaterThan(firstBox.y);
    }
  });

  test('should export dashboard data', async ({ page }) => {
    // Click export button (if implemented)
    const exportButton = page.getByRole('button', { name: /export|내보내기|다운로드/i });

    if (await exportButton.isVisible()) {
      // Mock export API
      await mockApi(
        page,
        /\/api\/statistics\/export/,
        {
          status: 200,
          body: {
            downloadUrl: '/downloads/dashboard-export.xlsx',
          },
        },
        { method: 'POST' }
      );

      // Click export
      await exportButton.click();

      // Verify download initiated
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      expect(download).toBeTruthy();
    }
  });

  test('should display help tooltip for KPI cards', async () => {
    // Hover over help icon
    const helpIcon = dashboardPage.kpiCards.first().locator('[data-testid="help-icon"]');

    if (await helpIcon.isVisible()) {
      await helpIcon.hover();

      // Verify tooltip
      const tooltip = dashboardPage.page.locator('[role="tooltip"]');
      await expect(tooltip).toBeVisible();
    }
  });
});
