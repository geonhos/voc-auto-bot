import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for VOC Input form
 * Route: /voc/input
 */
export class VocInputPage {
  readonly page: Page;

  // Form fields
  readonly titleInput: Locator;
  readonly contentTextarea: Locator;
  readonly categorySelect: Locator;
  readonly prioritySelect: Locator;
  readonly customerNameInput: Locator;
  readonly customerPhoneInput: Locator;
  readonly fileUploadInput: Locator;

  // Buttons
  readonly submitButton: Locator;
  readonly resetButton: Locator;

  // Success modal
  readonly successModal: Locator;
  readonly successTicketId: Locator;
  readonly newVocButton: Locator;

  // Error messages
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form fields
    this.titleInput = page.locator('#title');
    this.contentTextarea = page.locator('#content');
    this.categorySelect = page.locator('#categoryId');
    this.prioritySelect = page.locator('#priority');
    this.customerNameInput = page.locator('#customerName');
    this.customerPhoneInput = page.locator('#customerPhone');
    this.fileUploadInput = page.locator('input[type="file"]');

    // Buttons
    this.submitButton = page.getByRole('button', { name: /VOC 등록/i });
    this.resetButton = page.getByRole('button', { name: /초기화/i });

    // Success modal
    this.successModal = page.getByRole('dialog');
    this.successTicketId = page.locator('[data-testid="success-ticket-id"]');
    this.newVocButton = page.getByRole('button', { name: /새 VOC 등록/i });

    // Error messages
    this.errorAlert = page.locator('[role="alert"]');
  }

  async goto() {
    await this.page.goto('/voc/input');
    await this.page.waitForLoadState('networkidle');
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillContent(content: string) {
    await this.contentTextarea.fill(content);
  }

  async selectCategory(categoryId: number) {
    await this.categorySelect.selectOption(categoryId.toString());
  }

  async selectPriority(priority: string) {
    await this.prioritySelect.selectOption(priority);
  }

  async fillCustomerName(name: string) {
    await this.customerNameInput.fill(name);
  }

  async fillCustomerPhone(phone: string) {
    await this.customerPhoneInput.fill(phone);
  }

  async uploadFile(filePath: string) {
    await this.fileUploadInput.setInputFiles(filePath);
  }

  async uploadMultipleFiles(filePaths: string[]) {
    await this.fileUploadInput.setInputFiles(filePaths);
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async clickReset() {
    await this.resetButton.click();
  }

  async submitForm(data: {
    title: string;
    content: string;
    priority: string;
    categoryId?: number;
    customerName?: string;
    customerPhone?: string;
  }) {
    await this.fillTitle(data.title);
    await this.fillContent(data.content);
    await this.selectPriority(data.priority);

    if (data.categoryId) {
      await this.selectCategory(data.categoryId);
    }

    if (data.customerName) {
      await this.fillCustomerName(data.customerName);
    }

    if (data.customerPhone) {
      await this.fillCustomerPhone(data.customerPhone);
    }

    await this.clickSubmit();
  }

  async getFieldError(fieldName: string): Promise<string | null> {
    const errorLocator = this.page.locator(`#${fieldName}`).locator('xpath=following-sibling::p[@role="alert"]');
    if (await errorLocator.isVisible()) {
      return await errorLocator.textContent();
    }
    return null;
  }

  async waitForSuccessModal() {
    await expect(this.successModal).toBeVisible();
  }

  async getSuccessTicketId(): Promise<string | null> {
    return await this.successTicketId.textContent();
  }

  async clickNewVoc() {
    await this.newVocButton.click();
  }

  async verifyFormReset() {
    await expect(this.titleInput).toHaveValue('');
    await expect(this.contentTextarea).toHaveValue('');
    await expect(this.customerNameInput).toHaveValue('');
    await expect(this.customerPhoneInput).toHaveValue('');
  }

  async verifyValidationError(field: string, expectedMessage: string) {
    const error = await this.getFieldError(field);
    expect(error).toContain(expectedMessage);
  }

  async verifySubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async verifySubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }
}
