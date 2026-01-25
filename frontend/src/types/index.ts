export * from './auth';
export * from './user';
export * from './category';
export * from './voc';
export * from './vocForm';
export * from './email';
export * from './statistics';

// Common types
export interface PageParams {
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
