# VOC Auto Bot - Test Execution Matrix

## Quick Reference Guide

### Parallel Execution Groups

This document provides a quick reference for running tests in parallel to optimize execution time.

---

## 1. Backend Test Groups

### Group A: Domain Tests (Parallel) - P0
**Execution Time**: ~8-10s
**Coverage**: Domain entities, value objects, business rules

```bash
./gradlew :voc-domain:test --parallel
```

**Test Classes**:
- `EmailLogTest` (8 tests)
- `EmailTemplateTest` (6 tests)
- User entity tests (12 tests)
- VOC entity tests (15 tests)
- Category entity tests (8 tests)

**Dependency**: None (can run independently)

---

### Group B: Application Services (Parallel) - P0
**Execution Time**: ~15-20s
**Coverage**: Use cases, business logic orchestration

```bash
./gradlew :voc-application:test --parallel
```

**Test Classes**:
- `UserServiceTest` (14 tests)
- `AnalyzeVocServiceTest` (10 tests)
- `EmailTemplateServiceTest` (8 tests)
- `SendEmailServiceTest` (12 tests)
- `CreateTemplateServiceTest` (6 tests)
- `LogAnalysisServiceTest` (9 tests)

**Dependency**: None (uses mocks)

---

### Group C: Adapter Unit Tests (Parallel) - P1
**Execution Time**: ~10-15s
**Coverage**: Controllers, repositories (mocked), external adapters

```bash
./gradlew :voc-adapter:test --tests "*Test" --parallel
```

**Test Classes**:
- `LogSearchMapperTest` (8 tests)
- `OpenSearchAdapterTest` (12 tests)
- `OllamaAdapterTest` (10 tests)
- `EmbeddingServiceTest` (8 tests)
- `VectorSearchAdapterTest` (9 tests)
- `VectorEmbeddingEntityTest` (5 tests)

**Dependency**: None (uses mocks)

---

### Group D: Integration Tests (Sequential) - P1
**Execution Time**: ~2-3 minutes
**Coverage**: Database, OpenSearch, Redis integration

```bash
# Run sequentially to avoid resource conflicts
./gradlew :voc-adapter:test --tests "*IntegrationTest"
./gradlew :voc-bootstrap:test
```

**Test Classes**:
- `OpenSearchAdapterIntegrationTest` (8 tests, ~45s)
- `UserRepositoryTest` (12 tests, ~15s)
- `VocRepositoryTest` (18 tests, ~20s)
- `CategoryRepositoryTest` (10 tests, ~12s)
- `EmailLogRepositoryTest` (8 tests, ~10s)
- `CacheServiceTest` (6 tests, ~10s)

**Dependency**: Docker (Testcontainers)

**Containers Used**:
- PostgreSQL 15-alpine (512MB)
- OpenSearch 2.11.0 (512MB)
- Redis alpine (128MB)

---

### Optimized Backend Execution Plan

#### Fast Feedback (Pre-commit) - 30-40s
```bash
# Run Groups A + B in parallel
./gradlew :voc-domain:test :voc-application:test --parallel
```

#### Full Unit Tests (Pre-push) - 45-60s
```bash
# Run Groups A + B + C in parallel
./gradlew :voc-domain:test :voc-application:test :voc-adapter:test --tests "*Test" --parallel
```

#### Full Suite (CI/CD) - 3-4 minutes
```bash
# Run all tests (unit + integration)
./gradlew clean build jacocoRootReport
```

---

## 2. Frontend Test Groups

### Group E: Component Tests (Parallel) - P0
**Execution Time**: ~3-5s
**Coverage**: React components (isolated)

```bash
npm run test -- src/components/**/__tests__
```

**Test Files**:
- `KpiCard.test.tsx` (6 tests, ~1s)
- `PriorityChart.test.tsx` (7 tests, ~1s)
- `RecentVocList.test.tsx` (5 tests, ~1s)
- `SimilarVocCard.test.tsx` (6 tests, ~1s)
- `VocStatusTimeline.test.tsx` (6 tests, ~1s)

**Dependency**: None (Jest runs in parallel)

---

### Group F: Hook Tests (Parallel) - P0
**Execution Time**: ~2-3s
**Coverage**: React hooks, data fetching

```bash
npm run test -- src/hooks/__tests__
```

**Test Files**:
- `useStatistics.test.ts` (5 tests, ~1s)
- `useSimilarVocs.test.ts` (7 tests, ~1s)
- `useVocStatus.test.ts` (6 tests, ~1s)

**Dependency**: None (Jest runs in parallel)

---

### Optimized Frontend Unit Test Execution

#### Fast Feedback (Pre-commit) - 5-8s
```bash
npm run test
```

#### With Coverage (Pre-push) - 10-15s
```bash
npm run test:coverage
```

---

## 3. E2E Test Groups

### Group G: Authentication Setup (Sequential) - P0
**Execution Time**: ~45s
**Coverage**: Auth state creation

```bash
npm run test:e2e:auth
```

**Test Suites**:
- `auth/login.spec.ts` (12 tests)
- `setup/auth.setup.ts` (setup project)

**Dependency**: Backend running on localhost:8080
**Must Run**: Before any authenticated E2E tests

---

### Group H: Critical User Flows (Parallel - Chromium) - P0
**Execution Time**: ~90s (parallelized)
**Coverage**: Key user journeys

```bash
# Run these in parallel for fast feedback
npm run test:e2e:chromium -- \
  e2e/voc/voc-input.spec.ts \
  e2e/voc/voc-detail.spec.ts \
  e2e/voc/voc-status.spec.ts \
  e2e/dashboard/dashboard.spec.ts
```

**Test Suites**:
- `voc-input.spec.ts` (14 tests, ~35s)
- `voc-detail.spec.ts` (17 tests, ~65s)
- `voc-status.spec.ts` (11 tests, ~30s)
- `dashboard.spec.ts` (15 tests, ~45s)

**Total Sequential Time**: ~175s
**Parallelized Time**: ~90s (fastest suite dominates)

**Dependency**: Group G (auth setup)

---

### Group I: Complex Interactions (Sequential - Chromium) - P1
**Execution Time**: ~55s
**Coverage**: Drag-drop, complex UI interactions

```bash
npm run test:e2e:chromium -- e2e/voc/voc-kanban.spec.ts
```

**Test Suites**:
- `voc-kanban.spec.ts` (17 tests, ~55s)

**Why Sequential**: Drag-drop tests can be flaky when parallelized

**Dependency**: Group G (auth setup)

---

### Group J: Table & Similar VOC (Parallel - Chromium) - P1
**Execution Time**: ~65s (parallelized)
**Coverage**: Data-heavy views

```bash
npm run test:e2e:chromium -- \
  e2e/voc/voc-table.spec.ts \
  e2e/voc/similar-voc.spec.ts
```

**Test Suites**:
- `voc-table.spec.ts` (21 tests, ~60s)
- `similar-voc.spec.ts` (18 tests, ~60s)

**Total Sequential Time**: ~120s
**Parallelized Time**: ~65s

**Dependency**: Group G (auth setup)

---

### Group K: Admin Features (Parallel - Chromium) - P1
**Execution Time**: ~90s (parallelized)
**Coverage**: Admin pages

```bash
npm run test:e2e:chromium -- e2e/admin/
```

**Test Suites**:
- `admin/category.spec.ts` (12 tests, ~50s)
- `admin/user.spec.ts` (15 tests, ~60s)

**Dependency**: Group G (auth setup)

---

### Group L: Email & Low Priority (Parallel - Chromium) - P2
**Execution Time**: ~35s
**Coverage**: Email templates

```bash
npm run test:e2e:chromium -- e2e/email/
```

**Test Suites**:
- `email/email.spec.ts` (10 tests, ~35s)

**Dependency**: Group G (auth setup)

---

### Group M: Cross-Browser Tests (Parallel - All Browsers) - P1
**Execution Time**: ~180s (3 browsers in parallel)
**Coverage**: Browser compatibility

```bash
# Run key tests on Firefox and WebKit
npm run test:e2e -- \
  --project=firefox \
  --project=webkit \
  e2e/voc/voc-input.spec.ts \
  e2e/voc/voc-detail.spec.ts \
  e2e/voc/voc-table.spec.ts
```

**Browsers**: Firefox, WebKit (Chromium tested in other groups)

**Dependency**: Group G (auth setup)

---

### Optimized E2E Execution Plans

#### Fast Feedback (Pre-push) - 2-3 minutes
```bash
# 1. Auth setup (sequential)
npm run test:e2e:auth

# 2. Critical flows (parallel)
npm run test:e2e:chromium -- \
  e2e/voc/voc-input.spec.ts \
  e2e/voc/voc-detail.spec.ts \
  e2e/dashboard/dashboard.spec.ts
```

**Total Time**: ~135s (45s + 90s)

---

#### Full Chromium Suite (CI/CD) - 5-6 minutes
```bash
# Run all groups sequentially on Chromium
npm run test:e2e:chromium
```

**Execution Order**:
1. Group G: Auth setup (~45s)
2. Group H: Critical flows (~90s, parallel)
3. Group I: Kanban (~55s)
4. Group J: Table & Similar (~65s, parallel)
5. Group K: Admin (~90s, parallel)
6. Group L: Email (~35s)

**Total Time**: ~380s (~6.5 minutes)

**Optimization**: Use Playwright sharding
```bash
npm run test:e2e:chromium -- --shard=1/4
npm run test:e2e:chromium -- --shard=2/4
npm run test:e2e:chromium -- --shard=3/4
npm run test:e2e:chromium -- --shard=4/4
```

**Sharded Time**: ~95s per shard (4x speedup)

---

#### Full Cross-Browser Suite (Nightly) - 15-20 minutes
```bash
# Run all tests on all browsers
npm run test:e2e
```

**Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

**Total Time**: ~6.5 minutes × 5 browsers = ~32 minutes
**With Parallelization**: ~8-10 minutes (CI with 4 workers)

---

## 4. Combined Execution Strategies

### Strategy 1: Pre-commit (Fast) - 1 minute
```bash
# Terminal 1: Backend fast tests
./gradlew :voc-domain:test :voc-application:test --parallel

# Terminal 2: Frontend unit tests
npm run test
```

**Total Time**: ~45s (parallel execution)

---

### Strategy 2: Pre-push (Comprehensive) - 5 minutes
```bash
# Step 1: Backend full unit tests (45-60s)
./gradlew :voc-domain:test :voc-application:test :voc-adapter:test --tests "*Test" --parallel

# Step 2: Frontend unit tests with coverage (10-15s)
npm run test:coverage

# Step 3: Critical E2E tests (2-3 minutes)
npm run test:e2e:auth
npm run test:e2e:chromium -- e2e/voc/voc-input.spec.ts e2e/voc/voc-detail.spec.ts e2e/dashboard/dashboard.spec.ts
```

**Total Time**: ~5 minutes

---

### Strategy 3: CI/CD Pull Request - 12 minutes
```bash
# Job 1: Backend (parallel with Job 2)
./gradlew clean test --parallel
# Time: ~3.5 minutes

# Job 2: Frontend unit tests (parallel with Job 1)
npm run test:coverage
# Time: ~15s

# Job 3: Backend integration tests (after Job 1)
./gradlew :voc-adapter:test --tests "*IntegrationTest"
# Time: ~2.5 minutes

# Job 4: E2E critical tests (parallel with Job 3)
npm run test:e2e:chromium -- e2e/auth e2e/voc/voc-input.spec.ts e2e/voc/voc-detail.spec.ts
# Time: ~2.5 minutes
```

**Total Time**: ~12 minutes (with parallelization)

---

### Strategy 4: Nightly Full Suite - 25 minutes
```bash
# Run everything in parallel using CI pipeline

# Job 1: Backend full suite with coverage
./gradlew clean build jacocoRootReport
# Time: ~4 minutes

# Job 2: Frontend full E2E (sharded 4x)
npm run test:e2e:chromium -- --shard=1/4 (parallel job 1)
npm run test:e2e:chromium -- --shard=2/4 (parallel job 2)
npm run test:e2e:chromium -- --shard=3/4 (parallel job 3)
npm run test:e2e:chromium -- --shard=4/4 (parallel job 4)
# Time: ~2 minutes per shard (parallelized)

# Job 3: Cross-browser tests (subset)
npm run test:e2e -- --project=firefox --project=webkit e2e/voc/
# Time: ~8 minutes
```

**Total Time**: ~12 minutes (with full parallelization)

---

## 5. Dependency Graph

```
Backend Tests:
  Group A (Domain) ──┐
  Group B (Application) ──┼──> Group D (Integration)
  Group C (Adapter Unit) ──┘

Frontend Tests:
  Group E (Components) ──┐
  Group F (Hooks) ──┴──> (No dependencies)

E2E Tests:
  Group G (Auth Setup) ──┬──> Group H (Critical Flows)
                         ├──> Group I (Kanban)
                         ├──> Group J (Table & Similar)
                         ├──> Group K (Admin)
                         ├──> Group L (Email)
                         └──> Group M (Cross-browser)
```

---

## 6. Priority Matrix

| Priority | Group | Type | Execution | Time | Run On |
|----------|-------|------|-----------|------|--------|
| P0 | A | Backend Unit | Parallel | 10s | Pre-commit |
| P0 | B | Backend Unit | Parallel | 20s | Pre-commit |
| P0 | E | Frontend Unit | Parallel | 5s | Pre-commit |
| P0 | F | Frontend Unit | Parallel | 3s | Pre-commit |
| P0 | G | E2E Setup | Sequential | 45s | Pre-push |
| P0 | H | E2E Critical | Parallel | 90s | Pre-push |
| P1 | C | Backend Unit | Parallel | 15s | Pre-push |
| P1 | D | Backend Integration | Sequential | 3min | CI |
| P1 | I | E2E Complex | Sequential | 55s | CI |
| P1 | J | E2E Data | Parallel | 65s | CI |
| P1 | K | E2E Admin | Parallel | 90s | CI |
| P1 | M | E2E Cross-browser | Parallel | 180s | Nightly |
| P2 | L | E2E Email | Parallel | 35s | Nightly |

---

## 7. Resource Requirements

### Local Development
- **CPU**: 4 cores minimum (for parallel execution)
- **RAM**: 8GB minimum (4GB for Docker, 4GB for IDE/tools)
- **Disk**: 20GB free (for Docker images, test artifacts)
- **Docker**: 4GB memory limit for Testcontainers

### CI/CD Runners
- **GitHub Actions**: ubuntu-latest (4 cores, 14GB RAM)
- **Concurrent Jobs**: 4 (parallel matrix builds)
- **Docker Cache**: Enable layer caching for Testcontainers
- **Node Cache**: Cache ~/.npm directory
- **Gradle Cache**: Cache ~/.gradle directory

---

## 8. Quick Command Reference

### Backend
```bash
# Fast feedback (30-40s)
./gradlew :voc-domain:test :voc-application:test --parallel

# Full unit tests (45-60s)
./gradlew test --tests "*Test" --parallel

# Integration tests only (2-3min)
./gradlew test --tests "*IntegrationTest"

# Full suite with coverage (3-4min)
./gradlew clean build jacocoRootReport
```

### Frontend
```bash
# Fast feedback (5-8s)
npm run test

# With coverage (10-15s)
npm run test:coverage

# E2E auth setup (45s)
npm run test:e2e:auth

# E2E critical flows (90s)
npm run test:e2e:chromium -- e2e/voc/voc-input.spec.ts e2e/voc/voc-detail.spec.ts e2e/dashboard/dashboard.spec.ts

# Full E2E suite (5-6min)
npm run test:e2e:chromium

# Full cross-browser (15-20min)
npm run test:e2e
```

---

## 9. Troubleshooting

### Backend Tests Slow
```bash
# Check if running integration tests unintentionally
./gradlew test --tests "*Test" --parallel

# Increase Gradle memory
export GRADLE_OPTS="-Xmx4g"
```

### Frontend Tests Slow
```bash
# Run specific test
npm run test -- --testPathPattern=KpiCard

# Skip coverage (faster)
npm run test -- --coverage=false
```

### E2E Tests Timeout
```bash
# Increase timeout in playwright.config.ts
timeout: 60000 → 120000

# Run in headed mode to debug
npm run test:e2e:headed
```

### Docker Resource Issues
```bash
# Increase Docker memory limit
docker system prune -a
docker volume prune

# Check container status
docker stats
```

---

## Document Control

**Version**: 1.0
**Last Updated**: 2026-01-25
**Owner**: QA Test Planner Agent
