export interface Category {
  id: number;
  name: string;
  code: string;
  description?: string;
  parentId?: number;
  level: number;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTree extends Category {
  children: CategoryTree[];
}

export interface CreateCategoryRequest {
  name: string;
  code: string;
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
