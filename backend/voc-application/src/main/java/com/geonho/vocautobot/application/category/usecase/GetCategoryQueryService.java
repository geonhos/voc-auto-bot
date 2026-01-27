package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.GetCategoryQuery;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryQueryService implements GetCategoryQuery {

    private final LoadCategoryPort loadCategoryPort;

    @Override
    public Category getCategoryById(Long id) {
        return loadCategoryPort.loadById(id)
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다: " + id));
    }

    @Override
    public List<Category> getAllCategories() {
        return loadCategoryPort.loadAll();
    }

    @Override
    public List<Category> getCategoriesByType(CategoryType type) {
        return loadCategoryPort.loadCategoriesByType(type);
    }

    @Override
    public List<Category> getCategoryTree() {
        // Get all main categories (parent = null) and build tree structure
        List<Category> allCategories = loadCategoryPort.loadAll();

        // Return only root categories (parent = null), children are already attached
        return allCategories.stream()
                .filter(c -> c.getParentId() == null)
                .collect(Collectors.toList());
    }

    @Override
    public List<Category> getActiveCategories() {
        return loadCategoryPort.loadByIsActive(true);
    }
}
