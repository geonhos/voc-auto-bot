# E2E Test Fixtures

This directory contains test fixtures and mock data factories for E2E testing with Playwright.

## Files Overview

### `test-fixtures.ts`
Custom Playwright test fixtures providing authenticated and unauthenticated page contexts.

**Available Fixtures:**
- `authenticatedPage` - Page with valid authentication
- `unauthenticatedPage` - Fresh page without auth
- `adminPage` - Page authenticated as ADMIN
- `managerPage` - Page authenticated as MANAGER
- `operatorPage` - Page authenticated as OPERATOR

**Custom Matchers:**
- `toBeOnLoginPage(page)` - Assert redirect to login
- `toBeAuthenticated(page)` - Assert user is authenticated
- `toHaveRole(page, role)` - Assert user has specific role

### `voc-data.ts`
Legacy static test data for VOC-related tests.

**Contains:**
- `testCategories` - Array of category objects
- `testAssignees` - Array of assignee objects
- `testVocs` - Array of VOC objects
- `createVocFormData` - Form data for VOC creation
- `testSimilarVocs` - Similar VOC data
- `statusLookupData` - Status lookup test cases
- `testFiles` - File upload test data
- `kanbanColumns` - Kanban board columns
- `pageResponseMock` - Paginated response mock

### `mock-factory.ts` ⭐ NEW
**Mock Factory Pattern** for creating test data with sensible defaults and optional overrides.

**Benefits:**
- Type-safe mock data creation
- Reusable across multiple test files
- Consistent test data structure
- Easy customization with partial overrides
- Reduces code duplication

## Mock Factory Pattern Usage

### Basic Usage

```typescript
import {
  createMockVoc,
  createMockDashboardStats,
  createMockApiResponse,
} from '../../fixtures';

test('should display VOC details', async ({ page }) => {
  // Create mock data with defaults
  const mockVoc = createMockVoc();

  // Mock API response
  await page.route('**/api/voc/1', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify(createMockApiResponse(mockVoc)),
    });
  });
});
```

### Customization with Overrides

```typescript
// Override specific fields
const urgentVoc = createMockVoc({
  priority: 'URGENT',
  status: 'IN_PROGRESS',
  title: '긴급 처리 필요',
});

// Override nested objects
const dashboardWithNoData = createMockDashboardStats({
  kpi: createMockKpiData({ totalVocs: 0 }),
  trend: [],
  categoryStats: [],
});
```

### Array Factories

```typescript
// Create multiple VOCs
const vocs = createMockVocs(5); // Creates 5 VOCs with different statuses

// Create category statistics
const categoryStats = createMockCategoryStatsArray(3); // Top 3 categories

// Create trend data for 30 days
const trendData = createMockTrendDataArray(30);
```

### API Response Wrappers

```typescript
// Wrap data in standard API response
const successResponse = createMockApiResponse(mockVoc, true);
const errorResponse = createMockApiResponse(null, false);

// Create paginated response
const pagedVocs = createMockPageResponse(
  createMockVocs(10), // content
  0,                   // page
  10,                  // size
  50                   // totalElements
);
```

## Available Factory Functions

### User & Auth
- `createMockUser(overrides?)` - Create user object
- `createMockAssignee(overrides?)` - Create assignee object
- `createMockUserInfo(overrides?)` - Create user info for auth
- `createMockAuthResponse(overrides?)` - Create login response

### Category
- `createMockCategory(overrides?)` - Create single category
- `createMockCategories(count)` - Create multiple categories

### VOC
- `createMockVoc(overrides?)` - Create single VOC
- `createMockVocs(count)` - Create multiple VOCs
- `createMockAttachment(overrides?)` - Create VOC attachment
- `createMockMemo(overrides?)` - Create VOC memo
- `createMockAiAnalysis(overrides?)` - Create AI analysis result
- `createMockSimilarVoc(overrides?)` - Create similar VOC

### Dashboard Statistics
- `createMockKpiData(overrides?)` - Create KPI data
- `createMockKpiChange(overrides?)` - Create KPI change data
- `createMockTrendData(overrides?)` - Create single trend point
- `createMockTrendDataArray(days)` - Create trend time series
- `createMockCategoryStats(overrides?)` - Create category stats
- `createMockCategoryStatsArray(count)` - Create multiple category stats
- `createMockStatusDistribution(overrides?)` - Create status distribution
- `createMockStatusDistributionArray()` - Create all status distributions
- `createMockDashboardStats(overrides?)` - Create complete dashboard data

### API Utilities
- `createMockApiResponse<T>(data, success)` - Wrap data in API response
- `createMockPageResponse<T>(content, page, size, totalElements)` - Create paginated response

## Migration Guide

### Before (Inline Mock Data)

```typescript
test('dashboard displays KPI cards', async ({ page }) => {
  await page.route('**/api/statistics/dashboard', async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          kpi: {
            totalVocs: 1250,
            avgResolutionTimeHours: 24.5,
            resolutionRate: 87.3,
            pendingVocs: 158,
            totalVocsChange: { value: 8.5, type: 'increase', count: 98 },
            avgResolutionTimeChange: { value: -12.3, type: 'decrease' },
            resolutionRateChange: { value: 2.1, type: 'increase' },
            pendingVocsChange: { value: 0, type: 'neutral', count: 0 },
          },
          trend: [
            { date: '2024-01-01', received: 45, resolved: 38, pending: 7 },
            // ... more data
          ],
          categoryStats: [
            { categoryId: 1, categoryName: '제품 문의', count: 450, percentage: 36.0 },
            // ... more data
          ],
          // ... more nested objects
        },
      }),
    });
  });
});
```

### After (Mock Factory Pattern)

```typescript
import { createMockDashboardStats, createMockApiResponse } from '../../fixtures';

test('dashboard displays KPI cards', async ({ page }) => {
  await page.route('**/api/statistics/dashboard', async (route) => {
    const mockData = createMockDashboardStats(); // Uses sensible defaults

    await route.fulfill({
      status: 200,
      body: JSON.stringify(createMockApiResponse(mockData)),
    });
  });
});
```

### Benefits
- **48 lines reduced to 8 lines** (83% reduction)
- Type-safe and autocomplete support
- Consistent data structure across tests
- Easy to customize specific fields
- Better test readability

## Example: Refactored Dashboard Test

```typescript
import { test, expect } from '@playwright/test';
import {
  createMockDashboardStats,
  createMockApiResponse,
} from '../../fixtures';

test.describe('대시보드 페이지', () => {
  const mockDashboardData = createMockDashboardStats();

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/statistics/dashboard**', async (route) => {
      const url = route.request().url();
      const period = new URL(url).searchParams.get('period') || '7days';

      let responseData = mockDashboardData;

      if (period === 'today') {
        responseData = createMockDashboardStats({
          kpi: { ...mockDashboardData.kpi, totalVocs: 50 },
        });
      }

      await route.fulfill({
        status: 200,
        body: JSON.stringify(createMockApiResponse(responseData)),
      });
    });

    await page.goto('/dashboard');
  });

  test('KPI 카드가 표시된다', async ({ page }) => {
    const totalVocValue = page
      .locator('[role="region"][aria-label*="총 접수"]')
      .first()
      .locator('p.text-3xl');

    await expect(totalVocValue).toHaveText(/1,250건/);
  });

  test('빈 데이터일 때 메시지가 표시된다', async ({ page }) => {
    await page.route('**/api/statistics/dashboard**', async (route) => {
      const emptyData = createMockDashboardStats({
        trend: [],
        categoryStats: [],
      });

      await route.fulfill({
        status: 200,
        body: JSON.stringify(createMockApiResponse(emptyData)),
      });
    });

    await page.reload();
    await expect(page.locator('text=데이터가 없습니다')).toBeVisible();
  });
});
```

## Best Practices

### 1. Use Factories for New Tests
Always use factory functions when creating new E2E tests.

```typescript
// Good ✅
const voc = createMockVoc({ priority: 'URGENT' });

// Bad ❌
const voc = {
  id: 1,
  ticketId: 'VOC-123',
  title: 'Test',
  // ... 20+ more fields
};
```

### 2. Override Only What You Need
Don't override the entire object, only specific fields.

```typescript
// Good ✅
const voc = createMockVoc({ status: 'RESOLVED' });

// Bad ❌
const voc = createMockVoc({
  id: 1,
  ticketId: 'VOC-123',
  title: 'Test',
  status: 'RESOLVED',
  // ... repeating all default values
});
```

### 3. Reuse Base Mock Data
Create base mock data once and reuse with overrides.

```typescript
test.describe('Dashboard tests', () => {
  const baseDashboard = createMockDashboardStats();

  test('scenario 1', async ({ page }) => {
    const customData = createMockDashboardStats({
      kpi: { ...baseDashboard.kpi, totalVocs: 100 },
    });
    // ... test code
  });
});
```

### 4. Combine Multiple Factories
Build complex data structures by combining factories.

```typescript
const voc = createMockVoc({
  category: createMockCategory({ name: '특별 카테고리' }),
  assignee: createMockAssignee({ name: '특별 담당자' }),
  memos: [
    createMockMemo({ content: '첫 번째 메모' }),
    createMockMemo({ content: '두 번째 메모', isInternal: true }),
  ],
});
```

## Testing Tips

### Mock Different Scenarios

```typescript
// Success scenario
const successData = createMockApiResponse(createMockVoc());

// Error scenario
const errorData = createMockApiResponse(null, false);

// Empty data scenario
const emptyData = createMockDashboardStats({
  trend: [],
  categoryStats: [],
  statusDistribution: [],
});

// Large dataset scenario
const largeDataset = createMockPageResponse(
  createMockVocs(100),
  0,
  20,
  500
);
```

### Test Edge Cases

```typescript
// Minimum values
const minVoc = createMockVoc({
  priority: 'LOW',
  status: 'RECEIVED',
  attachments: [],
  memos: [],
});

// Maximum values
const maxVoc = createMockVoc({
  priority: 'URGENT',
  status: 'IN_PROGRESS',
  attachments: Array.from({ length: 10 }, (_, i) =>
    createMockAttachment({ id: i + 1 })
  ),
});

// Null/undefined handling
const incompleteVoc = createMockVoc({
  category: undefined,
  assignee: undefined,
  customerPhone: undefined,
});
```

## Contributing

When adding new types or mock data:

1. Add factory function to `mock-factory.ts`
2. Export from `index.ts`
3. Update this README with usage examples
4. Refactor at least one existing test to use the new factory

## See Also

- [Playwright Documentation](https://playwright.dev)
- [Test Fixtures Pattern](https://playwright.dev/docs/test-fixtures)
- [Mock Service Worker](https://mswjs.io)
