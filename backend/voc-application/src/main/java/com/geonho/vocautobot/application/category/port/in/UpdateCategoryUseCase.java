package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.application.category.port.in.dto.UpdateCategoryCommand;
import com.geonho.vocautobot.application.category.port.in.dto.CategoryResult;

public interface UpdateCategoryUseCase {
    CategoryResult updateCategory(Long categoryId, UpdateCategoryCommand command);
}
