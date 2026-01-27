import { type Page, type Locator, expect } from '@playwright/test';

/**
 * @description Page Object Model for VOC Detail page
 * Route: /voc/[id]
 */
export class VocDetailPage {
  readonly page: Page;

  // Header information
  readonly ticketId: Locator;
  readonly title: Locator;
  readonly statusBadge: Locator;
  readonly priorityBadge: Locator;

  // Content sections
  readonly contentSection: Locator;
  readonly customerInfoSection: Locator;
  readonly categoryDisplay: Locator;
  readonly assigneeDisplay: Locator;

  // Status change
  readonly statusChangeSelect: Locator;
  readonly statusChangeButton: Locator;
  readonly processingNoteTextarea: Locator;

  // Assignee
  readonly assigneeSelect: Locator;
  readonly assignButton: Locator;

  // Memos
  readonly memoList: Locator;
  readonly memoInput: Locator;
  readonly memoIsInternalCheckbox: Locator;
  readonly addMemoButton: Locator;

  // Attachments
  readonly attachmentsList: Locator;

  // Similar VOC
  readonly similarVocButton: Locator;

  // Actions
  readonly editButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header information
    this.ticketId = page.locator('[data-testid="voc-ticket-id"]');
    this.title = page.locator('[data-testid="voc-title"]');
    this.statusBadge = page.locator('[data-testid="voc-status"]');
    this.priorityBadge = page.locator('[data-testid="voc-priority"]');

    // Content sections
    this.contentSection = page.locator('[data-testid="voc-content"]');
    this.customerInfoSection = page.locator('[data-testid="customer-info"]');
    this.categoryDisplay = page.locator('[data-testid="voc-category"]');
    this.assigneeDisplay = page.locator('[data-testid="voc-assignee"]');

    // Status change
    this.statusChangeSelect = page.locator('#status-select');
    this.statusChangeButton = page.getByRole('button', { name: /상태 변경/i });
    this.processingNoteTextarea = page.locator('#processing-note');

    // Assignee
    this.assigneeSelect = page.locator('#assignee-select');
    this.assignButton = page.getByRole('button', { name: /배정/i });

    // Memos
    this.memoList = page.locator('[data-testid="memo-list"]');
    this.memoInput = page.locator('#memo-input');
    this.memoIsInternalCheckbox = page.locator('#memo-is-internal');
    this.addMemoButton = page.getByRole('button', { name: /메모 추가/i });

    // Attachments
    this.attachmentsList = page.locator('[data-testid="attachments-list"]');

    // Similar VOC
    this.similarVocButton = page.getByRole('button', { name: /유사 VOC/i });

    // Actions
    this.editButton = page.getByRole('button', { name: /수정/i });
    this.deleteButton = page.getByRole('button', { name: /삭제/i });
  }

  async goto(vocId: number | string) {
    await this.page.goto(`/voc/${vocId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForLoad() {
    await this.ticketId.waitFor({ state: 'visible' });
  }

  async getTicketId(): Promise<string | null> {
    return await this.ticketId.textContent();
  }

  async getTitle(): Promise<string | null> {
    return await this.title.textContent();
  }

  async getStatus(): Promise<string | null> {
    return await this.statusBadge.textContent();
  }

  async getPriority(): Promise<string | null> {
    return await this.priorityBadge.textContent();
  }

  // Status change methods
  async changeStatus(newStatus: string, note?: string) {
    await this.statusChangeSelect.selectOption(newStatus);

    if (note) {
      await this.processingNoteTextarea.fill(note);
    }

    await this.statusChangeButton.click();
    await this.page.waitForTimeout(500); // Wait for update
  }

  async verifyStatusChanged(expectedStatus: string) {
    await expect(this.statusBadge).toContainText(expectedStatus);
  }

  // Assignee methods
  async assignToUser(assigneeId: string) {
    await this.assigneeSelect.selectOption(assigneeId);
    await this.assignButton.click();
    await this.page.waitForTimeout(500);
  }

  async verifyAssignee(expectedName: string) {
    await expect(this.assigneeDisplay).toContainText(expectedName);
  }

  // Memo methods
  async addMemo(content: string, isInternal = false) {
    await this.memoInput.fill(content);

    if (isInternal) {
      await this.memoIsInternalCheckbox.check();
    }

    await this.addMemoButton.click();
    await this.page.waitForTimeout(500);
  }

  async getMemoCount(): Promise<number> {
    const memos = this.memoList.locator('[data-testid="memo-item"]');
    return await memos.count();
  }

  async getLatestMemo(): Promise<string | null> {
    const memos = this.memoList.locator('[data-testid="memo-item"]');
    const count = await memos.count();
    if (count === 0) return null;

    const latestMemo = memos.first();
    return await latestMemo.locator('[data-testid="memo-content"]').textContent();
  }

  async deleteMemo(index: number) {
    const memos = this.memoList.locator('[data-testid="memo-item"]');
    const deleteButton = memos.nth(index).locator('[data-testid="memo-delete"]');
    await deleteButton.click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = this.page.getByRole('button', { name: /확인|삭제/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.page.waitForTimeout(500);
  }

  async verifyMemoExists(content: string) {
    const memo = this.memoList.locator('[data-testid="memo-item"]').filter({ hasText: content });
    await expect(memo).toBeVisible();
  }

  // Similar VOC methods
  async openSimilarVoc() {
    await this.similarVocButton.click();
  }

  // Attachment methods
  async getAttachmentCount(): Promise<number> {
    const attachments = this.attachmentsList.locator('[data-testid="attachment-item"]');
    return await attachments.count();
  }

  async downloadAttachment(index: number) {
    const attachments = this.attachmentsList.locator('[data-testid="attachment-item"]');
    const downloadButton = attachments.nth(index).locator('[data-testid="attachment-download"]');

    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      downloadButton.click(),
    ]);

    return download;
  }

  // Customer info verification
  async verifyCustomerInfo(expected: { name?: string; email?: string; phone?: string }) {
    if (expected.name) {
      await expect(this.customerInfoSection).toContainText(expected.name);
    }
    if (expected.email) {
      await expect(this.customerInfoSection).toContainText(expected.email);
    }
    if (expected.phone) {
      await expect(this.customerInfoSection).toContainText(expected.phone);
    }
  }

  async verifyCategory(expectedCategory: string) {
    await expect(this.categoryDisplay).toContainText(expectedCategory);
  }

  async verifyContent(expectedContent: string) {
    await expect(this.contentSection).toContainText(expectedContent);
  }
}
