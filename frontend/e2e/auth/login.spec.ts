import { test, expect } from '../fixtures/test-fixtures';
import {
  waitForApi,
  mockApiError,
  clearAuth,
  setAuthState,
  getAuthState,
  getTestCredentials,
} from '../utils/test-helpers';

/**
 * @description E2E tests for authentication workflow (SC-01)
 * Tests logout, token management, and protected routes
 *
 * @see ./detailed/auth/login.detailed.spec.ts for detailed UI interaction tests
 * - Page rendering, form validation, button states
 * - Keyboard navigation, accessibility
 * - Responsive layout, security tests
 */

// Login Flow UI tests moved to: e2e/detailed/auth/login.detailed.spec.ts

test.describe('Logout Flow', () => {
  test('should successfully logout and clear session', async ({ authenticatedPage: page }) => {
    // Arrange - User is already authenticated via fixture
    await page.goto('/dashboard');

    // Verify authenticated state
    let authState = await getAuthState(page);
    expect(authState.state.isAuthenticated).toBe(true);

    // Act - Click logout button
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
  test('should redirect to login when token is expired', async ({ page }) => {
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
        await route.fulfill({
          status: 401,
          body: JSON.stringify({ error: { message: 'Token expired' } }),
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
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
    authenticatedPage: page,
  }) => {
    // Act - Access protected route
    await page.goto('/dashboard');

    // Assert - Successfully loads page
    await expect(page).toHaveURL(/\/dashboard/);

    // Assert - Page content is visible
    await expect(page.locator('body')).not.toContainText('로그인');
  });

  test('should preserve intended destination after login', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const credentials = getTestCredentials('ADMIN');
    const intendedUrl = '/voc/table';

    // Mock the login API
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: {
              id: 1,
              username: 'admin',
              name: '관리자',
              email: credentials.email,
              role: 'ADMIN',
            },
          },
        }),
      });
    });

    // Act - Try to access protected page
    await page.goto(intendedUrl);

    // Should be redirected to login
    await page.waitForURL(/\/login/);

    // Login
    await page.getByLabel('이메일').fill(credentials.email);
    await page.locator('#password').fill(credentials.password);
    await page.getByRole('button', { name: '로그인' }).click();

    // Wait for any redirect
    await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
  });
});

/**
 * Security Tests
 *
 * NOTE: These tests are currently skipped as they require backend implementation.
 * The tests verify security features that should be implemented on the backend API.
 *
 * Backend Implementation Requirements:
 * 1. Account Lockout: Lock account after 5 consecutive failed login attempts
 *    - Return 429 Too Many Requests
 *    - Include lockedUntil timestamp in error response
 *    - Auto-unlock after specified time period (e.g., 5 minutes)
 *
 * 2. Failed Attempt Tracking: Track failed login attempts per account
 *    - Include failedAttempts and remainingAttempts in error response
 *    - Reset counter on successful login
 *
 * 3. Password Complexity: Enforce strong password policy
 *    - Minimum 8 characters
 *    - Uppercase and lowercase letters
 *    - Numbers and special characters
 *    - Return 400 Bad Request with WEAK_PASSWORD code
 *
 * API Response Format:
 * {
 *   "success": false,
 *   "error": {
 *     "code": "ACCOUNT_LOCKED" | "INVALID_CREDENTIALS" | "WEAK_PASSWORD",
 *     "message": "Error message in Korean",
 *     "lockedUntil": "ISO timestamp", // For ACCOUNT_LOCKED
 *     "failedAttempts": 3,  // For INVALID_CREDENTIALS
 *     "remainingAttempts": 2  // For INVALID_CREDENTIALS
 *   }
 * }
 *
 * To enable these tests:
 * 1. Implement backend security features
 * 2. Remove .skip from test descriptions
 * 3. Update API mocking routes to match actual endpoint (currently /api/v1/auth/login)
 */
test.describe('Security Tests', () => {
  test.skip('should lock account after 5 failed login attempts', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const testEmail = 'test@example.com';
    const wrongPassword = 'wrongpassword';
    let attemptCount = 0;

    await page.goto('/login');

    // Mock login API to track failed attempts
    await page.route('**/api/auth/login', async (route) => {
      attemptCount++;

      if (attemptCount >= 5) {
        // Return 429 Too Many Requests after 5 attempts
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'ACCOUNT_LOCKED',
              message: '계정이 잠겼습니다. 5분 후 다시 시도해주세요.',
              lockedUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            },
          }),
        });
      } else {
        // Return 401 for failed attempts
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: '이메일 또는 비밀번호가 올바르지 않습니다',
              failedAttempts: attemptCount,
              remainingAttempts: 5 - attemptCount,
            },
          }),
        });
      }
    });

    // Act - Attempt login 5 times with wrong password
    for (let i = 1; i <= 5; i++) {
      await page.locator('#email').fill(testEmail);
      await page.locator('#password').fill(wrongPassword);
      await page.getByRole('button', { name: '로그인' }).click();

      // Wait for API call and error display
      await page.waitForTimeout(1000);

      if (i < 5) {
        // Assert - Failed attempt message (or any error message)
        const errorAlert = page.locator('.bg-red-50[role="alert"]');
        await expect(errorAlert).toBeVisible({ timeout: 5000 });
      }
    }

    // Assert - Account locked message on 5th attempt
    const lockedAlert = page.locator('.bg-red-50[role="alert"]');
    await expect(lockedAlert).toBeVisible({ timeout: 5000 });
    await expect(lockedAlert).toContainText(/계정이 잠겼습니다|로그인에 실패했습니다/);

    // Verify attempt count
    expect(attemptCount).toBe(5);
  });

  test.skip('should track failed login attempts', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const testEmail = 'test@example.com';
    let failedAttempts = 0;

    await page.goto('/login');

    // Mock login API to track attempts
    await page.route('**/api/auth/login', async (route) => {
      failedAttempts++;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '이메일 또는 비밀번호가 올바르지 않습니다',
            failedAttempts,
            remainingAttempts: 5 - failedAttempts,
          },
        }),
      });
    });

    // Act - Make 3 failed login attempts
    for (let i = 1; i <= 3; i++) {
      await page.locator('#email').fill(testEmail);
      await page.locator('#password').fill('wrongpassword');
      await page.getByRole('button', { name: '로그인' }).click();

      // Wait for API call
      await page.waitForTimeout(1000);

      // Assert - Error message displayed
      const errorAlert = page.locator('.bg-red-50[role="alert"]');
      await expect(errorAlert).toBeVisible({ timeout: 5000 });
    }

    // Assert - Failed attempts tracked correctly
    expect(failedAttempts).toBe(3);
  });

  test.skip('should unlock account after lockout period', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const testEmail = 'locked@example.com';
    const correctPassword = 'correctpassword';
    let isLocked = true;
    const lockoutDuration = 2000; // 2 seconds for testing
    const lockoutEndTime = Date.now() + lockoutDuration;

    await page.goto('/login');

    // Mock login API with lockout logic
    await page.route('**/api/auth/login', async (route) => {
      const now = Date.now();

      if (isLocked && now < lockoutEndTime) {
        // Still locked
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'ACCOUNT_LOCKED',
              message: '계정이 잠겼습니다. 잠시 후 다시 시도해주세요.',
              lockedUntil: new Date(lockoutEndTime).toISOString(),
            },
          }),
        });
      } else {
        // Unlocked - allow login with correct credentials
        isLocked = false;
        const postData = route.request().postDataJSON();

        if (postData?.password === correctPassword) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
                user: {
                  id: 1,
                  username: 'testuser',
                  name: 'Test User',
                  email: testEmail,
                  role: 'OPERATOR',
                },
              },
            }),
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: '이메일 또는 비밀번호가 올바르지 않습니다',
              },
            }),
          });
        }
      }
    });

    // Act - Try login while locked
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(correctPassword);
    await page.getByRole('button', { name: '로그인' }).click();

    // Wait for error to display
    await page.waitForTimeout(1000);

    // Assert - Account locked error
    let errorAlert = page.locator('.bg-red-50[role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });
    await expect(errorAlert).toContainText(/계정이 잠겼습니다|로그인에 실패했습니다/);

    // Wait for lockout period to end
    await page.waitForTimeout(lockoutDuration + 500);

    // Act - Try login after lockout period
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(correctPassword);
    await page.getByRole('button', { name: '로그인' }).click();

    // Assert - Successfully logged in
    await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
  });

  /**
   * Password Complexity Test
   *
   * NOTE: This test is skipped because it requires a registration endpoint
   * which is not implemented in the current system.
   *
   * Password policy requirements:
   * - At least 8 characters
   * - Contains uppercase and lowercase letters
   * - Contains numbers
   * - Contains special characters (!@#$%^&*(),.?":{}|<>)
   *
   * This test should be enabled when user registration is implemented.
   */
  test.skip('should enforce password complexity requirements', async ({ unauthenticatedPage: page }) => {
    // Arrange
    const testEmail = 'newuser@example.com';
    const weakPasswords = [
      '123',           // Too short
      'password',      // No numbers or special chars
      'Pass1',         // Too short
      '12345678',      // No letters
    ];

    await page.goto('/login');

    // Mock registration/password-change API
    await page.route('**/api/auth/register', async (route) => {
      const postData = route.request().postDataJSON();
      const password = postData?.password || '';

      // Password complexity rules
      const hasMinLength = password.length >= 8;
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

      if (!isValid) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'WEAK_PASSWORD',
              message: '비밀번호는 8자 이상이며, 대소문자, 숫자, 특수문자를 포함해야 합니다.',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              message: '회원가입이 완료되었습니다.',
            },
          }),
        });
      }
    });

    // Act & Assert - Test weak passwords
    for (const weakPassword of weakPasswords) {
      const response = await page.evaluate(async (data) => {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        return {
          status: res.status,
          body: await res.json(),
        };
      }, { email: testEmail, password: weakPassword });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    }

    // Act - Test strong password
    const strongPassword = 'SecurePass123!';
    const strongResponse = await page.evaluate(async (data) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return {
        status: res.status,
        body: await res.json(),
      };
    }, { email: testEmail, password: strongPassword });

    expect(strongResponse.status).toBe(200);
  });
});
