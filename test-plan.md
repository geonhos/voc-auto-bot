# VOC Auto Bot - Comprehensive Test Plan

## 1. Overview

### 1.1 Project Information
- **Project**: VOC Auto Bot (Voice of Customer Automation System)
- **Architecture**: Multi-module Spring Boot backend + Next.js frontend
- **Backend**: Java 21, Spring Boot 3.2.2, Gradle multi-module
- **Frontend**: Next.js 14, TypeScript, React 18
- **Test Plan Version**: 1.0
- **Created**: 2026-01-25

### 1.2 Test Scope

#### In Scope
- Backend unit tests (JUnit 5)
- Backend integration tests (Testcontainers)
- Frontend unit tests (Jest + React Testing Library)
- Frontend E2E tests (Playwright)
- API contract testing
- Component integration testing
- User flow validation

#### Out of Scope
- Performance/Load testing (separate plan required)
- Security penetration testing
- Mobile app testing (web only)
- Legacy system integration (future scope)

### 1.3 Test Objectives
- Ensure 80% code coverage for backend modules
- Ensure 75% code coverage for frontend components
- Validate all critical user journeys via E2E tests
- Verify API contracts between frontend and backend
- Ensure parallel execution capability for CI/CD optimization

---

## 2. Test Strategy

### 2.1 Test Pyramid

```
        /\
       /  \    E2E Tests (12 test suites, ~5,938 LOC)
      /    \   - Playwright (Chromium, Firefox, WebKit)
     /------\  - Critical user flows
    /        \ Integration Tests (Testcontainers)
   /          \- OpenSearch, PostgreSQL, Redis
  /------------\
 /   Unit Tests \  Component/Service Tests
/________________\ - Jest (Frontend), JUnit 5 (Backend)
                   - Isolated logic validation
```

### 2.2 Testing Levels

| Level | Framework | Coverage Target | Execution Time | Priority |
|-------|-----------|----------------|----------------|----------|
| Unit Tests (Backend) | JUnit 5 + Mockito | 80% | ~30s | P0 |
| Unit Tests (Frontend) | Jest + RTL | 75% | ~15s | P0 |
| Integration Tests (Backend) | Testcontainers | 75% | ~2-3min | P1 |
| E2E Tests (Frontend) | Playwright | User flows | ~5-8min | P1 |
| Contract Tests | Playwright + API | 100% | ~1min | P0 |

### 2.3 Test Environment Requirements

#### Backend Requirements
- Java 21 JDK
- Docker (for Testcontainers)
- PostgreSQL container (testcontainers)
- OpenSearch container (testcontainers)
- Redis container (optional for integration tests)

#### Frontend Requirements
- Node.js 18+
- Chromium, Firefox, WebKit browsers (Playwright)
- Backend API running on localhost:8080 (for E2E)
- Frontend dev server on localhost:3000

---

## 3. Backend Test Plan

### 3.1 Module Structure

```
voc-auto-bot/backend/
├── voc-domain/         # Domain entities, value objects
├── voc-application/    # Use cases, services
├── voc-adapter/        # Controllers, repositories, external adapters
└── voc-bootstrap/      # Spring Boot application entry point
```

### 3.2 Backend Unit Tests

#### 3.2.1 voc-domain Module
**Coverage Target**: 85% (domain logic is critical)

| Test Suite | Test Count | Coverage Area | Priority | Exec Time |
|------------|-----------|---------------|----------|-----------|
| EmailLogTest | 8 | Email log entity validation | P0 | <1s |
| EmailTemplateTest | 6 | Template creation, variables | P0 | <1s |
| User entity tests | 12 | User roles, validation | P0 | <1s |
| VOC entity tests | 15 | VOC lifecycle, status | P0 | <1s |
| Category entity tests | 8 | Hierarchy, validation | P1 | <1s |

**Parallel Execution**: YES (all domain tests are independent)

**Test Pattern**:
```java
@ExtendWith(MockitoExtension.class)
class DomainEntityTest {
    // Pure domain logic, no external dependencies
    // Focus: Business rules, invariants, validation
}
```

#### 3.2.2 voc-application Module
**Coverage Target**: 80%

| Test Suite | Test Count | Coverage Area | Priority | Exec Time |
|------------|-----------|---------------|----------|-----------|
| UserServiceTest | 14 | User CRUD, password change | P0 | <1s |
| AnalyzeVocServiceTest | 10 | VOC analysis logic | P0 | <1s |
| EmailTemplateServiceTest | 8 | Template management | P1 | <1s |
| SendEmailServiceTest | 12 | Email sending logic | P1 | <1s |
| CreateTemplateServiceTest | 6 | Template creation | P2 | <1s |
| LogAnalysisServiceTest | 9 | Log analysis business logic | P1 | <1s |

**Parallel Execution**: YES (service tests use mocks)

**Test Pattern**:
```java
@ExtendWith(MockitoExtension.class)
class ServiceTest {
    @Mock private PortInterface port;
    @InjectMocks private Service service;

    // Focus: Use case orchestration, business logic
}
```

#### 3.2.3 voc-adapter Module
**Coverage Target**: 75%

| Test Suite | Test Count | Coverage Area | Priority | Exec Time |
|------------|-----------|---------------|----------|-----------|
| LogSearchMapperTest | 8 | OpenSearch mapping logic | P1 | <1s |
| OpenSearchAdapterTest | 12 | Search adapter (mocked) | P1 | <1s |
| OllamaAdapterTest | 10 | AI adapter (mocked) | P1 | <1s |
| EmbeddingServiceTest | 8 | Vector embedding | P1 | <1s |
| VectorSearchAdapterTest | 9 | Vector search logic | P1 | <1s |
| VectorEmbeddingEntityTest | 5 | Entity mapping | P2 | <1s |

**Parallel Execution**: YES (all use mocks or in-memory resources)

### 3.3 Backend Integration Tests

#### 3.3.1 Database Integration
**Coverage Target**: 75%
**Execution**: Sequential (shared database state)

| Test Suite | Test Count | Technology | Priority | Exec Time |
|------------|-----------|------------|----------|-----------|
| UserRepositoryTest | 12 | PostgreSQL + Testcontainers | P0 | 15s |
| VocRepositoryTest | 18 | PostgreSQL + Testcontainers | P0 | 20s |
| CategoryRepositoryTest | 10 | PostgreSQL + Testcontainers | P1 | 12s |
| EmailLogRepositoryTest | 8 | PostgreSQL + Testcontainers | P1 | 10s |

**Container Configuration**:
```yaml
PostgreSQL: 15-alpine
Memory: 512MB
Port: random (Testcontainers auto-assignment)
Parallel: NO (container resource constraints)
```

#### 3.3.2 OpenSearch Integration
**Coverage Target**: 70%

| Test Suite | Test Count | Technology | Priority | Exec Time |
|------------|-----------|------------|----------|-----------|
| OpenSearchAdapterIntegrationTest | 8 | OpenSearch + Testcontainers | P1 | 45s |

**Container Configuration**:
```yaml
OpenSearch: 2.11.0
Memory: 512MB
Discovery: single-node
Security: disabled (test only)
```

#### 3.3.3 Redis Integration
**Coverage Target**: 60%

| Test Suite | Test Count | Technology | Priority | Exec Time |
|------------|-----------|------------|----------|-----------|
| CacheServiceTest | 6 | Redis + Testcontainers | P2 | 10s |

### 3.4 Backend Test Execution Groups

#### Group 1: Fast Unit Tests (P0) - Parallel
```bash
# Execution Time: ~30s
# Modules: voc-domain, voc-application (unit only)
./gradlew :voc-domain:test :voc-application:test --parallel
```

#### Group 2: Adapter Unit Tests (P1) - Parallel
```bash
# Execution Time: ~15s
./gradlew :voc-adapter:test --tests "*Test" --parallel
```

#### Group 3: Integration Tests (P1) - Sequential
```bash
# Execution Time: ~2-3 minutes
./gradlew :voc-adapter:test --tests "*IntegrationTest"
./gradlew :voc-bootstrap:test
```

#### Group 4: Full Coverage Report
```bash
# Execution Time: ~3-4 minutes
./gradlew clean build jacocoRootReport
```

---

## 4. Frontend Test Plan

### 4.1 Frontend Unit Tests (Jest + React Testing Library)

#### 4.1.1 Component Tests
**Coverage Target**: 75%

| Component Category | Test Suites | Test Count | Priority | Exec Time |
|-------------------|-------------|-----------|----------|-----------|
| Dashboard Components | 3 | 18 | P0 | 3s |
| - KpiCard.test.tsx | 1 | 6 | P0 | 1s |
| - PriorityChart.test.tsx | 1 | 7 | P0 | 1s |
| - RecentVocList.test.tsx | 1 | 5 | P0 | 1s |
| VOC Components | 2 | 12 | P0 | 2s |
| - SimilarVocCard.test.tsx | 1 | 6 | P0 | 1s |
| - VocStatusTimeline.test.tsx | 1 | 6 | P0 | 1s |

**Parallel Execution**: YES (Jest runs tests in parallel by default)

**Test Pattern**:
```typescript
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<Component {...props} />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);
    await user.click(screen.getByRole('button'));
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

#### 4.1.2 Hook Tests
**Coverage Target**: 80%

| Hook Test Suite | Test Count | Coverage Area | Priority | Exec Time |
|----------------|-----------|---------------|----------|-----------|
| useStatistics.test.ts | 5 | Dashboard data fetching | P0 | 1s |
| useSimilarVocs.test.ts | 7 | Similar VOC fetching | P0 | 1s |
| useVocStatus.test.ts | 6 | Status lookup logic | P0 | 1s |

**Parallel Execution**: YES

**Test Pattern**:
```typescript
describe('useHookName', () => {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('fetches data successfully', async () => {
    const { result } = renderHook(() => useHook(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

#### 4.1.3 Frontend Unit Test Execution

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode (development)
npm run test:watch
```

**Expected Coverage**:
- Statements: 75%+
- Branches: 70%+
- Functions: 75%+
- Lines: 75%+

### 4.2 Frontend E2E Tests (Playwright)

#### 4.2.1 Test Organization

```
e2e/
├── auth/           # Authentication tests (SC-01)
├── voc/            # VOC feature tests (SC-02 to SC-07)
├── admin/          # Admin feature tests
├── dashboard/      # Dashboard tests
├── email/          # Email template tests
├── fixtures/       # Test data
├── page-objects/   # Page Object Models
└── setup/          # Authentication setup
```

#### 4.2.2 E2E Test Suites

##### SC-01: Authentication (auth/login.spec.ts)
**Priority**: P0
**Test Count**: 12
**Execution Time**: ~45s
**Browser Support**: Chromium (unauthenticated)

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Login success flow | Happy path | P0 |
| Login with invalid password | Negative | P0 |
| Login with non-existent user | Negative | P0 |
| Form validation (required fields) | Validation | P0 |
| Password visibility toggle | UI interaction | P1 |
| Loading states | UI state | P1 |
| Logout flow | Session management | P0 |
| Token expiration handling | Edge case | P1 |
| Token refresh | Session management | P1 |
| Protected route access | Authorization | P0 |
| Redirect after login | Navigation | P1 |
| Accessibility (ARIA labels) | A11y | P2 |

##### SC-02: VOC Input Form (voc/voc-input.spec.ts)
**Priority**: P0
**Test Count**: 14
**Execution Time**: ~35s
**Browser Support**: Chromium, Firefox, WebKit

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Form rendering with all fields | UI rendering | P0 |
| Required field validation | Validation | P0 |
| Field length validation | Validation | P0 |
| VOC creation with complete data | Happy path | P0 |
| VOC creation with minimal data | Boundary | P1 |
| Category selection from API | Integration | P0 |
| File upload (single/multiple) | File handling | P1 |
| File size validation (max 10MB) | Validation | P1 |
| File type validation | Validation | P1 |
| File removal | UI interaction | P2 |
| Form reset functionality | UI state | P2 |
| Success modal display | UI feedback | P1 |
| Error handling | Error cases | P1 |
| Accessibility | A11y | P2 |

##### SC-03: VOC Status Lookup (voc/voc-status.spec.ts)
**Priority**: P0
**Test Count**: 11
**Execution Time**: ~30s
**Browser Support**: Chromium (public page, no auth)

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Public page access (no auth) | Public access | P0 |
| Form validation (ticket ID, email) | Validation | P0 |
| Successful status lookup | Happy path | P0 |
| Status badge display | UI rendering | P1 |
| VOC title display | UI rendering | P1 |
| Error handling (invalid ticket) | Negative | P1 |
| Server error handling | Error cases | P1 |
| Status timeline display | UI rendering | P1 |
| Multiple timeline items | Data display | P2 |
| Timeline chronological order | Data logic | P2 |
| Accessibility | A11y | P2 |

##### SC-04: VOC Kanban Board (voc/voc-kanban.spec.ts)
**Priority**: P1
**Test Count**: 17
**Execution Time**: ~55s
**Browser Support**: Chromium (drag-drop complex)

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Board rendering with columns | UI rendering | P0 |
| Card display in correct columns | Data display | P0 |
| Card information display | UI rendering | P0 |
| Drag and drop between columns | User interaction | P0 |
| Status update via drag-drop | Integration | P0 |
| Drag revert on API error | Error handling | P1 |
| Card click navigation | Navigation | P1 |
| Card count display | UI state | P1 |
| Filtering by search query | Filter logic | P1 |
| Filtering by priority | Filter logic | P1 |
| Filtering by category | Filter logic | P1 |
| Combined filters | Complex filter | P2 |
| Empty state display | UI state | P2 |
| Real-time updates | State management | P1 |

##### SC-05: VOC Table View (voc/voc-table.spec.ts)
**Priority**: P1
**Test Count**: 21
**Execution Time**: ~60s
**Browser Support**: Chromium, Firefox

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Table rendering | UI rendering | P0 |
| Loading state display | UI state | P1 |
| Empty state display | UI state | P1 |
| Column sorting (asc/desc) | Sorting logic | P0 |
| Sort direction toggle | UI interaction | P1 |
| Search filtering | Filter logic | P0 |
| Status filtering | Filter logic | P0 |
| Priority filtering | Filter logic | P1 |
| Category filtering | Filter logic | P1 |
| Date range filtering | Filter logic | P1 |
| Filter reset | UI state | P1 |
| Pagination info display | UI rendering | P1 |
| Page size change (10, 20, 50) | Pagination | P1 |
| Next/previous page navigation | Pagination | P0 |
| Pagination button states | UI state | P2 |
| Individual row selection | Selection logic | P2 |
| Select all rows | Selection logic | P2 |
| Deselect all rows | Selection logic | P2 |
| Row click navigation | Navigation | P1 |
| Row hover highlighting | UI interaction | P2 |
| Accessibility | A11y | P2 |

##### SC-06: VOC Detail Page (voc/voc-detail.spec.ts)
**Priority**: P0
**Test Count**: 17
**Execution Time**: ~65s
**Browser Support**: Chromium, Firefox, WebKit

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Detail information display | UI rendering | P0 |
| Customer information display | UI rendering | P0 |
| Category display | UI rendering | P1 |
| Content display | UI rendering | P0 |
| Status change with dropdown | User interaction | P0 |
| Status change with note | Integration | P0 |
| Status change error handling | Error cases | P1 |
| Assignee assignment | User interaction | P0 |
| Current assignee display | UI rendering | P1 |
| Memo addition (public/internal) | User interaction | P1 |
| Memo list display | UI rendering | P1 |
| Memo deletion | User interaction | P2 |
| Attachments list display | UI rendering | P1 |
| Attachment download | File handling | P2 |
| Similar VOC modal opening | Navigation | P1 |
| 404 error handling | Error cases | P1 |
| Server error handling | Error cases | P1 |

##### SC-07: Similar VOC Feature (voc/similar-voc.spec.ts)
**Priority**: P1
**Test Count**: 18
**Execution Time**: ~60s
**Browser Support**: Chromium, Firefox

| Test Case | Coverage | Priority |
|-----------|----------|----------|
| Modal opening via button | UI interaction | P0 |
| Modal closing (button/ESC) | UI interaction | P0 |
| Similar VOC list display | Data display | P0 |
| Card information display | UI rendering | P0 |
| Empty state (no similar VOCs) | UI state | P1 |
| Loading state during fetch | UI state | P1 |
| Similarity percentage display | UI rendering | P1 |
| Similarity score threshold | Data logic | P1 |
| Similarity sorting (desc) | Sorting logic | P1 |
| High similarity highlighting | UI rendering | P1 |
| Status badge display | UI rendering | P1 |
| Different badge colors | UI rendering | P2 |
| Navigation to similar VOC | Navigation | P1 |
| Navigation by ticket ID | Navigation | P1 |
| Same tab navigation | Navigation | P2 |
| API error handling | Error cases | P1 |
| Network timeout handling | Error cases | P1 |
| Accessibility | A11y | P2 |

##### Additional E2E Suites

**Admin Tests** (admin/category.spec.ts, admin/user.spec.ts)
- Priority: P1
- Test Count: 25+ combined
- Execution Time: ~90s

**Dashboard Tests** (dashboard/dashboard.spec.ts)
- Priority: P0
- Test Count: 15+
- Execution Time: ~45s

**Email Tests** (email/email.spec.ts)
- Priority: P2
- Test Count: 10+
- Execution Time: ~35s

#### 4.2.3 E2E Test Execution Strategy

##### Parallel Execution Groups

**Group 1: Authentication (Sequential)**
```bash
# Must run first, creates auth state
npm run test:e2e:auth
# Time: ~45s
```

**Group 2: Critical User Flows (Parallel - Chromium only)**
```bash
# Run in parallel on Chromium for speed
npm run test:e2e:chromium -- e2e/voc/voc-input.spec.ts \
                              e2e/voc/voc-detail.spec.ts \
                              e2e/voc/voc-status.spec.ts \
                              e2e/dashboard/dashboard.spec.ts
# Time: ~90s (parallelized)
```

**Group 3: Complex Interactions (Sequential - Chromium)**
```bash
# Drag-drop tests, run sequentially
npm run test:e2e:chromium -- e2e/voc/voc-kanban.spec.ts
# Time: ~55s
```

**Group 4: Cross-Browser Tests (Parallel across browsers)**
```bash
# Run key tests on all browsers
npm run test:e2e -- e2e/voc/voc-table.spec.ts \
                    e2e/voc/similar-voc.spec.ts
# Time: ~120s (3 browsers in parallel)
```

**Group 5: Admin & Low-Priority (Parallel)**
```bash
npm run test:e2e:chromium -- e2e/admin/ e2e/email/
# Time: ~120s
```

##### CI/CD Execution Plan

```yaml
# .github/workflows/e2e-tests.yml structure
jobs:
  e2e-critical:
    # Fast feedback on critical paths
    runs-on: ubuntu-latest
    steps:
      - Run Group 1 (auth setup)
      - Run Group 2 (critical flows)
    timeout: 5 minutes

  e2e-full:
    # Full test suite
    runs-on: ubuntu-latest
    steps:
      - Run all groups sequentially
    timeout: 10 minutes
```

---

## 5. Test Execution Matrix

### 5.1 Local Development

| Stage | Command | Execution | Time | Priority |
|-------|---------|-----------|------|----------|
| Pre-commit | `npm run test` (frontend) | Parallel | 15s | P0 |
| Pre-commit | `./gradlew :voc-domain:test :voc-application:test` | Parallel | 30s | P0 |
| Pre-push | `./gradlew test` (all backend) | Mixed | 3min | P1 |
| Pre-push | `npm run test:e2e:chromium -- e2e/auth e2e/voc/voc-input.spec.ts` | Sequential | 90s | P1 |
| Full suite | `./gradlew clean build jacocoRootReport` | Mixed | 4min | P2 |
| Full E2E | `npm run test:e2e` | Parallel | 8min | P2 |

### 5.2 CI/CD Pipeline

#### Pull Request Checks
```yaml
name: PR Tests
on: pull_request

jobs:
  backend-unit:
    runs-on: ubuntu-latest
    timeout: 5 minutes
    steps:
      - Checkout
      - Setup Java 21
      - Cache Gradle dependencies
      - Run: ./gradlew :voc-domain:test :voc-application:test --parallel
      - Upload coverage report

  frontend-unit:
    runs-on: ubuntu-latest
    timeout: 5 minutes
    steps:
      - Checkout
      - Setup Node 18
      - Cache npm dependencies
      - Run: npm run test:coverage
      - Upload coverage report

  backend-integration:
    runs-on: ubuntu-latest
    timeout: 10 minutes
    steps:
      - Checkout
      - Setup Java 21 + Docker
      - Run: ./gradlew :voc-adapter:test --tests "*IntegrationTest"

  e2e-critical:
    runs-on: ubuntu-latest
    timeout: 10 minutes
    steps:
      - Checkout
      - Setup Node 18
      - Install Playwright browsers
      - Start backend (Docker Compose)
      - Run: npm run test:e2e:chromium -- e2e/auth e2e/voc/voc-input.spec.ts e2e/voc/voc-detail.spec.ts
      - Upload artifacts (videos, traces)
```

#### Nightly Full Suite
```yaml
name: Nightly Full Test Suite
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM daily

jobs:
  backend-full:
    runs-on: ubuntu-latest
    timeout: 15 minutes
    steps:
      - Run: ./gradlew clean build jacocoRootReport
      - Enforce coverage thresholds (80%)
      - Upload reports to SonarQube

  frontend-full:
    runs-on: ubuntu-latest
    timeout: 15 minutes
    steps:
      - Run: npm run test:coverage
      - Enforce coverage thresholds (75%)
      - Upload reports to SonarQube

  e2e-full:
    runs-on: ubuntu-latest
    timeout: 20 minutes
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - Run: npm run test:e2e:${{ matrix.browser }}
      - Upload HTML report
      - Notify on failure
```

### 5.3 Execution Time Summary

| Test Category | Unit | Integration | E2E | Total |
|--------------|------|-------------|-----|-------|
| Backend | 30s | 2-3min | - | ~3min 30s |
| Frontend | 15s | - | 5-8min | ~8min 15s |
| **Combined** | **45s** | **2-3min** | **5-8min** | **~12min** |

**Optimization Strategies**:
- Run unit tests in parallel (saves ~50% time)
- Share Testcontainers across integration tests
- Cache Playwright browsers in CI
- Use Playwright sharding for E2E tests (`--shard 1/4`)

---

## 6. Test Data Management

### 6.1 Backend Test Data

#### Domain Test Data
```java
// TestFixtures.java
public class TestFixtures {
    public static User createTestUser() {
        return User.builder()
            .email("test@example.com")
            .password("encodedPassword")
            .name("Test User")
            .role(UserRole.AGENT)
            .active(true)
            .build();
    }

    public static Voc createTestVoc() {
        return Voc.builder()
            .ticketId("VOC-2024-0001")
            .title("Test VOC")
            .content("Test content")
            .status(VocStatus.RECEIVED)
            .priority(VocPriority.MEDIUM)
            .build();
    }
}
```

#### Integration Test Data
```sql
-- test/resources/test-data.sql
INSERT INTO users (email, password, name, role, active)
VALUES ('admin@test.com', '$2a$10$...', 'Admin', 'ADMIN', true);

INSERT INTO categories (name, code, parent_id)
VALUES ('Billing', 'BILLING', NULL);
```

### 6.2 Frontend Test Data

#### Component Test Data (MSW)
```typescript
// src/mocks/handlers.ts
export const handlers = [
  http.get('/api/statistics/dashboard', () => {
    return HttpResponse.json({
      success: true,
      data: mockDashboardData,
    });
  }),

  http.post('/api/vocs', () => {
    return HttpResponse.json({
      success: true,
      data: { ticketId: 'VOC-2024-0001' },
    });
  }),
];
```

#### E2E Test Data
```typescript
// e2e/fixtures/voc-data.ts
export const testVocData = {
  valid: {
    title: 'E2E Test VOC',
    content: 'This is test content',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    categoryId: 1,
    priority: 'MEDIUM',
  },
  minimal: {
    title: 'Minimal VOC',
    content: 'Minimal content',
  },
};
```

### 6.3 Test Data Lifecycle

| Stage | Approach | Cleanup |
|-------|----------|---------|
| Unit Tests | In-memory mocks | Automatic (per test) |
| Integration Tests | Testcontainers (isolated DB) | Container teardown |
| E2E Tests | Database seeding + reset | After each test |

---

## 7. Risk Matrix

| Risk | Probability | Impact | Mitigation | Priority |
|------|------------|--------|------------|----------|
| Testcontainers timeout in CI | Medium | High | Increase timeout, cache images | P0 |
| E2E tests flaky (timing issues) | High | Medium | Use Playwright auto-wait, explicit waits | P0 |
| OpenSearch integration slow | Medium | Medium | Use smaller dataset, optimize queries | P1 |
| Browser compatibility issues | Low | High | Run cross-browser tests nightly | P1 |
| Test data pollution | Medium | Medium | Isolate test data, use transactions | P1 |
| Coverage threshold not met | Low | High | Monitor coverage in PR checks | P0 |
| Parallel test conflicts | Low | Medium | Ensure test isolation, avoid shared state | P1 |
| Docker resource exhaustion | Medium | High | Limit concurrent containers, cleanup | P0 |

---

## 8. Test Reporting

### 8.1 Coverage Reports

#### Backend (JaCoCo)
```bash
# Generate coverage report
./gradlew jacocoRootReport

# Report location
build/reports/jacoco/jacocoRootReport/html/index.html
```

**Thresholds**:
- Domain: 85%
- Application: 80%
- Adapter: 75%
- Overall: 80%

#### Frontend (Jest)
```bash
# Generate coverage report
npm run test:coverage

# Report location
coverage/lcov-report/index.html
```

**Thresholds**:
- Statements: 75%
- Branches: 70%
- Functions: 75%
- Lines: 75%

### 8.2 E2E Reports

#### Playwright HTML Report
```bash
# View report
npm run test:e2e:report

# Report includes:
# - Test results (pass/fail/skip)
# - Screenshots on failure
# - Video recordings
# - Trace files (on retry)
```

### 8.3 CI/CD Report Integration

```yaml
# Upload to SonarQube
- name: SonarQube Analysis
  run: |
    sonar-scanner \
      -Dsonar.projectKey=voc-auto-bot \
      -Dsonar.coverage.jacoco.xmlReportPaths=build/reports/jacoco/jacocoRootReport/jacocoRootReport.xml \
      -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info

# Publish test results
- name: Publish Test Results
  uses: EnricoMi/publish-unit-test-result-action@v2
  with:
    files: |
      build/test-results/**/*.xml
      test-results/junit.xml
```

---

## 9. Test Maintenance

### 9.1 Test Review Checklist

```markdown
- [ ] Test name clearly describes what it tests
- [ ] Test follows AAA pattern (Arrange, Act, Assert)
- [ ] Test is isolated (no dependencies on other tests)
- [ ] Test cleans up resources (files, containers, state)
- [ ] Test has appropriate timeout settings
- [ ] Test uses semantic selectors (Playwright)
- [ ] Test mocks external dependencies appropriately
- [ ] Test data is realistic and representative
- [ ] Test covers edge cases and error scenarios
- [ ] Test assertions are specific and meaningful
```

### 9.2 Refactoring Guidelines

**When to refactor tests**:
1. Test fails due to UI changes (update selectors)
2. Test is slow (>5s unit test, >60s E2E test)
3. Test is flaky (intermittent failures)
4. Test duplicates coverage (consolidate)
5. Test uses deprecated APIs (update)

**Refactoring process**:
1. Ensure test currently passes
2. Make incremental changes
3. Verify test still passes
4. Update documentation
5. Review with team

### 9.3 Test Debt Tracking

| Issue | Impact | Effort | Priority | Owner |
|-------|--------|--------|----------|-------|
| Add category hierarchy integration tests | Medium | 2 days | P1 | Backend team |
| Improve E2E test performance (sharding) | High | 1 day | P0 | Frontend team |
| Add visual regression tests (Percy) | Low | 3 days | P2 | QA |
| Implement contract tests (Pact) | Medium | 3 days | P1 | Full-stack |
| Add performance tests (k6) | Medium | 4 days | P2 | DevOps |

---

## 10. Appendix

### 10.1 Tool Versions

| Tool | Version | Purpose |
|------|---------|---------|
| JUnit Jupiter | 5.x | Backend unit testing |
| Mockito | 5.x | Backend mocking |
| AssertJ | 3.x | Backend assertions |
| Testcontainers | 1.19.x | Backend integration testing |
| Jest | 29.x | Frontend unit testing |
| React Testing Library | 14.x | Frontend component testing |
| Playwright | 1.41.x | Frontend E2E testing |
| MSW | 2.x | Frontend API mocking |

### 10.2 Test Command Reference

#### Backend
```bash
# Run all tests
./gradlew test

# Run specific module
./gradlew :voc-domain:test

# Run specific test class
./gradlew :voc-application:test --tests UserServiceTest

# Run with coverage
./gradlew test jacocoTestReport

# Run integration tests only
./gradlew test --tests "*IntegrationTest"

# Run in parallel
./gradlew test --parallel --max-workers=4

# Clean and test
./gradlew clean test
```

#### Frontend
```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm run test -- KpiCard.test.tsx

# Update snapshots
npm run test -- -u

# Run E2E tests
npm run test:e2e

# Run E2E in headed mode
npm run test:e2e:headed

# Run E2E in UI mode
npm run test:e2e:ui

# Run E2E in debug mode
npm run test:e2e:debug

# Run specific E2E suite
npm run test:e2e -- e2e/auth/login.spec.ts

# Run on specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# View E2E report
npm run test:e2e:report
```

### 10.3 Continuous Improvement

**Quarterly Test Review**:
1. Review test coverage trends
2. Identify flaky tests and fix
3. Update test data for realism
4. Refactor slow tests
5. Add tests for bug fixes
6. Update test documentation

**Metrics to Track**:
- Test execution time (trend over time)
- Test flakiness rate (failures/total runs)
- Coverage percentage (per module)
- Mean time to fix broken tests
- Test maintenance effort (hours/sprint)

### 10.4 Resources

- **JUnit 5 Documentation**: https://junit.org/junit5/docs/current/user-guide/
- **Playwright Best Practices**: https://playwright.dev/docs/best-practices
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Testcontainers Guide**: https://www.testcontainers.org/
- **Spring Boot Testing**: https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.testing

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | QA Test Planner Agent | Initial comprehensive test plan |

**Next Review Date**: 2026-04-25 (Quarterly review)

**Approvals**:
- [ ] Backend Lead
- [ ] Frontend Lead
- [ ] QA Lead
- [ ] DevOps Lead
