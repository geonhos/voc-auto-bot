import { Page, Locator, expect } from '@playwright/test';
import { waitForNetworkIdle } from '../utils/test-helpers';

/**
 * @description Page Object Model for Dashboard
 */
export class DashboardPage {
  readonly page: Page;
  readonly kpiCards: Locator;
  readonly trendChart: Locator;
  readonly categoryChart: Locator;
  readonly statusChart: Locator;
  readonly priorityChart: Locator;
  readonly recentVocList: Locator;
  readonly periodButtons: Locator;
  readonly refreshButton: Locator;
  readonly dateRangeLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.kpiCards = page.locator('[data-testid="kpi-card"]');
    this.trendChart = page.locator('[data-testid="trend-chart"]');
    this.categoryChart = page.locator('[data-testid="category-chart"]');
    this.statusChart = page.locator('[data-testid="status-chart"]');
    this.priorityChart = page.locator('[data-testid="priority-chart"]');
    this.recentVocList = page.locator('[data-testid="recent-voc-list"]');
    this.periodButtons = page.getByRole('group', { name: /기간 선택/i });
    this.refreshButton = page.getByRole('button', { name: /refresh|새로고침/i });
    this.dateRangeLabel = page.locator('[data-testid="date-range-label"]');
  }

  /**
   * @description Navigate to dashboard
   */
  async goto() {
    await this.page.goto('/dashboard');
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Get KPI card count
   */
  async getKpiCardCount(): Promise<number> {
    return await this.kpiCards.count();
  }

  /**
   * @description Get KPI card by title
   */
  async getKpiCard(title: string | RegExp): Promise<Locator> {
    return this.kpiCards.filter({ hasText: title });
  }

  /**
   * @description Get KPI card value
   */
  async getKpiCardValue(title: string | RegExp): Promise<string> {
    const card = await this.getKpiCard(title);
    const value = card.locator('[data-testid="kpi-value"]');
    return (await value.textContent()) || '';
  }

  /**
   * @description Verify KPI card is displayed
   */
  async verifyKpiCard(title: string | RegExp, expectedValue?: string | RegExp) {
    const card = await this.getKpiCard(title);
    await expect(card).toBeVisible();

    if (expectedValue) {
      const value = card.locator('[data-testid="kpi-value"]');
      await expect(value).toContainText(expectedValue);
    }
  }

  /**
   * @description Verify KPI card change indicator
   */
  async verifyKpiCardChange(
    title: string | RegExp,
    changeType: 'increase' | 'decrease' | 'neutral'
  ) {
    const card = await this.getKpiCard(title);
    const changeIndicator = card.locator('[data-testid="kpi-change"]');

    const expectedClass = {
      increase: /increase|up|positive/i,
      decrease: /decrease|down|negative/i,
      neutral: /neutral|stable/i,
    };

    await expect(changeIndicator).toHaveClass(expectedClass[changeType]);
  }

  /**
   * @description Verify trend chart is rendered
   */
  async verifyTrendChartRendered() {
    await expect(this.trendChart).toBeVisible();

    // Check if chart SVG or canvas is present
    const chartElement = this.trendChart.locator('svg, canvas');
    await expect(chartElement).toBeVisible();
  }

  /**
   * @description Verify category chart is rendered
   */
  async verifyCategoryChartRendered() {
    await expect(this.categoryChart).toBeVisible();

    const chartElement = this.categoryChart.locator('svg, canvas');
    await expect(chartElement).toBeVisible();
  }

  /**
   * @description Verify status chart is rendered
   */
  async verifyStatusChartRendered() {
    await expect(this.statusChart).toBeVisible();

    const chartElement = this.statusChart.locator('svg, canvas');
    await expect(chartElement).toBeVisible();
  }

  /**
   * @description Verify priority chart is rendered
   */
  async verifyPriorityChartRendered() {
    await expect(this.priorityChart).toBeVisible();

    const chartElement = this.priorityChart.locator('svg, canvas');
    await expect(chartElement).toBeVisible();
  }

  /**
   * @description Get recent VOC count
   */
  async getRecentVocCount(): Promise<number> {
    const items = this.recentVocList.locator('[data-testid="voc-item"]');
    return await items.count();
  }

  /**
   * @description Verify recent VOC list is displayed
   */
  async verifyRecentVocList(minCount = 1) {
    await expect(this.recentVocList).toBeVisible();

    const count = await this.getRecentVocCount();
    expect(count).toBeGreaterThanOrEqual(minCount);
  }

  /**
   * @description Click on recent VOC item
   */
  async clickRecentVoc(index: number) {
    const items = this.recentVocList.locator('[data-testid="voc-item"]');
    await items.nth(index).click();
  }

  /**
   * @description Change period filter
   */
  async changePeriod(period: 'today' | '7days' | '30days' | 'custom') {
    const periodLabels = {
      today: /오늘|today/i,
      '7days': /7일|7 days/i,
      '30days': /30일|30 days/i,
      custom: /사용자 지정|custom/i,
    };

    const button = this.periodButtons.getByRole('button', {
      name: periodLabels[period],
    });

    await button.click();
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Verify period is selected
   */
  async verifyPeriodSelected(period: 'today' | '7days' | '30days' | 'custom') {
    const periodLabels = {
      today: /오늘|today/i,
      '7days': /7일|7 days/i,
      '30days': /30일|30 days/i,
      custom: /사용자 지정|custom/i,
    };

    const button = this.periodButtons.getByRole('button', {
      name: periodLabels[period],
    });

    await expect(button).toHaveAttribute('aria-pressed', 'true');
  }

  /**
   * @description Refresh dashboard data
   */
  async refreshData() {
    await this.refreshButton.click();
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Verify date range label
   */
  async verifyDateRange(expectedRange: string | RegExp) {
    await expect(this.dateRangeLabel).toContainText(expectedRange);
  }

  /**
   * @description Click on trend chart data point
   */
  async clickTrendChartDataPoint(index: number) {
    const dataPoints = this.trendChart.locator('[data-testid="chart-data-point"]');
    await dataPoints.nth(index).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * @description Click on category chart bar
   */
  async clickCategoryChartBar(categoryName: string | RegExp) {
    const bar = this.categoryChart
      .locator('[data-testid="chart-bar"]')
      .filter({ hasText: categoryName });
    await bar.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * @description Verify chart tooltip is displayed
   */
  async verifyChartTooltip(expectedText: string | RegExp) {
    const tooltip = this.page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(expectedText);
  }

  /**
   * @description Verify loading state
   */
  async verifyLoadingState() {
    const spinner = this.page.locator('[role="progressbar"], .animate-spin');
    await expect(spinner).toBeVisible();
  }

  /**
   * @description Wait for data to load
   */
  async waitForDataLoad() {
    const spinner = this.page.locator('[role="progressbar"], .animate-spin');
    await expect(spinner).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * @description Verify error state
   */
  async verifyErrorState(message?: string | RegExp) {
    const errorMessage = this.page.getByRole('alert');
    await expect(errorMessage).toBeVisible();

    if (message) {
      await expect(errorMessage).toContainText(message);
    }
  }

  /**
   * @description Verify empty state
   */
  async verifyEmptyState(message?: string | RegExp) {
    const emptyState = this.page.getByText(
      message || /no data|데이터가 없습니다/i
    );
    await expect(emptyState).toBeVisible();
  }

  /**
   * @description Get all KPI values
   */
  async getAllKpiValues(): Promise<Record<string, string>> {
    const kpiData: Record<string, string> = {};
    const count = await this.kpiCards.count();

    for (let i = 0; i < count; i++) {
      const card = this.kpiCards.nth(i);
      const title = await card.locator('[data-testid="kpi-title"]').textContent();
      const value = await card.locator('[data-testid="kpi-value"]').textContent();

      if (title && value) {
        kpiData[title] = value;
      }
    }

    return kpiData;
  }

  /**
   * @description Verify chart legend
   */
  async verifyChartLegend(chartType: 'trend' | 'category' | 'status' | 'priority') {
    const chartMap = {
      trend: this.trendChart,
      category: this.categoryChart,
      status: this.statusChart,
      priority: this.priorityChart,
    };

    const chart = chartMap[chartType];
    const legend = chart.locator('[data-testid="chart-legend"]');
    await expect(legend).toBeVisible();
  }

  /**
   * @description Toggle chart legend item
   */
  async toggleLegendItem(
    chartType: 'trend' | 'category' | 'status' | 'priority',
    itemName: string | RegExp
  ) {
    const chartMap = {
      trend: this.trendChart,
      category: this.categoryChart,
      status: this.statusChart,
      priority: this.priorityChart,
    };

    const chart = chartMap[chartType];
    const legendItem = chart
      .locator('[data-testid="legend-item"]')
      .filter({ hasText: itemName });

    await legendItem.click();
    await this.page.waitForTimeout(300);
  }
}
