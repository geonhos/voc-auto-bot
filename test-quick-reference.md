# VOC Auto Bot - Test Quick Reference Card

## One-Page Cheat Sheet for Daily Testing

---

## 🚀 Common Commands

### Backend

```bash
# Pre-commit (30s)
./gradlew :voc-domain:test :voc-application:test --parallel

# Full unit tests (60s)
./gradlew test --tests "*Test" --parallel

# Integration tests (3min)
./gradlew test --tests "*IntegrationTest"

# Full suite with coverage (4min)
./gradlew clean build jacocoRootReport

# Run specific test
./gradlew :voc-application:test --tests UserServiceTest

# View coverage report
open build/reports/jacoco/jacocoRootReport/html/index.html
```

### Frontend

```bash
# Pre-commit (15s)
npm run test

# With coverage (15s)
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test
npm run test -- KpiCard.test.tsx

# E2E auth setup (45s) - RUN FIRST
npm run test:e2e:auth

# E2E critical flows (90s)
npm run test:e2e:chromium -- e2e/voc/voc-input.spec.ts e2e/voc/voc-detail.spec.ts

# Full E2E suite (6.5min)
npm run test:e2e:chromium

# Cross-browser (20min)
npm run test:e2e

# E2E with UI (debug)
npm run test:e2e:ui

# View E2E report
npm run test:e2e:report
```

---

## 📊 Test Coverage Targets

| Module | Target | Priority |
|--------|--------|----------|
| Backend Overall | 80% | P0 |
| voc-domain | 85% | P0 |
| voc-application | 80% | P0 |
| voc-adapter | 75% | P1 |
| Frontend Overall | 75% | P0 |
| Components | 75% | P0 |
| Hooks | 80% | P0 |

---

## ⚡ Fast Execution Paths

### Before Commit (45s)
```bash
# Terminal 1
./gradlew :voc-domain:test :voc-application:test --parallel

# Terminal 2 (parallel)
npm run test
```

### Before Push (5min)
```bash
# Step 1: Backend unit tests
./gradlew test --tests "*Test" --parallel

# Step 2: Frontend unit tests
npm run test:coverage

# Step 3: E2E critical
npm run test:e2e:auth && \
npm run test:e2e:chromium -- e2e/voc/voc-input.spec.ts e2e/voc/voc-detail.spec.ts
```

---

## 🧪 Test Types

### Backend

| Type | Framework | Example |
|------|-----------|---------|
| Unit | JUnit 5 + Mockito | `UserServiceTest.java` |
| Integration | Testcontainers | `OpenSearchAdapterIntegrationTest.java` |
| Coverage | JaCoCo | `jacocoTestReport` |

### Frontend

| Type | Framework | Example |
|------|-----------|---------|
| Unit | Jest + RTL | `KpiCard.test.tsx` |
| Hook | @testing-library/react | `useStatistics.test.ts` |
| E2E | Playwright | `voc-input.spec.ts` |
| Mocking | MSW | `handlers.ts` |

---

## 🔍 Finding Tests

### Backend
```bash
# List all test classes
find backend -name "*Test.java" -type f

# Find integration tests
find backend -name "*IntegrationTest.java" -type f

# Count tests
find backend -name "*Test.java" | wc -l
```

### Frontend
```bash
# List unit tests
find frontend/src -name "*.test.tsx" -o -name "*.test.ts"

# List E2E tests
find frontend/e2e -name "*.spec.ts"

# Count tests
find frontend -name "*.test.*" -o -name "*.spec.ts" | wc -l
```

---

## 🐛 Debugging

### Backend Test Failures

```bash
# Run in debug mode (IntelliJ)
Right-click test → Debug 'TestName'

# Increase logging
# Add to test class:
@Slf4j
@TestInstance(TestInstance.Lifecycle.PER_CLASS)

# Check Docker containers (for integration tests)
docker ps
docker logs <container_id>
```

### Frontend Test Failures

```bash
# Run single test with watch
npm run test:watch -- KpiCard.test.tsx

# Debug in VS Code
# Set breakpoint → Run in Debug mode

# E2E debug (headed mode with slowMo)
npm run test:e2e:debug

# View E2E trace
npx playwright show-trace test-results/.../trace.zip
```

---

## 📁 Test File Locations

### Backend
```
backend/
├── voc-domain/src/test/java/.../domain/
│   ├── EmailLogTest.java
│   └── EmailTemplateTest.java
├── voc-application/src/test/java/.../application/
│   ├── UserServiceTest.java
│   ├── AnalyzeVocServiceTest.java
│   └── EmailTemplateServiceTest.java
└── voc-adapter/src/test/java/.../adapter/
    ├── OpenSearchAdapterTest.java
    └── OpenSearchAdapterIntegrationTest.java
```

### Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/__tests__/
│   │   │   ├── KpiCard.test.tsx
│   │   │   ├── PriorityChart.test.tsx
│   │   │   └── RecentVocList.test.tsx
│   │   └── voc/__tests__/
│   │       ├── SimilarVocCard.test.tsx
│   │       └── VocStatusTimeline.test.tsx
│   └── hooks/__tests__/
│       ├── useStatistics.test.ts
│       ├── useSimilarVocs.test.ts
│       └── useVocStatus.test.ts
└── e2e/
    ├── auth/login.spec.ts
    ├── voc/
    │   ├── voc-input.spec.ts
    │   ├── voc-detail.spec.ts
    │   ├── voc-table.spec.ts
    │   ├── voc-kanban.spec.ts
    │   ├── voc-status.spec.ts
    │   └── similar-voc.spec.ts
    ├── admin/
    │   ├── category.spec.ts
    │   └── user.spec.ts
    └── dashboard/dashboard.spec.ts
```

---

## 🎯 Priority Guide

### P0 (Must Pass) - ~2 minutes
```bash
# Backend
./gradlew :voc-domain:test :voc-application:test --parallel

# Frontend
npm run test

# E2E Critical (if touching UI)
npm run test:e2e:auth
npm run test:e2e:chromium -- e2e/voc/voc-input.spec.ts
```

### P1 (Should Pass) - ~5 minutes
```bash
# All unit tests
./gradlew test --tests "*Test" --parallel
npm run test:coverage

# Key E2E flows
npm run test:e2e:chromium -- e2e/voc/
```

### P2 (Nice to Pass) - ~12 minutes
```bash
# Full suite
./gradlew clean build jacocoRootReport
npm run test:e2e
```

---

## 🔧 Environment Setup

### First Time Setup

```bash
# Backend
cd backend
./gradlew build
# Installs dependencies automatically

# Frontend
cd frontend
npm install
npx playwright install

# E2E tests require backend running
# Option 1: Docker Compose (recommended)
docker-compose up -d

# Option 2: Local backend
cd backend && ./gradlew bootRun
```

### Environment Variables

```bash
# Frontend (.env.test)
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=admin123
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Backend (application-test.yml)
spring.datasource.url=jdbc:h2:mem:testdb
spring.jpa.hibernate.ddl-auto=create-drop
```

---

## 🚨 Common Issues

### Issue: Testcontainers timeout
```bash
# Solution: Increase Docker memory
# Docker Desktop → Settings → Resources → Memory: 4GB+

# Or increase timeout in test
@Container
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
    .withStartupTimeout(Duration.ofMinutes(2));
```

### Issue: E2E tests flaky
```bash
# Solution: Use Playwright auto-wait
await page.getByRole('button').click();
# NOT: await page.click('button'); (deprecated)

# Add explicit waits if needed
await page.waitForURL(/\/dashboard/);
await page.waitForLoadState('networkidle');
```

### Issue: Port already in use (E2E)
```bash
# Find process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
```

### Issue: Coverage below threshold
```bash
# Check uncovered lines
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html

# Focus on critical paths first (domain, services)
```

---

## 📈 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with: { java-version: '21' }
      - run: ./gradlew test --parallel
      - run: ./gradlew jacocoTestReport
      - uses: codecov/codecov-action@v3

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: docker-compose up -d
      - run: npm run test:e2e:chromium
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Test Naming Conventions

### Backend (JUnit 5)
```java
@Test
@DisplayName("사용자 생성 성공")
void createUser_shouldSucceed() { }

@Test
@DisplayName("중복 이메일로 사용자 생성 시 예외 발생")
void createUser_withDuplicateEmail_shouldThrowException() { }
```

### Frontend (Jest)
```typescript
describe('KpiCard', () => {
  it('renders title and value correctly', () => { });

  it('displays increase change correctly', () => { });
});
```

### E2E (Playwright)
```typescript
test.describe('VOC Input Form', () => {
  test('should create VOC with valid data', async ({ page }) => { });

  test('should show validation error for required fields', async ({ page }) => { });
});
```

---

## 🎨 Test Patterns

### Backend Service Test Pattern
```java
@ExtendWith(MockitoExtension.class)
class ServiceTest {
    @Mock private PortInterface port;
    @InjectMocks private Service service;

    @Test
    void testCase_shouldSucceed() {
        // Arrange
        when(port.method()).thenReturn(value);

        // Act
        Result result = service.execute(command);

        // Assert
        assertThat(result).isNotNull();
        verify(port).method();
    }
}
```

### Frontend Component Test Pattern
```typescript
describe('Component', () => {
  it('handles user interaction', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Component />);

    // Act
    await user.click(screen.getByRole('button'));

    // Assert
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### E2E Test Pattern
```typescript
test('user flow', async ({ page }) => {
  // Arrange
  await page.goto('/page');

  // Act
  await page.getByLabel('Field').fill('value');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Assert
  await expect(page).toHaveURL(/\/success/);
  await expect(page.getByText('Success')).toBeVisible();
});
```

---

## 🔗 Useful Links

- **Test Plan**: `/test-plan.md` (comprehensive strategy)
- **Test Matrix**: `/test-matrix.md` (parallel execution groups)
- **Execution Summary**: `/test-execution-summary.md` (visual guide)
- **Backend Coverage**: `backend/build/reports/jacoco/jacocoRootReport/html/index.html`
- **Frontend Coverage**: `frontend/coverage/lcov-report/index.html`
- **E2E Report**: `frontend/playwright-report/index.html`

---

## 💡 Tips & Tricks

### Speed Up Tests

```bash
# Backend: Use Gradle daemon
./gradlew --daemon test

# Backend: Parallel test execution
./gradlew test --parallel --max-workers=4

# Frontend: Run specific test file
npm run test -- --testPathPattern=KpiCard

# E2E: Use headed mode only for debugging
npm run test:e2e:headed (slower, use sparingly)

# E2E: Shard tests for parallel execution
npm run test:e2e -- --shard=1/4
```

### Writing Better Tests

```bash
# ✅ Good: Specific assertions
expect(user.getEmail()).isEqualTo("test@example.com");

# ❌ Bad: Generic assertions
assertTrue(user != null);

# ✅ Good: Use semantic selectors (E2E)
await page.getByRole('button', { name: '제출' }).click();

# ❌ Bad: Use CSS selectors
await page.click('.btn-submit');

# ✅ Good: Test behavior, not implementation
expect(screen.getByText('Success')).toBeVisible();

# ❌ Bad: Test internal state
expect(component.state.isSuccess).toBe(true);
```

### Managing Test Data

```bash
# Backend: Use test fixtures
User user = TestFixtures.createTestUser();

# Frontend: Use MSW for API mocking
http.get('/api/vocs', () => HttpResponse.json({ data: [] }))

# E2E: Use page object pattern
const vocInputPage = new VocInputPage(page);
await vocInputPage.fillForm(testData);
```

---

## 📞 Support

**Issues with tests?**
1. Check this quick reference first
2. Review test-plan.md for detailed strategy
3. Check test-matrix.md for parallel execution
4. Consult team leads for architectural questions

**Coverage not meeting threshold?**
1. Run coverage report: `./gradlew jacocoTestReport` or `npm run test:coverage`
2. Identify uncovered lines
3. Add tests for critical paths first (domain logic, services)
4. Aim for meaningful coverage, not just numbers

**Flaky tests?**
1. E2E: Use Playwright auto-wait, avoid fixed timeouts
2. Integration: Check container startup times
3. Unit: Ensure test isolation (no shared state)
4. Add retries for known flaky tests (use sparingly)

---

**Version**: 1.0 | **Updated**: 2026-01-25 | **Owner**: QA Team
