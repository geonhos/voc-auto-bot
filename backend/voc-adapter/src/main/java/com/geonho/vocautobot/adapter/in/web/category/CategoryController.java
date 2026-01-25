package com.geonho.vocautobot.adapter.in.web.category;

import com.geonho.vocautobot.adapter.in.web.category.dto.CategoryResponse;
import com.geonho.vocautobot.adapter.in.web.category.dto.CategoryTreeResponse;
import com.geonho.vocautobot.adapter.in.web.category.dto.CreateCategoryRequest;
import com.geonho.vocautobot.adapter.in.web.category.dto.UpdateCategoryRequest;
import com.geonho.vocautobot.application.category.port.in.CreateCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.DeleteCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.GetCategoryQuery;
import com.geonho.vocautobot.application.category.port.in.UpdateCategoryUseCase;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Category", description = "카테고리 관리 API")
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CreateCategoryUseCase createCategoryUseCase;
    private final UpdateCategoryUseCase updateCategoryUseCase;
    private final DeleteCategoryUseCase deleteCategoryUseCase;
    private final GetCategoryQuery getCategoryQuery;

    @Operation(summary = "카테고리 목록 조회", description = "전체 카테고리 목록을 조회합니다")
    @GetMapping
    public ApiResponse<List<CategoryResponse>> getCategories() {
        List<Category> categories = getCategoryQuery.getAllCategories();
        List<CategoryResponse> response = categories.stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());

        return ApiResponse.success(response);
    }

    @Operation(summary = "카테고리 트리 조회", description = "카테고리를 트리 구조로 조회합니다")
    @GetMapping("/tree")
    public ApiResponse<List<CategoryTreeResponse>> getCategoryTree() {
        List<Category> categoryTree = getCategoryQuery.getCategoryTree();
        List<CategoryTreeResponse> response = CategoryTreeResponse.fromList(categoryTree);

        return ApiResponse.success(response);
    }

    @Operation(summary = "카테고리 상세 조회", description = "ID로 특정 카테고리를 조회합니다")
    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getCategory(@PathVariable Long id) {
        Category category = getCategoryQuery.getCategoryById(id);
        CategoryResponse response = CategoryResponse.from(category);

        return ApiResponse.success(response);
    }

    @Operation(summary = "카테고리 생성", description = "새로운 카테고리를 생성합니다 (ADMIN 권한 필요)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        Category category = createCategoryUseCase.createCategory(request.toCommand());
        CategoryResponse response = CategoryResponse.from(category);

        return ApiResponse.success(response);
    }

    @Operation(summary = "카테고리 수정", description = "기존 카테고리 정보를 수정합니다 (ADMIN 권한 필요)")
    @PutMapping("/{id}")
    public ApiResponse<CategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        Category category = updateCategoryUseCase.updateCategory(request.toCommand(id));
        CategoryResponse response = CategoryResponse.from(category);

        return ApiResponse.success(response);
    }

    @Operation(summary = "카테고리 삭제", description = "카테고리를 삭제합니다 (ADMIN 권한 필요)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        deleteCategoryUseCase.deleteCategory(id);
    }
}
