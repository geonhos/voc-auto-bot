# E2E Testing with Playwright

This directory contains end-to-end tests for the VOC Auto Bot frontend application using Playwright.

## Project Structure

```
e2e/
├── .auth/                    # Authentication state files (gitignored)
│   ├── user.json            # Default authenticated user state
│   ├── expired-token.json   # Expired token state for testing
│   ├── manager.json         # Manager role state (optional)
│   └── operator.json        # Operator role state (optional)
├── auth/                     # Authentication tests
│   └── login.spec.ts        # Login, logout, validation tests (SC-01)
├── voc/                      # VOC feature tests
│   ├── voc-input.spec.ts    # VOC creation form tests (SC-02)
│   ├── voc-status.spec.ts   # Public status lookup tests (SC-03)
│   ├── voc-kanban.spec.ts   # Kanban board tests (SC-04)
│   ├── voc-table.spec.ts    # Table view tests (SC-05)
│   ├── voc-detail.spec.ts   # Detail page tests (SC-06)
│   └── similar-voc.spec.ts  # Similar VOC feature tests (SC-07)
├── fixtures/                 # Test data and fixtures
│   ├── voc-data.ts          # VOC test data
│   ├── test-fixtures.ts     # Custom test fixtures
│   └── index.ts             # Fixture exports
├── page-objects/            # Page Object Models
│   ├── VocInputPage.ts      # VOC input form page object
│   ├── VocStatusPage.ts     # Status lookup page object
│   ├── VocTablePage.ts      # Table view page object
│   ├── VocKanbanPage.ts     # Kanban board page object
│   ├── VocDetailPage.ts     # Detail page page object
│   ├── SimilarVocModal.ts   # Similar VOC modal page object
│   └── index.ts             # Page object exports
├── setup/                    # Test setup scripts
│   └── auth.setup.ts        # Authentication setup before tests
├── utils/                    # Test utilities
│   └── test-helpers.ts      # Common helper functions
└── README.md                # This file
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your test credentials:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` with your test database credentials:

```env
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=admin123
TEST_MANAGER_USERNAME=manager
TEST_MANAGER_PASSWORD=manager123
TEST_OPERATOR_USERNAME=operator
TEST_OPERATOR_PASSWORD=operator123
```

### 3. Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Tests in Specific Browser

```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Run Tests in Headed Mode (with browser UI)

```bash
npm run test:e2e:headed
```

### Run Tests in UI Mode (interactive)

```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

### Run Specific Test Suite

```bash
npm run test:e2e:auth  # Run only authentication tests
```

### View Test Report

```bash
npm run test:e2e:report
```

## Test Organization

### Test Fixtures

We use custom fixtures to provide different authentication contexts:

- `authenticatedPage`: Pre-authenticated user session
- `unauthenticatedPage`: Fresh session without authentication
- `adminPage`: Authenticated as ADMIN role
- `managerPage`: Authenticated as MANAGER role
- `operatorPage`: Authenticated as OPERATOR role

Example usage:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('should access dashboard', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
});

test('should redirect to login', async ({ unauthenticatedPage: page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
```

### Test Helpers

Common utilities are available in `utils/test-helpers.ts`:

```typescript
import { login, logout, waitForApi, mockApi } from '../utils/test-helpers';

// Login helper
await login(page, { username: 'admin', password: 'admin123' });

// Wait for API call
await waitForApi(page, '/auth/login', { method: 'POST', status: 200 });

// Mock API response
await mockApi(page, /\/api\/vocs/, {
  status: 200,
  body: { data: [] }
});

// Mock API error
await mockApiError(page, /\/api\/vocs/, 500, 'Server error');
```

## Authentication Setup

The authentication setup runs before all tests and creates a reusable authentication state. This improves test performance by avoiding repeated logins.

### How It Works

1. `auth.setup.ts` runs first (defined as a dependency in `playwright.config.ts`)
2. It logs in with test credentials
3. Saves the authentication state to `e2e/.auth/user.json`
4. Other tests load this state automatically

### Creating Role-Specific States

To test different user roles, create additional setup files:

```typescript
// e2e/setup/manager.setup.ts
setup('authenticate-manager', async ({ page, context }) => {
  await login(page, getTestCredentials('MANAGER'));
  await context.storageState({ path: 'e2e/.auth/manager.json' });
});
```

Then update `playwright.config.ts` to use this state for specific tests.

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures/test-fixtures';
import { login, waitForApi } from '../utils/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ authenticatedPage: page }) => {
    // Arrange
    await page.goto('/some-page');

    // Act
    await page.getByRole('button', { name: 'Submit' }).click();

    // Assert
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Best Practices

1. **Use Semantic Locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for State Changes**: Use `waitForURL`, `waitForApi`, `waitForVisible` instead of fixed timeouts
3. **Test User Flows**: Test complete user journeys, not just individual actions
4. **Use Fixtures**: Leverage custom fixtures for different authentication states
5. **Mock APIs When Needed**: Use `mockApi` to test error scenarios or slow responses
6. **Keep Tests Independent**: Each test should be able to run in isolation
7. **Use Descriptive Names**: Test names should clearly describe what they test
8. **Follow AAA Pattern**: Arrange, Act, Assert

### Accessibility Testing

Include accessibility checks in your tests:

```typescript
test('should have proper ARIA labels', async ({ page }) => {
  await page.goto('/login');
  
  await expect(page.getByLabel('아이디')).toBeVisible();
  await expect(page.getByLabel('비밀번호')).toBeVisible();
  
  // Check ARIA attributes
  const input = page.getByLabel('아이디');
  await expect(input).toHaveAttribute('aria-required', 'true');
});
```

## Debugging Tests

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Playwright Tests",
  "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
  "args": ["test", "--debug"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Traces

Traces are automatically captured on first retry. View them with:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Screenshots and Videos

- Screenshots: Taken on failure (`screenshot: 'only-on-failure'`)
- Videos: Recorded on failure (`video: 'retain-on-failure'`)
- Location: `test-results/` directory

## CI/CD Integration

Tests are configured to run in CI with:

- No parallel execution (`workers: 1`)
- 2 retries on failure (`retries: 2`)
- HTML, JSON, and JUnit reports
- Automatic server startup

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Common Issues

### Tests Failing Locally

1. **Server not running**: Tests will start the dev server automatically
2. **Wrong credentials**: Check `.env.test` file
3. **Port already in use**: Stop other processes using port 3000
4. **Stale auth state**: Delete `e2e/.auth/` directory and re-run

### Tests Timing Out

1. Increase timeout in `playwright.config.ts`
2. Check network conditions
3. Look for missing `await` keywords
4. Use `test.slow()` for known slow tests

### Authentication Not Working

1. Verify test credentials exist in test database
2. Check `auth.setup.ts` is running
3. Verify `e2e/.auth/user.json` exists after setup
4. Check localStorage key name matches (`voc-auth-storage`)

## Coverage Reporting

E2E tests don't generate code coverage by default. For coverage:

1. Use Istanbul/NYC with Playwright
2. Or rely on unit tests for coverage metrics
3. E2E tests validate user flows and integration

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## Test Coverage

### SC-01: Authentication Tests (auth/login.spec.ts)

- Login success flow
- Login with invalid password
- Login with non-existent user
- Form validation (required fields)
- Password visibility toggle
- Loading states
- Logout flow
- Token expiration handling
- Token refresh
- Protected route access
- Redirect after login
- Accessibility (ARIA labels, keyboard navigation)

### SC-02: VOC Input Form (voc/voc-input.spec.ts)

- Form rendering with all required fields
- Required field validation (title, content)
- Field length validation
- VOC creation with complete data
- VOC creation with minimal data
- Category selection from API
- File upload (single and multiple)
- File size validation (max 10MB)
- File type validation
- File removal
- Form reset functionality
- Success modal display
- Error handling
- Accessibility (ARIA labels, required markers)

### SC-03: VOC Status Lookup (voc/voc-status.spec.ts)

- Public page access (no authentication required)
- Form validation (ticket ID, email format)
- Successful status lookup with valid credentials
- Status badge display
- VOC title display
- Error handling (invalid ticket ID, email mismatch)
- Server error handling
- Status timeline display
- Multiple timeline items for progressed VOCs
- Timeline chronological order
- Accessibility (form labels, ARIA attributes)

### SC-04: VOC Kanban Board (voc/voc-kanban.spec.ts)

- Board rendering with all status columns
- Card display in correct columns
- Card information display (title, priority, ticket ID)
- Drag and drop between columns
- Status update via drag and drop
- Drag revert on API error
- Card click navigation to detail
- Card count display in column headers
- Filtering by search query
- Filtering by priority
- Filtering by category
- Combined filters
- Empty state display
- Real-time updates after status change

### SC-05: VOC Table View (voc/voc-table.spec.ts)

- Table rendering with headers and data
- Loading state display
- Empty state display
- Column sorting (ascending/descending)
- Sort direction toggle
- Search filtering
- Status filtering
- Priority filtering
- Category filtering
- Date range filtering
- Filter reset
- Pagination info display
- Page size change (10, 20, 50)
- Next/previous page navigation
- Pagination button states (disabled on first/last)
- Individual row selection
- Select all rows
- Deselect all rows
- Row click navigation to detail
- Row hover highlighting
- Accessibility (table structure, pagination controls)

### SC-06: VOC Detail Page (voc/voc-detail.spec.ts)

- Detail information display (ticket ID, title, status, priority)
- Customer information display
- Category display
- Content display
- Status change with dropdown
- Status change with processing note
- Status change error handling
- Assignee assignment
- Current assignee display
- Memo addition (public and internal)
- Memo list display
- Memo deletion
- Attachments list display
- Attachment download
- Similar VOC modal opening
- 404 error handling
- Server error handling

### SC-07: Similar VOC Feature (voc/similar-voc.spec.ts)

- Modal opening via button click
- Modal closing (close button and Escape key)
- Similar VOC list display
- Card information display (ticket ID, title, similarity, status)
- Empty state when no similar VOCs
- Loading state during fetch
- Similarity percentage display
- Similarity score threshold verification
- Similarity sorting (descending order)
- High similarity score highlighting
- Status badge display for each card
- Different badge colors for different statuses
- Navigation to similar VOC detail
- Navigation by ticket ID click
- Same tab navigation
- API error handling
- Network timeout handling
- Card existence verification
- Accessibility (ARIA attributes, keyboard navigation, focus management)

## Contributing

When adding new E2E tests:

1. Place tests in appropriate directories (auth/, voc/, admin/, etc.)
2. Use existing fixtures and helpers
3. Follow naming conventions (`*.spec.ts`)
4. Add tests to this README under "Test Coverage"
5. Ensure tests are independent and can run in parallel
