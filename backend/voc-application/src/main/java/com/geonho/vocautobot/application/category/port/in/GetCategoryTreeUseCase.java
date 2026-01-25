package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.application.category.port.in.dto.CategoryTreeResult;

import java.util.List;

public interface GetCategoryTreeUseCase {

    List<CategoryTreeResult> getCategoryTree();

    List<CategoryTreeResult> getActiveCategoryTree();
}
