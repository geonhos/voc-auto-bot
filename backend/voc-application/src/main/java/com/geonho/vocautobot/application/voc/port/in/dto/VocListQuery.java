package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Query for retrieving VOC list with filtering and pagination
 */
public record VocListQuery(
        VocStatus status,
        VocPriority priority,
        Long categoryId,
        Long assigneeId,
        String customerEmail,
        String search,
        int page,
        int size,
        String sortBy,
        String sortDirection
) {
    public VocListQuery {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
        if (sortBy == null || sortBy.isBlank()) sortBy = "createdAt";
        if (sortDirection == null || sortDirection.isBlank()) sortDirection = "DESC";
    }

    public Pageable toPageable() {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC")
            ? Sort.Direction.ASC
            : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(direction, sortBy));
    }

    public static VocListQuery of(
            VocStatus status,
            VocPriority priority,
            Long categoryId,
            Long assigneeId,
            String customerEmail,
            String search,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        return new VocListQuery(
            status,
            priority,
            categoryId,
            assigneeId,
            customerEmail,
            search,
            page,
            size,
            sortBy,
            sortDirection
        );
    }
}
