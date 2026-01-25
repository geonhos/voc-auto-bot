'use client';

import { useState } from 'react';
import { useCategoryTree, useDeleteCategory } from '@/hooks/useCategories';
import { CategoryTree } from '@/components/category/CategoryTree';
import { CategoryForm } from '@/components/category/CategoryForm';
import type { CategoryTree as CategoryTreeType } from '@/types';

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryTreeType | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryTreeType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: categories = [], isLoading, refetch } = useCategoryTree();
  const deleteMutation = useDeleteCategory();

  const handleSelect = (category: CategoryTreeType) => {
    setSelectedCategory(category);
  };

  const handleAddRoot = () => {
    setSelectedCategory(null);
    setParentCategory(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleAddChild = () => {
    if (!selectedCategory) return;
    setParentCategory(selectedCategory);
    setSelectedCategory(null);
    setIsEditing(false);
    setShowForm(true);
  };

  const handleEdit = () => {
    if (!selectedCategory) return;
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    if (
      confirm(
        `"${selectedCategory.name}" 카테고리를 삭제하시겠습니까?\n\n하위 카테고리가 있는 경우 삭제할 수 없습니다.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(selectedCategory.id);
        setSelectedCategory(null);
      } catch (error) {
        const errorMessage =
          (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
            ?.message || '삭제에 실패했습니다';
        alert(errorMessage);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setParentCategory(null);
    setIsEditing(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
        <p className="mt-1 text-sm text-gray-500">VOC 분류를 위한 카테고리를 관리합니다.</p>
      </div>

      <div className="flex gap-6">
        {/* Category Tree Panel */}
        <div className="flex-1 bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-medium text-gray-900">카테고리 목록</h2>
            <div className="flex gap-2">
              <button
                onClick={handleAddRoot}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 루트 카테고리
              </button>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                새로고침
              </button>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <CategoryTree
                categories={categories}
                onSelect={handleSelect}
                selectedId={selectedCategory?.id}
              />
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-80 bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-medium text-gray-900">상세 정보</h2>
          </div>

          <div className="p-4">
            {selectedCategory ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">카테고리명</label>
                  <p className="text-sm font-medium">{selectedCategory.name}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">코드</label>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {selectedCategory.code}
                  </p>
                </div>
                {selectedCategory.description && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">설명</label>
                    <p className="text-sm">{selectedCategory.description}</p>
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">레벨</label>
                  <p className="text-sm">{selectedCategory.level}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
                  <p className="text-sm">{selectedCategory.sortOrder}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">상태</label>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedCategory.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedCategory.isActive ? '활성' : '비활성'}
                  </span>
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={handleAddChild}
                    className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    하위 카테고리 추가
                  </button>
                  <button
                    onClick={handleEdit}
                    className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-full px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    {deleteMutation.isPending ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                카테고리를 선택해주세요
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={isEditing ? selectedCategory : null}
          parentCategory={parentCategory}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
