/**
 * @description Central export for E2E test fixtures
 * Import from this file to access test fixtures and custom matchers
 */

export { test, expect, customExpect } from './test-fixtures';
export type { TestFixtures } from './test-fixtures';
export {
  testCategories,
  testAssignees,
  createVocFormData,
  testVocs,
  testSimilarVocs,
  statusLookupData,
  testFiles,
  kanbanColumns,
  pageResponseMock,
} from './voc-data';

// Mock Factory exports
export {
  createMockUser,
  createMockAssignee,
  createMockUserInfo,
  createMockAuthResponse,
  createMockCategory,
  createMockCategories,
  createMockAttachment,
  createMockMemo,
  createMockAiAnalysis,
  createMockVoc,
  createMockVocs,
  createMockSimilarVoc,
  createMockKpiChange,
  createMockKpiData,
  createMockTrendData,
  createMockTrendDataArray,
  createMockCategoryStats,
  createMockCategoryStatsArray,
  createMockStatusDistribution,
  createMockStatusDistributionArray,
  createMockDashboardStats,
  createMockApiResponse,
  createMockPageResponse,
} from './mock-factory';
