export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number | null;
  level: number | null;
  type?: 'MAIN' | 'SUB';
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree {
  id: number;
  name: string;
  code?: string;
  type?: 'MAIN' | 'SUB';
  isActive: boolean;
  sortOrder: number;
  children?: CategoryTree[];
  level?: number | null;
  description?: string;
  parentId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
  type: 'MAIN' | 'SUB';
  description?: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}
