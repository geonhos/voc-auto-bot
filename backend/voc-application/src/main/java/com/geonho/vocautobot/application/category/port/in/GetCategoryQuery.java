package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;

import java.util.List;

public interface GetCategoryQuery {

    Category getCategoryById(Long id);

    List<Category> getAllCategories();

    List<Category> getCategoriesByType(CategoryType type);

    List<Category> getCategoryTree();

    List<Category> getActiveCategories();
}
