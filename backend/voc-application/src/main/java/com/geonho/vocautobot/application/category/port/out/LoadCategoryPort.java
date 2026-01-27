package com.geonho.vocautobot.application.category.port.out;

import com.geonho.vocautobot.domain.category.Category;

import java.util.List;
import java.util.Optional;

public interface LoadCategoryPort {

    Optional<Category> loadById(Long id);

    Optional<Category> loadByCode(String code);

    List<Category> loadAll();

    List<Category> loadByParentId(Long parentId);

    List<Category> loadRootCategories();

    List<Category> loadByIsActive(boolean isActive);

    boolean existsByCode(String code);

    boolean existsByParentId(Long parentId);

    long countByParentId(Long parentId);

    // Alias methods for backwards compatibility
    default Optional<Category> loadCategoryById(Long id) {
        return loadById(id);
    }

    default List<Category> loadCategoryTree() {
        return loadRootCategories();
    }

    default List<Category> loadAllCategories() {
        return loadAll();
    }

    default List<Category> loadActiveCategories() {
        return loadByIsActive(true);
    }

    default List<Category> loadCategoriesByType(com.geonho.vocautobot.domain.category.CategoryType type) {
        return loadAll().stream()
                .filter(c -> c.getType() == type)
                .toList();
    }
}
