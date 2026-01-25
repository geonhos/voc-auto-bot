package com.geonho.vocautobot.domain.category;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository {

    Category save(Category category);

    Optional<Category> findById(Long id);

    Optional<Category> findByCode(String code);

    List<Category> findAll();

    List<Category> findByParentId(Long parentId);

    List<Category> findRootCategories();

    List<Category> findByIsActive(boolean isActive);

    boolean existsByCode(String code);

    boolean existsByParentId(Long parentId);

    void deleteById(Long id);

    long count();

    long countByParentId(Long parentId);
}
