package com.geonho.vocautobot.application.category.usecase;

import com.geonho.vocautobot.application.category.port.in.GetCategoryTreeUseCase;
import com.geonho.vocautobot.application.category.port.in.dto.CategoryTreeResult;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.domain.category.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryTreeService implements GetCategoryTreeUseCase {

    private final LoadCategoryPort loadCategoryPort;

    @Override
    public List<CategoryTreeResult> getCategoryTree() {
        List<Category> allCategories = loadCategoryPort.loadAll();
        return buildTree(allCategories);
    }

    @Override
    public List<CategoryTreeResult> getActiveCategoryTree() {
        List<Category> activeCategories = loadCategoryPort.loadByIsActive(true);
        return buildTree(activeCategories);
    }

    private List<CategoryTreeResult> buildTree(List<Category> categories) {
        // Group by parent ID
        Map<Long, List<Category>> categoryMap = categories.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getParentId() != null ? c.getParentId() : 0L
                ));

        // Get root categories and build tree recursively
        List<Category> roots = categoryMap.getOrDefault(0L, List.of());

        return roots.stream()
                .sorted(Comparator.comparingInt(Category::getSortOrder))
                .map(root -> buildTreeNode(root, categoryMap))
                .map(CategoryTreeResult::from)
                .collect(Collectors.toList());
    }

    private Category buildTreeNode(Category category, Map<Long, List<Category>> categoryMap) {
        List<Category> children = categoryMap.getOrDefault(category.getId(), List.of());

        children.stream()
                .sorted(Comparator.comparingInt(Category::getSortOrder))
                .forEach(child -> {
                    Category childWithChildren = buildTreeNode(child, categoryMap);
                    category.addChild(childWithChildren);
                });

        return category;
    }
}
