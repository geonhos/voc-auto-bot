package com.geonho.vocautobot.application.category.port.out;

import com.geonho.vocautobot.domain.category.Category;

public interface SaveCategoryPort {

    Category save(Category category);

    void deleteById(Long id);

    // Alias methods for backwards compatibility
    default Category saveCategory(Category category) {
        return save(category);
    }

    default void deleteCategory(Long id) {
        deleteById(id);
    }
}
