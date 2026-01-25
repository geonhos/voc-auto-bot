package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.domain.category.Category;

public interface CreateCategoryUseCase {

    Category createCategory(CreateCategoryCommand command);
}
