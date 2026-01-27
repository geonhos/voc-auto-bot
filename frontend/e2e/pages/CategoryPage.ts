import { Page, Locator, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForToast, waitForDialog } from '../utils/test-helpers';

/**
 * @description Page Object Model for Category Management
 */
export class CategoryPage {
  readonly page: Page;
  readonly categoryTree: Locator;
  readonly categoryNode: Locator;
  readonly createButton: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly categoryForm: Locator;
  readonly nameInput: Locator;
  readonly codeInput: Locator;
  readonly descriptionInput: Locator;
  readonly parentSelect: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.categoryTree = page.getByRole('tree', { name: /category/i });
    this.categoryNode = page.getByRole('treeitem');
    this.createButton = page.getByRole('button', { name: /create|추가|생성/i });
    this.editButton = page.getByRole('button', { name: /edit|수정/i });
    this.deleteButton = page.getByRole('button', { name: /delete|삭제/i });
    this.categoryForm = page.getByRole('form', { name: /category/i });
    this.nameInput = page.getByLabel(/name|이름/i);
    this.codeInput = page.getByLabel(/code|코드/i);
    this.descriptionInput = page.getByLabel(/description|설명/i);
    this.parentSelect = page.getByLabel(/parent|상위 카테고리/i);
    this.isActiveCheckbox = page.getByLabel(/active|활성/i);
    this.saveButton = page.getByRole('button', { name: /save|저장/i });
    this.cancelButton = page.getByRole('button', { name: /cancel|취소/i });
    this.confirmDialog = page.getByRole('alertdialog');
  }

  /**
   * @description Navigate to category management page
   */
  async goto() {
    await this.page.goto('/admin/categories');
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Get category count
   */
  async getCategoryCount(): Promise<number> {
    return await this.categoryNode.count();
  }

  /**
   * @description Select category by name
   */
  async selectCategory(categoryName: string | RegExp) {
    const category = this.categoryNode.filter({ hasText: categoryName });
    await category.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * @description Expand category node
   */
  async expandCategory(categoryName: string | RegExp) {
    const category = this.categoryNode.filter({ hasText: categoryName });
    const expandButton = category.getByRole('button', { name: /expand|펼치기/i });

    if (await expandButton.isVisible()) {
      await expandButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * @description Collapse category node
   */
  async collapseCategory(categoryName: string | RegExp) {
    const category = this.categoryNode.filter({ hasText: categoryName });
    const collapseButton = category.getByRole('button', { name: /collapse|접기/i });

    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * @description Create new category
   */
  async createCategory(data: {
    name: string;
    code: string;
    description?: string;
    parent?: string;
    isActive?: boolean;
  }) {
    await this.createButton.click();
    await waitForDialog(this.page, /create|추가|생성/i);

    await this.nameInput.fill(data.name);
    await this.codeInput.fill(data.code);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.parent) {
      await this.parentSelect.click();
      await this.page.getByRole('option', { name: data.parent }).click();
    }

    if (data.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (isChecked !== data.isActive) {
        await this.isActiveCheckbox.click();
      }
    }

    await this.saveButton.click();
    await waitForToast(this.page, /success|성공|생성/i);
  }

  /**
   * @description Edit category
   */
  async editCategory(
    categoryName: string | RegExp,
    updates: {
      name?: string;
      code?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    await this.selectCategory(categoryName);
    await this.editButton.click();
    await waitForDialog(this.page, /edit|수정/i);

    if (updates.name) {
      await this.nameInput.fill(updates.name);
    }

    if (updates.code) {
      await this.codeInput.fill(updates.code);
    }

    if (updates.description) {
      await this.descriptionInput.fill(updates.description);
    }

    if (updates.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (isChecked !== updates.isActive) {
        await this.isActiveCheckbox.click();
      }
    }

    await this.saveButton.click();
    await waitForToast(this.page, /success|성공|수정/i);
  }

  /**
   * @description Delete category
   */
  async deleteCategory(categoryName: string | RegExp) {
    await this.selectCategory(categoryName);
    await this.deleteButton.click();

    // Wait for confirmation dialog
    await expect(this.confirmDialog).toBeVisible();
    await this.confirmDialog.getByRole('button', { name: /confirm|확인|삭제/i }).click();

    await waitForToast(this.page, /success|성공|삭제/i);
  }

  /**
   * @description Drag and drop category to reorder
   */
  async dragAndDropCategory(
    sourceName: string | RegExp,
    targetName: string | RegExp
  ) {
    const source = this.categoryNode.filter({ hasText: sourceName });
    const target = this.categoryNode.filter({ hasText: targetName });

    await source.dragTo(target);
    await this.page.waitForTimeout(500);
    await waitForToast(this.page, /success|성공|순서|변경/i);
  }

  /**
   * @description Verify category exists in tree
   */
  async verifyCategoryExists(categoryName: string | RegExp) {
    await expect(this.categoryNode.filter({ hasText: categoryName })).toBeVisible();
  }

  /**
   * @description Verify category does not exist
   */
  async verifyCategoryNotExists(categoryName: string | RegExp) {
    await expect(this.categoryNode.filter({ hasText: categoryName })).not.toBeVisible();
  }

  /**
   * @description Get category badge status
   */
  async getCategoryStatus(categoryName: string | RegExp): Promise<string> {
    const category = this.categoryNode.filter({ hasText: categoryName });
    const badge = category.locator('[data-testid="category-status"]');
    return await badge.textContent() || '';
  }

  /**
   * @description Verify category is inactive
   */
  async verifyCategoryInactive(categoryName: string | RegExp) {
    const category = this.categoryNode.filter({ hasText: categoryName });
    await expect(category.getByText(/inactive|비활성/i)).toBeVisible();
  }

  /**
   * @description Get child categories of a parent
   */
  async getChildCategories(parentName: string | RegExp): Promise<string[]> {
    await this.expandCategory(parentName);
    const parent = this.categoryNode.filter({ hasText: parentName });
    const children = parent.locator('[role="group"] [role="treeitem"]');
    return await children.allTextContents();
  }

  /**
   * @description Verify drag and drop is enabled
   */
  async verifyDraggable(categoryName: string | RegExp) {
    const category = this.categoryNode.filter({ hasText: categoryName });
    await expect(category).toHaveAttribute('draggable', 'true');
  }

  /**
   * @description Fill category form with data
   */
  async fillComposeForm(data: {
    name: string;
    code: string;
    description?: string;
    parent?: string;
    isActive?: boolean;
  }) {
    await this.nameInput.fill(data.name);
    await this.codeInput.fill(data.code);

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.parent) {
      await this.parentSelect.click();
      await this.page.getByRole('option', { name: data.parent }).click();
    }

    if (data.isActive !== undefined) {
      const isChecked = await this.isActiveCheckbox.isChecked();
      if (isChecked !== data.isActive) {
        await this.isActiveCheckbox.click();
      }
    }
  }

  /**
   * @description Cancel form submission
   */
  async cancelForm() {
    await this.cancelButton.click();
    await expect(this.categoryForm).not.toBeVisible();
  }

  /**
   * @description Verify validation error
   */
  async verifyValidationError(field: string, message: string | RegExp) {
    const fieldError = this.page.getByLabel(field).locator('~ [role="alert"]');
    await expect(fieldError).toContainText(message);
  }
}
