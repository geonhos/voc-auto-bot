package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.audit.Audited;
import com.geonho.vocautobot.application.category.port.in.DeleteCategoryUseCase;
import com.geonho.vocautobot.application.category.port.out.CheckCategoryUsagePort;
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
public class DeleteCategoryService implements DeleteCategoryUseCase {

    private final LoadCategoryPort loadCategoryPort;
    private final SaveCategoryPort saveCategoryPort;
    private final CheckCategoryUsagePort checkCategoryUsagePort;

    @Override
    @Audited(action = "DELETE", entityType = "CATEGORY")
    public void deleteCategory(Long categoryId) {
        Category category = loadCategoryPort.loadById(categoryId)
                .orElseThrow(() -> new BusinessException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));

        // Check if has children
        if (loadCategoryPort.existsByParentId(categoryId)) {
            throw new BusinessException("HAS_CHILDREN", "하위 카테고리가 있어 삭제할 수 없습니다");
        }

        // Check if in use by VOC
        if (checkCategoryUsagePort.isCategoryInUse(categoryId)) {
            throw new BusinessException("CATEGORY_IN_USE", "사용 중인 카테고리는 삭제할 수 없습니다");
        }

        saveCategoryPort.deleteById(categoryId);
    }
}
