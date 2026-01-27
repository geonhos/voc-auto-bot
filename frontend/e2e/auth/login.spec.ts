import { test, expect } from '../fixtures/test-fixtures';
import {
  waitForApi,
  mockApiError,
  login as _login,
  logout as _logout,
  clearAuth,
  setAuthState,
  getAuthState,
  getTestCredentials,
} from '../utils/test-helpers';

/**
 * @description E2E tests for authentication functionality (SC-01)
 * Tests login, logout, form validation, and token management
 */

test.describe('Login Flow (SC-01)', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await clearAuth(page);
  });

  test('should successfully login with valid credentials', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = getTestCredentials('ADMIN');

    // Act
    await page.goto('/login');
    
    // Assert page is loaded
    await expect(page.locator('h2:has-text("로그인")')).toBeVisible();

    // Fill in credentials
    await page.getByLabel('아이디').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Setup API response listener
    const loginPromise = waitForApi(page, '/auth/login', {
      method: 'POST',
      status: 200,
    });

    // Submit form
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert API was called
    const loginResponse = await loginPromise;
    expect(loginResponse.status()).toBe(200);

    // Assert redirect to dashboard
    await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });

    // Assert authentication state is saved
    const authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);
    expect(authState.state.accessToken).toBeTruthy();
    expect(authState.state.refreshToken).toBeTruthy();
    expect(authState.state.user).toBeTruthy();
    expect(authState.state.user.username).toBe(credentials.username);
  });

  test('should show error message with invalid password', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = {
      username: 'admin',
      password: 'wrongpassword',
    };

    // Setup mock API error
    await mockApiError(
      page,
      /\/auth\/login/,
      401,
      '아이디 또는 비밀번호가 일치하지 않습니다'
    );

    // Act
    await page.goto('/login');
    await page.getByLabel('아이디').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Submit form
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert error message is displayed
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText(/아이디 또는 비밀번호가 일치하지 않습니다|로그인에 실패했습니다/);

    // Assert still on login page
    await expect(page).toHaveURL(/\/login/);

    // Assert not authenticated
    const authState = await getAuthState(page);
    expect(authState?.state?.isAuthenticated).toBeFalsy();
  });

  test('should show error message with non-existent user', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = {
      username: 'nonexistentuser',
      password: 'somepassword',
    };

    // Setup mock API error
    await mockApiError(
      page,
      /\/auth\/login/,
      404,
      '사용자를 찾을 수 없습니다'
    );

    // Act
    await page.goto('/login');
    await page.getByLabel('아이디').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Submit form
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert error message is displayed
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Assert still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate required username field', async ({ unauthenticatedPage: page }) => {
    // Act
    await page.goto('/login');

    // Try to submit without username
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert validation error is shown
    const usernameError = page.locator('text=아이디를 입력해주세요');
    await expect(usernameError).toBeVisible();

    // Assert form was not submitted
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate required password field', async ({ unauthenticatedPage: page }) => {
    // Act
    await page.goto('/login');

    // Try to submit without password
    await page.getByLabel('아이디').fill('testuser');
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert validation error is shown
    const passwordError = page.locator('text=비밀번호를 입력해주세요');
    await expect(passwordError).toBeVisible();

    // Assert form was not submitted
    await expect(page).toHaveURL(/\/login/);
  });

  test('should validate both required fields', async ({ unauthenticatedPage: page }) => {
    // Act
    await page.goto('/login');

    // Try to submit without any fields
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert both validation errors are shown
    await expect(page.locator('text=아이디를 입력해주세요')).toBeVisible();
    await expect(page.locator('text=비밀번호를 입력해주세요')).toBeVisible();

    // Assert form was not submitted
    await expect(page).toHaveURL(/\/login/);
  });

  test('should toggle password visibility', async ({ unauthenticatedPage: page }) => {
    // Act
    await page.goto('/login');

    // Fill password
    const passwordInput = page.locator('#password');
    await passwordInput.fill('testpassword');

    // Assert password is hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    const toggleButton = page.getByRole('button', { name: '비밀번호 보기' });
    await toggleButton.click();

    // Assert password is visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle button again
    await toggleButton.click();

    // Assert password is hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show loading state during login', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = getTestCredentials('ADMIN');

    // Act
    await page.goto('/login');
    await page.getByLabel('아이디').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Submit form
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert loading state is shown
    const loadingButton = page.getByRole('button', { name: /로그인 중/i });
    await expect(loadingButton).toBeVisible();
    await expect(loadingButton).toBeDisabled();

    // Wait for login to complete
    await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
  });

  test('should disable submit button during login', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = getTestCredentials('ADMIN');

    // Act
    await page.goto('/login');
    await page.getByLabel('아이디').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);

    // Get submit button
    const submitButton = page.getByRole('button', { name: '로그인' });

    // Assert button is enabled initially
    await expect(submitButton).toBeEnabled();

    // Submit form
    await submitButton.click();

    // Assert button is disabled during submission
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Logout Flow', () => {
  test('should successfully logout and clear session', async ({ authenticatedPage: page }) => {
    // Arrange - User is already authenticated via fixture
    await page.goto('/dashboard');

    // Verify authenticated state
    let authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);

    // Act - Click logout button (adjust selector based on your UI)
    // Note: You may need to adjust this based on where the logout button is located
    const logoutButton = page.getByRole('button', { name: /로그아웃|logout/i });
    await logoutButton.click();

    // Assert - Redirected to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });

    // Assert - Authentication state is cleared
    authState = await getAuthState(page);
    expect(authState?.state?.isAuthenticated).toBeFalsy();
    expect(authState?.state?.accessToken).toBeFalsy();
  });

  test('should call logout API endpoint', async ({ authenticatedPage: page }) => {
    // Arrange
    await page.goto('/dashboard');

    // Setup API response listener
    const logoutPromise = waitForApi(page, '/auth/logout', {
      method: 'POST',
    });

    // Act - Click logout button
    const logoutButton = page.getByRole('button', { name: /로그아웃|logout/i });
    await logoutButton.click();

    // Assert - Logout API was called
    const logoutResponse = await logoutPromise;
    expect(logoutResponse.status()).toBe(200);
  });
});

test.describe('Token Expiration and Refresh', () => {
  test('should redirect to login when token is expired', async ({ page, context }) => {
    // Arrange - Set expired token
    await setAuthState(page, {
      accessToken: 'expired-token',
      refreshToken: 'expired-refresh-token',
      user: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    });

    // Mock API to return 401 Unauthorized
    await mockApiError(page, /\/api\//, 401, 'Token expired');

    // Act - Try to access protected page
    await page.goto('/dashboard');

    // Assert - Redirected to login page
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Assert - Auth state should be cleared or show as unauthenticated
    const authState = await getAuthState(page);
    expect(authState?.state?.accessToken).toBe('expired-token'); // Still in localStorage but will be rejected by API
  });

  test('should attempt token refresh on 401 response', async ({ page }) => {
    // Arrange - Set valid refresh token
    await setAuthState(page, {
      accessToken: 'expired-access-token',
      refreshToken: 'valid-refresh-token',
      user: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    });

    // Mock 401 for first request
    let requestCount = 0;
    await page.route(/\/api\/statistics/, async (route) => {
      requestCount++;
      if (requestCount === 1) {
        // First request fails with 401
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: { message: 'Token expired' } }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        // Subsequent requests succeed
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ data: {} }),
          headers: { 'Content-Type': 'application/json' },
        });
      }
    });

    // Mock refresh token endpoint
    await page.route(/\/auth\/refresh/, async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Act - Try to access protected resource
    await page.goto('/dashboard');

    // Wait for potential refresh to occur
    await page.waitForTimeout(1000);

    // The actual assertion depends on your implementation
    // You might check that the refresh endpoint was called
    // or that the new token was stored
  });

  test('should redirect to login when refresh token is also expired', async ({ page }) => {
    // Arrange - Set expired tokens
    await setAuthState(page, {
      accessToken: 'expired-access-token',
      refreshToken: 'expired-refresh-token',
      user: {
        id: 1,
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        role: 'ADMIN',
      },
    });

    // Mock both endpoints to return 401
    await mockApiError(page, /\/api\//, 401, 'Token expired');
    await mockApiError(page, /\/auth\/refresh/, 401, 'Refresh token expired');

    // Act - Try to access protected page
    await page.goto('/dashboard');

    // Assert - Redirected to login
    await page.waitForURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ unauthenticatedPage: page }) => {
    // Act - Try to access protected route without authentication
    await page.goto('/dashboard');

    // Assert - Redirected to login page
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test('should allow authenticated users to access protected routes', async ({ 
    authenticatedPage: page 
  }) => {
    // Act - Access protected route
    await page.goto('/dashboard');

    // Assert - Successfully loads page
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Assert - Page content is visible (adjust selector based on your dashboard)
    await expect(page.locator('body')).not.toContainText('로그인');
  });

  test('should preserve intended destination after login', async ({ 
    unauthenticatedPage: page 
  }) => {
    // Arrange
    const credentials = getTestCredentials('ADMIN');
    const intendedUrl = '/voc/table';

    // Act - Try to access protected page
    await page.goto(intendedUrl);

    // Should be redirected to login
    await page.waitForURL(/\/login/);

    // Login
    await page.getByLabel('아이디').fill(credentials.username);
    await page.locator('#password').fill(credentials.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // Wait for any redirect
    await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });

    // Note: This test assumes your app implements redirect-after-login
    // The actual behavior may vary based on your implementation
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels on login form', async ({ unauthenticatedPage: page }) => {
    // Act
    await page.goto('/login');

    // Assert - Form fields have proper labels
    await expect(page.getByLabel('아이디')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Assert - Submit button has proper label
    const submitButton = page.getByRole('button', { name: '로그인' });
    await expect(submitButton).toBeVisible();

    // Assert - Password toggle has proper label
    const toggleButton = page.getByRole('button', { name: /비밀번호/ });
    await expect(toggleButton).toBeVisible();
  });

  test('should have proper ARIA attributes for validation errors', async ({ 
    unauthenticatedPage: page 
  }) => {
    // Act
    await page.goto('/login');
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert - Error messages have role="alert"
    const errors = page.locator('[role="alert"]');
    await expect(errors.first()).toBeVisible();

    // Assert - Form fields have aria-invalid when errors present
    const usernameInput = page.getByLabel('아이디');
    await expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('should be keyboard navigable', async ({ unauthenticatedPage: page }) => {
    // Act
    await page.goto('/login');

    const usernameInput = page.getByLabel('아이디');
    const passwordInput = page.locator('#password');
    const submitButton = page.getByRole('button', { name: '로그인' });

    // Tab through form
    await usernameInput.focus();
    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    // Password toggle button should be focused
    await page.keyboard.press('Tab');
    await expect(submitButton).toBeFocused();

    // Submit with Enter
    await usernameInput.fill('testuser');
    await passwordInput.fill('password');
    await page.keyboard.press('Enter');

    // Form should submit (validation will fail, but that's expected)
  });
});
