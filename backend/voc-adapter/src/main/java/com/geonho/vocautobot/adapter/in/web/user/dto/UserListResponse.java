package com.geonho.vocautobot.adapter.in.web.user.dto;

import com.geonho.vocautobot.domain.user.User;
import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;

@Schema(description = "사용자 목록 응답")
public record UserListResponse(

        @Schema(description = "사용자 목록")
        List<UserResponse> content,

        @Schema(description = "현재 페이지", example = "0")
        int page,

        @Schema(description = "페이지 크기", example = "20")
        int size,

        @Schema(description = "전체 요소 수", example = "100")
        long totalElements,

        @Schema(description = "전체 페이지 수", example = "5")
        int totalPages,

        @Schema(description = "첫 페이지 여부")
        boolean first,

        @Schema(description = "마지막 페이지 여부")
        boolean last,

        @Schema(description = "빈 페이지 여부")
        boolean empty
) {
    public static UserListResponse from(Page<User> userPage) {
        List<UserResponse> content = userPage.getContent().stream()
                .map(UserResponse::from)
                .toList();

        return new UserListResponse(
                content,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isFirst(),
                userPage.isLast(),
                userPage.isEmpty()
        );
    }
}
