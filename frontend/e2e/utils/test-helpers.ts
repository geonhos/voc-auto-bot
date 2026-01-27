import { Page, expect, Response } from '@playwright/test';

/**
 * @description Common test helper functions for E2E tests
 * Provides utilities for API mocking, waiting, and common test patterns
 */

/**
 * Wait for specific API endpoint to be called
 * @param page - Playwright page instance
 * @param endpoint - API endpoint to wait for (can be string or regex)
 * @param options - Additional options
 */
export async function waitForApi(
  page: Page,
  endpoint: string | RegExp,
  options: {
    timeout?: number;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    status?: number;
  } = {}
): Promise<Response> {
  const { timeout = 10000, method, status } = options;

  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      const matchesUrl =
        typeof endpoint === 'string' ? url.includes(endpoint) : endpoint.test(url);

      const matchesMethod = method ? response.request().method() === method : true;
      const matchesStatus = status ? response.status() === status : true;

      return matchesUrl && matchesMethod && matchesStatus;
    },
    { timeout }
  );
}

/**
 * Mock API endpoint with custom response
 * @param page - Playwright page instance
 * @param endpoint - API endpoint to mock
 * @param response - Mock response data
 * @param options - Additional options
 */
export async function mockApi(
  page: Page,
  endpoint: string | RegExp,
  response: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
  },
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  } = {}
): Promise<void> {
  const { status = 200, body = {}, headers = {} } = response;
  const { method } = options;

  await page.route(endpoint, async (route) => {
    const request = route.request();
    const matchesMethod = method ? request.method() === method : true;

    if (matchesMethod) {
      await route.fulfill({
        status,
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock API endpoint to simulate error
 * @param page - Playwright page instance
 * @param endpoint - API endpoint to mock
 * @param errorCode - HTTP error code (e.g., 400, 401, 500)
 * @param errorMessage - Error message
 */
export async function mockApiError(
  page: Page,
  endpoint: string | RegExp,
  errorCode: number = 500,
  errorMessage: string = 'Internal Server Error'
): Promise<void> {
  await mockApi(page, endpoint, {
    status: errorCode,
    body: {
      error: {
        message: errorMessage,
        code: errorCode,
      },
    },
  });
}

/**
 * Login helper function
 * @param page - Playwright page instance
 * @param credentials - Login credentials
 */
export async function login(
  page: Page,
  credentials: {
    username: string;
    password: string;
  }
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('아이디').fill(credentials.username);
  await page.getByLabel('비밀번호').fill(credentials.password);
  await page.getByRole('button', { name: '로그인' }).click();
  
  // Wait for redirect after successful login
  await page.waitForURL(/\/(dashboard|voc)/, { timeout: 10000 });
}

/**
 * Logout helper function
 * @param page - Playwright page instance
 */
export async function logout(page: Page): Promise<void> {
  // Adjust selector based on your logout button location
  await page.getByRole('button', { name: /로그아웃|logout/i }).click();
  
  // Wait for redirect to login page
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

/**
 * Clear authentication state
 * @param page - Playwright page instance
 */
export async function clearAuth(page: Page): Promise<void> {
  // Navigate to the app first to ensure we have access to localStorage
  const currentUrl = page.url();
  if (currentUrl === 'about:blank' || !currentUrl.startsWith('http://localhost')) {
    await page.goto('/login');
  }

  await page.evaluate(() => {
    localStorage.removeItem('voc-auth-storage');
    sessionStorage.clear();
  });
}

/**
 * Set authentication state manually
 * @param page - Playwright page instance
 * @param authState - Authentication state to set
 */
export async function setAuthState(
  page: Page,
  authState: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: number;
      username: string;
      name: string;
      email: string;
      role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
    };
  }
): Promise<void> {
  await page.evaluate((state) => {
    const storageData = {
      state: {
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem('voc-auth-storage', JSON.stringify(storageData));
  }, authState);
}

/**
 * Get current authentication state from localStorage
 * @param page - Playwright page instance
 */
export async function getAuthState(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const stored = localStorage.getItem('voc-auth-storage');
    return stored ? JSON.parse(stored) : null;
  });
}

/**
 * Wait for element to be visible with custom timeout
 * @param page - Playwright page instance
 * @param selector - Element selector
 * @param options - Wait options
 */
export async function waitForVisible(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * Wait for dialog to appear
 * @param page - Playwright page instance
 * @param titleOrContent - Expected dialog title or content
 * @param options - Wait options
 */
export async function waitForDialog(
  page: Page,
  titleOrContent: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;
  const dialog = page.getByRole('dialog').or(page.getByRole('alertdialog'));
  await expect(dialog).toBeVisible({ timeout });
  if (typeof titleOrContent === 'string') {
    await expect(dialog).toContainText(titleOrContent);
  } else {
    await expect(dialog.getByText(titleOrContent)).toBeVisible();
  }
}

/**
 * Wait for toast/notification message
 * @param page - Playwright page instance
 * @param message - Expected message text
 * @param type - Toast type (success, error, info, warning)
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  options?: { type?: 'success' | 'error' | 'info' | 'warning'; timeout?: number }
): Promise<void> {
  const { type, timeout = 5000 } = options || {};
  // Adjust selector based on your toast implementation
  const toastSelector = type
    ? `[role="alert"][data-type="${type}"]`
    : '[role="alert"]';

  const toast = page.locator(toastSelector);
  await expect(toast).toBeVisible({ timeout });

  if (typeof message === 'string') {
    await expect(toast).toContainText(message);
  } else {
    await expect(toast).toContainText(message);
  }
}

/**
 * Fill form with data
 * @param page - Playwright page instance
 * @param formData - Object with field labels/ids and values
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string | number>
): Promise<void> {
  for (const [field, value] of Object.entries(formData)) {
    const input = page.getByLabel(field).or(page.locator(`[name="${field}"]`));
    await input.fill(String(value));
  }
}

/**
 * Take screenshot with custom name
 * @param page - Playwright page instance
 * @param name - Screenshot name
 */
export async function takeScreenshot(
  page: Page,
  name: string
): Promise<Buffer> {
  return await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Wait for network to be idle
 * @param page - Playwright page instance
 * @param options - Wait options
 */
export async function waitForNetworkIdle(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Simulate slow network
 * @param page - Playwright page instance
 * @param latency - Network latency in ms
 */
export async function simulateSlowNetwork(
  page: Page,
  latency: number = 1000
): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (500 * 1024) / 8, // 500kb/s
    uploadThroughput: (500 * 1024) / 8,
    latency,
  });
}

/**
 * Check if element is in viewport
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function isInViewport(
  page: Page,
  selector: string
): Promise<boolean> {
  return await page.locator(selector).isVisible();
}

/**
 * Scroll to element
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Wait for specific text to appear on page
 * @param page - Playwright page instance
 * @param text - Text to wait for
 * @param options - Wait options
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const { timeout = 5000 } = options;
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout });
}

/**
 * Create test user data
 * @param overrides - Optional overrides for default user data
 */
export function createTestUser(overrides?: Partial<{
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}>): {
  username: string;
  password: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
} {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    password: 'Test1234!',
    name: 'Test User',
    email: `testuser${timestamp}@example.com`,
    role: 'OPERATOR',
    ...overrides,
  };
}

/**
 * Get test credentials by role
 * @param role - User role
 */
export function getTestCredentials(role: 'ADMIN' | 'MANAGER' | 'OPERATOR'): {
  username: string;
  password: string;
} {
  const credentials = {
    ADMIN: {
      username: process.env.TEST_ADMIN_USERNAME || 'admin',
      password: process.env.TEST_ADMIN_PASSWORD || 'admin123',
    },
    MANAGER: {
      username: process.env.TEST_MANAGER_USERNAME || 'manager',
      password: process.env.TEST_MANAGER_PASSWORD || 'manager123',
    },
    OPERATOR: {
      username: process.env.TEST_OPERATOR_USERNAME || 'operator',
      password: process.env.TEST_OPERATOR_PASSWORD || 'operator123',
    },
  };

  return credentials[role];
}
