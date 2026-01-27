package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.GetCategoryQuery;
import com.geonho.vocautobot.application.category.port.in.GetCategoryUseCase;
import com.geonho.vocautobot.domain.category.CategoryType;
import com.geonho.vocautobot.application.category.port.in.dto.CategoryResult;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.domain.category.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryService implements GetCategoryUseCase {

    private final LoadCategoryPort loadCategoryPort;

    @Override
    public CategoryResult getCategoryById(Long categoryId) {
        Category category = loadCategoryPort.loadById(categoryId)
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));
        return CategoryResult.from(category);
    }

    @Override
    public CategoryResult getCategoryByCode(String code) {
        Category category = loadCategoryPort.loadByCode(code)
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));
        return CategoryResult.from(category);
    }

    @Override
    public List<CategoryResult> getAllCategories() {
        return loadCategoryPort.loadAll().stream()
                .map(CategoryResult::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResult> getActiveCategories() {
        return loadCategoryPort.loadByIsActive(true).stream()
                .map(CategoryResult::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResult> getChildCategories(Long parentId) {
        return loadCategoryPort.loadByParentId(parentId).stream()
                .map(CategoryResult::from)
                .collect(Collectors.toList());
    }
}
