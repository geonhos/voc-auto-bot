package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.CreateCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.dto.CategoryResult;
import com.geonho.vocautobot.application.category.port.in.dto.CreateCategoryCommand;
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
public class CreateCategoryService implements CreateCategoryUseCase {

    private final LoadCategoryPort loadCategoryPort;
    private final SaveCategoryPort saveCategoryPort;

    @Override
    public CategoryResult createCategory(CreateCategoryCommand command) {
        validateDuplicateCode(command.code());

        Category category;
        if (command.parentId() == null) {
            // Create root category
            category = Category.createRoot(
                    command.name(),
                    command.code(),
                    command.description(),
                    command.sortOrder()
            );
        } else {
            // Create child category
            Category parent = loadCategoryPort.loadById(command.parentId())
                    .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "상위 카테고리를 찾을 수 없습니다"));

            if (!parent.isActive()) {
                throw new BusinessException("PARENT_INACTIVE", "상위 카테고리가 비활성 상태입니다");
            }

            category = Category.createChild(
                    command.name(),
                    command.code(),
                    command.description(),
                    command.parentId(),
                    parent.getLevel(),
                    command.sortOrder()
            );
        }

        Category savedCategory = saveCategoryPort.save(category);
        return CategoryResult.from(savedCategory);
    }

    private void validateDuplicateCode(String code) {
        if (loadCategoryPort.existsByCode(code)) {
            throw new BusinessException("CATEGORY_CODE_DUPLICATE", "이미 사용 중인 카테고리 코드입니다");
        }
    }
}
