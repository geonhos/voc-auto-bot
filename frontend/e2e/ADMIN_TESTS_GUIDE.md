# Admin & Dashboard E2E Tests Guide

## New Test Files Created

This implementation adds comprehensive E2E tests for admin screens and dashboard:

### Page Objects (e2e/pages/)
1. **EmailPage.ts** - Email template management page object
2. **CategoryPage.ts** - Category tree management page object
3. **UserPage.ts** - User management page object
4. **DashboardPage.ts** - Statistics dashboard page object

### Test Specifications

#### 1. Email Template Tests (e2e/email/email.spec.ts) - SC-08
```bash
npx playwright test e2e/email/email.spec.ts
```

**13 test cases:**
- Template list display
- Template selection
- Email composition form
- Variable list display
- Variable insertion
- Preview with variable substitution
- Email sending (success/error)
- Field validation
- Template filtering by type
- Additional recipients
- System template identification
- Form data preservation

#### 2. Category Management Tests (e2e/admin/category.spec.ts) - SC-09
```bash
npx playwright test e2e/admin/category.spec.ts
```

**16 test cases:**
- Category tree display
- Expand/collapse nodes
- Create root category
- Create subcategory
- Edit category
- Delete category
- Prevent deletion with children
- Drag and drop reordering
- Inactive category badge
- Field validation (name, code)
- Code format validation
- Duplicate code prevention
- Cancel creation
- Toggle active status
- Child category count
- Category search

#### 3. User Management Tests (e2e/admin/user.spec.ts) - SC-10
```bash
npx playwright test e2e/admin/user.spec.ts
```

**20 test cases:**
- User list display
- User information display
- Create new user
- Required field validation
- Email format validation
- Password strength validation
- Duplicate username prevention
- Edit user information
- Change user role
- Deactivate user
- Activate user
- Reset password
- Unlock account
- Search users
- Filter by role
- Filter by status
- Cancel form
- Prevent self-deactivation
- Role badge colors
- Pagination

#### 4. Dashboard Tests (e2e/dashboard/dashboard.spec.ts) - SC-11
```bash
npx playwright test e2e/dashboard/dashboard.spec.ts
```

**24 test cases:**
- KPI cards display (4 cards)
- KPI change indicators
- Trend chart rendering
- Category chart rendering
- Status chart rendering
- Priority chart rendering
- Recent VOC list display
- Navigate to VOC detail
- Period filter: Today
- Period filter: 7 days
- Period filter: 30 days
- Period filter: Custom
- Refresh dashboard data
- Loading state
- API error handling
- Empty state
- Chart tooltips
- Category filtering via chart
- Legend toggling
- Date range labels
- Get all KPI values
- Custom period selection
- Mobile responsive charts
- Export dashboard data
- Help tooltips

## Running Tests

### Run All Admin Tests
```bash
# All new admin/dashboard tests
npx playwright test e2e/email/ e2e/admin/ e2e/dashboard/

# Specific suite
npx playwright test e2e/email/email.spec.ts
npx playwright test e2e/admin/category.spec.ts
npx playwright test e2e/admin/user.spec.ts
npx playwright test e2e/dashboard/dashboard.spec.ts
```

### Debug Mode
```bash
# Debug specific test
npx playwright test e2e/email/email.spec.ts --debug

# Debug with UI mode
npx playwright test --ui
```

### Browser-Specific
```bash
# Chrome
npx playwright test e2e/admin/ --project=chromium

# Firefox
npx playwright test e2e/admin/ --project=firefox

# Safari
npx playwright test e2e/admin/ --project=webkit

# Mobile
npx playwright test e2e/dashboard/ --project="Mobile Chrome"
```

### Watch Mode
```bash
npx playwright test e2e/admin/ --watch
```

## Test Data & Mocking

All tests use API mocking for consistent, fast execution:

```typescript
// Example from email.spec.ts
await mockApi(
  page,
  /\/api\/email\/templates/,
  {
    status: 200,
    body: {
      content: [...templateData],
      totalElements: 3,
    },
  },
  { method: 'GET' }
);
```

## Page Object Usage

```typescript
import { EmailPage } from '../pages/EmailPage';

test('send email', async ({ page }) => {
  const emailPage = new EmailPage(page);

  await emailPage.goto(vocId);
  await emailPage.selectTemplate('VOC 접수 확인');
  await emailPage.fillComposeForm({
    recipient: 'customer@example.com'
  });
  await emailPage.sendEmail();
  await emailPage.verifyEmailSent();
});
```

## Accessibility Testing

All page objects support accessibility testing:

```typescript
import { checkA11y } from '../utils/test-helpers';

test('dashboard accessibility', async ({ page }) => {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.goto();
  await checkA11y(page); // WCAG 2.1 AA compliance
});
```

## Test Structure

```
e2e/
├── pages/                    # NEW: Admin page objects
│   ├── EmailPage.ts
│   ├── CategoryPage.ts
│   ├── UserPage.ts
│   ├── DashboardPage.ts
│   └── index.ts
├── email/                    # NEW: Email tests
│   └── email.spec.ts
├── admin/                    # NEW: Admin tests
│   ├── category.spec.ts
│   └── user.spec.ts
├── dashboard/                # NEW: Dashboard tests
│   └── dashboard.spec.ts
├── utils/                    # ENHANCED: Test helpers
│   └── test-helpers.ts
├── page-objects/             # Existing VOC page objects
├── voc/                      # Existing VOC tests
├── setup/                    # Auth setup
└── fixtures/                 # Test data
```

## Key Features

### 1. Comprehensive Coverage
- **Email**: 13 tests covering template management and sending
- **Category**: 16 tests covering tree CRUD and drag-drop
- **User**: 20 tests covering user lifecycle management
- **Dashboard**: 24 tests covering KPIs, charts, and filters

### 2. Page Object Pattern
- Reusable page interactions
- Type-safe methods
- Centralized selectors
- Easy maintenance

### 3. API Mocking
- Fast execution (no backend required)
- Consistent test data
- Error scenario testing
- Offline capability

### 4. Best Practices
- Semantic selectors (role, label, text)
- Data-testid for stability
- Network idle waits
- Accessibility checks
- Mobile responsive testing

## Integration with Existing Tests

These tests complement existing VOC tests:
- **voc/voc-input.spec.ts** - VOC creation
- **voc/voc-table.spec.ts** - VOC listing
- **voc/voc-kanban.spec.ts** - Kanban board
- **voc/voc-status.spec.ts** - Status updates

Combined, the full E2E suite provides:
- **100+ tests** covering entire application
- **4 main user flows** (VOC, Admin, Dashboard, Auth)
- **Cross-browser testing** (Chrome, Firefox, Safari)
- **Mobile testing** (iOS, Android viewports)
- **Accessibility compliance** (WCAG 2.1 AA)

## CI/CD Integration

Tests run automatically:
```yaml
# .github/workflows/e2e-tests.yml
- name: Run Admin E2E Tests
  run: npm run test:e2e -- e2e/admin/ e2e/email/ e2e/dashboard/
```

## Troubleshooting

### Test Timeout
```bash
# Increase timeout
npx playwright test --timeout=120000
```

### Authentication Issues
```bash
# Clear auth state
rm -rf e2e/.auth/
npx playwright test e2e/setup/
```

### Flaky Tests
```bash
# Run with retries
npx playwright test --retries=2
```

### Debug Failures
```bash
# Show trace
npx playwright show-trace trace.zip

# Screenshot on failure
npx playwright test --screenshot=only-on-failure
```

## Next Steps

1. **Add Visual Regression**: Compare screenshots
2. **Performance Testing**: Measure chart render times
3. **API Contract Testing**: Validate request/response schemas
4. **i18n Testing**: Multi-language support
5. **Snapshot Testing**: Component rendering

## Support

For issues or questions:
1. Check test output and screenshots in `test-results/`
2. Review HTML report: `npx playwright show-report`
3. Run in debug mode: `npx playwright test --debug`
4. Check CI logs for failure patterns
