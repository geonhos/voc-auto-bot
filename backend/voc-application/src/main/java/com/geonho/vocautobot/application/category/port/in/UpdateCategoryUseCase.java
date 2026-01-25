package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.domain.category.Category;

public interface UpdateCategoryUseCase {

    Category updateCategory(UpdateCategoryCommand command);
}
