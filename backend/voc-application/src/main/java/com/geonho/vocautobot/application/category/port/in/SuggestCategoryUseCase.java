package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.application.category.port.in.dto.CategorySuggestionResult;

import java.util.List;

public interface SuggestCategoryUseCase {

    List<CategorySuggestionResult> suggestCategories(String title, String content);
}
