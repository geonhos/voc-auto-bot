package com.geonho.vocautobot.domain.category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(Long id);

    List<Category> findAll();

    List<Category> findByType(CategoryType type);

    List<Category> findByParentId(Long parentId);

    List<Category> findActiveCategories();

    void deleteById(Long id);

    boolean existsById(Long id);

    long countByParentId(Long parentId);
}
