/**
 * @see ./detailed/admin/users.detailed.spec.ts for detailed UI interaction tests
 */

import { test, expect } from '@playwright/test';
import { UserPage } from '../pages/UserPage';
import { mockApi, createTestUser } from '../utils/test-helpers';

/**
 * @description E2E tests for User Management (SC-10)
 * Tests cover user CRUD operations, role changes, and account management
 */
test.describe('User Management - SC-10', () => {
  let userPage: UserPage;

  test.beforeEach(async ({ page }) => {
    userPage = new UserPage(page);

    // Mock users API
    await mockApi(
      page,
      /\/api\/users/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 1,
              username: 'admin',
              name: '관리자',
              email: 'admin@example.com',
              role: 'ADMIN',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 2,
              username: 'manager1',
              name: '매니저1',
              email: 'manager1@example.com',
              role: 'MANAGER',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 3,
              username: 'operator1',
              name: '상담원1',
              email: 'operator1@example.com',
              role: 'OPERATOR',
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            {
              id: 4,
              username: 'inactive_user',
              name: '비활성 사용자',
              email: 'inactive@example.com',
              role: 'OPERATOR',
              isActive: false,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          page: 0,
          size: 10,
          totalElements: 4,
          totalPages: 1,
        },
      },
      { method: 'GET' }
    );

    await userPage.goto();
  });

  test('should display user list', async () => {
    // Verify user count
    const count = await userPage.getUserCount();
    expect(count).toBeGreaterThan(0);

    // Verify specific users exist
    await userPage.verifyUserExists('admin');
    await userPage.verifyUserExists('manager1');
    await userPage.verifyUserExists('operator1');
  });

  test('should display user information correctly', async () => {
    // Verify user details
    const details = await userPage.getUserDetails('admin');

    expect(details.name).toContain('관리자');
    expect(details.email).toContain('admin@example.com');
    expect(details.role).toMatch(/admin|관리자/i);
    expect(details.status).toMatch(/active|활성/i);
  });

  test('should create new user', async ({ page }) => {
    const testUser = createTestUser({
      username: 'newuser',
      name: '새 사용자',
      email: 'newuser@example.com',
      role: 'OPERATOR',
    });

    // Mock create user API
    await mockApi(
      page,
      /\/api\/users/,
      {
        status: 201,
        body: {
          id: 100,
          username: testUser.username,
          name: testUser.name,
          email: testUser.email,
          role: testUser.role,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { method: 'POST' }
    );

    // Create user
    await userPage.createUser({
      username: testUser.username,
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
      role: testUser.role,
      isActive: true,
    });

    // Verify user was created
    await userPage.verifyUserExists(testUser.username);
  });

  test('should validate required fields when creating user', async () => {
    // Click create button
    await userPage.createButton.click();

    // Try to save without filling required fields
    await userPage.saveButton.click();

    // Verify validation errors
    await userPage.verifyValidationError('username', /required|필수/i);
    await userPage.verifyValidationError('name', /required|필수/i);
    await userPage.verifyValidationError('email', /required|필수/i);
    await userPage.verifyValidationError('password', /required|필수/i);
  });

  test('should validate email format', async ({ page }) => {
    await userPage.createButton.click();

    await userPage.usernameInput.fill('testuser');
    await userPage.nameInput.fill('테스트');
    await userPage.emailInput.fill('invalid-email');
    await userPage.passwordInput.fill('Test1234!');

    await userPage.saveButton.click();

    // Verify email validation
    await userPage.verifyValidationError('email', /invalid|format|형식|이메일/i);
  });

  test('should validate password strength', async ({ page }) => {
    await userPage.createButton.click();

    await userPage.usernameInput.fill('testuser');
    await userPage.nameInput.fill('테스트');
    await userPage.emailInput.fill('test@example.com');
    await userPage.passwordInput.fill('weak'); // Weak password

    await userPage.saveButton.click();

    // Verify password validation
    await userPage.verifyValidationError(
      'password',
      /weak|strength|강도|최소|문자|숫자/i
    );
  });

  test('should prevent duplicate username', async ({ page }) => {
    // Mock duplicate username error
    await mockApi(
      page,
      /\/api\/users/,
      {
        status: 409,
        body: {
          error: {
            message: '이미 존재하는 아이디입니다',
            code: 'DUPLICATE_USERNAME',
          },
        },
      },
      { method: 'POST' }
    );

    const testUser = createTestUser({
      username: 'admin', // Existing username
    });

    await userPage.createButton.click();

    await userPage.usernameInput.fill(testUser.username);
    await userPage.nameInput.fill(testUser.name);
    await userPage.emailInput.fill(testUser.email);
    await userPage.passwordInput.fill(testUser.password);

    await userPage.saveButton.click();

    // Verify error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/중복|duplicate|exists/i);
  });

  test('should edit user information', async ({ page }) => {
    // Mock update user API
    await mockApi(
      page,
      /\/api\/users\/2/,
      {
        status: 200,
        body: {
          id: 2,
          username: 'manager1',
          name: '매니저1 (수정됨)',
          email: 'manager1_updated@example.com',
          role: 'MANAGER',
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
      },
      { method: 'PUT' }
    );

    // Edit user
    await userPage.editUser('manager1', {
      name: '매니저1 (수정됨)',
      email: 'manager1_updated@example.com',
    });

    // Verify user was updated
    await userPage.verifyUserExists('manager1_updated@example.com');
  });

  test('should change user role', async ({ page }) => {
    // Mock role change API
    await mockApi(
      page,
      /\/api\/users\/3/,
      {
        status: 200,
        body: {
          id: 3,
          username: 'operator1',
          name: '상담원1',
          email: 'operator1@example.com',
          role: 'MANAGER',
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
      },
      { method: 'PUT' }
    );

    // Change role from OPERATOR to MANAGER
    await userPage.changeUserRole('operator1', 'MANAGER');

    // Verify role was changed
    await userPage.verifyUserRole('operator1', 'MANAGER');
  });

  test('should deactivate user', async ({ page }) => {
    // Mock deactivate API
    await mockApi(
      page,
      /\/api\/users\/3\/status/,
      {
        status: 200,
        body: {
          id: 3,
          username: 'operator1',
          name: '상담원1',
          email: 'operator1@example.com',
          role: 'OPERATOR',
          isActive: false,
          updatedAt: new Date().toISOString(),
        },
      },
      { method: 'PATCH' }
    );

    // Deactivate user
    await userPage.deactivateUser('operator1');

    // Verify user is inactive
    await userPage.verifyUserStatus('operator1', 'inactive');
  });

  test('should activate user', async ({ page }) => {
    // Mock activate API
    await mockApi(
      page,
      /\/api\/users\/4\/status/,
      {
        status: 200,
        body: {
          id: 4,
          username: 'inactive_user',
          name: '비활성 사용자',
          email: 'inactive@example.com',
          role: 'OPERATOR',
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
      },
      { method: 'PATCH' }
    );

    // Activate user
    await userPage.activateUser('inactive_user');

    // Verify user is active
    await userPage.verifyUserStatus('inactive_user', 'active');
  });

  test('should reset user password', async ({ page }) => {
    // Mock password reset API
    await mockApi(
      page,
      /\/api\/users\/3\/password\/reset/,
      {
        status: 200,
        body: {
          temporaryPassword: 'Temp1234!',
          message: '임시 비밀번호가 발급되었습니다',
        },
      },
      { method: 'POST' }
    );

    // Reset password
    const tempPassword = await userPage.resetPassword('operator1');

    // Verify temporary password was returned
    expect(tempPassword).toBeTruthy();
    expect(tempPassword.length).toBeGreaterThan(0);
  });

  test('should unlock user account', async ({ page }) => {
    // Mock unlock API
    await mockApi(
      page,
      /\/api\/users\/4\/unlock/,
      {
        status: 200,
        body: {
          id: 4,
          username: 'inactive_user',
          isLocked: false,
          message: '계정 잠금이 해제되었습니다',
        },
      },
      { method: 'POST' }
    );

    // Unlock user
    await userPage.unlockUser('inactive_user');

    // Verify success message
    const toast = userPage.page.getByRole('status');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/unlock|잠금.*해제|성공/i);
  });

  test('should search users by name or email', async ({ page }) => {
    // Mock search API
    await mockApi(
      page,
      /\/api\/users\?search=관리자/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 1,
              username: 'admin',
              name: '관리자',
              email: 'admin@example.com',
              role: 'ADMIN',
              isActive: true,
            },
          ],
          totalElements: 1,
        },
      },
      { method: 'GET' }
    );

    // Search users
    await userPage.searchUsers('관리자');

    // Verify filtered results
    await userPage.verifyUserExists('admin');
    const count = await userPage.getUserCount();
    expect(count).toBe(1);
  });

  test('should filter users by role', async ({ page }) => {
    // Mock filter API
    await mockApi(
      page,
      /\/api\/users\?role=ADMIN/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 1,
              username: 'admin',
              name: '관리자',
              email: 'admin@example.com',
              role: 'ADMIN',
              isActive: true,
            },
          ],
          totalElements: 1,
        },
      },
      { method: 'GET' }
    );

    // Filter by role
    await userPage.filterByRole('ADMIN');

    // Verify filtered results
    await userPage.verifyUserExists('admin');
    await userPage.verifyUserRole('admin', 'ADMIN');
  });

  test('should filter users by status', async ({ page }) => {
    // Mock filter API
    await mockApi(
      page,
      /\/api\/users\?isActive=false/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 4,
              username: 'inactive_user',
              name: '비활성 사용자',
              email: 'inactive@example.com',
              role: 'OPERATOR',
              isActive: false,
            },
          ],
          totalElements: 1,
        },
      },
      { method: 'GET' }
    );

    // Filter by inactive status
    await userPage.filterByStatus('INACTIVE');

    // Verify filtered results
    await userPage.verifyUserExists('inactive_user');
    await userPage.verifyUserStatus('inactive_user', 'inactive');
  });

  test('should cancel user creation', async () => {
    await userPage.createButton.click();

    // Fill some data
    const testUser = createTestUser();
    await userPage.usernameInput.fill(testUser.username);
    await userPage.nameInput.fill(testUser.name);

    // Cancel
    await userPage.cancelForm();

    // Verify form is closed and user was not created
    await userPage.verifyUserNotExists(testUser.username);
  });

  test('should prevent admin from deactivating themselves', async ({ page }) => {
    // Mock error
    await mockApi(
      page,
      /\/api\/users\/1\/status/,
      {
        status: 403,
        body: {
          error: {
            message: '자신의 계정은 비활성화할 수 없습니다',
            code: 'CANNOT_DEACTIVATE_SELF',
          },
        },
      },
      { method: 'PATCH' }
    );

    // Try to deactivate admin (assuming current user is admin)
    await userPage.openUserActionMenu('admin');
    await userPage.page.getByRole('menuitem', { name: /deactivate|비활성화/i }).click();

    const confirmDialog = userPage.page.getByRole('alertdialog');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: /confirm|확인/i }).click();

    // Verify error message
    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/자신|yourself|self/i);
  });

  test('should display user role badges with correct colors', async () => {
    // Verify admin badge
    const adminRow = await userPage.findUserRow('admin');
    const adminBadge = adminRow.locator('[data-testid="user-role"]');
    await expect(adminBadge).toHaveClass(/purple|admin/i);

    // Verify manager badge
    const managerRow = await userPage.findUserRow('manager1');
    const managerBadge = managerRow.locator('[data-testid="user-role"]');
    await expect(managerBadge).toHaveClass(/blue|manager/i);

    // Verify operator badge
    const operatorRow = await userPage.findUserRow('operator1');
    const operatorBadge = operatorRow.locator('[data-testid="user-role"]');
    await expect(operatorBadge).toHaveClass(/green|operator/i);
  });

  test('should paginate user list', async ({ page }) => {
    // Mock pagination
    await mockApi(
      page,
      /\/api\/users\?page=1/,
      {
        status: 200,
        body: {
          content: [
            {
              id: 5,
              username: 'user5',
              name: '사용자5',
              email: 'user5@example.com',
              role: 'OPERATOR',
              isActive: true,
            },
          ],
          page: 1,
          size: 10,
          totalElements: 15,
          totalPages: 2,
        },
      },
      { method: 'GET' }
    );

    // Click next page
    const nextButton = page.getByRole('button', { name: /next|다음/i });
    await nextButton.click();

    // Verify new page loaded
    await userPage.verifyUserExists('user5');
  });
});
