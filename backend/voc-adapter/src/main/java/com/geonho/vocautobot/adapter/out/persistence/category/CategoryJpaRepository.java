package com.geonho.vocautobot.adapter.out.persistence.category;

import com.geonho.vocautobot.domain.category.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CategoryJpaRepository extends JpaRepository<CategoryJpaEntity, Long> {

    List<CategoryJpaEntity> findByType(CategoryType type);

    List<CategoryJpaEntity> findByParentId(Long parentId);

    List<CategoryJpaEntity> findByIsActiveTrue();

    long countByParentId(Long parentId);

    @Query("SELECT c FROM CategoryJpaEntity c WHERE c.parentId IS NULL ORDER BY c.sortOrder")
    List<CategoryJpaEntity> findMainCategories();

    @Query("SELECT c FROM CategoryJpaEntity c LEFT JOIN FETCH c.children WHERE c.type = 'MAIN' ORDER BY c.sortOrder")
    List<CategoryJpaEntity> findCategoryTreeWithChildren();
}
