# E2E Testing Guide

This guide provides comprehensive information for writing, running, and maintaining E2E tests.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Writing Tests](#writing-tests)
3. [Best Practices](#best-practices)
4. [Common Patterns](#common-patterns)
5. [Debugging](#debugging)
6. [CI/CD Integration](#cicd-integration)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Test database with seeded data
- Test user accounts

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Configure test environment
cp .env.test.example .env.test
# Edit .env.test with your test credentials
```

### First Test Run

```bash
# Run all tests
npm run test:e2e

# Run in UI mode (recommended for development)
npm run test:e2e:ui

# Run specific test file
npx playwright test e2e/auth/login.spec.ts
```

## Writing Tests

### Test Structure

Follow the Arrange-Act-Assert (AAA) pattern:

```typescript
test('should do something', async ({ authenticatedPage: page }) => {
  // Arrange - Set up test conditions
  await page.goto('/dashboard');
  const button = page.getByRole('button', { name: 'Submit' });

  // Act - Perform the action
  await button.click();

  // Assert - Verify the result
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Choosing the Right Fixture

```typescript
// For tests requiring authentication
test('admin feature', async ({ authenticatedPage: page }) => {
  // User is already logged in
});

// For tests without authentication (login, public pages)
test('login page', async ({ unauthenticatedPage: page }) => {
  // Fresh session without auth
});

// For role-specific tests
test('admin only', async ({ adminPage: page }) => {
  // Authenticated as ADMIN
});
```

### Locator Strategies

Priority order for locators:

1. **Role-based**: `getByRole('button', { name: 'Submit' })`
2. **Label**: `getByLabel('Username')`
3. **Text**: `getByText('Welcome')`
4. **Test ID**: `getByTestId('submit-button')`
5. **CSS (last resort)**: `locator('.submit-button')`

```typescript
// Good - Semantic, resilient to changes
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('admin');
await page.getByText('Welcome back').isVisible();

// Okay - Requires adding test IDs
await page.getByTestId('login-form').submit();

// Bad - Brittle, coupled to implementation
await page.locator('.btn-primary').click();
await page.locator('#username-input').fill('admin');
```

### Waiting Strategies

```typescript
// Good - Wait for specific conditions
await page.waitForURL(/\/dashboard/);
await expect(page.getByText('Loading...')).not.toBeVisible();
await waitForApi(page, '/api/users', { status: 200 });

// Bad - Fixed timeouts
await page.waitForTimeout(3000); // Avoid unless absolutely necessary
```

## Best Practices

### 1. Test Independence

Each test should be independent and able to run in any order:

```typescript
// Good
test.beforeEach(async ({ page }) => {
  // Reset state before each test
  await clearAuth(page);
  await page.goto('/login');
});

// Bad - Tests depend on each other
test('login', async () => { /* ... */ });
test('navigate to dashboard', async () => {
  // Assumes previous test logged in
});
```

### 2. Use Page Object Model (Optional)

For complex pages, consider using Page Object Model:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.page.getByLabel('아이디').fill(username);
    await this.page.getByLabel('비밀번호').fill(password);
    await this.page.getByRole('button', { name: '로그인' }).click();
  }

  async getErrorMessage() {
    return this.page.locator('[role="alert"]').textContent();
  }
}

// In test
test('login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('admin', 'admin123');
  await expect(page).toHaveURL(/\/dashboard/);
});
```

### 3. Avoid Flaky Tests

```typescript
// Good - Wait for specific condition
await expect(page.getByText('Success')).toBeVisible();

// Bad - Race condition
await page.click('button');
expect(await page.textContent('.result')).toBe('Success'); // May fail

// Good - Handle async operations
await page.getByRole('button').click();
await page.waitForResponse(response => 
  response.url().includes('/api/submit') && response.status() === 200
);
await expect(page.getByText('Success')).toBeVisible();
```

### 4. Test User Flows, Not Implementation

```typescript
// Good - Tests user flow
test('user can complete checkout', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Add to Cart' }).first().click();
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Checkout' }).click();
  await fillForm(page, { /* ... */ });
  await page.getByRole('button', { name: 'Place Order' }).click();
  await expect(page.getByText('Order confirmed')).toBeVisible();
});

// Bad - Tests implementation details
test('cart state updates', async ({ page }) => {
  // Testing internal state management
});
```

### 5. Group Related Tests

```typescript
test.describe('Login Flow', () => {
  test.describe('Successful Login', () => {
    test('with admin credentials', async ({ page }) => { /* ... */ });
    test('with manager credentials', async ({ page }) => { /* ... */ });
  });

  test.describe('Failed Login', () => {
    test('with invalid password', async ({ page }) => { /* ... */ });
    test('with non-existent user', async ({ page }) => { /* ... */ });
  });
});
```

## Common Patterns

### Pattern 1: Form Submission

```typescript
test('should submit form', async ({ page }) => {
  await page.goto('/form');
  
  // Fill form
  await fillForm(page, {
    'Name': 'John Doe',
    'Email': 'john@example.com',
  });
  
  // Wait for API
  const submitPromise = waitForApi(page, '/api/submit', {
    method: 'POST',
    status: 200,
  });
  
  // Submit
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // Verify
  await submitPromise;
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Pattern 2: Handling Modals

```typescript
test('should confirm action in modal', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Open modal
  await page.getByRole('button', { name: 'Delete' }).click();
  
  // Wait for modal
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  
  // Confirm
  await modal.getByRole('button', { name: 'Confirm' }).click();
  
  // Verify modal closed
  await expect(modal).not.toBeVisible();
});
```

### Pattern 3: File Upload

```typescript
test('should upload file', async ({ page }) => {
  await page.goto('/upload');
  
  // Prepare file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('path/to/test-file.pdf');
  
  // Submit
  await page.getByRole('button', { name: 'Upload' }).click();
  
  // Verify
  await expect(page.getByText('File uploaded')).toBeVisible();
});
```

### Pattern 4: Infinite Scroll

```typescript
test('should load more items on scroll', async ({ page }) => {
  await page.goto('/list');
  
  // Get initial count
  const initialCount = await page.locator('.item').count();
  
  // Scroll to bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  
  // Wait for new items
  await page.waitForFunction(
    (count) => document.querySelectorAll('.item').length > count,
    initialCount
  );
  
  // Verify more items loaded
  const newCount = await page.locator('.item').count();
  expect(newCount).toBeGreaterThan(initialCount);
});
```

### Pattern 5: Dropdown/Select

```typescript
test('should select option from dropdown', async ({ page }) => {
  await page.goto('/form');
  
  // For native select
  await page.selectOption('select[name="category"]', 'value');
  
  // For custom dropdown (like Radix UI)
  await page.getByRole('button', { name: 'Select category' }).click();
  await page.getByRole('option', { name: 'Category A' }).click();
  
  // Verify selection
  await expect(page.getByText('Category A')).toBeVisible();
});
```

## Debugging

### Debug Mode

```bash
# Run in debug mode
npm run test:e2e:debug

# Debug specific test
npx playwright test e2e/auth/login.spec.ts --debug
```

### Pause Execution

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/login');
  
  // Pause here - browser window opens, DevTools available
  await page.pause();
  
  await page.getByLabel('Username').fill('admin');
});
```

### Take Screenshots

```typescript
test('screenshot example', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Take screenshot
  await page.screenshot({ path: 'debug/dashboard.png' });
  
  // Full page screenshot
  await page.screenshot({ 
    path: 'debug/dashboard-full.png',
    fullPage: true 
  });
});
```

### Console Logs

```typescript
test('check console', async ({ page }) => {
  // Listen to console messages
  page.on('console', msg => console.log('Browser:', msg.text()));
  
  // Listen to page errors
  page.on('pageerror', err => console.log('Error:', err.message));
  
  await page.goto('/dashboard');
});
```

### Trace Viewer

```bash
# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: voc_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Setup test database
        run: npm run db:seed:test
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          TEST_ADMIN_USERNAME: admin
          TEST_ADMIN_PASSWORD: admin123
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

### Environment Variables in CI

Set in GitHub Actions secrets:

- `TEST_ADMIN_USERNAME`
- `TEST_ADMIN_PASSWORD`
- `TEST_MANAGER_USERNAME`
- `TEST_MANAGER_PASSWORD`
- `TEST_OPERATOR_USERNAME`
- `TEST_OPERATOR_PASSWORD`

### Parallel Execution

In `playwright.config.ts`:

```typescript
export default defineConfig({
  // In CI, run tests sequentially to avoid conflicts
  workers: process.env.CI ? 1 : undefined,
  
  // More retries in CI
  retries: process.env.CI ? 2 : 1,
});
```

## Test Checklist

Before committing tests, ensure:

- [ ] Tests are independent and can run in any order
- [ ] Used semantic locators (role, label, text)
- [ ] No fixed timeouts (waitForTimeout)
- [ ] Proper cleanup in beforeEach/afterEach
- [ ] Error cases covered
- [ ] Loading states tested
- [ ] Accessibility considered
- [ ] Tests are documented with clear names
- [ ] No console errors or warnings
- [ ] Tests pass consistently (run 3+ times)

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

## Getting Help

- Review example tests in `e2e/examples/`
- Check `e2e/utils/test-helpers.ts` for utilities
- Read test fixtures in `e2e/fixtures/test-fixtures.ts`
- Refer to existing tests in `e2e/auth/login.spec.ts`
