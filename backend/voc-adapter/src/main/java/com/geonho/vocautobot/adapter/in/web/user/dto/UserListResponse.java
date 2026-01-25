package com.geonho.vocautobot.adapter.in.web.user.dto;

import com.geonho.vocautobot.domain.user.entity.User;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;

@Schema(description = "사용자 목록 응답")
public record UserListResponse(

        @Schema(description = "사용자 목록")
        List<UserResponse> users,

        @Schema(description = "현재 페이지", example = "0")
        int page,

        @Schema(description = "페이지 크기", example = "20")
        int size,

        @Schema(description = "전체 요소 수", example = "100")
        long totalElements,

        @Schema(description = "전체 페이지 수", example = "5")
        int totalPages
) {
    public static UserListResponse from(Page<User> userPage) {
        List<UserResponse> users = userPage.getContent().stream()
                .map(UserResponse::from)
                .toList();

        return new UserListResponse(
                users,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages()
        );
    }
}
