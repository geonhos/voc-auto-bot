import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for VOC Table view
 * Route: /voc/table
 */
export class VocTablePage {
  readonly page: Page;

  // Table elements
  readonly table: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;

  // Filter elements
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly priorityFilter: Locator;
  readonly categoryFilter: Locator;
  readonly dateFromInput: Locator;
  readonly dateToInput: Locator;
  readonly applyFilterButton: Locator;
  readonly resetFilterButton: Locator;

  // Pagination
  readonly pageSizeSelect: Locator;
  readonly prevPageButton: Locator;
  readonly nextPageButton: Locator;
  readonly pageInfo: Locator;

  // Row selection
  readonly selectAllCheckbox: Locator;

  // Loading state
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Table elements
    this.table = page.locator('table');
    this.tableHeaders = page.locator('thead th');
    this.tableRows = page.locator('tbody tr');

    // Filter elements
    this.searchInput = page.locator('#search');
    this.statusFilter = page.locator('#statusFilter');
    this.priorityFilter = page.locator('#priorityFilter');
    this.categoryFilter = page.locator('#categoryFilter');
    this.dateFromInput = page.locator('#dateFrom');
    this.dateToInput = page.locator('#dateTo');
    this.applyFilterButton = page.getByRole('button', { name: /적용/i });
    this.resetFilterButton = page.getByRole('button', { name: /초기화/i });

    // Pagination
    this.pageSizeSelect = page.locator('#pageSize');
    this.prevPageButton = page.getByRole('button', { name: /이전/i });
    this.nextPageButton = page.getByRole('button', { name: /다음/i });
    this.pageInfo = page.locator('[data-testid="page-info"]');

    // Row selection
    this.selectAllCheckbox = page.locator('thead input[type="checkbox"]');

    // Loading state
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.emptyState = page.getByText(/검색 결과가 없습니다/i);
  }

  async goto() {
    await this.page.goto('/voc/table');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForTableLoad() {
    await this.table.waitFor({ state: 'visible' });
  }

  async getRowCount(): Promise<number> {
    await this.waitForTableLoad();
    return await this.tableRows.count();
  }

  async clickRow(index: number) {
    await this.tableRows.nth(index).click();
  }

  async clickRowByTicketId(ticketId: string) {
    const row = this.tableRows.filter({ hasText: ticketId });
    await row.click();
  }

  async getRowData(index: number) {
    const row = this.tableRows.nth(index);
    const cells = row.locator('td');

    return {
      ticketId: await cells.nth(0).textContent(),
      title: await cells.nth(1).textContent(),
      category: await cells.nth(2).textContent(),
      status: await cells.nth(3).textContent(),
      priority: await cells.nth(4).textContent(),
      assignee: await cells.nth(5).textContent(),
    };
  }

  // Filter methods
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.applyFilterButton.click();
    await this.waitForTableLoad();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.applyFilterButton.click();
    await this.waitForTableLoad();
  }

  async filterByPriority(priority: string) {
    await this.priorityFilter.selectOption(priority);
    await this.applyFilterButton.click();
    await this.waitForTableLoad();
  }

  async filterByCategory(categoryId: string) {
    await this.categoryFilter.selectOption(categoryId);
    await this.applyFilterButton.click();
    await this.waitForTableLoad();
  }

  async filterByDateRange(from: string, to: string) {
    await this.dateFromInput.fill(from);
    await this.dateToInput.fill(to);
    await this.applyFilterButton.click();
    await this.waitForTableLoad();
  }

  async resetFilters() {
    await this.resetFilterButton.click();
    await this.waitForTableLoad();
  }

  // Sorting methods
  async sortByColumn(columnName: string) {
    const header = this.tableHeaders.filter({ hasText: columnName });
    await header.click();
    await this.waitForTableLoad();
  }

  async verifySortOrder(columnIndex: number, order: 'asc' | 'desc') {
    const cells = this.tableRows.locator(`td:nth-child(${columnIndex + 1})`);
    const values = await cells.allTextContents();

    const sorted = [...values].sort();
    if (order === 'desc') {
      sorted.reverse();
    }

    expect(values).toEqual(sorted);
  }

  // Pagination methods
  async changePageSize(size: number) {
    await this.pageSizeSelect.selectOption(size.toString());
    await this.waitForTableLoad();
  }

  async goToNextPage() {
    await this.nextPageButton.click();
    await this.waitForTableLoad();
  }

  async goToPrevPage() {
    await this.prevPageButton.click();
    await this.waitForTableLoad();
  }

  async verifyPaginationInfo(expectedTotal: number) {
    const infoText = await this.pageInfo.textContent();
    expect(infoText).toContain(expectedTotal.toString());
  }

  async verifyNextPageDisabled() {
    await expect(this.nextPageButton).toBeDisabled();
  }

  async verifyPrevPageDisabled() {
    await expect(this.prevPageButton).toBeDisabled();
  }

  // Row selection methods
  async selectAllRows() {
    await this.selectAllCheckbox.check();
  }

  async deselectAllRows() {
    await this.selectAllCheckbox.uncheck();
  }

  async selectRow(index: number) {
    const checkbox = this.tableRows.nth(index).locator('input[type="checkbox"]');
    await checkbox.check();
  }

  async getSelectedRowCount(): Promise<number> {
    const checkedBoxes = this.tableRows.locator('input[type="checkbox"]:checked');
    return await checkedBoxes.count();
  }

  // Verification methods
  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async verifyRowExists(ticketId: string) {
    const row = this.tableRows.filter({ hasText: ticketId });
    await expect(row).toBeVisible();
  }

  async verifyRowNotExists(ticketId: string) {
    const row = this.tableRows.filter({ hasText: ticketId });
    await expect(row).not.toBeVisible();
  }
}
