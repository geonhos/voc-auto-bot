package com.geonho.vocautobot.adapter.out.persistence.category;

import com.geonho.vocautobot.application.category.port.out.CheckCategoryUsagePort;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.category.port.out.SaveCategoryPort;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class CategoryPersistenceAdapter implements
        LoadCategoryPort,
        SaveCategoryPort,
        CheckCategoryUsagePort {

    private final CategoryJpaRepository categoryJpaRepository;
    private final CategoryMapper categoryMapper;

    public CategoryPersistenceAdapter(
            CategoryJpaRepository categoryJpaRepository,
            CategoryMapper categoryMapper) {
        this.categoryJpaRepository = categoryJpaRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    public Optional<Category> loadCategoryById(Long id) {
        return categoryJpaRepository.findById(id)
                .map(categoryMapper::toDomain);
    }

    @Override
    public List<Category> loadAllCategories() {
        List<CategoryJpaEntity> entities = categoryJpaRepository.findAll();
        return categoryMapper.toDomainList(entities);
    }

    @Override
    public List<Category> loadCategoriesByType(CategoryType type) {
        List<CategoryJpaEntity> entities = categoryJpaRepository.findByType(type);
        return categoryMapper.toDomainList(entities);
    }

    @Override
    public List<Category> loadCategoriesByParentId(Long parentId) {
        List<CategoryJpaEntity> entities = categoryJpaRepository.findByParentId(parentId);
        return categoryMapper.toDomainList(entities);
    }

    @Override
    public List<Category> loadActiveCategories() {
        List<CategoryJpaEntity> entities = categoryJpaRepository.findByIsActiveTrue();
        return categoryMapper.toDomainList(entities);
    }

    @Override
    public List<Category> loadCategoryTree() {
        List<CategoryJpaEntity> mainCategories = categoryJpaRepository.findCategoryTreeWithChildren();
        return categoryMapper.toDomainList(mainCategories);
    }

    @Override
    public Category saveCategory(Category category) {
        CategoryJpaEntity entity;

        if (category.getId() != null) {
            entity = categoryJpaRepository.findById(category.getId())
                    .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));
            entity.update(
                    category.getName(),
                    category.getDescription(),
                    category.isActive(),
                    category.getSortOrder()
            );
        } else {
            entity = categoryMapper.toEntity(category);
        }

        CategoryJpaEntity savedEntity = categoryJpaRepository.save(entity);
        return categoryMapper.toDomain(savedEntity);
    }

    @Override
    public void deleteCategory(Long id) {
        categoryJpaRepository.deleteById(id);
    }

    @Override
    public boolean isCategoryInUse(Long categoryId) {
        // VOC에서 사용 중인지 확인하는 로직은 추후 VOC 엔티티 구현 후 추가
        // 현재는 간단히 false 반환
        return false;
    }

    @Override
    public long countVocsByCategory(Long categoryId) {
        // VOC 엔티티 구현 후 실제 카운트 로직 추가
        return 0L;
    }

    @Override
    public boolean hasChildren(Long categoryId) {
        return categoryJpaRepository.countByParentId(categoryId) > 0;
    }
}
