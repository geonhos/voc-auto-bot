import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for VOC Kanban board
 * Route: /dashboard or /voc/kanban
 */
export class VocKanbanPage {
  readonly page: Page;

  // Board elements
  readonly board: Locator;
  readonly columns: Locator;

  // Filter elements
  readonly filterButton: Locator;
  readonly searchInput: Locator;
  readonly priorityFilter: Locator;
  readonly categoryFilter: Locator;

  constructor(page: Page) {
    this.page = page;

    // Board elements
    this.board = page.locator('[data-testid="kanban-board"]');
    this.columns = page.locator('[data-testid="kanban-column"]');

    // Filter elements
    this.filterButton = page.getByRole('button', { name: /필터/i });
    this.searchInput = page.locator('#kanban-search');
    this.priorityFilter = page.locator('#kanban-priority-filter');
    this.categoryFilter = page.locator('#kanban-category-filter');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForBoardLoad() {
    await this.board.waitFor({ state: 'visible' });
  }

  getColumnByStatus(status: string): Locator {
    return this.columns.filter({ has: this.page.locator(`[data-status="${status}"]`) });
  }

  getColumnCards(status: string): Locator {
    const column = this.getColumnByStatus(status);
    return column.locator('[data-testid="voc-card"]');
  }

  async getCardCount(status: string): Promise<number> {
    const cards = this.getColumnCards(status);
    return await cards.count();
  }

  getCardByTicketId(ticketId: string): Locator {
    return this.board.locator(`[data-testid="voc-card"][data-ticket-id="${ticketId}"]`);
  }

  async verifyCardInColumn(ticketId: string, _expectedStatus: string) {
    const card = this.getCardByTicketId(ticketId);
    const column = this.getColumnByStatus(_expectedStatus);

    await expect(card).toBeVisible();
    await expect(column).toContainText(ticketId);
  }

  async dragCardToColumn(ticketId: string, targetStatus: string) {
    const card = this.getCardByTicketId(ticketId);
    const targetColumn = this.getColumnByStatus(targetStatus);

    // Get bounding boxes
    const cardBox = await card.boundingBox();
    const columnBox = await targetColumn.boundingBox();

    if (!cardBox || !columnBox) {
      throw new Error('Card or column not found');
    }

    // Perform drag and drop
    await this.page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(columnBox.x + columnBox.width / 2, columnBox.y + columnBox.height / 2, {
      steps: 10,
    });
    await this.page.mouse.up();

    // Wait for animation to complete
    await this.page.waitForTimeout(500);
  }

  async clickCard(ticketId: string) {
    const card = this.getCardByTicketId(ticketId);
    await card.click();
  }

  async getCardData(ticketId: string) {
    const card = this.getCardByTicketId(ticketId);

    return {
      title: await card.locator('[data-testid="card-title"]').textContent(),
      priority: await card.locator('[data-testid="card-priority"]').textContent(),
      ticketId: await card.locator('[data-testid="card-ticket-id"]').textContent(),
    };
  }

  // Filter methods
  async openFilter() {
    await this.filterButton.click();
  }

  async searchCards(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByPriority(priority: string) {
    await this.priorityFilter.selectOption(priority);
    await this.page.waitForTimeout(500);
  }

  async filterByCategory(categoryId: string) {
    await this.categoryFilter.selectOption(categoryId);
    await this.page.waitForTimeout(500);
  }

  async verifyCardVisible(ticketId: string) {
    const card = await this.getCardByTicketId(ticketId);
    await expect(card).toBeVisible();
  }

  async verifyCardNotVisible(ticketId: string) {
    const card = await this.getCardByTicketId(ticketId);
    await expect(card).not.toBeVisible();
  }

  async verifyColumnCount(status: string, expectedCount: number) {
    const count = await this.getCardCount(status);
    expect(count).toBe(expectedCount);
  }

  async verifyAllColumnsVisible() {
    const columnCount = await this.columns.count();
    expect(columnCount).toBeGreaterThanOrEqual(5); // At least 5 status columns
  }
}
