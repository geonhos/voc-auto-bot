package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.UpdateCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.dto.CategoryResult;
import com.geonho.vocautobot.application.category.port.in.dto.UpdateCategoryCommand;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.category.port.out.SaveCategoryPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.common.exception.BusinessException;
import com.geonho.vocautobot.domain.category.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@UseCase
@RequiredArgsConstructor
@Transactional
public class UpdateCategoryService implements UpdateCategoryUseCase {

    private final LoadCategoryPort loadCategoryPort;
    private final SaveCategoryPort saveCategoryPort;

    @Override
    public CategoryResult updateCategory(Long categoryId, UpdateCategoryCommand command) {
        Category category = loadCategoryPort.loadById(categoryId)
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));

        if (command.name() != null || command.description() != null) {
            String name = command.name() != null ? command.name() : category.getName();
            String description = command.description() != null ? command.description() : category.getDescription();
            category.updateInfo(name, description);
        }

        if (command.sortOrder() != null) {
            category.updateSortOrder(command.sortOrder());
        }

        if (command.isActive() != null) {
            if (command.isActive()) {
                // When activating, check if parent is active
                if (category.getParentId() != null) {
                    Category parent = loadCategoryPort.loadById(category.getParentId())
                            .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "상위 카테고리를 찾을 수 없습니다"));
                    if (!parent.isActive()) {
                        throw new BusinessException("PARENT_INACTIVE", "상위 카테고리가 비활성 상태입니다");
                    }
                }
                category.activate();
            } else {
                category.deactivate();
            }
        }

        Category savedCategory = saveCategoryPort.save(category);
        return CategoryResult.from(savedCategory);
    }
}
