package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.*;
import com.geonho.vocautobot.application.category.port.out.CheckCategoryUsagePort;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.category.port.out.SaveCategoryPort;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CategoryService implements
        CreateCategoryUseCase,
        UpdateCategoryUseCase,
        DeleteCategoryUseCase,
        GetCategoryQuery {

    private final LoadCategoryPort loadCategoryPort;
    private final SaveCategoryPort saveCategoryPort;
    private final CheckCategoryUsagePort checkCategoryUsagePort;

    public CategoryService(
            LoadCategoryPort loadCategoryPort,
            SaveCategoryPort saveCategoryPort,
            CheckCategoryUsagePort checkCategoryUsagePort) {
        this.loadCategoryPort = loadCategoryPort;
        this.saveCategoryPort = saveCategoryPort;
        this.checkCategoryUsagePort = checkCategoryUsagePort;
    }

    @Override
    @Transactional
    public Category createCategory(CreateCategoryCommand command) {
        if (command.getType() == CategoryType.SUB && command.getParentId() != null) {
            Category parent = loadCategoryPort.loadCategoryById(command.getParentId())
                    .orElseThrow(() -> new IllegalArgumentException("상위 카테고리를 찾을 수 없습니다"));

            if (!parent.isActive()) {
                throw new IllegalArgumentException("상위 카테고리가 비활성 상태입니다");
            }
        }

        Category category = Category.create(
                command.getName(),
                command.getType(),
                command.getParentId(),
                command.getDescription(),
                command.getSortOrder()
        );

        return saveCategoryPort.saveCategory(category);
    }

    @Override
    @Transactional
    public Category updateCategory(UpdateCategoryCommand command) {
        Category category = loadCategoryPort.loadCategoryById(command.getId())
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

        category.update(
                command.getName(),
                command.getDescription(),
                command.isActive(),
                command.getSortOrder()
        );

        return saveCategoryPort.saveCategory(category);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = loadCategoryPort.loadCategoryById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

        if (checkCategoryUsagePort.hasChildren(id)) {
            throw new IllegalArgumentException("하위 카테고리가 있어 삭제할 수 없습니다");
        }

        if (checkCategoryUsagePort.isCategoryInUse(id)) {
            throw new IllegalArgumentException("사용 중인 카테고리는 삭제할 수 없습니다");
        }

        saveCategoryPort.deleteCategory(id);
    }

    @Override
    public Category getCategoryById(Long id) {
        return loadCategoryPort.loadCategoryById(id)
                .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));
    }

    @Override
    public List<Category> getAllCategories() {
        return loadCategoryPort.loadAllCategories();
    }

    @Override
    public List<Category> getCategoriesByType(CategoryType type) {
        return loadCategoryPort.loadCategoriesByType(type);
    }

    @Override
    public List<Category> getCategoryTree() {
        return loadCategoryPort.loadCategoryTree();
    }

    @Override
    public List<Category> getActiveCategories() {
        return loadCategoryPort.loadActiveCategories();
    }
}
