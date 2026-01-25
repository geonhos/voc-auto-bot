package com.geonho.vocautobot.adapter.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final T data;
    private final ErrorInfo error;
    private final Meta meta;

    @Getter
    @Builder
    public static class ErrorInfo {
        private final String code;
        private final String message;
        private final Object details;
    }

    @Getter
    @Builder
    public static class Meta {
        private final Instant timestamp;
        private final Integer page;
        private final Integer size;
        private final Long totalElements;
        private final Integer totalPages;
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .meta(Meta.builder().timestamp(Instant.now()).build())
                .build();
    }

    public static <T> ApiResponse<T> success(T data, int page, int size, long totalElements, int totalPages) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .meta(Meta.builder()
                        .timestamp(Instant.now())
                        .page(page)
                        .size(size)
                        .totalElements(totalElements)
                        .totalPages(totalPages)
                        .build())
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorInfo.builder()
                        .code(code)
                        .message(message)
                        .build())
                .meta(Meta.builder().timestamp(Instant.now()).build())
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorInfo.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .meta(Meta.builder().timestamp(Instant.now()).build())
                .build();
    }
}
