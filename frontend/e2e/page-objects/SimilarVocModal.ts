import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for Similar VOC Modal
 */
export class SimilarVocModal {
  readonly page: Page;

  // Modal elements
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly title: Locator;

  // Similar VOC list
  readonly similarVocList: Locator;
  readonly similarVocCards: Locator;

  // Loading state
  readonly loadingSpinner: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Modal elements
    this.modal = page.getByRole('dialog', { name: /유사 VOC/i });
    this.closeButton = this.modal.getByRole('button', { name: /닫기/i });
    this.title = this.modal.locator('[data-testid="modal-title"]');

    // Similar VOC list
    this.similarVocList = this.modal.locator('[data-testid="similar-voc-list"]');
    this.similarVocCards = this.similarVocList.locator('[data-testid="similar-voc-card"]');

    // Loading state
    this.loadingSpinner = this.modal.locator('[data-testid="loading-spinner"]');
    this.emptyState = this.modal.getByText(/유사한 VOC가 없습니다/i);
  }

  async waitForModal() {
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  async close() {
    await this.closeButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async closeByEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.modal).not.toBeVisible();
  }

  async getSimilarVocCount(): Promise<number> {
    return await this.similarVocCards.count();
  }

  getCardByIndex(index: number): Locator {
    return this.similarVocCards.nth(index);
  }

  async getCardData(index: number) {
    const card = this.getCardByIndex(index);

    return {
      ticketId: await card.locator('[data-testid="similar-voc-ticket-id"]').textContent(),
      title: await card.locator('[data-testid="similar-voc-title"]').textContent(),
      similarity: await card.locator('[data-testid="similar-voc-similarity"]').textContent(),
      status: await card.locator('[data-testid="similar-voc-status"]').textContent(),
    };
  }

  async verifySimilarityScore(index: number, minScore: number) {
    const card = await this.getCardByIndex(index);
    const similarityText = await card.locator('[data-testid="similar-voc-similarity"]').textContent();

    // Extract percentage (e.g., "87%" -> 87)
    const score = parseFloat(similarityText?.replace('%', '') || '0');
    expect(score).toBeGreaterThanOrEqual(minScore);
  }

  async verifySortedBySimilarity() {
    const count = await this.getSimilarVocCount();
    const scores: number[] = [];

    for (let i = 0; i < count; i++) {
      const card = await this.getCardByIndex(i);
      const similarityText = await card.locator('[data-testid="similar-voc-similarity"]').textContent();
      const score = parseFloat(similarityText?.replace('%', '') || '0');
      scores.push(score);
    }

    // Verify descending order
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  }

  async clickCard(index: number) {
    const card = await this.getCardByIndex(index);
    await card.click();
  }

  async clickCardByTicketId(ticketId: string) {
    const card = this.similarVocCards.filter({ hasText: ticketId });
    await card.click();
  }

  async navigateToDetail(index: number) {
    await this.clickCard(index);
    // Wait for navigation
    await this.page.waitForLoadState('networkidle');
  }

  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async verifyLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async verifyCardExists(ticketId: string) {
    const card = this.similarVocCards.filter({ hasText: ticketId });
    await expect(card).toBeVisible();
  }

  async verifyCardNotExists(ticketId: string) {
    const card = this.similarVocCards.filter({ hasText: ticketId });
    await expect(card).not.toBeVisible();
  }

  async verifyMinimumSimilarity(minScore: number) {
    const count = await this.getSimilarVocCount();

    for (let i = 0; i < count; i++) {
      await this.verifySimilarityScore(i, minScore);
    }
  }
}
