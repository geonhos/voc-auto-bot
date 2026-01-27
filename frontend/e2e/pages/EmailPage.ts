import { Page, Locator, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForToast } from '../utils/test-helpers';

/**
 * @description Page Object Model for Email Template functionality
 */
export class EmailPage {
  readonly page: Page;
  readonly templateList: Locator;
  readonly templateCard: Locator;
  readonly composeForm: Locator;
  readonly subjectInput: Locator;
  readonly bodyInput: Locator;
  readonly recipientInput: Locator;
  readonly previewButton: Locator;
  readonly sendButton: Locator;
  readonly previewModal: Locator;
  readonly variableList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.templateList = page.getByRole('list', { name: /template/i });
    this.templateCard = page.getByRole('article').filter({ has: page.getByText(/template/i) });
    this.composeForm = page.getByRole('form', { name: /compose|작성/i });
    this.subjectInput = page.getByLabel(/subject|제목/i);
    this.bodyInput = page.getByLabel(/body|content|내용/i);
    this.recipientInput = page.getByLabel(/recipient|수신자/i);
    this.previewButton = page.getByRole('button', { name: /preview|미리보기/i });
    this.sendButton = page.getByRole('button', { name: /send|발송/i });
    this.previewModal = page.getByRole('dialog', { name: /preview|미리보기/i });
    this.variableList = page.getByRole('list', { name: /variable|변수/i });
  }

  /**
   * @description Navigate to email template page
   */
  async goto(vocId?: number) {
    const url = vocId ? `/voc/${vocId}/email` : '/email';
    await this.page.goto(url);
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Get template count
   */
  async getTemplateCount(): Promise<number> {
    return await this.templateCard.count();
  }

  /**
   * @description Select template by name
   */
  async selectTemplate(templateName: string | RegExp) {
    const template = this.templateCard.filter({ hasText: templateName });
    await template.click();
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Fill email compose form
   */
  async fillComposeForm(data: {
    subject?: string;
    body?: string;
    recipient?: string;
  }) {
    if (data.subject) {
      await this.subjectInput.fill(data.subject);
    }
    if (data.body) {
      await this.bodyInput.fill(data.body);
    }
    if (data.recipient) {
      await this.recipientInput.fill(data.recipient);
    }
  }

  /**
   * @description Get available variables
   */
  async getAvailableVariables(): Promise<string[]> {
    const items = await this.variableList.locator('li').allTextContents();
    return items.map((item) => item.trim());
  }

  /**
   * @description Insert variable into body
   */
  async insertVariable(variableName: string) {
    const variable = this.variableList.getByText(variableName);
    await variable.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * @description Open preview modal
   */
  async openPreview() {
    await this.previewButton.click();
    await expect(this.previewModal).toBeVisible();
  }

  /**
   * @description Verify preview content
   */
  async verifyPreviewContent(expectedSubject: string, expectedBody: RegExp) {
    await expect(
      this.previewModal.getByRole('heading', { name: expectedSubject })
    ).toBeVisible();
    await expect(this.previewModal.getByText(expectedBody)).toBeVisible();
  }

  /**
   * @description Close preview modal
   */
  async closePreview() {
    await this.previewModal.getByRole('button', { name: /close|닫기/i }).click();
    await expect(this.previewModal).not.toBeVisible();
  }

  /**
   * @description Send email
   */
  async sendEmail() {
    await this.sendButton.click();
    await waitForToast(this.page, /success|성공|발송/i);
  }

  /**
   * @description Verify email sent successfully
   */
  async verifyEmailSent() {
    await expect(this.page.getByRole('status')).toContainText(/sent|발송/i);
  }

  /**
   * @description Get template by type
   */
  async getTemplateByType(type: string): Promise<Locator> {
    return this.templateCard.filter({ has: this.page.getByText(type) });
  }

  /**
   * @description Verify variable substitution in preview
   */
  async verifyVariableSubstitution(
    variableName: string,
    expectedValue: string | RegExp
  ) {
    await this.openPreview();
    const content = this.previewModal.locator('[data-testid="preview-content"]');
    await expect(content).not.toContainText(`{{${variableName}}}`);
    await expect(content).toContainText(expectedValue);
  }

  /**
   * @description Check if template is system template
   */
  async isSystemTemplate(templateName: string): Promise<boolean> {
    const template = this.templateCard.filter({ hasText: templateName });
    const badge = template.getByText(/system|시스템/i);
    return await badge.isVisible();
  }

  /**
   * @description Filter templates by type
   */
  async filterByType(type: string) {
    await this.page.getByRole('combobox', { name: /type|유형/i }).click();
    await this.page.getByRole('option', { name: type }).click();
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Add additional recipient
   */
  async addAdditionalRecipient(email: string) {
    await this.page.getByRole('button', { name: /add recipient|수신자 추가/i }).click();
    await this.page.getByLabel(/additional recipient|추가 수신자/i).fill(email);
  }
}
