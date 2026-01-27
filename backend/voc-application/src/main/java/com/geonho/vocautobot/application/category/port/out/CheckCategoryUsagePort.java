package com.geonho.vocautobot.application.category.port.out;

public interface CheckCategoryUsagePort {

    boolean isCategoryInUse(Long categoryId);

    default boolean hasChildren(Long categoryId) {
        // This should be implemented by the adapter
        return false;
    }
}
