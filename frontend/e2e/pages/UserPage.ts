import { Page, Locator, expect } from '@playwright/test';
import { waitForNetworkIdle, waitForToast } from '../utils/test-helpers';

/**
 * @description Page Object Model for User Management
 */
export class UserPage {
  readonly page: Page;
  readonly userTable: Locator;
  readonly tableRows: Locator;
  readonly createButton: Locator;
  readonly userForm: Locator;
  readonly usernameInput: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly roleSelect: Locator;
  readonly isActiveCheckbox: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly searchInput: Locator;
  readonly roleFilterSelect: Locator;
  readonly statusFilterSelect: Locator;
  readonly actionMenuButton: Locator;
  readonly confirmDialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userTable = page.getByRole('table');
    this.tableRows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    this.createButton = page.getByRole('button', { name: /create user|사용자 추가|생성/i });
    this.userForm = page.getByRole('form', { name: /user|사용자/i });
    this.usernameInput = page.getByLabel(/username|아이디/i);
    this.nameInput = page.getByLabel(/^name|이름$/i);
    this.emailInput = page.getByLabel(/email|이메일/i);
    this.passwordInput = page.getByLabel(/password|비밀번호/i);
    this.roleSelect = page.getByLabel(/role|역할/i);
    this.isActiveCheckbox = page.getByLabel(/active|활성/i);
    this.saveButton = page.getByRole('button', { name: /save|저장/i });
    this.cancelButton = page.getByRole('button', { name: /cancel|취소/i });
    this.searchInput = page.getByPlaceholder(/search|검색/i);
    this.roleFilterSelect = page.getByLabel(/filter.*role|역할.*필터/i);
    this.statusFilterSelect = page.getByLabel(/filter.*status|상태.*필터/i);
    this.actionMenuButton = page.getByRole('button', { name: /actions|액션|작업/i });
    this.confirmDialog = page.getByRole('alertdialog');
  }

  /**
   * @description Navigate to user management page
   */
  async goto() {
    await this.page.goto('/admin/users');
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Get user count in table
   */
  async getUserCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * @description Create new user
   */
  async createUser(data: {
    username: string;
    name: string;
    email: string;
    password: string;
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
    isActive?: boolean;
  }) {
    await this.createButton.click();
    await expect(this.userForm).toBeVisible();

    await this.usernameInput.fill(data.username);
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);

    // Select role
    await this.roleSelect.click();
    await this.page.getByRole('option', { name: data.role }).click();

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
   * @description Find user row by username or email
   */
  async findUserRow(identifier: string | RegExp): Promise<Locator> {
    return this.tableRows.filter({ hasText: identifier });
  }

  /**
   * @description Open action menu for user
   */
  async openUserActionMenu(identifier: string | RegExp) {
    const row = await this.findUserRow(identifier);
    await row.getByRole('button', { name: /actions|액션/i }).click();
  }

  /**
   * @description Edit user
   */
  async editUser(
    identifier: string | RegExp,
    updates: {
      name?: string;
      email?: string;
      role?: 'ADMIN' | 'MANAGER' | 'OPERATOR';
      isActive?: boolean;
    }
  ) {
    await this.openUserActionMenu(identifier);
    await this.page.getByRole('menuitem', { name: /edit|수정/i }).click();

    await expect(this.userForm).toBeVisible();

    if (updates.name) {
      await this.nameInput.fill(updates.name);
    }

    if (updates.email) {
      await this.emailInput.fill(updates.email);
    }

    if (updates.role) {
      await this.roleSelect.click();
      await this.page.getByRole('option', { name: updates.role }).click();
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
   * @description Change user role
   */
  async changeUserRole(
    identifier: string | RegExp,
    newRole: 'ADMIN' | 'MANAGER' | 'OPERATOR'
  ) {
    await this.editUser(identifier, { role: newRole });
  }

  /**
   * @description Deactivate user
   */
  async deactivateUser(identifier: string | RegExp) {
    await this.openUserActionMenu(identifier);
    await this.page.getByRole('menuitem', { name: /deactivate|비활성화/i }).click();

    // Confirm dialog
    await expect(this.confirmDialog).toBeVisible();
    await this.confirmDialog.getByRole('button', { name: /confirm|확인/i }).click();

    await waitForToast(this.page, /success|성공|비활성/i);
  }

  /**
   * @description Activate user
   */
  async activateUser(identifier: string | RegExp) {
    await this.openUserActionMenu(identifier);
    await this.page.getByRole('menuitem', { name: /activate|활성화/i }).click();

    await expect(this.confirmDialog).toBeVisible();
    await this.confirmDialog.getByRole('button', { name: /confirm|확인/i }).click();

    await waitForToast(this.page, /success|성공|활성/i);
  }

  /**
   * @description Reset user password
   */
  async resetPassword(identifier: string | RegExp): Promise<string> {
    await this.openUserActionMenu(identifier);
    await this.page.getByRole('menuitem', { name: /reset password|비밀번호 재설정/i }).click();

    await expect(this.confirmDialog).toBeVisible();
    await this.confirmDialog.getByRole('button', { name: /confirm|확인/i }).click();

    // Wait for success toast with temporary password
    const toast = this.page.getByRole('status');
    await expect(toast).toBeVisible();

    const toastText = await toast.textContent();
    const passwordMatch = toastText?.match(/임시 비밀번호[:：]\s*(\S+)/);
    return passwordMatch ? passwordMatch[1] : '';
  }

  /**
   * @description Unlock user account
   */
  async unlockUser(identifier: string | RegExp) {
    await this.openUserActionMenu(identifier);
    await this.page.getByRole('menuitem', { name: /unlock|잠금 해제/i }).click();

    await expect(this.confirmDialog).toBeVisible();
    await this.confirmDialog.getByRole('button', { name: /confirm|확인/i }).click();

    await waitForToast(this.page, /success|성공|해제/i);
  }

  /**
   * @description Search users
   */
  async searchUsers(query: string) {
    await this.searchInput.fill(query);
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Filter users by role
   */
  async filterByRole(role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'ALL') {
    await this.roleFilterSelect.click();
    await this.page.getByRole('option', { name: role }).click();
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Filter users by status
   */
  async filterByStatus(status: 'ACTIVE' | 'INACTIVE' | 'ALL') {
    await this.statusFilterSelect.click();
    await this.page.getByRole('option', { name: status }).click();
    await waitForNetworkIdle(this.page);
  }

  /**
   * @description Verify user exists in table
   */
  async verifyUserExists(identifier: string | RegExp) {
    const row = await this.findUserRow(identifier);
    await expect(row).toBeVisible();
  }

  /**
   * @description Verify user does not exist
   */
  async verifyUserNotExists(identifier: string | RegExp) {
    const row = await this.findUserRow(identifier);
    await expect(row).not.toBeVisible();
  }

  /**
   * @description Verify user status badge
   */
  async verifyUserStatus(identifier: string | RegExp, status: 'active' | 'inactive') {
    const row = await this.findUserRow(identifier);
    const statusBadge = row.locator('[data-testid="user-status"]');
    await expect(statusBadge).toContainText(
      status === 'active' ? /active|활성/i : /inactive|비활성/i
    );
  }

  /**
   * @description Verify user role badge
   */
  async verifyUserRole(
    identifier: string | RegExp,
    role: 'ADMIN' | 'MANAGER' | 'OPERATOR'
  ) {
    const row = await this.findUserRow(identifier);
    const roleBadge = row.locator('[data-testid="user-role"]');

    const roleText = {
      ADMIN: /admin|관리자/i,
      MANAGER: /manager|매니저/i,
      OPERATOR: /operator|상담원/i,
    };

    await expect(roleBadge).toContainText(roleText[role]);
  }

  /**
   * @description Get user details from row
   */
  async getUserDetails(identifier: string | RegExp): Promise<{
    name: string;
    email: string;
    role: string;
    status: string;
  }> {
    const row = await this.findUserRow(identifier);

    return {
      name: (await row.locator('[data-testid="user-name"]').textContent()) || '',
      email: (await row.locator('[data-testid="user-email"]').textContent()) || '',
      role: (await row.locator('[data-testid="user-role"]').textContent()) || '',
      status: (await row.locator('[data-testid="user-status"]').textContent()) || '',
    };
  }

  /**
   * @description Cancel form submission
   */
  async cancelForm() {
    await this.cancelButton.click();
    await expect(this.userForm).not.toBeVisible();
  }

  /**
   * @description Verify validation error
   */
  async verifyValidationError(field: string, message: string | RegExp) {
    const fieldError = this.page.getByLabel(field).locator('~ [role="alert"]');
    await expect(fieldError).toContainText(message);
  }
}
