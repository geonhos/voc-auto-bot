package com.geonho.vocautobot.application.category.port.in.dto;

public record CategorySuggestionResult(
        Long categoryId,
        String categoryName,
        String categoryCode,
        Double confidence,
        String reason
) {}
