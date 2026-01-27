import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for VOC Status Lookup
 * Route: /voc/status (public page)
 */
export class VocStatusPage {
  readonly page: Page;

  // Form fields
  readonly ticketIdInput: Locator;
  readonly emailInput: Locator;

  // Buttons
  readonly searchButton: Locator;

  // Results
  readonly resultContainer: Locator;
  readonly ticketIdDisplay: Locator;
  readonly titleDisplay: Locator;
  readonly statusBadge: Locator;
  readonly timeline: Locator;

  // Error messages
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form fields
    this.ticketIdInput = page.locator('#ticketId');
    this.emailInput = page.locator('#customerEmail');

    // Buttons
    this.searchButton = page.getByRole('button', { name: /조회/i });

    // Results
    this.resultContainer = page.locator('[data-testid="voc-status-result"]');
    this.ticketIdDisplay = page.locator('[data-testid="result-ticket-id"]');
    this.titleDisplay = page.locator('[data-testid="result-title"]');
    this.statusBadge = page.locator('[data-testid="result-status"]');
    this.timeline = page.locator('[data-testid="status-timeline"]');

    // Error messages
    this.errorMessage = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/voc/status');
    await this.page.waitForLoadState('networkidle');
  }

  async fillTicketId(ticketId: string) {
    await this.ticketIdInput.fill(ticketId);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async clickSearch() {
    await this.searchButton.click();
  }

  async searchStatus(ticketId: string, email: string) {
    await this.fillTicketId(ticketId);
    await this.fillEmail(email);
    await this.clickSearch();
  }

  async waitForResult() {
    await expect(this.resultContainer).toBeVisible({ timeout: 10000 });
  }

  async verifyResultDisplayed(expectedTicketId: string) {
    await this.waitForResult();
    const ticketId = await this.ticketIdDisplay.textContent();
    expect(ticketId).toContain(expectedTicketId);
  }

  async verifyErrorDisplayed(expectedError?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedError) {
      const errorText = await this.errorMessage.textContent();
      expect(errorText).toContain(expectedError);
    }
  }

  async verifyStatusBadge(_expectedStatus: string) {
    const statusText = await this.statusBadge.textContent();
    expect(statusText).toBeTruthy();
  }

  async verifyTimelineDisplayed() {
    await expect(this.timeline).toBeVisible();
  }

  async getTimelineItems(): Promise<number> {
    const items = await this.timeline.locator('[data-testid="timeline-item"]').count();
    return items;
  }

  async verifyValidationError(field: string) {
    const errorLocator = this.page.locator(`#${field}`).locator('xpath=following-sibling::p[@role="alert"]');
    await expect(errorLocator).toBeVisible();
  }
}
