package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.application.category.port.in.dto.CategoryResult;

import java.util.List;

public interface GetCategoryUseCase {

    CategoryResult getCategoryById(Long categoryId);

    CategoryResult getCategoryByCode(String code);

    List<CategoryResult> getAllCategories();

    List<CategoryResult> getActiveCategories();

    List<CategoryResult> getChildCategories(Long parentId);
}
