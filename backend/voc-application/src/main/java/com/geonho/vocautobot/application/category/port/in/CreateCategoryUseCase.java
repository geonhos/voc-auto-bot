package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.application.category.port.in.dto.CreateCategoryCommand;
import com.geonho.vocautobot.application.category.port.in.dto.CategoryResult;

public interface CreateCategoryUseCase {
    CategoryResult createCategory(CreateCategoryCommand command);
}
